use std::fmt;
use argon2::{Algorithm, Argon2, Params, Version};
use chacha20poly1305::{
    aead::{Aead, KeyInit, Payload},
    XChaCha20Poly1305, XNonce,
};
use rand_core::{OsRng, RngCore};
use zeroize::{Zeroize, ZeroizeOnDrop, Zeroizing};

use crate::error::CryptoError;

pub const CURRENT_FORMAT_VERSION: u8 = 0x01;
pub const NONCE_SIZE: usize = 24;
pub const TAG_SIZE: usize = 16;
pub const KEY_SIZE: usize = 32;
pub const SALT_SIZE: usize = 32;
pub const MAX_PAYLOAD_BYTES: usize = 4 * 1024 * 1024; // 4 MiB max payload

// Strict KDF safety boundaries (DoS and resource exhaustion defense)
pub const MIN_KDF_MEMORY_KIB: u32 = 16 * 1024;      // 16 MiB min
pub const MAX_KDF_MEMORY_KIB: u32 = 1024 * 1024;    // 1 GiB max
pub const MIN_KDF_ITERATIONS: u32 = 1;
pub const MAX_KDF_ITERATIONS: u32 = 64;
pub const MIN_KDF_PARALLELISM: u32 = 1;
pub const MAX_KDF_PARALLELISM: u32 = 16;

// Recommended OWASP 2023+ defaults
pub const DEFAULT_KDF_MEMORY_KIB: u32 = 64 * 1024;  // 64 MiB
pub const DEFAULT_KDF_ITERATIONS: u32 = 3;
pub const DEFAULT_KDF_PARALLELISM: u32 = 4;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum DomainSeparator {
    DekEnvelope = 0x01,
    VaultItem = 0x02,
    Folder = 0x03,
    BackupExport = 0x04,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct KdfParams {
    pub memory_kib: u32,
    pub iterations: u32,
    pub parallelism: u32,
}

impl Default for KdfParams {
    fn default() -> Self {
        Self {
            memory_kib: DEFAULT_KDF_MEMORY_KIB,
            iterations: DEFAULT_KDF_ITERATIONS,
            parallelism: DEFAULT_KDF_PARALLELISM,
        }
    }
}

impl KdfParams {
    pub fn validate(&self) -> Result<(), CryptoError> {
        if self.memory_kib < MIN_KDF_MEMORY_KIB || self.memory_kib > MAX_KDF_MEMORY_KIB {
            return Err(CryptoError::InvalidKdfParameters);
        }
        if self.iterations < MIN_KDF_ITERATIONS || self.iterations > MAX_KDF_ITERATIONS {
            return Err(CryptoError::InvalidKdfParameters);
        }
        if self.parallelism < MIN_KDF_PARALLELISM || self.parallelism > MAX_KDF_PARALLELISM {
            return Err(CryptoError::InvalidKdfParameters);
        }
        Ok(())
    }
}

/// Protected master password wrapper that zeroizes when dropped and redacts in logs.
#[derive(Clone, Zeroize, ZeroizeOnDrop)]
pub struct MasterPassword(Vec<u8>);

impl MasterPassword {
    pub fn new(bytes: Vec<u8>) -> Self {
        Self(bytes)
    }

    pub fn as_bytes(&self) -> &[u8] {
        &self.0
    }
}

impl fmt::Debug for MasterPassword {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[REDACTED_MASTER_PASSWORD]")
    }
}

/// Constructs Additional Authenticated Data (AAD) binding format version, domain purpose, and record context.
/// Format: `version (1B) || domain_byte (1B) || context_len (2B big-endian) || context_id (NB)`
pub fn build_aad(version: u8, domain: DomainSeparator, context_id: &[u8]) -> Vec<u8> {
    let mut aad = Vec::with_capacity(4 + context_id.len());
    aad.push(version);
    aad.push(domain as u8);
    let len = context_id.len() as u16;
    aad.extend_from_slice(&len.to_be_bytes());
    aad.extend_from_slice(context_id);
    aad
}

/// Derives a 256-bit Key Encryption Key (KEK) using Argon2id.
pub fn derive_kek(
    password: &MasterPassword,
    salt: &[u8],
    params: &KdfParams,
) -> Result<Zeroizing<[u8; KEY_SIZE]>, CryptoError> {
    params.validate()?;
    if salt.len() != SALT_SIZE {
        return Err(CryptoError::InvalidSaltLength {
            expected: SALT_SIZE,
            actual: salt.len(),
        });
    }

    let argon_params = Params::new(
        params.memory_kib,
        params.iterations,
        params.parallelism,
        Some(KEY_SIZE),
    )
    .map_err(|_| CryptoError::InvalidKdfParameters)?;

    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, argon_params);
    let mut key = Zeroizing::new([0u8; KEY_SIZE]);

    argon2
        .hash_password_into(password.as_bytes(), salt, key.as_mut())
        .map_err(|_| CryptoError::KdfDerivationFailed)?;

    Ok(key)
}

