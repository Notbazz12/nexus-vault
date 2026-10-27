import { invoke } from '@tauri-apps/api/core';
import { VaultStatus } from '../types';
import { INITIAL_FOLDERS, INITIAL_ITEMS } from '../mock/vaultData';

export type RecordKind = 'item' | 'folder' | 'settings';

export interface VaultRecord {
  id: string;
  kind: RecordKind;
  json: string;
}

export interface VaultApi {
  isDemo: boolean;
  status: () => Promise<VaultStatus>;
  create: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<void>;
  lock: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  list: () => Promise<VaultRecord[]>;
  put: (id: string, kind: RecordKind, value: unknown) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

/** Thin wrappers over the Rust commands in src-tauri/src/lib.rs. */
const tauriApi: VaultApi = {
  isDemo: false,
  status: () => invoke('vault_status'),
  create: (password) => invoke('vault_create', { password }),
  unlock: (password) => invoke('vault_unlock', { password }),
  lock: () => invoke('vault_lock'),
  changePassword: (oldPassword, newPassword) => invoke('vault_change_password', { oldPassword, newPassword }),
  list: () => invoke('records_list'),
  put: (id, kind, value) => invoke('record_put', { id, kind, json: JSON.stringify(value) }),
  remove: (id) => invoke('record_delete', { id }),
};

/**
 * Plain-browser fallback (`pnpm dev` without Tauri): in-memory, unencrypted, lost on reload.
 * Seeded with mock data so the UI can be explored.
 */
function createDemoApi(): VaultApi {
  const records = new Map<string, VaultRecord>();
  let master: string | null = null;
  let unlocked = false;
  const guard = () => {
    if (!unlocked) throw 'La bóveda se encuentra bloqueada';
  };
  return {
    isDemo: true,
    status: async () => (master === null ? 'uninitialized' : unlocked ? 'unlocked' : 'locked'),
    create: async (password) => {
      if (master !== null) throw 'La bóveda ya está inicializada';
      master = password;
      unlocked = true;
      INITIAL_ITEMS.forEach((it) => records.set(it.id, { id: it.id, kind: 'item', json: JSON.stringify(it) }));
      INITIAL_FOLDERS.forEach((f) => records.set(f.id, { id: f.id, kind: 'folder', json: JSON.stringify(f) }));
    },
    unlock: async (password) => {
      if (password !== master) throw 'Contraseña maestra incorrecta';
      unlocked = true;
    },
    lock: async () => {
      unlocked = false;
    },
    changePassword: async (oldPassword, newPassword) => {
      if (oldPassword !== master) throw 'Contraseña maestra incorrecta';
      master = newPassword;
    },
    list: async () => {
      guard();
      return [...records.values()];
    },
    put: async (id, kind, value) => {
      guard();
      records.set(id, { id, kind, json: JSON.stringify(value) });
    },
    remove: async (id) => {
      guard();
      records.delete(id);
    },
  };
}

export const vaultApi: VaultApi =
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window ? tauriApi : createDemoApi();
