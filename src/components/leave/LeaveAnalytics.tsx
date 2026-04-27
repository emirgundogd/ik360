import React, { useMemo } from 'react';
import { LeaveRecord, LeaveSettings } from './types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Users } from 'lucide-react';

interface Props {
  data: LeaveRecord[];
  settings: LeaveSettings;
}

export const LeaveAnalytics: React.FC<Props> = ({ data, settings }) => {
  const analytics = useMemo(() => {
    if (data.length === 0) return null;

    // Department Averages
    const deptStats: Record<string, { count: number, totalAnnual: number, totalComp: number }> = {};
    const locationStats = {
      'Genel Merkez': { count: 0, totalAnnual: 0 },
      'Saha': { count: 0, totalAnnual: 0 },
      'Belirtilmemiş': { count: 0, totalAnnual: 0 }
    };

    let totalUsed = 0;
    let totalRemaining = 0;

    data.forEach(emp => {
      const dept = emp.department || 'Belirtilmemiş';
      if (!deptStats[dept]) deptStats[dept] = { count: 0, totalAnnual: 0, totalComp: 0 };
      
      deptStats[dept].count++;
      deptStats[dept].totalAnnual += emp.remainingAnnualLeave.totalDays;
      deptStats[dept].totalComp += emp.remainingCompensatoryLeave.totalDays;

      const loc = emp.locationType || 'Belirtilmemiş';
      if (locationStats[loc as keyof typeof locationStats]) {
        locationStats[loc as keyof typeof locationStats].count++;
        locationStats[loc as keyof typeof locationStats].totalAnnual += emp.remainingAnnualLeave.totalDays;
      }

      totalUsed += emp.usedAnnualLeave.totalDays;
      totalRemaining += emp.remainingAnnualLeave.totalDays;
    });

    const deptAverages = Object.entries(deptStats).map(([name, stats]) => ({
      name,
      'Ortalama Yıllık İzin': Number((stats.totalAnnual / stats.count).toFixed(1)),
      'Ortalama Denkleştirme': Number((stats.totalComp / stats.count).toFixed(1))
    })).sort((a, b) => b['Ortalama Yıllık İzin'] - a['Ortalama Yıllık İzin']);

    const locationData = [
      { name: 'Genel Merkez', value: locationStats['Genel Merkez'].count > 0 ? Number((locationStats['Genel Merkez'].totalAnnual / locationStats['Genel Merkez'].count).toFixed(1)) : 0 },
      { name: 'Saha', value: locationStats['Saha'].count > 0 ? Number((locationStats['Saha'].totalAnnual / locationStats['Saha'].count).toFixed(1)) : 0 },
      { name: 'Belirtilmemiş', value: locationStats['Belirtilmemiş'].count > 0 ? Number((locationStats['Belirtilmemiş'].totalAnnual / locationStats['Belirtilmemiş'].count).toFixed(1)) : 0 }
    ].filter(d => d.value > 0);

    const usageData = [
      { name: 'Kullanılan', value: Number(totalUsed.toFixed(1)) },
      { name: 'Kalan', value: Number(totalRemaining.toFixed(1)) }
    ];

    return { deptAverages, locationData, usageData };
  }, [data]);

  if (!analytics) {
    return (
      <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm text-center">
        <p className="text-slate-500 font-medium">Analiz için veri bulunamadı.</p>
      </div>
    );
  }

  const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#f43f5e'];

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-brand-500" /> İzin Analizleri
        </h2>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Departman ve lokasyon bazlı detaylı raporlar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5 text-brand-500" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Departman Ortalamaları (Gün)</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.deptAverages} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }} />
                <Bar dataKey="Ortalama Yıllık İzin" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Ortalama Denkleştirme" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-rows-2 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-2">
              <PieChartIcon className="w-5 h-5 text-brand-500" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Kullanım Oranı</h3>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.usageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analytics.usageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#10b981'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-brand-500" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Lokasyon Ortalaması (Yıllık)</h3>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.locationData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30}>
                    {analytics.locationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
