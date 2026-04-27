import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  Sparkles,
  User,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { taskService } from '../../services/taskService';
import { Task, TaskStatus } from '../../types/task';

interface TodayPlanProps {
  onChangeTab: (tab: string) => void;
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

export const TodayPlan: React.FC<TodayPlanProps> = ({ onChangeTab, tasks: allTasks, setTasks }) => {
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);
  const [progress, setProgress] = useState(0);

  const updateProgress = React.useCallback((currentTasks: Task[]) => {
    if (currentTasks.length === 0) {
      setProgress(0);
      return;
    }
    const completed = currentTasks.filter(t => t.status === 'completed').length;
    setProgress(Math.round((completed / currentTasks.length) * 100));
  }, []);

  const loadTodayTasks = React.useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredTasks = allTasks.filter(task => {
      if (!task.plannedStartDate) return false;
      const taskDate = new Date(task.plannedStartDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime() && !task.isDeleted;
    });

    // Sort by priority (critical > high > medium > low)
    const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
    filteredTasks.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

    setTodayTasks(filteredTasks);
    updateProgress(filteredTasks);
  }, [allTasks, updateProgress]);

  useEffect(() => {
    loadTodayTasks();
  }, [loadTodayTasks]);

  const handleToggleStatus = (task: Task) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'in_progress' : 'completed';
    const updatedTask = { ...task, status: newStatus };
    taskService.saveTask(updatedTask, allTasks);
    
    setTasks(allTasks.map(t => t.id === task.id ? updatedTask : t));
  };

  const handleAiPlan = () => {
    setIsPlanning(true);
    // Simulate AI planning delay
    setTimeout(() => {
      const plannedTasks = [...todayTasks].sort((a, b) => {
        // AI logic: Prioritize delayed tasks, then critical, then high
        if (a.status === 'delayed' && b.status !== 'delayed') return -1;
        if (b.status === 'delayed' && a.status !== 'delayed') return 1;
        
        const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      });
      setTodayTasks(plannedTasks);
      setIsPlanning(false);
    }, 1500);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return 'Kritik';
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return priority;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-md border border-white/10">
              <Calendar className="w-6 h-6 text-brand-300" />
            </div>
            <span className="text-brand-300 font-black tracking-widest uppercase text-sm">
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Bugünün Planı</h1>
          <p className="text-slate-300 font-medium text-lg max-w-xl">
            Bugün tamamlamanız gereken {todayTasks.length} iş bulunuyor. Yapay zeka ile gününüzü en verimli şekilde planlayın.
          </p>
        </div>

        <div className="relative z-10 w-full md:w-auto flex flex-col items-end gap-4">
          <button 
            onClick={handleAiPlan}
            disabled={isPlanning || todayTasks.length === 0}
            className="w-full md:w-auto px-6 py-3.5 bg-brand-500 hover:bg-brand-400 text-white font-black rounded-2xl transition-all shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isPlanning ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
            ) : (
              <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
            {isPlanning ? 'Planlanıyor...' : 'Yapay Zeka ile Planla'}
          </button>
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
          <div className="text-2xl font-black text-brand-600">%{progress}</div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-end mb-2">
            <h3 className="font-black text-slate-800">Günlük İlerleme</h3>
            <span className="text-sm font-bold text-slate-400">
              {todayTasks.filter(t => t.status === 'completed').length} / {todayTasks.length} Tamamlandı
            </span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-brand-500'}`}
            />
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black text-slate-800">Yapılacak İşler</h2>
          <button 
            onClick={() => onChangeTab('list')}
            className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            Tüm İşleri Gör <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence mode="popLayout">
          {todayTasks.length > 0 ? (
            todayTasks.map((task, index) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                key={task.id}
                className={`group bg-white p-5 rounded-3xl border shadow-sm transition-all hover:shadow-md flex flex-col md:flex-row gap-4 md:items-center ${
                  task.status === 'completed' 
                    ? 'border-emerald-100 bg-emerald-50/30' 
                    : task.status === 'delayed'
                    ? 'border-red-200 bg-red-50/30'
                    : 'border-slate-100 hover:border-brand-200'
                }`}
              >
                {/* Checkbox & Title */}
                <div className="flex items-start gap-4 flex-1">
                  <button 
                    onClick={() => handleToggleStatus(task)}
                    className={`mt-1 shrink-0 transition-transform active:scale-90 ${
                      task.status === 'completed' ? 'text-emerald-500' : 'text-slate-300 hover:text-brand-500'
                    }`}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-7 h-7" />
                    ) : (
                      <Circle className="w-7 h-7" />
                    )}
                  </button>
                  
                  <div>
                    <h3 className={`text-lg font-bold transition-colors ${
                      task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'
                    }`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className={`text-sm mt-1 line-clamp-1 ${
                        task.status === 'completed' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-3 md:justify-end pl-11 md:pl-0">
                  {task.status === 'delayed' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-100 text-red-700 text-xs font-black uppercase tracking-wider">
                      <AlertCircle className="w-3.5 h-3.5" /> Gecikti
                    </div>
                  )}
                  
                  <div className={`px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                    {getPriorityLabel(task.priority)}
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {task.estimatedDuration || 'Belirtilmedi'}
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-xs font-bold">
                    <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-black">
                      {task.activeResponsible?.charAt(0) || 'U'}
                    </div>
                    {task.activeResponsible || task.defaultResponsible}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-200 border-dashed"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Harika! Bugün için işiniz yok.</h3>
              <p className="text-slate-500 font-medium max-w-sm mx-auto">
                Bugün planlanmış tüm işleri tamamladınız veya hiç iş planlanmamış. Yeni bir iş ekleyebilir veya dinlenebilirsiniz.
              </p>
              <button 
                onClick={() => onChangeTab('list')}
                className="mt-8 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Tüm İşlere Göz At
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
