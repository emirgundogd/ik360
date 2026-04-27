import React, { useMemo, useState } from 'react';
import { MonthlyResult, Employee, AppConfig, UnitConfig, MonthlyInput } from '../types';
import { AlertTriangle, Clock, ShieldAlert, ChevronDown, ChevronUp, Bell, RotateCcw, Wallet, ArrowRight, FileSearch, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatMinutesToTime } from '../services/calculator';

interface AlertsPanelProps {
  results: Record<string, MonthlyResult>;
  allResults?: Record<string, Record<string, MonthlyResult>>;
  personnel: Employee[];
  inputs: Record<string, MonthlyInput>;
  config: AppConfig;
  currentMonth: string;
  hasData: boolean;
  unitConfigs?: UnitConfig[];
  onViewPersonnelDetail?: (empId: string) => void;
  onPrepareManagerNotification?: (deptName: string) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ 
  results, 
  allResults,
  personnel, 
  inputs,
  config, 
  currentMonth,
  hasData,
  unitConfigs = [], 
  onViewPersonnelDetail,
  onPrepareManagerNotification
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedEmpForReport, setSelectedEmpForReport] = useState<string | null>(null);

    const poolAlerts = useMemo(() => {
    // Ocak ayında veya veri yüklenmemişse havuz kontrolü gösterilmez
    if (currentMonth.endsWith('-01') || !hasData) return [];

    const alerts: { 
      id: string; 
      empId: string; 
      empName: string; 
      deptName: string; 
      poolType: 'leave' | 'salary';
      minutes: number;
      months: number;
      reason: string;
      message: string;
      isTransferred?: boolean;
    }[] = [];

    Object.values(results).forEach(result => {
      const emp = personnel.find(p => p.id === result.employeeId);
      if (!emp) return;

      const input = inputs[emp.id];

      // Sadece eksik süresi mevcut izni yetersiz olduğundan kesilemeyen durumlar
      if (result.nextLeavePoolMinutes > 0 && result.currentImportedLeaveBalanceMinutes <= 0) {
        // Count consecutive months with pool balance > 0
        let consecutiveMonths = 0;
        if (allResults) {
          const sortedMonths = Object.keys(allResults)
            .filter(m => m <= currentMonth && m >= '2026-01')
            .sort()
            .reverse();
          
          for (const m of sortedMonths) {
            const res = allResults[m][emp.id];
            if (!res) break;
            
            // Current month check: nextLeavePoolMinutes > 0 means problem.
            // Previous months check: nextLeavePoolMinutes > 0 means it was a problem month.
            if (m === currentMonth) {
              if (res.nextLeavePoolMinutes > 0) {
                consecutiveMonths++;
              } else {
                break;
              }
            } else {
              if (res.nextLeavePoolMinutes > 0) {
                consecutiveMonths++;
              } else {
                break;
              }
            }
          }
        }
        
        // Fallback
        if (consecutiveMonths === 0) consecutiveMonths = 1;

        const hours = Math.floor(result.nextLeavePoolMinutes / 60);
        const mins = result.nextLeavePoolMinutes % 60;
        
        alerts.push({
          id: `pool-leave-${emp.id}`,
          empId: emp.id,
          empName: emp.name,
          deptName: emp.department,
          poolType: 'leave',
          minutes: result.nextLeavePoolMinutes,
          months: consecutiveMonths,
          reason: "Mevcut izni yetersiz olduğundan",
          message: `${hours} saat ${mins} dakika olan eksik süre ${consecutiveMonths} aydır (bu ay dahil) kesilemiyor.`
        });
      }
    });

    // Sort by name A-Z
    return alerts.sort((a, b) => a.empName.localeCompare(b.empName, 'tr-TR'));
  }, [results, personnel, currentMonth, hasData, inputs, allResults]);

  const totalAlerts = poolAlerts.length;
  if (totalAlerts === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-2 border-brand-100 rounded-[2rem] mt-6 overflow-hidden shadow-[0_15px_40px_rgba(79,70,229,0.08)]"
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-6 py-4 cursor-pointer select-none bg-[#1e293b]"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-4">
          <div className="relative flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 backdrop-blur-md text-white shadow-inner border border-white/20">
            <Clock className="w-5 h-5" />
            <ArrowRight className="w-3.5 h-3.5 text-white/40" />
            <Wallet className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-[#1e293b]">
              {totalAlerts}
            </span>
          </div>
          <div>
            <h3 className="font-black text-white text-base tracking-tight uppercase">Havuz Kontrolü</h3>
            <p className="text-[11px] text-slate-300 font-bold mt-0.5 uppercase tracking-wider opacity-90">Aksiyon Bekleyen {totalAlerts} Kayıt</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20">
            {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-slate-50/50">
              <div className="grid grid-cols-1 gap-4">
                {poolAlerts.map(alert => (
                  <motion.div 
                    key={alert.id} 
                    whileHover={{ scale: 1.005 }}
                    className="bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-500" />
                    
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 p-3 rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-all duration-300 shadow-inner">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 
                              className="font-black text-slate-900 text-base cursor-pointer hover:text-brand-600 transition-colors"
                              onClick={() => onViewPersonnelDetail?.(alert.empId)}
                            >
                              {alert.empName}
                            </h4>
                            <span className="text-[9px] font-black text-brand-700 uppercase tracking-widest px-2.5 py-0.5 bg-brand-50 rounded-full border border-brand-100">
                              {alert.deptName}
                            </span>
                            <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest px-2.5 py-0.5 bg-rose-50 rounded-full border border-rose-100">
                              {alert.months} AYDIR BEKLIYOR
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mt-1.5 font-medium leading-relaxed max-w-2xl">
                            {alert.message}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 self-end lg:self-center">
                        <button 
                          onClick={() => setSelectedEmpForReport(alert.empId)}
                          className="px-4 py-3 bg-slate-100 text-slate-600 text-xs font-black rounded-xl hover:bg-slate-200 transition-all active:scale-95 uppercase tracking-tight flex items-center gap-2"
                          title="Detay Rapor İncele"
                        >
                          <FileSearch className="w-4 h-4" /> Detay Rapor
                        </button>
                        <button 
                          onClick={() => onPrepareManagerNotification?.(alert.deptName)}
                          className="p-3 bg-slate-100 text-slate-500 hover:bg-brand-50 hover:text-brand-600 rounded-xl transition-all border border-slate-200 hover:border-brand-200"
                          title="Birim Sorumlusuna Bildir"
                        >
                          <Bell className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Report Modal */}
      <AnimatePresence>
        {selectedEmpForReport && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 bg-[#1e293b] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-white/10 text-white">
                    <FileSearch className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">Detaylı Havuz Raporu</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">
                      {personnel.find(p => p.id === selectedEmpForReport)?.name} • Özet Tablo
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedEmpForReport(null)}
                  className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8 overflow-y-auto max-h-[70vh]">
                <div className="overflow-hidden border border-slate-200 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider">Ay</th>
                        <th className="px-4 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider text-right">Eksik Süre</th>
                        <th className="px-4 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider text-right">Geç Gün</th>
                        <th className="px-4 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider text-right">Mevcut İzni</th>
                        <th className="px-4 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider text-right">Kesilemeyen</th>
                        <th className="px-4 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider text-right">Devreden</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        if (!allResults) return null;
                        const months = Object.keys(allResults)
                          .filter(m => m >= '2026-01')
                          .sort();
                        let totalMissing = 0;
                        let totalLate = 0;
                        let totalNotDeducted = 0;

                        return (
                          <>
                            {months.map(m => {
                              const res = allResults[m][selectedEmpForReport];
                              if (!res) return null;

                              const notDeducted = Math.max(0, res.currentMissingMinutes - res.leaveDeductedMinutes);
                              totalMissing += res.currentMissingMinutes;
                              totalLate += res.currentLateDays;
                              totalNotDeducted += notDeducted;

                              const [year, monthNum] = m.split('-');
                              const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('tr-TR', { month: 'long' });

                              return (
                                <tr key={m} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-4 py-4 text-sm font-bold text-slate-700 capitalize">{monthName} {year}</td>
                                  <td className="px-4 py-4 text-sm font-medium text-slate-600 text-right font-mono">{formatMinutesToTime(res.currentMissingMinutes)}</td>
                                  <td className="px-4 py-4 text-sm font-medium text-slate-600 text-right">{res.currentLateDays} Gün</td>
                                  <td className="px-4 py-4 text-sm font-medium text-slate-600 text-right font-mono">{formatMinutesToTime(res.currentImportedLeaveBalanceMinutes)}</td>
                                  <td className="px-4 py-4 text-sm font-bold text-rose-600 text-right font-mono">{formatMinutesToTime(notDeducted)}</td>
                                  <td className="px-4 py-4 text-sm font-bold text-brand-600 text-right font-mono">{formatMinutesToTime(res.nextLeavePoolMinutes)}</td>
                                </tr>
                              );
                            })}
                            <tr className="bg-slate-50 border-t-2 border-slate-200">
                              <td className="px-4 py-5 text-sm font-black text-slate-900 uppercase">TOPLAM</td>
                              <td className="px-4 py-5 text-sm font-black text-slate-900 text-right font-mono">{formatMinutesToTime(totalMissing)}</td>
                              <td className="px-4 py-5 text-sm font-black text-slate-900 text-right">{totalLate} Gün</td>
                              <td className="px-4 py-5 text-sm font-black text-slate-900 text-right">-</td>
                              <td className="px-4 py-5 text-sm font-black text-rose-700 text-right font-mono">{formatMinutesToTime(totalNotDeducted)}</td>
                              <td className="px-4 py-5 text-sm font-black text-brand-700 text-right font-mono">-</td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button 
                  onClick={() => setSelectedEmpForReport(null)}
                  className="px-8 py-3 bg-white border border-slate-300 text-slate-700 text-sm font-black rounded-xl hover:bg-slate-50 transition-all active:scale-95 uppercase tracking-tight"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
