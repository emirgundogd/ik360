
import React, { useState } from 'react';
import { X, Save, User, Briefcase, Hash, Phone, Mail, Wallet, Clock } from 'lucide-react';
import { Employee } from '../types';
import { parseTimeToMinutes, formatMinutesToTime } from '../services/calculator';

interface EmployeeFormModalProps {
  existingEmployee?: Employee; // If null, we are adding new
  allEmployees: Employee[];
  departments: string[];
  titles: string[];
  onSave: (emp: Employee) => void;
  onClose: () => void;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({ 
  existingEmployee, 
  allEmployees, 
  departments, 
  titles, 
  onSave, 
  onClose 
}) => {
  const [formData, setFormData] = useState<Partial<Employee>>(existingEmployee || {
    name: '',
    tcNo: '',
    department: '',
    title: '',
    phone: '',
    email: '',
    netSalary: 50000,
    initialLeaveBalanceMinutes: 0,
    initialLeavePoolMinutes: 0,
    initialSalaryPoolMinutes: 0,
    active: true,
    system: {
      showInPdks: true,
      isActive: true,
      role: 'USER'
    }
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    // Validation
    if (!formData.name || !formData.tcNo || !formData.department || !formData.title) {
      setError("Ad Soyad, TCKN, Departman ve Ünvan zorunludur.");
      return;
    }

    if (formData.tcNo.length !== 11) {
      setError("TCKN 11 haneli olmalıdır.");
      return;
    }

    // Duplicate Check (only if adding new)
    if (!existingEmployee) {
      const duplicate = allEmployees.find(e => e.tcNo === formData.tcNo);
      if (duplicate) {
        setError("Bu TCKN ile kayıtlı başka bir personel bulunmaktadır.");
        return;
      }
    }

    const finalEmployee: Employee = {
      ...formData as Employee,
      id: existingEmployee?.id || Math.random().toString(36).substr(2, 9)
    };

    onSave(finalEmployee);
    onClose();
  };

  const handleChange = (field: keyof Employee, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-start p-4 pt-10">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 border-b bg-slate-50 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold text-slate-800">
            {existingEmployee ? 'Personel Düzenle' : 'Yeni Personel Ekle'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ad Soyad *</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => handleChange('name', e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="Örn: Ahmet Yılmaz"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">TC Kimlik No *</label>
            <div className="relative">
              <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input 
                type="text" 
                maxLength={11}
                value={formData.tcNo} 
                onChange={e => handleChange('tcNo', e.target.value)}
                disabled={!!existingEmployee} // Cannot change TCKN on edit to prevent data mismatch
                className={`w-full pl-10 pr-3 py-2 border rounded-lg text-slate-900 outline-none font-mono tracking-wide ${existingEmployee ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white border-slate-300 focus:ring-2 focus:ring-brand-500'}`}
                placeholder="11 haneli TCKN"
              />
            </div>
            {existingEmployee && <p className="text-[10px] text-slate-400 mt-1">TCKN düzenlenemez. Silip yeniden ekleyiniz.</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Departman *</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <select 
                  value={formData.department} 
                  onChange={e => handleChange('department', e.target.value)}
                  className="w-full pl-10 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none appearance-none"
                >
                  <option value="">Seçiniz...</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                  {!departments.includes(formData.department || '') && formData.department && (
                    <option value={formData.department}>{formData.department} (Liste Dışı)</option>
                  )}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ünvan *</label>
              <div className="relative">
                <select 
                  value={formData.title} 
                  onChange={e => handleChange('title', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none appearance-none"
                >
                  <option value="">Seçiniz...</option>
                  {titles.map(title => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                  {!titles.includes(formData.title || '') && formData.title && (
                    <option value={formData.title}>{formData.title} (Liste Dışı)</option>
                  )}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefon</label>
               <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={e => handleChange('phone', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="+90 5..."
                  />
               </div>
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-Posta</label>
               <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => handleChange('email', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="mail@hayrat.org"
                  />
               </div>
             </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Mali Bilgiler ve Başlangıç Bakiyeleri</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Net Maaş (TL)</label>
                <div className="relative">
                  <Wallet className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="number" 
                    value={formData.netSalary} 
                    onChange={e => handleChange('netSalary', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Başlangıç İzin (SS:DD)</label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    defaultValue={formatMinutesToTime(formData.initialLeaveBalanceMinutes || 0)}
                    onBlur={e => handleChange('initialLeaveBalanceMinutes', parseTimeToMinutes(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none font-mono"
                    placeholder="0:00"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Devir &lt;4s (SS:DD)</label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    defaultValue={formatMinutesToTime(formData.initialLeavePoolMinutes || 0)}
                    onBlur={e => handleChange('initialLeavePoolMinutes', parseTimeToMinutes(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none font-mono"
                    placeholder="0:00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Devir &lt;8.5s (SS:DD)</label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    defaultValue={formatMinutesToTime(formData.initialSalaryPoolMinutes || 0)}
                    onBlur={e => handleChange('initialSalaryPoolMinutes', parseTimeToMinutes(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none font-mono"
                    placeholder="0:00"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <button 
                  type="button"
                  onClick={() => handleChange('system', { ...formData.system, showInPdks: formData.system?.showInPdks === false ? true : false })}
                  className={`w-10 h-6 rounded-full transition-all relative ${formData.system?.showInPdks !== false ? 'bg-brand-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.system?.showInPdks !== false ? 'left-5' : 'left-1'}`} />
                </button>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">PDKS'ye Dahil Mi?</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-slate-50 rounded-b-xl flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors">İptal</button>
          <button onClick={handleSubmit} className="px-6 py-2.5 bg-brand-600 text-white font-bold hover:bg-brand-700 rounded-lg shadow-lg flex items-center gap-2">
            <Save className="w-4 h-4" />
            Kaydet
          </button>
        </div>

      </div>
    </div>
  );
};
