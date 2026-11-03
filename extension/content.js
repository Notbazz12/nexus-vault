// Shows a Nexus Vault suggestion list under login fields and offers to save new logins,
// like a password manager's inline menu. Passwords never live here until the user picks an
// entry; the background re-checks the frame's URL before handing one over.
(() => {
  const USER_HINT = /user|email|e-mail|login|correo|usuario|identifier|account|cuenta/i;
  const USER_TYPES = ['text', 'email', 'tel'];
  let host = null;
  let field = null;

  const send = async (msg) => {
    try {
      return await chrome.runtime.sendMessage(msg);
    } catch {
      return null; // extension reloaded; this old content script is orphaned
    }
  };
  const visible = (el) => el.offsetParent !== null && !el.disabled && !el.readOnly;

  function isLoginField(el) {
    if (!(el instanceof HTMLInputElement) || !visible(el)) return false;
    if (el.type === 'password') return true;
    if (!USER_TYPES.includes(el.type)) return false;
    const hints = [el.autocomplete, el.name, el.id, el.placeholder, el.getAttribute('aria-label')].join(' ');
    return el.type === 'email' || USER_HINT.test(hints) || !!(el.form || document).querySelector('input[type=password]');
  }

  function scopeInputs(el) {
    return [...(el.form || document).querySelectorAll('input')].filter(visible);
  }

  /** The username input that precedes a password input. */
  function userBefore(pw) {
    const inputs = scopeInputs(pw);
    return inputs.slice(0, inputs.indexOf(pw)).reverse().find((i) => USER_TYPES.includes(i.type));
  }

  function setValue(el, value) {
    // Native setter so React/Vue-controlled inputs see the change.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function fill(target, { username, password }) {
    const pw = target.type === 'password' ? target : scopeInputs(target).find((i) => i.type === 'password');
    const user = target.type === 'password' ? userBefore(target) : target;
    if (user && username) setValue(user, username);
    if (pw && password) setValue(pw, password);
  }

  const STYLE = `<style>
    .m { position: fixed; z-index: 2147483647; min-width: 260px; max-width: 360px; background: #fff; color: #1d2b2a;
         border: 1px solid #e2e8e7; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.18);
         font: 14px/1.35 "Segoe UI", system-ui, sans-serif; overflow: hidden; }
    .h { display: flex; align-items: center; gap: 6px; padding: 8px 12px; font-size: 12px; font-weight: 600; color: #00a88e; border-bottom: 1px solid #e2e8e7; }
    .h::before { content: ""; width: 10px; height: 10px; border-radius: 3px; background: #00a88e; }
    .row { all: unset; box-sizing: border-box; display: block; width: 100%; padding: 9px 12px; cursor: pointer; }
    .row:hover, .row:focus-visible { background: #e6f6f3; }
    .row.static { cursor: default; background: none; }
    .row.static b, .row.static span { white-space: normal; }
    b, span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    span { color: #5d6b6a; font-size: 12px; }
    .actions { display: flex; gap: 8px; padding: 0 12px 12px; }
    .btn { all: unset; padding: 7px 14px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn.primary { background: #00a88e; color: #fff; }
    .btn.primary:hover { background: #008a75; }
    .btn.ghost { color: #5d6b6a; }
    .btn:focus-visible { outline: 2px solid #00a88e; outline-offset: 2px; }
    @media (prefers-color-scheme: dark) {
      .m { background: #1d2726; color: #e6efee; border-color: #2b3837; }
      .h { border-color: #2b3837; }
      .row:hover, .row:focus-visible { background: #24413c; }
      span, .btn.ghost { color: #9aaaa8; }
    }
  </style>`;

  function close() {
    host?.remove();
    host = null;
  }

  /** Builds an isolated card; returns its inner element. */
  function card() {
    close();
    host = document.createElement('nexus-vault-menu');
    const root = host.attachShadow({ mode: 'closed' });
    root.innerHTML = `${STYLE}<div class="m" role="dialog" aria-label="Nexus Vault"><div class="h">Nexus Vault</div></div>`;
    document.documentElement.append(host);
    const m = root.querySelector('.m');
    m.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus in the page field
    return m;
  }

  function textRow(title, sub, action) {
    const b = document.createElement(action ? 'button' : 'div');
    b.className = action ? 'row' : 'row static';
    const t = document.createElement('b');
    t.textContent = title;
    b.append(t);
    if (sub) {
      const s = document.createElement('span');
      s.textContent = sub;
      b.append(s);
    }
    if (action) b.addEventListener('click', () => { close(); action(); });
    return b;
  }

  function open(target, rows) {
    const m = card();
    m.setAttribute('role', 'listbox');
    for (const row of rows) m.append(textRow(row.title, row.sub, row.action));
    const r = target.getBoundingClientRect();
    m.style.top = `${r.bottom + 4}px`;
    m.style.left = `${r.left}px`;
    m.style.width = `${Math.max(r.width, 260)}px`;
  }

  const CHARSETS = ['abcdefghijkmnopqrstuvwxyz', 'ABCDEFGHJKLMNPQRSTUVWXYZ', '23456789', '!@#$%&*-_=+?'];

  /** 20 random characters with at least one of each set (sign-up forms often require it). */
  function generatePassword(length = 20) {
    const all = CHARSETS.join('');
    const pick = (set) => {
      const max = 256 - (256 % set.length); // reject biased bytes
      for (;;) {
        const [b] = crypto.getRandomValues(new Uint8Array(1));
        if (b < max) return set[b % set.length];
      }
    };
    for (;;) {
      const pw = Array.from({ length }, () => pick(all)).join('');
      if (CHARSETS.every((set) => [...pw].some((c) => set.includes(c)))) return pw;
    }
  }

  /** Fills the new password and its confirmation field, then shows it once so the user can note it. */
  function fillGenerated(target) {
    const pw = generatePassword();
    // The target and the fields after it (confirmation); a "current password" field comes before.
    const inputs = scopeInputs(target);
    for (const input of inputs.slice(inputs.indexOf(target))) if (input.type === 'password') setValue(input, pw);
    const m = card();
    const r = target.getBoundingClientRect();
    Object.assign(m.style, { top: `${r.bottom + 4}px`, left: `${r.left}px`, width: `${Math.max(r.width, 260)}px` });
    m.append(textRow('Contraseña generada', 'Nexus Vault te ofrecerá guardarla al registrarte'));
    const code = document.createElement('b');
    code.textContent = pw;
    Object.assign(code.style, { padding: '0 12px 12px', fontFamily: 'Consolas, monospace', whiteSpace: 'normal', wordBreak: 'break-all' });
    m.append(code);
    m.addEventListener('click', close); // it can cover the submit button
  }

  async function suggest(target) {
    const resp = await send({ cmd: 'suggest' });
    if (document.activeElement !== target || !resp?.ok) return;
    const generate = target.type === 'password' && {
      title: 'Generar contraseña segura',
      sub: 'Rellena este campo y el de confirmación',
      action: () => fillGenerated(target),
    };
    if (resp.locked) {
      return open(target, [{
        title: 'Desbloquear Nexus Vault',
        sub: 'Pulsa aquí o el icono de la extensión',
        action: () => send({ cmd: 'openPopup' }),
      }, generate].filter(Boolean));
    }
    if (!resp.logins.length) {
      return open(target, [{
        title: `Sin cuentas guardadas para ${location.hostname.replace(/^www\./, '')}`,
        sub: generate ? '' : 'Inicia sesión y Nexus Vault te ofrecerá guardarla',
      }, generate].filter(Boolean));
    }
    open(target, resp.logins.map((login) => ({
      title: login.title || login.username || '(sin título)',
      sub: login.username,
      action: async () => {
        const secret = await send({ cmd: 'fill', id: login.id });
        if (secret?.ok) fill(target, secret);
      },
    })));
  }

  // Remember what the user signs in with; the save offer appears on the next page.
  function captureLogin() {
    const pw = [...document.querySelectorAll('input[type=password]')].find((i) => visible(i) && i.value);
    if (pw) return send({ cmd: 'offerSave', username: userBefore(pw)?.value || '', password: pw.value });
    // Two-step sign-ins (Google) ask for the email on its own page first.
    const user = [...document.querySelectorAll('input')].find((i) => i.type !== 'password' && isLoginField(i) && i.value);
    if (user) send({ cmd: 'rememberUser', username: user.value });
  }

  function saveBanner({ site, username }) {
    const m = card();
    Object.assign(m.style, { top: '16px', right: '16px', width: '320px' });
    m.append(textRow(`¿Guardar la contraseña de ${site}?`, username || 'Sin nombre de usuario'));
    const actions = document.createElement('div');
    actions.className = 'actions';
    const button = (cls, text, onClick) => {
      const b = document.createElement('button');
      b.className = `btn ${cls}`;
      b.textContent = text;
      b.addEventListener('click', onClick);
      return b;
    };
    const status = (title, sub) => {
      actions.remove();
      m.querySelector('.row').replaceWith(textRow(title, sub));
    };
    actions.append(
      button('primary', 'Guardar', async () => {
        const resp = await send({ cmd: 'confirmSave' });
        if (resp?.needsUnlock) return status('Desbloquea Nexus Vault', 'Se guardará en cuanto la desbloquees');
        if (!resp?.ok) return status('No se pudo guardar', resp?.error || '');
        status('Guardada en Nexus Vault', site);
        setTimeout(close, 2500);
      }),
      button('ghost', 'Ahora no', () => { send({ cmd: 'dismissSave' }); close(); })
    );
    m.append(actions);
  }

  document.addEventListener('focusin', (e) => {
    if (e.target === host) return;
    if (!isLoginField(e.target)) return;
    field = e.target;
    suggest(field);
  }, true);
  document.addEventListener('focusout', (e) => {
    if (e.target === field) setTimeout(() => document.activeElement !== field && field && close(), 150);
  }, true);
  document.addEventListener('click', (e) => {
    // Reopen when clicking a field that already has focus (e.g. after closing the menu).
    if (e.target === field && !host && isLoginField(field)) suggest(field);
    if (e.target.closest?.('button, input[type=submit], [role=button]')) captureLogin();
  }, true);
  // Typing means the user is not picking a suggestion; get out of the way of the form.
  document.addEventListener('input', (e) => e.target === field && e.isTrusted && close(), true);
  document.addEventListener('submit', captureLogin, true);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Enter' && isLoginField(e.target)) captureLogin();
  }, true);
  window.addEventListener('resize', close);

  // Pages like Google's sign-in autofocus the field before this script loads.
  if (isLoginField(document.activeElement)) suggest((field = document.activeElement));
  send({ cmd: 'pendingSave' }).then((p) => p?.site && !host && saveBanner(p));
})();
