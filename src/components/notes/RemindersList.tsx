import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Clock, Trash2, Edit2, CheckCircle2, AlertCircle, Volume2, VolumeX, Calendar, RefreshCw, Bell, X } from 'lucide-react';
import { notesService } from '../../services/notesService';
import { Reminder, ReminderPriority, ReminderType } from '../../types/notes';

interface RemindersListProps {
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
}

export const RemindersList: React.FC<RemindersListProps> = ({ reminders, setReminders }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Partial<Reminder> | null>(null);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('all');

  const handleSaveReminder = () => {
    if (!editingReminder?.title || !editingReminder?.date || !editingReminder?.time) return;
    const saved = notesService.saveReminder(editingReminder, reminders);
    
    if (editingReminder.id) {
      setReminders(prev => prev.map(r => r.id === saved.id ? saved : r));
    } else {
      setReminders(prev => [...prev, saved]);
    }
    
    setIsModalOpen(false);
    setEditingReminder(null);
  };

  const handleDelete = (id: string) => {
    notesService.softDeleteReminder(id, reminders);
    setReminders(prev => prev.map(r => r.id === id ? { ...r, isDeleted: true, deletedAt: new Date().toISOString() } : r));
  };

  const handleToggleComplete = (reminder: Reminder) => {
    const updated = { ...reminder, isCompleted: !reminder.isCompleted };
    notesService.saveReminder(updated, reminders);
    setReminders(prev => prev.map(r => r.id === reminder.id ? updated : r));
  };

  const filteredReminders = reminders.filter(reminder => {
    const matchesSearch = 
      reminder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    const today = new Date().toISOString().split('T')[0];
    const reminderDateTime = new Date(`${reminder.date}T${reminder.time}`);
    const now = new Date();

    if (filter === 'completed') return reminder.isCompleted;
    if (reminder.isCompleted) return false;

    if (filter === 'today') return reminder.date === today;
    if (filter === 'upcoming') return reminderDateTime > now;
    if (filter === 'overdue') return reminderDateTime < now;
    
    return true;
  }).sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
  });

  const priorityColors: Record<ReminderPriority, string> = {
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-rose-100 text-rose-700 border-rose-200',
  };

  const typeLabels: Record<ReminderType, string> = {
    once: 'Tek Seferlik',
    daily: 'Günlük',
    weekly: 'Haftalık',
    monthly: 'Aylık',
    custom: 'Özel',
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Hatırlatıcılar</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Hatırlatıcılarda ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <button
            onClick={() => { 
              setEditingReminder({ 
                priority: 'medium', 
                type: 'once', 
                isNotificationActive: true,
                date: new Date().toISOString().split('T')[0],
                time: '09:00'
              }); 
              setIsModalOpen(true); 
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Yeni Hatırlatıcı
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {(['all', 'today', 'upcoming', 'overdue', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filter === f ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {f === 'all' ? 'Tümü' : 
             f === 'today' ? 'Bugün' : 
             f === 'upcoming' ? 'Yaklaşanlar' : 
             f === 'overdue' ? 'Gecikenler' : 'Tamamlananlar'}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        <AnimatePresence>
          {filteredReminders.map(reminder => {
            const isOverdue = !reminder.isCompleted && new Date(`${reminder.date}T${reminder.time}`) < new Date();
            
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={reminder.id}
                className={`group relative rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-4 ${
                  reminder.isCompleted ? 'bg-slate-50 border-slate-200 opacity-75' : 
                  isOverdue ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'
                }`}
              >
                <button 
                  onClick={() => handleToggleComplete(reminder)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    reminder.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-500 text-transparent hover:text-emerald-500'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-bold truncate ${reminder.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                      {reminder.title}
                    </h3>
                    {isOverdue && <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-slate-500 truncate">{reminder.description}</p>
                  
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-rose-600' : 'text-slate-600'}`}>
                      <Calendar className="w-3 h-3" />
                      {new Date(reminder.date).toLocaleDateString('tr-TR')}
                    </span>
                    <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-rose-600' : 'text-slate-600'}`}>
                      <Clock className="w-3 h-3" />
                      {reminder.time}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md border ${priorityColors[reminder.priority]}`}>
                      {reminder.priority === 'high' ? 'Yüksek' : reminder.priority === 'medium' ? 'Orta' : 'Düşük'}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      <RefreshCw className="w-3 h-3" />
                      {typeLabels[reminder.type]}
                    </span>
                    {reminder.isNotificationActive ? (
                      <Volume2 className="w-3 h-3 text-indigo-500" />
                    ) : (
                      <VolumeX className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  <button onClick={() => { setEditingReminder(reminder); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(reminder.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {filteredReminders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Bell className="w-12 h-12 mb-4 text-slate-300" />
            <p className="text-lg font-medium">Hatırlatıcı bulunamadı</p>
            <p className="text-sm">Yeni bir hatırlatıcı oluşturarak başlayın.</p>
          </div>
        )}
      </div>

      {/* Reminder Editor Modal */}
      <AnimatePresence>
        {isModalOpen && editingReminder && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800">{editingReminder.id ? 'Hatırlatıcıyı Düzenle' : 'Yeni Hatırlatıcı'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Başlık</label>
                  <input
                    type="text"
                    value={editingReminder.title || ''}
                    onChange={e => setEditingReminder({ ...editingReminder, title: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Hatırlatıcı başlığı..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
                  <textarea
                    value={editingReminder.description || ''}
                    onChange={e => setEditingReminder({ ...editingReminder, description: e.target.value })}
                    className="w-full h-24 resize-none px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Detaylı açıklama (isteğe bağlı)..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tarih</label>
                    <input
                      type="date"
                      value={editingReminder.date || ''}
                      onChange={e => setEditingReminder({ ...editingReminder, date: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Saat</label>
                    <input
                      type="time"
                      value={editingReminder.time || ''}
                      onChange={e => setEditingReminder({ ...editingReminder, time: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tekrar</label>
                    <select
                      value={editingReminder.type || 'once'}
                      onChange={e => setEditingReminder({ ...editingReminder, type: e.target.value as ReminderType })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="once">Tek Seferlik</option>
                      <option value="daily">Günlük</option>
                      <option value="weekly">Haftalık</option>
                      <option value="monthly">Aylık</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Öncelik</label>
                    <select
                      value={editingReminder.priority || 'medium'}
                      onChange={e => setEditingReminder({ ...editingReminder, priority: e.target.value as ReminderPriority })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="low">Düşük</option>
                      <option value="medium">Orta</option>
                      <option value="high">Yüksek</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium text-slate-700">Sesli Bildirim</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={editingReminder.isNotificationActive}
                      onChange={e => setEditingReminder({ ...editingReminder, isNotificationActive: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
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
                  onClick={handleSaveReminder}
                  disabled={!editingReminder.title || !editingReminder.date || !editingReminder.time}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
