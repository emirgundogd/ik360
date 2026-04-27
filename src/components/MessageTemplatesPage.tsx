import React, { useState } from 'react';
import { 
  MessageTemplate, 
  ManagerMessageTemplate, 
  NotificationScenario,
  SCENARIO_LABELS,
  SCENARIO_DESCRIPTIONS 
} from '../types';
import { 
  MessageSquare, 
  User, 
  Briefcase, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  Layout,
  Variable,
  Eye,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MessageTemplatesPageProps {
  personnelTemplates: MessageTemplate[];
  managerTemplates: ManagerMessageTemplate[];
  onUpdatePersonnelTemplate: (template: MessageTemplate) => void;
  onUpdateManagerTemplate: (template: ManagerMessageTemplate) => void;
  onAddPersonnelTemplate: () => void;
  onAddManagerTemplate: () => void;
  onDeletePersonnelTemplate: (id: string) => void;
  onDeleteManagerTemplate: (id: string) => void;
}

export const MessageTemplatesPage: React.FC<MessageTemplatesPageProps> = ({
  personnelTemplates,
  managerTemplates,
  onUpdatePersonnelTemplate,
  onUpdateManagerTemplate,
  onAddPersonnelTemplate,
  onAddManagerTemplate,
  onDeletePersonnelTemplate,
  onDeleteManagerTemplate
}) => {
  const [activeSection, setActiveSection] = useState<'personnel' | 'manager'>('personnel');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const selectedPersonnelTemplate = personnelTemplates.find(t => t.id === selectedId);
  const selectedManagerTemplate = managerTemplates.find(t => t.id === selectedId);

  const variables = activeSection === 'personnel' 
    ? [
        '[PERSONEL_ADI]', '[AY_YIL]', '[TOPLAM_EKSIK_SURE]', '[GEC_GUN_ADEDI]', 
        '[MEVCUT_IZIN_HAKKI]', '[IZINDEN_DUSULEN_SURE]', '[KALAN_IZIN_BAKIYESI]', 
        '[IZIN_HAVUZU_BEKLEYEN]', '[DEVREDEN_IZIN_HAVUZU]', '[MAAS_HAVUZUNA_AKTARILAN]', 
        '[MAAS_HAVUZU_BEKLEYEN]', '[DEVREDEN_MAAS_HAVUZU]', '[MAAS_KESINTISINE_ESAS_SURE]', 
        '[KESINTI_TUTARI]', '[DEVREDEN_SURE]'
      ]
    : [
        '[BIRIM_SORUMLUSU_ADI]', '[BIRIM_ADI]', '[AY_YIL]', '[PERSONEL_OZET_LISTESI]', 
        '[TOPLAM_PERSONEL]', '[ISLEM_UYGULANAN_PERSONEL]', '[IZINDEN_KARSILANAN_PERSONEL]', 
        '[MAAS_HAVUZUNA_AKTARILAN_PERSONEL]', '[MAAS_KESINTISI_UYGULANAN_PERSONEL]', 
        '[YEDI_GUN_KURALINA_TAKILAN_PERSONEL]', '[DEVREDEN_KAYIT_SAYISI]'
      ];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Mesaj Taslakları</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dinamik Bildirim Şablonu Yönetimi</span>
          </div>
        </div>
        <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => { setActiveSection('personnel'); setSelectedId(null); }}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${
              activeSection === 'personnel' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <User className="w-4 h-4" />
            Personel Şablonları
          </button>
          <button
            onClick={() => { setActiveSection('manager'); setSelectedId(null); }}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${
              activeSection === 'manager' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Yönetici Şablonları
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Panel: Templates List */}
        <div className="w-80 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taslaklar</span>
            <button 
              onClick={activeSection === 'personnel' ? onAddPersonnelTemplate : onAddManagerTemplate}
              className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {(activeSection === 'personnel' ? personnelTemplates : managerTemplates).map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedId(template.id)}
                className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all group ${
                  selectedId === template.id 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' 
                    : 'hover:bg-slate-50 border-transparent border'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    selectedId === template.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Layout className="w-5 h-5" />
                  </div>
                  <div className="text-left overflow-hidden">
                    <div className={`text-xs font-black truncate ${selectedId === template.id ? 'text-white' : 'text-slate-900'}`}>
                      {template.title}
                    </div>
                    <div className={`text-[9px] font-bold uppercase tracking-wider truncate ${selectedId === template.id ? 'text-white/70' : 'text-slate-400'}`}>
                      {activeSection === 'personnel' 
                        ? SCENARIO_LABELS[(template as MessageTemplate).scenario] 
                        : 'Birim Özeti'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {template.isActive ? (
                    <CheckCircle2 className={`w-4 h-4 ${selectedId === template.id ? 'text-white' : 'text-emerald-500'}`} />
                  ) : (
                    <XCircle className={`w-4 h-4 ${selectedId === template.id ? 'text-white/50' : 'text-slate-300'}`} />
                  )}
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedId === template.id ? 'text-white translate-x-1' : 'text-slate-300'}`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel: Editor */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          <AnimatePresence mode="wait">
            {(selectedPersonnelTemplate || selectedManagerTemplate) ? (
              <motion.div
                key={selectedId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col h-full gap-6"
              >
                <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-purple-100">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-widest block">Taslak Düzenleyici</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">İçerik ve Değişken Yönetimi</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsPreviewOpen(true)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-[10px] font-black rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest flex items-center gap-2"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Önizleme
                      </button>
                      <button
                        onClick={() => {
                          if (activeSection === 'personnel') onDeletePersonnelTemplate(selectedId!);
                          else onDeleteManagerTemplate(selectedId!);
                          setSelectedId(null);
                        }}
                        className="px-4 py-2 bg-red-50 text-red-600 text-[10px] font-black rounded-xl hover:bg-red-100 transition-all uppercase tracking-widest flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Sil
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 flex overflow-hidden">
                    {/* Editor Form */}
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Taslak Başlığı</label>
                          <input
                            type="text"
                            value={activeSection === 'personnel' ? selectedPersonnelTemplate?.title : selectedManagerTemplate?.title}
                            onChange={(e) => {
                              if (activeSection === 'personnel') onUpdatePersonnelTemplate({ ...selectedPersonnelTemplate!, title: e.target.value });
                              else onUpdateManagerTemplate({ ...selectedManagerTemplate!, title: e.target.value });
                            }}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                            placeholder="Örn: Maaş Kesintisi Bildirimi"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Durum</label>
                          <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
                            <button
                              onClick={() => {
                                if (activeSection === 'personnel') onUpdatePersonnelTemplate({ ...selectedPersonnelTemplate!, isActive: true });
                                else onUpdateManagerTemplate({ ...selectedManagerTemplate!, isActive: true });
                              }}
                              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${
                                (activeSection === 'personnel' ? selectedPersonnelTemplate?.isActive : selectedManagerTemplate?.isActive)
                                  ? 'bg-white text-emerald-600 shadow-sm'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Aktif
                            </button>
                            <button
                              onClick={() => {
                                if (activeSection === 'personnel') onUpdatePersonnelTemplate({ ...selectedPersonnelTemplate!, isActive: false });
                                else onUpdateManagerTemplate({ ...selectedManagerTemplate!, isActive: false });
                              }}
                              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${
                                !(activeSection === 'personnel' ? selectedPersonnelTemplate?.isActive : selectedManagerTemplate?.isActive)
                                  ? 'bg-white text-red-600 shadow-sm'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Pasif
                            </button>
                          </div>
                        </div>
                      </div>

                      {activeSection === 'personnel' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tetikleyici Senaryo</label>
                          <select
                            value={selectedPersonnelTemplate?.scenario}
                            onChange={(e) => onUpdatePersonnelTemplate({ ...selectedPersonnelTemplate!, scenario: e.target.value as NotificationScenario })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none"
                          >
                            {Object.entries(SCENARIO_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                            <p className="text-[10px] font-bold text-purple-700 leading-relaxed">
                              {SCENARIO_DESCRIPTIONS[selectedPersonnelTemplate!.scenario]}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 flex-1 flex flex-col relative">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mesaj İçeriği</label>
                        <div className="relative flex-1 flex flex-col">
                          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-t-3xl z-10"></div>
                          <textarea
                            value={activeSection === 'personnel' ? selectedPersonnelTemplate?.body : selectedManagerTemplate?.body}
                            onChange={(e) => {
                              if (activeSection === 'personnel') onUpdatePersonnelTemplate({ ...selectedPersonnelTemplate!, body: e.target.value });
                              else onUpdateManagerTemplate({ ...selectedManagerTemplate!, body: e.target.value });
                            }}
                            className="w-full flex-1 px-8 py-8 bg-white border border-slate-200 rounded-3xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-serif leading-relaxed min-h-[300px] shadow-inner resize-none pt-10"
                            placeholder="Mesaj içeriğini buraya yazın..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Variables Panel */}
                    <div className="w-72 border-l border-slate-100 bg-slate-50/30 p-6 overflow-y-auto custom-scrollbar">
                      <div className="flex items-center gap-2 mb-4">
                        <Variable className="w-4 h-4 text-purple-600" />
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Kullanılabilir Değişkenler</h4>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 mb-6 leading-relaxed">
                        Aşağıdaki değişkenleri kopyalayıp mesaj içeriğine yapıştırarak dinamik veriler oluşturabilirsiniz.
                      </p>
                      <div className="space-y-2">
                        {variables.map((v) => (
                          <button
                            key={v}
                            onClick={() => {
                              const textarea = document.querySelector('textarea');
                              if (textarea) {
                                const start = textarea.selectionStart;
                                const end = textarea.selectionEnd;
                                const text = textarea.value;
                                const newText = text.substring(0, start) + v + text.substring(end);
                                if (activeSection === 'personnel') onUpdatePersonnelTemplate({ ...selectedPersonnelTemplate!, body: newText });
                                else onUpdateManagerTemplate({ ...selectedManagerTemplate!, body: newText });
                              }
                            }}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-700 hover:border-purple-300 hover:text-purple-600 transition-all text-left flex items-center justify-between group"
                          >
                            <code className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 group-hover:bg-purple-50 group-hover:border-purple-100">{v}</code>
                            <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <MessageSquare className="w-12 h-12 text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Taslak Seçimi Bekleniyor</h3>
                <p className="text-slate-500 max-w-xs text-center mt-3 text-sm font-medium leading-relaxed">
                  Düzenlemek istediğiniz taslağı soldaki listeden seçin veya yeni bir taslak oluşturun.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-100">
                    <Eye className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Taslak Önizleme</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Değişkenler Örnek Verilerle Doldurulmuştur</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 p-6 md:p-10">
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 min-h-full relative overflow-hidden max-w-3xl mx-auto">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                  <div className="p-8 md:p-12 font-serif text-slate-800 text-lg leading-relaxed whitespace-pre-wrap">
                    {activeSection === 'personnel' 
                      ? (selectedPersonnelTemplate?.body || '').replace(/\[.*?\]/g, (match) => {
                          const samples: Record<string, string> = {
                            '[PERSONEL_ADI]': 'Ahmet Yılmaz',
                            '[AY_YIL]': 'Nisan 2024',
                            '[TOPLAM_EKSIK_SURE]': '12:45',
                            '[GEC_GUN_ADEDI]': '3',
                            '[MEVCUT_IZIN_HAKKI]': '14:00',
                            '[IZINDEN_DUSULEN_SURE]': '12:45',
                            '[KALAN_IZIN_BAKIYESI]': '01:15',
                            '[KESINTI_TUTARI]': '1.250,00 TL'
                          };
                          return samples[match] || match;
                        })
                      : (selectedManagerTemplate?.body || '').replace(/\[.*?\]/g, (match) => {
                          const samples: Record<string, string> = {
                            '[BIRIM_SORUMLUSU_ADI]': 'Mehmet Demir',
                            '[BIRIM_ADI]': 'Yazılım Geliştirme',
                            '[AY_YIL]': 'Nisan 2024',
                            '[TOPLAM_PERSONEL]': '24',
                            '[ISLEM_UYGULANAN_PERSONEL]': '8'
                          };
                          return samples[match] || match;
                        })
                    }
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50/50">
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-8 py-3 bg-slate-900 text-white text-xs font-black rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest shadow-lg shadow-slate-200"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
