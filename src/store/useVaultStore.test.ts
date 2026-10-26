import { describe, it, expect, beforeEach } from 'vitest';
import { useVaultStore } from './useVaultStore';
import { INITIAL_ITEMS, INITIAL_FOLDERS } from '../mock/vaultData';
import { LoginItem } from '../types';

describe('Gestor de Estado de Bóveda (Zustand Store)', () => {
  beforeEach(() => {
    // Reset store state
    useVaultStore.setState({
      activeView: 'dashboard',
      selectedItemId: null,
      editingItem: null,
      searchQuery: '',
      filterOnlyFavorites: false,
      filterOnlyTrash: false,
      activeFolderId: null,
      vaultStatus: 'unlocked',
      items: JSON.parse(JSON.stringify(INITIAL_ITEMS)),
      folders: JSON.parse(JSON.stringify(INITIAL_FOLDERS)),
    });
  });

  it('Calcula correctamente el resumen de salud de contraseñas de la bóveda', () => {
    const health = useVaultStore.getState().getSecurityHealth();
    expect(health.totalPasswords).toBeGreaterThan(0);
    expect(health.reusedCount).toBeGreaterThanOrEqual(2); // Stripe and PayPal mock share password
    expect(health.weakCount).toBeGreaterThanOrEqual(1); // Router Mikrotik mock
    expect(health.safeScore).toBeLessThanOrEqual(100);
    expect(health.safeScore).toBeGreaterThanOrEqual(10);
  });

  it('Filtra correctamente por favoritos y por papelera', () => {
    // Favorites
    useVaultStore.getState().setFilterFavorites(true);
    const favs = useVaultStore.getState().getFilteredItems();
    favs.forEach((item) => {
      expect(item.isFavorite).toBe(true);
      expect(item.isTrashed).toBe(false);
    });

    // Trash
    useVaultStore.getState().setFilterTrash(true);
    const trashed = useVaultStore.getState().getFilteredItems();
    trashed.forEach((item) => {
      expect(item.isTrashed).toBe(true);
    });
  });

  it('Realiza operaciones CRUD completas y duplicación de ítems', () => {
    const store = useVaultStore.getState();
    const testItem: LoginItem = {
      id: 'test-crud-item',
      type: 'login',
      title: 'Servicio de Prueba Unitario',
      username: 'testuser',
      email: 'test@example.com',
      password: 'Strong#Password!999',
      url: 'https://example.com',
      notes: 'Notas de prueba',
      category: 'Test',
      folderId: null,
      isFavorite: false,
      isTrashed: false,
      tags: ['test'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save (Create)
    store.saveItem(testItem);
    let found = useVaultStore.getState().items.find((i) => i.id === testItem.id);
    expect(found).toBeDefined();
    expect(found?.title).toBe('Servicio de Prueba Unitario');

    // Duplicate
    useVaultStore.getState().duplicateItem(testItem.id);
    const duplicates = useVaultStore.getState().items.filter((i) => i.title.includes('Servicio de Prueba Unitario'));
    expect(duplicates.length).toBe(2);

    // Move to trash
    useVaultStore.getState().moveToTrash(testItem.id);
    found = useVaultStore.getState().items.find((i) => i.id === testItem.id);
    expect(found?.isTrashed).toBe(true);

    // Restore from trash
    useVaultStore.getState().restoreFromTrash(testItem.id);
    found = useVaultStore.getState().items.find((i) => i.id === testItem.id);
    expect(found?.isTrashed).toBe(false);

    // Delete permanently
    useVaultStore.getState().deletePermanently(testItem.id);
    found = useVaultStore.getState().items.find((i) => i.id === testItem.id);
    expect(found).toBeUndefined();
  });

  it('Gestiona transiciones seguras de bloqueo y desbloqueo de la bóveda', () => {
    // Lock
    useVaultStore.getState().lockVault();
    expect(useVaultStore.getState().vaultStatus).toBe('locked');
    expect(useVaultStore.getState().activeView).toBe('unlock');

    // Unlock
    const success = useVaultStore.getState().unlockVault('master-password-1234');
    expect(success).toBe(true);
    expect(useVaultStore.getState().vaultStatus).toBe('unlocked');
    expect(useVaultStore.getState().activeView).toBe('dashboard');
  });
});
