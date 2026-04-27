import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { StickyNote, Bell, CheckCircle2, AlertCircle, Clock, Pin } from 'lucide-react';
import { notesService } from '../../services/notesService';
import { Note, Reminder } from '../../types/notes';

interface NotesDashboardProps {
  onNavigate: (tab: string) => void;
  notes: Note[];
  reminders: Reminder[];
}

export const NotesDashboard: React.FC<NotesDashboardProps> = ({ onNavigate, notes, reminders }) => {
  const pinnedNotes = notes.filter(n => n.isPinned);
  const todayReminders = reminders.filter(r => r.date === new Date().toISOString().split('T')[0] && !r.isCompleted);
  const overdueReminders = reminders.filter(r => {
    if (r.isCompleted) return false;
    const reminderDate = new Date(`${r.date}T${r.time}`);
    return reminderDate < new Date();
  });
  const completedReminders = reminders.filter(r => r.isCompleted);

  const stats = [
    { label: 'Toplam Not', value: notes.length, icon: StickyNote, color: 'text-blue-600', bg: 'bg-blue-50', onClick: () => onNavigate('notes') },
    { label: 'Sabitlenmiş Not', value: pinnedNotes.length, icon: Pin, color: 'text-amber-600', bg: 'bg-amber-50', onClick: () => onNavigate('notes') },
    { label: 'Bugünkü Hatırlatıcılar', value: todayReminders.length, icon: Bell, color: 'text-indigo-600', bg: 'bg-indigo-50', onClick: () => onNavigate('reminders') },
    { label: 'Gecikenler', value: overdueReminders.length, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', onClick: () => onNavigate('reminders') },
    { label: 'Tamamlanan', value: completedReminders.length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', onClick: () => onNavigate('reminders') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={stat.onClick}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-sm font-medium text-slate-500 mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-blue-500" />
              Son Notlar
            </h2>
            <button onClick={() => onNavigate('notes')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Tümünü Gör</button>
          </div>
          <div className="space-y-3">
            {notes.slice(0, 5).map(note => (
              <div key={note.id} className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-800 flex items-center gap-2">
                    {note.isPinned && <Pin className="w-3 h-3 text-amber-500" />}
                    {note.title || 'İsimsiz Not'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{new Date(note.updatedAt).toLocaleDateString('tr-TR')}</p>
                </div>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">{note.category}</span>
              </div>
            ))}
            {notes.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">Henüz not bulunmuyor.</div>
            )}
          </div>
        </div>

        {/* Upcoming Reminders */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Yaklaşan Hatırlatıcılar
            </h2>
            <button onClick={() => onNavigate('reminders')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Tümünü Gör</button>
          </div>
          <div className="space-y-3">
            {reminders.filter(r => !r.isCompleted).sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()).slice(0, 5).map(reminder => (
              <div key={reminder.id} className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-800">{reminder.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(reminder.date).toLocaleDateString('tr-TR')} {reminder.time}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-md ${
                  reminder.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                  reminder.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {reminder.priority === 'high' ? 'Yüksek' : reminder.priority === 'medium' ? 'Orta' : 'Düşük'}
                </span>
              </div>
            ))}
            {reminders.filter(r => !r.isCompleted).length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">Yaklaşan hatırlatıcı bulunmuyor.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
