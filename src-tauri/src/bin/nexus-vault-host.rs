//! Native-messaging host started by Edge for the Nexus Vault extension.
//! It opens the same vault.db as the desktop app and exits when the browser closes the pipe.

use std::io;
use std::path::PathBuf;

use nexus_vault_core::host::{handle, read_message, write_message};
use nexus_vault_core::vault::Vault;
use serde_json::json;

fn main() -> io::Result<()> {
    // Same location Tauri's app_data_dir() resolves to for identifier com.nexusvault.desktop.
    let path = std::env::var_os("APPDATA")
        .map(|d| PathBuf::from(d).join("com.nexusvault.desktop").join("vault.db"));
    let mut vault = match path.filter(|p| p.exists()).map(|p| Vault::open(&p)) {
        Some(Ok(v)) => Some(v),
        _ => None, // never create a vault from here; the app owns creation
    };

    let (mut input, mut output) = (io::stdin().lock(), io::stdout().lock());
    while let Some(req) = read_message(&mut input)? {
        let resp = match vault.as_mut() {
            Some(v) => handle(v, &req),
            None if req.get("cmd").and_then(|c| c.as_str()) == Some("status") => {
                json!({ "ok": true, "initialized": false, "unlocked": false })
            }
            None => json!({ "ok": false, "error": "Crea tu bóveda en la app Nexus Vault primero" }),
        };
        write_message(&mut output, &resp)?;
    }
    Ok(())
}
