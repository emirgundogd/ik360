import React, { useState, useMemo } from 'react';
import { 
  Employee, 
  MonthlyResult, 
  MessageTemplate, 
  NotificationScenario,
  SCENARIO_LABELS 
} from '../types';
import { 
  Search, 
  Users, 
  CreditCard, 
  Calendar, 
  Info, 
  Copy, 
  MessageSquare, 
  Sparkles,
  AlertCircle,
  Clock,
  User,
  Briefcase,
  CheckCircle2,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatMinutesToTime, deduceScenario } from '../services/calculator';

interface PersonnelNotificationPageProps {
  employees: Employee[];
  results: Record<string, MonthlyResult>;
  currentPeriod: string;
  templates: MessageTemplate[];
  initialEmployeeId?: string | null;
}

export const PersonnelNotificationPage: React.FC<PersonnelNotificationPageProps> = ({
  employees,
  results,
  currentPeriod,
  templates,
  initialEmployeeId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialEmployeeId || null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'salary' | 'leave' | 'carryover' | 'none'>('all');

  // KPI Counts
  const kpis = useMemo(() => {
    const counts = {
      all: 0,
      salary: 0,
      leave: 0,
      carryover: 0,
      none: 0
    };

    employees.forEach(emp => {
      const res = results[emp.id];
      if (!res) return;
      counts.all++;
      if (res.salaryDeductedMinutes > 0 || res.salaryDeductedAmountTry > 0) counts.salary++;
      if (res.leaveDeductedMinutes > 0) counts.leave++;
      if (res.nextSalaryPoolMinutes > 0 || res.nextLeavePoolMinutes > 0) counts.carryover++;
      if (res.salaryDeductedMinutes === 0 && res.leaveDeductedMinutes === 0 && res.nextSalaryPoolMinutes === 0 && res.nextLeavePoolMinutes === 0) counts.none++;
    });

    return counts;
  }, [employees, results]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const res = results[emp.id];
      if (!res && activeFilter !== 'all') return false;

      const matchesSearch = emp.name?.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) || 
                           emp.tcNo?.includes(searchTerm);
      
      let matchesFilter = true;
      if (activeFilter === 'salary') matchesFilter = (res?.salaryDeductedMinutes || 0) > 0 || (res?.salaryDeductedAmountTry || 0) > 0;
      if (activeFilter === 'leave') matchesFilter = (res?.leaveDeductedMinutes || 0) > 0;
      if (activeFilter === 'carryover') matchesFilter = (res?.nextSalaryPoolMinutes || 0) > 0 || (res?.nextLeavePoolMinutes || 0) > 0;
      if (activeFilter === 'none') matchesFilter = (res?.salaryDeductedMinutes || 0) === 0 && (res?.leaveDeductedMinutes || 0) === 0 && (res?.nextSalaryPoolMinutes || 0) === 0 && (res?.nextLeavePoolMinutes || 0) === 0;

      return matchesSearch && matchesFilter;
    });
  }, [employees, results, searchTerm, activeFilter]);

  const selectedEmployee = useMemo(() => 
    employees.find(e => e.id === selectedId), 
  [employees, selectedId]);

  const selectedResult = useMemo(() => 
    selectedId ? results[selectedId] : null, 
  [results, selectedId]);

  // Decision Engine for Scenario
  const scenario = useMemo((): NotificationScenario => {
    if (!selectedResult) return NotificationScenario.NO_MISSING_TIME;
    return deduceScenario(selectedResult);
  }, [selectedResult]);

  const generatedText = useMemo(() => {
    if (!selectedEmployee) return '';
    if (!selectedResult) return 'Bu personel için henüz hesaplama yapılmamış. Lütfen önce hesaplama modülünden verileri güncelleyin.';
    
    const template = templates.find(t => t.scenario === scenario && t.isActive) || 
                    templates.find(t => t.scenario === scenario) ||
                    templates.find(t => t.isActive) ||
                    templates[0];
    
    if (!template) return 'Şablon bulunamadı. Lütfen Şablon Yönetimi sayfasından şablon oluşturun.';

    let text = template.body || '';
    const r = selectedResult;
    const e = selectedEmployee;

    const replacements: Record<string, string> = {
      '[PERSONEL_ADI]': e.name || '',
      '[AY_YIL]': currentPeriod,
      '[TOPLAM_EKSIK_SURE]': formatMinutesToTime(r.currentMissingMinutes || 0),
      '[GEC_GUN_ADEDI]': String(r.currentLateDays || 0),
      '[MEVCUT_IZIN_HAKKI]': formatMinutesToTime(r.currentImportedLeaveBalanceMinutes || 0),
      '[IZINDEN_DUSULEN_SURE]': formatMinutesToTime(r.leaveDeductedMinutes || 0),
      '[KALAN_IZIN_BAKIYESI]': formatMinutesToTime(Math.max(0, (r.currentImportedLeaveBalanceMinutes || 0) - (r.leaveDeductedMinutes || 0))),
      '[IZIN_HAVUZU_BEKLEYEN]': formatMinutesToTime(r.nextLeavePoolMinutes || 0),
      '[DEVREDEN_IZIN_HAVUZU]': formatMinutesToTime(r.nextLeavePoolMinutes || 0),
      '[MAAS_HAVUZUNA_AKTARILAN]': formatMinutesToTime(Math.max(0, (r.nextSalaryPoolMinutes || 0) - (r.prevSalaryPoolMinutes || 0) + (r.salaryDeductedMinutes || 0))),
      '[MAAS_HAVUZU_BEKLEYEN]': formatMinutesToTime(r.nextSalaryPoolMinutes || 0),
      '[DEVREDEN_MAAS_HAVUZU]': formatMinutesToTime(r.nextSalaryPoolMinutes || 0),
      '[MAAS_KESINTISINE_ESAS_SURE]': formatMinutesToTime(r.salaryDeductedMinutes || 0),
      '[KESINTI_TUTARI]': (r.salaryDeductedAmountTry || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' TL',
      '[DEVREDEN_SURE]': formatMinutesToTime((r.nextSalaryPoolMinutes || 0) + (r.nextLeavePoolMinutes || 0))
    };

    Object.entries(replacements).forEach(([key, val]) => {
      text = text.replaceAll(key, val);
    });

    return text;
  }, [selectedEmployee, selectedResult, scenario, templates, currentPeriod]);

  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] gap-6">
      {/* Header & KPIs */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Personel Bildirim Paneli</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentPeriod} Dönemi Bildirim Hazırlama</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100/80 p-2 rounded-full border border-slate-200/60 shadow-inner">
              {[
                { id: 'all', label: 'TÜMÜ', count: kpis.all, icon: Users, color: 'blue' },
                { id: 'salary', label: 'MAAŞ', count: kpis.salary, icon: CreditCard, color: 'red' },
                { id: 'leave', label: 'İZİN', count: kpis.leave, icon: Calendar, color: 'orange' },
                { id: 'carryover', label: 'DEVİR', count: kpis.carryover, icon: ArrowRightLeft, color: 'indigo' },
                { id: 'none', label: 'EKSİK YOK', count: kpis.none, icon: CheckCircle2, color: 'emerald' }
              ].map((f) => {
                const isActive = activeFilter === f.id;
                const Icon = f.icon;
                
                // Dynamic color classes based on the filter's color theme
                const activeClasses = {
                  blue: 'bg-white text-blue-600 shadow-md shadow-blue-100 ring-1 ring-blue-200/50',
                  red: 'bg-white text-red-600 shadow-md shadow-red-100 ring-1 ring-red-200/50',
                  orange: 'bg-white text-orange-600 shadow-md shadow-orange-100 ring-1 ring-orange-200/50',
                  indigo: 'bg-white text-indigo-600 shadow-md shadow-indigo-100 ring-1 ring-indigo-200/50',
                  emerald: 'bg-white text-emerald-600 shadow-md shadow-emerald-100 ring-1 ring-emerald-200/50',
                }[f.color];

                const activeBadgeClasses = {
                  blue: 'bg-blue-100 text-blue-700',
                  red: 'bg-red-100 text-red-700',
                  orange: 'bg-orange-100 text-orange-700',
                  indigo: 'bg-indigo-100 text-indigo-700',
                  emerald: 'bg-emerald-100 text-emerald-700',
                }[f.color];

                const activeGradient = {
                  blue: 'from-blue-500',
                  red: 'from-red-500',
                  orange: 'from-orange-500',
                  indigo: 'from-indigo-500',
                  emerald: 'from-emerald-500',
                }[f.color];

                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id as any)}
                    className={`px-6 py-3 rounded-full text-xs font-black uppercase transition-all duration-300 flex items-center gap-3 relative overflow-hidden group ${
                      isActive 
                        ? activeClasses
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                    }`}
                  >
                    {isActive && (
                      <div className={`absolute inset-0 opacity-10 bg-gradient-to-r ${activeGradient} to-transparent`}></div>
                    )}
                    <Icon className={`w-4 h-4 ${isActive ? '' : 'opacity-70 group-hover:opacity-100 transition-opacity'}`} />
                    <span className="relative z-10 tracking-wide">{f.label}</span>
                    <span className={`relative z-10 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                      isActive ? activeBadgeClasses : 'bg-slate-200/80 text-slate-500 group-hover:bg-slate-300/50'
                    }`}>
                      {f.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Panel: Personnel List */}
        <div className="w-85 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Personel veya TC No Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
            {filteredEmployees.map((emp) => {
              const res = results[emp.id];
              const hasAction = (res?.salaryDeductedMinutes > 0 || res?.salaryDeductedAmountTry > 0) || res?.leaveDeductedMinutes > 0;
              const isSelected = selectedId === emp.id;

              return (
                <button
                  key={emp.id}
                  onClick={() => setSelectedId(emp.id)}
                  className={`w-full p-3 rounded-2xl flex items-center gap-2 transition-all duration-300 group relative ${
                    isSelected 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.01] z-10' 
                      : hasAction 
                        ? 'bg-white border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 text-slate-600 shadow-sm'
                        : 'hover:bg-slate-50 text-slate-500 border border-transparent'
                  }`}
                >
                  {hasAction && !isSelected && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-blue-500 rounded-r-full"></div>
                  )}
                  
                  <div className="flex-1 text-left overflow-hidden pl-1">
                    <div className={`text-[13px] font-black truncate mb-0.5 ${isSelected ? 'text-white' : 'text-slate-900 group-hover:text-blue-700'}`}>
                      {emp.name}
                    </div>
                    <div className={`text-[9px] font-bold truncate uppercase tracking-wider flex items-center gap-1 ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                      <Briefcase className="w-2.5 h-2.5" />
                      {emp.department}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {(res?.salaryDeductedMinutes > 0 || res?.salaryDeductedAmountTry > 0) && (
                      <span className={`px-1.5 py-0.5 text-[8px] font-black rounded-lg uppercase tracking-wider shadow-sm ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
                      }`}>Maaş</span>
                    )}
                    {res?.leaveDeductedMinutes > 0 && (
                      <span className={`px-1.5 py-0.5 text-[8px] font-black rounded-lg uppercase tracking-wider shadow-sm ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-orange-500 text-white'
                      }`}>İzin</span>
                    )}
                    {!hasAction && !isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 opacity-40" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Selected Detail & Text */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedEmployee ? (
              <motion.div
                key={selectedEmployee.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col h-full gap-6"
              >
                {/* Compact Selected Personnel Info Card */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
                  
                  <div className="relative flex items-start justify-between pr-12">
                    <div className="flex-1">
                      <div className="mb-4">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{selectedEmployee.name}</h2>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-sm font-bold">{selectedEmployee.department}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                          <span className="text-slate-500 text-sm font-bold">{selectedEmployee.title}</span>
                        </div>
                      </div>
                      
                      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase shadow-sm border ${
                        scenario === NotificationScenario.NO_MISSING_TIME 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        <Sparkles className={`w-3.5 h-3.5 ${scenario === NotificationScenario.NO_MISSING_TIME ? 'text-emerald-500' : 'text-red-500'}`} />
                        {SCENARIO_LABELS[scenario]}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8 pt-2">
                      <div className="flex gap-8">
                        <div className="text-right">
                          <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Eksik Süre</div>
                          <div className="text-2xl font-black text-blue-700 tabular-nums">{formatMinutesToTime(selectedResult?.currentMissingMinutes || 0)}</div>
                        </div>
                        <div className="w-px h-12 bg-slate-100"></div>
                        <div className="text-right">
                          <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Maaş Kesintisi</div>
                          <div className="text-2xl font-black text-red-700 tabular-nums">{formatMinutesToTime(selectedResult?.salaryDeductedMinutes || 0)}</div>
                        </div>
                        <div className="w-px h-12 bg-slate-100"></div>
                        <div className="text-right">
                          <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">İzin Kesintisi</div>
                          <div className="text-2xl font-black text-orange-700 tabular-nums">{formatMinutesToTime(selectedResult?.leaveDeductedMinutes || 0)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notification Text Area */}
                <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Bildirim Metni</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Otomatik Taslak Uygulandı</p>
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
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                      <div className="p-8 md:p-12 font-serif text-slate-800 text-lg leading-relaxed whitespace-pre-wrap">
                        {generatedText}
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                      <Info className="w-4 h-4 text-blue-500" />
                      Metin otomatik olarak oluşturulmuştur. Kopyalayıp ilgili platforma yapıştırabilirsiniz.
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <User className="w-12 h-12 text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Personel Seçimi Bekleniyor</h3>
                <p className="text-slate-500 max-w-xs text-center mt-3 text-sm font-medium leading-relaxed">
                  Bildirim metni oluşturmak ve detayları incelemek için soldaki listeden bir personel seçin.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
