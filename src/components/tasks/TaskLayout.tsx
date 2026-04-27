
import React, { useState } from 'react';
import { TodayPlan } from './TodayPlan';
import { TaskDashboard } from './TaskDashboard';
import { TaskList } from './TaskList';
import { TaskCalendar } from './TaskCalendar';
import { TaskNotifications } from './TaskNotifications';
import { TaskReports } from './TaskReports';
import { TaskSettings } from './TaskSettings';
import { GoalList } from './GoalList';
import { TaskTrashBin } from './TaskTrashBin';
import { TaskNotificationToast } from './TaskNotificationToast';

interface TaskLayoutProps {
  activeTab?: string;
  onBack: () => void;
  onTabChange?: (tab: string) => void;
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
}

export const TaskLayout: React.FC<TaskLayoutProps> = ({ 
  activeTab = 'today', 
  onBack, 
  onTabChange,
  tasks,
  setTasks,
  goals,
  setGoals
}) => {
  const [listFilter, setListFilter] = useState<'all' | 'delayed' | 'today' | 'week'>('all');

  const handleNavigateToList = (filter: 'all' | 'delayed' | 'today' | 'week') => {
    setListFilter(filter);
    if (onTabChange) onTabChange('list');
  };
  
  const renderContent = () => {
    switch (activeTab) {
      case 'today': return <TodayPlan onChangeTab={onTabChange || (() => {})} tasks={tasks} setTasks={setTasks} />;
      case 'dashboard': return <TaskDashboard onChangeTab={onTabChange || (() => {})} onNavigateToList={handleNavigateToList} tasks={tasks} setTasks={setTasks} />;
      case 'list': return <TaskList initialFilter={listFilter} tasks={tasks} setTasks={setTasks} />;
      case 'calendar': return <TaskCalendar onChangeTab={onTabChange} tasks={tasks} setTasks={setTasks} />;
      case 'goals': return <GoalList goals={goals} setGoals={setGoals} />;
      case 'notifications': return <TaskNotifications />;
      case 'reports': return <TaskReports />;
      case 'settings': return <TaskSettings />;
      case 'trash': return <TaskTrashBin tasks={tasks} setTasks={setTasks} goals={goals} setGoals={setGoals} />;
      default: return <TodayPlan onChangeTab={onTabChange || (() => {})} tasks={tasks} setTasks={setTasks} />;
    }
  };

  return (
    <div className="h-full w-full bg-slate-50 font-sans">
      {renderContent()}
      <TaskNotificationToast />
    </div>
  );
};
