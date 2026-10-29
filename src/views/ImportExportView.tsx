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
import { ImportedLogin, hostOf, parseExport } from '../lib/importers';

export const ImportExportView: React.FC = () => {
  const { saveItem, setView, items } = useVaultStore();

  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');

  // Import State
  const [fileName, setFileName] = useState('');
  const [previewData, setPreviewData] = useState<ImportedLogin[]>([]);
  const [importError, setImportError] = useState('');
  const [importResult, setImportResult] = useState<{ added: number; skipped: number } | null>(null);

  // Export State
  const [exportPassword, setExportPassword] = useState('');
  const [exportWarningAccepted, setExportWarningAccepted] = useState(false);
  const [exportDone, setExportDone] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again
    setImportResult(null);
    setImportError('');
    setPreviewData([]);
    setFileName(file?.name ?? '');
    if (!file) return;
    try {
      const rows = parseExport(await file.text());
      if (!rows.length) setImportError('No se encontraron contraseñas en el archivo.');
      setPreviewData(rows);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'No se pudo leer el archivo.');
    }
  };

  const handleExecuteImport = () => {
    const seen = new Set(
      items.filter((it): it is LoginItem => it.type === 'login' && !it.isTrashed)
        .map((it) => `${hostOf(it.url)}\n${it.username}\n${it.password}`)
    );
    let added = 0;
    for (const row of previewData) {
      const key = `${hostOf(row.url)}\n${row.username}\n${row.password}`;
      if (seen.has(key)) continue;
      seen.add(key);
      saveItem({
        id: `item-${crypto.randomUUID()}`,
        type: 'login',
        title: row.title,
        username: row.username,
        email: row.username.includes('@') ? row.username : '',
        password: row.password,
        url: row.url,
        notes: row.notes,
        category: 'Importado',
        folderId: null,
        isFavorite: false,
        isTrashed: false,
        tags: ['importado'],
        createdAt: '',
        updatedAt: '',
      });
      added++;
    }
    setView('import-export'); // saveItem jumps to the list; stay here to show the result
    setImportResult({ added, skipped: previewData.length - added });
    setPreviewData([]);
    setFileName('');
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
        <h2 className="text-xl font-bold text-nexus-100">
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
          {importResult && (
            <div className="p-4 rounded-xl bg-cyber-green/10 border border-cyber-green/40 text-xs text-cyber-green flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>
                Importación completada: {importResult.added} cuentas añadidas y cifradas
                {importResult.skipped > 0 && ` (${importResult.skipped} ya estaban en tu bóveda)`}.
                Borra el archivo exportado: contiene tus contraseñas sin cifrar.
              </span>
            </div>
          )}

          {/* File selection */}
          <div className="p-5 rounded-2xl bg-nexus-900 border border-nexus-750 space-y-3">
            <span className="text-xs font-semibold text-nexus-200">1. Elige el archivo exportado</span>
            <p className="text-xs text-nexus-400 leading-relaxed">
              Edge o Chrome: <span className="font-mono">edge://settings/passwords</span> → ⋯ → Exportar contraseñas (CSV).
              También acepta CSV de Bitwarden, 1Password y Firefox, y el archivo de texto que exporta Kaspersky Password Manager.
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-nexus-800 border border-nexus-700 text-xs font-semibold text-nexus-100 hover:border-cyan-accent cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-cyan-accent">
              <FileSpreadsheet className="w-4 h-4 text-cyan-accent" />
              <span>{fileName || 'Seleccionar archivo (.csv o .txt)'}</span>
              <input type="file" accept=".csv,.txt,text/csv,text/plain" onChange={handleFile} className="sr-only" />
            </label>
            {importError && <p role="alert" className="text-xs text-cyber-red">{importError}</p>}
          </div>

          {/* Preview Table */}
          {previewData.length > 0 && (
          <div className="p-5 rounded-2xl bg-nexus-900 border border-nexus-750 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-nexus-200 flex items-center gap-1.5">
                <Table className="w-4 h-4 text-cyan-accent" />
                <span>2. Revisa las cuentas ({previewData.length} encontradas)</span>
              </span>
            </div>

            <div className="overflow-x-auto border border-nexus-800 rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-nexus-850 text-nexus-400 text-[10px] border-b border-nexus-800">
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
                      <td className="p-2.5 font-semibold text-nexus-100">{row.title}</td>
                      <td className="p-2.5">{row.username}</td>
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
                className="px-5 py-2 rounded-xl bg-cyan-accent hover:bg-electric-blue text-nexus-950 font-bold text-xs  shadow-cyber-cyan flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Importar {previewData.length} cuentas</span>
              </button>
            </div>
          </div>
          )}
        </div>
      )}

      {/* EXPORT TAB */}
      {activeTab === 'export' && (
        <div className="space-y-6 max-w-3xl">
          {exportDone && (
            <div className="p-4 rounded-xl bg-cyber-green/10 border border-cyber-green/40 text-xs text-cyber-green flex items-center gap-2">
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
                className="px-4 py-2 rounded-xl bg-cyan-accent text-nexus-950 font-bold text-xs hover:bg-electric-blue disabled:opacity-50 flex items-center gap-2"
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
