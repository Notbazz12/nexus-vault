//! Encrypted local vault on SQLite.
//!
//! Records are opaque JSON blobs owned by the frontend; this module only encrypts,
//! stores and authenticates them. Layout follows CRYPTO_FORMAT_SPEC.md:
//! master password --Argon2id--> KEK --wraps--> DEK --encrypts--> records.

use std::path::Path;

use rand_core::{OsRng, RngCore};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use zeroize::Zeroizing;

use crate::crypto::{
    decrypt_dek, decrypt_payload, derive_kek, encrypt_dek, encrypt_payload, generate_dek,
    DomainSeparator, KdfParams, MasterPassword, KEY_SIZE, SALT_SIZE,
};
use crate::error::CryptoError;

const RECORD_KINDS: [&str; 3] = ["item", "folder", "settings"];

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Record {
    pub id: String,
    pub kind: String,
    pub json: String,
}

#[derive(Serialize, Deserialize)]
struct StoredKdf {
    memory_kib: u32,
    iterations: u32,
    parallelism: u32,
}

pub struct Vault {
    conn: Connection,
    dek: Option<Zeroizing<[u8; KEY_SIZE]>>,
    kdf: KdfParams,
}

fn storage(e: rusqlite::Error) -> CryptoError {
    CryptoError::Storage(e.to_string())
}

fn domain_for(kind: &str) -> Result<DomainSeparator, CryptoError> {
    match kind {
        "item" | "settings" => Ok(DomainSeparator::VaultItem),
        "folder" => Ok(DomainSeparator::Folder),
        _ => Err(CryptoError::InvalidRecordKind),
    }
}

/// AAD context binds both kind and id, so a blob cannot be moved to another row or kind.
fn context(kind: &str, id: &str) -> Vec<u8> {
    format!("{kind}:{id}").into_bytes()
}

impl Vault {
    pub fn open(path: &Path) -> Result<Self, CryptoError> {
        Self::open_with_kdf(path, KdfParams::default())
    }

