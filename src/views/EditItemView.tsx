import React, { useState } from 'react';
import {
  Save,
  X,
  Sparkles,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Folder as FolderIcon,
  Tag,
  Lock,
  Globe,
  User,
  Mail,
  FileText
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { calculateEntropy, generatePassword } from '../lib/utils';
import { AnyVaultItem, CustomField, LoginItem } from '../types';

export const EditItemView: React.FC = () => {
  const { editingItem, saveItem, setView, folders } = useVaultStore();

  const [formData, setFormData] = useState<AnyVaultItem>(
    editingItem || {
      id: 'item-' + Math.random().toString(36).substring(2, 9),
      type: 'login',
      title: '',
      username: '',
      email: '',
      password: '',
      url: '',
      notes: '',
      category: 'General',
      folderId: null,
      isFavorite: false,
      isTrashed: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customFields: [],
    } as LoginItem
  );

  const [showPassword, setShowPassword] = useState(false);
  const [tagInput, setTagInput] = useState(formData.tags.join(', '));
  const [error, setError] = useState<string | null>(null);

  const isLogin = formData.type === 'login';
  const loginData = formData as LoginItem;
  const entropy = isLogin ? calculateEntropy(loginData.password || '') : null;

  const handleGenerateInstantPassword = () => {
    const generated = generatePassword({
      length: 20,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: true,
      mode: 'password',
      wordCount: 4,
      separator: '-',
      capitalize: true,
    });

    setFormData((prev) => ({
      ...prev,
      password: generated,
    } as any));
  };

  const handleAddCustomField = () => {
    const newField: CustomField = {
      id: 'cf-' + Math.random().toString(36).substring(2, 9),
      label: 'Nuevo Campo',
      value: '',
      isSecret: false,
    };

    setFormData((prev: any) => ({
      ...prev,
      customFields: [...(prev.customFields || []), newField],
    }));
  };

  const handleRemoveCustomField = (id: string) => {
    setFormData((prev: any) => ({
      ...prev,
      customFields: (prev.customFields || []).filter((f: CustomField) => f.id !== id),
    }));
  };

  const handleCustomFieldChange = (id: string, key: keyof CustomField, val: any) => {
    setFormData((prev: any) => ({
      ...prev,
      customFields: (prev.customFields || []).map((f: CustomField) =>
        f.id === id ? { ...f, [key]: val } : f
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('El título o nombre del servicio es obligatorio.');
      return;
    }

    // Process tags
    const processedTags = tagInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const updatedItem = {
      ...formData,
      tags: processedTags,
      updatedAt: new Date().toISOString(),
    };

    saveItem(updatedItem);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 select-none bg-nexus-950">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-nexus-750 pb-4">
          <div>
            <h2 className="text-xl font-bold text-nexus-100">
              {editingItem ? 'Editar Registro' : 'Nuevo Registro'}
            </h2>
            <p className="text-xs text-nexus-400">
              Todos los campos serán cifrados con XChaCha20-Poly1305 antes de persistir en disco.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView('passwords')}
              className="px-3 py-1.5 rounded-lg bg-nexus-850 hover:bg-nexus-800 text-nexus-300 text-xs font-medium border border-nexus-750 transition-all flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancelar</span>
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-1.5 rounded-lg bg-cyan-accent hover:bg-electric-blue text-nexus-950 font-bold text-xs transition-all shadow-cyber-cyan flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Registro</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-cyber-red/15 border border-cyber-red/30 text-xs text-cyber-red">
            {error}
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title & Folder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-nexus-300">
                Nombre del Servicio / Título *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej. GitHub Enterprise, Amazon Web Services..."
                className="w-full bg-nexus-900 border border-nexus-750 rounded-xl px-3.5 py-2 text-xs text-nexus-100 placeholder-nexus-500 focus:outline-none focus:border-cyan-accent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-nexus-300 flex items-center gap-1.5">
                <FolderIcon className="w-3.5 h-3.5 text-nexus-400" />
                <span>Carpeta</span>
              </label>
              <select
                value={formData.folderId || ''}
                onChange={(e) => setFormData({ ...formData, folderId: e.target.value || null })}
                className="w-full bg-nexus-900 border border-nexus-750 rounded-xl px-3 py-2 text-xs text-nexus-200 focus:outline-none focus:border-cyan-accent"
              >
                <option value="">(Sin carpeta / Raíz)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Login Specific Fields */}
          {isLogin && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-nexus-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-nexus-400" />
                    <span>Nombre de Usuario</span>
                  </label>
                  <input
                    type="text"
                    value={loginData.username || ''}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value } as any)}
                    placeholder="usuario123"
                    className="w-full bg-nexus-900 border border-nexus-750 rounded-xl px-3.5 py-2 text-xs text-nexus-100 placeholder-nexus-500 focus:outline-none focus:border-cyan-accent font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-nexus-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-nexus-400" />
                    <span>Correo Electrónico</span>
                  </label>
                  <input
                    type="email"
                    value={loginData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value } as any)}
                    placeholder="correo@ejemplo.com"
                    className="w-full bg-nexus-900 border border-nexus-750 rounded-xl px-3.5 py-2 text-xs text-nexus-100 placeholder-nexus-500 focus:outline-none focus:border-cyan-accent font-mono"
                  />
                </div>
              </div>

              {/* Password Field with Instant Generator */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-nexus-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-cyan-accent" />
                    <span>Contraseña Cifrada</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateInstantPassword}
                    className="text-[11px] text-cyan-accent hover:underline flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3" /> Generar aleatoria
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value } as any)}
                    placeholder="Contraseña..."
                    className="w-full bg-nexus-900 border border-nexus-750 rounded-xl px-3.5 py-2 text-xs text-nexus-100 placeholder-nexus-500 focus:outline-none focus:border-cyan-accent font-mono tracking-wider pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-nexus-400 hover:text-nexus-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {entropy && loginData.password && (
                  <div className="flex items-center justify-between text-[10px] font-mono pt-0.5">
                    <span className="text-nexus-400">Entropía: {entropy.bits} bits</span>
                    <span style={{ color: entropy.color }} className="font-semibold">{entropy.label}</span>
                  </div>
                )}
              </div>

              {/* URL */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-nexus-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-nexus-400" />
                  <span>URL / Sitio Web</span>
                </label>
                <input
                  type="url"
                  value={loginData.url || ''}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value } as any)}
                  placeholder="https://app.servicio.com/login"
                  className="w-full bg-nexus-900 border border-nexus-750 rounded-xl px-3.5 py-2 text-xs text-nexus-100 placeholder-nexus-500 focus:outline-none focus:border-cyan-accent font-mono"
                />
              </div>

              {/* Custom Fields */}
              <div className="space-y-2 pt-2 border-t border-nexus-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-nexus-300">Campos Personalizados</span>
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="text-[11px] text-cyan-accent hover:underline flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3 h-3" /> Agregar Campo
                  </button>
                </div>

                {(loginData.customFields || []).map((cf) => (
                  <div key={cf.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={cf.label}
                      onChange={(e) => handleCustomFieldChange(cf.id, 'label', e.target.value)}
                      placeholder="Etiqueta (ej. PIN, API Key)"
                      className="w-1/3 bg-nexus-900 border border-nexus-750 rounded-lg px-2.5 py-1.5 text-xs text-nexus-200"
                    />
                    <input
                      type={cf.isSecret ? 'password' : 'text'}
                      value={cf.value}
                      onChange={(e) => handleCustomFieldChange(cf.id, 'value', e.target.value)}
                      placeholder="Valor confidencial..."
                      className="flex-1 bg-nexus-900 border border-nexus-750 rounded-lg px-2.5 py-1.5 text-xs text-nexus-100 font-mono"
                    />
                    <label className="flex items-center gap-1 text-[11px] text-nexus-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cf.isSecret}
                        onChange={(e) => handleCustomFieldChange(cf.id, 'isSecret', e.target.checked)}
                        className="rounded border-nexus-700 text-cyan-accent"
                      />
                      <span>Ocultar</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(cf.id)}
                      className="p-1 text-nexus-500 hover:text-cyber-red"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1 pt-2 border-t border-nexus-800">
            <label className="text-xs font-semibold text-nexus-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-nexus-400" />
              <span>Notas Privadas (Cifradas)</span>
            </label>
            <textarea
              rows={4}
              value={(formData as any).notes || (formData as any).content || ''}
              onChange={(e) => {
                if (formData.type === 'note') {
                  setFormData({ ...formData, content: e.target.value } as any);
                } else {
                  setFormData({ ...formData, notes: e.target.value } as any);
                }
              }}
              placeholder="Instrucciones adicionales, preguntas de seguridad o apuntes privados..."
              className="w-full bg-nexus-900 border border-nexus-750 rounded-xl px-3.5 py-2 text-xs text-nexus-100 placeholder-nexus-500 focus:outline-none focus:border-cyan-accent font-sans"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-nexus-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-nexus-400" />
              <span>Etiquetas (separadas por comas)</span>
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="banca, servidor, 2fa, personal"
              className="w-full bg-nexus-900 border border-nexus-750 rounded-xl px-3.5 py-2 text-xs text-nexus-100 placeholder-nexus-500 focus:outline-none focus:border-cyan-accent font-mono"
            />
          </div>
        </form>
      </div>
    </div>
  );
};
