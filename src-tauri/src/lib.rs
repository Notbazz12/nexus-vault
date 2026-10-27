pub mod crypto;
pub mod error;
pub mod vault;

pub use crypto::*;
pub use error::CryptoError;

use std::sync::Mutex;

use tauri::{Manager, State};

use crate::vault::{Record, Vault};

type VaultState = Mutex<Vault>;

fn ipc_err(e: CryptoError) -> String {
    match e {
        // Never tell the UI *why* authentication failed.
        CryptoError::DecryptionFailed => "Contraseña maestra incorrecta".into(),
        other => other.to_string(),
    }
}

fn with_vault<T>(state: &State<VaultState>, f: impl FnOnce(&mut Vault) -> Result<T, CryptoError>) -> Result<T, String> {
    let mut vault = state.lock().map_err(|_| "Estado de la bóveda corrupto".to_string())?;
    f(&mut vault).map_err(ipc_err)
}

// Commands are async so Argon2id runs off the UI thread.

#[tauri::command]
async fn vault_status(state: State<'_, VaultState>) -> Result<&'static str, String> {
    with_vault(&state, |v| {
        Ok(if !v.is_initialized()? { "uninitialized" } else if v.is_unlocked() { "unlocked" } else { "locked" })
    })
}

#[tauri::command]
async fn vault_create(state: State<'_, VaultState>, password: String) -> Result<(), String> {
    with_vault(&state, |v| v.create(&MasterPassword::new(password.into_bytes())))
}

#[tauri::command]
async fn vault_unlock(state: State<'_, VaultState>, password: String) -> Result<(), String> {
    // shortcut: no attempt counter; Argon2id cost (~0.5 s/try) is the only brute-force brake. Add backoff before shipping.
    with_vault(&state, |v| v.unlock(&MasterPassword::new(password.into_bytes())))
}

#[tauri::command]
async fn vault_lock(state: State<'_, VaultState>) -> Result<(), String> {
    with_vault(&state, |v| {
        v.lock();
        Ok(())
    })
}

#[tauri::command]
async fn vault_change_password(state: State<'_, VaultState>, old_password: String, new_password: String) -> Result<(), String> {
    with_vault(&state, |v| {
        v.change_password(
            &MasterPassword::new(old_password.into_bytes()),
            &MasterPassword::new(new_password.into_bytes()),
        )
    })
}

#[tauri::command]
async fn records_list(state: State<'_, VaultState>) -> Result<Vec<Record>, String> {
    with_vault(&state, |v| v.list())
}

#[tauri::command]
async fn record_put(state: State<'_, VaultState>, id: String, kind: String, json: String) -> Result<(), String> {
    with_vault(&state, |v| v.put(&id, &kind, &json))
}

#[tauri::command]
async fn record_delete(state: State<'_, VaultState>, id: String) -> Result<(), String> {
    with_vault(&state, |v| v.delete(&id))
}

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&dir)?;
            let vault = Vault::open(&dir.join("vault.db"))?;
            app.manage(Mutex::new(vault));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            vault_status,
            vault_create,
            vault_unlock,
            vault_lock,
            vault_change_password,
            records_list,
            record_put,
            record_delete
        ])
        .run(tauri::generate_context!())
        .expect("error al iniciar Nexus Vault");
}
