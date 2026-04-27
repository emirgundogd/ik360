
export type TaskCategory = 'monthly' | 'onetime' | 'daily' | 'uncertain';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'planned' | 'pending' | 'started' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
export type TaskFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'onetime' | 'uncertain' | 'custom';

export interface TaskStep {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  type: string; // 'regular' | 'onetime' etc.
  frequencyText: string; // The original text from excel like "Her Ayın İlk Haftası"
  frequency: TaskFrequency;
  estimatedDuration?: string;
  priority: TaskPriority;
  
  // Responsibility
  defaultResponsible: string;
  activeResponsible?: string;
  assistantResponsibles?: string[];
  
  // Dates
  plannedStartDate?: string; // ISO Date string
  plannedEndDate?: string; // ISO Date string
  actualStartDate?: string;
  actualEndDate?: string;
  
  status: TaskStatus;
  
  // Recurrence
  isRecurring: boolean;
  recurrencePattern?: string;
  
  // Steps / Sub-tasks
  steps?: TaskStep[];
  
  notes?: string;
  lastUpdatedBy?: string;
  auditLog?: TaskAuditLog[];
  
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface TaskAuditLog {
  date: string;
  user: string;
  action: string;
  details?: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  delayed: number;
  pending: number;
  planned: number;
  inProgress: number;
  critical: number;
  thisWeek: number;
  today: number;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  status: 'active' | 'completed' | 'cancelled';
  progress: number; // 0-100
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
}
