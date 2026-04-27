import React, { useState, useMemo } from 'react';
import { 
  Employee, 
  MonthlyResult, 
  DepartmentManager, 
  ManagerMessageTemplate,
  SCENARIO_LABELS
} from '../types';
import { 
  Briefcase, 
  User, 
  Users,
  Search, 
  Copy, 
  MessageSquare, 
  BarChart3, 
  AlertCircle,
  ChevronRight,
  Info,
  FileText,
  CreditCard,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatMinutesToTime, deduceScenario } from '../services/calculator';

interface UnitManagerNotificationPageProps {
  employees: Employee[];
  results: Record<string, MonthlyResult>;
  currentPeriod: string;
  departments: string[];
  templates: ManagerMessageTemplate[];
  departmentManagers: DepartmentManager[];
  initialDepartment?: string | null;
}

export const UnitManagerNotificationPage: React.FC<UnitManagerNotificationPageProps> = ({
  employees,
  results,
  currentPeriod,
  departments,
  templates,
  departmentManagers,
  initialDepartment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string | null>(initialDepartment || null);
  const [activeTab, setActiveTab] = useState<'text' | 'visual'>('text');

  const filteredDepts = useMemo(() => {
    return departments.filter(d => 
      d.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'))
    );
  }, [departments, searchTerm]);

  const unitStats = useMemo(() => {
    if (!selectedDept) return null;
    
    const unitEmployees = employees.filter(e => e.department === selectedDept);
    const unitResults = unitEmployees.map(e => results[e.id]).filter(Boolean);
    
    const totalSalaryMinutes = unitResults.reduce((acc, r) => acc + (r.salaryDeductedMinutes || 0), 0);
    const totalLeaveMinutes = unitResults.reduce((acc, r) => acc + (r.leaveDeductedMinutes || 0), 0);
    const salaryDeductionCount = unitResults.filter(r => r.salaryDeductedMinutes > 0 || r.salaryDeductedAmountTry > 0).length;
    const leaveDeductionCount = unitResults.filter(r => r.leaveDeductedMinutes > 0).length;
    const disciplineCount = unitResults.filter(r => r.isDisciplineApplied).length;
    const carryoverCount = unitResults.filter(r => (r.nextSalaryPoolMinutes || 0) > 0 || (r.nextLeavePoolMinutes || 0) > 0).length;

    return {
      totalPersonnel: unitEmployees.length,
      salaryDeductionCount,
      leaveDeductionCount,
      disciplineCount,
      carryoverCount,
      totalSalaryMinutes,
      totalLeaveMinutes,
      personnel: unitEmployees.map(e => ({
        emp: e,
        res: results[e.id]
      }))
    };
  }, [selectedDept, employees, results]);

  const manager = useMemo(() => 
    departmentManagers.find(m => m.departmentName === selectedDept && m.isActive),
  [departmentManagers, selectedDept]);

  const generatedText = useMemo(() => {
    if (!selectedDept || !unitStats) return '';
    
    const template = templates.find(t => t.isActive) || templates[0];
    if (!template) return 'Yönetici bildirim şablonu bulunamadı.';

    let text = template.body || '';
    
    const personnelSummary = unitStats.personnel
      .map(p => {
        const r = p.res;
        if (!r || r.currentMissingMinutes <= 0) return null;
        
        const scenario = deduceScenario(r);
        const islem = SCENARIO_LABELS[scenario] || 'İşlem Yok';
        const eksik = formatMinutesToTime(r.currentMissingMinutes);
        const gec = r.currentLateDays || 0;
        const izinDusulen = formatMinutesToTime(r.leaveDeductedMinutes || 0);
        const maasAktarilan = formatMinutesToTime(Math.max(0, (r.nextSalaryPoolMinutes || 0) - (r.prevSalaryPoolMinutes || 0) + (r.salaryDeductedMinutes || 0)));
        const kesinti = r.salaryDeductedMinutes > 0 ? `${formatMinutesToTime(r.salaryDeductedMinutes)} Kesildi` : 'Yok';
        const devreden = formatMinutesToTime((r.nextSalaryPoolMinutes || 0) + (r.nextLeavePoolMinutes || 0));

        return `• [PERSONEL_ADI] → Toplam eksik süre: ${eksik}, Geç gün: ${gec}, İşlem: ${islem}, İzinden düşülen: ${izinDusulen}, Maaş havuzuna aktarılan: ${maasAktarilan}, Kesinti: ${kesinti}, Devreden: ${devreden}`.replace('[PERSONEL_ADI]', p.emp.name);
      })
      .filter(Boolean)
      .join('\n');

    const replacements: Record<string, string> = {
      '[BIRIM_SORUMLUSU_ADI]': manager?.managerName || 'Sayın Birim Sorumlusu',
      '[BIRIM_ADI]': selectedDept,
      '[AY_YIL]': currentPeriod,
      '[TOPLAM_PERSONEL]': String(unitStats.totalPersonnel),
      '[ISLEM_UYGULANAN_PERSONEL]': String(unitStats.salaryDeductionCount + unitStats.leaveDeductionCount),
      '[IZINDEN_KARSILANAN_PERSONEL]': String(unitStats.leaveDeductionCount),
      '[MAAS_HAVUZUNA_AKTARILAN_PERSONEL]': String(unitStats.salaryDeductionCount), // Simplified for summary
      '[MAAS_KESINTISI_UYGULANAN_PERSONEL]': String(unitStats.salaryDeductionCount),
      '[YEDI_GUN_KURALINA_TAKILAN_PERSONEL]': String(unitStats.disciplineCount),
      '[DEVREDEN_KAYIT_SAYISI]': String(unitStats.carryoverCount),
      '[PERSONEL_OZET_LISTESI]': personnelSummary || 'Bu dönem biriminizde herhangi bir kesinti uygulanmamıştır.'
    };

    Object.entries(replacements).forEach(([key, val]) => {
      text = text.replaceAll(key, val);
    });

    return text;
  }, [selectedDept, unitStats, manager, templates, currentPeriod]);

  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Birim Sorumlusu Bildirimleri</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Birim Bazlı PDKS Analiz Raporları</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Panel: Units */}
        <div className="w-80 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Birim Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredDepts.map((dept) => {
              const deptManager = departmentManagers.find(m => m.departmentName === dept && m.isActive);
              const count = employees.filter(e => e.department === dept).length;
              return (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all group ${
                    selectedDept === dept 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                      : 'hover:bg-slate-50 border-transparent border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      selectedDept === dept ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <div className={`text-sm font-black ${selectedDept === dept ? 'text-white' : 'text-slate-900'}`}>
                        {dept}
                      </div>
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${selectedDept === dept ? 'text-white/70' : 'text-slate-400'}`}>
                        {deptManager ? deptManager.managerName : 'Yönetici Atanmamış'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded-lg uppercase ${
                      selectedDept === dept ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count} Kişi
                    </span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedDept === dept ? 'text-white translate-x-1' : 'text-slate-300'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Detail */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedDept && unitStats ? (
              <motion.div
                key={selectedDept}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col h-full gap-6"
              >
                {/* Compact Selected Unit Info Card */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedDept}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-xs font-bold">{manager ? manager.managerName : 'Yönetici Atanmamış'}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="text-slate-500 text-xs font-bold">{unitStats.totalPersonnel} Personel</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex gap-4">
                        <div className="text-right">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">İşlem Gören</div>
                          <div className="text-sm font-black text-indigo-700">{unitStats.salaryDeductionCount + unitStats.leaveDeductionCount} Kişi</div>
                        </div>
                        <div className="w-px h-8 bg-slate-100"></div>
                        <div className="text-right">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Maaş Kesintisi</div>
                          <div className="text-sm font-black text-red-700">{unitStats.salaryDeductionCount} Kişi</div>
                        </div>
                        <div className="w-px h-8 bg-slate-100"></div>
                        <div className="text-right">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">İzin Kesintisi</div>
                          <div className="text-sm font-black text-orange-700">{unitStats.leaveDeductionCount} Kişi</div>
                        </div>
                      </div>
                      <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 ml-4">
                        <button
                          onClick={() => setActiveTab('text')}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${
                            activeTab === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Metin
                        </button>
                        <button
                          onClick={() => setActiveTab('visual')}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${
                            activeTab === 'visual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Görsel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                  {activeTab === 'text' ? (
                    <>
                      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Yönetici Özeti</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Birim Bazlı Toplu Bildirim</p>
                          </div>
                        </div>
                        <button 
                          onClick={handleCopy}
                          className={`px-6 py-2.5 text-white rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase shadow-lg active:scale-95 ${
                            isCopied ? 'bg-emerald-500 shadow-emerald-200' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Kopyalandı
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Metni Kopyala
                            </>
                          )}
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 p-6 md:p-10">
                        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 min-h-full relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                          <div className="p-8 md:p-12 font-serif text-slate-800 text-lg leading-relaxed whitespace-pre-wrap">
                            {generatedText}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-slate-50/30">
                      <div className="max-w-4xl mx-auto space-y-8">
                        <div className="text-center py-8 bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{selectedDept} - PDKS RAPORU</h3>
                          <p className="text-slate-500 font-bold mt-1 uppercase tracking-[0.2em] text-xs">{currentPeriod} Dönemi Analiz Özeti</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Kesinti Dağılımı</h4>
                            </div>
                            <div className="space-y-6">
                              <div>
                                <div className="flex justify-between text-sm font-black mb-2">
                                  <span className="text-slate-600 uppercase tracking-tight">Maaş Kesintisi</span>
                                  <span className="text-red-600">{unitStats.salaryDeductionCount} Personel</span>
                                </div>
                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(unitStats.salaryDeductionCount / unitStats.totalPersonnel) * 100}%` }}
                                    className="h-full bg-gradient-to-r from-red-500 to-rose-600 rounded-full" 
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-sm font-black mb-2">
                                  <span className="text-slate-600 uppercase tracking-tight">İzin Kesintisi</span>
                                  <span className="text-orange-600">{unitStats.leaveDeductionCount} Personel</span>
                                </div>
                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(unitStats.leaveDeductionCount / unitStats.totalPersonnel) * 100}%` }}
                                    className="h-full bg-gradient-to-r from-orange-500 to-amber-600 rounded-full" 
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                            <div className="flex items-center gap-2 mb-6">
                              <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Süre Analizi</h4>
                            </div>
                            <div className="space-y-6 text-center">
                              <div>
                                <div className="text-4xl font-black text-white tracking-tighter">{formatMinutesToTime(unitStats.totalSalaryMinutes + unitStats.totalLeaveMinutes)}</div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Toplam Kayıp Süre</div>
                              </div>
                              <div className="pt-6 border-t border-white/10 flex justify-around">
                                <div>
                                  <div className="text-xl font-black text-red-400">{formatMinutesToTime(unitStats.totalSalaryMinutes)}</div>
                                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Maaş</div>
                                </div>
                                <div>
                                  <div className="text-xl font-black text-orange-400">{formatMinutesToTime(unitStats.totalLeaveMinutes)}</div>
                                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">İzin</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                          <div className="px-8 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Etkilenen Personel Detayları</h4>
                            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-500 uppercase">
                              {unitStats.personnel.filter(p => (p.res?.salaryDeductedMinutes || 0) > 0 || (p.res?.leaveDeductedMinutes || 0) > 0).length} Kayıt
                            </span>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {unitStats.personnel
                              .filter(p => (p.res?.salaryDeductedMinutes || 0) > 0 || (p.res?.leaveDeductedMinutes || 0) > 0)
                              .map(p => (
                                <div key={p.emp.id} className="px-8 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                      {p.emp.name?.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <span className="text-sm font-black text-slate-700">{p.emp.name}</span>
                                  </div>
                                  <div className="flex gap-3">
                                    {(p.res?.salaryDeductedMinutes || 0) > 0 && (
                                      <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-black text-red-400 uppercase tracking-tighter mb-0.5">Maaş Kesintisi</span>
                                        <span className="px-3 py-1 bg-red-50 text-red-700 text-[10px] font-black rounded-lg border border-red-100">
                                          {formatMinutesToTime(p.res!.salaryDeductedMinutes)}
                                        </span>
                                      </div>
                                    )}
                                    {(p.res?.leaveDeductedMinutes || 0) > 0 && (
                                      <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-black text-orange-400 uppercase tracking-tighter mb-0.5">İzin Kesintisi</span>
                                        <span className="px-3 py-1 bg-orange-50 text-orange-700 text-[10px] font-black rounded-lg border border-orange-100">
                                          {formatMinutesToTime(p.res!.leaveDeductedMinutes)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
                      <Info className="w-3.5 h-3.5 text-indigo-500" />
                      Bu rapor birim yöneticisine PDKS sonuçlarını özetlemek için tasarlanmıştır.
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Briefcase className="w-12 h-12 text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Birim Seçimi Bekleniyor</h3>
                <p className="text-slate-500 max-w-xs text-center mt-3 text-sm font-medium leading-relaxed">
                  Yönetici raporu oluşturmak ve birim detaylarını incelemek için soldaki listeden bir birim seçin.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
