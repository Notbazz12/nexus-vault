// Holds the single native-messaging connection. While it is open the host keeps the
// vault key in memory; closing it ends the host process, which wipes the key.
const HOST = 'com.nexusvault.host';
const AUTO_LOCK_MS = 5 * 60 * 1000;

let port = null;
let pending = [];
let lockTimer = null;

function connect() {
  port = chrome.runtime.connectNative(HOST);
  // The host answers strictly in order, so a FIFO of resolvers is enough.
  port.onMessage.addListener((msg) => pending.shift()?.(msg));
  port.onDisconnect.addListener(() => {
    const error = chrome.runtime.lastError?.message || 'Conexión con Nexus Vault cerrada';
    pending.splice(0).forEach((resolve) => resolve({ ok: false, error }));
    port = null;
  });
}

function send(req) {
  if (!port) connect();
  return new Promise((resolve) => {
    pending.push(resolve);
    port.postMessage(req);
  });
}

function armAutoLock() {
  clearTimeout(lockTimer);
  lockTimer = setTimeout(() => port?.disconnect(), AUTO_LOCK_MS);
}

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || sender.tab) return; // popup only, never page scripts
  send(req).then((resp) => {
    if (req.cmd === 'lock') port?.disconnect();
    else if (resp.ok && (req.cmd === 'unlock' || req.cmd === 'logins')) armAutoLock();
    sendResponse(resp);
  });
  return true;
});
