import React from 'react';
import { Search, Plus, Sparkles, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { LoginItem } from '../types';

export const Header: React.FC = () => {
  const {
    activeView,
    searchQuery,
    setSearchQuery,
    setEditingItem,
    setView,
    settings,
    updateSettings,
    clipboardNotification,
    activeFolderId,
    folders,
    filterOnlyFavorites,
    filterOnlyTrash,
  } = useVaultStore();

  const handleCreateNew = () => {
    const newItem: LoginItem = {
      id: 'item-' + Math.random().toString(36).substring(2, 9),
      type: 'login',
      title: '',
      username: '',
      email: '',
      password: '',
      url: '',
      notes: '',
      category: 'General',
      folderId: activeFolderId || null,
      isFavorite: false,
      isTrashed: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customFields: [],
    };
    setEditingItem(newItem);
  };

  const getBreadcrumbTitle = () => {
    if (filterOnlyFavorites) return 'Favoritos';
    if (filterOnlyTrash) return 'Papelera de Reciclaje';
    if (activeFolderId) {
      const folder = folders.find((f) => f.id === activeFolderId);
      return folder ? `Carpeta: ${folder.name}` : 'Carpeta';
    }

    switch (activeView) {
      case 'dashboard':
        return 'Inicio';
      case 'passwords':
        return 'Sitios web y apps';
      case 'notes':
        return 'Notas';
      case 'cards':
        return 'Tarjetas bancarias';
      case 'identities':
        return 'Direcciones';
      case 'generator':
        return 'Generador';
      case 'security-center':
        return 'Comprobación de contraseñas';
      case 'import-export':
        return 'Importación y Exportación';
      case 'backups':
        return 'Copias de Seguridad';
      case 'settings':
        return 'Ajustes';
      case 'edit-item':
        return 'Editor de Elemento';
      default:
        return 'Bóveda';
    }
  };

  return (
    <header className="h-16 border-b border-nexus-750 bg-nexus-850 px-6 flex items-center justify-between gap-4 shrink-0 select-none">
      {/* Title / Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <h2 className="text-base font-semibold text-nexus-100 truncate">
          {getBreadcrumbTitle()}
        </h2>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-xl relative">
        <Search className="w-4 h-4 text-nexus-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar en la bóveda"
          aria-label="Buscar en la bóveda"
          className="w-full bg-nexus-950 border border-nexus-750 rounded-full pl-10 pr-4 py-2.5 text-sm text-nexus-100 placeholder-nexus-500 focus:outline-none focus:border-cyan-accent focus:bg-nexus-850 transition-colors"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        {/* Quick Generator Shortcut */}
        <button
          onClick={() => setView('generator')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nexus-800 text-cyan-accent hover:bg-nexus-750 border border-cyan-accent/30 text-xs font-medium transition-all shadow-sm"
          title="Abrir generador criptográfico"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Generador</span>
        </button>

        {/* New Item Button */}
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-accent hover:bg-electric-blue text-nexus-950 font-semibold text-sm transition-colors"
          title="Agregar nueva credencial o nota"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Añadir</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() =>
            updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
          }
          className="p-2 rounded-lg bg-nexus-800/80 text-nexus-300 hover:text-nexus-100 border border-nexus-750 hover:bg-nexus-750 transition-all"
          title={`Cambiar a tema ${settings.theme === 'dark' ? 'claro' : 'oscuro'}`}
        >
          {settings.theme === 'dark' ? (
            <Sun className="w-4 h-4 text-cyber-amber" />
          ) : (
            <Moon className="w-4 h-4 text-nexus-400" />
          )}
        </button>
      </div>

      {/* Notification Toast */}
      {clipboardNotification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-nexus-850 border border-nexus-750 shadow-cyber-card text-sm text-nexus-100 font-medium">
          <CheckCircle2 className="w-4 h-4 text-cyan-accent shrink-0" />
          <span>{clipboardNotification}</span>
        </div>
      )}
    </header>
  );
};
