import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Pin, Archive, Trash2, Edit2, LayoutGrid, List, X, Save, Tag, StickyNote } from 'lucide-react';
import { notesService } from '../../services/notesService';
import { Note, NoteColor } from '../../types/notes';

interface NotesListProps {
  notes: Note[];
  setNotes: (notes: Note[]) => void;
}

export const NotesList: React.FC<NotesListProps> = ({ notes, setNotes }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null);
  const [filter, setFilter] = useState<'all' | 'pinned' | 'archived'>('all');

  const handleSaveNote = () => {
    if (!editingNote?.title && !editingNote?.content) return;
    const savedNote = notesService.saveNote(editingNote, notes);
    
    if (editingNote.id) {
      setNotes(notes.map(n => n.id === editingNote.id ? savedNote : n));
    } else {
      setNotes([...notes, savedNote]);
    }
    
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleDelete = (id: string) => {
    notesService.softDeleteNote(id, notes);
    setNotes(notes.map(n => n.id === id ? { ...n, isDeleted: true, deletedAt: new Date().toISOString() } : n));
  };

  const handleTogglePin = (note: Note) => {
    const updatedNote = { ...note, isPinned: !note.isPinned };
    notesService.saveNote(updatedNote, notes);
    setNotes(notes.map(n => n.id === note.id ? updatedNote : n));
  };

  const handleToggleArchive = (note: Note) => {
    const updatedNote = { ...note, isArchived: !note.isArchived };
    notesService.saveNote(updatedNote, notes);
    setNotes(notes.map(n => n.id === note.id ? updatedNote : n));
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    if (filter === 'pinned') return note.isPinned && !note.isArchived;
    if (filter === 'archived') return note.isArchived;
    return !note.isArchived;
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const colorClasses: Record<NoteColor, string> = {
    default: 'bg-white border-slate-200',
    red: 'bg-red-50 border-red-200',
    orange: 'bg-orange-50 border-orange-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-emerald-50 border-emerald-200',
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    pink: 'bg-pink-50 border-pink-200',
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Notlar</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Notlarda ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="flex bg-white rounded-xl border border-slate-200 p-1">
            <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'card' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => { setEditingNote({ color: 'default', tags: [], category: 'Genel' }); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Yeni Not
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {(['all', 'pinned', 'archived'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {f === 'all' ? 'Tümü' : f === 'pinned' ? 'Sabitlenenler' : 'Arşiv'}
          </button>
        ))}
      </div>

      {/* Notes Grid/List */}
      <div className={`flex-1 overflow-y-auto ${viewMode === 'card' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3'}`}>
        <AnimatePresence>
          {filteredNotes.map(note => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={note.id}
              className={`group relative rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all ${colorClasses[note.color]} ${viewMode === 'list' ? 'flex items-center justify-between' : 'flex flex-col h-64'}`}
            >
              <div className={viewMode === 'list' ? 'flex-1 flex items-center gap-4' : 'flex-1'}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-slate-800 line-clamp-1 flex items-center gap-2">
                    {note.isPinned && <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />}
                    {note.title || 'İsimsiz Not'}
                  </h3>
                  {viewMode === 'card' && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button onClick={() => handleTogglePin(note)} className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-white/50"><Pin className="w-4 h-4" /></button>
                      <button onClick={() => { setEditingNote(note); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-lg hover:bg-white/50"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleToggleArchive(note)} className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-white/50"><Archive className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(note.id)} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-white/50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
                <p className={`text-slate-600 text-sm ${viewMode === 'card' ? 'line-clamp-6' : 'line-clamp-1 flex-1'}`}>
                  {note.content}
                </p>
              </div>
              
              <div className={`mt-4 flex items-center justify-between text-xs text-slate-500 ${viewMode === 'list' ? 'mt-0 ml-4 min-w-[200px]' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-white/60 rounded-md font-medium">{note.category}</span>
                  {note.tags.length > 0 && <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {note.tags.length}</span>}
                </div>
                <span>{new Date(note.updatedAt).toLocaleDateString('tr-TR')}</span>
              </div>

              {viewMode === 'list' && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-4">
                  <button onClick={() => handleTogglePin(note)} className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-white/50"><Pin className="w-4 h-4" /></button>
                  <button onClick={() => { setEditingNote(note); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-lg hover:bg-white/50"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleToggleArchive(note)} className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-white/50"><Archive className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(note.id)} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-white/50"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {filteredNotes.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
            <StickyNote className="w-12 h-12 mb-4 text-slate-300" />
            <p className="text-lg font-medium">Not bulunamadı</p>
            <p className="text-sm">Yeni bir not oluşturarak başlayın.</p>
          </div>
        )}
      </div>

      {/* Note Editor Modal */}
      <AnimatePresence>
        {isModalOpen && editingNote && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800">{editingNote.id ? 'Notu Düzenle' : 'Yeni Not'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <input
                  type="text"
                  placeholder="Not Başlığı"
                  value={editingNote.title || ''}
                  onChange={e => setEditingNote({ ...editingNote, title: e.target.value })}
                  className="w-full text-2xl font-bold text-slate-800 placeholder:text-slate-300 border-none focus:ring-0 p-0 outline-none"
                />
                
                <textarea
                  placeholder="Notunuzu buraya yazın..."
                  value={editingNote.content || ''}
                  onChange={e => setEditingNote({ ...editingNote, content: e.target.value })}
                  className="w-full h-64 resize-none text-slate-600 placeholder:text-slate-300 border-none focus:ring-0 p-0 outline-none"
                />

                <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Kategori</label>
                    <input
                      type="text"
                      value={editingNote.category || ''}
                      onChange={e => setEditingNote({ ...editingNote, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Örn: Toplantı, Fikir..."
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Etiketler (Virgülle ayırın)</label>
                    <input
                      type="text"
                      value={editingNote.tags?.join(', ') || ''}
                      onChange={e => setEditingNote({ ...editingNote, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Örn: acil, proje..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">Renk</label>
                  <div className="flex gap-2">
                    {(Object.keys(colorClasses) as NoteColor[]).map(color => (
                      <button
                        key={color}
                        onClick={() => setEditingNote({ ...editingNote, color })}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${colorClasses[color]} ${editingNote.color === color ? 'scale-110 border-indigo-500' : 'border-transparent hover:scale-110'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={!editingNote.title && !editingNote.content}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  Kaydet
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
