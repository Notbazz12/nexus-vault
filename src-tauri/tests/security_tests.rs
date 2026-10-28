use nexus_vault_core::crypto::{
    decrypt_dek, decrypt_payload, derive_kek, encrypt_dek, encrypt_payload,
    generate_dek, DomainSeparator, KdfParams, MasterPassword, CURRENT_FORMAT_VERSION,
    MAX_KDF_MEMORY_KIB, MIN_KDF_MEMORY_KIB, SALT_SIZE,
};
use nexus_vault_core::error::CryptoError;

#[test]
fn test_01_argon2id_derivation_deterministic() {
    let password = MasterPassword::new(b"CorrectHorseBatteryStaple#2026!".to_vec());
    let salt = [0x42u8; SALT_SIZE];
    let params = KdfParams {
        memory_kib: 16 * 1024, // 16 MiB (fast for unit test)
        iterations: 1,
        parallelism: 1,
    };

    let kek1 = derive_kek(&password, &salt, &params).expect("KEK 1 derivation failed");
    let kek2 = derive_kek(&password, &salt, &params).expect("KEK 2 derivation failed");

    assert_eq!(*kek1, *kek2, "Misma clave y sal deben producir idéntica KEK");
    assert_ne!(*kek1, [0u8; 32], "KEK no debe ser una clave nula");
}

#[test]
fn test_02_kdf_rejects_abusive_parameters() {
    let password = MasterPassword::new(b"SecurePass123!".to_vec());
    let salt = [0x55u8; SALT_SIZE];

    // Case A: Memory too small (< 16 MiB)
    let too_low_mem = KdfParams {
        memory_kib: 8 * 1024,
        iterations: 2,
        parallelism: 2,
    };
    assert_eq!(
        derive_kek(&password, &salt, &too_low_mem).unwrap_err(),
        CryptoError::InvalidKdfParameters
    );

    // Case B: Memory too large (> 1 GiB) - DoS prevention
    let too_high_mem = KdfParams {
        memory_kib: MAX_KDF_MEMORY_KIB + 1024,
        iterations: 2,
        parallelism: 2,
    };
    assert_eq!(
        derive_kek(&password, &salt, &too_high_mem).unwrap_err(),
        CryptoError::InvalidKdfParameters
    );

    // Case C: Invalid iterations (0)
    let zero_iters = KdfParams {
        memory_kib: MIN_KDF_MEMORY_KIB,
        iterations: 0,
        parallelism: 2,
    };
    assert_eq!(
        derive_kek(&password, &salt, &zero_iters).unwrap_err(),
        CryptoError::InvalidKdfParameters
    );
}

#[test]
fn test_03_xchacha20_poly1305_roundtrip_with_aad() {
    let dek = generate_dek();
    let item_id = b"uuid-item-1234-abcd";
    let secret_payload = br#"{"username":"admin","password":"MySecretPassword99#"}"#;

    let envelope = encrypt_payload(
        &dek,
        DomainSeparator::VaultItem,
        item_id,
        secret_payload,
    )
    .expect("Encryption failed");

    // Must start with version byte 0x01
    assert_eq!(envelope[0], CURRENT_FORMAT_VERSION);

    let decrypted = decrypt_payload(
        &dek,
        DomainSeparator::VaultItem,
        item_id,
        &envelope,
    )
    .expect("Decryption failed");

    assert_eq!(decrypted.as_slice(), secret_payload);
}

#[test]
fn test_04_tampered_ciphertext_detection() {
    let dek = generate_dek();
    let item_id = b"uuid-item-tamper";
    let secret_payload = b"Confidential Note Content";

    let mut envelope = encrypt_payload(
        &dek,
        DomainSeparator::VaultItem,
        item_id,
        secret_payload,
    )
    .unwrap();

    // Flip a bit in the ciphertext / tag region
    let last_idx = envelope.len() - 1;
    envelope[last_idx] ^= 0x01;

    let result = decrypt_payload(
        &dek,
        DomainSeparator::VaultItem,
        item_id,
        &envelope,
    );

    assert_eq!(result.unwrap_err(), CryptoError::DecryptionFailed);
}

#[test]
fn test_05_aad_prevents_item_swapping_attacks() {
    let dek = generate_dek();
    let item_a_id = b"uuid-bank-account-01";
    let item_b_id = b"uuid-social-network-02";

    let payload_a = b"Sensitive Bank Credentials";

    // Encrypt intended for Item A
    let envelope_a = encrypt_payload(
        &dek,
        DomainSeparator::VaultItem,
        item_a_id,
        payload_a,
    )
    .unwrap();

    // Adversary attempts to swap ciphertext into Item B row in SQLite
    let swap_result = decrypt_payload(
        &dek,
        DomainSeparator::VaultItem,
        item_b_id, // Trying to decrypt using Item B's identity
        &envelope_a,
    );

    assert_eq!(
        swap_result.unwrap_err(),
        CryptoError::DecryptionFailed,
        "El intercambio de ciphertext entre elementos debe ser rechazado por AAD"
    );
}

