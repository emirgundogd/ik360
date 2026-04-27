
import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  ArrowUpRight,
  MoreVertical,
  Target,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { taskService } from '../../services/taskService';
import { goalService } from '../../services/goalService';
import { TaskStats, Goal } from '../../types/task';

interface TaskDashboardProps {
  onChangeTab: (tab: string) => void;
  onNavigateToList?: (filter: 'all' | 'delayed' | 'today' | 'week') => void;
  tasks: Task[];
}

export const TaskDashboard: React.FC<TaskDashboardProps> = ({ onChangeTab, onNavigateToList, tasks }) => {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    setStats(taskService.getStats(tasks));
    setGoals(goalService.getGoals());
    setWeeklyData(taskService.getWeeklyDistribution(tasks));
  }, [tasks]);

  if (!stats) return <div>Yükleniyor...</div>;

  const handleNavigate = (filter: 'all' | 'delayed' | 'today' | 'week') => {
    if (onNavigateToList) {
      onNavigateToList(filter);
    } else {
      onChangeTab('list');
    }
  };

  const pieData = [
    { name: 'Planlandı', value: stats.planned, color: '#3b82f6' },
    { name: 'Devam Ediyor', value: stats.inProgress, color: '#f59e0b' },
    { name: 'Tamamlandı', value: stats.completed, color: '#10b981' },
    { name: 'Gecikti', value: stats.delayed, color: '#ef4444' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Genel Bakış</h2>
          <p className="text-slate-500 font-medium mt-1">Operasyonel süreçlerin anlık durumu</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => onChangeTab('list')}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            Tüm İşleri Gör
          </button>
          <button 
            onClick={() => onChangeTab('list')}
            className="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-900/20 active:scale-95"
          >
            + Yeni İş Ekle
          </button>
        </div>
      </div>

      {/* Goals Summary Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-brand-600" /> Aktif Hedefler
          </h3>
          <button 
            onClick={() => onChangeTab('goals')}
            className="text-xs font-black text-brand-600 hover:text-brand-700 uppercase tracking-widest bg-brand-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Tümünü Gör
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.filter(g => g.status === 'active').slice(0, 3).map(goal => (
            <div 
              key={goal.id} 
              onClick={() => onChangeTab('goals')}
              className="p-5 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:border-brand-200 hover:bg-brand-50/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-black text-slate-700 line-clamp-1 group-hover:text-brand-700 transition-colors">{goal.title}</h4>
                <span className="text-[10px] font-black text-brand-600 bg-brand-100 px-2 py-1 rounded-md">%{goal.progress}</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-500 transition-all duration-1000"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
            </div>
          ))}
          {goals.filter(g => g.status === 'active').length === 0 && (
            <div className="col-span-full py-8 text-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-slate-400 text-sm font-medium">
              Aktif hedef bulunmuyor. Yeni bir hedef ekleyerek başlayın.
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <div 
          onClick={() => handleNavigate('all')}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Toplam</span>
          </div>
          <div className="text-4xl font-black text-slate-800 mb-1">{stats.total}</div>
          <div className="text-xs font-bold text-slate-400">Aktif İş Sayısı</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Tamamlanan</span>
          </div>
          <div className="text-4xl font-black text-slate-800 mb-1">{stats.completed}</div>
          <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> %{Math.round((stats.completed / stats.total) * 100) || 0} Başarı
          </div>
        </div>

        <div 
          onClick={() => handleNavigate('week')}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Bu Hafta</span>
          </div>
          <div className="text-4xl font-black text-slate-800 mb-1">{stats.thisWeek}</div>
          <div className="text-xs font-bold text-slate-400">Planlanan İş</div>
        </div>

        <div 
          onClick={() => handleNavigate('delayed')}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl group-hover:scale-110 transition-transform">
              <AlertCircle className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Geciken</span>
          </div>
          <div className="text-4xl font-black text-slate-800 mb-1">{stats.delayed}</div>
          <div className="text-xs font-bold text-red-500">Acil Müdahale Gerekli</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Completion Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-600" /> İş Durum Dağılımı
            </h3>
            <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-brand-500 cursor-pointer">
              <option>Bu Hafta</option>
              <option>Geçen Hafta</option>
              <option>Bu Ay</option>
            </select>
          </div>
          <div className="h-64">
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
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                />
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
                  dataKey="pending" 
                  name="Bekleyen" 
                  fill="#f59e0b" 
                  radius={[6, 6, 0, 0]} 
                  barSize={32}
                >
                  {weeklyData.map((entry, index) => (
                    <Cell key={`cell-pend-${index}`} fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.6} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart Section */}
        <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-brand-600" /> Genel Durum
          </h3>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
              <PieChart margin={{ top: 20, right: 0, bottom: 20, left: 0 }}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  isAnimationActive={true}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} className="hover:opacity-80 transition-opacity cursor-pointer" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
              <div className="text-center">
                <span className="block text-3xl font-black text-slate-800">{stats.total}</span>
                <span className="text-xs font-bold text-slate-400 uppercase">Toplam</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
