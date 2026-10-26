export type ItemType = 'login' | 'note' | 'card' | 'identity';

export interface CustomField {
  id: string;
  label: string;
  value: string;
  isSecret: boolean;
}

export interface BaseVaultItem {
  id: string;
  type: ItemType;
  title: string;
  folderId?: string | null;
  isFavorite: boolean;
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface LoginItem extends BaseVaultItem {
  type: 'login';
  username: string;
  email: string;
  password: string;
  url: string;
  notes: string;
  category: string;
  customFields?: CustomField[];
}

export interface NoteItem extends BaseVaultItem {
  type: 'note';
  content: string;
  category: string;
}

export interface CardItem extends BaseVaultItem {
  type: 'card';
  cardholderName: string;
  cardNumber: string; // Stored masked or encrypted
  expirationMonth: string;
  expirationYear: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'other';
  notes: string;
  // CVV/CVC is strictly NOT stored according to security specification
}

export interface IdentityItem extends BaseVaultItem {
  type: 'identity';
  fullName: string;
  email: string;
  phone: string;
  address: string;
  idNumber: string;
  company?: string;
  notes: string;
}

export type AnyVaultItem = LoginItem | NoteItem | CardItem | IdentityItem;

export interface Folder {
  id: string;
  name: string;
  icon?: string;
  itemCount?: number;
}

export type VaultStatus = 'uninitialized' | 'locked' | 'unlocked';

export type ViewType =
  | 'welcome'
  | 'create-master'
  | 'unlock'
  | 'dashboard'
  | 'passwords'
  | 'edit-item'
  | 'generator'
  | 'notes'
  | 'cards'
  | 'security-center'
  | 'import-export'
  | 'settings'
  | 'backups';

export interface SecurityHealthSummary {
  totalPasswords: number;
  weakCount: number;
  reusedCount: number;
  oldCount: number;
  safeScore: number; // 0 - 100
  favoriteCount: number;
  trashCount: number;
}

export interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  mode: 'password' | 'passphrase';
  wordCount: number;
  separator: string;
  capitalize: boolean;
}

export interface VaultSettings {
  language: 'es' | 'en';
  theme: 'dark' | 'light';
  autoLockMinutes: number; // 1, 5, 15, 30, 0 (never)
  clipboardClearSeconds: number; // 15, 30, 60, 120
  startWithWindows: boolean;
  minimizeToTray: boolean;
  securityAuditsEnabled: boolean;
  backupLocation: string;
}
