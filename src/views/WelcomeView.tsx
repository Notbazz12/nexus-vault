import React from 'react';
import { Shield, Lock, KeyRound, HardDrive, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';

export const WelcomeView: React.FC = () => {
  const { setView } = useVaultStore();

  return (
    <div className="min-h-screen w-full bg-nexus-950 flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
      {/* Background glow effects */}

      <div className="max-w-xl w-full text-center space-y-8 relative z-10">
        {/* Logo / Badge */}
        <div className="inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-cyan-accent/10 border-2 border-cyan-accent/40 flex items-center justify-center shadow-cyber-cyan">
            <Shield className="w-10 h-10 text-cyan-accent" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-nexus-100">
            NEXUS <span className="text-cyan-accent">VAULT</span>
          </h1>
          <p className="text-sm text-nexus-400 max-w-md mx-auto">
            Gestor de contraseñas profesional de conocimiento cero local. Criptografía de grado militar en tus manos.
          </p>
        </div>

        {/* Security Feature Grid */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="p-4 rounded-xl bg-nexus-900/80 border border-nexus-750 flex items-start gap-3">
            <Lock className="w-5 h-5 text-cyan-accent shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-nexus-100">Cifrado XChaCha20</div>
              <div className="text-[11px] text-nexus-400 mt-0.5 leading-snug">
                Protección autenticada Poly1305. Cada registro y metadato está cifrado.
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-nexus-900/80 border border-nexus-750 flex items-start gap-3">
            <KeyRound className="w-5 h-5 text-cyber-green shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-nexus-100">KDF Argon2id</div>
              <div className="text-[11px] text-nexus-400 mt-0.5 leading-snug">
                Derivación intensiva en memoria resistente a ataques por GPU y ASIC.
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-nexus-900/80 border border-nexus-750 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-cyan-accent shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-nexus-100">Zero-Knowledge Local</div>
              <div className="text-[11px] text-nexus-400 mt-0.5 leading-snug">
                Tus secretos nunca salen de tu ordenador. Cero servidores externos.
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-nexus-900/80 border border-nexus-750 flex items-start gap-3">
            <HardDrive className="w-5 h-5 text-cyan-accent shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-nexus-100">SQLite Transaccional</div>
              <div className="text-[11px] text-nexus-400 mt-0.5 leading-snug">
                Base de datos local robusta con respaldo y recuperación ante fallos.
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => setView('create-master')}
            className="w-full py-3 px-6 rounded-xl bg-cyan-accent hover:bg-electric-blue text-nexus-950 font-bold text-sm transition-all shadow-cyber-cyan flex items-center justify-center gap-2 group"
          >
            <span>Crear Nueva Bóveda Segura</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => setView('backups')}
            className="w-full py-2.5 px-6 rounded-xl bg-nexus-900 hover:bg-nexus-850 text-nexus-300 hover:text-nexus-100 border border-nexus-750 text-xs font-medium transition-all"
          >
            Restaurar desde un archivo de respaldo (.nexusbackup)
          </button>
        </div>

        <div className="text-[10px] text-nexus-500 font-mono">
          NEXUS VAULT Core v0.1.0 • Windows 10/11 & Linux • Licencia Ciberseguridad
        </div>
      </div>
    </div>
  );
};
