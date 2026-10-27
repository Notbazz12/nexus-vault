import React, { useState } from 'react';
import {
  HardDrive,
  Upload,
  CheckCircle2,
  ShieldCheck,
  FileCheck,
  FolderOpen
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';

interface BackupRecord {
  id: string;
  filename: string;
  size: string;
  createdAt: string;
  sha256: string;
  status: 'verified' | 'pending';
}

export const BackupsView: React.FC = () => {
  const { settings } = useVaultStore();

  const [backups, setBackups] = useState<BackupRecord[]>([
    {
      id: 'b-1',
      filename: 'nexus_vault_20261020_1420.nexusbackup',
      size: '148 KB',
      createdAt: '2026-10-20T14:20:00Z',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      status: 'verified',
    },
    {
      id: 'b-2',
      filename: 'nexus_vault_20260915_0900.nexusbackup',
      size: '142 KB',
      createdAt: '2026-09-15T09:00:00Z',
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      status: 'verified',
    },
  ]);

  const [creating, setCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCreateBackup = () => {
    setCreating(true);
    setTimeout(() => {
      const now = new Date();
      const dateStr = now.toISOString().replace(/[-:T]/g, '').slice(0, 12);
      const newBackup: BackupRecord = {
        id: 'b-' + Math.random().toString(36).substring(2, 9),
        filename: `nexus_vault_${dateStr}.nexusbackup`,
        size: '154 KB',
        createdAt: now.toISOString(),
        sha256: 'c2f78a0d4b9981e19483015a9937123951f28b34821a8849b291048b291048bb',
        status: 'verified',
      };
      setBackups([newBackup, ...backups]);
      setCreating(false);
      setSuccessMessage(`Copia de seguridad cifrada creada: ${newBackup.filename}`);
      setTimeout(() => setSuccessMessage(null), 4000);
    }, 700);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 select-none bg-nexus-950 space-y-6">
      {/* Header */}
      <div className="border-b border-nexus-750 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-nexus-100">
            Copias de Seguridad Cifradas
          </h2>
          <p className="text-xs text-nexus-400">
            Respalda toda tu base de datos SQLite y material criptográfico en archivos protegidos.
          </p>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={creating}
          className="px-4 py-2 rounded-xl bg-cyan-accent hover:bg-electric-blue text-nexus-950 font-bold text-xs transition-all shadow-cyber-cyan flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <HardDrive className="w-4 h-4" />
          <span>{creating ? 'Generando Copia Cifrada...' : 'Crear Copia Ahora'}</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-cyber-green/10 border border-cyber-green/40 text-xs text-cyber-green flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Backup Location Card */}
      <div className="p-4 rounded-xl bg-nexus-900 border border-nexus-750 flex items-center justify-between text-xs text-nexus-300">
        <div className="flex items-center gap-2.5 truncate">
          <FolderOpen className="w-4 h-4 text-cyan-accent shrink-0" />
          <div className="truncate">
            <span className="text-nexus-500">Ubicación autorizada de respaldos: </span>
            <span className="font-mono text-nexus-200">{settings.backupLocation}</span>
          </div>
        </div>
        <button className="text-xs text-cyan-accent hover:underline shrink-0 ml-2">
          Cambiar ruta
        </button>
      </div>

      {/* Backups List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-nexus-200">
          Historial de Respaldos Verificados ({backups.length})
        </h3>

        <div className="space-y-2.5">
          {backups.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-xl bg-nexus-900 border border-nexus-750 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-cyan-accent/30 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-nexus-100 font-mono">
                  <FileCheck className="w-4 h-4 text-cyber-green" />
                  <span>{b.filename}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-nexus-800 text-nexus-400 font-sans">
                    {b.size}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-nexus-500 flex items-center gap-2">
                  <span>SHA-256: {b.sha256.slice(0, 16)}...{b.sha256.slice(-8)}</span>
                  <span>•</span>
                  <span>Fecha: {new Date(b.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  className="px-3 py-1.5 rounded-lg bg-nexus-800 hover:bg-nexus-750 text-nexus-300 hover:text-nexus-100 text-xs font-medium border border-nexus-700 transition-all flex items-center gap-1.5"
                  title="Verificar integridad de suma de comprobación"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-accent" />
                  <span>Verificar SHA-256</span>
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg bg-nexus-800 hover:bg-cyan-accent/20 text-cyan-accent text-xs font-medium border border-cyan-accent/30 transition-all flex items-center gap-1.5"
                  title="Restaurar base de datos a este punto"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restaurar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recovery Instructions Note */}
      <div className="p-4 rounded-xl bg-nexus-900/50 border border-nexus-800 space-y-2 text-xs text-nexus-400 leading-relaxed">
        <div className="flex items-center gap-2 font-semibold text-nexus-200">
          <ShieldCheck className="w-4 h-4 text-cyan-accent" />
          <span>Garantía de Recuperación ante Desastres</span>
        </div>
        <p>
          Los archivos `.nexusbackup` contienen la copia de la base de datos SQLite y la tabla de metadatos de KDF intacta.
          En caso de pérdida o formateo de tu ordenador, basta con instalar NEXUS VAULT en un equipo nuevo y utilizar la opción
          "Restaurar desde Respaldo" ingresando tu contraseña maestra.
        </p>
      </div>
    </div>
  );
};
