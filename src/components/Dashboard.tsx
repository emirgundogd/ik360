
import React, { useMemo, useState } from 'react';
import { Users, Clock, Wallet, ArrowRight, TrendingUp, Calendar, Trophy, Crown, Grid, X, AlertTriangle } from 'lucide-react';
import { MonthlyResult, Employee } from '../types';
import { formatMinutesToTime } from '../services/calculator';
import { KpiDetailModal, KpiModalRow } from './KpiDetailModal';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'motion/react';

interface DashboardProps {
  results: MonthlyResult[];
  allResults: Record<string, Record<string, MonthlyResult>>;
  employees: Employee[];
  currentMonth: string;
  hasData: boolean;
}

const PodiumItem = ({ group, rank }: { group: any, rank: number }) => {
  const colors = {
    1: { bg: 'bg-amber-500', text: 'text-amber-950', light: 'bg-amber-400/30', border: 'border-amber-400/50', shadow: 'shadow-amber-500/20' },
    2: { bg: 'bg-slate-400', text: 'text-slate-950', light: 'bg-slate-300/30', border: 'border-slate-300/50', shadow: 'shadow-slate-400/20' },
    3: { bg: 'bg-orange-600', text: 'text-orange-950', light: 'bg-orange-500/30', border: 'border-orange-500/50', shadow: 'shadow-orange-600/20' },
    4: { bg: 'bg-emerald-500', text: 'text-emerald-950', light: 'bg-emerald-400/30', border: 'border-emerald-400/50', shadow: 'shadow-emerald-500/20' },
    5: { bg: 'bg-emerald-400', text: 'text-emerald-950', light: 'bg-emerald-300/30', border: 'border-emerald-300/50', shadow: 'shadow-emerald-400/20' },
  }[rank as 1|2|3|4|5] || { bg: 'bg-slate-300', text: 'text-slate-900', light: 'bg-slate-200/30', border: 'border-slate-200/50', shadow: 'shadow-slate-300/20' };

  // Increased heights to prevent content overlap
  const height = rank === 1 ? 'h-72 md:h-96' : rank === 2 ? 'h-56 md:h-72' : rank === 3 ? 'h-48 md:h-60' : 'h-40 md:h-52';

  const maxHeights = {
    1: 'max-h-[140px] md:max-h-[200px]',
    2: 'max-h-[90px] md:max-h-[130px]',
    3: 'max-h-[70px] md:max-h-[100px]',
    4: 'max-h-[80px] md:max-h-[110px]',
    5: 'max-h-[80px] md:max-h-[110px]'
  }[rank as 1|2|3|4|5] || 'max-h-[80px] md:max-h-[110px]';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className="flex-1 flex flex-col items-center min-w-0"
    >
      <div className={`w-full ${height} ${colors.bg} rounded-t-[2.5rem] shadow-2xl ${colors.shadow} relative flex flex-col items-center pb-2 px-1 border-x border-t border-white/30`}>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-[2.5rem]"></div>
        
        {/* Rank Number - Dynamic positioning and styling */}
        <div className={`absolute ${rank <= 3 ? 'top-5' : '-top-8'} w-10 h-10 md:w-14 md:h-14 rounded-2xl ${rank <= 3 ? 'bg-white/20' : colors.bg} backdrop-blur-md flex items-center justify-center text-white font-black text-xl md:text-3xl shadow-inner border border-white/30 z-20 shrink-0`}>
          {rank}
          {rank === 1 && (
            <motion.div
              animate={{ 
                y: [0, -10, 0]
              }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute -top-10 md:-top-14 z-30"
            >
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-amber-400 blur-xl opacity-30 rounded-full animate-pulse"></div>
                <Crown 
                  className="w-10 h-10 md:w-16 md:h-16 text-amber-700 fill-yellow-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] relative z-10" 
                  strokeWidth={2.5}
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Names List - Centered in remaining space */}
        <div className={`flex-1 flex flex-col items-center justify-center w-full z-10 overflow-hidden px-1 ${rank <= 3 ? 'pt-20 md:pt-28 pb-4' : 'pt-6 md:pt-8 pb-2'}`}>
          <div className={`flex flex-col gap-1 w-full overflow-y-auto ${maxHeights} custom-scrollbar pr-1`}>
            {group.names.map((name: string, i: number) => (
              <p key={i} className={`text-[7px] md:text-[10px] font-black uppercase tracking-tight ${colors.text} truncate text-center leading-tight px-1 shrink-0`}>
                {name}
              </p>
            ))}
          </div>
        </div>

        {/* Time Badge - Fixed at bottom */}
        <div className="mt-auto z-10">
          <div className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg font-mono font-black text-[8px] md:text-[11px] border bg-white/20 backdrop-blur-sm text-white border-white/30 shrink-0`}>
            {group.timeStr}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ results, allResults, employees, currentMonth, hasData }) => {
  const [activeModal, setActiveModal] = useState<'salary' | 'leave' | 'allDepts' | null>(null);

  const monthName = new Date(currentMonth + "-01").toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  // Sadece aktif ve PDKS'de gösterilen personelleri filtrele
  const dashboardPersonnel = useMemo(() => {
    return employees.filter(e => e.isActive !== false && e.system?.isActive !== false);
  }, [employees]);

  const filteredResults = useMemo(() => {
    if (!hasData) return [];
    return results.filter(r => dashboardPersonnel.some(e => e.id === r.employeeId));
  }, [results, dashboardPersonnel, hasData]);

  // KPI Aggregation based on results snapshot
  const kpiStats = useMemo(() => {
    const employeeCount = dashboardPersonnel.length;
    
    if (!hasData) {
      return {
        employeeCount,
        salaryDeductionEmployeeCount: 0,
        salaryDeductionTotalAmount: 0,
        leaveDeductionEmployeeCount: 0,
        leaveDeductionTotalMinutes: 0,
        leaveDeductionTotalDays: 0,
        totalMissingMinutes: 0,
        totalLateDays: 0
      };
    }
    
    const salaryDeductionEmployeeCount = filteredResults.filter(r => 
      (r.salaryDeductedAmountTry || 0) > 0 || (r.salaryDeductedMinutes || 0) > 0
    ).length;
    
    const salaryDeductionTotalAmount = filteredResults.reduce((acc, r) => acc + (r.salaryDeductedAmountTry || 0), 0);
    
    const leaveDeductionEmployeeCount = filteredResults.filter(r => (r.leaveDeductedMinutes || 0) > 0).length;
    
    const leaveDeductionTotalMinutes = filteredResults.reduce((acc, r) => acc + (r.leaveDeductedMinutes || 0), 0);
    const leaveDeductionTotalDays = filteredResults.reduce((acc, r) => {
      const dailyMinutes = r.unitConfigUsed?.dailyWorkMinutes || 510;
      return acc + (r.leaveDeductedMinutes || 0) / dailyMinutes;
    }, 0);

    const totalMissingMinutes = filteredResults.reduce((acc, r) => acc + (r.currentMissingMinutes || 0), 0);
    const totalLateDays = filteredResults.reduce((acc, r) => acc + (r.currentLateDays || 0), 0);

    return {
      employeeCount,
      salaryDeductionEmployeeCount,
      salaryDeductionTotalAmount,
      leaveDeductionEmployeeCount,
      leaveDeductionTotalMinutes,
      leaveDeductionTotalDays,
      totalMissingMinutes,
      totalLateDays
    };
  }, [filteredResults, dashboardPersonnel]);

  // Grouped Consistent Personnel
  const groupedConsistentPersonnel = useMemo(() => {
    const defaultGroups = [1, 2, 3, 4, 5].map(() => ({
      minutes: 0,
      timeStr: '-',
      names: []
    }));

    if (!hasData) return defaultGroups;

    const groups = new Map<number, string[]>();
    
    filteredResults.forEach(r => {
      const emp = dashboardPersonnel.find(e => e.id === r.employeeId);
      if (!emp) return;
      
      const name = emp.core?.name || emp.name;
      if (!name || name === '-') return;

      const minutes = r.currentMissingMinutes || 0;
      if (!groups.has(minutes)) {
        groups.set(minutes, []);
      }
      groups.get(minutes)?.push(name);
    });

    const sortedGroups = Array.from(groups.entries())
      .sort((a, b) => a[0] - b[0])
      .slice(0, 5)
      .map(([minutes, names]) => ({
        minutes,
        timeStr: formatMinutesToTime(minutes),
        names: [...names].sort((a, b) => a.localeCompare(b, 'tr'))
      }));

    // Pad with empty groups if less than 5
    while (sortedGroups.length < 5) {
      sortedGroups.push({
        minutes: 0,
        timeStr: '-',
        names: []
      });
    }

    return sortedGroups;
  }, [filteredResults, dashboardPersonnel, hasData]);

  // Trend Data for last 6 months
  const trendData = useMemo(() => {
    const months = Object.keys(allResults).sort().slice(-6);
    return months.map(m => {
      const monthResults = allResults[m] ? Object.values(allResults[m]) : [];
      const missingHours = monthResults.reduce((acc, r) => acc + (r.currentMissingMinutes || 0), 0) / 60;
      const salaryDeduction = monthResults.reduce((acc, r) => acc + (r.salaryDeductedAmountTry || 0), 0);
      
      const date = new Date(m + "-01");
      return {
        name: date.toLocaleDateString('tr-TR', { month: 'short' }),
        fullName: date.toLocaleDateString('tr-TR', { month: 'long' }),
        missingHours: Math.round(missingHours * 10) / 10,
        totalMinutes: monthResults.reduce((acc, r) => acc + (r.currentMissingMinutes || 0), 0),
        salaryDeduction: Math.round(salaryDeduction)
      };
    });
  }, [allResults]);

  // --- MODAL DATA SELECTORS ---
  const salaryRows = useMemo<KpiModalRow[]>(() => {
    return results
      .filter(r => (r.salaryDeductedAmountTry || 0) > 0 || (r.salaryDeductedMinutes || 0) > 0)
      .map(r => {
        const emp = employees.find(e => e.id === r.employeeId);
        return {
          id: r.employeeId,
          name: emp?.core?.name || emp?.name || '-',
          tckn: emp?.core?.tcNo || emp?.tcNo || '-',
          department: emp?.work?.department || emp?.department || '-',
          title: emp?.work?.title || emp?.title || '-',
          valuePrimary: r.salaryDeductedAmountTry || 0,
          valueSecondary: formatMinutesToTime(r.salaryDeductedMinutes)
        };
      });
  }, [results, employees, hasData]);

  const leaveRows = useMemo<KpiModalRow[]>(() => {
    return results
      .filter(r => (r.leaveDeductedMinutes || 0) > 0)
      .map(r => {
        const emp = employees.find(e => e.id === r.employeeId);
        return {
          id: r.employeeId,
          name: emp?.core?.name || emp?.name || '-',
          tckn: emp?.core?.tcNo || emp?.tcNo || '-',
          department: emp?.work?.department || emp?.department || '-',
          title: emp?.work?.title || emp?.title || '-',
          valuePrimary: formatMinutesToTime(r.leaveDeductedMinutes)
        };
      });
  }, [results, employees]);

  // Department Ranking (All)
  const allSortedDepts = useMemo(() => {
    if (!hasData) return [];
    const deptMap = new Map<string, number>();
    results.forEach(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      const dept = emp?.work?.department || emp?.department;
      if (dept) {
        const current = deptMap.get(dept) || 0;
        deptMap.set(dept, current + (r.currentMissingMinutes || 0));
      }
    });

    return Array.from(deptMap.entries())
      .sort((a, b) => b[1] - a[1]);
  }, [results, employees, hasData]);

  const topSortedDepts = useMemo(() => allSortedDepts.slice(0, 5), [allSortedDepts]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pt-8 pb-12"
    >
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Özet (Dashboard)</h2>
          <p className="text-slate-500 font-bold text-lg mt-1 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-500" /> {monthName} Dönemi Performans Özeti
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        
        {/* KPI 1: Toplam Personel */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-100 rounded-2xl text-slate-600"><Users className="w-6 h-6" /></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sistem Geneli</span>
          </div>
          <p className="text-slate-600 text-xs font-bold uppercase mb-1">Toplam Personel</p>
          <h3 className="text-3xl font-black text-slate-900">{kpiStats.employeeCount}</h3>
        </div>

        {/* KPI 2: Toplam İzin Kesintisi */}
        <div 
          onClick={() => setActiveModal('leave')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-50 text-red-500 rounded-2xl group-hover:bg-red-500 group-hover:text-white transition-colors"><Clock className="w-6 h-6" /></div>
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Bu Ay</span>
          </div>
          <p className="text-slate-600 text-xs font-bold uppercase mb-1">Toplam İzin Kesintisi</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900 group-hover:text-red-600 transition-colors">
              {formatMinutesToTime(kpiStats.leaveDeductionTotalMinutes)}
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
              (YAKLAŞIK {Math.round(kpiStats.leaveDeductionTotalDays)} GÜN)
            </span>
          </div>
        </div>

        {/* KPI 3: Toplam Maaş Kesintisi */}
        <div 
          onClick={() => setActiveModal('salary')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-colors"><Wallet className="w-6 h-6" /></div>
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Bu Ay</span>
          </div>
          <p className="text-slate-600 text-xs font-bold uppercase mb-1">Toplam Maaş Kesintisi</p>
          <h3 className="text-3xl font-black text-red-600 group-hover:text-red-700 transition-colors">
            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(kpiStats.salaryDeductionTotalAmount)}
          </h3>
        </div>
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div 
          onClick={() => setActiveModal('leave')}
          className="bg-brand-600 p-8 rounded-3xl text-white shadow-xl shadow-brand-900/20 flex justify-between items-center cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div>
            <p className="text-brand-100 text-xs font-bold uppercase tracking-widest mb-2">İzin Kesintisi Yapılan</p>
            <h3 className="text-4xl font-black">{kpiStats.leaveDeductionEmployeeCount} <span className="text-lg font-bold opacity-80">Kişi</span></h3>
            <p className="text-brand-100 text-sm mt-2 font-bold flex items-center gap-2">
              Detayları İncele <ArrowRight className="w-4 h-4" />
            </p>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
            <Clock className="w-10 h-10 text-white" />
          </div>
        </div>

        <div 
          onClick={() => setActiveModal('salary')}
          className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl shadow-slate-900/20 flex justify-between items-center cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Maaş Kesintisi Yapılan</p>
            <h3 className="text-4xl font-black">{kpiStats.salaryDeductionEmployeeCount} <span className="text-lg font-bold opacity-80">Kişi</span></h3>
            <p className="text-slate-400 text-sm mt-2 font-bold flex items-center gap-2">
              Detayları İncele <ArrowRight className="w-4 h-4" />
            </p>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
            <Wallet className="w-10 h-10 text-white" />
          </div>
        </div>
      </div>

      {/* En İstikrarlı Personeller Raporu */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-12 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-xl uppercase tracking-tight">En İstikrarlı Personeller</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Bu Ayın Şampiyonları</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          {/* Podium Layout */}
          <div className="flex items-end justify-center gap-1 md:gap-4 w-full max-w-5xl mx-auto px-2">
            <PodiumItem group={groupedConsistentPersonnel[3]} rank={4} />
            <PodiumItem group={groupedConsistentPersonnel[1]} rank={2} />
            <PodiumItem group={groupedConsistentPersonnel[0]} rank={1} />
            <PodiumItem group={groupedConsistentPersonnel[2]} rank={3} />
            <PodiumItem group={groupedConsistentPersonnel[4]} rank={5} />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {/* Trend 1: Eksik Süre Trendi */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Eksik Süre Trendi (Saat)</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <div className="w-3 h-3 bg-brand-500 rounded-full"></div> Son 6 Ay
            </div>
          </div>
          <div className="h-[300px] w-auto relative">
            {!hasData && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-2xl border-2 border-dashed border-slate-100">
                <AlertTriangle className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] text-center px-6">Bu ay için henüz veri girişi yapılmamış.</p>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorMissing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                  cursor={{ stroke: '#0ea5e9', strokeWidth: 2 }}
                  labelFormatter={(_, payload) => payload[0]?.payload?.fullName || ''}
                  formatter={(value: any, name: string, props: any) => {
                    if (name === 'missingHours') {
                      const totalMinutes = props.payload.totalMinutes || 0;
                      const h = Math.floor(totalMinutes / 60);
                      const m = totalMinutes % 60;
                      const d = Math.round(totalMinutes / 510);
                      return [
                        <span key="val">
                          {h} saat {m} dakika <span style={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>(yaklaşık: {d} gün)</span>
                        </span>, 
                        'Toplam Eksik Süre'
                      ];
                    }
                    return [value, name];
                  }}
                />
                <Area type="monotone" dataKey="missingHours" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorMissing)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend 2: Maaş Kesinti Trendi */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Maaş Kesinti Trendi (₺)</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div> Son 6 Ay
            </div>
          </div>
          <div className="h-[300px] w-auto relative">
            {!hasData && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-2xl border-2 border-dashed border-slate-100">
                <AlertTriangle className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] text-center px-6">Bu ay için henüz veri girişi yapılmamış.</p>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                  cursor={{ stroke: '#ef4444', strokeWidth: 2 }}
                  labelFormatter={(_, payload) => payload[0]?.payload?.fullName || ''}
                  formatter={(value: any) => {
                    return [new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value), 'Toplam Maaş Kesintisi'];
                  }}
                />
                <Line type="monotone" dataKey="salaryDeduction" stroke="#ef4444" strokeWidth={4} dot={{ r: 6, fill: '#ef4444', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department Ranking */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
         {/* Decorative background */}
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>
         
         <div className="flex items-center justify-between mb-10 relative z-10">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-500/20">
               <TrendingUp className="w-6 h-6" />
             </div>
             <div>
               <h3 className="font-black text-slate-800 text-xl uppercase tracking-tight">En Çok Eksik Çalışması Olan Departmanlar</h3>
               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">{"\u00A0"}</p>
             </div>
           </div>
           <button 
             onClick={() => setActiveModal('allDepts')}
             className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-slate-200 shadow-sm"
           >
             <Grid className="w-3.5 h-3.5" /> Tüm Raporu Gör
           </button>
         </div>
         
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
           {topSortedDepts.map(([dept, minutes], idx) => {
             const colors = [
               { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', bar: 'from-red-500 to-rose-600', iconBg: 'bg-red-500' },
               { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', bar: 'from-orange-500 to-amber-600', iconBg: 'bg-orange-500' },
               { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', bar: 'from-amber-500 to-yellow-600', iconBg: 'bg-amber-500' },
               { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', bar: 'from-slate-500 to-slate-600', iconBg: 'bg-slate-500' },
               { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', bar: 'from-slate-400 to-slate-500', iconBg: 'bg-slate-400' },
             ][idx] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', bar: 'from-slate-300 to-slate-400', iconBg: 'bg-slate-300' };

             return (
               <motion.div 
                 key={dept} 
                 whileHover={{ y: -5 }}
                 className={`flex flex-col items-center text-center space-y-5 p-6 rounded-[2rem] border-2 ${colors.bg} ${colors.border} transition-all duration-300 shadow-sm hover:shadow-md`}
               >
                 <div className={`w-14 h-14 rounded-2xl ${colors.iconBg} flex items-center justify-center text-white font-black text-xl shadow-lg shadow-current/20`}>
                   {idx + 1}
                 </div>
                 <div className="min-h-[3rem] flex flex-col justify-center">
                   <p className="font-black text-slate-800 text-xs uppercase tracking-tight leading-tight">{dept}</p>
                   <div className="flex flex-col items-center mt-1">
                     <p className={`font-mono font-black ${colors.text} text-lg`}>{formatMinutesToTime(minutes)}</p>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                       (YAKLAŞIK {Math.round(minutes / 510)} GÜN)
                     </p>
                   </div>
                 </div>
               </motion.div>
             );
           })}
           {topSortedDepts.length === 0 && (
             <div className="col-span-full text-center py-20 text-slate-400 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
               <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
               <p className="font-black uppercase tracking-widest text-xs">Bu ay için henüz veri girişi yapılmamış.</p>
             </div>
           )}
         </div>
      </div>

      {/* Modals */}
      <KpiDetailModal 
        isOpen={activeModal === 'salary'}
        onClose={() => setActiveModal(null)}
        title="Maaş Kesintisi Detayı"
        type="salary"
        monthName={monthName}
        rows={salaryRows}
        summary={{
          count: kpiStats.salaryDeductionEmployeeCount,
          total: new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(kpiStats.salaryDeductionTotalAmount)
        }}
      />

      <KpiDetailModal 
        isOpen={activeModal === 'leave'}
        onClose={() => setActiveModal(null)}
        title="İzin Kesintisi Detayı"
        type="leave"
        monthName={monthName}
        rows={leaveRows}
        summary={{
          count: kpiStats.leaveDeductionEmployeeCount,
          total: formatMinutesToTime(kpiStats.leaveDeductionTotalMinutes)
        }}
      />

      {/* All Departments Modal */}
      {activeModal === 'allDepts' && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setActiveModal(null)}>
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
              <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-red-400" />
                Tüm Departman Kayıpları
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="pb-4 px-2">Sıra</th>
                    <th className="pb-4 px-2">Departman</th>
                    <th className="pb-4 px-2 text-right">Eksik Süre</th>
                    <th className="pb-4 px-2 text-right">Yaklaşık Gün</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {allSortedDepts.map(([dept, minutes], idx) => (
                    <tr key={dept} className="hover:bg-slate-50 transition-colors group">
                      <td className="py-4 px-2">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                          idx === 0 ? 'bg-red-500 text-white' : 
                          idx === 1 ? 'bg-orange-500 text-white' : 
                          idx === 2 ? 'bg-amber-500 text-white' : 
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <p className="font-black text-slate-800 text-xs uppercase tracking-tight">{dept}</p>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <p className="font-mono font-black text-slate-900 text-sm">{formatMinutesToTime(minutes)}</p>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">(YAKLAŞIK {Math.round(minutes / 510)} GÜN)</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-end">
              <button onClick={() => setActiveModal(null)} className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95">
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
