use nexus_vault_core::crypto::{KdfParams, MasterPassword};
use nexus_vault_core::error::CryptoError;
use nexus_vault_core::vault::Vault;
use rusqlite::Connection;

// Minimum allowed KDF cost keeps tests fast.
const FAST: KdfParams = KdfParams { memory_kib: 16 * 1024, iterations: 1, parallelism: 1 };

fn pw(s: &str) -> MasterPassword {
    MasterPassword::new(s.as_bytes().to_vec())
}

fn new_vault() -> (tempfile::TempDir, std::path::PathBuf, Vault) {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("vault.db");
    let mut v = Vault::open_with_kdf(&path, FAST).unwrap();
    v.create(&pw("correcta")).unwrap();
    (dir, path, v)
}

#[test]
fn records_survive_lock_and_reopen() {
    let (_d, path, v) = new_vault();
    v.put("a1", "item", r#"{"title":"GitHub","password":"s3cr3t"}"#).unwrap();
    drop(v);

    let mut v = Vault::open(&path).unwrap();
    assert!(v.is_initialized().unwrap());
    assert_eq!(v.list(), Err(CryptoError::VaultLocked));
    v.unlock(&pw("correcta")).unwrap();
    let recs = v.list().unwrap();
    assert_eq!(recs.len(), 1);
    assert!(recs[0].json.contains("GitHub"));
}

#[test]
fn wrong_password_rejected_and_create_twice_fails() {
    let (_d, _p, mut v) = new_vault();
    v.lock();
    assert_eq!(v.unlock(&pw("incorrecta")), Err(CryptoError::DecryptionFailed));
    assert!(!v.is_unlocked());
    assert_eq!(v.create(&pw("otra")), Err(CryptoError::AlreadyInitialized));
}

#[test]
fn no_plaintext_on_disk() {
    let (_d, path, v) = new_vault();
    v.put("a1", "item", r#"{"title":"MiBancoSecreto"}"#).unwrap();
    drop(v);
    let raw = std::fs::read(&path).unwrap();
    let wal = std::fs::read(path.with_extension("db-wal")).unwrap_or_default();
    let needle = b"MiBancoSecreto";
    assert!(!raw.windows(needle.len()).any(|w| w == needle));
    assert!(!wal.windows(needle.len()).any(|w| w == needle));
}

#[test]
fn swapped_blob_fails_authentication() {
    let (_d, path, v) = new_vault();
    v.put("a1", "item", r#"{"n":1}"#).unwrap();
    v.put("b2", "item", r#"{"n":2}"#).unwrap();
    let c = Connection::open(&path).unwrap();
    c.execute("UPDATE records SET blob = (SELECT blob FROM records WHERE id = 'b2') WHERE id = 'a1'", [])
        .unwrap();
    assert_eq!(v.list(), Err(CryptoError::DecryptionFailed));
}

#[test]
fn change_password_keeps_data() {
    let (_d, _p, mut v) = new_vault();
    v.put("a1", "folder", r#"{"name":"Trabajo"}"#).unwrap();
    assert_eq!(v.change_password(&pw("mala"), &pw("nueva")), Err(CryptoError::DecryptionFailed));
    v.change_password(&pw("correcta"), &pw("nueva")).unwrap();
    v.lock();
    assert_eq!(v.unlock(&pw("correcta")), Err(CryptoError::DecryptionFailed));
    v.unlock(&pw("nueva")).unwrap();
    assert_eq!(v.list().unwrap()[0].kind, "folder");
}

#[test]
fn invalid_input_rejected() {
    let (_d, _p, v) = new_vault();
    assert_eq!(v.put("x", "hack", "{}"), Err(CryptoError::InvalidRecordKind));
    assert_eq!(v.put("x", "item", "not json"), Err(CryptoError::SerializationError));
}
