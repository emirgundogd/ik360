import React, { useState } from 'react';
import { DepartmentManager } from '../types';
import { Plus, Trash2, Users, Briefcase, ShieldCheck } from 'lucide-react';

interface Props {
  departments: string[];
  titles: string[];
  departmentManagers: DepartmentManager[];
  onUpdateDepartments: (deps: string[]) => void;
  onUpdateTitles: (titles: string[]) => void;
  onUpdateManagers: (managers: DepartmentManager[]) => void;
  onSoftDeleteManager: (id: string) => void;
}

export const MasterDataManager: React.FC<Props> = ({ 
  departments, titles, departmentManagers, 
  onUpdateDepartments, onUpdateTitles, onUpdateManagers, onSoftDeleteManager 
}) => {
  const [newDept, setNewDept] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'depts' | 'titles' | 'managers'>('depts');

  const handleAddDept = () => {
    if (newDept && !departments.includes(newDept)) {
      onUpdateDepartments([...departments, newDept]);
      setNewDept('');
    }
  };

  const handleAddTitle = () => {
    if (newTitle && !titles.includes(newTitle)) {
      onUpdateTitles([...titles, newTitle]);
      setNewTitle('');
    }
  };

  const handleDeleteDept = (dept: string) => {
    onUpdateDepartments(departments.filter(d => d !== dept));
  };

  const handleDeleteTitle = (title: string) => {
    onUpdateTitles(titles.filter(t => t !== title));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'depts', label: 'Departmanlar', icon: Briefcase },
          { id: 'titles', label: 'Ünvanlar', icon: Users },
          { id: 'managers', label: 'Yöneticiler', icon: ShieldCheck },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-brand-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
        {activeTab === 'depts' && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <input 
                type="text" 
                value={newDept}
                onChange={e => setNewDept(e.target.value)}
                placeholder="Yeni departman adı..."
                className="flex-1 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-brand-500 outline-none transition-all font-bold"
              />
              <button 
                onClick={handleAddDept}
                className="px-8 bg-brand-600 text-white font-black rounded-2xl shadow-lg hover:bg-brand-700 transition-all active:scale-95 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Ekle
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map(dept => (
                <div key={dept} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-brand-200 transition-all">
                  <span className="font-bold text-slate-700">{dept}</span>
                  <button 
                    onClick={() => handleDeleteDept(dept)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'titles' && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <input 
                type="text" 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Yeni ünvan adı..."
                className="flex-1 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-brand-500 outline-none transition-all font-bold"
              />
              <button 
                onClick={handleAddTitle}
                className="px-8 bg-brand-600 text-white font-black rounded-2xl shadow-lg hover:bg-brand-700 transition-all active:scale-95 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Ekle
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {titles.map(title => (
                <div key={title} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-brand-200 transition-all">
                  <span className="font-bold text-slate-700">{title}</span>
                  <button 
                    onClick={() => handleDeleteTitle(title)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'managers' && (
          <div className="space-y-6">
            <p className="text-slate-500 text-sm font-medium">Departman yöneticileri ve iletişim bilgileri yönetimi.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Departman</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Yönetici</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">E-Posta</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {departmentManagers.filter(m => !m.isDeleted).map(manager => (
                    <tr key={manager.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-700">{manager.departmentName}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{manager.managerName}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{manager.managerEmail}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => onSoftDeleteManager(manager.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
