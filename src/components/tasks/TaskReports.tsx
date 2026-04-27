
import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  Cell
} from 'recharts';
import { taskService } from '../../services/taskService';
import { FileText, Download, TrendingUp } from 'lucide-react';

export const TaskReports: React.FC = () => {
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [respStats, setRespStats] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    taskService.getTasks();
    setWeeklyData(taskService.getWeeklyDistribution());
    setTrendData(taskService.getMonthlyTrend());
    setRespStats(taskService.getResponsibleStats());
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Raporlar</h2>
          <p className="text-slate-500 font-medium mt-1">Performans ve iş yükü analizleri</p>
        </div>
        <button className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2 hover:scale-105 active:scale-95 w-full md:w-auto justify-center">
          <Download className="w-5 h-5" /> Excel Raporu İndir
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Performance */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" /> Haftalık Performans
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
              <BarChart 
                data={weeklyData}
                onMouseMove={(state) => {
                  if (state.activeTooltipIndex !== undefined) {
                    setActiveIndex(state.activeTooltipIndex);
                  }
                }}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar 
                  dataKey="completed" 
                  name="Tamamlanan" 
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]} 
                  barSize={32}
                >
                  {weeklyData.map((entry, index) => (
                    <Cell key={`cell-comp-${index}`} fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.6} />
                  ))}
                </Bar>
                <Bar 
                  dataKey="delayed" 
                  name="Geciken" 
                  fill="#ef4444" 
                  radius={[6, 6, 0, 0]} 
                  barSize={32}
                >
                  {weeklyData.map((entry, index) => (
                    <Cell key={`cell-del-${index}`} fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.6} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Monthly Trend */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" /> Aylık Verimlilik Trendi
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorVerimlilik" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="verimlilik" 
                  name="Verimlilik (%)"
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorVerimlilik)" 
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#2563eb' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Responsible Performance */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" /> Sorumlu Bazlı Performans
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {respStats.map((stat, idx) => (
            <div key={idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-200 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm font-black text-slate-400 text-xs">
                  {stat.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <span className="text-lg font-black text-emerald-600">%{stat.performance}</span>
              </div>
              <h4 className="font-bold text-slate-800 mb-1">{stat.name}</h4>
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>{stat.completed} / {stat.total} İş</span>
                <span>BAŞARI</span>
              </div>
              <div className="mt-3 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000"
                  style={{ width: `${stat.performance}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
