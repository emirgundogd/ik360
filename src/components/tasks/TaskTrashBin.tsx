
import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Trash, 
  Search, 
  AlertTriangle,
  ClipboardList,
  Target,
  X
} from 'lucide-react';
import { Task, Goal } from '../../types/task';
import { taskService } from '../../services/taskService';
import { goalService } from '../../services/goalService';

interface TaskTrashBinProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
}

export const TaskTrashBin: React.FC<TaskTrashBinProps> = ({ 
  tasks, 
  setTasks, 
  goals, 
  setGoals 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'tasks' | 'goals'>('tasks');
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'task' | 'goal'} | null>(null);

  const deletedTasks = tasks.filter(t => t.isDeleted);
  const deletedGoals = goals.filter(g => g.isDeleted);

  const handleRestoreTask = (id: string) => {
    taskService.restoreTask(id, tasks);
    setTasks(tasks.map(t => t.id === id ? { ...t, isDeleted: false, deletedAt: undefined } : t));
  };

  const handlePermanentDeleteTask = (id: string) => {
    taskService.permanentDeleteTask(id, tasks);
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleRestoreGoal = (id: string) => {
    goalService.restoreGoal(id, goals);
    setGoals(goals.map(g => g.id === id ? { ...g, isDeleted: false, deletedAt: undefined } : g));
  };

  const handlePermanentDeleteGoal = (id: string) => {
    goalService.permanentDeleteGoal(id, goals);
    setGoals(goals.filter(g => g.id !== id));
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'task') {
      handlePermanentDeleteTask(itemToDelete.id);
    } else {
      handlePermanentDeleteGoal(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  const filteredTasks = deletedTasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGoals = deletedGoals.filter(g => 
    g.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Confirm Delete Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-start justify-center p-4 pt-10">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-red-900">Kalıcı Olarak Sil</h3>
              </div>
              <button 
                onClick={() => setItemToDelete(null)}
                className="p-2 hover:bg-red-100 rounded-xl transition-colors text-red-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 font-medium leading-relaxed">
                Bu öğeyi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
              >
                İptal
              </button>
              <button 
                onClick={confirmDelete}
                className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-900/20"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <Trash2 className="w-8 h-8 text-red-500" /> Çöp Kutusu
          </h1>
          <p className="text-slate-500 font-medium mt-1">Silinen işleri ve hedefleri buradan geri yükleyebilir veya kalıcı olarak silebilirsiniz.</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'tasks' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ClipboardList className="w-4 h-4" /> İŞLER ({deletedTasks.length})
          </button>
          <button 
            onClick={() => setActiveTab('goals')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'goals' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Target className="w-4 h-4" /> HEDEFLER ({deletedGoals.length})
          </button>
        </div>

        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Çöp kutusunda ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:border-red-500 focus:ring-0 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        {activeTab === 'tasks' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">İş Adı</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Silinme Tarihi</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTasks.map(task => (
                  <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-700">{task.title}</div>
                      <div className="text-[10px] text-slate-400 font-medium uppercase">{task.category}</div>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-500 font-medium">
                      {task.deletedAt ? new Date(task.deletedAt).toLocaleString('tr-TR') : '-'}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleRestoreTask(task.id)}
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                          title="Geri Yükle"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setItemToDelete({id: task.id, type: 'task'})}
                          className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                          title="Kalıcı Olarak Sil"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-8 py-20 text-center">
                      <AlertTriangle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">Çöp kutusu boş</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hedef Adı</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Silinme Tarihi</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredGoals.map(goal => (
                  <tr key={goal.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-700">{goal.title}</div>
                      <div className="text-[10px] text-slate-400 font-medium uppercase">HEDEF</div>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-500 font-medium">
                      {goal.deletedAt ? new Date(goal.deletedAt).toLocaleString('tr-TR') : '-'}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleRestoreGoal(goal.id)}
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                          title="Geri Yükle"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setItemToDelete({id: goal.id, type: 'goal'})}
                          className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                          title="Kalıcı Olarak Sil"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredGoals.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-8 py-20 text-center">
                      <AlertTriangle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">Çöp kutusu boş</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
