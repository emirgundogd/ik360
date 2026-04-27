import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle2, Clock, X } from 'lucide-react';
import { notesService } from '../../services/notesService';
import { Reminder } from '../../types/notes';

export const ReminderNotification: React.FC = () => {
  const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const reminders = notesService.getReminders();
      const settings = notesService.getSettings();
      
      const triggered = reminders.filter(r => {
        if (r.isCompleted || r.isDeleted) return false;
        
        const reminderTime = new Date(`${r.date}T${r.time}`);
        
        // Check if it's time (within the last minute to avoid missing)
        const diffMs = now.getTime() - reminderTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        // Show if exactly time, or if snoozed until now
        if (r.isSnoozed && r.snoozedUntil) {
          const snoozeTime = new Date(r.snoozedUntil);
          const snoozeDiffMins = Math.floor((now.getTime() - snoozeTime.getTime()) / 60000);
          return snoozeDiffMins === 0;
        }
        
        return diffMins === 0;
      });

      if (triggered.length > 0) {
        setActiveReminders(prev => {
          const newReminders = triggered.filter(t => !prev.find(p => p.id === t.id));
          if (newReminders.length > 0 && settings.isSoundEnabled) {
            playNotificationSound();
          }
          return [...prev, ...newReminders];
        });
      }
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Initial check

    return () => clearInterval(interval);
  }, []);

  const playNotificationSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.error('Audio playback failed', e);
    }
  };

  const handleComplete = (reminder: Reminder) => {
    notesService.saveReminder({ ...reminder, isCompleted: true, isSnoozed: false });
    setActiveReminders(prev => prev.filter(r => r.id !== reminder.id));
  };

  const handleSnooze = (reminder: Reminder, minutes: number) => {
    const snoozeTime = new Date();
    snoozeTime.setMinutes(snoozeTime.getMinutes() + minutes);
    
    notesService.saveReminder({ 
      ...reminder, 
      isSnoozed: true, 
      snoozedUntil: snoozeTime.toISOString() 
    });
    
    setActiveReminders(prev => prev.filter(r => r.id !== reminder.id));
  };

  const handleDismiss = (id: string) => {
    setActiveReminders(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <AnimatePresence>
        {activeReminders.map(reminder => (
          <motion.div
            key={reminder.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 overflow-hidden"
          >
            <div className={`h-1 w-full ${
              reminder.priority === 'high' ? 'bg-rose-500' : 
              reminder.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />
            
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Bell className="w-5 h-5 animate-bounce" />
                  <span className="font-bold text-sm">Hatırlatıcı</span>
                </div>
                <button 
                  onClick={() => handleDismiss(reminder.id)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <h3 className="font-bold text-slate-800 text-lg mb-1">{reminder.title}</h3>
              {reminder.description && (
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{reminder.description}</p>
              )}
              
              <div className="flex flex-col gap-2 mt-4">
                <button
                  onClick={() => handleComplete(reminder)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Tamamlandı
                </button>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSnooze(reminder, 5)}
                    className="flex items-center justify-center gap-1 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-xs font-medium"
                  >
                    <Clock className="w-3 h-3" />
                    5 dk
                  </button>
                  <button
                    onClick={() => handleSnooze(reminder, 15)}
                    className="flex items-center justify-center gap-1 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-xs font-medium"
                  >
                    <Clock className="w-3 h-3" />
                    15 dk
                  </button>
                  <button
                    onClick={() => handleSnooze(reminder, 60)}
                    className="flex items-center justify-center gap-1 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-xs font-medium"
                  >
                    <Clock className="w-3 h-3" />
                    1 saat
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
