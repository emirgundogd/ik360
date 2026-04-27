import React from 'react';
import { Employee } from '../types';
import { X, Save } from 'lucide-react';

interface PersonnelEditorProps {
  data: Employee[];
  onUpdate: (id: string, field: keyof Employee, value: any) => void;
  onClose: () => void;
}

export const PersonnelEditor: React.FC<PersonnelEditorProps> = ({ data, onUpdate, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-start p-4 pt-10">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200 max-h-[90vh]">
        <div className="p-6 border-b bg-slate-50 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold text-slate-800">Personel Toplu Düzenleme</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b">
              <tr>
                <th className="px-4 py-3">Personel</th>
                <th className="px-4 py-3">Net Maaş</th>
                <th className="px-4 py-3">Başlangıç İzin (dk)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((emp, index) => (
                <tr key={`${emp.id}-${index}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-800">{emp.name}</td>
                  <td className="px-4 py-3">
                    <input 
                      type="number" 
                      value={emp.netSalary || 0} 
                      onChange={e => onUpdate(emp.id, 'netSalary', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border rounded-lg"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="number" 
                      value={emp.initialLeavePoolMinutes || 0} 
                      onChange={e => onUpdate(emp.id, 'initialLeavePoolMinutes', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border rounded-lg"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 border-t bg-slate-50 rounded-b-xl flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 bg-brand-600 text-white font-bold hover:bg-brand-700 rounded-lg shadow-lg flex items-center gap-2">
            <Save className="w-4 h-4" /> Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
