import React, { useState } from 'react';
import { AppConfig } from '../types';
import { Settings, Save, RotateCcw, Clock, Shield, Calculator, Building2 } from 'lucide-react';

interface Props {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
  onReset: () => void;
}

export const ConfigPanel: React.FC<Props> = ({ config, onConfigChange, onReset }) => {
  const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null);

  const handleChange = (field: keyof AppConfig, value: any) => {
    onConfigChange({ ...config, [field]: value });
  };

  const handleWeekendDayToggle = (day: number) => {
    const currentDays = config.weekendDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    handleChange('weekendDays', newDays);
  };

  const handleSave = () => {
    setMessage({ type: 'success', text: 'Sistem parametreleri başarıyla güncellendi.' });
    setTimeout(() => setMessage(null), 3000);
  };

  const days = [
    { id: 1, label: 'Pazartesi' },
    { id: 2, label: 'Salı' },
    { id: 3, label: 'Çarşamba' },
    { id: 4, label: 'Perşembe' },
    { id: 5, label: 'Cuma' },
    { id: 6, label: 'Cumartesi' },
    { id: 0, label: 'Pazar' },
  ];

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
      {message && (
        <div className={`mb-6 p-4 rounded-2xl text-sm font-bold animate-in fade-in duration-300 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {message.text}
        </div>
      )}
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Sistem Parametreleri</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Hesaplama ve kural tanımları</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onReset}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Varsayılana Dön
          </button>
        </div>
      </div>

      <div className="space-y-10">
        
        {/* Company Settings */}
        <div className="space-y-6 pb-8 border-b border-slate-100">
           <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-500" />
            Şirket ve Çalışma Düzeni
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Şirket Ünvanı</label>
              <input 
                type="text" 
                value={config.companyName || ''}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-brand-500 outline-none transition-all font-bold"
                placeholder="Şirket Adı Giriniz"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Haftalık Tatil Günleri</label>
              <div className="flex flex-wrap gap-2">
                {days.map(day => (
                  <button
                    key={day.id}
                    onClick={() => handleWeekendDayToggle(day.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      (config.weekendDays || []).includes(day.id)
                        ? 'bg-red-100 text-red-600 border-2 border-red-200'
                        : 'bg-slate-50 text-slate-400 border-2 border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-slate-400 font-medium italic">Seçili günler tatil olarak kabul edilir ve iş planlamasında atlanır.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 pt-8 border-t flex justify-end">
        <button 
          onClick={handleSave}
          className="px-10 py-4 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl shadow-xl shadow-brand-900/20 transition-all active:scale-95 uppercase text-sm tracking-widest flex items-center gap-2"
        >
          <Save className="w-5 h-5" /> Değişiklikleri Kaydet
        </button>
      </div>
    </div>
  );
};