/// Generates a cryptographically random DEK (256 bits).
pub fn generate_dek() -> Zeroizing<[u8; KEY_SIZE]> {
    let mut dek = Zeroizing::new([0u8; KEY_SIZE]);
    OsRng.fill_bytes(dek.as_mut());
    dek
}

/// Encrypts an arbitrary payload using XChaCha20-Poly1305 with domain-separated AAD.
/// Envelope Output: `version (1B) || nonce (24B) || ciphertext + tag (variable)`
pub fn encrypt_payload(
    key: &[u8; KEY_SIZE],
    domain: DomainSeparator,
    context_id: &[u8],
    plaintext: &[u8],
) -> Result<Vec<u8>, CryptoError> {
    if plaintext.len() > MAX_PAYLOAD_BYTES {
        return Err(CryptoError::PayloadTooLarge(plaintext.len()));
    }

    let cipher = XChaCha20Poly1305::new(key.into());
    let mut nonce_bytes = [0u8; NONCE_SIZE];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = XNonce::from_slice(&nonce_bytes);

    let aad = build_aad(CURRENT_FORMAT_VERSION, domain, context_id);
    let payload = Payload {
        msg: plaintext,
        aad: &aad,
    };

    let ciphertext_and_tag = cipher
        .encrypt(nonce, payload)
        .map_err(|_| CryptoError::SerializationError)?;

    let mut envelope = Vec::with_capacity(1 + NONCE_SIZE + ciphertext_and_tag.len());
    envelope.push(CURRENT_FORMAT_VERSION);
    envelope.extend_from_slice(&nonce_bytes);
    envelope.extend_from_slice(&ciphertext_and_tag);

    Ok(envelope)
}

/// Decrypts a payload envelope with strict version, length, and AAD authentication checks.
pub fn decrypt_payload(
    key: &[u8; KEY_SIZE],
    domain: DomainSeparator,
    context_id: &[u8],
    envelope: &[u8],
) -> Result<Zeroizing<Vec<u8>>, CryptoError> {
    if envelope.is_empty() {
        return Err(CryptoError::DecryptionFailed);
    }

    let version = envelope[0];
    if version != CURRENT_FORMAT_VERSION {
        return Err(CryptoError::UnsupportedVersion(version));
    }

    if envelope.len() < 1 + NONCE_SIZE + TAG_SIZE {
        return Err(CryptoError::DecryptionFailed);
    }

    let nonce_bytes = &envelope[1..1 + NONCE_SIZE];
    let ciphertext_and_tag = &envelope[1 + NONCE_SIZE..];

    if ciphertext_and_tag.len() > MAX_PAYLOAD_BYTES + TAG_SIZE {
        return Err(CryptoError::PayloadTooLarge(ciphertext_and_tag.len()));
    }

    let cipher = XChaCha20Poly1305::new(key.into());
    let nonce = XNonce::from_slice(nonce_bytes);

    let aad = build_aad(version, domain, context_id);
    let payload = Payload {
        msg: ciphertext_and_tag,
        aad: &aad,
    };

    let plaintext = cipher
        .decrypt(nonce, payload)
        .map_err(|_| CryptoError::DecryptionFailed)?;

    Ok(Zeroizing::new(plaintext))
}

/// Encrypts the Data Encryption Key (DEK) with the Key Encryption Key (KEK).
pub fn encrypt_dek(
    kek: &[u8; KEY_SIZE],
    dek: &[u8; KEY_SIZE],
) -> Result<Vec<u8>, CryptoError> {
    encrypt_payload(kek, DomainSeparator::DekEnvelope, b"ROOT_DEK", dek)
}

/// Decrypts the Data Encryption Key (DEK) from the encrypted envelope using the KEK.
pub fn decrypt_dek(
    kek: &[u8; KEY_SIZE],
    encrypted_dek_envelope: &[u8],
) -> Result<Zeroizing<[u8; KEY_SIZE]>, CryptoError> {
    let decrypted = decrypt_payload(
        kek,
        DomainSeparator::DekEnvelope,
        b"ROOT_DEK",
        encrypted_dek_envelope,
    )?;

    if decrypted.len() != KEY_SIZE {
        return Err(CryptoError::DecryptionFailed);
    }

    let mut dek = Zeroizing::new([0u8; KEY_SIZE]);
    dek.copy_from_slice(&decrypted);
    Ok(dek)
}
