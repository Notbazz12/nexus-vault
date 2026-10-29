// Parses password exports from other managers into plain login rows.
export interface ImportedLogin {
  title: string;
  url: string;
  username: string;
  password: string;
  notes: string;
}

/** RFC 4180 CSV: quoted fields may contain commas, newlines and doubled quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((f) => f.trim()));
}

// Header names used by Edge/Chrome, Bitwarden, 1Password, Firefox and most generic exports.
const COLUMNS: Record<keyof ImportedLogin, string[]> = {
  title: ['name', 'title', 'nombre'],
  url: ['url', 'login_uri', 'website', 'uri', 'origin_url'],
  username: ['username', 'login_username', 'user', 'email', 'login', 'usuario'],
  password: ['password', 'login_password', 'contraseña', 'pass'],
  notes: ['note', 'notes', 'extra', 'comment', 'notas'],
};

function fromCsv(text: string): ImportedLogin[] {
  const [header, ...rows] = parseCsv(text);
  if (!header) return [];
  const names = header.map((h) => h.trim().toLowerCase());
  const col = Object.fromEntries(
    Object.entries(COLUMNS).map(([key, aliases]) => [key, names.findIndex((n) => aliases.includes(n))])
  ) as Record<keyof ImportedLogin, number>;
  if (col.password < 0) throw new Error('El CSV no tiene una columna "password".');
  return rows.map((r) => {
    const get = (k: keyof ImportedLogin) => (col[k] >= 0 ? (r[col[k]] ?? '').trim() : '');
    return { title: get('title'), url: get('url'), username: get('username'), password: get('password'), notes: get('notes') };
  });
}

// shortcut: written from Kaspersky Password Manager's documented "Key: value" text export (English
// and Spanish labels); if a version uses other labels, add them here.
const KASPERSKY: Record<string, keyof ImportedLogin> = {
  'website name': 'title', 'nombre del sitio web': 'title', application: 'title', 'aplicación': 'title',
  'website url': 'url', 'url del sitio web': 'url',
  login: 'username', 'inicio de sesión': 'username', usuario: 'username',
  password: 'password', 'contraseña': 'password',
  comment: 'notes', comentario: 'notes',
};

function fromKaspersky(text: string): ImportedLogin[] {
  return text.split(/^-{3,}\s*$/m).flatMap((block) => {
    const entry: ImportedLogin = { title: '', url: '', username: '', password: '', notes: '' };
    for (const line of block.split(/\r?\n/)) {
      const m = line.match(/^([^:]+):\s?(.*)$/);
      const key = m && KASPERSKY[m[1].trim().toLowerCase()];
      if (key && !entry[key]) entry[key] = m[2].trim();
    }
    return entry.password ? [entry] : [];
  });
}

/** Detects the format and returns the logins that have a password. */
export function parseExport(text: string): ImportedLogin[] {
  const clean = text.replace(/^﻿/, '');
  const kaspersky = /^(Website URL|URL del sitio web|Login|Inicio de sesión):/im.test(clean) && !clean.split('\n')[0].includes(',');
  const rows = kaspersky ? fromKaspersky(clean) : fromCsv(clean);
  return rows
    .filter((r) => r.password)
    .map((r) => ({ ...r, title: r.title || hostOf(r.url) || r.username || 'Sin título' }));
}

export function hostOf(url: string): string {
  try {
    return new URL(/^[a-z]+:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
