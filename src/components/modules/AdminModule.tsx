import React from 'react';
import { Settings, Shield, Users, Database, Lock, Bell, Globe, Cpu, Activity, Save, RefreshCw } from 'lucide-react';

export const AdminModule: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Sistem Yönetimi</h2>
          <p className="text-slate-500 font-medium text-lg mt-1">Kullanıcı yetkilendirme ve sistem konfigürasyonu</p>
        </div>
        <button className="px-6 py-3 bg-slate-900 text-white font-black rounded-2xl flex items-center gap-2 shadow-xl shadow-slate-900/20 transition-all active:scale-95">
          <Save className="w-5 h-5" /> Ayarları Kaydet
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-slate-800 text-xl flex items-center gap-3">
              <Cpu className="w-6 h-6 text-brand-600" />
              Sistem Durumu
            </h3>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3 h-3" /> Stabil
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'CPU Kullanımı', value: '%12', color: 'bg-emerald-500' },
              { label: 'Bellek', value: '256MB / 1GB', color: 'bg-blue-500' },
              { label: 'Veritabanı', value: '1.2MB', color: 'bg-purple-500' },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">{stat.label}</p>
                <div className="text-2xl font-black text-slate-800">{stat.value}</div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className={`h-full ${stat.color} w-1/3`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
          <h3 className="text-xl font-black mb-6">Hızlı İşlemler</h3>
          <div className="space-y-3">
            {[
              { label: 'Önbelleği Temizle', icon: RefreshCw },
              { label: 'Logları İndir', icon: Database },
              { label: 'Güvenlik Taraması', icon: Shield },
              { label: 'E-posta Testi', icon: Bell },
            ].map(action => (
              <button key={action.label} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-sm font-bold group">
                <action.icon className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Groups */}
        {[
          { title: 'Güvenlik Ayarları', icon: Lock, color: 'text-red-600', bg: 'bg-red-50', desc: 'Şifre politikaları ve 2FA yönetimi' },
          { title: 'Kullanıcı Yetkileri', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Rol tanımlamaları ve erişim kısıtları' },
          { title: 'Genel Ayarlar', icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Dil, zaman dilimi ve bölge ayarları' },
        ].map(group => (
          <div key={group.title} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 hover:border-brand-300 transition-all cursor-pointer group">
            <div className={`p-4 rounded-2xl ${group.bg} ${group.color} w-fit mb-6 group-hover:scale-110 transition-transform`}>
              <group.icon className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-slate-800 mb-2">{group.title}</h4>
            <p className="text-slate-500 text-xs font-medium leading-relaxed">{group.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
