// Shows a Nexus Vault suggestion list under login fields, like a password manager's inline menu.
// Passwords never live here until the user picks an entry; the background re-checks the frame's
// URL before handing one over.
(() => {
  const USER_HINT = /user|email|e-mail|login|correo|usuario|identifier|account|cuenta/i;
  let host = null;
  let menu = null;
  let field = null;

  const visible = (el) => el.offsetParent !== null && !el.disabled && !el.readOnly;

  function isLoginField(el) {
    if (!(el instanceof HTMLInputElement) || !visible(el)) return false;
    if (el.type === 'password') return true;
    if (!['text', 'email', 'tel'].includes(el.type)) return false;
    const hints = [el.autocomplete, el.name, el.id, el.placeholder, el.getAttribute('aria-label')].join(' ');
    return el.type === 'email' || USER_HINT.test(hints) || !!(el.form || document).querySelector('input[type=password]');
  }

  function setValue(el, value) {
    // Native setter so React/Vue-controlled inputs see the change.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function fill(target, { username, password }) {
    const scope = target.form || document;
    const inputs = [...scope.querySelectorAll('input')].filter(visible);
    const pw = target.type === 'password' ? target : inputs.find((i) => i.type === 'password');
    const before = pw ? inputs.slice(0, inputs.indexOf(pw)) : inputs;
    const user = target.type === 'password'
      ? before.reverse().find((i) => ['text', 'email', 'tel'].includes(i.type))
      : target;
    if (user && username) setValue(user, username);
    if (pw && password) setValue(pw, password);
  }

  function close() {
    host?.remove();
    host = menu = null;
  }

  function open(target, rows) {
    close();
    host = document.createElement('nexus-vault-menu');
    const root = host.attachShadow({ mode: 'closed' });
    root.innerHTML = `<style>
      .m { position: fixed; z-index: 2147483647; min-width: 260px; max-width: 360px; background: #fff; color: #1d2b2a;
           border: 1px solid #e2e8e7; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.18);
           font: 14px/1.35 "Segoe UI", system-ui, sans-serif; overflow: hidden; }
      .h { display: flex; align-items: center; gap: 6px; padding: 8px 12px; font-size: 12px; font-weight: 600; color: #00a88e; border-bottom: 1px solid #e2e8e7; }
      .h::before { content: ""; width: 10px; height: 10px; border-radius: 3px; background: #00a88e; }
      button { all: unset; box-sizing: border-box; display: block; width: 100%; padding: 9px 12px; cursor: pointer; }
      button:hover, button:focus-visible { background: #e6f6f3; }
      b, span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      span { color: #5d6b6a; font-size: 12px; }
      @media (prefers-color-scheme: dark) {
        .m { background: #1d2726; color: #e6efee; border-color: #2b3837; }
        .h { border-color: #2b3837; }
        button:hover, button:focus-visible { background: #24413c; }
        span { color: #9aaaa8; }
      }
    </style><div class="m" role="listbox"><div class="h">Nexus Vault</div></div>`;
    menu = root.querySelector('.m');
    for (const row of rows) {
      const b = document.createElement('button');
      b.setAttribute('role', 'option');
      const title = document.createElement('b');
      title.textContent = row.title;
      b.append(title);
      if (row.sub) {
        const sub = document.createElement('span');
        sub.textContent = row.sub;
        b.append(sub);
      }
      b.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus in the field
      b.addEventListener('click', () => { close(); row.action(); });
      menu.append(b);
    }
    const r = target.getBoundingClientRect();
    menu.style.top = `${r.bottom + 4}px`;
    menu.style.left = `${r.left}px`;
    menu.style.width = `${Math.max(r.width, 260)}px`;
    document.documentElement.append(host);
  }

  async function suggest(target) {
    let resp;
    try {
      resp = await chrome.runtime.sendMessage({ cmd: 'suggest' });
    } catch {
      return; // extension reloaded; this old content script is orphaned
    }
    if (document.activeElement !== target || !resp?.ok) return;
    if (resp.locked) {
      open(target, [{
        title: 'Desbloquear Nexus Vault',
        sub: 'Pulsa aquí o el icono de la extensión',
        action: () => chrome.runtime.sendMessage({ cmd: 'openPopup' }),
      }]);
      return;
    }
    if (!resp.logins.length) return close();
    open(target, resp.logins.map((login) => ({
      title: login.title || login.username || '(sin título)',
      sub: login.username,
      action: async () => {
        const secret = await chrome.runtime.sendMessage({ cmd: 'fill', id: login.id });
        if (secret?.ok) fill(target, secret);
      },
    })));
  }

  document.addEventListener('focusin', (e) => {
    if (e.target === host) return;
    if (!isLoginField(e.target)) return close();
    field = e.target;
    suggest(field);
  }, true);
  // Reopen when clicking a field that already has focus (e.g. after closing the menu).
  document.addEventListener('click', (e) => {
    if (e.target === field && !host && isLoginField(field)) suggest(field);
  }, true);
  // Pages like Google's sign-in autofocus the field before this script loads.
  if (isLoginField(document.activeElement)) suggest((field = document.activeElement));
  document.addEventListener('focusout', (e) => {
    if (e.target === field) setTimeout(() => document.activeElement !== field && close(), 150);
  }, true);
  document.addEventListener('keydown', (e) => e.key === 'Escape' && close(), true);
  window.addEventListener('scroll', close, true);
  window.addEventListener('resize', close);
})();
