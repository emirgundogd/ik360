
import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Clock } from 'lucide-react';
import { taskService } from '../../services/taskService';

export const TaskNotificationToast: React.FC = () => {
  const [activeToast, setActiveToast] = useState<any | null>(null);
  const [lastCheckedTasks, setLastCheckedTasks] = useState<string>('');

  useEffect(() => {
    const checkNotifications = () => {
      const tasks = taskService.getTasks();
      const tasksJson = JSON.stringify(tasks.map(t => ({ id: t.id, status: t.status, updatedAt: t.updatedAt })));
      
      // Only trigger if tasks have changed or on first load
      if (tasksJson === lastCheckedTasks) return;
      setLastCheckedTasks(tasksJson);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const urgentTasks = tasks.filter(task => {
        if (task.status === 'completed' || task.status === 'cancelled') return false;
        
        // Check for delayed
        if (task.status === 'delayed') return true;

        // Check for today's critical tasks
        if (task.priority === 'critical' && task.plannedStartDate) {
          const startDate = new Date(task.plannedStartDate);
          startDate.setHours(0, 0, 0, 0);
          return startDate.getTime() === today.getTime();
        }

        return false;
      });

      if (urgentTasks.length > 0) {
        const task = urgentTasks[0];
        setActiveToast({
          id: task.id,
          title: task.status === 'delayed' ? 'Gecikme Uyarısı' : 'Kritik Görev Zamanı',
          message: `"${task.title}" görevi için işlem yapmanız gerekiyor.`,
          type: task.status === 'delayed' ? 'error' : 'warning'
        });

        // Play sound
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));

        // Auto hide after 5 seconds
        setTimeout(() => {
          setActiveToast(null);
        }, 5000);
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkNotifications, 30000);
    checkNotifications(); // Initial check

    return () => clearInterval(interval);
  }, [lastCheckedTasks]);

  if (!activeToast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] animate-in slide-in-from-right-10 duration-300">
      <div className={`
        w-80 p-4 rounded-2xl border shadow-2xl flex gap-3 relative overflow-hidden
        ${activeToast.type === 'error' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}
      `}>
        <div className="absolute top-0 left-0 w-1 h-full bg-current opacity-20"></div>
        
        <div className={`p-2 rounded-xl h-fit ${activeToast.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
          {activeToast.type === 'error' ? <AlertCircle className="w-5 h-5 animate-pulse" /> : <Clock className="w-5 h-5 animate-pulse" />}
        </div>

        <div className="flex-1">
          <h4 className="font-black text-slate-800 text-sm">{activeToast.title}</h4>
          <p className="text-xs text-slate-600 mt-1 font-bold leading-relaxed">{activeToast.message}</p>
        </div>

        <button 
          onClick={() => setActiveToast(null)}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
