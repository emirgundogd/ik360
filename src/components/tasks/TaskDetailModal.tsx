import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock,
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Save,
  User,
  RotateCcw
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, TaskStep, TaskFrequency } from '../../types/task';
import { taskService } from '../../services/taskService';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onSave }) => {
  const [editedTask, setEditedTask] = useState<Task>({ ...task });
  const [newStepTitle, setNewStepTitle] = useState('');
  const [responsibles, setResponsibles] = useState<string[]>([]);

  // Initialize steps if undefined
  useEffect(() => {
    if (!editedTask.steps) {
      setEditedTask(prev => ({ ...prev, steps: [] }));
    }
    // Load responsibles from settings
    const settings = taskService.getSettings();
    if (settings && settings.responsibles) {
      setResponsibles(settings.responsibles);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    onSave(editedTask);
    onClose();
  };

  const handleStepToggle = (stepId: string) => {
    setEditedTask(prev => ({
      ...prev,
      steps: prev.steps?.map(step => 
        step.id === stepId ? { ...step, isCompleted: !step.isCompleted } : step
      )
    }));
  };

  const handleAddStep = () => {
    if (!newStepTitle.trim()) return;
    
    const newStep: TaskStep = {
      id: Math.random().toString(36).substr(2, 9),
      title: newStepTitle,
      isCompleted: false
    };

    setEditedTask(prev => ({
      ...prev,
      steps: [...(prev.steps || []), newStep]
    }));
    setNewStepTitle('');
  };

  const handleDeleteStep = (stepId: string) => {
    setEditedTask(prev => ({
      ...prev,
      steps: prev.steps?.filter(step => step.id !== stepId)
    }));
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

  const calculateProgress = () => {
    if (!editedTask.steps || editedTask.steps.length === 0) return 0;
    const completed = editedTask.steps.filter(s => s.isCompleted).length;
    return Math.round((completed / editedTask.steps.length) * 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div className="flex-1 pr-8">
            <input
              type="text"
              value={editedTask.title}
              onChange={e => setEditedTask(prev => ({ ...prev, title: e.target.value }))}
              className="text-2xl font-black text-slate-800 bg-transparent border-none focus:ring-0 p-0 w-full placeholder-slate-300"
              placeholder="Görev Başlığı"
            />
            <div className="flex items-center gap-3 mt-2">
              <select
                value={editedTask.status}
                onChange={e => setEditedTask(prev => ({ ...prev, status: e.target.value as TaskStatus }))}
                className={`text-xs font-black uppercase tracking-wider px-2 py-1 rounded-lg border-none focus:ring-0 cursor-pointer ${getStatusColor(editedTask.status)}`}
              >
                <option value="planned">Planlandı</option>
                <option value="pending">Beklemede</option>
                <option value="started">Başladı</option>
                <option value="in_progress">Devam Ediyor</option>
                <option value="completed">Tamamlandı</option>
                <option value="delayed">Gecikti</option>
                <option value="cancelled">İptal Edildi</option>
              </select>
              
              <select
                value={editedTask.priority}
                onChange={e => setEditedTask(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg border-none focus:ring-0 cursor-pointer"
              >
                <option value="low">Düşük Öncelik</option>
                <option value="medium">Orta Öncelik</option>
                <option value="high">Yüksek Öncelik</option>
                <option value="critical">Kritik Öncelik</option>
              </select>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Açıklama</label>
            <textarea
              value={editedTask.description || ''}
              onChange={e => setEditedTask(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-brand-500 focus:ring-0 transition-colors min-h-[100px] resize-none"
              placeholder="Görev açıklaması ekleyin..."
            />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Planlanan Tarih
              </label>
              <input
                type="date"
                value={editedTask.plannedStartDate ? new Date(editedTask.plannedStartDate).toISOString().split('T')[0] : ''}
                onChange={e => setEditedTask(prev => ({ ...prev, plannedStartDate: new Date(e.target.value).toISOString() }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-brand-500 focus:ring-0"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3 h-3" /> Sorumlu
              </label>
              <select
                value={editedTask.activeResponsible || editedTask.defaultResponsible}
                onChange={e => setEditedTask(prev => ({ ...prev, activeResponsible: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-brand-500 focus:ring-0"
              >
                <option value="">Seçiniz...</option>
                {responsibles.map((resp, index) => (
                  <option key={index} value={resp}>{resp}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3 h-3" /> Tahmini Süre
              </label>
              <input
                type="text"
                value={editedTask.estimatedDuration || ''}
                onChange={e => setEditedTask(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-brand-500 focus:ring-0"
                placeholder="Örn: 2 Saat"
              />
            </div>

            {/* Recurrence Settings */}
            <div className="space-y-2">
              <div className="flex items-center justify-between h-full">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <RotateCcw className="w-3 h-3" /> Tekrarlama
                </label>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${editedTask.isRecurring ? 'text-brand-600' : 'text-slate-400'}`}>
                    {editedTask.isRecurring ? 'Aktif' : 'Pasif'}
                  </span>
                  <button 
                    onClick={() => setEditedTask(prev => ({ ...prev, isRecurring: !prev.isRecurring }))}
                    className={`w-10 h-6 rounded-full transition-colors relative ${editedTask.isRecurring ? 'bg-brand-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${editedTask.isRecurring ? 'left-5' : 'left-1'}`} />
                  </button>
                </div>
              </div>
              
              {editedTask.isRecurring && (
                <select
                  value={editedTask.frequency}
                  onChange={e => setEditedTask(prev => ({ ...prev, frequency: e.target.value as TaskFrequency }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-brand-500 focus:ring-0 mt-1"
                >
                  <option value="daily">Her Gün</option>
                  <option value="weekly">Her Hafta</option>
                  <option value="monthly">Her Ay</option>
                  <option value="yearly">Her Yıl</option>
                </select>
              )}
            </div>
          </div>

          {/* Steps / Checklist */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" /> İş Adımları ({editedTask.steps?.filter(s => s.isCompleted).length || 0}/{editedTask.steps?.length || 0})
              </label>
              {editedTask.steps && editedTask.steps.length > 0 && (
                <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">
                  %{calculateProgress()} Tamamlandı
                </span>
              )}
            </div>

            {/* Progress Bar */}
            {editedTask.steps && editedTask.steps.length > 0 && (
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-500 transition-all duration-500 ease-out"
                  style={{ width: `${calculateProgress()}%` }}
                />
              </div>
            )}

            <div className="space-y-2">
              {editedTask.steps?.map(step => (
                <div 
                  key={step.id}
                  className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors group"
                >
                  <button
                    onClick={() => handleStepToggle(step.id)}
                    className={`shrink-0 mt-0.5 transition-colors ${step.isCompleted ? 'text-emerald-500' : 'text-slate-300 hover:text-brand-500'}`}
                  >
                    {step.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </button>
                  <textarea
                    rows={1}
                    value={step.title}
                    onChange={e => {
                      setEditedTask(prev => ({
                        ...prev,
                        steps: prev.steps?.map(s => s.id === step.id ? { ...s, title: e.target.value } : s)
                      }));
                      // Auto-resize height
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    className={`flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium resize-none overflow-hidden py-0.5 ${step.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                    style={{ minHeight: '24px' }}
                  />
                  <button
                    onClick={() => handleDeleteStep(step.id)}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Add New Step */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                <Plus className="w-5 h-5 text-slate-400 mt-1" />
                <textarea
                  rows={1}
                  value={newStepTitle}
                  onChange={e => {
                    setNewStepTitle(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddStep();
                    }
                  }}
                  placeholder="Yeni bir adım ekle..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 placeholder-slate-400 resize-none overflow-hidden py-1"
                  style={{ minHeight: '28px' }}
                />
                <button
                  onClick={handleAddStep}
                  disabled={!newStepTitle.trim()}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors shrink-0 mt-0.5"
                >
                  EKLE
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <button
            onClick={() => {
              taskService.deleteTask(editedTask.id);
              onSave({ ...editedTask, isDeleted: true } as any); // Signal deletion
              onClose();
            }}
            className="px-4 py-2 text-red-500 hover:text-red-700 font-bold text-sm flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Görevi Sil
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
            >
              Vazgeç
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-900/20 flex items-center gap-2"
            >
              <Save className="w-5 h-5" /> Değişiklikleri Kaydet
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
