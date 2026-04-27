import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NotesDashboard } from './NotesDashboard';
import { NotesList } from './NotesList';
import { RemindersList } from './RemindersList';
import { NotesTrash } from './NotesTrash';
import { NotesSettings } from './NotesSettings';

interface NotesModuleProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onBack: () => void;
  notes: any[];
  setNotes: (notes: any[]) => void;
  reminders: any[];
  setReminders: (reminders: any[]) => void;
  settings: any;
  setSettings: (settings: any) => void;
}

export const NotesModule: React.FC<NotesModuleProps> = ({ 
  activeTab, 
  onTabChange, 
  onBack,
  notes,
  setNotes,
  reminders,
  setReminders,
  settings,
  setSettings
}) => {
  return (
    <div className="flex h-[calc(100vh-10rem)] bg-slate-50/50 rounded-3xl overflow-hidden border border-slate-200">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto p-6"
          >
            {activeTab === 'dashboard' && <NotesDashboard onNavigate={onTabChange} notes={notes} reminders={reminders} />}
            {activeTab === 'notes' && <NotesList notes={notes} setNotes={setNotes} />}
            {activeTab === 'reminders' && <RemindersList reminders={reminders} setReminders={setReminders} />}
            {activeTab === 'trash' && <NotesTrash notes={notes} setNotes={setNotes} reminders={reminders} setReminders={setReminders} />}
            {activeTab === 'settings' && <NotesSettings settings={settings} setSettings={setSettings} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
