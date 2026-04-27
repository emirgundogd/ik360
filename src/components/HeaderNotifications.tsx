import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Employee } from '../types';
import { Bell, UserPlus, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  employees: Employee[];
}

interface NotificationItem {
  id: string;
  type: 'trial_ending' | 'trial_ended' | 'new_hire';
  title: string;
  message: string;
  date: string;
  employeeName: string;
}

export const HeaderNotifications: React.FC<Props> = ({ employees }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const notifications = useMemo(() => {
    const items: NotificationItem[] = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    employees.forEach(emp => {
      if (emp.isDeleted || !emp.work?.hireDate) return;

      const hireDate = new Date(emp.work.hireDate);
      const trialMonths = emp.work.trialPeriodMonths || 2;
      const trialEndDate = new Date(hireDate);
      trialEndDate.setMonth(trialEndDate.getMonth() + trialMonths);

      // 1. New Hire this month
      if (hireDate.getMonth() === currentMonth && hireDate.getFullYear() === currentYear) {
        items.push({
          id: `new-${emp.id}`,
          type: 'new_hire',
          title: 'Yeni Personel Girişi',
          message: `${emp.name} bu ay ekibe katıldı.`,
          date: hireDate.toLocaleDateString('tr-TR'),
          employeeName: emp.name
        });
      }

      // 2. Trial Period
      const diffTime = trialEndDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        // Trial ended (show if it ended in the last 30 days)
        if (Math.abs(diffDays) <= 30) {
          items.push({
            id: `ended-${emp.id}`,
            type: 'trial_ended',
            title: 'Deneme Süreci Bitti',
            message: `${emp.name} isimli personelin deneme süreci ${trialEndDate.toLocaleDateString('tr-TR')} tarihinde sona erdi.`,
            date: trialEndDate.toLocaleDateString('tr-TR'),
            employeeName: emp.name
          });
        }
      } else if (diffDays <= 7) {
        // Trial ending soon (next 7 days)
        items.push({
          id: `ending-${emp.id}`,
          type: 'trial_ending',
          title: 'Deneme Süreci Bitiyor',
          message: `${emp.name} isimli personelin deneme süreci ${diffDays} gün sonra bitiyor.`,
          date: trialEndDate.toLocaleDateString('tr-TR'),
          employeeName: emp.name
        });
      }
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [employees]);

  const hasUnread = notifications.length > 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex items-center gap-3" ref={dropdownRef}>
      {hasUnread && !isOpen && (
        <motion.span 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[10px] font-black text-red-500 uppercase tracking-widest hidden sm:block"
        >
          Yeni Bildirim Var
        </motion.span>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-2xl transition-all relative group ${
          isOpen ? 'bg-brand-500 text-white shadow-lg shadow-brand-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
        }`}
      >
        <Bell className="w-6 h-6" />
        {hasUnread && (
          <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-3 w-[450px] bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-50"
          >
            <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Bildirimler</h3>
              <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-[9px] font-black rounded-full uppercase tracking-widest">
                {notifications.length} Yeni
              </span>
            </div>

            <div className="max-h-[450px] overflow-y-auto p-2 custom-scrollbar">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group mb-1"
                  >
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                        notif.type === 'new_hire' ? 'bg-emerald-100 text-emerald-600' :
                        notif.type === 'trial_ending' ? 'bg-amber-100 text-amber-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {notif.type === 'new_hire' ? <UserPlus className="w-6 h-6" /> :
                         notif.type === 'trial_ending' ? <Clock className="w-6 h-6" /> :
                         <AlertTriangle className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{notif.title}</p>
                          <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-4">{notif.date}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{notif.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center">
                  <div className="w-12 h-12 bg-slate-50 text-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Yeni bildirim yok</p>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-4 bg-slate-50/50 border-t border-slate-50 text-center">
                <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-500 transition-colors">
                  Tümünü Gör
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
