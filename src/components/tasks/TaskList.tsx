
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar,
  Trash2,
  Edit
} from 'lucide-react';
import { taskService } from '../../services/taskService';
import { Task, TaskStatus, TaskPriority, TaskCategory } from '../../types/task';

import { TaskDetailModal } from './TaskDetailModal';

interface TaskListProps {
  initialFilter?: 'all' | 'delayed' | 'today' | 'week';
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ initialFilter = 'all', tasks, setTasks }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'delayed' | 'today' | 'week'>(initialFilter);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    setQuickFilter(initialFilter);
  }, [initialFilter]);

  const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
    const updatedTask = { ...task, status: newStatus };
    taskService.saveTask(updatedTask); // Still call service for logic if needed, but update state
    setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    if ((updatedTask as any).isDeleted) {
      setTasks(tasks.filter(t => t.id !== updatedTask.id));
    } else {
      taskService.saveTask(updatedTask);
      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    }
    setSelectedTask(null);
  };

  const handleDelete = (taskId: string) => {
    taskService.deleteTask(taskId);
    setTasks(tasks.filter(t => t.id !== taskId));
    setOpenMenuId(null);
    setSelectedTask(null);
  };

  const filteredTasks = tasks.filter(task => {
    const searchLower = searchTerm.toLocaleLowerCase('tr-TR');
    const matchesSearch = task.title.toLocaleLowerCase('tr-TR').includes(searchLower) || 
                          task.description?.toLocaleLowerCase('tr-TR').includes(searchLower);
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
    
    let matchesQuick = true;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = task.plannedStartDate ? new Date(task.plannedStartDate) : null;
    
    if (quickFilter === 'delayed') {
      matchesQuick = task.status === 'delayed';
    } else if (quickFilter === 'today') {
      if (!taskDate) matchesQuick = false;
      else {
        const tDate = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
        matchesQuick = tDate.getTime() === today.getTime();
      }
    } else if (quickFilter === 'week') {
      if (!taskDate) matchesQuick = false;
      else {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        matchesQuick = taskDate >= startOfWeek && taskDate <= endOfWeek;
      }
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesQuick;
  });

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'planned': return 'bg-slate-100 text-slate-600';
      case 'pending': return 'bg-amber-50 text-amber-600';
      case 'started': return 'bg-blue-50 text-blue-600';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'delayed': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-gray-100 text-gray-500 line-through';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical': return 'Kritik';
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return priority;
    }
  };

  const getCategoryLabel = (category: TaskCategory) => {
    switch (category) {
      case 'monthly': return 'Aylık';
      case 'onetime': return 'Tek Seferlik';
      case 'daily': return 'Günlük';
      default: return category;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">İş Listesi</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Tüm operasyonel görevlerin listesi</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filtrele
          </button>
          <button 
            onClick={() => {
              const newTask: Task = {
                id: `TASK-${Date.now()}`,
                title: '',
                description: '',
                category: 'onetime',
                type: 'regular',
                priority: 'medium',
                status: 'planned',
                defaultResponsible: 'İK Uzmanı',
                activeResponsible: 'İK Uzmanı',
                isRecurring: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              setSelectedTask(newTask);
            }}
            className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-900/20 text-sm flex items-center gap-2"
          >
            + Yeni İş
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
                type="text" 
                placeholder="İş adı veya açıklama ara..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition-colors"
            />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                <button 
                    onClick={() => setQuickFilter('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${quickFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    Tümü
                </button>
                <button 
                    onClick={() => setQuickFilter('today')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${quickFilter === 'today' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    Bugün
                </button>
                <button 
                    onClick={() => setQuickFilter('week')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${quickFilter === 'week' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    Bu Hafta
                </button>
                <button 
                    onClick={() => setQuickFilter('delayed')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${quickFilter === 'delayed' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    Gecikenler
                </button>
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-brand-500"
            >
            <option value="all">Tüm Durumlar</option>
            <option value="planned">Planlandı</option>
            <option value="pending">Beklemede</option>
            <option value="started">Başladı</option>
            <option value="in_progress">Devam Ediyor</option>
            <option value="completed">Tamamlandı</option>
            <option value="delayed">Gecikti</option>
            <option value="cancelled">İptal Edildi</option>
            </select>

            <select 
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-brand-500"
            >
            <option value="all">Tüm Öncelikler</option>
            <option value="critical">Kritik</option>
            <option value="high">Yüksek</option>
            <option value="medium">Orta</option>
            <option value="low">Düşük</option>
            </select>

            <select 
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-brand-500"
            >
            <option value="all">Tüm Kategoriler</option>
            <option value="monthly">Aylık</option>
            <option value="onetime">Tek Seferlik</option>
            <option value="daily">Günlük</option>
            </select>
        </div>
      </div>

      {/* Task Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Görev Adı</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Sorumlu</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Öncelik</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Kategori</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Planlanan Tarih</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Süre</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Durum</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">İşlem</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredTasks.map(task => (
                        <tr key={task.id} className={`hover:bg-slate-50 transition-colors ${task.status === 'delayed' ? 'bg-red-50/30' : ''}`}>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => handleStatusChange(task, task.status === 'completed' ? 'in_progress' : 'completed')}
                                        className={`shrink-0 transition-colors ${task.status === 'completed' ? 'text-emerald-500' : 'text-slate-300 hover:text-brand-500'}`}
                                    >
                                        {task.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                    </button>
                                    <div>
                                        <div 
                                          onClick={() => setSelectedTask(task)}
                                          className={`font-bold text-slate-800 text-sm cursor-pointer hover:text-brand-600 transition-colors ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}
                                        >
                                          {task.title}
                                        </div>
                                        <div className="text-xs text-slate-500 line-clamp-1 max-w-[200px]">{task.description}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                        {task.activeResponsible?.charAt(0) || 'U'}
                                    </div>
                                    <span className="text-sm font-medium text-slate-600">{task.activeResponsible || task.defaultResponsible}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                                    {getPriorityLabel(task.priority)}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                    {getCategoryLabel(task.category)}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    {task.plannedStartDate ? new Date(task.plannedStartDate).toLocaleDateString('tr-TR') : '-'}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    {task.estimatedDuration}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <select
                                    value={task.status}
                                    onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer appearance-none border-0 ${getStatusColor(task.status)}`}
                                >
                                    <option value="planned">Planlandı</option>
                                    <option value="pending">Beklemede</option>
                                    <option value="started">Başladı</option>
                                    <option value="in_progress">Devam Ediyor</option>
                                    <option value="completed">Tamamlandı</option>
                                    <option value="delayed">Gecikti</option>
                                    <option value="cancelled">İptal Edildi</option>
                                </select>
                            </td>
                            <td className={`px-6 py-4 text-right relative ${openMenuId === task.id ? 'z-50' : 'z-0'}`}>
                                <button 
                                    onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                                
                                {openMenuId === task.id && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-40" 
                                            onClick={() => setOpenMenuId(null)}
                                        ></div>
                                        <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                                            <button 
                                                onClick={() => {
                                                  setSelectedTask(task);
                                                  setOpenMenuId(null);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2"
                                            >
                                                <Edit className="w-4 h-4" /> Düzenle
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(task.id)}
                                                className="w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" /> Sil
                                            </button>
                                        </div>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">İş Bulunamadı</h3>
            <p className="text-slate-500 text-sm mt-1">Arama kriterlerinize uygun kayıt yok.</p>
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          onSave={handleTaskUpdate} 
        />
      )}
    </div>
  );
};
