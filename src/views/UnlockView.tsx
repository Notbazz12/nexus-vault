import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';

export const UnlockView: React.FC = () => {
  const { unlockVault, setView } = useVaultStore();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut || busy) return;

    if (!password) {
      setError('Por favor introduce la contraseña maestra.');
      return;
    }

    setBusy(true);
    const success = await unlockVault(password);
    setBusy(false);
    if (success) {
      setPassword('');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setIsLockedOut(true);
        setError('Demasiados intentos fallidos. Retraso de seguridad activado por 10 segundos.');
        setTimeout(() => {
          setIsLockedOut(false);
          setError(null);
          setAttempts(0);
        }, 10000);
      } else {
        setError(`Contraseña maestra incorrecta. Intento ${newAttempts}/3.`);
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-nexus-950 flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
      {/* Subtle red/cyan security glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-accent/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-sm w-full space-y-6 relative z-10 text-center">
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-nexus-900 border border-nexus-750 flex items-center justify-center mx-auto text-cyan-accent shadow-cyber-card">
          <Lock className="w-8 h-8 text-cyan-accent animate-pulse" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-nexus-100 font-mono tracking-tight">
            Bóveda Bloqueada
          </h2>
          <p className="text-xs text-nexus-400">
            Introduce tu contraseña maestra para descifrar tu base de datos local en memoria RAM.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleUnlock} className="p-6 rounded-2xl bg-nexus-900/90 border border-nexus-750 shadow-cyber-card space-y-4 text-left">
          {error && (
            <div className="p-3 rounded-xl bg-cyber-red/15 border border-cyber-red/30 text-xs text-cyber-red flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-nexus-300 flex items-center justify-between">
              <span>Contraseña Maestra</span>
              <span className="text-[10px] text-nexus-500 font-mono">Argon2id KDF</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Escribe tu contraseña..."
                disabled={isLockedOut}
                autoFocus
                className="w-full bg-nexus-850 border border-nexus-700 rounded-xl px-3.5 py-2.5 text-xs text-nexus-100 placeholder-nexus-500 focus:outline-none focus:border-cyan-accent focus:ring-1 focus:ring-cyan-accent/30 font-mono tracking-wider pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-nexus-400 hover:text-nexus-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLockedOut || busy || password.length === 0}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-accent to-electric-blue text-nexus-950 font-bold text-xs hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-cyber-cyan flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>Desbloquear Bóveda</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-nexus-500 px-2">
          <button
            onClick={() => setView('welcome')}
            className="hover:text-nexus-300 transition-colors"
          >
            Reiniciar / Configuración inicial
          </button>
          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
            <ShieldAlert className="w-3 h-3" /> Memoria Zeroize
          </span>
        </div>
      </div>
    </div>
  );
};
