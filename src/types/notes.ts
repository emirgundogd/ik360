export type NoteColor = 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  color: NoteColor;
  isArchived: boolean;
  isDeleted: boolean;
  deletedAt?: string;
}

export type ReminderType = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
export type ReminderPriority = 'low' | 'medium' | 'high';

export interface Reminder {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: ReminderType;
  priority: ReminderPriority;
  sound: string;
  isNotificationActive: boolean;
  createdAt: string;
  isCompleted: boolean;
  isSnoozed: boolean;
  snoozedUntil?: string; // ISO string
  isDeleted: boolean;
  deletedAt?: string;
}

export interface NotesSettings {
  isSoundEnabled: boolean;
  defaultSound: string;
  defaultSnoozeTime: number; // minutes
  autoEmptyTrashDays: number; // days
  defaultNoteView: 'card' | 'list';
}

export const DEFAULT_NOTES_SETTINGS: NotesSettings = {
  isSoundEnabled: true,
  defaultSound: 'bell',
  defaultSnoozeTime: 10,
  autoEmptyTrashDays: 30,
  defaultNoteView: 'card',
};
