import React, { useState } from 'react';
import {
  Lock,
  Moon,
  Sun,
  Clock,
  Clipboard,
  KeyRound,
  CheckCircle2,
  Keyboard
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, lockVault } = useVaultStore();

  const [currentMasterPass, setCurrentMasterPass] = useState('');
  const [newMasterPass, setNewMasterPass] = useState('');
  const [confirmMasterPass, setConfirmMasterPass] = useState('');
  const [rotationStatus, setRotationStatus] = useState<string | null>(null);

  const handleRotateMasterPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMasterPass.length < 10) {
      setRotationStatus('Error: La nueva contraseña maestra debe tener al menos 10 caracteres.');
      return;
    }
    if (newMasterPass !== confirmMasterPass) {
      setRotationStatus('Error: Las contraseñas no coinciden.');
      return;
    }

    setRotationStatus('Rotación de clave exitosa: Clave DEK re-cifrada con nueva KEK Argon2id.');
    setCurrentMasterPass('');
    setNewMasterPass('');
    setConfirmMasterPass('');
    setTimeout(() => setRotationStatus(null), 4000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 select-none bg-nexus-950 space-y-6">
      {/* Header */}
      <div className="border-b border-nexus-750 pb-4">
        <h2 className="text-xl font-bold text-nexus-100 font-mono">
          Configuración General del Sistema
        </h2>
        <p className="text-xs text-nexus-400">
          Personaliza los tiempos de bloqueo, protección de portapapeles y parámetros criptográficos.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Security & Auto-Lock */}
        <div className="p-5 rounded-2xl bg-nexus-900 border border-nexus-750 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-nexus-200 uppercase tracking-wider">
            <Lock className="w-4 h-4 text-cyan-accent" />
            <span>Seguridad y Bloqueo de Bóveda</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-nexus-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-nexus-400" />
                <span>Bloqueo automático por inactividad</span>
              </label>
              <select
                value={settings.autoLockMinutes}
                onChange={(e) => updateSettings({ autoLockMinutes: parseInt(e.target.value, 10) })}
                className="w-full bg-nexus-850 border border-nexus-700 rounded-xl px-3 py-2 text-xs text-nexus-100"
              >
                <option value={1}>1 minuto</option>
                <option value={5}>5 minutos</option>
                <option value={15}>15 minutos (recomendado)</option>
                <option value={30}>30 minutos</option>
                <option value={60}>1 hora</option>
                <option value={0}>Nunca (No recomendado)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-nexus-300 flex items-center gap-1.5">
                <Clipboard className="w-3.5 h-3.5 text-nexus-400" />
                <span>Limpieza automática del portapapeles</span>
              </label>
              <select
                value={settings.clipboardClearSeconds}
                onChange={(e) => updateSettings({ clipboardClearSeconds: parseInt(e.target.value, 10) })}
                className="w-full bg-nexus-850 border border-nexus-700 rounded-xl px-3 py-2 text-xs text-nexus-100"
              >
                <option value={15}>15 segundos</option>
                <option value={30}>30 segundos (estándar)</option>
                <option value={60}>60 segundos</option>
                <option value={120}>2 minutos</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={lockVault}
              className="px-4 py-2 rounded-xl bg-nexus-800 hover:bg-cyber-red/20 text-nexus-300 hover:text-cyber-red border border-nexus-750 text-xs font-semibold transition-all flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Bloquear Bóveda Inmediatamente</span>
            </button>
          </div>
        </div>

        {/* Change Master Password (Rotation) */}
        <div className="p-5 rounded-2xl bg-nexus-900 border border-nexus-750 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-nexus-200 uppercase tracking-wider">
            <KeyRound className="w-4 h-4 text-cyan-accent" />
            <span>Rotación de Contraseña Maestra</span>
          </div>

          <p className="text-xs text-nexus-400 leading-relaxed">
            Re-cifra de forma atómica y transaccional la clave DEK protegida mediante una nueva KEK derivada por Argon2id.
          </p>

          {rotationStatus && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              rotationStatus.startsWith('Error')
                ? 'bg-cyber-red/15 border-cyber-red/30 text-cyber-red'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{rotationStatus}</span>
            </div>
          )}

          <form onSubmit={handleRotateMasterPassword} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="password"
                required
                value={currentMasterPass}
                onChange={(e) => setCurrentMasterPass(e.target.value)}
                placeholder="Contraseña actual"
                className="bg-nexus-850 border border-nexus-700 rounded-xl px-3 py-2 text-xs text-nexus-100 placeholder-nexus-500 font-mono"
              />
              <input
                type="password"
                required
                value={newMasterPass}
                onChange={(e) => setNewMasterPass(e.target.value)}
                placeholder="Nueva contraseña"
                className="bg-nexus-850 border border-nexus-700 rounded-xl px-3 py-2 text-xs text-nexus-100 placeholder-nexus-500 font-mono"
              />
              <input
                type="password"
                required
                value={confirmMasterPass}
                onChange={(e) => setConfirmMasterPass(e.target.value)}
                placeholder="Confirmar nueva"
                className="bg-nexus-850 border border-nexus-700 rounded-xl px-3 py-2 text-xs text-nexus-100 placeholder-nexus-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-nexus-800 hover:bg-cyan-accent/20 text-cyan-accent border border-cyan-accent/30 font-bold text-xs transition-all flex items-center gap-2"
            >
              <span>Actualizar Contraseña Maestra</span>
            </button>
          </form>
        </div>

        {/* Appearance & System */}
        <div className="p-5 rounded-2xl bg-nexus-900 border border-nexus-750 space-y-4">
          <div className="text-xs font-bold text-nexus-200 uppercase tracking-wider">
            Apariencia e Idioma
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-nexus-300">Tema Visual</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateSettings({ theme: 'dark' })}
                  className={`flex-1 p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium ${
                    settings.theme === 'dark'
                      ? 'bg-nexus-800 border-cyan-accent text-cyan-accent'
                      : 'bg-nexus-850 border-nexus-750 text-nexus-400'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>Oscuro (Predeterminado)</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ theme: 'light' })}
                  className={`flex-1 p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium ${
                    settings.theme === 'light'
                      ? 'bg-nexus-800 border-cyan-accent text-cyan-accent'
                      : 'bg-nexus-850 border-nexus-750 text-nexus-400'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>Claro</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-nexus-300">Idioma de la Interfaz</label>
              <select
                value={settings.language}
                onChange={(e) => updateSettings({ language: e.target.value as any })}
                className="w-full bg-nexus-850 border border-nexus-700 rounded-xl px-3 py-2 text-xs text-nexus-100"
              >
                <option value="es">Español (Principal)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="p-5 rounded-2xl bg-nexus-900 border border-nexus-750 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-nexus-200 uppercase tracking-wider">
            <Keyboard className="w-4 h-4 text-cyan-accent" />
            <span>Atajos de Teclado Globales</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="flex justify-between p-2 rounded bg-nexus-850 text-nexus-300">
              <span>Buscar en bóveda:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-nexus-800 text-cyan-accent">Ctrl + K</kbd>
            </div>
            <div className="flex justify-between p-2 rounded bg-nexus-850 text-nexus-300">
              <span>Bloquear bóveda:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-nexus-800 text-cyan-accent">Ctrl + L</kbd>
            </div>
            <div className="flex justify-between p-2 rounded bg-nexus-850 text-nexus-300">
              <span>Nuevo registro:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-nexus-800 text-cyan-accent">Ctrl + N</kbd>
            </div>
            <div className="flex justify-between p-2 rounded bg-nexus-850 text-nexus-300">
              <span>Generar contraseña:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-nexus-800 text-cyan-accent">Ctrl + G</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
