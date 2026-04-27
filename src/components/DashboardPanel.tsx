
import React, { useState, useEffect } from 'react';
import { 
  Calculator, Users, Calendar, Settings, 
  LogOut, ChevronRight, Construction,
  Briefcase,
  Bell, Sparkles, StickyNote, Grid, ExternalLink, X
} from 'lucide-react';
import { User, AppConfig } from '../types';
import { motion } from 'motion/react';
import { OtherSoftwaresSettings } from './OtherSoftwaresSettings';

interface DashboardPanelProps {
  user: User;
  onNavigate: (module: string) => void;
  onLogout: () => void;
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
}

type Category = 'all' | 'hr' | 'ops' | 'library' | 'system' | 'report';

export const DashboardPanel: React.FC<DashboardPanelProps> = ({ user, onNavigate, onLogout, config, onConfigChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [showDevModal, setShowDevModal] = useState<string | null>(null);
  const [showOtherSoftwares, setShowOtherSoftwares] = useState(false);
  const [isManagingSoftwares, setIsManagingSoftwares] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'Tünaydın';
    return 'İyi Akşamlar';
  };

  const modules = [
    {
      id: 'personnel',
      title: 'Personel Yönetimi',
      desc: 'Sicil kartları, işe giriş/çıkış ve organizasyon şeması',
      icon: Users,
      color: 'text-brand-600',
      bg: 'bg-brand-50',
      border: 'hover:border-brand-300',
      gradient: 'group-hover:from-brand-50 group-hover:to-white',
      category: 'hr',
      active: true,
      route: 'personnel'
    },
    {
      id: 'pdks',
      title: 'PDKS Hesaplama Sistemi',
      desc: 'Eksik çalışma, maaş ve izin kesinti hesaplamaları',
      icon: Calculator,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'hover:border-blue-300',
      gradient: 'group-hover:from-blue-50 group-hover:to-white',
      category: 'ops',
      active: true,
      route: 'pdks'
    },
    {
      id: 'tasks',
      title: 'İş Takibi (Operasyon)',
      desc: 'İK operasyonel görevleri ve hatırlatıcılar',
      icon: Briefcase,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'hover:border-emerald-300',
      gradient: 'group-hover:from-emerald-50 group-hover:to-white',
      category: 'ops',
      active: true,
      route: 'tasks'
    },
    {
      id: 'notes',
      title: 'Notlar / Hatırlatıcılar',
      desc: 'Kişisel notlar, hatırlatmalar ve yapılacaklar',
      icon: StickyNote,
      color: 'text-pink-600',
      bg: 'bg-pink-50',
      border: 'hover:border-pink-300',
      gradient: 'group-hover:from-pink-50 group-hover:to-white',
      category: 'ops',
      active: true,
      route: 'notes'
    },
    {
      id: 'leave',
      title: 'İzin Takibi & Raporlama',
      desc: 'Yıllık izin planlama ve devir bakiyeleri',
      icon: Calendar,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      border: 'hover:border-teal-300',
      gradient: 'group-hover:from-teal-50 group-hover:to-white',
      category: 'hr',
      active: true,
      route: 'leave'
    },
    {
      id: 'admin',
      title: 'Sistem Yönetimi',
      desc: 'Kullanıcı yetkilendirme ve sistem ayarları',
      icon: Settings,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
      border: 'hover:border-slate-300',
      gradient: 'group-hover:from-slate-100 group-hover:to-white',
      category: 'system',
      active: true,
      role: 'ADMIN',
      route: 'admin'
    }
  ];

  const filteredModules = modules.filter(m => {
    const matchesCategory = activeCategory === 'all' || m.category === activeCategory;
    const matchesRole = !m.role || user.role === m.role;
    
    // Permission check
    const checkId = m.id === 'payroll' ? 'pdks' : (m.route || m.id);
    const isPermitted = user.role === 'ADMIN' || 
                       !user.permittedModules || 
                       user.permittedModules.includes(checkId);

    return matchesCategory && matchesRole && isPermitted;
  });

  const categories = [
    { id: 'all', label: 'Tümü' },
    { id: 'ops', label: 'Operasyon' },
    { id: 'hr', label: 'İnsan Kaynakları' },
    { id: 'system', label: 'Sistem' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col relative overflow-hidden">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[100px] animate-pulse-slow pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[80px] animate-float pointer-events-none"></div>

      {/* Top Header */}
      <header className="glass-panel sticky top-0 z-50 transition-all duration-500 border-b border-white/40 shadow-sm">
        <div className="responsive-container h-20 flex justify-between items-center">
          {/* Logo Area */}
          <div className="flex items-center gap-3 select-none group cursor-pointer pl-0" onClick={() => onNavigate('dashboard')}>
            <div className="flex flex-col">
              <motion.div 
                className="flex items-baseline gap-1"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
              >
                <span className="text-5xl font-black tracking-tighter text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">
                  ik
                </span>
                <span className="text-5xl font-black text-slate-900 tracking-tighter">
                  360
                </span>
              </motion.div>
            </div>
          </div>

          {/* Right Info */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-600">
                {currentTime.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-brand-600 hover:border-brand-200 transition-all active:scale-95 shadow-sm relative group">
               <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
               <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-6 border-l border-slate-200/50">
              <div className="text-right">
                <div className="text-sm font-bold text-slate-800">{user.username}</div>
                <div className="text-[10px] text-brand-600 font-bold uppercase tracking-wider bg-brand-50 px-2 py-0.5 rounded-md inline-block">{user.role}</div>
              </div>
              <button 
                onClick={onLogout}
                className="p-2.5 bg-slate-800 text-white rounded-xl hover:bg-red-600 transition-all duration-300 group active:scale-95 shadow-lg shadow-slate-900/20"
                title="Güvenli Çıkış"
              >
                <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 responsive-container pt-6 pb-16 md:pt-12 md:pb-32 flex flex-col z-10">
        
        {/* Welcome Section */}
        <div className="mb-16 animate-fade-in-up flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
             <div className="flex items-center gap-2 text-brand-600 font-bold text-sm uppercase tracking-wider animate-slide-in-right">
                <Sparkles className="w-4 h-4" />
                <span>{getGreeting()},</span>
             </div>
             <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
               {user.username}
             </h1>
             <p className="text-slate-500 font-medium text-xl">Bugün operasyonel süreçlerde neler yapmak istersin?</p>
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowOtherSoftwares(true);
              setIsManagingSoftwares(false);
            }}
            className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-brand-100 rounded-2xl text-brand-700 hover:border-brand-300 transition-all shadow-lg shadow-brand-500/10 group self-start"
            title="Diğer Yazılımlar"
          >
             <div className="text-left">
               <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Hızlı Erişim</span>
               <span className="block text-sm font-black text-slate-800">Diğer Yazılımlar</span>
             </div>
          </motion.button>
        </div>

        {/* Dynamic Grid System */}
        <motion.div 
          className="responsive-grid"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
        >
          {filteredModules.map((module, idx) => (
            <motion.button
              key={module.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ 
                y: -12,
                scale: 1.02,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => module.active && module.route ? onNavigate(module.route) : setShowDevModal(module.title)}
              className={`group relative bg-white rounded-[2.5rem] p-8 md:p-10 shadow-card hover:shadow-2xl border border-slate-100 ${module.border} text-left flex flex-col h-64 md:h-72 overflow-hidden transition-shadow duration-500`}
            >
              {/* Hover Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              {/* Decorative Background Shapes */}
              <div className={`absolute -right-4 -top-4 w-32 h-32 rounded-full ${module.bg} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500`}></div>
              <div className={`absolute -left-8 -bottom-8 w-40 h-40 rounded-full ${module.bg} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500`}></div>

              <div className="relative z-10 flex justify-between items-start mb-8">
                <div className={`p-5 rounded-2xl ${module.bg} ${module.color} group-hover:scale-110 transition-all duration-500 shadow-inner ring-4 ring-white`}>
                  <module.icon className="w-10 h-10" />
                </div>
                {!module.active && (
                  <span className="bg-slate-100 text-slate-400 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest flex items-center gap-2 shadow-sm border border-slate-200/50">
                    <Construction className="w-3.5 h-3.5" /> Yakında
                  </span>
                )}
                {module.badge && module.active && (
                  <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-white/50 ${
                    module.badge === 'Yeni' ? 'bg-pink-100 text-pink-600' : 
                    module.badge === 'Aktif' ? 'bg-brand-100 text-brand-600' : 
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {module.badge}
                  </span>
                )}
              </div>
              
              <div className="relative z-10 mt-auto space-y-3">
                <h3 className="text-xl md:text-2xl font-black text-slate-800 group-hover:text-brand-700 transition-colors tracking-tight leading-tight">
                  {module.title}
                </h3>
                <p className="text-xs md:text-sm text-slate-400 font-medium leading-relaxed group-hover:text-slate-600 transition-colors pr-4 line-clamp-2">
                  {module.desc}
                </p>
              </div>

              <div className="absolute right-8 bottom-8 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                <div className="bg-white p-3 rounded-full shadow-lg text-brand-600 border border-slate-100">
                   <ChevronRight className="w-6 h-6" />
                </div>
              </div>

              {/* Bottom Progress/Status Line */}
              <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-50 overflow-hidden">
                <motion.div 
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '0%' }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className={`h-full w-full bg-gradient-to-r ${
                    module.id === 'personnel' ? 'from-brand-400 to-brand-600' :
                    module.id === 'pdks' ? 'from-blue-400 to-blue-600' :
                    'from-slate-400 to-slate-600'
                  }`}
                />
              </div>
            </motion.button>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-200/50 py-6 mt-auto relative z-20">
        <div className="responsive-container flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>© 2026 | İK360 | İNSAN KAYNAKLARI YÖNETİM SİSTEMİ</span>
          <span className="lowercase italic">geliştirici: emirgundogdu</span>
        </div>
      </footer>

      {/* Development Modal */}
      {showDevModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-start justify-center p-4 pt-20 animate-in fade-in zoom-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center border border-white/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-400 to-indigo-500"></div>
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400 animate-pulse border-4 border-white shadow-lg">
              <Construction className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">{showDevModal}</h3>
            <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
              Bu modül şu anda geliştirme aşamasındadır.<br/>Yakında hizmete açılacaktır.
            </p>
            <button 
              onClick={() => setShowDevModal(null)}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl hover:shadow-2xl"
            >
              Tamam, Anlaşıldı
            </button>
          </div>
        </div>
      )}

      {/* Other Softwares Modal */}
      {showOtherSoftwares && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center">
                  <Grid className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Diğer Yazılımlar</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Hayrat Yardım Ekosistemi</p>
                </div>
              </div>
              <button 
                onClick={() => setShowOtherSoftwares(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {isManagingSoftwares ? (
                <OtherSoftwaresSettings config={config} onConfigChange={onConfigChange} />
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {(config.otherSoftwares || []).filter(s => s.isActive).map(software => (
                      <a
                        key={software.id}
                        href={software.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all group text-center shadow-sm hover:shadow-md"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden p-3 group-hover:scale-110 transition-transform duration-300">
                          {software.logo ? (
                            <img src={software.logo} alt={software.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <ExternalLink className="w-8 h-8 text-slate-400 group-hover:text-brand-500 transition-colors" />
                          )}
                        </div>
                        <span className="text-sm font-black text-slate-700 group-hover:text-brand-700 transition-colors line-clamp-2">
                          {software.name}
                        </span>
                      </a>
                    ))}
                  </div>
                  
                  {(config.otherSoftwares || []).filter(s => s.isActive).length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Grid className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-black text-slate-800">Henüz Yazılım Eklenmedi</h3>
                      <p className="text-sm font-medium text-slate-500 mt-2">Sistem yöneticisi tarafından eklenen yazılımlar burada listelenecektir.</p>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {user.role === 'ADMIN' && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setIsManagingSoftwares(!isManagingSoftwares)}
                  className="px-4 py-2 text-sm font-bold text-brand-600 hover:bg-brand-100 rounded-xl transition-colors flex items-center gap-2"
                >
                  {isManagingSoftwares ? (
                    <>
                      <Grid className="w-4 h-4" />
                      Yazılımları Görüntüle
                    </>
                  ) : (
                    <>
                      <Settings className="w-4 h-4" />
                      Yazılımları Yönet
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};
