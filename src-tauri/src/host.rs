//! Native-messaging bridge for the browser extension.
//!
//! Edge starts the host binary per connection and speaks Chrome's native-messaging
//! framing over stdio: a 4-byte little-endian length, then UTF-8 JSON. The host only
//! ever returns logins that match the page the extension asks about.

use std::io::{self, Read, Write};

use serde_json::{json, Value};

use crate::crypto::MasterPassword;
use crate::error::CryptoError;
use crate::vault::Vault;

/// Requests are tiny; anything bigger is a broken or hostile peer.
const MAX_MESSAGE: usize = 64 * 1024;

pub fn read_message<R: Read>(r: &mut R) -> io::Result<Option<Value>> {
    let mut len = [0u8; 4];
    match r.read_exact(&mut len) {
        Err(e) if e.kind() == io::ErrorKind::UnexpectedEof => return Ok(None),
        other => other?,
    }
    let len = u32::from_le_bytes(len) as usize;
    if len > MAX_MESSAGE {
        return Err(io::Error::new(io::ErrorKind::InvalidData, "message too large"));
    }
    let mut buf = vec![0u8; len];
    r.read_exact(&mut buf)?;
    serde_json::from_slice(&buf).map(Some).map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))
}

pub fn write_message<W: Write>(w: &mut W, msg: &Value) -> io::Result<()> {
    let body = serde_json::to_vec(msg)?;
    w.write_all(&(body.len() as u32).to_le_bytes())?;
    w.write_all(&body)?;
    w.flush()
}

fn host_of(raw: &str) -> Option<String> {
    let raw = raw.trim();
    let with_scheme = if raw.contains("://") { raw.to_string() } else { format!("https://{raw}") };
    let parsed = url::Url::parse(&with_scheme).ok()?;
    if !matches!(parsed.scheme(), "http" | "https") {
        return None;
    }
    let host = parsed.host_str()?.to_ascii_lowercase();
    Some(host.strip_prefix("www.").map(str::to_string).unwrap_or(host))
}

/// True when `page_url` is the saved site or one of its subdomains.
pub fn same_site(page_url: &str, item_url: &str) -> bool {
    match (host_of(page_url), host_of(item_url)) {
        (Some(page), Some(item)) => page == item || page.ends_with(&format!(".{item}")),
        _ => false,
    }
}

fn err(msg: &str) -> Value {
    json!({ "ok": false, "error": msg })
}

fn vault_err(e: CryptoError) -> Value {
    match e {
        CryptoError::DecryptionFailed => err("Contraseña maestra incorrecta"),
        CryptoError::VaultLocked => err("La bóveda está bloqueada"),
        CryptoError::NotInitialized => err("Crea tu bóveda en la app Nexus Vault primero"),
        other => err(&other.to_string()),
    }
}

fn logins_for(vault: &Vault, page_url: &str) -> Result<Vec<Value>, CryptoError> {
    let mut out = Vec::new();
    for rec in vault.list()?.into_iter().filter(|r| r.kind == "item") {
        let Ok(item) = serde_json::from_str::<Value>(&rec.json) else { continue };
        let field = |k: &str| item.get(k).and_then(Value::as_str).unwrap_or("").to_string();
        let trashed = item.get("isTrashed").and_then(Value::as_bool).unwrap_or(false);
        if field("type") != "login" || trashed || !same_site(page_url, &field("url")) {
            continue;
        }
        out.push(json!({
            "id": rec.id,
            "title": field("title"),
            "username": if field("username").is_empty() { field("email") } else { field("username") },
            "password": field("password"),
        }));
    }
    Ok(out)
}

pub fn handle(vault: &mut Vault, req: &Value) -> Value {
    let arg = |k: &str| req.get(k).and_then(Value::as_str);
    match arg("cmd") {
        Some("status") => match vault.is_initialized() {
            Ok(init) => json!({ "ok": true, "initialized": init, "unlocked": vault.is_unlocked() }),
            Err(e) => vault_err(e),
        },
        // shortcut: no attempt counter; Argon2id cost (~0.5 s/try) is the only brute-force brake. Add backoff before shipping.
        Some("unlock") => match arg("password") {
            Some(p) => match vault.unlock(&MasterPassword::new(p.as_bytes().to_vec())) {
                Ok(()) => json!({ "ok": true }),
                Err(e) => vault_err(e),
            },
            None => err("Falta la contraseña"),
        },
        Some("lock") => {
            vault.lock();
            json!({ "ok": true })
        }
        Some("logins") => match arg("url") {
            Some(url) => match logins_for(vault, url) {
                Ok(logins) => json!({ "ok": true, "logins": logins }),
                Err(e) => vault_err(e),
            },
            None => err("Falta la URL"),
        },
        _ => err("Comando desconocido"),
    }
}
