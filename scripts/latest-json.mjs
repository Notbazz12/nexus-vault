// Writes the updater manifest (latest.json) for the installer just built by `tauri build`.
// Usage: node scripts/latest-json.mjs   → upload latest.json and the installer to Release v<version>.
import { readFileSync, writeFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
const file = `Nexus Vault_${version}_x64-setup.exe`;
const signature = readFileSync(`src-tauri/target/release/bundle/nsis/${file}.sig`, 'utf8');
// GitHub replaces spaces in asset names with dots.
const url = `https://github.com/Notbazz12/nexus-vault/releases/download/v${version}/${file.replaceAll(' ', '.')}`;

writeFileSync('latest.json', JSON.stringify({
  version,
  pub_date: new Date().toISOString(),
  platforms: { 'windows-x86_64': { signature, url } },
}, null, 2));
console.log(`latest.json → ${url}`);
