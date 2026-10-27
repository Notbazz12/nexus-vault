import React from 'react';
import {
  Home,
  Globe,
  FileText,
  CreditCard,
  MapPin,
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
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { ViewType } from '../types';
import { cn } from '../lib/utils';

type NavEntry = { key: string; label: string; icon: React.ElementType; onClick: () => void; active: boolean; badge?: number; alert?: boolean };

const NavButton: React.FC<{ entry: NavEntry }> = ({ entry }) => {
  const Icon = entry.icon;
  return (
    <button
      onClick={entry.onClick}
      aria-current={entry.active ? 'page' : undefined}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors',
        entry.active
          ? 'bg-rail-ink text-rail font-semibold'
          : 'text-rail-ink/80 hover:text-rail-ink hover:bg-rail-ink/10'
      )}
    >
      <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden />
      <span className="truncate">{entry.label}</span>
      {entry.badge !== undefined && entry.badge > 0 && (
        <span
          className={cn(
            'ml-auto text-[11px] tabular-nums px-1.5 rounded-full font-semibold',
            entry.alert ? 'bg-cyber-red text-white' : entry.active ? 'bg-rail/10' : 'text-rail-ink/70'
          )}
        >
          {entry.badge}
        </span>
      )}
    </button>
  );
};

const Group: React.FC<{ title?: string; entries: NavEntry[] }> = ({ title, entries }) => (
  <div>
    {title && <div className="px-3 pb-1.5 text-[11px] font-semibold text-rail-ink/60">{title}</div>}
    <nav className="space-y-0.5">
      {entries.map((e) => (
        <NavButton key={e.key} entry={e} />
      ))}
    </nav>
  </div>
);

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
  const live = items.filter((it) => !it.isTrashed);
  const count = (type: string) => live.filter((it) => it.type === type).length;
  const noFilter = !filterOnlyFavorites && !filterOnlyTrash && !activeFolderId;

  const view = (v: ViewType, label: string, icon: React.ElementType, extra: Partial<NavEntry> = {}): NavEntry => ({
    key: v,
    label,
    icon,
    onClick: () => setView(v),
    active: activeView === v && noFilter,
    ...extra,
  });

  const vault: NavEntry[] = [
    view('dashboard', 'Inicio', Home),
    view('passwords', 'Sitios web y apps', Globe, { badge: count('login') }),
    view('cards', 'Tarjetas bancarias', CreditCard, { badge: count('card') }),
    view('identities', 'Direcciones', MapPin, { badge: count('identity') }),
    view('notes', 'Notas', FileText, { badge: count('note') }),
  ];

  const tools: NavEntry[] = [
    view('security-center', 'Revisar contraseñas', ShieldCheck, {
      badge: health.weakCount + health.reusedCount,
      alert: health.weakCount + health.reusedCount > 0,
    }),
    view('generator', 'Generador', Sparkles),
  ];

  const filters: NavEntry[] = [
    { key: 'fav', label: 'Favoritos', icon: Star, onClick: () => setFilterFavorites(true), active: filterOnlyFavorites, badge: live.filter((it) => it.isFavorite).length },
    ...folders.map((f) => ({
      key: f.id,
      label: f.name,
      icon: FolderIcon,
      onClick: () => setActiveFolder(f.id),
      active: activeFolderId === f.id,
      badge: live.filter((it) => it.folderId === f.id).length,
    })),
    { key: 'trash', label: 'Papelera', icon: Trash2, onClick: () => setFilterTrash(true), active: filterOnlyTrash, badge: items.length - live.length },
  ];

  const system: NavEntry[] = [
    view('import-export', 'Importar / Exportar', ArrowLeftRight),
    view('backups', 'Copias de seguridad', HardDrive),
    view('settings', 'Ajustes', Settings),
  ];

  return (
    <aside className="w-64 h-screen bg-rail text-rail-ink flex flex-col shrink-0 select-none">
      <div className="h-16 px-5 flex items-center gap-2.5 shrink-0">
        <Shield className="w-6 h-6" aria-hidden />
        <span className="text-[15px] font-semibold tracking-tight">Nexus Vault</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        <Group entries={vault} />
        <Group title="Herramientas" entries={tools} />
        <Group title="Organizar" entries={filters} />
        <Group title="Sistema" entries={system} />
      </div>

      <div className="p-3 shrink-0">
        <button
          onClick={lockVault}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold bg-rail-ink/10 hover:bg-rail-ink/20 transition-colors"
          title="Bloquear la bóveda (Ctrl+L)"
        >
          <Lock className="w-[18px] h-[18px]" aria-hidden />
          <span>Bloquear</span>
          <kbd className="ml-auto text-[11px] font-sans text-rail-ink/60">Ctrl+L</kbd>
        </button>
      </div>
    </aside>
  );
};
