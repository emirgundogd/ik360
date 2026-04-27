import React, { useState, useMemo } from 'react';
import { Employee, MonthlyResult } from '../types';
import { 
  TrendingDown, 
  Calendar, 
  User, 
  Search, 
  Clock,
  Wallet,
  CreditCard,
  Share2,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatMinutesToTime, formatMonthTurkish } from '../services/calculator';
import { DeductionSummaryModal } from './DeductionSummaryModal';

interface Props {
  personnel: Employee[];
  results: Record<string, MonthlyResult>;
  allResults: Record<string, Record<string, MonthlyResult>>;
  currentMonth: string;
  activeSubTab: 'salary' | 'leave';
  setActiveSubTab: (tab: 'salary' | 'leave') => void;
  config: any;
}

export const DeductionDetails: React.FC<Props> = ({
  personnel,
  results,
  allResults,
  currentMonth,
  activeSubTab,
  setActiveSubTab,
  config
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historySelectedUnit, setHistorySelectedUnit] = useState('all');
  const [historySelectedType, setHistorySelectedType] = useState('all');
  const [historySelectedYear, setHistorySelectedYear] = useState('all');
  const [historySelectedMonthOnly, setHistorySelectedMonthOnly] = useState('all');
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const filteredResults = useMemo(() => {
    return personnel.map(p => ({
      person: p,
      result: results[p.id]
    })).filter(item => {
      const p = item.person;
      const r = item.result;
      if (!r) return false;

      const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.tcNo?.includes(searchTerm);
      
      const hasDeduction = activeSubTab === 'salary' 
        ? (r.salaryDeductedMinutes > 0 || r.salaryDeductedAmountTry > 0)
        : (r.leaveDeductedMinutes > 0);

      return matchesSearch && hasDeduction;
    });
  }, [personnel, results, searchTerm, activeSubTab]);

  const historicalData = useMemo(() => {
    const flattened: any[] = [];
    Object.entries(allResults).forEach(([month, monthData]) => {
      // Only include records from January 2026 onwards
      if (month < '2026-01') return;

      Object.values(monthData).forEach(r => {
        const p = personnel.find(emp => emp.id === r.employeeId);
        if (!p) return;

        const hasSalary = r.salaryDeductedMinutes > 0 || r.salaryDeductedAmountTry > 0;
        const hasLeave = r.leaveDeductedMinutes > 0;
        const hasDeduction = hasSalary || hasLeave;

        if (!hasDeduction) return;

        const matchesSearch = p.name?.toLowerCase().includes(historySearchTerm.toLowerCase()) || 
                             p.tcNo?.includes(historySearchTerm) ||
                             month.includes(historySearchTerm);
        
        const unit = p.department || '-';
        const matchesUnit = historySelectedUnit === 'all' || unit === historySelectedUnit;

        const type = hasSalary && hasLeave ? 'both' : hasSalary ? 'salary' : 'leave';

        const matchesType = historySelectedType === 'all' || type === historySelectedType;
        
        const [y, m] = month.split('-');
        const matchesYear = historySelectedYear === 'all' || y === historySelectedYear;
        const matchesMonth = historySelectedMonthOnly === 'all' || m === historySelectedMonthOnly;

        if (matchesSearch && matchesUnit && matchesType && matchesYear && matchesMonth) {
          flattened.push({
            person: p,
            result: r,
            month: month,
            type: type
          });
        }
      });
    });
    return flattened.sort((a, b) => b.month.localeCompare(a.month));
  }, [personnel, allResults, historySearchTerm, historySelectedUnit, historySelectedType, historySelectedYear, historySelectedMonthOnly]);

  const historyFilterOptions = useMemo(() => {
    const units = new Set<string>();
    const years = new Set<string>();
    Object.entries(allResults).forEach(([month, monthData]) => {
      // Only include months from January 2026 onwards
      if (month >= '2026-01') {
        years.add(month.split('-')[0]);
      }
      Object.values(monthData).forEach(r => {
        const p = personnel.find(emp => emp.id === r.employeeId);
        if (p?.department) units.add(p.department);
      });
    });
    return {
      units: Array.from(units).sort(),
      years: Array.from(years).sort((a, b) => b.localeCompare(a)),
      months: [
        { val: '01', label: 'Ocak' },
        { val: '02', label: 'Şubat' },
        { val: '03', label: 'Mart' },
        { val: '04', label: 'Nisan' },
        { val: '05', label: 'Mayıs' },
        { val: '06', label: 'Haziran' },
        { val: '07', label: 'Temmuz' },
        { val: '08', label: 'Ağustos' },
        { val: '09', label: 'Eylül' },
        { val: '10', label: 'Ekim' },
        { val: '11', label: 'Kasım' },
        { val: '12', label: 'Aralık' }
      ]
    };
  }, [allResults, personnel]);

  const stats = useMemo(() => {
    const totalSalaryMinutes = filteredResults.reduce((acc, curr) => acc + (curr.result?.salaryDeductedMinutes || 0), 0);
    const totalSalaryAmount = filteredResults.reduce((acc, curr) => acc + (curr.result?.salaryDeductedAmountTry || 0), 0);
    const totalLeaveMinutes = filteredResults.reduce((acc, curr) => acc + (curr.result?.leaveDeductedMinutes || 0), 0);
    const totalPersonnel = filteredResults.length;

    return {
      totalSalaryMinutes,
      totalSalaryAmount,
      totalLeaveMinutes,
      totalPersonnel
    };
  }, [filteredResults]);

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-red-500" />
            KESİNTİ DETAYLARI
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            {formatMonthTurkish(currentMonth)} dönemi için uygulanan tüm kesintilerin dökümü.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsSummaryModalOpen(true)}
            className="px-3 py-1.5 bg-slate-900 text-white rounded-xl font-bold text-[12px] hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            {activeSubTab === 'salary' ? 'Maaş Kesinti Özeti (Paylaşım)' : 'İzin Kesinti Özeti (Paylaşım)'}
          </button>

          <div className="flex p-1 bg-slate-100 rounded-2xl w-fit relative">
            <button
              onClick={() => setActiveSubTab('salary')}
              className={`relative px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 z-10 ${
                activeSubTab === 'salary' 
                  ? 'text-slate-900' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {activeSubTab === 'salary' && (
                <motion.div
                  layoutId="activeTabBackground"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm"
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Maaş Kesintileri
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('leave')}
              className={`relative px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 z-10 ${
                activeSubTab === 'leave' 
                  ? 'text-slate-900' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {activeSubTab === 'leave' && (
                <motion.div
                  layoutId="activeTabBackground"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm"
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                İzin Kesintileri
              </span>
            </button>
          </div>
        </div>
      </div>

      <DeductionSummaryModal 
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        results={filteredResults}
        currentMonth={currentMonth}
        companyName={config?.companyName || 'ik360'}
        reportType={activeSubTab}
      />

      {/* KPI Cards & Table Content with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Etkilenen Personel</span>
              </div>
              <div className="text-3xl font-black text-slate-900">{stats.totalPersonnel}</div>
              <div className="text-sm text-slate-500 font-medium mt-1">Toplam kesinti yapılacak kişi</div>
            </div>

            {activeSubTab === 'salary' ? (
              <>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                      <Clock className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toplam Kesinti Süresi</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">{formatMinutesToTime(stats.totalSalaryMinutes)}</div>
                  <div className="text-sm text-slate-500 font-medium mt-1">Maaştan düşülecek toplam süre</div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toplam Kesinti Tutarı</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">₺{stats.totalSalaryAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                  <div className="text-sm text-slate-500 font-medium mt-1">Net maaş üzerinden hesaplanan</div>
                </div>
              </>
            ) : (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                    <Clock className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toplam Kesinti Süresi</span>
                </div>
                <div className="text-3xl font-black text-slate-900">{formatMinutesToTime(stats.totalLeaveMinutes)}</div>
                <div className="text-sm text-slate-500 font-medium mt-1">Denkleştirme izinden düşülecek toplam süre</div>
              </div>
            )}
          </div>

          {/* Filters & Table */}
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Personel adı veya TCKN ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Personel</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Birim / Unvan</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Eksik Süre</th>
                    {activeSubTab === 'salary' ? (
                      <>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Kesinti Süresi</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Kesinti Tutarı</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Devreden Süre</th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Kesilen İzin Süresi</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Devreden Süre</th>
                      </>
                    )}
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredResults.map((item, index) => (
                    <tr
                      key={`${item.person.id}-${index}`}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{item.person.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-700">{item.person.department}</div>
                        <div className="text-xs text-slate-400 font-medium">{item.person.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm">
                          <Clock className="w-3.5 h-3.5" />
                          {formatMinutesToTime(item.result?.currentMissingMinutes || 0)}
                        </div>
                      </td>
                      {activeSubTab === 'salary' ? (
                        <>
                          <td className="px-6 py-4">
                            <div className="text-sm font-black text-red-600">
                              {formatMinutesToTime(item.result?.salaryDeductedMinutes || 0)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-black text-slate-900">
                              ₺{(item.result?.salaryDeductedAmountTry || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-500">
                              {formatMinutesToTime(item.result?.nextSalaryPoolMinutes || 0)}
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            <div className="text-sm font-black text-orange-600">
                              {formatMinutesToTime(item.result?.leaveDeductedMinutes || 0)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-500">
                              {formatMinutesToTime(item.result?.nextLeavePoolMinutes || 0)}
                            </div>
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          {item.result?.explanation && item.result.explanation.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {item.result.explanation.map((exp, i) => (
                                <div key={i} className="pl-3 border-l-2 border-slate-100 py-0.5 hover:border-blue-200 transition-colors">
                                  <p className="text-[11px] leading-normal text-slate-600 font-bold">
                                    {exp}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300 italic">Açıklama yok</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredResults.length === 0 && (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Sonuç Bulunamadı</h3>
                  <p className="text-slate-500 max-w-xs mx-auto mt-2">
                    Arama kriterlerinize uygun kesinti kaydı bulunmamaktadır.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Historical Deductions Section */}
      <div className="space-y-4 pt-8">
        <button 
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="flex items-center justify-between w-full p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${isHistoryOpen ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
              <List className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                TÜM KESİNTİLER (GEÇMİŞ)
                <span className={`px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-500 font-bold transition-all ${isHistoryOpen ? 'opacity-0' : 'opacity-100'}`}>
                  {historicalData.length} Kayıt
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">Sistemdeki tüm dönemlere ait toplu kesinti listesi.</p>
            </div>
          </div>
          <div className={`p-2 rounded-full bg-slate-50 group-hover:bg-slate-100 transition-all ${isHistoryOpen ? 'rotate-180' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </button>

        <AnimatePresence>
          {isHistoryOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden space-y-4"
            >
              <div className="flex flex-wrap items-center justify-end gap-3 px-2">
                <select
                  value={historySelectedYear}
                  onChange={(e) => setHistorySelectedYear(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans"
                >
                  <option value="all">Dönem (Yıl)</option>
                  {historyFilterOptions.years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <select
                  value={historySelectedMonthOnly}
                  onChange={(e) => setHistorySelectedMonthOnly(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans"
                >
                  <option value="all">Dönem (Ay)</option>
                  {historyFilterOptions.months.map(m => (
                    <option key={m.val} value={m.val}>{m.label}</option>
                  ))}
                </select>
                <select
                  value={historySelectedUnit}
                  onChange={(e) => setHistorySelectedUnit(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans"
                >
                  <option value="all">Tüm Birimler</option>
                  {historyFilterOptions.units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
                <select
                  value={historySelectedType}
                  onChange={(e) => setHistorySelectedType(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans"
                >
                  <option value="all">Tüm Türler</option>
                  <option value="salary">Maaş</option>
                  <option value="leave">İzin</option>
                  <option value="both">Maaş & İzin</option>
                </select>
                <div className="relative w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Geçmişte ara..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium font-sans"
                  />
                </div>
              </div>

              <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Dönem</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Personel</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Birim</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Kesinti Türü</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Eksik Süre</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Kesinti Süresi</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Devreden Süre</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Maaş Kesintisi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {historicalData.map((item, index) => (
                        <tr key={`${item.person.id}-${item.month}-${index}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[10px] uppercase tracking-wider">
                              {formatMonthTurkish(item.month)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 text-sm">{item.person.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-bold text-slate-700">{item.person.department}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                              item.type === 'salary' ? 'bg-red-50 text-red-600 border border-red-100' :
                              item.type === 'leave' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                              'bg-purple-50 text-purple-600 border border-purple-100'
                            }`}>
                              {item.type === 'salary' ? 'Maaş' : item.type === 'leave' ? 'İzin' : 'Maaş & İzin'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-bold text-slate-600">{formatMinutesToTime(item.result?.currentMissingMinutes || 0)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-black text-red-600">
                              {formatMinutesToTime((item.result?.salaryDeductedMinutes || 0) + (item.result?.leaveDeductedMinutes || 0))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-bold text-slate-500">
                              {formatMinutesToTime((item.result?.nextSalaryPoolMinutes || 0) + (item.result?.nextLeavePoolMinutes || 0))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-black text-slate-900">
                              ₺{(item.result?.salaryDeductedAmountTry || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50/50 font-black text-slate-900 border-t border-slate-100">
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-xs uppercase tracking-widest text-slate-400">Toplam</td>
                        <td className="px-6 py-4 text-xs font-bold">
                          {formatMinutesToTime(historicalData.reduce((acc, curr) => acc + (curr.result?.currentMissingMinutes || 0), 0))}
                        </td>
                        <td className="px-6 py-4 text-xs text-red-600 font-black">
                          {formatMinutesToTime(historicalData.reduce((acc, curr) => acc + (curr.result?.salaryDeductedMinutes || 0) + (curr.result?.leaveDeductedMinutes || 0), 0))}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 font-bold">
                          {formatMinutesToTime(historicalData.reduce((acc, curr) => acc + (curr.result?.nextSalaryPoolMinutes || 0) + (curr.result?.nextLeavePoolMinutes || 0), 0))}
                        </td>
                        <td className="px-6 py-4 text-xs font-black">
                          ₺{historicalData.reduce((acc, curr) => acc + (curr.result?.salaryDeductedAmountTry || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                  {historicalData.length === 0 && (
                    <div className="p-12 text-center text-slate-400 text-sm italic">Geçmiş kayıt bulunamadı.</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
