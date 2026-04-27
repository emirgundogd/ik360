import React, { useState } from 'react';
import { Employee, NotificationRecord } from '../types';
import { Bell, Search, Trash2, Mail, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface Props {
  employees: Employee[];
  notifications: NotificationRecord[];
  onDelete: (id: string) => void;
}

export const NotificationCenter: React.FC<Props> = ({ employees, notifications, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNotifications = notifications.filter(n => {
    const emp = employees.find(e => e.id === n.employeeId);
    const searchStr = `${emp?.name || ''} ${n.subject} ${n.body}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase()) && !n.isDeleted;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Bildirim Merkezi</h2>
          <p className="text-slate-500 font-medium text-lg mt-1">Gönderilen personel bildirimleri ve durum takibi</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Personel veya konu ile ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-brand-500 outline-none transition-all font-bold text-slate-900"
          />
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Personel</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Konu</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Kanal</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Durum</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Tarih</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredNotifications.length > 0 ? filteredNotifications.map(notif => {
                const emp = employees.find(e => e.id === notif.employeeId);
                return (
                  <tr key={notif.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center font-black text-xs">
                          {emp?.name?.split(' ').map(n => n[0]).join('') || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{emp?.name || 'Bilinmeyen Personel'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{emp?.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="max-w-xs">
                        <p className="font-bold text-slate-700 text-sm truncate">{notif.subject}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{notif.body}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex gap-1">
                        {notif.channels.map(ch => (
                          <span key={ch} className="p-1.5 bg-slate-100 text-slate-500 rounded-lg" title={ch}>
                            {ch === 'email' ? <Mail className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        notif.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 
                        notif.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {notif.status === 'sent' ? <CheckCircle2 className="w-3 h-3" /> : 
                         notif.status === 'failed' ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {notif.status === 'sent' ? 'GÖNDERİLDİ' : notif.status === 'failed' ? 'HATA' : 'TASLAK'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-slate-600">{new Date(notif.sentAt || '').toLocaleDateString('tr-TR')}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{new Date(notif.sentAt || '').toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onDelete(notif.id)}
                          className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                      <Bell className="w-16 h-16 opacity-20" />
                      <p className="font-black uppercase tracking-widest text-sm">Bildirim kaydı bulunamadı</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
