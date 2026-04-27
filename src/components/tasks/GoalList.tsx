
import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  Calendar,
  AlertTriangle,
  X
} from 'lucide-react';
import { Goal } from '../../types/task';
import { goalService } from '../../services/goalService';

interface GoalListProps {
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
}

export const GoalList: React.FC<GoalListProps> = ({ goals, setGoals }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    title: '',
    description: '',
    status: 'active',
    progress: 0,
    targetDate: new Date().toISOString().split('T')[0]
  });

  const handleAddGoal = () => {
    if (!newGoal.title) return;
    
    const goal = goalService.saveGoal({
      ...newGoal,
      id: '', // Service will generate
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Goal, goals);

    setGoals([goal, ...goals]);
    setShowAddModal(false);
    setNewGoal({
      title: '',
      description: '',
      status: 'active',
      progress: 0,
      targetDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleDeleteGoal = (id: string) => {
    goalService.deleteGoal(id, goals);
    setGoals(goals.filter(g => g.id !== id));
    setItemToDelete(null);
  };

  const handleUpdateProgress = (id: string, progress: number) => {
    const goal = goals.find(g => g.id === id);
    if (goal) {
      const updated = { ...goal, progress: Math.min(100, Math.max(0, progress)) };
      if (updated.progress === 100) updated.status = 'completed';
      goalService.saveGoal(updated, goals);
      setGoals(goals.map(g => g.id === id ? updated : g));
    }
  };

  const filteredGoals = goals.filter(goal => 
    goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    goal.description?.toLowerCase().includes(searchQuery.toLowerCase())
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
                <h3 className="text-lg font-black text-red-900">Hedefi Sil</h3>
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
                Bu hedefi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
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
                onClick={() => handleDeleteGoal(itemToDelete)}
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
            <Target className="w-8 h-8 text-brand-600" /> Hedefler
          </h1>
          <p className="text-slate-500 font-medium mt-1">Operasyonel hedeflerinizi takip edin ve yönetin.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-brand-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-brand-700 transition-all shadow-lg shadow-brand-900/20 active:scale-95"
        >
          <Plus className="w-5 h-5" /> YENİ HEDEF EKLE
        </button>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Hedeflerde ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:border-brand-500 focus:ring-0 transition-all shadow-sm"
          />
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Toplam</div>
            <div className="text-xl font-black text-slate-800">{goals.length}</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Tamamlanan</div>
            <div className="text-xl font-black text-slate-800">{goals.filter(g => g.status === 'completed').length}</div>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGoals.map(goal => (
          <div 
            key={goal.id}
            className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                goal.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                goal.status === 'cancelled' ? 'bg-slate-100 text-slate-500' : 'bg-brand-100 text-brand-700'
              }`}>
                {goal.status === 'active' ? 'AKTİF' : goal.status === 'completed' ? 'TAMAMLANDI' : 'İPTAL'}
              </div>
              <button 
                onClick={() => setItemToDelete(goal.id)}
                className="text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-lg font-black text-slate-800 mb-2 leading-tight">{goal.title}</h3>
            <p className="text-sm text-slate-500 font-medium mb-6 line-clamp-2">{goal.description}</p>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">İlerleme</div>
                <div className="text-sm font-black text-brand-600">%{goal.progress}</div>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${goal.progress === 100 ? 'bg-emerald-500' : 'bg-brand-500'}`}
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={goal.progress}
                  onChange={e => handleUpdateProgress(goal.id, parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('tr-TR') : 'Süresiz'}
                </span>
              </div>
              {goal.status !== 'completed' && (
                <button 
                  onClick={() => handleUpdateProgress(goal.id, 100)}
                  className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest"
                >
                  TAMAMLA
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredGoals.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-100 border-dashed">
            <Target className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">Hedef Bulunamadı</h3>
            <p className="text-slate-400 font-medium mt-2">Arama kriterlerinize uygun hedef bulunmuyor.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-tight">Yeni Hedef</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Hedef Başlığı</label>
                <input 
                  type="text"
                  value={newGoal.title}
                  onChange={e => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-brand-500 focus:ring-0"
                  placeholder="Örn: Verimlilik Artışı"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Açıklama</label>
                <textarea 
                  value={newGoal.description}
                  onChange={e => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-brand-500 focus:ring-0 min-h-[100px]"
                  placeholder="Hedef detaylarını yazın..."
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Hedef Tarih</label>
                <input 
                  type="date"
                  value={newGoal.targetDate}
                  onChange={e => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-brand-500 focus:ring-0"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest"
              >
                VAZGEÇ
              </button>
              <button 
                onClick={handleAddGoal}
                disabled={!newGoal.title}
                className="flex-1 py-3 bg-brand-600 text-white font-black rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-900/20 disabled:opacity-50 uppercase text-xs tracking-widest"
              >
                KAYDET
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
