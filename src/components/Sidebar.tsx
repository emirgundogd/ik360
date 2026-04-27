
import React from 'react';
import { 
  Users, 
  ClipboardList, 
  ShieldCheck, 
  Bell, 
  Scissors, 
  LayoutTemplate, 
  LogOut, 
  Key, 
  Calendar, 
  LayoutGrid, 
  FileText,
  LayoutDashboard,
  FileSpreadsheet,
  Settings,
  Trash2,
  Target,
  StickyNote,
  Database,
  RefreshCw,
  Calculator,
  Building2
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  activeSubTab: string;
  isOpen?: boolean;
  onClose?: () => void;
  onChange: (module: string, subTab?: string) => void;
  userRole?: string;
  permittedModules?: string[];
  onPasswordChangeRequest?: () => void;
  onBackToDashboard?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeModule, 
  activeSubTab, 
  isOpen,
  onClose,
  onChange, 
  userRole, 
  permittedModules,
  onPasswordChangeRequest, 
  onBackToDashboard 
}) => {
  
  const isModulePermitted = (moduleId: string) => {
    if (userRole === 'ADMIN') return true;
    if (!permittedModules) return true; // Default to all if not set (for backward compatibility)
    return permittedModules.includes(moduleId);
  };

  const mainModules = [
    { id: 'dashboard', label: 'Ana Panel', icon: LayoutGrid, roles: ['ADMIN', 'USER'] },
    { id: 'tasks', label: 'İş Takibi', icon: ClipboardList, roles: ['ADMIN', 'USER'] },
    { id: 'admin', label: 'Sistem Yönetimi', icon: Settings, roles: ['ADMIN'] },
  ].filter(m => isModulePermitted(m.id));

  const personnelMenu = [
    { id: 'dashboard', label: 'Özet (Dashboard)', icon: LayoutDashboard },
    { id: 'list', label: 'Personel Listesi', icon: Users },
    { id: 'master', label: 'Tanımlamalar', icon: Settings },
    { id: 'reports', label: 'Raporlar', icon: FileText },
    { id: 'trash', label: 'Çöp Kutusu', icon: Trash2 },
  ];

  const tasksMenu = [
    { id: 'today', label: 'Bugünün Planı', icon: Calendar },
    { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
    { id: 'list', label: 'İş Listesi', icon: ClipboardList },
    { id: 'goals', label: 'Hedefler', icon: Target },
    { id: 'calendar', label: 'Takvim / Çizelge', icon: Calendar },
    { id: 'notifications', label: 'Bildirim Merkezi', icon: Bell },
    { id: 'reports', label: 'Raporlar', icon: FileText },
    { id: 'settings', label: 'Tanımlamalar', icon: Settings },
    { id: 'trash', label: 'Çöp Kutusu', icon: Trash2 },
  ];

  const pdksMenu = [
    { id: 'dashboard', label: 'Özet (Dashboard)', icon: LayoutDashboard },
    { id: 'records', label: 'Kayıtlar Tablosu', icon: ClipboardList },
    { id: 'rules', label: 'Kurallar Yönetimi', icon: ShieldCheck, roles: ['ADMIN'] },
    { id: 'deduction-details', label: 'Kesinti Detayları', icon: Scissors },
    { id: 'personnel-notifications', label: 'Personel Bildirimi', icon: Bell },
    { id: 'unit-notifications', label: 'Birim Sorumlusu Bildirimleri', icon: Building2 },
    { id: 'templates', label: 'Mesaj Taslakları', icon: LayoutTemplate, roles: ['ADMIN'] },
  ];

  const adminMenu = [
    { id: 'general', label: 'Genel Ayarlar', icon: Settings },
    { id: 'users', label: 'Kullanıcılar', icon: Users },
    { id: 'backup', label: 'Yedekleme', icon: RefreshCw },
    { id: 'trash', label: 'Çöp Kutusu', icon: Trash2 },
  ];

  const notesMenu = [
    { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
    { id: 'notes', label: 'Notlarım', icon: StickyNote },
    { id: 'reminders', label: 'Hatırlatıcılar', icon: Bell },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
    { id: 'trash', label: 'Çöp Kutusu', icon: Trash2 },
  ];

  const leaveMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'import', label: 'Excel Yükleme', icon: FileSpreadsheet },
    { id: 'data', label: 'İzin Verileri', icon: Database },
    { id: 'analytics', label: 'İzin Analizleri', icon: Target },
    { id: 'cost', label: 'İzin Maliyet Raporu', icon: Calculator },
    { id: 'manager', label: 'Birim Sorumlusu Raporları', icon: Users },
    { id: 'risk', label: 'Riskli Personeller', icon: ShieldCheck },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  const visibleMain = mainModules.filter(item => item.roles.includes(userRole || 'USER'));

  const visiblePersonnel = personnelMenu.filter(item => !item.roles || item.roles.includes(userRole || 'USER'));
  const visiblePdks = pdksMenu.filter(item => !item.roles || item.roles.includes(userRole || 'USER'));

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-50 border-r border-slate-800 shadow-2xl transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="p-6 border-b border-slate-800 bg-slate-950/20">
        <div className="flex items-center gap-3 cursor-pointer group pl-6" onClick={onBackToDashboard}>
          <div className="flex flex-col">
            <div 
              className="flex items-baseline gap-1"
            >
              <span 
                className="text-3xl font-black tracking-tight text-cyan-400"
              >
                ik
              </span>
              <span 
                className="text-3xl font-black text-slate-100 tracking-tight"
              >
                360
              </span>
            </div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mt-0.5">İnsan Kaynakları</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-none">
        
        {activeModule === 'dashboard' ? (
          <>
            <div className="px-4 mb-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">ANA MODÜLLER</div>
            {visibleMain.map((item, index) => (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 group ${
                  activeModule === item.id 
                    ? 'bg-brand-600 text-white shadow-xl shadow-brand-900/40 translate-x-1 scale-105' 
                    : 'hover:bg-slate-800/50 text-slate-400 hover:text-white hover:translate-x-2'
                }`}
                style={{ transitionDelay: `${index * 20}ms` }}
              >
                <item.icon className={`w-4 h-4 shrink-0 transition-colors duration-300 ${activeModule === item.id ? 'text-white' : 'text-slate-500 group-hover:text-brand-400'}`} />
                <span className="whitespace-nowrap overflow-hidden text-ellipsis uppercase tracking-tighter text-xs">
                  {item.label}
                </span>
              </button>
            ))}
          </>
        ) : (
          <div className="px-3 mb-6 animate-in fade-in slide-in-from-left-4 duration-500">
             <button
                onClick={onBackToDashboard}
                className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700/50 text-white font-black rounded-xl shadow-lg hover:shadow-brand-500/20 hover:border-brand-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-brand-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <LayoutGrid className="w-4 h-4 text-brand-500 group-hover:text-white group-hover:rotate-180 transition-all duration-500 relative z-10" />
                <span className="uppercase tracking-widest text-[10px] relative z-10 group-hover:text-brand-100 transition-colors">PANELE DÖN</span>
              </button>
          </div>
        )}

        {/* Contextual Menu for Personnel */}
        {activeModule === 'personnel' && isModulePermitted('personnel') && (
          <>
            <div className="px-4 mt-6 mb-2 text-[10px] font-black text-brand-500 uppercase tracking-widest">PERSONEL MENÜSÜ</div>
            {visiblePersonnel.map((item, index) => (
              <button
                key={item.id}
                onClick={() => onChange('personnel', item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold rounded-lg transition-all duration-300 group ${
                  activeSubTab === item.id 
                    ? 'bg-slate-800 text-brand-400 border-l-4 border-brand-500 pl-6' 
                    : 'hover:bg-slate-800/30 text-slate-500 hover:text-slate-200 hover:pl-5'
                }`}
              >
                <item.icon className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === item.id ? 'text-brand-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                <span className="uppercase tracking-tight">{item.label}</span>
              </button>
            ))}
          </>
        )}

        {/* Contextual Menu for Tasks */}
        {activeModule === 'tasks' && isModulePermitted('tasks') && (
          <>
            <div className="px-4 mt-6 mb-2 text-[10px] font-black text-amber-500 uppercase tracking-widest">İŞ TAKİBİ MENÜSÜ</div>
            {tasksMenu.map((item, index) => (
              <button
                key={item.id}
                onClick={() => onChange('tasks', item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold rounded-lg transition-all duration-300 group ${
                  activeSubTab === item.id 
                    ? 'bg-slate-800 text-amber-400 border-l-4 border-amber-500 pl-6' 
                    : 'hover:bg-slate-800/30 text-slate-500 hover:text-slate-200 hover:pl-5'
                }`}
              >
                <item.icon className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === item.id ? 'text-amber-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                <span className="uppercase tracking-tight">{item.label}</span>
              </button>
            ))}
          </>
        )}

        {/* Contextual Menu for Admin */}
        {activeModule === 'admin' && isModulePermitted('admin') && (
          <>
            <div className="px-4 mt-6 mb-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">SİSTEM YÖNETİMİ</div>
            {adminMenu.map((item, index) => (
              <button
                key={item.id}
                onClick={() => onChange('admin', item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold rounded-lg transition-all duration-300 group ${
                  activeSubTab === item.id 
                    ? 'bg-slate-800 text-brand-400 border-l-4 border-brand-500 pl-6' 
                    : 'hover:bg-slate-800/30 text-slate-500 hover:text-slate-200 hover:pl-5'
                }`}
              >
                <item.icon className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === item.id ? 'text-brand-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                <span className="uppercase tracking-tight">{item.label}</span>
              </button>
            ))}
          </>
        )}

        {/* Contextual Menu for PDKS */}
        {activeModule === 'pdks' && isModulePermitted('pdks') && (
          <>
            <div className="px-4 mt-6 mb-2 text-[10px] font-black text-cyan-500 uppercase tracking-widest">PDKS MENÜSÜ</div>
            {visiblePdks.map((item, index) => (
              <button
                key={item.id}
                onClick={() => onChange('pdks', item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold rounded-lg transition-all duration-300 group ${
                  activeSubTab === item.id 
                    ? 'bg-slate-800 text-cyan-400 border-l-4 border-cyan-500 pl-6' 
                    : 'hover:bg-slate-800/30 text-slate-500 hover:text-slate-200 hover:pl-5'
                }`}
              >
                <item.icon className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === item.id ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                <span className="uppercase tracking-tight whitespace-nowrap truncate">{item.label}</span>
              </button>
            ))}
          </>
        )}

        {/* Contextual Menu for Notes */}
        {activeModule === 'notes' && isModulePermitted('notes') && (
          <>
            <div className="px-4 mt-6 mb-2 text-[10px] font-black text-pink-500 uppercase tracking-widest">NOTLAR MENÜSÜ</div>
            {notesMenu.map((item, index) => (
              <button
                key={item.id}
                onClick={() => onChange('notes', item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold rounded-lg transition-all duration-300 group ${
                  activeSubTab === item.id 
                    ? 'bg-slate-800 text-pink-400 border-l-4 border-pink-500 pl-6' 
                    : 'hover:bg-slate-800/30 text-slate-500 hover:text-slate-200 hover:pl-5'
                }`}
              >
                <item.icon className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === item.id ? 'text-pink-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                <span className="uppercase tracking-tight">{item.label}</span>
              </button>
            ))}
          </>
        )}

        {/* Contextual Menu for Leave */}
        {activeModule === 'leave' && isModulePermitted('leave') && (
          <>
            <div className="px-4 mt-6 mb-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">İZİN & DEVİR TAKİBİ</div>
            {leaveMenu.map((item, index) => (
              <button
                key={item.id}
                onClick={() => onChange('leave', item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold rounded-lg transition-all duration-300 group ${
                  activeSubTab === item.id 
                    ? 'bg-slate-800 text-emerald-400 border-l-4 border-emerald-500 pl-6' 
                    : 'hover:bg-slate-800/30 text-slate-500 hover:text-slate-200 hover:pl-5'
                }`}
              >
                <item.icon className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === item.id ? 'text-emerald-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                <span className="uppercase tracking-tight whitespace-nowrap truncate">{item.label}</span>
              </button>
            ))}
          </>
        )}

      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-2">
         <button 
           onClick={onPasswordChangeRequest}
           className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all uppercase tracking-tight hover:pl-5"
         >
           <Key className="w-3 h-3" /> Şifre Değiştir
         </button>
         <button 
           onClick={() => { 
             try {
               localStorage.removeItem('AUTH_TOKEN'); 
             } catch (e) {
               console.error('Failed to remove token', e);
             }
             window.location.reload(); 
           }}
           className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-red-400 hover:bg-red-500/10 rounded-xl transition-all uppercase tracking-widest hover:pl-5"
         >
           <LogOut className="w-4 h-4" /> Oturumu Kapat
         </button>
         
         <div className="px-4 pt-4 pb-2 text-[8px] font-black text-slate-600 uppercase text-center border-t border-slate-800/50 hover:text-slate-500 transition-colors cursor-default">
           © 2026 | ik360 | İNSAN KAYNAKLARI
         </div>
      </div>
    </aside>
    </>
  );
};
