import { describe, it, expect } from 'vitest';
import { parseCsv, parseExport } from './importers';

describe('parseCsv', () => {
  it('handles quotes, commas, newlines and CRLF', () => {
    expect(parseCsv('a,b\r\n"x, y","say ""hi""\nthere"\r\n')).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"\nthere'],
    ]);
  });
});

describe('parseExport', () => {
  it('reads an Edge/Chrome export', () => {
    const csv = '﻿name,url,username,password,note\nGoogle,https://accounts.google.com/,yo@gmail.com,p@ss,\n,https://www.roblox.com/login,gamer,r0b,\nsinpass,https://x.com,u,,\n';
    expect(parseExport(csv)).toEqual([
      { title: 'Google', url: 'https://accounts.google.com/', username: 'yo@gmail.com', password: 'p@ss', notes: '' },
      { title: 'roblox.com', url: 'https://www.roblox.com/login', username: 'gamer', password: 'r0b', notes: '' },
    ]);
  });

  it('reads a Bitwarden export by its column names', () => {
    const csv = 'folder,favorite,type,name,notes,fields,reprompt,login_uri,login_username,login_password,login_totp\n,,login,GitHub,nota,,0,https://github.com,dev,gh!,\n';
    expect(parseExport(csv)[0]).toEqual({ title: 'GitHub', url: 'https://github.com', username: 'dev', password: 'gh!', notes: 'nota' });
  });

  it('rejects a CSV without a password column', () => {
    expect(() => parseExport('a,b\n1,2\n')).toThrow(/password/);
  });

  it('reads a Kaspersky text export', () => {
    const txt = [
      'Websites', '',
      'Website name: Roblox', 'Website URL: https://www.roblox.com', 'Login name: ', 'Login: gamer', 'Password: r0b:x', 'Comment: ', '',
      '---', '',
      'Applications', '',
      'Application: Steam', 'Login: player', 'Password: st3am', 'Comment: viejo', '',
      '---', '',
      'Notes', '', 'Name: wifi', 'Text: clave', '',
    ].join('\n');
    expect(parseExport(txt)).toEqual([
      { title: 'Roblox', url: 'https://www.roblox.com', username: 'gamer', password: 'r0b:x', notes: '' },
      { title: 'Steam', url: '', username: 'player', password: 'st3am', notes: 'viejo' },
    ]);
  });
});
