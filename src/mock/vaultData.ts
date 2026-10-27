import { AnyVaultItem, Folder, VaultSettings } from '../types';

export const INITIAL_FOLDERS: Folder[] = [
  { id: 'f-dev', name: 'Desarrollo & DevOps', icon: 'Code', itemCount: 4 },
  { id: 'f-fin', name: 'Banca & Finanzas', icon: 'DollarSign', itemCount: 3 },
  { id: 'f-work', name: 'Trabajo & Clientes', icon: 'Briefcase', itemCount: 2 },
  { id: 'f-pers', name: 'Personal & Redes', icon: 'User', itemCount: 3 },
  { id: 'f-infra', name: 'Servidores & Cloud', icon: 'Server', itemCount: 2 },
];

export const INITIAL_ITEMS: AnyVaultItem[] = [
  // 1. GitHub
  {
    id: 'item-1',
    type: 'login',
    title: 'GitHub Enterprise',
    username: 'felipe-secops',
    email: 'felipe@nexusvault.local',
    password: 'nx#9K$mP!2zV@8xL*Q7wR^4t',
    url: 'https://github.com/login',
    notes: 'Token de acceso personal vence en diciembre 2026.',
    category: 'Desarrollo',
    folderId: 'f-dev',
    isFavorite: true,
    isTrashed: false,
    tags: ['dev', 'git', '2fa'],
    createdAt: '2026-01-15T09:30:00Z',
    updatedAt: '2026-10-10T14:20:00Z',
    customFields: [
      { id: 'cf-1', label: '2FA Backup Code', value: '4829-1029-4401', isSecret: true },
      { id: 'cf-2', label: 'SSH Fingerprint', value: 'SHA256:m0x79v...', isSecret: false }
    ]
  },
  // 2. AWS Console (Strong)
  {
    id: 'item-2',
    type: 'login',
    title: 'AWS Management Console',
    username: 'nexus-root-admin',
    email: 'cloud-admin@nexusvault.local',
    password: '7b$Kx!99#VpQ_L21@wZ*88mP',
    url: 'https://signin.aws.amazon.com/console',
    notes: 'Acceso a región us-east-1 y eu-central-1.',
    category: 'Servidores',
    folderId: 'f-infra',
    isFavorite: true,
    isTrashed: false,
    tags: ['cloud', 'aws', 'infra'],
    createdAt: '2026-02-01T11:00:00Z',
    updatedAt: '2026-09-20T16:00:00Z'
  },
  // 3. Proton Mail (Old Password)
  {
    id: 'item-3',
    type: 'login',
    title: 'Proton Mail',
    username: 'felipe_crypt',
    email: 'felipe_crypt@proton.me',
    password: 'Vb8*Lp#2qZ!mN4w@7rT9',
    url: 'https://mail.proton.me/login',
    notes: 'Bandeja cifrada principal para auditorías.',
    category: 'Personal',
    folderId: 'f-pers',
    isFavorite: false,
    isTrashed: false,
    tags: ['mail', 'seguridad'],
    createdAt: '2024-05-10T08:00:00Z',
    updatedAt: '2024-05-10T08:00:00Z' // Más de 1 año (Antigua)
  },
  // 4. Stripe Dashboard (Reused Password A)
  {
    id: 'item-4',
    type: 'login',
    title: 'Stripe Payments',
    username: 'billing@nexusvault.local',
    email: 'billing@nexusvault.local',
    password: 'Summer#2024!SecureKey',
    url: 'https://dashboard.stripe.com/login',
    notes: 'Cuenta de cobros corporativos.',
    category: 'Finanzas',
    folderId: 'f-fin',
    isFavorite: true,
    isTrashed: false,
    tags: ['fintech', 'pagos'],
    createdAt: '2026-03-12T10:15:00Z',
    updatedAt: '2026-08-01T12:00:00Z'
  },
  // 5. PayPal Business (Reused Password B - Match with Stripe)
  {
    id: 'item-5',
    type: 'login',
    title: 'PayPal Business',
    username: 'billing@nexusvault.local',
    email: 'billing@nexusvault.local',
    password: 'Summer#2024!SecureKey', // Reutilizada!
    url: 'https://www.paypal.com/signin',
    notes: 'Pasarela de respaldo.',
    category: 'Finanzas',
    folderId: 'f-fin',
    isFavorite: false,
    isTrashed: false,
    tags: ['fintech', 'paypal'],
    createdAt: '2026-03-15T10:15:00Z',
    updatedAt: '2026-08-01T12:00:00Z'
  },
  // 6. Router Oficina (Weak Password!)
  {
    id: 'item-6',
    type: 'login',
    title: 'Router Mikrotik Oficina',
    username: 'admin',
    email: '',
    password: 'admin123', // Débil: 8 caracteres, números y minúsculas (41 bits)
    url: 'http://192.168.88.1',
    notes: 'IP gateway de la DMZ interna.',
    category: 'Infraestructura',
    folderId: 'f-infra',
    isFavorite: false,
    isTrashed: false,
    tags: ['hardware', 'red'],
    createdAt: '2026-04-10T14:00:00Z',
    updatedAt: '2026-04-10T14:00:00Z'
  },
  // 7. Secure Note 1: Recovery Phrase
  {
    id: 'item-7',
    type: 'note',
    title: 'Frase Semilla Ledger Hardware Wallet',
    content: `1. alert 2. balance 3. canyon 4. dynamic 5. eclipse 6. forward
7. galaxy 8. harbor 9. island 10. jungle 11. kinetic 12. lantern
13. matrix 14. nebula 15. oxygen 16. pioneer 17. quantum 18. rescue
19. shadow 20. thunder 21. unlock 22. vortex 23. warrior 24. zenith

ADVERTENCIA: Esta frase otorga acceso total a los fondos de la tesorería de seguridad. No compartir jamás.`,
    category: 'Cripto',
    folderId: 'f-fin',
    isFavorite: true,
    isTrashed: false,
    tags: ['crypto', 'semilla', 'ledger'],
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z'
  },
  // 8. Secure Note 2: SSH Production Keys
  {
    id: 'item-8',
    type: 'note',
    title: 'Claves Privadas Bastion Host',
    content: `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAACFwAAAAdzc2gtcn
NhAAAAAwEAAQAAAgEAv70Z5YQ69... [ENCRYPTED IN VAULT] ...
-----END OPENSSH PRIVATE KEY-----

Host: bastion.nexusvault.internal
Port: 2222
User: deployer`,
    category: 'DevOps',
    folderId: 'f-dev',
    isFavorite: false,
    isTrashed: false,
    tags: ['ssh', 'bastion'],
    createdAt: '2026-06-01T15:30:00Z',
    updatedAt: '2026-09-15T11:20:00Z'
  },
  // 9. Payment Card 1
  {
    id: 'item-9',
    type: 'card',
    title: 'Visa Corporate Infinite',
    cardholderName: 'FELIPE DE JESUS V',
    cardNumber: '4532 8901 2345 8892',
    expirationMonth: '08',
    expirationYear: '2029',
    brand: 'visa',
    notes: 'Límite de crédito corporativo para infraestructura en la nube.',
    folderId: 'f-fin',
    isFavorite: true,
    isTrashed: false,
    tags: ['tarjeta', 'visa', 'gastos'],
    createdAt: '2026-02-14T09:00:00Z',
    updatedAt: '2026-02-14T09:00:00Z'
  },
  // 10. Payment Card 2
  {
    id: 'item-10',
    type: 'card',
    title: 'Mastercard World Elite',
    cardholderName: 'FELIPE DE JESUS V',
    cardNumber: '5412 7500 9821 3410',
    expirationMonth: '11',
    expirationYear: '2028',
    brand: 'mastercard',
    notes: 'Tarjeta secundaria de emergencia.',
    folderId: 'f-pers',
    isFavorite: false,
    isTrashed: false,
    tags: ['tarjeta', 'mastercard'],
    createdAt: '2026-05-10T12:00:00Z',
    updatedAt: '2026-05-10T12:00:00Z'
  },
  // 11. Identity 1
  {
    id: 'item-11',
    type: 'identity',
    title: 'Identidad Legal & Fiscal',
    fullName: 'Felipe de Jesús Vázquez',
    email: 'felipe@nexusvault.local',
    phone: '+52 55 8921 4402',
    address: 'Av. Ciberseguridad 2048, Piso 8, Ciudad Tecnológica',
    idNumber: 'RFC: VAZF920415-K89',
    company: 'Nexus Vault Cybersecurity Labs',
    notes: 'Información para autofacturación y registros de dominio.',
    folderId: 'f-work',
    isFavorite: true,
    isTrashed: false,
    tags: ['fiscal', 'identidad'],
    createdAt: '2026-01-10T14:00:00Z',
    updatedAt: '2026-07-22T18:00:00Z'
  },
  // 12. Trashed Item
  {
    id: 'item-12',
    type: 'login',
    title: 'Antiguo Servidor FTP',
    username: 'ftp_user',
    email: '',
    password: 'ftp_password_old',
    url: 'ftp://ftp.oldlegacy.internal',
    notes: 'Servicio desmantelado en migración Q2.',
    category: 'Legacy',
    folderId: null,
    isFavorite: false,
    isTrashed: true,
    tags: ['obsoleto', 'ftp'],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z'
  }
];

export const DEFAULT_SETTINGS: VaultSettings = {
  language: 'es',
  theme: 'light',
  autoLockMinutes: 15,
  clipboardClearSeconds: 30,
  startWithWindows: false,
  minimizeToTray: true,
  securityAuditsEnabled: true,
  backupLocation: 'C:\\Users\\felipe\\Documents\\NexusVault\\Backups',
};
