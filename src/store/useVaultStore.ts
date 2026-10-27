import { create } from 'zustand';
import {
  AnyVaultItem,
  Folder,
  LoginItem,
  SecurityHealthSummary,
  VaultSettings,
  VaultStatus,
  ViewType
} from '../types';
import { DEFAULT_SETTINGS, INITIAL_FOLDERS } from '../mock/vaultData';
import { calculateEntropy, copyToClipboard } from '../lib/utils';
import { vaultApi } from '../lib/vaultApi';

const SETTINGS_ID = 'settings';

const reportPersistError = (e: unknown) =>
  useVaultStore.setState({ clipboardNotification: `Error al guardar en la bóveda: ${e}` });

/** Writes the current in-memory version of an item to the encrypted vault. */
const persistItem = (id: string) => {
  const item = useVaultStore.getState().items.find((it) => it.id === id);
  if (item) vaultApi.put(item.id, 'item', item).catch(reportPersistError);
};

let clipboardTimer: ReturnType<typeof setTimeout> | undefined;

interface VaultStoreState {
  vaultStatus: VaultStatus;
  activeView: ViewType;
  selectedItemId: string | null;
  editingItem: AnyVaultItem | null;
  searchQuery: string;
  activeFolderId: string | null;
  filterOnlyFavorites: boolean;
  filterOnlyTrash: boolean;
  items: AnyVaultItem[];
  folders: Folder[];
  settings: VaultSettings;
  clipboardNotification: string | null;
  recentActivity: Array<{ id: string; action: string; timestamp: string }>;

