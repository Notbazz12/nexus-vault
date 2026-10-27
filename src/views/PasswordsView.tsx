import React, { useState } from 'react';
import {
  Copy,
  Star,

  ArrowUpDown,
  Check,
  AlertTriangle,
  SearchX
} from 'lucide-react';
import { Monogram } from '../components/Monogram';
import { useVaultStore } from '../store/useVaultStore';
import { ItemDetailPanel } from '../components/ItemDetailPanel';
import { calculateEntropy, cn } from '../lib/utils';
import { LoginItem } from '../types';

export const PasswordsView: React.FC = () => {
  const {
    getFilteredItems,
    selectedItemId,
    selectItem,
    toggleFavorite,
    copySecureValue,
    folders,
  } = useVaultStore();

  const [sortBy, setSortBy] = useState<'title-asc' | 'title-desc' | 'date-desc' | 'strength-asc'>('title-asc');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredItems = getFilteredItems().filter((it): it is LoginItem => it.type === 'login');

  // Sorting
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
    if (sortBy === 'title-desc') return b.title.localeCompare(a.title);
    if (sortBy === 'date-desc') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (sortBy === 'strength-asc') {
      return calculateEntropy(a.password).bits - calculateEntropy(b.password).bits;
    }
    return 0;
  });

  const selectedItem = sortedItems.find((it) => it.id === selectedItemId) || sortedItems[0] || null;

  const handleCopyPassword = async (e: React.MouseEvent, login: LoginItem) => {
    e.stopPropagation();
    await copySecureValue(login.password, 'Contraseña');
    setCopiedId(login.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden select-none">
      {/* Left List Pane */}
      <div className="flex-1 flex flex-col h-full border-r border-nexus-750/70 overflow-hidden">
        {/* Sub-header controls */}
        <div className="h-10 px-4 border-b border-nexus-750/70 bg-nexus-900/50 flex items-center justify-between text-xs text-nexus-400">
          <div className="font-mono text-[11px]">
            {sortedItems.length} {sortedItems.length === 1 ? 'registro' : 'registros'}
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-nexus-800 border border-nexus-700 rounded px-2 py-0.5 text-xs text-nexus-200 focus:outline-none focus:border-cyan-accent font-sans"
            >
              <option value="title-asc">Nombre (A - Z)</option>
              <option value="title-desc">Nombre (Z - A)</option>
              <option value="date-desc">Más recientes</option>
              <option value="strength-asc">Menor fortaleza primero</option>
            </select>
          </div>
        </div>

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-nexus-800/60">
          {sortedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-nexus-500 space-y-2">
              <SearchX className="w-10 h-10 text-nexus-700" />
              <p className="text-xs font-medium text-nexus-400">No se encontraron contraseñas</p>
              <p className="text-[11px] text-nexus-500 max-w-xs">
                Ajusta los términos de búsqueda o cambia el filtro seleccionado en el menú lateral.
              </p>
            </div>
          ) : (
            sortedItems.map((login) => {
              const isSelected = selectedItem?.id === login.id;
              const entropy = calculateEntropy(login.password);
              const folder = folders.find((f) => f.id === login.folderId);
              const isWeak = entropy.bits < 50;

              return (
                <div
                  key={login.id}
                  onClick={() => selectItem(login.id)}
                  className={cn(
                    'p-3.5 flex items-center justify-between cursor-pointer transition-all group',
                    isSelected
                      ? 'bg-nexus-800/90 border-l-2 border-l-cyan-accent'
                      : 'hover:bg-nexus-850/60'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Monogram title={login.title} />

                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-nexus-100 truncate group-hover:text-cyan-accent transition-colors">
                          {login.title}
                        </span>
                        {login.isFavorite && (
                          <Star className="w-3 h-3 text-cyber-amber fill-cyber-amber shrink-0" />
                        )}
                        {isWeak && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyber-amber/15 text-cyber-amber border border-cyber-amber/30 flex items-center gap-0.5 shrink-0">
                            <AlertTriangle className="w-2.5 h-2.5" /> Débil
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-nexus-400 font-mono truncate mt-0.5">
                        <span className="truncate">{login.username || login.email || 'Sin usuario'}</span>
                        {folder && (
                          <>
                            <span className="text-nexus-600">•</span>
                            <span className="text-nexus-500 truncate">{folder.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(login.id);
                      }}
                      className="p-1.5 rounded-lg text-nexus-500 hover:text-cyber-amber transition-colors"
                      title="Favorito"
                    >
                      <Star className={`w-3.5 h-3.5 ${login.isFavorite ? 'text-cyber-amber fill-cyber-amber' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => handleCopyPassword(e, login)}
                      className="p-1.5 rounded-lg bg-nexus-800/80 hover:bg-cyan-accent/20 text-nexus-300 hover:text-cyan-accent transition-all"
                      title="Copiar contraseña"
                    >
                      {copiedId === login.id ? (
                        <Check className="w-3.5 h-3.5 text-cyan-accent" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Detail Pane */}
      <ItemDetailPanel item={selectedItem} />
    </div>
  );
};
