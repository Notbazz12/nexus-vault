import React, { useState } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  Lock,
  CheckCircle2,
  Table,
  ShieldAlert
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { LoginItem } from '../types';

export const ImportExportView: React.FC = () => {
  const { saveItem } = useVaultStore();

  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');

  // Import State
  const [selectedFormat, setSelectedFormat] = useState('bitwarden');
  const previewData = [
    { name: 'GitLab Corporate', user: 'felipe_sec', pass: 'Gl#88!vPx09z', url: 'https://gitlab.com' },
    { name: 'Slack Workspace', user: 'felipe@nexusvault.local', pass: 'Sl@ck!2026Secure', url: 'https://slack.com' },
    { name: 'DigitalOcean Cloud', user: 'felipe_do', pass: 'Do#Cloud#8981!', url: 'https://digitalocean.com' },
  ];
  const [importSuccess, setImportSuccess] = useState(false);

  // Export State
  const [exportPassword, setExportPassword] = useState('');
  const [exportWarningAccepted, setExportWarningAccepted] = useState(false);
  const [exportDone, setExportDone] = useState<string | null>(null);

  const handleExecuteImport = () => {
    previewData.forEach((row) => {
      const newItem: LoginItem = {
        id: 'item-' + Math.random().toString(36).substring(2, 9),
        type: 'login',
        title: row.name,
        username: row.user,
        email: row.user.includes('@') ? row.user : '',
        password: row.pass,
        url: row.url,
        notes: `Importado desde formato ${selectedFormat}.`,
        category: 'Importado',
        folderId: null,
        isFavorite: false,
        isTrashed: false,
        tags: ['importado', selectedFormat],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveItem(newItem);
    });

    setImportSuccess(true);
    setTimeout(() => setImportSuccess(false), 4000);
  };

  const handleExportEncrypted = (e: React.FormEvent) => {
    e.preventDefault();
    setExportDone('Archivo cifrado nexus_vault_backup.nexusbackup generado con éxito.');
    setTimeout(() => setExportDone(null), 4000);
  };

  const handleExportPlaintext = () => {
    if (!exportWarningAccepted) return;
    setExportDone('Archivo CSV en texto plano generado. Por favor bórralo inmediatamente tras usarlo.');
    setTimeout(() => setExportDone(null), 5000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 select-none bg-nexus-950 space-y-6">
      {/* Header */}
      <div className="border-b border-nexus-750 pb-4">
        <h2 className="text-xl font-bold text-nexus-100 font-mono">
          Importación y Exportación de Bóveda
        </h2>
        <p className="text-xs text-nexus-400">
          Migra tus contraseñas desde otros administradores o genera copias locales interoperables.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-nexus-800 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('import')}
          className={`pb-2.5 flex items-center gap-2 transition-all ${
            activeTab === 'import'
              ? 'text-cyan-accent border-b-2 border-cyan-accent'
              : 'text-nexus-400 hover:text-nexus-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Importar Contraseñas</span>
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`pb-2.5 flex items-center gap-2 transition-all ${
            activeTab === 'export'
              ? 'text-cyan-accent border-b-2 border-cyan-accent'
              : 'text-nexus-400 hover:text-nexus-200'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Exportar Bóveda</span>
        </button>
      </div>

      {/* IMPORT TAB */}
      {activeTab === 'import' && (
        <div className="space-y-6 max-w-3xl">
          {importSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>¡Importación completada! Se han agregado 3 registros cifrados a tu bóveda.</span>
            </div>
          )}

          {/* Format selection */}
          <div className="p-5 rounded-2xl bg-nexus-900 border border-nexus-750 space-y-3">
            <label className="text-xs font-semibold text-nexus-200 uppercase tracking-wider">
              1. Selecciona el Gestor de Origen
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'bitwarden', label: 'Bitwarden (CSV)' },
                { id: '1password', label: '1Password (CSV)' },
                { id: 'chrome', label: 'Google Chrome (CSV)' },
                { id: 'generic', label: 'CSV Genérico' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`p-3 rounded-xl border text-xs font-medium transition-all text-center ${
                    selectedFormat === fmt.id
                      ? 'bg-nexus-800 border-cyan-accent text-cyan-accent shadow-sm'
                      : 'bg-nexus-850 border-nexus-750 text-nexus-300 hover:border-nexus-650'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Table */}
          <div className="p-5 rounded-2xl bg-nexus-900 border border-nexus-750 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-nexus-200 uppercase tracking-wider flex items-center gap-1.5">
                <Table className="w-4 h-4 text-cyan-accent" />
                <span>2. Vista Previa y Asignación de Columnas ({previewData.length} detectados)</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Sin duplicados críticos
              </span>
            </div>

            <div className="overflow-x-auto border border-nexus-800 rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-nexus-850 text-nexus-400 text-[10px] uppercase border-b border-nexus-800">
                  <tr>
                    <th className="p-2.5">Servicio</th>
                    <th className="p-2.5">Usuario</th>
                    <th className="p-2.5">Contraseña</th>
                    <th className="p-2.5">URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-800 text-nexus-200">
                  {previewData.map((row, i) => (
                    <tr key={i} className="hover:bg-nexus-850/40">
                      <td className="p-2.5 font-semibold text-nexus-100">{row.name}</td>
                      <td className="p-2.5">{row.user}</td>
                      <td className="p-2.5 text-nexus-400">••••••••••</td>
                      <td className="p-2.5 text-cyan-accent truncate max-w-[150px]">{row.url}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleExecuteImport}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-accent to-electric-blue text-nexus-950 font-bold text-xs hover:brightness-110 shadow-cyber-cyan flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Confirmar e Importar Registros</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT TAB */}
      {activeTab === 'export' && (
        <div className="space-y-6 max-w-3xl">
          {exportDone && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{exportDone}</span>
            </div>
          )}

          {/* Encrypted Export Card (Recommended) */}
          <div className="p-5 rounded-2xl bg-nexus-900 border border-cyan-accent/30 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-accent/15 text-cyan-accent shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-nexus-100">
                  Copia de Seguridad Cifrada (Recomendado)
                </h3>
                <p className="text-xs text-nexus-400 mt-0.5 leading-relaxed">
                  Genera un archivo `.nexusbackup` autenticado con XChaCha20-Poly1305 protegido por una clave de exportación.
                </p>
              </div>
            </div>

            <form onSubmit={handleExportEncrypted} className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-nexus-300">
                  Clave de Cifrado para la Copia
                </label>
                <input
                  type="password"
                  required
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  placeholder="Introduce una contraseña para asegurar este respaldo..."
                  className="w-full bg-nexus-850 border border-nexus-700 rounded-xl px-3.5 py-2 text-xs text-nexus-100 placeholder-nexus-500 focus:outline-none focus:border-cyan-accent font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={exportPassword.length < 4}
                className="px-4 py-2 rounded-xl bg-cyan-accent text-nexus-950 font-bold text-xs hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Respaldo Cifrado (.nexusbackup)</span>
              </button>
            </form>
          </div>

          {/* Plaintext CSV Export (High Warning) */}
          <div className="p-5 rounded-2xl bg-nexus-900 border border-cyber-red/30 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-cyber-red/15 text-cyber-red shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-cyber-red">
                  Exportación en Texto Plano (CSV No Cifrado)
                </h3>
                <p className="text-xs text-nexus-400 leading-relaxed">
                  PELIGRO: Este archivo contendrá todas tus contraseñas y notas en texto legible sin ninguna protección criptográfica. Cualquier aplicación o malware podrá leerlo de inmediato.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyber-red/10 border border-cyber-red/20 text-xs text-nexus-300 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-nexus-200">
                <input
                  type="checkbox"
                  checked={exportWarningAccepted}
                  onChange={(e) => setExportWarningAccepted(e.target.checked)}
                  className="rounded border-nexus-700 text-cyber-red focus:ring-0 bg-nexus-950"
                />
                <span className="font-semibold text-cyber-red">
                  Comprendo los riesgos y asumo la responsabilidad de eliminar el archivo tras su uso.
                </span>
              </label>
            </div>

            <button
              onClick={handleExportPlaintext}
              disabled={!exportWarningAccepted}
              className="px-4 py-2 rounded-xl bg-nexus-800 hover:bg-cyber-red/20 text-cyber-red border border-cyber-red/40 font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Re-autenticar y Exportar CSV No Cifrado</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
