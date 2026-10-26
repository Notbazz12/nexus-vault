import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Edit,
  Trash2,
  CopyPlus,
  Star,
  Globe,
  User,
  Mail,
  Lock,
  Calendar,
  Folder as FolderIcon,
  RotateCcw,
  Tag,
  CreditCard,
  FileText,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { calculateEntropy, formatDate } from '../lib/utils';
import { AnyVaultItem, LoginItem, CardItem, NoteItem, IdentityItem } from '../types';

interface ItemDetailPanelProps {
  item: AnyVaultItem | null;
}

export const ItemDetailPanel: React.FC<ItemDetailPanelProps> = ({ item }) => {
  const {
    toggleFavorite,
    moveToTrash,
    restoreFromTrash,
    deletePermanently,
    duplicateItem,
    setEditingItem,
    copySecureValue,
    folders
  } = useVaultStore();

  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!item) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-nexus-500 text-center select-none">
        <ShieldCheck className="w-12 h-12 text-nexus-700 mb-3" />
        <p className="text-sm font-medium text-nexus-400">Ningún elemento seleccionado</p>
        <p className="text-xs text-nexus-500 max-w-xs mt-1">
          Selecciona un elemento de la lista para inspeccionar sus datos cifrados o realizar acciones.
        </p>
      </div>
    );
  }

  const folder = folders.find((f) => f.id === item.folderId);

  const handleCopy = async (text: string, fieldName: string) => {
    await copySecureValue(text, fieldName);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderLoginDetails = (login: LoginItem) => {
    const entropy = calculateEntropy(login.password);

    return (
      <div className="space-y-4">
        {/* Username / Email */}
        {login.username && (
          <div className="p-3 rounded-xl bg-nexus-800/80 border border-nexus-750 flex items-center justify-between group">
            <div className="flex items-center gap-3 min-w-0">
              <User className="w-4 h-4 text-nexus-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-nexus-500 font-medium uppercase tracking-wider">Usuario</div>
                <div className="text-xs font-mono text-nexus-100 truncate">{login.username}</div>
              </div>
            </div>
            <button
              onClick={() => handleCopy(login.username, 'Usuario')}
              className="p-1.5 rounded-lg bg-nexus-750/60 hover:bg-cyan-accent/20 text-nexus-300 hover:text-cyan-accent transition-all"
              title="Copiar usuario"
            >
              {copiedField === 'Usuario' ? <Check className="w-3.5 h-3.5 text-cyan-accent" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {login.email && login.email !== login.username && (
          <div className="p-3 rounded-xl bg-nexus-800/80 border border-nexus-750 flex items-center justify-between group">
            <div className="flex items-center gap-3 min-w-0">
              <Mail className="w-4 h-4 text-nexus-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-nexus-500 font-medium uppercase tracking-wider">Correo</div>
                <div className="text-xs font-mono text-nexus-100 truncate">{login.email}</div>
              </div>
            </div>
            <button
              onClick={() => handleCopy(login.email, 'Correo')}
              className="p-1.5 rounded-lg bg-nexus-750/60 hover:bg-cyan-accent/20 text-nexus-300 hover:text-cyan-accent transition-all"
              title="Copiar correo"
            >
              {copiedField === 'Correo' ? <Check className="w-3.5 h-3.5 text-cyan-accent" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Password */}
        <div className="p-3 rounded-xl bg-nexus-800/80 border border-nexus-750 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Lock className="w-4 h-4 text-cyan-accent shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-nexus-500 font-medium uppercase tracking-wider flex items-center gap-2">
                  <span>Contraseña</span>
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold"
                    style={{ backgroundColor: `${entropy.color}20`, color: entropy.color }}
                  >
                    {entropy.bits} bits • {entropy.label}
                  </span>
                </div>
                <div className="text-xs font-mono text-nexus-100 tracking-wider">
                  {showPassword ? login.password : '••••••••••••••••••••'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 rounded-lg bg-nexus-750/60 hover:bg-nexus-700 text-nexus-300 hover:text-nexus-100 transition-all"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => handleCopy(login.password, 'Contraseña')}
                className="p-1.5 rounded-lg bg-cyan-accent/15 hover:bg-cyan-accent/25 text-cyan-accent transition-all"
                title="Copiar contraseña"
              >
                {copiedField === 'Contraseña' ? <Check className="w-3.5 h-3.5 text-cyan-accent" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* URL */}
        {login.url && (
          <div className="p-3 rounded-xl bg-nexus-800/80 border border-nexus-750 flex items-center justify-between group">
            <div className="flex items-center gap-3 min-w-0">
              <Globe className="w-4 h-4 text-nexus-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-nexus-500 font-medium uppercase tracking-wider">Sitio Web / URL</div>
                <a
                  href={login.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-accent hover:underline truncate block"
                >
                  {login.url}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleCopy(login.url, 'URL')}
                className="p-1.5 rounded-lg bg-nexus-750/60 hover:bg-cyan-accent/20 text-nexus-300 hover:text-cyan-accent transition-all"
                title="Copiar URL"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <a
                href={login.url}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-nexus-750/60 hover:bg-nexus-700 text-nexus-300 hover:text-nexus-100 transition-all"
                title="Abrir en navegador"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Custom Fields */}
        {login.customFields && login.customFields.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-nexus-750/60">
            <div className="text-[11px] font-semibold text-nexus-400 uppercase tracking-wider">
              Campos Personalizados
            </div>
            {login.customFields.map((cf) => (
              <div key={cf.id} className="p-2.5 rounded-lg bg-nexus-800/60 border border-nexus-750 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-nexus-500">{cf.label}</div>
                  <div className="text-xs font-mono text-nexus-200">
                    {cf.isSecret && !showPassword ? '••••••••' : cf.value}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(cf.value, cf.label)}
                  className="p-1 rounded bg-nexus-750 hover:bg-cyan-accent/20 text-nexus-400 hover:text-cyan-accent"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderNoteDetails = (note: NoteItem) => (
    <div className="space-y-3">
      <div className="p-4 rounded-xl bg-nexus-800/80 border border-nexus-750 space-y-2">
        <div className="flex items-center justify-between border-b border-nexus-750 pb-2">
          <span className="text-[11px] font-semibold text-nexus-400 uppercase tracking-wider">Contenido Seguro</span>
          <button
            onClick={() => handleCopy(note.content, 'Nota')}
            className="flex items-center gap-1 text-[11px] text-cyan-accent hover:underline"
          >
            <Copy className="w-3 h-3" />
            <span>Copiar todo</span>
          </button>
        </div>
        <pre className="text-xs font-mono text-nexus-100 whitespace-pre-wrap leading-relaxed select-text font-sans">
          {note.content}
        </pre>
      </div>
    </div>
  );

  const renderCardDetails = (card: CardItem) => (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl bg-gradient-to-tr from-nexus-850 via-nexus-800 to-electric-blue/20 border border-cyan-accent/30 shadow-cyber-card relative overflow-hidden">
        <div className="flex justify-between items-start mb-6">
          <CreditCard className="w-8 h-8 text-cyan-accent" />
          <span className="text-xs font-bold font-mono uppercase px-2 py-0.5 rounded bg-nexus-900/80 text-cyan-accent border border-cyan-accent/30">
            {card.brand}
          </span>
        </div>
        <div className="space-y-3">
          <div className="text-base font-mono tracking-widest text-nexus-100 flex items-center justify-between">
            <span>{card.cardNumber}</span>
            <button
              onClick={() => handleCopy(card.cardNumber.replace(/\s/g, ''), 'Número de Tarjeta')}
              className="p-1 rounded bg-nexus-900/60 hover:bg-cyan-accent/20 text-cyan-accent"
              title="Copiar número de tarjeta"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex justify-between items-end pt-2 text-xs font-mono">
            <div>
              <div className="text-[9px] text-nexus-400 uppercase">Titular</div>
              <div className="text-nexus-200 font-semibold">{card.cardholderName}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-nexus-400 uppercase">Expira</div>
              <div className="text-nexus-200 font-semibold">{card.expirationMonth}/{card.expirationYear}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-3 rounded-lg bg-cyber-amber/10 border border-cyber-amber/30 text-[11px] text-cyber-amber leading-tight">
        🛡️ Por política de seguridad estricta de NEXUS VAULT, los códigos de seguridad CVV/CVC jamás se almacenan.
      </div>
    </div>
  );

  const renderIdentityDetails = (idItem: IdentityItem) => (
    <div className="space-y-3">
      <div className="p-3 rounded-xl bg-nexus-800/80 border border-nexus-750 space-y-2">
        <div className="text-[10px] text-nexus-500 font-medium uppercase tracking-wider">Nombre Completo</div>
        <div className="text-xs font-medium text-nexus-100 flex items-center justify-between">
          <span>{idItem.fullName}</span>
          <button onClick={() => handleCopy(idItem.fullName, 'Nombre')} className="text-nexus-400 hover:text-cyan-accent">
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-nexus-800/80 border border-nexus-750 space-y-2">
        <div className="text-[10px] text-nexus-500 font-medium uppercase tracking-wider">Identificación Oficial / Fiscal</div>
        <div className="text-xs font-mono text-cyan-accent flex items-center justify-between">
          <span>{idItem.idNumber}</span>
          <button onClick={() => handleCopy(idItem.idNumber, 'ID')} className="text-nexus-400 hover:text-cyan-accent">
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-nexus-800/80 border border-nexus-750 space-y-2">
        <div className="text-[10px] text-nexus-500 font-medium uppercase tracking-wider">Teléfono</div>
        <div className="text-xs font-mono text-nexus-200 flex items-center justify-between">
          <span>{idItem.phone}</span>
          <button onClick={() => handleCopy(idItem.phone, 'Teléfono')} className="text-nexus-400 hover:text-cyan-accent">
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-nexus-800/80 border border-nexus-750 space-y-2">
        <div className="text-[10px] text-nexus-500 font-medium uppercase tracking-wider">Dirección Postal</div>
        <div className="text-xs text-nexus-200 leading-snug">{idItem.address}</div>
      </div>
    </div>
  );

  return (
    <div className="w-96 border-l border-nexus-750/70 bg-nexus-900/95 flex flex-col h-full overflow-hidden select-none">
      {/* Header Panel */}
      <div className="p-4 border-b border-nexus-750/70 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-nexus-800 border border-nexus-700 flex items-center justify-center text-cyan-accent">
              {item.type === 'login' && <Globe className="w-4 h-4" />}
              {item.type === 'note' && <FileText className="w-4 h-4" />}
              {item.type === 'card' && <CreditCard className="w-4 h-4" />}
              {item.type === 'identity' && <User className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-nexus-100 leading-tight truncate max-w-[180px]">
                {item.title}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                {folder && (
                  <span className="text-[10px] text-nexus-400 flex items-center gap-1 font-mono">
                    <FolderIcon className="w-3 h-3" />
                    {folder.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleFavorite(item.id)}
              className="p-1.5 rounded-lg hover:bg-nexus-800 text-nexus-400 hover:text-amber-400 transition-all"
              title={item.isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
            >
              <Star className={`w-4 h-4 ${item.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={() => setEditingItem(item)}
              className="p-1.5 rounded-lg hover:bg-nexus-800 text-nexus-400 hover:text-cyan-accent transition-all"
              title="Editar elemento"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => duplicateItem(item.id)}
              className="p-1.5 rounded-lg hover:bg-nexus-800 text-nexus-400 hover:text-nexus-200 transition-all"
              title="Duplicar elemento"
            >
              <CopyPlus className="w-4 h-4" />
            </button>
            {item.isTrashed ? (
              <>
                <button
                  onClick={() => restoreFromTrash(item.id)}
                  className="p-1.5 rounded-lg hover:bg-emerald-950/40 text-emerald-400 transition-all"
                  title="Restaurar de la papelera"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deletePermanently(item.id)}
                  className="p-1.5 rounded-lg hover:bg-cyber-red/20 text-cyber-red transition-all"
                  title="Eliminar definitivamente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => moveToTrash(item.id)}
                className="p-1.5 rounded-lg hover:bg-cyber-red/20 text-nexus-400 hover:text-cyber-red transition-all"
                title="Mover a la papelera"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Details Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {item.type === 'login' && renderLoginDetails(item as LoginItem)}
        {item.type === 'note' && renderNoteDetails(item as NoteItem)}
        {item.type === 'card' && renderCardDetails(item as CardItem)}
        {item.type === 'identity' && renderIdentityDetails(item as IdentityItem)}

        {/* Private Notes (if login has notes) */}
        {item.type === 'login' && (item as LoginItem).notes && (
          <div className="p-3 rounded-xl bg-nexus-800/60 border border-nexus-750 space-y-1.5">
            <div className="text-[10px] text-nexus-500 font-medium uppercase tracking-wider">Notas Privadas</div>
            <div className="text-xs text-nexus-300 whitespace-pre-wrap">{(item as LoginItem).notes}</div>
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <div className="text-[10px] text-nexus-500 font-medium uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3 h-3" />
              <span>Etiquetas</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-nexus-800 border border-nexus-750 text-nexus-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Metadata Timestamps */}
        <div className="p-3 rounded-xl bg-nexus-950/60 border border-nexus-800/80 space-y-1 text-[10px] text-nexus-500 font-mono">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Creado:
            </span>
            <span>{formatDate(item.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Modificado:
            </span>
            <span>{formatDate(item.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
