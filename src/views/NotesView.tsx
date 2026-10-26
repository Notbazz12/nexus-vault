import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Copy,
  Star,
  Check,
  Paperclip,
  Trash2
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { formatDate } from '../lib/utils';
import { NoteItem } from '../types';

export const NotesView: React.FC = () => {
  const {
    items,
    saveItem,
    toggleFavorite,
    moveToTrash,
    copySecureValue,
  } = useVaultStore();

  const notes = items.filter((it): it is NoteItem => it.type === 'note' && !it.isTrashed);

  const [selectedNoteId, setSelectedNoteId] = useState<string>(notes[0]?.id || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [copied, setCopied] = useState(false);

  const currentNote = notes.find((n) => n.id === selectedNoteId) || notes[0];

  const handleSelectNote = (note: NoteItem) => {
    setSelectedNoteId(note.id);
    setIsEditing(false);
  };

  const handleStartNewNote = () => {
    const newId = 'item-' + Math.random().toString(36).substring(2, 9);
    const newNote: NoteItem = {
      id: newId,
      type: 'note',
      title: 'Nota Segura Sin Título',
      content: '',
      category: 'Privado',
      folderId: null,
      isFavorite: false,
      isTrashed: false,
      tags: ['nota'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveItem(newNote);
    setSelectedNoteId(newId);
    setEditTitle(newNote.title);
    setEditContent(newNote.content);
    setEditCategory(newNote.category);
    setIsEditing(true);
  };

  const handleStartEdit = () => {
    if (!currentNote) return;
    setEditTitle(currentNote.title);
    setEditContent(currentNote.content);
    setEditCategory(currentNote.category);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!currentNote) return;
    saveItem({
      ...currentNote,
      title: editTitle.trim() || 'Nota Segura Sin Título',
      content: editContent,
      category: editCategory,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  const handleCopy = async () => {
    if (!currentNote) return;
    await copySecureValue(currentNote.content, 'Contenido de Nota');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden select-none">
      {/* Left List */}
      <div className="w-80 border-r border-nexus-750/70 bg-nexus-900/60 flex flex-col h-full overflow-hidden">
        <div className="p-3 border-b border-nexus-750/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-nexus-200">
            <FileText className="w-4 h-4 text-cyan-accent" />
            <span>Notas Cifradas ({notes.length})</span>
          </div>
          <button
            onClick={handleStartNewNote}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-accent/15 text-cyan-accent hover:bg-cyan-accent/25 text-xs font-medium border border-cyan-accent/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-nexus-800/50">
          {notes.map((note) => {
            const isSelected = note.id === currentNote?.id;

            return (
              <div
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className={`p-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-nexus-800 border-l-2 border-l-cyan-accent text-nexus-100'
                    : 'hover:bg-nexus-850/60 text-nexus-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                      <span>{note.title}</span>
                      {note.isFavorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                    </div>
                    <div className="text-[11px] text-nexus-500 truncate mt-0.5 font-sans">
                      {note.content.substring(0, 45) || '(Sin contenido)'}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-nexus-500 shrink-0">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Content Editor / Viewer */}
      <div className="flex-1 flex flex-col h-full bg-nexus-950 overflow-hidden">
        {currentNote ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Toolbar */}
            <div className="p-4 border-b border-nexus-750/70 flex items-center justify-between bg-nexus-900/40">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-nexus-850 border border-nexus-700 rounded-lg px-3 py-1 text-sm font-bold text-nexus-100 w-full max-w-md focus:outline-none focus:border-cyan-accent"
                  />
                ) : (
                  <div>
                    <h2 className="text-base font-bold text-nexus-100 truncate flex items-center gap-2">
                      {currentNote.title}
                      {currentNote.isFavorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                    </h2>
                    <span className="text-[10px] font-mono text-nexus-400">
                      Actualizado: {formatDate(currentNote.updatedAt)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 rounded-lg bg-nexus-850 text-nexus-300 hover:bg-nexus-800 text-xs font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-accent text-nexus-950 hover:brightness-110 text-xs font-bold shadow-cyber-cyan"
                    >
                      Guardar Cambios
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => toggleFavorite(currentNote.id)}
                      className="p-1.5 rounded-lg bg-nexus-850 text-nexus-300 hover:text-amber-400"
                      title="Favorito"
                    >
                      <Star className={`w-4 h-4 ${currentNote.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                    </button>
                    <button
                      onClick={handleCopy}
                      className="p-1.5 rounded-lg bg-nexus-850 text-nexus-300 hover:text-cyan-accent"
                      title="Copiar contenido"
                    >
                      {copied ? <Check className="w-4 h-4 text-cyan-accent" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleStartEdit}
                      className="px-3 py-1.5 rounded-lg bg-nexus-850 hover:bg-nexus-800 text-xs text-nexus-200 font-medium"
                    >
                      Editar Nota
                    </button>
                    <button
                      onClick={() => moveToTrash(currentNote.id)}
                      className="p-1.5 rounded-lg bg-nexus-850 text-nexus-400 hover:text-cyber-red"
                      title="Mover a papelera"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Note Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Escribe aquí tu información confidencial, claves SSH, códigos de respaldo..."
                  className="w-full h-full min-h-[380px] bg-nexus-900/80 border border-nexus-750 rounded-xl p-4 text-xs font-mono text-nexus-100 placeholder-nexus-500 focus:outline-none focus:border-cyan-accent leading-relaxed resize-none"
                />
              ) : (
                <div className="p-5 rounded-2xl bg-nexus-900/60 border border-nexus-750/80 min-h-[300px]">
                  <pre className="text-xs font-mono text-nexus-100 whitespace-pre-wrap leading-relaxed select-text font-sans">
                    {currentNote.content}
                  </pre>
                </div>
              )}

              {/* Attachments Placeholder Notice */}
              <div className="p-4 rounded-xl bg-nexus-900/40 border border-nexus-800 flex items-center justify-between text-xs text-nexus-400">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-cyan-accent" />
                  <span>Archivos Adjuntos Cifrados</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-nexus-800 text-cyan-accent border border-cyan-accent/20">
                  Fase Arquitectónica Siguiente
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-nexus-500 p-8 text-center">
            <FileText className="w-12 h-12 text-nexus-700 mb-2" />
            <p className="text-xs">No hay notas seguras disponibles.</p>
          </div>
        )}
      </div>
    </div>
  );
};
