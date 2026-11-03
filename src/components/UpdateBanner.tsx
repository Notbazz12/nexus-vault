import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { check, Update } from '@tauri-apps/plugin-updater';

/** Checks GitHub Releases once per launch; the update is signature-checked before installing. */
export const UpdateBanner: React.FC = () => {
  const [update, setUpdate] = useState<Update | null>(null);
  const [status, setStatus] = useState<'idle' | 'installing' | 'error'>('idle');

  useEffect(() => {
    if (!('__TAURI_INTERNALS__' in window)) return; // browser demo
    check().then(setUpdate).catch(() => {}); // offline or no release yet: stay quiet
  }, []);

  if (!update) return null;

  const install = async () => {
    setStatus('installing');
    try {
      await update.downloadAndInstall(); // the installer closes and reopens the app
    } catch {
      setStatus('error');
    }
  };

  return (
    <div role="status" className="flex items-center gap-3 px-6 py-2.5 bg-cyan-accent/10 border-b border-cyan-accent/30 text-xs text-nexus-100">
      <Download className="w-4 h-4 text-cyan-accent shrink-0" />
      <span className="flex-1">
        {status === 'error'
          ? 'No se pudo instalar la actualización. Inténtalo de nuevo más tarde.'
          : `Hay una versión nueva de Nexus Vault (${update.version}).`}
      </span>
      <button
        onClick={install}
        disabled={status === 'installing'}
        className="px-3 py-1.5 rounded-lg bg-cyan-accent text-nexus-950 font-bold hover:bg-electric-blue disabled:opacity-60"
      >
        {status === 'installing' ? 'Descargando…' : 'Actualizar ahora'}
      </button>
      <button onClick={() => setUpdate(null)} className="px-2 py-1.5 text-nexus-400 hover:text-nexus-200">
        Más tarde
      </button>
    </div>
  );
};
