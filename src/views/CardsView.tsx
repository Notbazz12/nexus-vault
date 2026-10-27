import React, { useState } from 'react';
import {
  CreditCard,
  User,
  Plus,
  Copy,
  Star,
  Check,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { CardItem, IdentityItem } from '../types';

export const CardsView: React.FC = () => {
  const { items, saveItem, toggleFavorite, moveToTrash, copySecureValue, activeView, setView } = useVaultStore();

  const activeTab = activeView === 'identities' ? 'identities' : 'cards';
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const cards = items.filter((it): it is CardItem => it.type === 'card' && !it.isTrashed);
  const identities = items.filter((it): it is IdentityItem => it.type === 'identity' && !it.isTrashed);

  const handleCopy = async (text: string, label: string) => {
    await copySecureValue(text, label);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateMockCard = () => {
    const newCard: CardItem = {
      id: 'item-' + Math.random().toString(36).substring(2, 9),
      type: 'card',
      title: 'Nueva Tarjeta Bancaria',
      cardholderName: 'TITULAR EJEMPLO',
      cardNumber: '4000 1234 5678 9010',
      expirationMonth: '12',
      expirationYear: '2030',
      brand: 'visa',
      notes: '',
      folderId: null,
      isFavorite: false,
      isTrashed: false,
      tags: ['tarjeta'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveItem(newCard);
  };

  const handleCreateMockIdentity = () => {
    const newIdentity: IdentityItem = {
      id: 'item-' + Math.random().toString(36).substring(2, 9),
      type: 'identity',
      title: 'Nueva Identidad Personal',
      fullName: 'Nombre Completo del Usuario',
      email: 'usuario@nexusvault.local',
      phone: '+52 55 0000 0000',
      address: 'Dirección Principal 123',
      idNumber: 'ID-009218',
      company: 'Empresa Privada',
      notes: '',
      folderId: null,
      isFavorite: false,
      isTrashed: false,
      tags: ['identidad'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveItem(newIdentity);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 select-none bg-nexus-950 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-nexus-750 pb-4">
        <div>
          <h2 className="text-xl font-bold text-nexus-100">
            Tarjetas e Información Personal
          </h2>
          <p className="text-xs text-nexus-400">
            Almacenamiento seguro de medios de pago y datos de identidad con protección en memoria.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'cards' ? (
            <button
              onClick={handleCreateMockCard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-accent text-nexus-950 font-bold text-xs hover:bg-electric-blue shadow-cyber-cyan"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Tarjeta</span>
            </button>
          ) : (
            <button
              onClick={handleCreateMockIdentity}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-accent text-nexus-950 font-bold text-xs hover:bg-electric-blue shadow-cyber-cyan"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Identidad</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-nexus-800 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setView('cards')}
          className={`pb-2.5 flex items-center gap-2 transition-all ${
            activeTab === 'cards'
              ? 'text-cyan-accent border-b-2 border-cyan-accent'
              : 'text-nexus-400 hover:text-nexus-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Tarjetas de Pago ({cards.length})</span>
        </button>
        <button
          onClick={() => setView('identities')}
          className={`pb-2.5 flex items-center gap-2 transition-all ${
            activeTab === 'identities'
              ? 'text-cyan-accent border-b-2 border-cyan-accent'
              : 'text-nexus-400 hover:text-nexus-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Identidades y Direcciones ({identities.length})</span>
        </button>
      </div>

      {/* Cards Tab Content */}
      {activeTab === 'cards' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((card) => (
              <div
                key={card.id}
                className="p-5 rounded-2xl bg-nexus-850 border border-cyan-accent/30 shadow-cyber-card relative overflow-hidden space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-cyan-accent" />
                    <span className="text-sm font-bold text-nexus-100">{card.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleFavorite(card.id)}
                      className="text-nexus-400 hover:text-cyber-amber"
                    >
                      <Star className={`w-4 h-4 ${card.isFavorite ? 'text-cyber-amber fill-cyber-amber' : ''}`} />
                    </button>
                    <button
                      onClick={() => moveToTrash(card.id)}
                      className="text-nexus-400 hover:text-cyber-red"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-nexus-400 font-mono">Número de Tarjeta</div>
                  <div className="text-lg font-mono tracking-widest text-nexus-100 flex items-center justify-between">
                    <span>{card.cardNumber}</span>
                    <button
                      onClick={() => handleCopy(card.cardNumber.replace(/\s/g, ''), `Tarjeta-${card.id}`)}
                      className="p-1 rounded bg-nexus-800 hover:bg-cyan-accent/20 text-cyan-accent"
                    >
                      {copiedField === `Tarjeta-${card.id}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-end pt-2 text-xs font-mono border-t border-nexus-750/70">
                  <div>
                    <div className="text-xs text-nexus-400">Titular</div>
                    <div className="text-nexus-200 font-semibold">{card.cardholderName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-nexus-400">Vencimiento</div>
                    <div className="text-nexus-200 font-semibold">{card.expirationMonth}/{card.expirationYear}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-nexus-900/60 border border-nexus-750 flex items-start gap-3 text-xs text-nexus-400">
            <ShieldCheck className="w-5 h-5 text-cyan-accent shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-nexus-200">Aviso de Estándar Criptográfico: </span>
              Los datos de tarjeta se cifran de extremo a extremo en reposo. Para mitigar riesgos de cumplimiento y robo físico de dispositivos, NEXUS VAULT no almacena códigos CVV/CVC.
            </div>
          </div>
        </div>
      )}

      {/* Identities Tab Content */}
      {activeTab === 'identities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {identities.map((idItem) => (
            <div
              key={idItem.id}
              className="p-5 rounded-2xl bg-nexus-900 border border-nexus-750 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-nexus-800 pb-2">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-accent" />
                  <span className="text-sm font-bold text-nexus-100">{idItem.title}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleFavorite(idItem.id)}
                    className="text-nexus-400 hover:text-cyber-amber"
                  >
                    <Star className={`w-4 h-4 ${idItem.isFavorite ? 'text-cyber-amber fill-cyber-amber' : ''}`} />
                  </button>
                  <button
                    onClick={() => moveToTrash(idItem.id)}
                    className="text-nexus-400 hover:text-cyber-red"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-xs text-nexus-500">Nombre Completo</div>
                  <div className="font-medium text-nexus-200 truncate">{idItem.fullName}</div>
                </div>
                <div>
                  <div className="text-xs text-nexus-500">Documento / RFC</div>
                  <div className="font-mono text-cyan-accent">{idItem.idNumber}</div>
                </div>
                <div>
                  <div className="text-xs text-nexus-500">Teléfono</div>
                  <div className="font-mono text-nexus-300">{idItem.phone}</div>
                </div>
                <div>
                  <div className="text-xs text-nexus-500">Correo</div>
                  <div className="font-mono text-nexus-300 truncate">{idItem.email}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-nexus-800 text-xs">
                <div className="text-xs text-nexus-500">Dirección</div>
                <div className="text-nexus-300 leading-snug">{idItem.address}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
