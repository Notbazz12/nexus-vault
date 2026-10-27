import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GeneratorOptions } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface EntropyResult {
  bits: number;
  score: number; // 0 - 100
  label: 'Muy Débil' | 'Débil' | 'Aceptable' | 'Fuerte' | 'Excelente';
  color: string;
}

export function calculateEntropy(password: string): EntropyResult {
  if (!password || password.length === 0) {
    return { bits: 0, score: 0, label: 'Muy Débil', color: '#F43F5E' };
  }

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 33;

  if (poolSize === 0) poolSize = 10;

  // Shannon Entropy formula: L * log2(R)
  const bits = Math.round(password.length * (Math.log(poolSize) / Math.LN2));

  let score = 0;
  let label: EntropyResult['label'] = 'Muy Débil';
  let color = '#F43F5E';

  if (bits < 28) {
    score = Math.max(10, Math.round((bits / 28) * 25));
    label = 'Muy Débil';
    color = '#F43F5E';
  } else if (bits < 50) {
    score = Math.round(25 + ((bits - 28) / (50 - 28)) * 25);
    label = 'Débil';
    color = '#F59E0B';
  } else if (bits < 75) {
    score = Math.round(50 + ((bits - 50) / (75 - 50)) * 25);
    label = 'Aceptable';
    color = '#38BDF8';
  } else if (bits < 100) {
    score = Math.round(75 + ((bits - 75) / (100 - 75)) * 20);
    label = 'Fuerte';
    color = '#10B981';
  } else {
    score = 100;
    label = 'Excelente';
    color = '#00F0FF';
  }

  return { bits, score, label, color };
}

const WORDLIST = [
  'nexus', 'boveda', 'cripto', 'guardian', 'candado', 'llave', 'escudo', 'refugio',
  'centinela', 'fortaleza', 'aurora', 'cometa', 'galaxia', 'prisma', 'orbital',
  'quantum', 'vertice', 'horizonte', 'sombra', 'relampago', 'alquimia', 'enigma',
  'brujula', 'diamante', 'titanio', 'vortex', 'oraculo', 'pulsar', 'tempestad',
  'baluarte', 'dragon', 'esfinge', 'glaciar', 'meteorito', 'nebulosa', 'oceano',
  'zenit', 'dinamo', 'trueno', 'halcon', 'pantera', 'solsticio', 'ciber', 'vector',
  'antorcha', 'valquiria', 'laberinto', 'cortex', 'quasar', 'espectro', 'sinapsis'
];

export function generatePassword(options: GeneratorOptions): string {
  if (options.mode === 'passphrase') {
    return generatePassphrase(options.wordCount, options.separator, options.capitalize);
  }

  const lowercaseChars = options.excludeAmbiguous
    ? 'abcdefghijkmnpqrstuvwxyz'
    : 'abcdefghijklmnopqrstuvwxyz';
  const uppercaseChars = options.excludeAmbiguous
    ? 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numberChars = options.excludeAmbiguous
    ? '23456789'
    : '0123456789';
  const symbolChars = options.excludeAmbiguous
    ? '!@#$%^&*()-_=+[]{}:;,.?'
    : '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let charPool = '';
  const requiredChars: string[] = [];

  const getCryptoRandomInt = (max: number): number => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
  };

  if (options.lowercase) {
    charPool += lowercaseChars;
    requiredChars.push(lowercaseChars[getCryptoRandomInt(lowercaseChars.length)]);
  }
  if (options.uppercase) {
    charPool += uppercaseChars;
    requiredChars.push(uppercaseChars[getCryptoRandomInt(uppercaseChars.length)]);
  }
  if (options.numbers) {
    charPool += numberChars;
    requiredChars.push(numberChars[getCryptoRandomInt(numberChars.length)]);
  }
  if (options.symbols) {
    charPool += symbolChars;
    requiredChars.push(symbolChars[getCryptoRandomInt(symbolChars.length)]);
  }

  if (charPool.length === 0) {
    charPool = lowercaseChars;
  }

  const length = Math.max(options.length, requiredChars.length);
  const passwordChars: string[] = [...requiredChars];

  for (let i = requiredChars.length; i < length; i++) {
    passwordChars.push(charPool[getCryptoRandomInt(charPool.length)]);
  }

  // Fisher-Yates cryptographically secure shuffle
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = getCryptoRandomInt(i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join('');
}

export function generatePassphrase(
  wordCount = 4,
  separator = '-',
  capitalize = true
): string {
  const chosenWords: string[] = [];
  const array = new Uint32Array(wordCount);
  window.crypto.getRandomValues(array);

  for (let i = 0; i < wordCount; i++) {
    let word = WORDLIST[array[i] % WORDLIST.length];
    if (capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }
    chosenWords.push(word);
  }

  return chosenWords.join(separator);
}

export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoDate;
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Error al copiar al portapapeles:', err);
    return false;
  }
}
