import React, { useMemo } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Trash, 
  AlertTriangle, 
  UserX
} from 'lucide-react';
import { Employee } from '../../types';

interface Props {
  employees: Employee[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

export const PersonnelTrashBin: React.FC<Props> = ({ employees, onRestore, onPermanentDelete }) => {
  const deletedEmployees = useMemo(() => {
    return employees.filter(e => e.isDeleted).sort((a, b) => new Date(b.deletedAt || '').getTime() - new Date(a.deletedAt || '').getTime());
  }, [employees]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-[1.5rem] flex items-center justify-center shadow-sm border border-red-100/50">
            <Trash2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Çöp Kutusu</h2>
            <p className="text-sm font-bold text-slate-500 mt-1">Silinen personel kayıtları</p>
          </div>
        </div>
        <div className="bg-red-50 px-6 py-4 rounded-2xl border border-red-100/50 flex items-center gap-4 shadow-sm">
          <div className="p-2 bg-white rounded-xl shadow-sm">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-xs font-bold text-red-700 leading-relaxed">
            Buradaki kayıtlar <span className="font-black">30 gün</span> sonra otomatik olarak <br /> kalıcı olarak silinecektir.
          </p>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest w-12 text-center sticky top-0 bg-slate-50 z-10">No</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky top-0 bg-slate-50 z-10">Personel</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky top-0 bg-slate-50 z-10">Departman</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky top-0 bg-slate-50 z-10">Silinme Tarihi</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right sticky top-0 bg-slate-50 z-10">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deletedEmployees.map((emp, index) => (
                <tr key={`${emp.id}-${index}`} className="group hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-5 text-center">
                    <span className="text-[10px] font-black text-slate-400">{index + 1}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center text-xs font-black shadow-sm border border-slate-200/50 group-hover:scale-105 transition-transform">
                        {(emp.core?.name || emp.name || 'P').split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-bold text-slate-800">{emp.core?.name || emp.name || 'İsimsiz'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-slate-500">
                    <span className="px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200/50">
                      {emp.work?.department || emp.department || '-'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-slate-500">
                    {emp.deletedAt ? new Date(emp.deletedAt).toLocaleString('tr-TR') : '-'}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onRestore(emp.id)}
                        className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 hover:scale-105 transition-all flex items-center gap-2 border border-emerald-100/50 shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Geri Yükle
                      </button>
                      <button 
                        onClick={() => onPermanentDelete(emp.id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 hover:scale-105 transition-all flex items-center gap-2 border border-red-100/50 shadow-sm"
                      >
                        <Trash className="w-3.5 h-3.5" /> Kalıcı Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {deletedEmployees.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                        <UserX className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="text-xs font-bold text-slate-500">Çöp kutusu boş</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