#[test]
fn test_06_aad_prevents_domain_swapping_attacks() {
    let dek = generate_dek();
    let id = b"common-id-123";
    let payload = b"Some data";

    // Encrypted as a VaultItem
    let envelope = encrypt_payload(
        &dek,
        DomainSeparator::VaultItem,
        id,
        payload,
    )
    .unwrap();

    // Adversary attempts to decrypt as a Folder or Backup
    let folder_swap = decrypt_payload(
        &dek,
        DomainSeparator::Folder,
        id,
        &envelope,
    );

    assert_eq!(
        folder_swap.unwrap_err(),
        CryptoError::DecryptionFailed,
        "El intercambio de ciphertext entre dominios (Item -> Folder) debe ser rechazado por AAD"
    );
}

#[test]
fn test_07_unsupported_version_rejection() {
    let dek = generate_dek();
    let item_id = b"uuid-version-test";
    let mut envelope = encrypt_payload(
        &dek,
        DomainSeparator::VaultItem,
        item_id,
        b"payload",
    )
    .unwrap();

    // Tamper version byte (0x01 -> 0x02)
    envelope[0] = 0x02;

    let result = decrypt_payload(
        &dek,
        DomainSeparator::VaultItem,
        item_id,
        &envelope,
    );

    assert_eq!(result.unwrap_err(), CryptoError::UnsupportedVersion(0x02));
}

#[test]
fn test_08_dek_envelope_encryption_and_wrong_password_rejection() {
    let password_correct = MasterPassword::new(b"SuperSecretMasterPass!2026".to_vec());
    let password_wrong = MasterPassword::new(b"WrongMasterPass!999".to_vec());
    let salt = [0x77u8; SALT_SIZE];
    let params = KdfParams {
        memory_kib: 16 * 1024,
        iterations: 1,
        parallelism: 1,
    };

    let kek_correct = derive_kek(&password_correct, &salt, &params).unwrap();
    let kek_wrong = derive_kek(&password_wrong, &salt, &params).unwrap();

    let dek = generate_dek();

    // Encrypt DEK with KEK
    let encrypted_dek = encrypt_dek(&kek_correct, &dek).expect("DEK encryption failed");

    // Decrypt with correct KEK
    let decrypted_dek = decrypt_dek(&kek_correct, &encrypted_dek).expect("DEK decryption failed");
    assert_eq!(*dek, *decrypted_dek);

    // Decrypt with wrong KEK must fail
    let fail_result = decrypt_dek(&kek_wrong, &encrypted_dek);
    assert_eq!(fail_result.unwrap_err(), CryptoError::DecryptionFailed);
}

#[test]
fn test_09_master_password_debug_redaction() {
    let raw_secret = b"MyActualSecretPasswordNeverInLogs";
    let password = MasterPassword::new(raw_secret.to_vec());
    let debug_output = format!("{:?}", password);

    assert_eq!(debug_output, "[REDACTED_MASTER_PASSWORD]");
    assert!(
        !debug_output.contains("MyActualSecretPasswordNeverInLogs"),
        "El trait Debug NUNCA debe filtrar la contraseña en logs o formateadores"
    );
}

#[test]
fn test_10_transactional_master_password_rotation_simulation() {
    let old_pass = MasterPassword::new(b"OldPassphrase#1".to_vec());
    let new_pass = MasterPassword::new(b"NewPassphrase#2".to_vec());
    let old_salt = [0x11u8; SALT_SIZE];
    let new_salt = [0x22u8; SALT_SIZE];
    let params = KdfParams {
        memory_kib: 16 * 1024,
        iterations: 1,
        parallelism: 1,
    };

    let old_kek = derive_kek(&old_pass, &old_salt, &params).unwrap();
    let original_dek = generate_dek();

    // Initial state: DEK encrypted with Old KEK
    let old_encrypted_dek = encrypt_dek(&old_kek, &original_dek).unwrap();

    // Simulate Transactional Rotation:
    // Step 1: Verify old password by decrypting DEK
    let staging_dek = decrypt_dek(&old_kek, &old_encrypted_dek).expect("Verification failed");

    // Step 2: Derive new KEK with new salt
    let new_kek = derive_kek(&new_pass, &new_salt, &params).expect("New KEK derivation failed");

    // Step 3: Re-encrypt original DEK under new KEK
    let new_encrypted_dek = encrypt_dek(&new_kek, &staging_dek).expect("Re-encryption failed");

    // Step 4: Validate that new encrypted DEK decrypts to original DEK
    let recovered_dek = decrypt_dek(&new_kek, &new_encrypted_dek).expect("New DEK decryption failed");
    assert_eq!(*original_dek, *recovered_dek);

    // Step 5: Simulate failure before commit -> Old encrypted DEK is untouched and still works
    let recovered_old = decrypt_dek(&old_kek, &old_encrypted_dek).expect("Old state intact");
    assert_eq!(*original_dek, *recovered_old);
}
