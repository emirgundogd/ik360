import React, { useState } from 'react';
import { LeaveSettings } from './types';
import { Settings, Save, CheckCircle2 } from 'lucide-react';

interface Props {
  settings: LeaveSettings;
  onUpdateSettings: (settings: LeaveSettings) => void;
}

export const LeaveSettingsPanel: React.FC<Props> = ({ settings, onUpdateSettings }) => {
  const [localSettings, setLocalSettings] = useState<LeaveSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onUpdateSettings(localSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-brand-500" /> Ayarlar ve Tanımlamalar
          </h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Modül yapılandırması</p>
        </div>
        <button 
          onClick={handleSave}
          className="px-8 py-3 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 transition-all uppercase text-xs tracking-widest shadow-lg shadow-brand-900/20 flex items-center gap-2"
        >
          {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {isSaved ? 'Kaydedildi' : 'Kaydet'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight border-b border-slate-100 pb-4">Eşik Değerleri</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Kritik İzin Eşiği (Gün)</label>
              <input 
                type="number" 
                value={localSettings.criticalLeaveThreshold}
                onChange={(e) => setLocalSettings({...localSettings, criticalLeaveThreshold: Number(e.target.value)})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
              <p className="text-[10px] text-slate-400 font-medium mt-1">Bu değerin üzerindeki izinler "Kritik" (Yüksek Yük) olarak işaretlenir.</p>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Riskli (Eksi) Bakiye Eşiği (Gün)</label>
              <input 
                type="number" 
                value={localSettings.riskyNegativeThreshold}
                onChange={(e) => setLocalSettings({...localSettings, riskyNegativeThreshold: Number(e.target.value)})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
              <p className="text-[10px] text-slate-400 font-medium mt-1">Bu değerin altındaki izinler "Riskli" (genellikle 0) olarak işaretlenir.</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight border-b border-slate-100 pb-4">Hesaplama Yöntemleri</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Maliyet Hesaplama Yöntemi</label>
              <select 
                value={localSettings.costCalculationMethod}
                onChange={(e) => setLocalSettings({...localSettings, costCalculationMethod: e.target.value as any})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              >
                <option value="netSalary/30">Net Maaş / 30 Gün</option>
                <option value="grossSalary/30">Brüt Maaş / 30 Gün</option>
              </select>
              <p className="text-[10px] text-slate-400 font-medium mt-1">İzin maliyet raporlarında kullanılacak günlük ücret hesaplama yöntemi.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
