import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  Edit,
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { calculateEntropy } from '../lib/utils';
import { LoginItem } from '../types';

export const SecurityCenterView: React.FC = () => {
  const { items, setEditingItem, selectItem, getSecurityHealth } = useVaultStore();

  const [activeTab, setActiveTab] = useState<'reused' | 'weak' | 'old'>('reused');
  const [isAuditing, setIsAuditing] = useState(false);

  const health = getSecurityHealth();
  const activeLogins = items.filter((it): it is LoginItem => it.type === 'login' && !it.isTrashed);

  // Reused analysis
  const passwordMap: Record<string, LoginItem[]> = {};
  for (const login of activeLogins) {
    if (login.password) {
      if (!passwordMap[login.password]) passwordMap[login.password] = [];
      passwordMap[login.password].push(login);
    }
  }

  const reusedGroups = Object.entries(passwordMap)
    .filter(([_, group]) => group.length > 1)
    .map(([password, group]) => ({ password, items: group }));

  // Weak analysis
  const weakItems = activeLogins.filter((login) => {
    const entropy = calculateEntropy(login.password);
    return entropy.bits < 50;
  });

  // Old analysis (> 365 days)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oldItems = activeLogins.filter((login) => new Date(login.updatedAt) < oneYearAgo);

  const handleFixItem = (item: LoginItem) => {
    selectItem(item.id);
    setEditingItem(item);
  };

  const runLiveAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
    }, 600);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 select-none bg-nexus-950 space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-nexus-900 via-nexus-850 to-cyber-amber/10 border border-nexus-750 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyber-amber/15 border border-cyber-amber/30 text-[11px] font-mono text-cyber-amber">
            <ShieldAlert className="w-3.5 h-3.5" />
            Auditoría en Memoria RAM
          </div>
          <h2 className="text-xl font-bold text-nexus-100 font-mono">
            Centro de Seguridad & Vulnerabilidades
          </h2>
          <p className="text-xs text-nexus-400 max-w-xl">
            Inspección exhaustiva de higiene criptográfica. Los resultados se calculan al vuelo y se destruyen al bloquear la bóveda.
          </p>
        </div>

        <button
          onClick={runLiveAudit}
          disabled={isAuditing}
          className="px-4 py-2 rounded-xl bg-nexus-800 hover:bg-nexus-750 border border-cyan-accent/30 text-cyan-accent font-semibold text-xs transition-all flex items-center gap-2 self-start md:self-auto shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
          <span>{isAuditing ? 'Auditando...' : 'Re-analizar Bóveda'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setActiveTab('reused')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === 'reused'
              ? 'bg-nexus-900 border-cyber-red/50 shadow-sm'
              : 'bg-nexus-900/40 border-nexus-750 hover:bg-nexus-850'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-nexus-300">Contraseñas Repetidas</span>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-cyber-red/20 text-cyber-red font-bold">
              {health.reusedCount}
            </span>
          </div>
          <p className="text-[11px] text-nexus-500 mt-1">Riesgo crítico de compromiso cruzado</p>
        </button>

        <button
          onClick={() => setActiveTab('weak')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === 'weak'
              ? 'bg-nexus-900 border-cyber-amber/50 shadow-sm'
              : 'bg-nexus-900/40 border-nexus-750 hover:bg-nexus-850'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-nexus-300">Contraseñas Débiles</span>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-cyber-amber/20 text-cyber-amber font-bold">
              {health.weakCount}
            </span>
          </div>
          <p className="text-[11px] text-nexus-500 mt-1">Entropía menor a 50 bits</p>
        </button>

        <button
          onClick={() => setActiveTab('old')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === 'old'
              ? 'bg-nexus-900 border-cyan-accent/50 shadow-sm'
              : 'bg-nexus-900/40 border-nexus-750 hover:bg-nexus-850'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-nexus-300">Contraseñas Antiguas</span>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-nexus-800 text-nexus-300 font-bold">
              {health.oldCount}
            </span>
          </div>
          <p className="text-[11px] text-nexus-500 mt-1">Sin actualizar en más de 365 días</p>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-4">
        {activeTab === 'reused' && (
          <div className="space-y-3">
            {reusedGroups.length === 0 ? (
              <div className="p-8 rounded-xl bg-nexus-900 border border-nexus-750 text-center text-xs text-nexus-400">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                No tienes contraseñas repetidas en tu bóveda. Excelente higiene.
              </div>
            ) : (
              reusedGroups.map((grp, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-nexus-900 border border-cyber-red/30 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyber-red font-semibold flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" /> Misma contraseña compartida en {grp.items.length} servicios:
                    </span>
                    <span className="text-nexus-400">••••••••••••••</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {grp.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg bg-nexus-850 border border-nexus-750 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-nexus-100">{item.title}</div>
                          <div className="text-[11px] font-mono text-nexus-400">{item.username || item.email}</div>
                        </div>
                        <button
                          onClick={() => handleFixItem(item)}
                          className="px-2.5 py-1 rounded bg-cyan-accent/15 hover:bg-cyan-accent/25 text-cyan-accent text-xs font-semibold flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Corregir</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'weak' && (
          <div className="space-y-3">
            {weakItems.length === 0 ? (
              <div className="p-8 rounded-xl bg-nexus-900 border border-nexus-750 text-center text-xs text-nexus-400">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                Todas tus contraseñas cumplen con el umbral mínimo de entropía.
              </div>
            ) : (
              weakItems.map((item) => {
                const entropy = calculateEntropy(item.password);

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-nexus-900 border border-cyber-amber/30 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-xs font-bold text-nexus-100 flex items-center gap-2">
                        <span>{item.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyber-amber/20 text-cyber-amber">
                          {entropy.bits} bits • {entropy.label}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-nexus-400 mt-0.5">
                        {item.username || item.email}
                      </div>
                    </div>
                    <button
                      onClick={() => handleFixItem(item)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-accent text-nexus-950 font-bold text-xs hover:brightness-110 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generar Fuerte</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'old' && (
          <div className="space-y-3">
            {oldItems.length === 0 ? (
              <div className="p-8 rounded-xl bg-nexus-900 border border-nexus-750 text-center text-xs text-nexus-400">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                No tienes contraseñas con más de 1 año sin actualizar.
              </div>
            ) : (
              oldItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-nexus-900 border border-nexus-750 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-xs font-bold text-nexus-100">{item.title}</div>
                    <div className="text-[11px] font-mono text-nexus-400 mt-0.5">
                      Última modificación: {new Date(item.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleFixItem(item)}
                    className="px-3 py-1.5 rounded-lg bg-nexus-800 hover:bg-nexus-750 text-cyan-accent font-semibold text-xs border border-cyan-accent/30 flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Rotar Clave</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Privacy Notice on External Leaks */}
      <div className="p-4 rounded-xl bg-nexus-900/50 border border-nexus-800 flex items-start gap-3 text-xs text-nexus-400">
        <Info className="w-4 h-4 text-cyan-accent shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-nexus-200">Verificación de Filtraciones Externa (HIBP): </span>
          Cualquier consulta externa es 100% opcional y utiliza el modelo de <em>k-anonymity</em>.
          NEXUS VAULT nunca enviará contraseñas ni hashes completos a la red.
        </div>
      </div>
    </div>
  );
};
