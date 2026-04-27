import React from 'react';
import { Employee, MonthlyResult } from '../types';
import { X, Lock as LockIcon, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface MonthClosingModalProps {
  month: string;
  employees: Employee[];
  results: Record<string, MonthlyResult>;
  onClose: () => void;
  onConfirm: () => void;
}

export const MonthClosingModal: React.FC<MonthClosingModalProps> = ({ month, employees, results, onClose, onConfirm }) => {
  const monthName = new Date(month + '-01').toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-12">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
      />

      {/* Modal Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl shadow-slate-900/20 overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="relative h-28 bg-slate-900 overflow-hidden flex items-center px-8">
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
              <LockIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">Dönemi Kapat</h2>
              <p className="text-white text-[10px] font-bold uppercase tracking-widest">{monthName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Warning Section */}
          <div className="bg-amber-50/50 border border-amber-100 p-5 rounded-2xl flex gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-amber-900 leading-snug">
                {monthName} ayını kapatmak üzeresiniz.
              </p>
              <p className="text-xs font-bold text-amber-700/80 leading-relaxed">
                Ay kapatıldığında bu döneme ait veriler kilitlenir ve değiştirilemez. Lütfen tüm verilerin doğruluğundan emin olun.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 pt-0 flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-200"
          >
            İptal
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-[2] py-4 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
          >
            <LockIcon className="w-4 h-4 text-brand-400 group-hover:scale-110 transition-transform" />
            Onayla ve Kilitle
          </button>
        </div>
      </motion.div>
    </div>
  );
};
