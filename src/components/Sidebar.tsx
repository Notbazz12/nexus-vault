import React from 'react';
import {
  LayoutDashboard,
  KeyRound,
  FileText,
  CreditCard,
  ShieldCheck,
  Sparkles,
  ArrowLeftRight,
  HardDrive,
  Settings,
  Lock,
  Star,
  Trash2,
  Folder as FolderIcon,
  Shield,
  Layers
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { ViewType } from '../types';
import { cn } from '../lib/utils';

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setView,
    folders,
    activeFolderId,
    setActiveFolder,
    filterOnlyFavorites,
    setFilterFavorites,
    filterOnlyTrash,
    setFilterTrash,
    items,
    lockVault,
    getSecurityHealth,
  } = useVaultStore();

  const health = getSecurityHealth();
  const trashedCount = items.filter((it) => it.isTrashed).length;
  const favoritesCount = items.filter((it) => it.isFavorite && !it.isTrashed).length;

  const navItems: Array<{ view: ViewType; label: string; icon: React.ElementType; badge?: number; alert?: boolean }> = [
    { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'passwords', label: 'Contraseñas', icon: KeyRound, badge: health.totalPasswords },
    { view: 'generator', label: 'Generador', icon: Sparkles },
    { view: 'notes', label: 'Notas Seguras', icon: FileText, badge: items.filter((it) => it.type === 'note' && !it.isTrashed).length },
    { view: 'cards', label: 'Tarjetas & Datos', icon: CreditCard, badge: items.filter((it) => (it.type === 'card' || it.type === 'identity') && !it.isTrashed).length },
    {
      view: 'security-center',
      label: 'Centro de Seguridad',
      icon: ShieldCheck,
      badge: health.weakCount + health.reusedCount + health.oldCount,
      alert: (health.weakCount + health.reusedCount) > 0,
    },
  ];

  const toolsItems: Array<{ view: ViewType; label: string; icon: React.ElementType }> = [
    { view: 'import-export', label: 'Importar / Exportar', icon: ArrowLeftRight },
    { view: 'backups', label: 'Copias de Seguridad', icon: HardDrive },
    { view: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen bg-nexus-900 border-r border-nexus-750 flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-nexus-750/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-accent/20 via-electric-blue/30 to-nexus-800 border border-cyan-accent/40 flex items-center justify-center shadow-cyber-cyan">
            <Shield className="w-5 h-5 text-cyan-accent" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider text-nexus-100 flex items-center gap-1.5 font-mono">
              NEXUS<span className="text-cyan-accent">VAULT</span>
            </h1>
            <p className="text-[10px] text-nexus-400 font-mono tracking-tight flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              XChaCha20-Poly1305
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {/* Core Sections */}
        <div>
          <div className="text-[11px] font-semibold text-nexus-500 uppercase tracking-wider px-2.5 mb-1.5">
            Bóveda Principal
          </div>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.view && !filterOnlyFavorites && !filterOnlyTrash && !activeFolderId;

              return (
                <button
                  key={item.view}
                  onClick={() => setView(item.view)}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all group',
                    isActive
                      ? 'bg-nexus-800 text-cyan-accent border border-cyan-accent/20 shadow-sm shadow-cyan-accent/5'
                      : 'text-nexus-300 hover:text-nexus-100 hover:bg-nexus-800/60'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn('w-4 h-4 transition-colors', isActive ? 'text-cyan-accent' : 'text-nexus-400 group-hover:text-nexus-200')} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={cn(
                        'text-[10px] font-mono px-1.5 py-0.5 rounded-full font-semibold',
                        item.alert
                          ? 'bg-cyber-red/20 text-cyber-red border border-cyber-red/30'
                          : isActive
                          ? 'bg-cyan-accent/15 text-cyan-accent'
                          : 'bg-nexus-750 text-nexus-400'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Filters */}
        <div>
          <div className="text-[11px] font-semibold text-nexus-500 uppercase tracking-wider px-2.5 mb-1.5">
            Filtros Rápidos
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => setFilterFavorites(true)}
              className={cn(
                'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group',
                filterOnlyFavorites
                  ? 'bg-nexus-800 text-amber-400 border border-amber-400/20'
                  : 'text-nexus-300 hover:text-nexus-100 hover:bg-nexus-800/60'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Star className={cn('w-4 h-4', filterOnlyFavorites ? 'text-amber-400 fill-amber-400' : 'text-nexus-400 group-hover:text-amber-400')} />
                <span>Favoritos</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-nexus-750 text-nexus-400">
                {favoritesCount}
              </span>
            </button>

            <button
              onClick={() => setFilterTrash(true)}
              className={cn(
                'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group',
                filterOnlyTrash
                  ? 'bg-nexus-800 text-cyber-red border border-cyber-red/20'
                  : 'text-nexus-300 hover:text-nexus-100 hover:bg-nexus-800/60'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className={cn('w-4 h-4', filterOnlyTrash ? 'text-cyber-red' : 'text-nexus-400 group-hover:text-cyber-red')} />
                <span>Papelera</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-nexus-750 text-nexus-400">
                {trashedCount}
              </span>
            </button>
          </div>
        </div>

        {/* Folders */}
        <div>
          <div className="text-[11px] font-semibold text-nexus-500 uppercase tracking-wider px-2.5 mb-1.5 flex items-center justify-between">
            <span>Carpetas</span>
            <Layers className="w-3 h-3 text-nexus-500" />
          </div>
          <div className="space-y-0.5">
            {folders.map((folder) => {
              const isSelected = activeFolderId === folder.id;
              const count = items.filter((it) => it.folderId === folder.id && !it.isTrashed).length;

              return (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolder(folder.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group',
                    isSelected
                      ? 'bg-nexus-800 text-cyan-accent border border-cyan-accent/20'
                      : 'text-nexus-300 hover:text-nexus-100 hover:bg-nexus-800/60'
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FolderIcon className={cn('w-3.5 h-3.5 shrink-0', isSelected ? 'text-cyan-accent' : 'text-nexus-400 group-hover:text-nexus-200')} />
                    <span className="truncate">{folder.name}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-nexus-750 text-nexus-400 ml-1 shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tools & Settings */}
        <div>
          <div className="text-[11px] font-semibold text-nexus-500 uppercase tracking-wider px-2.5 mb-1.5">
            Sistema
          </div>
          <div className="space-y-0.5">
            {toolsItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.view;

              return (
                <button
                  key={item.view}
                  onClick={() => setView(item.view)}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group',
                    isActive
                      ? 'bg-nexus-800 text-cyan-accent border border-cyan-accent/20'
                      : 'text-nexus-300 hover:text-nexus-100 hover:bg-nexus-800/60'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn('w-4 h-4', isActive ? 'text-cyan-accent' : 'text-nexus-400 group-hover:text-nexus-200')} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lock Footer */}
      <div className="p-3 border-t border-nexus-750/70 bg-nexus-950/40">
        <button
          onClick={lockVault}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-nexus-800/80 hover:bg-cyber-red/15 text-nexus-300 hover:text-cyber-red border border-nexus-750 hover:border-cyber-red/30 text-xs font-medium transition-all shadow-sm group"
          title="Bloquear la bóveda y borrar material criptográfico de la memoria RAM"
        >
          <Lock className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span>Bloquear Bóveda</span>
          <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-nexus-900 border border-nexus-700 text-nexus-400 ml-auto">
            Ctrl+L
          </span>
        </button>
      </div>
    </aside>
  );
};