    /// `kdf` only applies when the vault is created; existing vaults use their stored params.
    pub fn open_with_kdf(path: &Path, kdf: KdfParams) -> Result<Self, CryptoError> {
        let conn = Connection::open(path).map_err(storage)?;
        conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA secure_delete = ON;
             CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value BLOB NOT NULL);
             CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, kind TEXT NOT NULL, blob BLOB NOT NULL);",
        )
        .map_err(storage)?;
        Ok(Self { conn, dek: None, kdf })
    }

    fn meta(&self, key: &str) -> Result<Option<Vec<u8>>, CryptoError> {
        self.conn
            .query_row("SELECT value FROM meta WHERE key = ?1", [key], |r| r.get(0))
            .optional()
            .map_err(storage)
    }

    fn require_meta(&self, key: &str) -> Result<Vec<u8>, CryptoError> {
        self.meta(key)?.ok_or(CryptoError::NotInitialized)
    }

    fn stored_kdf(&self) -> Result<KdfParams, CryptoError> {
        let raw = self.require_meta("kdf_params")?;
        let k: StoredKdf = serde_json::from_slice(&raw).map_err(|_| CryptoError::SerializationError)?;
        let params = KdfParams { memory_kib: k.memory_kib, iterations: k.iterations, parallelism: k.parallelism };
        params.validate()?;
        Ok(params)
    }

    fn dek(&self) -> Result<&[u8; KEY_SIZE], CryptoError> {
        self.dek.as_deref().ok_or(CryptoError::VaultLocked)
    }

    /// Writes salt, KDF params and the DEK wrapped under a KEK derived from `password`.
    fn write_key_envelope(
        tx: &rusqlite::Transaction,
        password: &MasterPassword,
        params: &KdfParams,
        dek: &[u8; KEY_SIZE],
    ) -> Result<(), CryptoError> {
        let mut salt = [0u8; SALT_SIZE];
        OsRng.fill_bytes(&mut salt);
        let kek = derive_kek(password, &salt, params)?;
        let wrapped = encrypt_dek(&kek, dek)?;
        let kdf_json = serde_json::to_vec(&StoredKdf {
            memory_kib: params.memory_kib,
            iterations: params.iterations,
            parallelism: params.parallelism,
        })
        .map_err(|_| CryptoError::SerializationError)?;
        for (k, v) in [("salt", &salt[..]), ("kdf_params", &kdf_json[..]), ("wrapped_dek", &wrapped[..])] {
            tx.execute("INSERT OR REPLACE INTO meta (key, value) VALUES (?1, ?2)", params![k, v])
                .map_err(storage)?;
        }
        Ok(())
    }

    pub fn is_initialized(&self) -> Result<bool, CryptoError> {
        Ok(self.meta("wrapped_dek")?.is_some())
    }

    pub fn is_unlocked(&self) -> bool {
        self.dek.is_some()
    }

    pub fn create(&mut self, password: &MasterPassword) -> Result<(), CryptoError> {
        if self.is_initialized()? {
            return Err(CryptoError::AlreadyInitialized);
        }
        let dek = generate_dek();
        let tx = self.conn.transaction().map_err(storage)?;
        Self::write_key_envelope(&tx, password, &self.kdf, &dek)?;
        tx.execute("INSERT INTO meta (key, value) VALUES ('format_version', ?1)", [vec![crate::crypto::CURRENT_FORMAT_VERSION]])
            .map_err(storage)?;
        tx.commit().map_err(storage)?;
        self.dek = Some(dek);
        Ok(())
    }

    pub fn unlock(&mut self, password: &MasterPassword) -> Result<(), CryptoError> {
        let salt = self.require_meta("salt")?;
        let wrapped = self.require_meta("wrapped_dek")?;
        let kek = derive_kek(password, &salt, &self.stored_kdf()?)?;
        self.dek = Some(decrypt_dek(&kek, &wrapped)?);
        Ok(())
    }

    pub fn lock(&mut self) {
        self.dek = None; // Zeroizing wipes the key on drop
    }

    /// Re-wraps the existing DEK under a new password; records are untouched (spec §7).
    pub fn change_password(&mut self, old: &MasterPassword, new: &MasterPassword) -> Result<(), CryptoError> {
        self.unlock(old)?;
        let dek = self.dek.clone().ok_or(CryptoError::VaultLocked)?;
        let params = self.stored_kdf()?;
        let tx = self.conn.transaction().map_err(storage)?;
        Self::write_key_envelope(&tx, new, &params, &dek)?;
        tx.commit().map_err(storage)
    }

    pub fn list(&self) -> Result<Vec<Record>, CryptoError> {
        let dek = self.dek()?;
        let mut stmt = self.conn.prepare("SELECT id, kind, blob FROM records").map_err(storage)?;
        let rows = stmt
            .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?, r.get::<_, Vec<u8>>(2)?)))
            .map_err(storage)?;
        let mut out = Vec::new();
        for row in rows {
            let (id, kind, blob) = row.map_err(storage)?;
            let plain = decrypt_payload(dek, domain_for(&kind)?, &context(&kind, &id), &blob)?;
            let json = String::from_utf8(plain.to_vec()).map_err(|_| CryptoError::SerializationError)?;
            out.push(Record { id, kind, json });
        }
        Ok(out)
    }

    pub fn put(&self, id: &str, kind: &str, json: &str) -> Result<(), CryptoError> {
        if !RECORD_KINDS.contains(&kind) || id.is_empty() || id.len() > 128 {
            return Err(CryptoError::InvalidRecordKind);
        }
        serde_json::from_str::<serde_json::Value>(json).map_err(|_| CryptoError::SerializationError)?;
        let blob = encrypt_payload(self.dek()?, domain_for(kind)?, &context(kind, id), json.as_bytes())?;
        self.conn
            .execute(
                "INSERT INTO records (id, kind, blob) VALUES (?1, ?2, ?3)
                 ON CONFLICT(id) DO UPDATE SET kind = excluded.kind, blob = excluded.blob",
                params![id, kind, blob],
            )
            .map_err(storage)?;
        Ok(())
    }

    pub fn delete(&self, id: &str) -> Result<(), CryptoError> {
        self.dek()?;
        self.conn.execute("DELETE FROM records WHERE id = ?1", [id]).map_err(storage)?;
        Ok(())
    }
}
