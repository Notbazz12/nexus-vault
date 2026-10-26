import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Plus,
  Sliders,
  Check,
  Info
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { calculateEntropy, generatePassword } from '../lib/utils';
import { GeneratorOptions, LoginItem } from '../types';

export const GeneratorView: React.FC = () => {
  const { copySecureValue, setEditingItem } = useVaultStore();

  const [options, setOptions] = useState<GeneratorOptions>({
    length: 24,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
    mode: 'password',
    wordCount: 4,
    separator: '-',
    capitalize: true,
  });

  const [password, setPassword] = useState<string>(() => generatePassword(options));
  const [copied, setCopied] = useState(false);

  const entropy = calculateEntropy(password);

  const handleRegenerate = () => {
    setPassword(generatePassword(options));
  };

  const handleOptionChange = (key: keyof GeneratorOptions, value: any) => {
    const updated = { ...options, [key]: value };
    setOptions(updated);
    setPassword(generatePassword(updated));
  };

  const handleCopy = async () => {
    await copySecureValue(password, 'Contraseña Generada');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToVault = () => {
    const newItem: LoginItem = {
      id: 'item-' + Math.random().toString(36).substring(2, 9),
      type: 'login',
      title: 'Nuevo Servicio Cifrado',
      username: '',
      email: '',
      password: password,
      url: '',
      notes: 'Contraseña generada criptográficamente con NEXUS VAULT.',
      category: 'General',
      folderId: null,
      isFavorite: false,
      isTrashed: false,
      tags: ['generada'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customFields: [],
    };
    setEditingItem(newItem);
  };

  const getCrackTimeEstimate = (bits: number) => {
    if (bits < 28) return 'Instantáneo (menos de 1 segundo)';
    if (bits < 40) return 'Unos pocos minutos';
    if (bits < 60) return 'Varios meses con clusters de GPU';
    if (bits < 80) return 'Centenares de miles de años';
    return 'Trillones de siglos frente a ataques masivos de fuerza bruta';
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 select-none bg-nexus-950">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-accent/10 border border-cyan-accent/30 text-[11px] font-mono text-cyan-accent">
            <Sparkles className="w-3.5 h-3.5" />
            CSPRNG • window.crypto.getRandomValues
          </div>
          <h2 className="text-xl font-bold text-nexus-100 font-mono">
            Generador de Contraseñas Criptográfico
          </h2>
          <p className="text-xs text-nexus-400">
            Crea claves aleatorias sin sesgo matemático. Los secretos generados nunca se transmiten fuera de tu equipo.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex p-1 rounded-xl bg-nexus-900 border border-nexus-750">
          <button
            onClick={() => handleOptionChange('mode', 'password')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              options.mode === 'password'
                ? 'bg-nexus-800 text-cyan-accent shadow-sm'
                : 'text-nexus-400 hover:text-nexus-200'
            }`}
          >
            Contraseña Compleja
          </button>
          <button
            onClick={() => handleOptionChange('mode', 'passphrase')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              options.mode === 'passphrase'
                ? 'bg-nexus-800 text-cyan-accent shadow-sm'
                : 'text-nexus-400 hover:text-nexus-200'
            }`}
          >
            Frase de Contraseña (Passphrase)
          </button>
        </div>

        {/* Generated Output Card */}
        <div className="p-5 rounded-2xl bg-nexus-900/90 border border-nexus-750 shadow-cyber-card space-y-4">
          <div className="p-4 rounded-xl bg-nexus-950 border border-nexus-800 flex items-center justify-between gap-3">
            <span className="font-mono text-sm sm:text-base text-cyan-accent tracking-wider break-all select-all">
              {password}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleRegenerate}
                className="p-2 rounded-lg bg-nexus-850 hover:bg-nexus-800 text-nexus-300 hover:text-nexus-100 transition-all"
                title="Regenerar contraseña"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-cyan-accent/15 hover:bg-cyan-accent/25 text-cyan-accent transition-all"
                title="Copiar contraseña"
              >
                {copied ? <Check className="w-4 h-4 text-cyan-accent" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Entropy Gauge & Info */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-nexus-400">Entropía Shannon:</span>
              <span style={{ color: entropy.color }} className="font-semibold">
                {entropy.bits} bits • {entropy.label}
              </span>
            </div>
            <div className="w-full h-2 bg-nexus-800 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${entropy.score}%`,
                  backgroundColor: entropy.color,
                }}
              ></div>
            </div>
            <p className="text-[11px] text-nexus-500 font-mono flex items-center gap-1 pt-1">
              <Info className="w-3.5 h-3.5 text-nexus-400" /> Tiempo estimado de quiebre por fuerza bruta: {getCrackTimeEstimate(entropy.bits)}
            </p>
          </div>

          <button
            onClick={handleSaveToVault}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-accent to-electric-blue text-nexus-950 font-bold text-xs hover:brightness-110 active:brightness-95 transition-all shadow-cyber-cyan flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Guardar directamente en la Bóveda</span>
          </button>
        </div>

        {/* Configuration Controls */}
        <div className="p-5 rounded-2xl bg-nexus-900/90 border border-nexus-750 shadow-cyber-card space-y-5">
          <div className="text-xs font-bold text-nexus-200 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-accent" />
            <span>Parámetros de Generación</span>
          </div>

          {options.mode === 'password' ? (
            <div className="space-y-4">
              {/* Length Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-nexus-300">
                  <span>Longitud de la contraseña</span>
                  <span className="font-mono font-bold text-cyan-accent text-sm">{options.length} caracteres</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="128"
                  value={options.length}
                  onChange={(e) => handleOptionChange('length', parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-accent bg-nexus-800 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-nexus-500">
                  <span>8 mín.</span>
                  <span>32 estándar</span>
                  <span>64 alta seguridad</span>
                  <span>128 máx.</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-nexus-850 border border-nexus-750/80 cursor-pointer text-xs text-nexus-200 hover:border-nexus-600 transition-all">
                  <input
                    type="checkbox"
                    checked={options.uppercase}
                    onChange={(e) => handleOptionChange('uppercase', e.target.checked)}
                    className="rounded border-nexus-700 text-cyan-accent focus:ring-0"
                  />
                  <span>Mayúsculas (A-Z)</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-nexus-850 border border-nexus-750/80 cursor-pointer text-xs text-nexus-200 hover:border-nexus-600 transition-all">
                  <input
                    type="checkbox"
                    checked={options.lowercase}
                    onChange={(e) => handleOptionChange('lowercase', e.target.checked)}
                    className="rounded border-nexus-700 text-cyan-accent focus:ring-0"
                  />
                  <span>Minúsculas (a-z)</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-nexus-850 border border-nexus-750/80 cursor-pointer text-xs text-nexus-200 hover:border-nexus-600 transition-all">
                  <input
                    type="checkbox"
                    checked={options.numbers}
                    onChange={(e) => handleOptionChange('numbers', e.target.checked)}
                    className="rounded border-nexus-700 text-cyan-accent focus:ring-0"
                  />
                  <span>Números (0-9)</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-nexus-850 border border-nexus-750/80 cursor-pointer text-xs text-nexus-200 hover:border-nexus-600 transition-all">
                  <input
                    type="checkbox"
                    checked={options.symbols}
                    onChange={(e) => handleOptionChange('symbols', e.target.checked)}
                    className="rounded border-nexus-700 text-cyan-accent focus:ring-0"
                  />
                  <span>Símbolos especiales (!@#$)</span>
                </label>
              </div>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-nexus-850 border border-nexus-750/80 cursor-pointer text-xs text-nexus-200 hover:border-nexus-600 transition-all">
                <input
                  type="checkbox"
                  checked={options.excludeAmbiguous}
                  onChange={(e) => handleOptionChange('excludeAmbiguous', e.target.checked)}
                  className="rounded border-nexus-700 text-cyan-accent focus:ring-0"
                />
                <span>Excluir caracteres ambiguos (evitar 1, l, I, 0, O)</span>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Word Count */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-nexus-300">
                  <span>Cantidad de palabras aleatorias</span>
                  <span className="font-mono font-bold text-cyan-accent text-sm">{options.wordCount} palabras</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="8"
                  value={options.wordCount}
                  onChange={(e) => handleOptionChange('wordCount', parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-accent bg-nexus-800 cursor-pointer"
                />
              </div>

              {/* Separator */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-nexus-300">Separador</label>
                  <select
                    value={options.separator}
                    onChange={(e) => handleOptionChange('separator', e.target.value)}
                    className="w-full bg-nexus-850 border border-nexus-700 rounded-lg px-2.5 py-1.5 text-xs text-nexus-200"
                  >
                    <option value="-">Guion (-)</option>
                    <option value=".">Punto (.)</option>
                    <option value="_">Guion bajo (_)</option>
                    <option value=" ">Espacio ( )</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-nexus-200">
                    <input
                      type="checkbox"
                      checked={options.capitalize}
                      onChange={(e) => handleOptionChange('capitalize', e.target.checked)}
                      className="rounded border-nexus-700 text-cyan-accent focus:ring-0"
                    />
                    <span>Capitalizar palabras</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
