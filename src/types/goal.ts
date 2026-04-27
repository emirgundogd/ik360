
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled';
export type GoalPriority = 'low' | 'medium' | 'high';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  status: GoalStatus;
  priority: GoalPriority;
  targetDate?: string;
  progress: number; // 0-100
  createdAt: string;
  updatedAt: string;
}
