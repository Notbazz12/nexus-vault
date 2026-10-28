// Holds the single native-messaging connection. While it is open the host keeps the
// vault key in memory; closing it ends the host process, which wipes the key.
const HOST = 'com.nexusvault.host';
const AUTO_LOCK_MS = 5 * 60 * 1000;

let port = null;
let pending = [];
let lockTimer = null;
// shortcut: kept in service-worker memory, so an offer is lost if Edge stops the idle worker
// (~30 s while locked); move to chrome.storage.session if that bites.
const pendingSave = new Map(); // tabId -> { url, username, password, at, confirmed }
const lastUser = new Map(); // tabId -> username typed on a previous step
const OFFER_MS = 2 * 60 * 1000;

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

function siteOf(url) {
  return new URL(url).hostname.replace(/^www./, '');
}

async function saveNow(tabId, p) {
  pendingSave.delete(tabId);
  return send({ cmd: 'save', url: p.url, username: p.username, password: p.password });
}

async function fromPopup(req) {
  const resp = await send(req);
  if (req.cmd === 'lock') port?.disconnect();
  else if (resp.ok && (req.cmd === 'unlock' || req.cmd === 'logins')) armAutoLock();
  if (resp.ok && req.cmd === 'unlock') {
    for (const [tabId, p] of pendingSave) if (p.confirmed) await saveNow(tabId, p);
  }
  return resp;
}

// Save-offer flow: the page reports what was typed, the next page in that tab asks whether
// there is an offer to show. Only the URL the browser reports for the frame is ever saved.
async function saveFlow(req, sender) {
  const tabId = sender.tab.id;
  const p = pendingSave.get(tabId);
  switch (req.cmd) {
    case 'rememberUser':
      lastUser.set(tabId, String(req.username || ''));
      return { ok: true };
    case 'offerSave': {
      const username = String(req.username || lastUser.get(tabId) || '');
      const password = String(req.password || '');
      if (!password || !/^https?:/.test(sender.url)) return { ok: false };
      if (port) {
        const known = await send({ cmd: 'logins', url: sender.url });
        if (known.ok && known.logins.some((l) => l.username === username && l.password === password)) return { ok: true };
      }
      pendingSave.set(tabId, { url: sender.url, username, password, at: Date.now() });
      return { ok: true };
    }
    case 'pendingSave':
      if (!p || p.confirmed || Date.now() - p.at > OFFER_MS) return { ok: true };
      return { ok: true, site: siteOf(p.url), username: p.username };
    case 'confirmSave':
      if (!p) return { ok: false, error: 'La oferta caducó' };
      if (!port) {
        p.confirmed = true;
        await fromPage({ cmd: 'openPopup' }, sender);
        return { ok: true, needsUnlock: true };
      }
      return saveNow(tabId, p);
    case 'dismissSave':
      pendingSave.delete(tabId);
      return { ok: true };
  }
  return null;
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
  const saved = await saveFlow(req, sender);
  if (saved) return saved;
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

chrome.tabs.onRemoved.addListener((tabId) => {
  pendingSave.delete(tabId);
  lastUser.delete(tabId);
});

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) return;
  (sender.tab ? fromPage(req, sender) : fromPopup(req)).then(sendResponse);
  return true;
});
