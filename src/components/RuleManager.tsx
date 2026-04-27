import React, { useState } from 'react';
import { UnitConfig, AppConfig } from '../types';
import { Save, Plus, Trash2, Settings2, Clock, ShieldAlert, Calendar, Info } from 'lucide-react';
import { formatMinutesToTime, parseTimeToMinutes } from '../services/calculator';

interface RuleManagerProps {
  unitConfigs: UnitConfig[];
  systemConfig: AppConfig;
  onUpdateUnitConfigs: (configs: UnitConfig[]) => void;
  onUpdateSystemConfig: (config: AppConfig) => void;
  departments: string[];
}

export const RuleManager: React.FC<RuleManagerProps> = ({
  unitConfigs,
  systemConfig,
  onUpdateUnitConfigs,
  onUpdateSystemConfig,
  departments
}) => {
  const [editingUnit, setEditingUnit] = useState<Partial<UnitConfig> | null>(null);
  const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null);

  const handleSaveSystem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newConfig: AppConfig = {
      ...systemConfig,
      defaultDailyWorkMinutes: parseTimeToMinutes(formData.get('daily') as string),
      defaultLeaveDeductionThresholdMinutes: parseTimeToMinutes(formData.get('leave') as string),
      defaultSalaryDeductionThresholdMinutes: parseTimeToMinutes(formData.get('salary') as string),
      defaultLateDayThreshold: parseInt(formData.get('late') as string) || 7,
    };
    onUpdateSystemConfig(newConfig);
    setMessage({ type: 'success', text: 'Sistem varsayılanları güncellendi.' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddUnit = () => {
    setEditingUnit({
      id: Math.random().toString(36).substr(2, 9),
      unitName: '',
      dailyWorkMinutes: systemConfig.defaultDailyWorkMinutes,
      leaveDeductionThresholdMinutes: systemConfig.defaultLeaveDeductionThresholdMinutes,
      salaryDeductionThresholdMinutes: systemConfig.defaultSalaryDeductionThresholdMinutes,
      lateDayThreshold: systemConfig.defaultLateDayThreshold
    });
  };

  const handleSaveUnit = () => {
    if (!editingUnit || !editingUnit.unitName) return;
    const exists = unitConfigs.find(u => u.id === editingUnit.id);
    if (exists) {
      onUpdateUnitConfigs(unitConfigs.map(u => u.id === editingUnit.id ? editingUnit as UnitConfig : u));
    } else {
      onUpdateUnitConfigs([...unitConfigs, editingUnit as UnitConfig]);
    }
    setEditingUnit(null);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {message && (
        <div className={`p-4 rounded-2xl text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {message.text}
        </div>
      )}
      {/* System Defaults */}
      <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <Settings2 className="w-6 h-6 text-brand-600" />
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Sistem Varsayılan Kuralları</h2>
        </div>
        <form onSubmit={handleSaveSystem} className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3 h-3" /> Günlük Çalışma (HH:MM)
            </label>
            <input 
              name="daily" 
              defaultValue={formatMinutesToTime(systemConfig.defaultDailyWorkMinutes)}
              className="w-full p-4 bg-slate-100 border-2 border-slate-200 rounded-2xl focus:bg-white focus:border-brand-500 outline-none transition-all font-bold text-slate-900"
              placeholder="08:30"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-3 h-3" /> İzin Alt Sınırı (HH:MM)
            </label>
            <input 
              name="leave" 
              defaultValue={formatMinutesToTime(systemConfig.defaultLeaveDeductionThresholdMinutes)}
              className="w-full p-4 bg-slate-100 border-2 border-slate-200 rounded-2xl focus:bg-white focus:border-brand-500 outline-none transition-all font-bold text-slate-900"
              placeholder="04:00"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-3 h-3" /> Maaş Alt Sınırı (HH:MM)
            </label>
            <input 
              name="salary" 
              defaultValue={formatMinutesToTime(systemConfig.defaultSalaryDeductionThresholdMinutes)}
              className="w-full p-4 bg-slate-100 border-2 border-slate-200 rounded-2xl focus:bg-white focus:border-brand-500 outline-none transition-all font-bold text-slate-900"
              placeholder="08:30"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Geç Gün Eşiği (Gün)
            </label>
            <input 
              name="late" 
              type="number"
              defaultValue={systemConfig.defaultLateDayThreshold}
              className="w-full p-4 bg-slate-100 border-2 border-slate-200 rounded-2xl focus:bg-white focus:border-brand-500 outline-none transition-all font-bold text-slate-900"
              placeholder="7"
            />
          </div>
          <div className="lg:col-span-4 flex justify-end">
            <button type="submit" className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl shadow-xl shadow-brand-900/20 transition-all active:scale-95 flex items-center gap-2 uppercase text-sm">
              <Save className="w-5 h-5" /> Varsayılanları Kaydet
            </button>
          </div>
        </form>
      </section>

      {/* Rule Explanations */}
      <section className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 shadow-inner">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Kural ve Hesaplama Rehberi</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Sistem Mantığı ve Kesinti Kuralları</p>
          </div>
        </div>
        
        <div className="p-10 space-y-12">
          {/* Main Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Rule 1 */}
            <div className="group p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-brand-200 hover:bg-white hover:shadow-xl transition-all duration-500">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-500 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-900 text-lg mb-2 tracking-tight">1. İzin Kullanımı</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Personelin eksik süresi oluştuğunda önce izin hakkı değerlendirilir. İzin hakkı yoksa, süre doğrudan Maaş Havuzuna gider. İzin hakkı varsa ve eksik süre <span className="text-brand-600 font-bold">4 saati</span> aşıyorsa izinden düşülür. 4 saatin altındaki süreler izinden düşülmez, İzin Havuzunda bekletilir.
              </p>
            </div>

            {/* Rule 2 */}
            <div className="group p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-rose-200 hover:bg-white hover:shadow-xl transition-all duration-500">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-rose-500 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-900 text-lg mb-2 tracking-tight">2. Maaş Kesme Mantığı</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Maaş havuzuna aktarılan süreler için anında maaş kesintisi yapılmaz. Kesinti alt limiti <span className="text-rose-600 font-bold">8 saat 30 dakikadır</span>. Toplam süre 8:30'un altındaysa maaş havuzunda bekler. 8:30'a ulaştığında veya geçtiğinde kesinti uygulanır.
              </p>
            </div>

            {/* Rule 3 */}
            <div className="group p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-brand-200 hover:bg-white hover:shadow-xl transition-all duration-500">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-500 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-900 text-lg mb-2 tracking-tight">3. 7 Gün Disiplin Kuralı</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Personelin ay içinde <span className="text-rose-600 font-bold">7 gün ve üzeri</span> geç kalma kaydı varsa, izin hakkı bulunsa bile tüm eksik süreleri doğrudan Maaş Havuzuna aktarılır. 7 gün kuralı, izin değerlendirmesinin önüne geçer.
              </p>
            </div>

            {/* Rule 4 */}
            <div className="group p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-rose-200 hover:bg-white hover:shadow-xl transition-all duration-500">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-rose-500 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-900 text-lg mb-2 tracking-tight">4. Yetersiz İzin Durumu</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Eksik süre 4 saati aşıyorsa ve mevcut izin bakiyesi eksik süreyi tam karşılamıyorsa; izin hakkı kadar kısım izinden karşılanır, karşılanamayan kalan süre aynı ay içinde doğrudan Maaş Havuzuna aktarılır.
              </p>
            </div>

            {/* Rule 5 */}
            <div className="group p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-brand-200 hover:bg-white hover:shadow-xl transition-all duration-500">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-500 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-900 text-lg mb-2 tracking-tight">5. Devretme Mantığı</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                <span className="font-bold">İzin havuzu için:</span> Süre 4 saatin altındaysa izinden düşüm yapılmaz, havuzda bekler ve sonraki aya devreder.<br/>
                <span className="font-bold">Maaş havuzu için:</span> Süre 8:30'un altındaysa maaş kesilmez, havuzda bekler ve sonraki aya devreder.
              </p>
            </div>
          </div>

          {/* Detailed Scenarios Section */}
          <div className="pt-8 border-t border-slate-100">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-brand-600" />
              Örnek Alt Limit Senaryoları
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scenario 1 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-brand-100 text-brand-700 text-[10px] font-black rounded-md uppercase">Örnek 1</span>
                  <h4 className="font-bold text-slate-800 text-sm">İzin Havuzuna Devir</h4>
                </div>
                <ul className="text-xs text-slate-600 leading-relaxed space-y-1 mb-3">
                  <li>• Geç gün: 5</li>
                  <li>• İzin hakkı: Yeterli</li>
                  <li>• Eksik süre: 3:00</li>
                </ul>
                <div className="text-xs font-medium text-slate-800 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-brand-600 font-bold">Sonuç:</span> 7 gün kuralı yok, izin hakkı var fakat 4 saat altı olduğu için izinden düşülmez. İzin havuzunda bekler ve sonraki aya devreder.
                </div>
              </div>

              {/* Scenario 2 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-rose-100 text-rose-700 text-[10px] font-black rounded-md uppercase">Örnek 2</span>
                  <h4 className="font-bold text-slate-800 text-sm">Maaş Havuzuna Devir</h4>
                </div>
                <ul className="text-xs text-slate-600 leading-relaxed space-y-1 mb-3">
                  <li>• İzin hakkı: Yok</li>
                  <li>• Eksik süre: 6:10</li>
                </ul>
                <div className="text-xs font-medium text-slate-800 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-rose-600 font-bold">Sonuç:</span> Doğrudan maaş havuzuna gider. 8:30 altı olduğu için maaş kesilmez. Maaş havuzunda bekler ve sonraki aya devreder.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Unit Based Configs */}
      <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Birim Çalışma Takvimi</h2>
          </div>
          <button onClick={handleAddUnit} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl flex items-center gap-2 shadow-lg transition-all active:scale-95 uppercase text-xs">
            <Plus className="w-4 h-4" /> Yeni Birim Ekle
          </button>
        </div>
        
        <div className="p-0">
          <table className="w-full text-left">
            <thead className="bg-slate-100 border-b border-slate-200 font-black uppercase text-slate-600 text-[10px] tracking-widest">
              <tr>
                <th className="px-8 py-4">Birim Adı</th>
                <th className="px-8 py-4">Günlük Süre</th>
                <th className="px-8 py-4">İzin Alt Sınır</th>
                <th className="px-8 py-4">Maaş Alt Sınır</th>
                <th className="px-8 py-4">Geç Gün Eşiği</th>
                <th className="px-8 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {unitConfigs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold uppercase italic">Birim bazlı kural tanımlanmamış.</td>
                </tr>
              ) : (
                unitConfigs.map(unit => (
                  <tr key={unit.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-4 font-black text-slate-800">{unit.unitName}</td>
                    <td className="px-8 py-4 font-mono text-brand-700">{formatMinutesToTime(unit.dailyWorkMinutes)}</td>
                    <td className="px-8 py-4 font-mono text-slate-600">{formatMinutesToTime(unit.leaveDeductionThresholdMinutes)}</td>
                    <td className="px-8 py-4 font-mono text-slate-600">{formatMinutesToTime(unit.salaryDeductionThresholdMinutes)}</td>
                    <td className="px-8 py-4 font-bold text-slate-700">{unit.lateDayThreshold} Gün</td>
                    <td className="px-8 py-4 text-right space-x-2">
                      <button onClick={() => setEditingUnit(unit)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"><Settings2 className="w-4 h-4"/></button>
                      <button onClick={() => onUpdateUnitConfigs(unitConfigs.filter(u => u.id !== unit.id))} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit Modal */}
      {editingUnit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-start p-4 pt-10">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 border border-white animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase mb-6">Birim Kuralı Düzenle</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Birim Adı</label>
                <select 
                  value={editingUnit.unitName} 
                  onChange={e => setEditingUnit({...editingUnit, unitName: e.target.value})}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-brand-500 outline-none transition-all font-bold"
                >
                  <option value="">Birim Seçiniz</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Günlük Süre</label>
                  <input 
                    value={formatMinutesToTime(editingUnit.dailyWorkMinutes || 0)} 
                    onChange={e => setEditingUnit({...editingUnit, dailyWorkMinutes: parseTimeToMinutes(e.target.value)})}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-brand-500 outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Geç Gün Eşiği</label>
                  <input 
                    type="number"
                    value={editingUnit.lateDayThreshold} 
                    onChange={e => setEditingUnit({...editingUnit, lateDayThreshold: parseInt(e.target.value) || 0})}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-brand-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">İzin Alt Sınır</label>
                  <input 
                    value={formatMinutesToTime(editingUnit.leaveDeductionThresholdMinutes || 0)} 
                    onChange={e => setEditingUnit({...editingUnit, leaveDeductionThresholdMinutes: parseTimeToMinutes(e.target.value)})}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-brand-500 outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Maaş Alt Sınır</label>
                  <input 
                    value={formatMinutesToTime(editingUnit.salaryDeductionThresholdMinutes || 0)} 
                    onChange={e => setEditingUnit({...editingUnit, salaryDeductionThresholdMinutes: parseTimeToMinutes(e.target.value)})}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-brand-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={() => setEditingUnit(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">İptal</button>
                <button onClick={handleSaveUnit} className="flex-[2] py-4 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl shadow-xl shadow-brand-900/20 transition-all active:scale-95">Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
