import React from 'react';
import {
  ShieldAlert,
  KeyRound,
  AlertTriangle,
  Clock,
  Copy,
  Star,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Activity,
  History,
  CheckCircle2
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { LoginItem } from '../types';

export const DashboardView: React.FC = () => {
  const { items, setView, selectItem, copySecureValue, recentActivity, getSecurityHealth } = useVaultStore();

  const health = getSecurityHealth();
  const favoriteItems = items.filter((it): it is LoginItem => it.type === 'login' && it.isFavorite && !it.isTrashed);

  const getHealthColor = (score: number) => {
    if (score >= 85) return 'rgb(var(--accent))';
    if (score >= 65) return 'rgb(var(--ok))';
    if (score >= 45) return 'rgb(var(--warn))';
    return 'rgb(var(--danger))';
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none">
      {/* Top Welcome / Security Status Banner */}
      <div className="p-6 rounded-2xl bg-nexus-850 border border-nexus-750 relative overflow-hidden shadow-cyber-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-nexus-100 tracking-tight">
              Estado de tu bóveda
            </h1>
            <p className="text-xs text-nexus-400 max-w-xl leading-relaxed">
              Tus credenciales y datos confidenciales se encuentran protegidos con cifrado XChaCha20-Poly1305.
              Revisa periódicamente el estado de seguridad de tus accesos.
            </p>
          </div>

          {/* Safe Score Gauge */}
          <div className="flex items-center gap-4 bg-nexus-950/70 p-4 rounded-xl border border-nexus-750 shrink-0">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-nexus-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  strokeDasharray={`${health.safeScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke={getHealthColor(health.safeScore)}
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-mono text-base font-extrabold text-nexus-100">
                {health.safeScore}%
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold text-nexus-200">Índice de Salud</div>
              <div className="text-[11px] text-nexus-400">
                {health.safeScore >= 80 ? 'Protección Alta' : 'Atención Requerida'}
              </div>
              <button
                onClick={() => setView('security-center')}
                className="text-[10px] text-cyan-accent hover:underline flex items-center gap-0.5 mt-0.5 font-medium"
              >
                Auditar Bóveda <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Passwords */}
        <div
          onClick={() => setView('passwords')}
          className="p-4 rounded-xl bg-nexus-900/80 border border-nexus-750 hover:border-nexus-650 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-nexus-400 mb-2">
            <span className="text-xs font-medium">Total Contraseñas</span>
            <div className="p-2 rounded-lg bg-nexus-800 text-cyan-accent group-hover:scale-105 transition-transform">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-nexus-100">{health.totalPasswords}</div>
          <div className="text-[11px] text-nexus-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-cyber-green" /> Cifradas localmente
          </div>
        </div>

        {/* Reused Passwords */}
        <div
          onClick={() => setView('security-center')}
          className="p-4 rounded-xl bg-nexus-900/80 border border-nexus-750 hover:border-cyber-red/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-nexus-400 mb-2">
            <span className="text-xs font-medium">Reutilizadas</span>
            <div className="p-2 rounded-lg bg-cyber-red/15 text-cyber-red group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-cyber-red">{health.reusedCount}</div>
          <div className="text-[11px] text-nexus-500 mt-1 flex items-center gap-1">
            Vulnerables a filtración cruzada
          </div>
        </div>

        {/* Weak Passwords */}
        <div
          onClick={() => setView('security-center')}
          className="p-4 rounded-xl bg-nexus-900/80 border border-nexus-750 hover:border-cyber-amber/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-nexus-400 mb-2">
            <span className="text-xs font-medium">Contraseñas Débiles</span>
            <div className="p-2 rounded-lg bg-cyber-amber/15 text-cyber-amber group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-cyber-amber">{health.weakCount}</div>
          <div className="text-[11px] text-nexus-500 mt-1 flex items-center gap-1">
            Entropía &lt; 50 bits
          </div>
        </div>

        {/* Old Passwords */}
        <div
          onClick={() => setView('security-center')}
          className="p-4 rounded-xl bg-nexus-900/80 border border-nexus-750 hover:border-nexus-650 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-nexus-400 mb-2">
            <span className="text-xs font-medium">Más de 1 Año</span>
            <div className="p-2 rounded-lg bg-nexus-800 text-nexus-300 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-nexus-200">{health.oldCount}</div>
          <div className="text-[11px] text-nexus-500 mt-1 flex items-center gap-1">
            Rotación recomendada
          </div>
        </div>
      </div>

      {/* Two Column Layout: Favorites & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick Access Favorites */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-cyber-amber fill-cyber-amber" />
              <h3 className="text-sm font-semibold text-nexus-100">
                Accesos Favoritos Rápidos
              </h3>
            </div>
            <button
              onClick={() => setView('passwords')}
              className="text-xs text-cyan-accent hover:underline flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {favoriteItems.slice(0, 4).map((fav) => (
              <div
                key={fav.id}
                className="p-3.5 rounded-xl bg-nexus-900/90 border border-nexus-750 hover:border-cyan-accent/40 transition-all space-y-2 group"
              >
                <div className="flex items-start justify-between">
                  <div
                    onClick={() => {
                      selectItem(fav.id);
                      setView('passwords');
                    }}
                    className="cursor-pointer"
                  >
                    <div className="text-xs font-bold text-nexus-100 group-hover:text-cyan-accent transition-colors truncate max-w-[160px]">
                      {fav.title}
                    </div>
                    <div className="text-[11px] font-mono text-nexus-400 truncate max-w-[160px]">
                      {fav.username || fav.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copySecureValue(fav.password, 'Contraseña')}
                      className="p-1.5 rounded-lg bg-nexus-800 hover:bg-cyan-accent/20 text-nexus-300 hover:text-cyan-accent transition-all"
                      title="Copiar contraseña"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {fav.url && (
                      <a
                        href={fav.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-nexus-800 hover:bg-nexus-700 text-nexus-400 hover:text-nexus-200"
                        title="Ir al sitio"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Security & Local Activity */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-accent" />
            <h3 className="text-sm font-semibold text-nexus-100">
              Actividad Local Reciente
            </h3>
          </div>

          <div className="p-4 rounded-xl bg-nexus-900/90 border border-nexus-750 space-y-3">
            {recentActivity.map((act) => (
              <div key={act.id} className="flex items-start gap-2.5 text-xs pb-2 border-b border-nexus-800 last:border-0 last:pb-0">
                <History className="w-3.5 h-3.5 text-nexus-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-nexus-200 text-[11px] leading-snug">{act.action}</div>
                  <div className="text-[9px] font-mono text-nexus-500 mt-0.5">{act.timestamp}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Generator Promo Card */}
          <div className="p-4 rounded-xl bg-nexus-850 border border-cyan-accent/20 space-y-2">
            <div className="flex items-center gap-2 text-cyan-accent font-semibold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Generador de Contraseñas</span>
            </div>
            <p className="text-[11px] text-nexus-400 leading-snug">
              Crea claves de hasta 128 caracteres con entropía criptográfica garantizada.
            </p>
            <button
              onClick={() => setView('generator')}
              className="w-full py-1.5 px-3 rounded-lg bg-nexus-800 hover:bg-nexus-750 text-cyan-accent border border-cyan-accent/30 text-xs font-medium transition-all"
            >
              Abrir Generador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
