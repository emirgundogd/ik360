import { Note, Reminder, NotesSettings, DEFAULT_NOTES_SETTINGS } from '../types/notes';

const STORAGE_KEYS = {
  NOTES: 'ik360_notes',
  REMINDERS: 'ik360_reminders',
  SETTINGS: 'ik360_notes_settings',
};

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const notesService = {
  // Settings
  getSettings(sourceSettings?: NotesSettings): NotesSettings {
    if (sourceSettings) return sourceSettings;
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...DEFAULT_NOTES_SETTINGS, ...JSON.parse(data) } : DEFAULT_NOTES_SETTINGS;
  },
  saveSettings(settings: NotesSettings, sourceSettings?: NotesSettings): void {
    if (!sourceSettings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }
  },

  // Notes
  getNotes(includeDeleted = false, sourceNotes?: Note[]): Note[] {
    let notes: Note[] = [];
    if (sourceNotes) {
      notes = sourceNotes;
    } else {
      const data = localStorage.getItem(STORAGE_KEYS.NOTES);
      notes = data ? JSON.parse(data) : [];
    }
    return includeDeleted ? notes : notes.filter(n => !n.isDeleted);
  },
  saveNote(note: Partial<Note>, sourceNotes?: Note[]): Note {
    const notes = this.getNotes(true, sourceNotes);
    const now = new Date().toISOString();
    
    if (note.id) {
      const index = notes.findIndex(n => n.id === note.id);
      if (index !== -1) {
        notes[index] = { ...notes[index], ...note, updatedAt: now };
        if (!sourceNotes) {
          localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
        }
        return notes[index];
      }
    }
    
    const newNote: Note = {
      id: generateId(),
      title: note.title || '',
      content: note.content || '',
      category: note.category || 'Genel',
      tags: note.tags || [],
      createdAt: now,
      updatedAt: now,
      isPinned: note.isPinned || false,
      color: note.color || 'default',
      isArchived: note.isArchived || false,
      isDeleted: false,
    };
    
    notes.push(newNote);
    if (!sourceNotes) {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    }
    return newNote;
  },
  softDeleteNote(id: string, sourceNotes?: Note[]): void {
    const notes = this.getNotes(true, sourceNotes);
    const index = notes.findIndex(n => n.id === id);
    if (index !== -1) {
      notes[index].isDeleted = true;
      notes[index].deletedAt = new Date().toISOString();
      if (!sourceNotes) {
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
      }
    }
  },
  restoreNote(id: string, sourceNotes?: Note[]): void {
    const notes = this.getNotes(true, sourceNotes);
    const index = notes.findIndex(n => n.id === id);
    if (index !== -1) {
      notes[index].isDeleted = false;
      notes[index].deletedAt = undefined;
      if (!sourceNotes) {
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
      }
    }
  },
  permanentDeleteNote(id: string, sourceNotes?: Note[]): void {
    const notes = this.getNotes(true, sourceNotes);
    const filtered = notes.filter(n => n.id !== id);
    if (!sourceNotes) {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(filtered));
    }
  },
  emptyNotesTrash(sourceNotes?: Note[]): void {
    const notes = this.getNotes(true, sourceNotes);
    const filtered = notes.filter(n => !n.isDeleted);
    if (!sourceNotes) {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(filtered));
    }
  },

  // Reminders
  getReminders(includeDeleted = false, sourceReminders?: Reminder[]): Reminder[] {
    let reminders: Reminder[] = [];
    if (sourceReminders) {
      reminders = sourceReminders;
    } else {
      const data = localStorage.getItem(STORAGE_KEYS.REMINDERS);
      reminders = data ? JSON.parse(data) : [];
    }
    return includeDeleted ? reminders : reminders.filter(r => !r.isDeleted);
  },
  saveReminder(reminder: Partial<Reminder>, sourceReminders?: Reminder[]): Reminder {
    const reminders = this.getReminders(true, sourceReminders);
    const now = new Date().toISOString();
    
    if (reminder.id) {
      const index = reminders.findIndex(r => r.id === reminder.id);
      if (index !== -1) {
        reminders[index] = { ...reminders[index], ...reminder };
        if (!sourceReminders) {
          localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
        }
        return reminders[index];
      }
    }
    
    const newReminder: Reminder = {
      id: generateId(),
      title: reminder.title || '',
      description: reminder.description || '',
      date: reminder.date || new Date().toISOString().split('T')[0],
      time: reminder.time || '09:00',
      type: reminder.type || 'once',
      priority: reminder.priority || 'medium',
      sound: reminder.sound || 'bell',
      isNotificationActive: reminder.isNotificationActive !== undefined ? reminder.isNotificationActive : true,
      createdAt: now,
      isCompleted: reminder.isCompleted || false,
      isSnoozed: reminder.isSnoozed || false,
      isDeleted: false,
    };
    
    reminders.push(newReminder);
    if (!sourceReminders) {
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
    }
    return newReminder;
  },
  softDeleteReminder(id: string, sourceReminders?: Reminder[]): void {
    const reminders = this.getReminders(true, sourceReminders);
    const index = reminders.findIndex(r => r.id === id);
    if (index !== -1) {
      reminders[index].isDeleted = true;
      reminders[index].deletedAt = new Date().toISOString();
      if (!sourceReminders) {
        localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
      }
    }
  },
  restoreReminder(id: string, sourceReminders?: Reminder[]): void {
    const reminders = this.getReminders(true, sourceReminders);
    const index = reminders.findIndex(r => r.id === id);
    if (index !== -1) {
      reminders[index].isDeleted = false;
      reminders[index].deletedAt = undefined;
      if (!sourceReminders) {
        localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
      }
    }
  },
  permanentDeleteReminder(id: string, sourceReminders?: Reminder[]): void {
    const reminders = this.getReminders(true, sourceReminders);
    const filtered = reminders.filter(r => r.id !== id);
    if (!sourceReminders) {
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(filtered));
    }
  },
  emptyRemindersTrash(sourceReminders?: Reminder[]): void {
    const reminders = this.getReminders(true, sourceReminders);
    const filtered = reminders.filter(r => !r.isDeleted);
    if (!sourceReminders) {
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(filtered));
    }
  },
};
