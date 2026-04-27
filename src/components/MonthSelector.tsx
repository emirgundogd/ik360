import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthTurkish } from '../services/calculator';

interface MonthSelectorProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({ currentMonth, onMonthChange }) => {
  const handlePrev = () => {
    if (currentMonth <= '2026-01') return;
    const [y, m] = currentMonth.split('-').map(Number);
    const date = new Date(y, m - 1 - 1);
    onMonthChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNext = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const date = new Date(y, m - 1 + 1);
    onMonthChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
      <button 
        onClick={handlePrev} 
        disabled={currentMonth <= '2026-01'}
        className={`p-2 rounded-lg transition-all shadow-sm ${currentMonth <= '2026-01' ? 'opacity-30 cursor-not-allowed text-slate-400' : 'hover:bg-white text-slate-500 hover:text-brand-600'}`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-black text-slate-800 uppercase tracking-widest px-4">{formatMonthTurkish(currentMonth)}</span>
      <button onClick={handleNext} className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-brand-600 transition-all shadow-sm">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
