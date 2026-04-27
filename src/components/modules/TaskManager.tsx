import React from 'react';
import { TaskLayout } from '../tasks/TaskLayout';
import { Task, Goal } from '../../types/task';

interface TaskManagerProps {
  activeTab?: string;
  onBack?: () => void;
  onTabChange?: (tab: string) => void;
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ 
  activeTab = 'dashboard', 
  onBack, 
  onTabChange,
  tasks,
  setTasks,
  goals,
  setGoals
}) => {
  return (
    <div className="h-full">
      <TaskLayout 
        activeTab={activeTab} 
        onBack={onBack || (() => window.location.reload())} 
        onTabChange={onTabChange}
        tasks={tasks}
        setTasks={setTasks}
        goals={goals}
        setGoals={setGoals}
      />
    </div>
  );
};
