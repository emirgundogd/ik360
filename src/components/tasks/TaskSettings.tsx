
import React, { useState, useEffect } from 'react';
import { 
  Save, 
  UserPlus, 
  Trash2, 
  Clock, 
  Bell, 
  Shield,
  AlertTriangle,
  X
} from 'lucide-react';
import { taskService } from '../../services/taskService';

export const TaskSettings: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [newResponsible, setNewResponsible] = useState('');
  const [newTime, setNewTime] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    setSettings(taskService.getSettings());
  }, []);

  const handleSave = () => {
    taskService.saveSettings(settings);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleReset = () => {
    taskService.resetData();
    setSettings(taskService.getSettings());
    setShowConfirmReset(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const addResponsible = () => {
    if (newResponsible && !settings.responsibles.includes(newResponsible)) {
      setSettings({ ...settings, responsibles: [...settings.responsibles, newResponsible] });
      setNewResponsible('');
    }
  };

  const removeResponsible = (name: string) => {
    setSettings({ ...settings, responsibles: settings.responsibles.filter((r: string) => r !== name) });
  };

  const addTime = () => {
    if (newTime && !settings.notificationTimes.includes(newTime)) {
      setSettings({ ...settings, notificationTimes: [...settings.notificationTimes, newTime].sort() });
      setNewTime('');
    }
  };

  const removeTime = (time: string) => {
    setSettings({ ...settings, notificationTimes: settings.notificationTimes.filter((t: string) => t !== time) });
  };

  if (!settings) return <div>Yükleniyor...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Confirm Reset Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-start justify-center p-4 pt-10">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-red-900">Verileri Sıfırla</h3>
              </div>
              <button 
                onClick={() => setShowConfirmReset(false)}
                className="p-2 hover:bg-red-100 rounded-xl transition-colors text-red-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 font-medium leading-relaxed">
                Tüm veriler silinecek ve varsayılan verilere dönülecek. Bu işlem geri alınamaz. Emin misiniz?
              </p>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirmReset(false)}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
              >
                İptal
              </button>
              <button 
                onClick={handleReset}
                className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-900/20"
              >
                Evet, Sıfırla
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Tanımlamalar</h2>
          <p className="text-slate-500 font-medium mt-1">Sistem ayarları ve yetkilendirme</p>
        </div>
        <div className="flex items-center gap-3">
          {showSuccess && (
            <span className="text-emerald-600 font-bold text-sm animate-in fade-in slide-in-from-right-4 duration-300">
              Başarıyla kaydedildi!
            </span>
          )}
          <button 
            onClick={() => setShowConfirmReset(true)}
            className="px-6 py-3 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition-all flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" /> Verileri Sıfırla
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-900/20 flex items-center gap-2"
          >
            <Save className="w-5 h-5" /> Kaydet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Responsibles */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-600" /> Sorumlu Kişiler
          </h3>
          
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="Ad Soyad Giriniz" 
              value={newResponsible}
              onChange={e => setNewResponsible(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-brand-500"
            />
            <button 
              onClick={addResponsible}
              className="p-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
            {settings.responsibles.map((resp: string) => (
              <div key={resp} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-sm font-bold text-slate-700">{resp}</span>
                <button 
                  onClick={() => removeResponsible(resp)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Times */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" /> Bildirim Saatleri
          </h3>
          
          <div className="flex gap-2 mb-6">
            <input 
              type="time" 
              value={newTime}
              onChange={e => setNewTime(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-brand-500"
            />
            <button 
              onClick={addTime}
              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Clock className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {settings.notificationTimes.map((time: string) => (
              <div key={time} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-sm font-bold text-slate-700">{time}</span>
                <button 
                  onClick={() => removeTime(time)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
             <label className="block text-sm font-bold text-slate-500 mb-2">Varsayılan Uyarı Süresi (Gün)</label>
             <input 
               type="number" 
               value={settings.defaultWarningDays}
               onChange={e => setSettings({ ...settings, defaultWarningDays: parseInt(e.target.value) })}
               className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-brand-500"
             />
          </div>
        </div>
      </div>
    </div>
  );
};
