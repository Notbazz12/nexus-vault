const $ = (id) => document.getElementById(id);
const send = (req) => chrome.runtime.sendMessage(req);

let tab = null;

function show(message, { error = false, unlock = false, logins = false } = {}) {
  $('message').textContent = message;
  $('message').classList.toggle('error', error);
  $('unlock').hidden = !unlock;
  $('logins').hidden = !logins;
  $('lock').hidden = unlock || !logins;
  if (unlock) $('password').focus();
}

// Runs inside the page. Re-checks the host so a tab that navigated away never gets the password.
function fillPage(expectedHost, username, password) {
  const host = location.hostname.replace(/^www\./, '');
  if (host !== expectedHost && !host.endsWith('.' + expectedHost)) return false;
  const visible = (el) => el.offsetParent !== null && !el.disabled && !el.readOnly;
  const pw = [...document.querySelectorAll('input[type=password]')].find(visible);
  if (!pw) return false;
  const inputs = [...(pw.form || document).querySelectorAll('input')].filter(visible);
  const user = inputs
    .slice(0, inputs.indexOf(pw))
    .reverse()
    .find((i) => ['text', 'email', 'tel'].includes(i.type));
  // Use the native setter so React/Vue-controlled inputs see the change.
  const setValue = (el, value) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  if (user && username) setValue(user, username);
  setValue(pw, password);
  return true;
}

async function fill(login) {
  const host = new URL(tab.url).hostname.replace(/^www\./, '');
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: fillPage,
    args: [host, login.username, login.password],
  });
  if (result) window.close();
  else show('No encontré un campo de contraseña en esta página.', { error: true, logins: true });
}

function button(className, text, onClick) {
  const b = document.createElement('button');
  b.className = className;
  b.textContent = text;
  b.addEventListener('click', onClick);
  return b;
}

function renderLogins(logins) {
  $('logins').replaceChildren(
    ...logins.map((login) => {
      const li = document.createElement('li');
      const who = document.createElement('div');
      who.className = 'who';
      const title = document.createElement('strong');
      title.textContent = login.title || '(sin título)';
      const user = document.createElement('span');
      user.textContent = login.username || '—';
      who.append(title, user);
      const copy = button('copy', 'Copiar', async () => {
        await navigator.clipboard.writeText(login.password);
        copy.textContent = 'Copiada';
      });
      copy.title = 'Copiar contraseña';
      li.append(who, button('fill', 'Rellenar', () => fill(login)), copy);
      return li;
    })
  );
}

async function loadLogins() {
  if (!/^https?:/.test(tab?.url || '')) return show('Abre una página web para ver sus contraseñas.', { logins: true });
  const resp = await send({ cmd: 'logins', url: tab.url });
  if (!resp.ok) return show(resp.error, { error: true, unlock: resp.error.includes('bloqueada') });
  renderLogins(resp.logins);
  const site = new URL(tab.url).hostname;
  show(resp.logins.length ? `Contraseñas para ${site}` : `No tienes contraseñas guardadas para ${site}.`, { logins: true });
}

async function start() {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const status = await send({ cmd: 'status' });
  if (!status.ok) {
    return show(`No puedo conectar con Nexus Vault (${status.error}). ¿Ejecutaste install-host.ps1?`, { error: true });
  }
  if (!status.initialized) return show('Crea tu bóveda en la app Nexus Vault primero.', { error: true });
  if (!status.unlocked) return show('', { unlock: true });
  loadLogins();
}

$('unlock').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submit = e.submitter;
  submit.disabled = true;
  submit.textContent = 'Desbloqueando…';
  const resp = await send({ cmd: 'unlock', password: $('password').value });
  $('password').value = '';
  submit.disabled = false;
  submit.textContent = 'Desbloquear';
  if (resp.ok) loadLogins();
  else show(resp.error, { error: true, unlock: true });
});

$('lock').addEventListener('click', async () => {
  await send({ cmd: 'lock' });
  show('', { unlock: true });
});

start();
