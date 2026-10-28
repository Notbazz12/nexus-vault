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

async function fromPopup(req) {
  const resp = await send(req);
  if (req.cmd === 'lock') port?.disconnect();
  else if (resp.ok && (req.cmd === 'unlock' || req.cmd === 'logins')) armAutoLock();
  return resp;
}

// Content scripts can only list entries for the frame they run in and fetch one of them;
// the URL comes from the browser (sender.url), never from the page.
async function fromPage(req, sender) {
  if (req.cmd === 'openPopup') {
    try {
      await chrome.action.openPopup();
    } catch {
      // Older Edge builds need a user click on the toolbar icon instead.
    }
    return { ok: true };
  }
  if (req.cmd !== 'suggest' && req.cmd !== 'fill') return { ok: false };
  if (!port) return { ok: true, locked: true }; // no live host means no key in memory
  const resp = await send({ cmd: 'logins', url: sender.url });
  if (!resp.ok) return { ok: true, locked: true };
  armAutoLock();
  if (req.cmd === 'suggest') {
    return { ok: true, logins: resp.logins.map(({ id, title, username }) => ({ id, title, username })) };
  }
  const login = resp.logins.find((l) => l.id === req.id);
  return login ? { ok: true, username: login.username, password: login.password } : { ok: false };
}

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) return;
  (sender.tab ? fromPage(req, sender) : fromPopup(req)).then(sendResponse);
  return true;
});
