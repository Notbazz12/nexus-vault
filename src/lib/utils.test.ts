import { describe, it, expect } from 'vitest';
import { calculateEntropy, generatePassword, generatePassphrase } from './utils';

describe('Criptografía y Generador en Frontend (Utils)', () => {
  it('Calcula correctamente la entropía para contraseñas de diferentes complejidades', () => {
    // Empty
    const empty = calculateEntropy('');
    expect(empty.bits).toBe(0);
    expect(empty.label).toBe('Muy Débil');

    // Weak (short and numbers only)
    const weak = calculateEntropy('123456');
    expect(weak.bits).toBeLessThan(30);
    expect(weak.label).toBe('Muy Débil');

    // Medium
    const medium = calculateEntropy('Password123');
    expect(medium.bits).toBeGreaterThanOrEqual(50);

    // High entropy
    const strong = calculateEntropy('xK#99@zL*44!pQ~22vM');
    expect(strong.bits).toBeGreaterThan(90);
    expect(strong.label).toBe('Excelente');
    expect(strong.score).toBe(100);
  });

  it('Genera contraseñas aleatorias respetando la longitud exacta solicitada', () => {
    const pwd16 = generatePassword({
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: false,
      mode: 'password',
      wordCount: 4,
      separator: '-',
      capitalize: true,
    });

    expect(pwd16.length).toBe(16);

    const pwd64 = generatePassword({
      length: 64,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: false,
      mode: 'password',
      wordCount: 4,
      separator: '-',
      capitalize: true,
    });

    expect(pwd64.length).toBe(64);
  });

  it('Excluye caracteres ambiguos cuando la opción excludeAmbiguous está activa', () => {
    const ambiguousChars = ['0', 'O', 'o', '1', 'l', 'I'];
    for (let i = 0; i < 10; i++) {
      const pwd = generatePassword({
        length: 32,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: false,
        excludeAmbiguous: true,
        mode: 'password',
        wordCount: 4,
        separator: '-',
        capitalize: true,
      });

      for (const char of ambiguousChars) {
        expect(pwd).not.toContain(char);
      }
    }
  });

  it('Genera frases de contraseña con la cantidad solicitada de palabras y separador', () => {
    const phrase = generatePassphrase(4, '-', true);
    const parts = phrase.split('-');
    expect(parts.length).toBe(4);
    parts.forEach((p) => {
      expect(p.length).toBeGreaterThan(2);
      expect(p[0]).toBe(p[0].toUpperCase());
    });
  });
});
