import React from 'react';
import { LayoutDashboard, Users, Building2, ClipboardList, LogOut } from 'lucide-react';

interface NotificationLayoutProps {
  title: string;
  children: React.ReactNode;
  activeModule: string;
  setActiveModule: (module: string) => void;
  currentPeriod: string;
  onPeriodChange: (period: string) => void;
}

export const NotificationLayout: React.FC<NotificationLayoutProps> = ({ 
  title, children, activeModule, setActiveModule, currentPeriod 
}) => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black tracking-tighter text-slate-900">{title}</h1>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full">ÇEVRİMİÇİ</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-bold text-slate-600">{currentPeriod}</div>
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-600">A</div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
