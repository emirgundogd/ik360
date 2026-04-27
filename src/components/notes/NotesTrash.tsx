import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, RefreshCw, AlertTriangle, StickyNote, Bell, X } from 'lucide-react';
import { notesService } from '../../services/notesService';
import { Note, Reminder } from '../../types/notes';

interface NotesTrashProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
}

export const NotesTrash: React.FC<NotesTrashProps> = ({ notes, setNotes, reminders, setReminders }) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'reminders'>('notes');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const deletedNotes = notes.filter(n => n.isDeleted);
  const deletedReminders = reminders.filter(r => r.isDeleted);

  const handleRestoreNote = (id: string) => {
    notesService.restoreNote(id, notes);
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isDeleted: false, deletedAt: undefined } : n));
  };

  const handlePermanentDeleteNote = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Notu Kalıcı Olarak Sil',
      message: 'Bu notu kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      onConfirm: () => {
        notesService.permanentDeleteNote(id, notes);
        setNotes(prev => prev.filter(n => n.id !== id));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleRestoreReminder = (id: string) => {
    notesService.restoreReminder(id, reminders);
    setReminders(prev => prev.map(r => r.id === id ? { ...r, isDeleted: false, deletedAt: undefined } : r));
  };

  const handlePermanentDeleteReminder = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hatırlatıcıyı Kalıcı Olarak Sil',
      message: 'Bu hatırlatıcıyı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      onConfirm: () => {
        notesService.permanentDeleteReminder(id, reminders);
        setReminders(prev => prev.filter(r => r.id !== id));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleEmptyTrash = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Çöp Kutusunu Boşalt',
      message: 'Çöp kutusundaki tüm öğeleri kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      onConfirm: () => {
        if (activeTab === 'notes') {
          notesService.emptyNotesTrash(notes);
          setNotes(prev => prev.filter(n => !n.isDeleted));
        } else {
          notesService.emptyRemindersTrash(reminders);
          setReminders(prev => prev.filter(r => !r.isDeleted));
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleRestoreAll = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Tümünü Geri Getir',
      message: 'Çöp kutusundaki tüm öğeleri geri getirmek istediğinize emin misiniz?',
      onConfirm: () => {
        if (activeTab === 'notes') {
          deletedNotes.forEach(n => notesService.restoreNote(n.id, notes));
          setNotes(prev => prev.map(n => n.isDeleted ? { ...n, isDeleted: false, deletedAt: undefined } : n));
        } else {
          deletedReminders.forEach(r => notesService.restoreReminder(r.id, reminders));
          setReminders(prev => prev.map(r => r.isDeleted ? { ...r, isDeleted: false, deletedAt: undefined } : r));
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const hasItems = activeTab === 'notes' ? deletedNotes.length > 0 : deletedReminders.length > 0;

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-10 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  {confirmModal.title}
                </h2>
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-slate-600 font-medium">{confirmModal.message}</p>
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-bold text-sm"
                  >
                    İptal
                  </button>
                  <button
                    onClick={confirmModal.onConfirm}
                    className="px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors font-bold text-sm shadow-sm"
                  >
                    Onayla
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Trash2 className="w-6 h-6 text-rose-500" />
          Çöp Kutusu
        </h1>
        
        {hasItems && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleRestoreAll}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Tümünü Geri Getir
            </button>
            <button
              onClick={handleEmptyTrash}
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors text-sm font-medium"
            >
              <AlertTriangle className="w-4 h-4" />
              Çöp Kutusunu Boşalt
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'notes' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <StickyNote className="w-4 h-4" />
          Silinen Notlar ({deletedNotes.length})
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'reminders' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Bell className="w-4 h-4" />
          Silinen Hatırlatıcılar ({deletedReminders.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        <AnimatePresence>
          {activeTab === 'notes' && deletedNotes.map(note => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={note.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between group"
            >
              <div>
                <h3 className="font-bold text-slate-800 line-clamp-1">{note.title || 'İsimsiz Not'}</h3>
                <p className="text-sm text-slate-500 line-clamp-1 mt-1">{note.content}</p>
                <p className="text-xs text-slate-400 mt-2">Silinme: {new Date(note.deletedAt!).toLocaleString('tr-TR')}</p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleRestoreNote(note.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors" title="Geri Getir">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button onClick={() => handlePermanentDeleteNote(note.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors" title="Kalıcı Olarak Sil">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}

          {activeTab === 'reminders' && deletedReminders.map(reminder => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={reminder.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between group"
            >
              <div>
                <h3 className="font-bold text-slate-800">{reminder.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{new Date(reminder.date).toLocaleDateString('tr-TR')} {reminder.time}</p>
                <p className="text-xs text-slate-400 mt-2">Silinme: {new Date(reminder.deletedAt!).toLocaleString('tr-TR')}</p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleRestoreReminder(reminder.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors" title="Geri Getir">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button onClick={() => handlePermanentDeleteReminder(reminder.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors" title="Kalıcı Olarak Sil">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!hasItems && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Trash2 className="w-12 h-12 mb-4 text-slate-300" />
            <p className="text-lg font-medium">Çöp kutusu boş</p>
          </div>
        )}
      </div>
    </div>
  );
};
