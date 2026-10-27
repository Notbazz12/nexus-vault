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
import { DEFAULT_SETTINGS, INITIAL_FOLDERS, INITIAL_ITEMS } from '../mock/vaultData';
import { calculateEntropy, copyToClipboard } from '../lib/utils';

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
  lockVault: () => void;
  unlockVault: (masterPassword?: string) => boolean;
  initializeVault: (masterPassword: string) => void;
  updateSettings: (newSettings: Partial<VaultSettings>) => void;
  copySecureValue: (text: string, label: string) => Promise<boolean>;
  getSecurityHealth: () => SecurityHealthSummary;
  getFilteredItems: () => AnyVaultItem[];
}

export const useVaultStore = create<VaultStoreState>((set, get) => ({
  vaultStatus: 'unlocked', // Default unlocked with mock data for exploration; can lock anytime
  activeView: 'dashboard',
  selectedItemId: INITIAL_ITEMS[0].id,
  editingItem: null,
  searchQuery: '',
  activeFolderId: null,
  filterOnlyFavorites: false,
  filterOnlyTrash: false,
  items: INITIAL_ITEMS,
  folders: INITIAL_FOLDERS,
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

  toggleFavorite: (id) => set((state) => ({
    items: state.items.map((it) =>
      it.id === id ? { ...it, isFavorite: !it.isFavorite, updatedAt: new Date().toISOString() } : it
    ),
  })),

  moveToTrash: (id) => set((state) => ({
    items: state.items.map((it) =>
      it.id === id ? { ...it, isTrashed: true, updatedAt: new Date().toISOString() } : it
    ),
  })),

  restoreFromTrash: (id) => set((state) => ({
    items: state.items.map((it) =>
      it.id === id ? { ...it, isTrashed: false, updatedAt: new Date().toISOString() } : it
    ),
  })),

  deletePermanently: (id) => set((state) => {
    const newItems = state.items.filter((it) => it.id !== id);
    return {
      items: newItems,
      selectedItemId: state.selectedItemId === id ? (newItems[0]?.id || null) : state.selectedItemId
    };
  }),

  saveItem: (item) => set((state) => {
    const exists = state.items.some((it) => it.id === item.id);
    const updated = exists
      ? state.items.map((it) => it.id === item.id ? { ...item, updatedAt: new Date().toISOString() } : it)
      : [{ ...item, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...state.items];

    return {
      items: updated,
      selectedItemId: item.id,
      editingItem: null,
      activeView: item.type === 'login' ? 'passwords' : item.type === 'note' ? 'notes' : 'cards',
    };
  }),

  duplicateItem: (id) => set((state) => {
    const original = state.items.find((it) => it.id === id);
    if (!original) return state;

    const copy: AnyVaultItem = {
      ...JSON.parse(JSON.stringify(original)),
      id: 'item-' + Math.random().toString(36).substring(2, 9),
      title: `${original.title} (Copia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      items: [copy, ...state.items],
      selectedItemId: copy.id,
    };
  }),

  lockVault: () => set({
    vaultStatus: 'locked',
    activeView: 'unlock',
    selectedItemId: null,
    editingItem: null,
    clipboardNotification: null,
    searchQuery: '',
    filterOnlyFavorites: false,
    filterOnlyTrash: false,
    activeFolderId: null,
  }),

  unlockVault: (masterPassword) => {
    // Phase 01: mock verification (accepts non-empty password)
    if (!masterPassword || masterPassword.length >= 4) {
      set({ vaultStatus: 'unlocked', activeView: 'dashboard' });
      return true;
    }
    return false;
  },

  initializeVault: (_masterPassword) => {
    set({
      vaultStatus: 'unlocked',
      activeView: 'dashboard',
      recentActivity: [
        { id: 'init-1', action: 'Bóveda maestra inicializada con Argon2id + XChaCha20-Poly1305', timestamp: 'Ahora' },
        ...get().recentActivity
      ]
    });
  },

  updateSettings: (newSettings) => set((state) => {
    const updated = { ...state.settings, ...newSettings };
    if (newSettings.theme) {
      const root = document.documentElement;
      if (newSettings.theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    return { settings: updated };
  }),

  copySecureValue: async (text: string, label: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      set({ clipboardNotification: `${label} copiado. Se borrará en ${get().settings.clipboardClearSeconds}s.` });
      setTimeout(() => {
        set({ clipboardNotification: null });
      }, 3500);
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
