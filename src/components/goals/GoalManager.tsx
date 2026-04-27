import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Target, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  X,
  Save,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { goalService } from '../../services/goalService';
import { Goal, GoalStatus, GoalPriority } from '../../types/goal';
import { motion, AnimatePresence } from 'motion/react';

export const GoalManager: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    setGoals(goalService.getGoals());
  }, []);

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hedefi Sil',
      message: 'Bu hedefi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      onConfirm: () => {
        goalService.deleteGoal(id);
        setGoals(prev => prev.filter(g => g.id !== id));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSave = (goal: Goal) => {
    const saved = goalService.saveGoal(goal);
    setGoals(prev => {
      const exists = prev.some(g => g.id === saved.id);
      if (exists) return prev.map(g => g.id === saved.id ? saved : g);
      return [...prev, saved];
    });
    setIsModalOpen(false);
    setSelectedGoal(null);
  };

  const filteredGoals = goals.filter(goal => 
    goal.title.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
    goal.description?.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'))
  );

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'cancelled': return 'bg-slate-100 text-slate-500';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusLabel = (status: GoalStatus) => {
    switch (status) {
      case 'completed': return 'Tamamlandı';
      case 'in_progress': return 'Devam Ediyor';
      case 'cancelled': return 'İptal Edildi';
      default: return 'Başlanmadı';
    }
  };

  const getPriorityColor = (priority: GoalPriority) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-emerald-500';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 relative">
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-10 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  {confirmModal.title}
                </h2>
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-slate-600 font-medium">{confirmModal.message}</p>
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-bold text-sm"
                  >
                    İptal
                  </button>
                  <button
                    onClick={confirmModal.onConfirm}
                    className="px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors font-bold text-sm shadow-sm"
                  >
                    Onayla
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Hedefler</h2>
          <p className="text-slate-500 font-medium mt-1">Stratejik hedefler ve ilerleme durumu</p>
        </div>
        <button 
          onClick={() => {
            setSelectedGoal({
              id: '',
              title: '',
              description: '',
              status: 'not_started',
              priority: 'medium',
              progress: 0,
              createdAt: '',
              updatedAt: ''
            });
            setIsModalOpen(true);
          }}
          className="px-6 py-3 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 transition-all shadow-xl shadow-brand-900/20 flex items-center gap-2 uppercase text-xs tracking-widest"
        >
          <Plus className="w-5 h-5" /> Yeni Hedef Ekle
        </button>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Hedef ara..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGoals.map(goal => (
          <div key={goal.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 group-hover:bg-brand-500 transition-colors"></div>
            
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-slate-50 ${getPriorityColor(goal.priority)}`}>
                <Target className="w-6 h-6" />
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => {
                    setSelectedGoal(goal);
                    setIsModalOpen(true);
                  }}
                  className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(goal.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-xl font-black text-slate-800 mb-2 leading-tight">{goal.title}</h3>
            <p className="text-slate-500 text-sm font-medium line-clamp-2 mb-6 h-10">{goal.description}</p>

            <div className="space-y-4">
              <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">İlerleme</span>
                <span className="text-sm font-black text-brand-600">%{goal.progress}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-500 transition-all duration-500"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusColor(goal.status)}`}>
                  {getStatusLabel(goal.status)}
                </span>
                {goal.targetDate && (
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <Calendar className="w-3 h-3" />
                    {new Date(goal.targetDate).toLocaleDateString('tr-TR')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && selectedGoal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-start justify-center p-4 pt-10">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  {selectedGoal.id ? 'Hedefi Düzenle' : 'Yeni Hedef'}
                </h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Hedef Parametreleri</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 hover:bg-slate-200 rounded-2xl transition-colors text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hedef Başlığı</label>
                <input 
                  type="text"
                  value={selectedGoal.title}
                  onChange={e => setSelectedGoal({...selectedGoal, title: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition-all"
                  placeholder="Örn: Dijital Dönüşüm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Açıklama</label>
                <textarea 
                  value={selectedGoal.description}
                  onChange={e => setSelectedGoal({...selectedGoal, description: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition-all min-h-[100px] resize-none"
                  placeholder="Hedef detaylarını yazın..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Durum</label>
                  <select 
                    value={selectedGoal.status}
                    onChange={e => setSelectedGoal({...selectedGoal, status: e.target.value as GoalStatus})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition-all appearance-none"
                  >
                    <option value="not_started">Başlanmadı</option>
                    <option value="in_progress">Devam Ediyor</option>
                    <option value="completed">Tamamlandı</option>
                    <option value="cancelled">İptal Edildi</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Öncelik</label>
                  <select 
                    value={selectedGoal.priority}
                    onChange={e => setSelectedGoal({...selectedGoal, priority: e.target.value as GoalPriority})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition-all appearance-none"
                  >
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">İlerleme (%)</label>
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={selectedGoal.progress}
                    onChange={e => setSelectedGoal({...selectedGoal, progress: parseInt(e.target.value) || 0})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hedef Tarih</label>
                  <input 
                    type="date"
                    value={selectedGoal.targetDate ? new Date(selectedGoal.targetDate).toISOString().split('T')[0] : ''}
                    onChange={e => setSelectedGoal({...selectedGoal, targetDate: new Date(e.target.value).toISOString()})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-4 text-slate-500 font-black uppercase text-xs tracking-widest hover:text-slate-700 transition-colors"
              >
                Vazgeç
              </button>
              <button 
                onClick={() => handleSave(selectedGoal)}
                className="px-10 py-4 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 transition-all shadow-xl shadow-brand-900/20 flex items-center gap-2 uppercase text-xs tracking-widest"
              >
                <Save className="w-5 h-5" /> Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
