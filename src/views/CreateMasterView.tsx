import React, { useState } from 'react';
import { Shield, KeyRound, Eye, EyeOff, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { calculateEntropy } from '../lib/utils';

export const CreateMasterView: React.FC = () => {
  const { initializeVault, setView } = useVaultStore();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entropy = calculateEntropy(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isStrongEnough = entropy.bits >= 50;

  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Por favor introduce una contraseña maestra.');
      return;
    }
    if (password.length < 10) {
      setError('La contraseña maestra debe tener al menos 10 caracteres por seguridad.');
      return;
    }
    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!acknowledged) {
      setError('Debes confirmar que comprendes que no hay forma de recuperar la contraseña.');
      return;
    }

    setError(null);
    setBusy(true);
    try {
      await initializeVault(password);
    } catch (err) {
      setError(`No se pudo crear la bóveda: ${err}`);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-nexus-950 flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Back Link */}
        <button
          onClick={() => setView('welcome')}
          className="inline-flex items-center gap-1.5 text-xs text-nexus-400 hover:text-cyan-accent transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al inicio</span>
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-nexus-900 border border-cyan-accent/30 flex items-center justify-center mx-auto text-cyan-accent shadow-cyber-cyan">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-nexus-100 font-mono">
            Crear Contraseña Maestra
          </h2>
          <p className="text-xs text-nexus-400">
            Esta clave derivará tu KEK mediante Argon2id y protegerá toda tu información confidencial.
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-nexus-900/90 border border-nexus-750 shadow-cyber-card space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-cyber-red/15 border border-cyber-red/30 text-xs text-cyber-red flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Master Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-nexus-300">
              Contraseña Maestra
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Escribe una contraseña robusta..."
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

            {/* Entropy Progress Bar */}
            {password.length > 0 && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-nexus-400">Fortaleza estimada:</span>
                  <span style={{ color: entropy.color }} className="font-semibold">
                    {entropy.bits} bits • {entropy.label}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-nexus-800 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${entropy.score}%`,
                      backgroundColor: entropy.color,
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-nexus-300">
              Confirmar Contraseña Maestra
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Vuelve a escribir la contraseña..."
              className="w-full bg-nexus-850 border border-nexus-700 rounded-xl px-3.5 py-2.5 text-xs text-nexus-100 placeholder-nexus-500 focus:outline-none focus:border-cyan-accent focus:ring-1 focus:ring-cyan-accent/30 font-mono tracking-wider"
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-[10px] text-cyber-red">Las contraseñas no coinciden.</p>
            )}
          </div>

          {/* Warning Checkbox */}
          <div className="p-3 rounded-xl bg-nexus-850 border border-cyber-amber/30 text-[11px] text-nexus-300 space-y-2">
            <div className="flex items-start gap-2 text-cyber-amber font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Aviso Importante de Seguridad</span>
            </div>
            <p className="text-[10px] text-nexus-400 leading-normal">
              NEXUS VAULT opera bajo una arquitectura de conocimiento cero. Si pierdes tu contraseña maestra,
              es matemáticamente imposible recuperar tus datos. No existe soporte ni clave de rescate.
            </p>
            <label className="flex items-center gap-2 cursor-pointer pt-1 text-nexus-200">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="rounded border-nexus-700 text-cyan-accent focus:ring-0 bg-nexus-900"
              />
              <span className="text-[11px] font-medium">He anotado o memorizado mi contraseña maestra</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={busy || !passwordsMatch || !acknowledged || !isStrongEnough}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-accent to-electric-blue text-nexus-950 font-bold text-xs hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-cyber-cyan flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            <span>Inicializar Bóveda Cifrada</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
