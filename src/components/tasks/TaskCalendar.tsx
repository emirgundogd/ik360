
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  Plus,
  Calendar as CalendarIcon,
  X
} from 'lucide-react';
import { taskService } from '../../services/taskService';
import { Task } from '../../types/task';

interface TaskCalendarProps {
  onChangeTab?: (tab: string) => void;
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

export const TaskCalendar: React.FC<TaskCalendarProps> = ({ onChangeTab, tasks, setTasks }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeMenuDay, setActiveMenuDay] = useState<number | null>(null);
  const [selectedDayDetails, setSelectedDayDetails] = useState<number | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuDay(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
    
    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    const days = [];
    // Previous month days
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ day: 0, currentMonth: false });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, currentMonth: true });
    }
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getTasksForDay = (day: number) => {
    if (day === 0) return [];
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
    
    return tasks.filter(task => {
      if (!task.plannedStartDate) return false;
      const taskDate = new Date(task.plannedStartDate).toDateString();
      return taskDate === dateStr;
    });
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    
    if (task && day > 0) {
      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      
      // Preserve time
      if (task.plannedStartDate) {
         const oldDate = new Date(task.plannedStartDate);
         newDate.setHours(oldDate.getHours(), oldDate.getMinutes());
      } else {
         newDate.setHours(9, 0);
      }

      let newEndDate = undefined;
      if (task.plannedStartDate && task.plannedEndDate) {
        const oldStart = new Date(task.plannedStartDate);
        const oldEnd = new Date(task.plannedEndDate);
        const duration = oldEnd.getTime() - oldStart.getTime();
        newEndDate = new Date(newDate.getTime() + duration).toISOString();
      }

      const updatedTask = {
        ...task,
        plannedStartDate: newDate.toISOString(),
        plannedEndDate: newEndDate,
        updatedAt: new Date().toISOString()
      };
      
      taskService.saveTask(updatedTask, tasks);
      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Takvim</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Aylık iş planı ve yoğunluk haritası</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-black text-slate-800 w-32 text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto w-full h-full">
          <div className="min-w-[800px] h-full flex flex-col">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map(day => (
                <div key={day} className="py-4 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {days.map((dayObj, index) => {
            const dayTasks = getTasksForDay(dayObj.day);
            const isToday = dayObj.currentMonth && 
              dayObj.day === new Date().getDate() && 
              currentDate.getMonth() === new Date().getMonth() && 
              currentDate.getFullYear() === new Date().getFullYear();

            return (
              <div 
                key={index} 
                onDragOver={dayObj.currentMonth ? handleDragOver : undefined}
                onDrop={dayObj.currentMonth ? (e) => handleDrop(e, dayObj.day) : undefined}
                className={`
                  border-b border-r border-slate-100 p-2 min-h-[120px] relative group transition-colors
                  ${!dayObj.currentMonth ? 'bg-slate-50/50' : 'bg-white hover:bg-slate-50'}
                  ${isToday ? 'bg-blue-50/30' : ''}
                `}
              >
                {dayObj.currentMonth && (
                  <>
                    <span className={`
                      text-sm font-bold mb-2 block w-7 h-7 flex items-center justify-center rounded-full
                      ${isToday ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400'}
                    `}>
                      {dayObj.day}
                    </span>
                    
                    <div className="space-y-1 overflow-y-auto max-h-[100px] pr-1 custom-scrollbar">
                      {dayTasks.map(task => (
                        <div 
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          className={`
                            text-[10px] p-1.5 rounded-md border truncate font-bold cursor-grab active:cursor-grabbing hover:scale-105 transition-transform shadow-sm
                            ${task.status === 'completed' ? 'opacity-50 line-through' : ''}
                            ${task.priority === 'critical' ? 'bg-red-50 border-red-100 text-red-700' : 
                              task.priority === 'high' ? 'bg-orange-50 border-orange-100 text-orange-700' : 
                              task.priority === 'medium' ? 'bg-yellow-50 border-yellow-100 text-yellow-800' :
                              'bg-green-50 border-green-100 text-green-700'}
                          `}
                          title={`${task.title} (${task.status})`}
                        >
                          {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-[10px] text-slate-400 font-bold text-center pt-1">
                          + {dayTasks.length - 3} daha
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuDay(activeMenuDay === dayObj.day ? null : dayObj.day);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-400 transition-all"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {activeMenuDay === dayObj.day && (
                      <div className="absolute top-8 right-2 bg-white shadow-xl rounded-xl p-1 z-50 border border-slate-100 w-40 animate-in fade-in zoom-in-95 duration-200">
                        <button 
                          onClick={() => onChangeTab?.('list')}
                          className="w-full text-left text-xs font-bold p-2 hover:bg-slate-50 rounded-lg text-slate-700 flex items-center gap-2"
                        >
                          <Plus className="w-3 h-3" /> Yeni İş Ekle
                        </button>
                        <button 
                          onClick={() => setSelectedDayDetails(dayObj.day)}
                          className="w-full text-left text-xs font-bold p-2 hover:bg-slate-50 rounded-lg text-slate-700 flex items-center gap-2"
                        >
                          <CalendarIcon className="w-3 h-3" /> Gün Detayı
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
          </div>
        </div>
      </div>

      {/* Day Details Modal */}
      {selectedDayDetails && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-start justify-center p-4 pt-10">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-800">
                  {selectedDayDetails} {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Günlük İş Listesi</p>
              </div>
              <button 
                onClick={() => setSelectedDayDetails(null)}
                className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {getTasksForDay(selectedDayDetails).length > 0 ? (
                getTasksForDay(selectedDayDetails).map(task => (
                  <div key={task.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center group hover:border-brand-300 transition-all">
                    <div>
                      <div className="font-bold text-slate-800">{task.title}</div>
                      <div className="text-xs text-slate-500">{task.activeResponsible || task.defaultResponsible}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      task.priority === 'critical' ? 'bg-red-100 text-red-700' : 
                      task.priority === 'high' ? 'bg-orange-100 text-orange-700' : 
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 font-bold">
                  Bu gün için planlanmış iş bulunmuyor.
                </div>
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedDayDetails(null)}
                className="px-6 py-3 bg-slate-800 text-white font-black rounded-xl hover:bg-slate-900 transition-all uppercase text-xs tracking-widest"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
