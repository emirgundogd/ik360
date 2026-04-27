
import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  X
} from 'lucide-react';
import { taskService } from '../../services/taskService';

export const TaskNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const tasks = taskService.getTasks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newNotifications: any[] = [];

    tasks.forEach(task => {
      if (task.status === 'completed' || task.status === 'cancelled') return;

      // 1. Delayed Tasks Warning
      if (task.status === 'delayed') {
        newNotifications.push({
          id: `delayed-${task.id}`,
          title: 'Gecikme Uyarısı',
          message: `"${task.title}" görevi gecikmiş durumda. Acil müdahale gerekli.`,
          type: 'error',
          time: 'Gecikti',
          task: task
        });
        return;
      }

      if (task.plannedStartDate) {
        const startDate = new Date(task.plannedStartDate);
        startDate.setHours(0, 0, 0, 0);
        
        const timeDiff = startDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        // 2. Critical Task Notifications
        if (task.priority === 'critical') {
          if (daysDiff === 3) {
            newNotifications.push({
              id: `critical-3d-${task.id}`,
              title: 'Kritik Görev Yaklaşıyor',
              message: `"${task.title}" için son 3 gün. Hazırlıklara başlayın.`,
              type: 'warning',
              time: '3 Gün Kaldı',
              task: task
            });
          } else if (daysDiff === 1) {
            newNotifications.push({
              id: `critical-1d-${task.id}`,
              title: 'Kritik Görev Yarın',
              message: `"${task.title}" yarın başlıyor. Lütfen kontrol edin.`,
              type: 'warning',
              time: 'Yarın',
              task: task
            });
          } else if (daysDiff === 0) {
            newNotifications.push({
              id: `critical-today-${task.id}`,
              title: 'Kritik Görev Zamanı',
              message: `"${task.title}" bugün yapılmalı. Öncelikli işlem.`,
              type: 'error', // Red for critical today
              time: 'Bugün',
              task: task
            });
          }
        } 
        // 3. Normal Task Notifications
        else {
          if (daysDiff === 0) {
            newNotifications.push({
              id: `today-${task.id}`,
              title: 'Bugünün Görevi',
              message: `"${task.title}" bugün planlandı.`,
              type: 'info',
              time: 'Bugün',
              task: task
            });
          } else if (daysDiff === 1) {
            newNotifications.push({
              id: `tomorrow-${task.id}`,
              title: 'Yaklaşan Görev',
              message: `"${task.title}" yarın başlıyor.`,
              type: 'info',
              time: 'Yarın',
              task: task
            });
          }
        }
      }
    });

    setNotifications(newNotifications);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-6 h-6 text-red-500 animate-pulse" />;
      case 'warning': return <Clock className="w-6 h-6 text-amber-500 animate-pulse" />;
      case 'success': return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
      default: return <Bell className="w-6 h-6 text-blue-500 animate-pulse" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-50 border-red-100';
      case 'warning': return 'bg-amber-50 border-amber-100';
      case 'success': return 'bg-emerald-50 border-emerald-100';
      default: return 'bg-blue-50 border-blue-100';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Bildirim Merkezi</h2>
          <p className="text-slate-500 font-medium mt-1">Önemli hatırlatmalar ve uyarılar</p>
        </div>
        <button className="text-sm font-bold text-brand-600 hover:text-brand-700">
          Tümünü Okundu İşaretle
        </button>
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <div 
              key={notification.id}
              className={`p-6 rounded-2xl border ${getBgColor(notification.type)} flex gap-4 relative group transition-all hover:shadow-md`}
            >
              <div className="p-3 bg-white rounded-xl shadow-sm h-fit">
                {getIcon(notification.type)}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-800 text-lg">{notification.title}</h3>
                  <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-lg shadow-sm">
                    {notification.time}
                  </span>
                </div>
                <p className="text-slate-600 mt-1 font-medium">{notification.message}</p>
                
                <div className="flex items-center gap-4 mt-4">
                  <button className="text-xs font-black uppercase tracking-wider text-slate-500 hover:text-brand-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:border-brand-200 transition-colors shadow-sm">
                    Görevi Görüntüle
                  </button>
                  {notification.type !== 'success' && (
                    <button className="text-xs font-black uppercase tracking-wider text-slate-400 hover:text-slate-600">
                      Ertele
                    </button>
                  )}
                </div>
              </div>

              <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-5 h-5" />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Bildirim Yok</h3>
            <p className="text-slate-500 text-sm mt-1">Şu an için okunmamış bildiriminiz bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
};