  // Actions
  setView: (view: ViewType) => void;
  selectItem: (id: string | null) => void;
  setEditingItem: (item: AnyVaultItem | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveFolder: (folderId: string | null) => void;
  setFilterFavorites: (val: boolean) => void;
  setFilterTrash: (val: boolean) => void;
  toggleFavorite: (id: string) => void;
  moveToTrash: (id: string) => void;
  restoreFromTrash: (id: string) => void;
  deletePermanently: (id: string) => void;
  saveItem: (item: AnyVaultItem) => void;
  duplicateItem: (id: string) => void;
  bootstrap: () => Promise<void>;
  loadVault: () => Promise<void>;
  lockVault: () => void;
  unlockVault: (masterPassword: string) => Promise<boolean>;
  initializeVault: (masterPassword: string) => Promise<void>;
  changeMasterPassword: (oldPassword: string, newPassword: string) => Promise<void>;
  updateSettings: (newSettings: Partial<VaultSettings>) => void;
  copySecureValue: (text: string, label: string) => Promise<boolean>;
  getSecurityHealth: () => SecurityHealthSummary;
  getFilteredItems: () => AnyVaultItem[];
}

export const useVaultStore = create<VaultStoreState>((set, get) => ({
  vaultStatus: 'locked', // Real status arrives from bootstrap()
  activeView: 'unlock',
  selectedItemId: null,
  editingItem: null,
  searchQuery: '',
  activeFolderId: null,
  filterOnlyFavorites: false,
  filterOnlyTrash: false,
  items: [],
  folders: [],
  settings: DEFAULT_SETTINGS,
  clipboardNotification: null,
  recentActivity: [
    { id: '1', action: 'Bóveda local desbloqueada con éxito', timestamp: 'Hace 5 minutos' },
    { id: '2', action: 'Auditoría automática de contraseñas finalizada', timestamp: 'Hace 12 minutos' },
    { id: '3', action: 'Copia de respaldo periódica programada', timestamp: 'Hace 1 hora' },
  ],

  setView: (view) => {
    set({ activeView: view });
    // Reset secondary filters when switching main views
    if (view !== 'passwords') {
      set({ filterOnlyFavorites: false, filterOnlyTrash: false, activeFolderId: null });
    }
  },

  selectItem: (id) => set({ selectedItemId: id, editingItem: null }),

  setEditingItem: (item) => set({ editingItem: item, activeView: 'edit-item' }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setActiveFolder: (folderId) => set({
    activeFolderId: folderId,
    activeView: 'passwords',
    filterOnlyFavorites: false,
    filterOnlyTrash: false
  }),

  setFilterFavorites: (val) => set({
    filterOnlyFavorites: val,
    filterOnlyTrash: false,
    activeFolderId: null,
    activeView: 'passwords'
  }),

  setFilterTrash: (val) => set({
    filterOnlyTrash: val,
    filterOnlyFavorites: false,
    activeFolderId: null,
    activeView: 'passwords'
  }),

  toggleFavorite: (id) => {
    set((state) => ({
      items: state.items.map((it) =>
        it.id === id ? { ...it, isFavorite: !it.isFavorite, updatedAt: new Date().toISOString() } : it
      ),
    }));
    persistItem(id);
  },

  moveToTrash: (id) => {
    set((state) => ({
      items: state.items.map((it) =>
        it.id === id ? { ...it, isTrashed: true, updatedAt: new Date().toISOString() } : it
      ),
    }));
    persistItem(id);
  },

  restoreFromTrash: (id) => {
    set((state) => ({
      items: state.items.map((it) =>
        it.id === id ? { ...it, isTrashed: false, updatedAt: new Date().toISOString() } : it
      ),
    }));
    persistItem(id);
  },

  deletePermanently: (id) => {
    set((state) => {
      const newItems = state.items.filter((it) => it.id !== id);
      return {
        items: newItems,
        selectedItemId: state.selectedItemId === id ? (newItems[0]?.id || null) : state.selectedItemId
      };
    });
    vaultApi.remove(id).catch(reportPersistError);
  },

  saveItem: (item) => {
    set((state) => {
    const exists = state.items.some((it) => it.id === item.id);
    const updated = exists
      ? state.items.map((it) => it.id === item.id ? { ...item, updatedAt: new Date().toISOString() } : it)
      : [{ ...item, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...state.items];

    return {
      items: updated,
      selectedItemId: item.id,
      editingItem: null,
      activeView: item.type === 'login' ? 'passwords' : item.type === 'note' ? 'notes' : item.type === 'identity' ? 'identities' : 'cards',
    };
    });
    persistItem(item.id);
  },

  duplicateItem: (id) => {
    const original = get().items.find((it) => it.id === id);
    if (!original) return;

    const copy: AnyVaultItem = {
      ...JSON.parse(JSON.stringify(original)),
      id: 'item-' + Math.random().toString(36).substring(2, 9),
      title: `${original.title} (Copia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      items: [copy, ...state.items],
      selectedItemId: copy.id,
    }));
    persistItem(copy.id);
  },

  bootstrap: async () => {
    const status = await vaultApi.status();
    set({ vaultStatus: status, activeView: status === 'uninitialized' ? 'welcome' : status === 'locked' ? 'unlock' : 'dashboard' });
    if (status === 'unlocked') await get().loadVault();
  },

  loadVault: async () => {
    const records = await vaultApi.list();
    const parse = (kind: string) => records.filter((r) => r.kind === kind).map((r) => JSON.parse(r.json));
    const [savedSettings] = parse('settings');
    const settings: VaultSettings = { ...DEFAULT_SETTINGS, ...savedSettings };
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    set({
      items: parse('item'),
      folders: parse('folder'),
      settings,
    });
  },

  lockVault: () => {
    vaultApi.lock().catch(reportPersistError);
    set({
    vaultStatus: 'locked',
    activeView: 'unlock',
    items: [],
    folders: [],
    selectedItemId: null,
    editingItem: null,
    clipboardNotification: null,
    searchQuery: '',
    filterOnlyFavorites: false,
    filterOnlyTrash: false,
    activeFolderId: null,
    });
  },

  unlockVault: async (masterPassword) => {
    try {
      await vaultApi.unlock(masterPassword);
    } catch {
      return false;
    }
    await get().loadVault();
    set({ vaultStatus: 'unlocked', activeView: 'dashboard' });
    return true;
  },

  initializeVault: async (masterPassword) => {
    await vaultApi.create(masterPassword);
    if (!vaultApi.isDemo) {
      // Fresh real vault: seed default folders and settings, no mock credentials.
      await Promise.all([
        ...INITIAL_FOLDERS.map((f) => vaultApi.put(f.id, 'folder', { ...f, itemCount: 0 })),
        vaultApi.put(SETTINGS_ID, 'settings', DEFAULT_SETTINGS),
      ]);
    }
    await get().loadVault();
    set({
      vaultStatus: 'unlocked',
      activeView: 'dashboard',
      recentActivity: [
        { id: 'init-1', action: 'Bóveda maestra inicializada con Argon2id + XChaCha20-Poly1305', timestamp: 'Ahora' },
        ...get().recentActivity
      ]
    });
  },

  changeMasterPassword: (oldPassword, newPassword) => vaultApi.changePassword(oldPassword, newPassword),

  updateSettings: (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    if (newSettings.theme) {
      document.documentElement.classList.toggle('dark', newSettings.theme === 'dark');
    }
    set({ settings: updated });
    vaultApi.put(SETTINGS_ID, 'settings', updated).catch(reportPersistError);
  },

  copySecureValue: async (text: string, label: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      const seconds = get().settings.clipboardClearSeconds;
      set({ clipboardNotification: `${label} copiado. Se borrará en ${seconds}s.` });
      setTimeout(() => {
        set({ clipboardNotification: null });
      }, 3500);
      clearTimeout(clipboardTimer);
      clipboardTimer = setTimeout(() => {
        navigator.clipboard.writeText('').catch(() => {});
      }, seconds * 1000);
    }
    return success;
  },

  getSecurityHealth: (): SecurityHealthSummary => {
    const { items } = get();
    const activeLogins = items.filter((it): it is LoginItem => it.type === 'login' && !it.isTrashed);

    let weakCount = 0;
    let oldCount = 0;
    const passwordCounts: Record<string, number> = {};

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    for (const login of activeLogins) {
      const entropy = calculateEntropy(login.password);
      if (entropy.bits < 50) {
        weakCount++;
      }

      // Check reuse
      if (login.password) {
        passwordCounts[login.password] = (passwordCounts[login.password] || 0) + 1;
      }

      // Check age
      const updated = new Date(login.updatedAt);
      if (updated < oneYearAgo) {
        oldCount++;
      }
    }

    let reusedCount = 0;
    Object.values(passwordCounts).forEach((count) => {
      if (count > 1) {
        reusedCount += count;
      }
    });

    const total = activeLogins.length;
    let safeScore = 100;
    if (total > 0) {
      const penalty = (weakCount * 25 + reusedCount * 20 + oldCount * 10) / total;
      safeScore = Math.max(10, Math.min(100, Math.round(100 - penalty)));
    }

    return {
      totalPasswords: total,
      weakCount,
      reusedCount,
      oldCount,
      safeScore,
      favoriteCount: items.filter((it) => it.isFavorite && !it.isTrashed).length,
      trashCount: items.filter((it) => it.isTrashed).length,
    };
  },

  getFilteredItems: (): AnyVaultItem[] => {
    const { items, activeView, searchQuery, activeFolderId, filterOnlyFavorites, filterOnlyTrash } = get();

    return items.filter((item) => {
      // Trash filtering
      if (filterOnlyTrash) {
        return item.isTrashed;
      }
      if (item.isTrashed) {
        return false;
      }

      // View type filter
      if (activeView === 'passwords' && item.type !== 'login') return false;
      if (activeView === 'notes' && item.type !== 'note') return false;
      if (activeView === 'cards' && item.type !== 'card' && item.type !== 'identity') return false;

      // Favorites filter
      if (filterOnlyFavorites && !item.isFavorite) return false;

      // Folder filter
      if (activeFolderId && item.folderId !== activeFolderId) return false;

      // Search query filter
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesTag = item.tags.some((t) => t.toLowerCase().includes(query));

        if (item.type === 'login') {
          return matchesTitle || matchesTag || item.username.toLowerCase().includes(query) || item.url.toLowerCase().includes(query);
        }
        if (item.type === 'note') {
          return matchesTitle || matchesTag || item.content.toLowerCase().includes(query);
        }
        if (item.type === 'card') {
          return matchesTitle || matchesTag || item.cardholderName.toLowerCase().includes(query);
        }
        if (item.type === 'identity') {
          return matchesTitle || matchesTag || item.fullName.toLowerCase().includes(query) || item.email.toLowerCase().includes(query);
        }
        return matchesTitle || matchesTag;
      }

      return true;
    });
  },
}));
