import React, { useState } from 'react';
import { Employee, DocumentRecord, NotificationRecord, DepartmentManager } from '../types';
import { Trash2, RotateCcw, User, FileText, Bell, ShieldCheck, AlertCircle } from 'lucide-react';

interface Props {
  deletedEmployees: Employee[];
  deletedDocuments: DocumentRecord[];
  deletedNotifications: NotificationRecord[];
  deletedManagers: DepartmentManager[];
  employees: Employee[];
  onRestore: (id: string, type: 'personnel' | 'document' | 'notification' | 'manager') => void;
  onPermanentDelete: (id: string, type: 'personnel' | 'document' | 'notification' | 'manager') => void;
  onClearAll: () => void;
}

export const TrashBin: React.FC<Props> = ({ 
  deletedEmployees, deletedDocuments, deletedNotifications, deletedManagers, 
  onRestore, onPermanentDelete, onClearAll 
}) => {
  const [activeTab, setActiveTab] = useState<'personnel' | 'document' | 'notification' | 'manager'>('personnel');

  const tabs = [
    { id: 'personnel', label: 'Personel', icon: User, count: deletedEmployees.length },
    { id: 'document', label: 'Evraklar', icon: FileText, count: deletedDocuments.length },
    { id: 'notification', label: 'Bildirimler', icon: Bell, count: deletedNotifications.length },
    { id: 'manager', label: 'Yöneticiler', icon: ShieldCheck, count: deletedManagers.length },
  ];

  let items: any[] = [];
  switch (activeTab) {
    case 'personnel': items = deletedEmployees; break;
    case 'document': items = deletedDocuments; break;
    case 'notification': items = deletedNotifications; break;
    case 'manager': items = deletedManagers; break;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-red-500 to-rose-600 p-8 rounded-[3rem] items-center gap-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Trash2 className="w-48 h-48" />
        </div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-4 bg-white/20 text-white rounded-3xl backdrop-blur-sm">
            <Trash2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-white uppercase tracking-tight">Çöp Kutusu</h3>
            <p className="text-white/80 font-medium text-lg mt-1">Silinmiş verilerinizi kurtarabilir veya kalıcı temizleyebilirsiniz.</p>
          </div>
        </div>
        <button 
          onClick={onClearAll}
          className="px-8 py-3.5 bg-white text-red-600 font-black rounded-2xl hover:bg-slate-50 transition-all active:scale-95 uppercase text-sm tracking-widest shadow-xl z-10 flex items-center gap-2"
        >
          <AlertCircle className="w-5 h-5" />
          Tümünü Temizle
        </button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-6 px-4 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white text-rose-600 border-b-2 border-rose-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600 border-b-2 border-transparent hover:bg-slate-100'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2.5 py-1 rounded-xl text-[10px] ${activeTab === tab.id ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div className="p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Trash2 className="w-10 h-10 text-slate-300" />
              </div>
              <h4 className="text-xl font-black text-slate-800 tracking-tight uppercase">Burası Tertemiz!</h4>
              <p className="text-slate-500 font-medium mt-2 max-w-sm">Seçili kategoriye ait silinmiş herhangi bir kayıt bulunamadı.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map(item => (
                <div key={item.id} className="flex flex-col justify-between p-6 bg-slate-50 rounded-3xl hover:bg-white hover:shadow-lg transition-all border-2 border-slate-100 hover:border-slate-200 group">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center text-rose-500 shrink-0">
                      {activeTab === 'personnel' && <User className="w-6 h-6" />}
                      {activeTab === 'document' && <FileText className="w-6 h-6" />}
                      {activeTab === 'notification' && <Bell className="w-6 h-6" />}
                      {activeTab === 'manager' && <ShieldCheck className="w-6 h-6" />}
                    </div>
                    <div>
                      <h5 className="font-black text-slate-800 text-lg tracking-tight mb-1">
                        {activeTab === 'personnel' ? (item.core?.name || item.name || 'İsimsiz') : 
                        activeTab === 'document' ? `${item.type} - ${item.month}` :
                        activeTab === 'notification' ? item.subject :
                        activeTab === 'manager' ? item.managerName : ''}
                      </h5>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                        SİLİNME: {new Date(item.deletedAt || '').toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200/60">
                    <button 
                      onClick={() => onRestore(item.id, activeTab)}
                      className="flex-1 py-3 bg-white text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 border border-emerald-100 font-black rounded-2xl transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest shadow-sm"
                    >
                      <RotateCcw className="w-4 h-4" /> Kurtar
                    </button>
                    <button 
                      onClick={() => onPermanentDelete(item.id, activeTab)}
                      className="flex-1 py-3 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-100 font-black rounded-2xl transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" /> Yok Et
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
