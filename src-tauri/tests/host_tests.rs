use nexus_vault_core::crypto::{KdfParams, MasterPassword};
use nexus_vault_core::host::{handle, read_message, same_site, write_message};
use nexus_vault_core::vault::Vault;
use serde_json::{json, Value};

const FAST: KdfParams = KdfParams { memory_kib: 16 * 1024, iterations: 1, parallelism: 1 };

#[test]
fn same_site_matches_domain_and_subdomains_only() {
    assert!(same_site("https://github.com/login", "github.com"));
    assert!(same_site("https://www.github.com/", "https://github.com"));
    assert!(same_site("https://gist.github.com/", "github.com"));
    assert!(!same_site("https://github.com.evil.io/", "github.com"));
    assert!(!same_site("https://notgithub.com/", "github.com"));
    assert!(!same_site("https://github.com/", ""));
    assert!(!same_site("file:///C:/x.html", "x.html"));
}

#[test]
fn framing_round_trips() {
    let mut buf = Vec::new();
    write_message(&mut buf, &json!({"cmd": "status"})).unwrap();
    assert_eq!(&buf[..4], &(buf.len() as u32 - 4).to_le_bytes());
    let mut r = &buf[..];
    assert_eq!(read_message(&mut r).unwrap(), Some(json!({"cmd": "status"})));
    assert_eq!(read_message(&mut r).unwrap(), None);
}

#[test]
fn oversized_message_rejected() {
    let mut r = &(10_000_000u32).to_le_bytes()[..];
    assert!(read_message(&mut r).is_err());
}

#[test]
fn unlock_then_only_matching_live_logins_returned() {
    let dir = tempfile::tempdir().unwrap();
    let mut v = Vault::open_with_kdf(&dir.path().join("vault.db"), FAST).unwrap();
    v.create(&MasterPassword::new(b"correcta".to_vec())).unwrap();
    let login = |title: &str, url: &str, trashed: bool| {
        json!({"type": "login", "title": title, "username": "ana", "email": "", "password": "pw-".to_string() + title, "url": url, "isTrashed": trashed}).to_string()
    };
    v.put("1", "item", &login("GitHub", "https://github.com", false)).unwrap();
    v.put("2", "item", &login("Viejo", "github.com", true)).unwrap();
    v.put("3", "item", &login("Banco", "https://banco.es", false)).unwrap();
    v.put("4", "item", r#"{"type":"note","title":"github.com","url":"github.com"}"#).unwrap();
    v.lock();

    let call = |v: &mut Vault, req: Value| handle(v, &req);
    assert_eq!(call(&mut v, json!({"cmd": "status"})), json!({"ok": true, "initialized": true, "unlocked": false}));
    assert_eq!(call(&mut v, json!({"cmd": "logins", "url": "https://github.com"}))["ok"], false);
    assert_eq!(call(&mut v, json!({"cmd": "unlock", "password": "mala"}))["error"], "Contraseña maestra incorrecta");
    assert_eq!(call(&mut v, json!({"cmd": "unlock", "password": "correcta"}))["ok"], true);

    let resp = call(&mut v, json!({"cmd": "logins", "url": "https://github.com/login"}));
    assert_eq!(resp["logins"], json!([{"id": "1", "title": "GitHub", "username": "ana", "password": "pw-GitHub"}]));

    call(&mut v, json!({"cmd": "lock"}));
    assert_eq!(call(&mut v, json!({"cmd": "logins", "url": "https://github.com"}))["error"], "La bóveda está bloqueada");
    assert_eq!(call(&mut v, json!({"cmd": "borrar"}))["ok"], false);
}
