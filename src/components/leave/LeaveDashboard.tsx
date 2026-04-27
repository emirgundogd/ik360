import React, { useMemo } from 'react';
import { LeaveRecord, LeaveSettings } from './types';
import { 
  Users, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  TrendingDown, 
  Building2,
  Database,
  LayoutDashboard,
  ArrowUpRight,
  PieChart as PieChartIcon,
  BarChart3,
  Wallet
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid
} from 'recharts';

interface Props {
  data: LeaveRecord[];
  settings: LeaveSettings;
}

export const LeaveDashboard: React.FC<Props> = ({ data, settings }) => {
  const stats = useMemo(() => {
    const totalPersonnel = data.length;
    const totalAnnualLeave = data.reduce((acc, curr) => acc + curr.remainingAnnualLeave.totalDays, 0);
    const totalCompensatoryLeave = data.reduce((acc, curr) => acc + curr.remainingCompensatoryLeave.totalDays, 0);
    
    let criticalCount = 0;
    let riskyCount = 0;
    let safeCount = 0;
    let totalCost = 0;
    let totalAnnualCost = 0;
    let totalCompensatoryCost = 0;

    const deptMap: Record<string, number> = {};
    const locationMap: Record<string, number> = { 'Genel Merkez': 0, 'Saha': 0 };

    data.forEach(emp => {
      const remaining = emp.remainingAnnualLeave.totalDays;
      
      if (remaining >= settings.criticalLeaveThreshold) {
        criticalCount++;
      } else if (remaining < settings.riskyNegativeThreshold) {
        riskyCount++;
      } else {
        safeCount++;
      }
      
      if (emp.totalEstimatedCost) {
        totalCost += emp.totalEstimatedCost;
      }
      if (emp.estimatedAnnualLeaveCost) {
        totalAnnualCost += emp.estimatedAnnualLeaveCost;
      }
      if (emp.estimatedCompensatoryLeaveCost) {
        totalCompensatoryCost += emp.estimatedCompensatoryLeaveCost;
      }

      const dept = emp.department || 'Belirtilmemiş';
      deptMap[dept] = (deptMap[dept] || 0) + remaining;

      const loc = emp.locationType || 'Belirtilmemiş';
      locationMap[loc] = (locationMap[loc] || 0) + remaining;
    });

    const chartData = [
      { name: 'Kritik (Yüksek)', value: criticalCount, color: '#f59e0b' },
      { name: 'Normal', value: safeCount, color: '#10b981' },
      { name: 'Riskli (Eksi)', value: riskyCount, color: '#ef4444' },
    ];

    const deptChartData = Object.entries(deptMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return {
      totalPersonnel,
      totalAnnualLeave,
      totalCompensatoryLeave,
      criticalCount,
      riskyCount,
      safeCount,
      totalCost,
      totalAnnualCost,
      totalCompensatoryCost,
      deptMap,
      chartData,
      deptChartData,
      locationMap,
      avgLeave: totalPersonnel > 0 ? totalAnnualLeave / totalPersonnel : 0
    };
  }, [data, settings]);

  if (data.length === 0) {
    return (
      <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm text-center">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Database className="w-12 h-12 text-slate-300" />
        </div>
        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Veri Bulunamadı</h3>
        <p className="text-slate-500 font-medium max-w-md mx-auto">
          Dashboard'u görüntülemek için lütfen önce Excel yükleme ekranından izin verilerini sisteme aktarın.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <LayoutDashboard className="w-10 h-10 text-brand-500" /> İzin Takibi & Raporlama
          </h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Kurumsal İzin Yükü ve Maliyet Yönetimi</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toplam İzin Yükü</p>
            <p className="text-xl font-black text-slate-800">{stats.totalAnnualLeave.toFixed(0)} <span className="text-xs font-bold text-slate-400">GÜN</span></p>
          </div>
          <div className="w-px h-8 bg-slate-200 mx-2" />
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personel Başı Ort.</p>
            <p className="text-xl font-black text-slate-800">{stats.avgLeave.toFixed(1)} <span className="text-xs font-bold text-slate-400">GÜN</span></p>
          </div>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> %100 AKTİF
            </span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toplam Personel</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{stats.totalPersonnel}</p>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">YILLIK İZİN</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kalan Toplam Bakiye</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{stats.totalAnnualLeave.toFixed(1)} <span className="text-sm">GÜN</span></p>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">DENKLEŞTİRME</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kalan Toplam Bakiye</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{stats.totalCompensatoryLeave.toFixed(1)} <span className="text-sm">GÜN</span></p>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">MALİ YÜK</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tahmini İzin Maliyeti</p>
          <p className="text-3xl font-black text-slate-800 mt-1">
            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(stats.totalCost)}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
            <div className="text-left">
              <p className="text-[9px] font-bold text-slate-400 uppercase">Yıllık</p>
              <p className="text-xs font-black text-slate-700">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(stats.totalAnnualCost)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-400 uppercase">Denk.</p>
              <p className="text-xs font-black text-slate-700">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(stats.totalCompensatoryCost)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Distribution Chart */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-brand-500" /> Durum Dağılımı
            </h3>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {stats.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {stats.chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-bold text-slate-600">{item.name}</span>
                </div>
                <span className="text-xs font-black text-slate-800">{item.value} Kişi</span>
              </div>
            ))}
          </div>
        </div>

        {/* Department Chart */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-500" /> Departman Bazlı İzin Yükü (Gün)
            </h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.deptChartData} layout="vertical" margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Risk Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm border-l-8 border-l-amber-500">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Kritik Seviye (Yüksek)</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{settings.criticalLeaveThreshold} Gün ve Üzeri</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-5xl font-black text-amber-500">{stats.criticalCount}</span>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Personel</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
            <div 
              className="bg-amber-500 h-full transition-all duration-1000" 
              style={{ width: `${(stats.criticalCount / stats.totalPersonnel) * 100}%` }}
            />
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest">Toplam personelin %{((stats.criticalCount / stats.totalPersonnel) * 100).toFixed(1)}'i</p>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm border-l-8 border-l-red-500">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Riskli (Eksi Bakiye)</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{settings.riskyNegativeThreshold} Gün Altı</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-5xl font-black text-red-500">{stats.riskyCount}</span>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Personel</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
            <div 
              className="bg-red-500 h-full transition-all duration-1000" 
              style={{ width: `${(stats.riskyCount / stats.totalPersonnel) * 100}%` }}
            />
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest">Toplam personelin %{((stats.riskyCount / stats.totalPersonnel) * 100).toFixed(1)}'i</p>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Lokasyon Dağılımı</h3>
          </div>
          <div className="space-y-6">
            {Object.entries(stats.locationMap).map(([loc, days]) => (
              <div key={loc} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{loc}</span>
                  <span className="text-xs font-black text-slate-800">{days.toFixed(0)} Gün</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-1000" 
                    style={{ width: `${stats.totalAnnualLeave > 0 ? (days / stats.totalAnnualLeave) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
