import React, { useState, useRef } from 'react';
import { AppConfig, OtherSoftware } from '../types';
import { Plus, Trash2, Edit2, Save, X, Image as ImageIcon, ExternalLink, CheckCircle2, Grid } from 'lucide-react';

interface Props {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
}

export const OtherSoftwaresSettings: React.FC<Props> = ({ config, onConfigChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<OtherSoftware>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const newSoftware: OtherSoftware = {
      id: Date.now().toString(),
      name: 'Yeni Yazılım',
      url: 'https://',
      logo: '',
      isActive: true
    };
    onConfigChange({ ...config, otherSoftwares: [...(config.otherSoftwares || []), newSoftware] });
    setEditingId(newSoftware.id);
    setFormData({ ...newSoftware, isNew: true } as any);
  };

  const handleEdit = (software: OtherSoftware) => {
    setEditingId(software.id);
    setFormData(software);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      const updated = (config.otherSoftwares || []).filter(s => s.id !== deleteConfirm);
      onConfigChange({ ...config, otherSoftwares: updated });
      setDeleteConfirm(null);
      setMessage({ type: 'success', text: 'Yazılım başarıyla silindi.' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.url) {
      setMessage({ type: 'error', text: 'Lütfen yazılım adı ve URL alanlarını doldurun.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const currentSoftwares = config.otherSoftwares || [];
    const isExisting = currentSoftwares.some(s => s.id === formData.id);

    const { isNew, ...softwareData } = formData as any;
    let updated: OtherSoftware[];
    if (isExisting) {
      updated = currentSoftwares.map(s => s.id === formData.id ? softwareData as OtherSoftware : s);
    } else {
      updated = [...currentSoftwares, softwareData as OtherSoftware];
    }

    onConfigChange({ ...config, otherSoftwares: updated });
    setEditingId(null);
    setFormData({});
    setMessage({ type: 'success', text: 'Yazılım başarıyla kaydedildi.' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) { // 1MB limit
      setMessage({ type: 'error', text: 'Logo boyutu 1MB\'dan küçük olmalıdır.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, logo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const softwares = config.otherSoftwares || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Hayrat Yardım Diğer Yazılımları</h3>
          <p className="text-sm font-bold text-slate-500 mt-1">Hızlı erişim menüsünde gösterilecek diğer yazılım bağlantılarını yönetin.</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-brand-600 text-white font-black rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Yeni Ekle
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <p className="text-sm font-bold">{message.text}</p>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-start justify-center p-4 pt-20">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-black text-slate-800 mb-2">Yazılımı Sil</h3>
            <p className="text-slate-600 mb-6">Bu yazılımı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
              >
                İptal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {softwares.map(software => (
          <div key={software.id} className={`bg-white rounded-2xl border ${!software.isActive ? 'border-slate-200 opacity-60' : 'border-slate-200'} shadow-sm overflow-hidden flex flex-col`}>
            {editingId === software.id ? (
              <div className="p-6 space-y-4 flex-1">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Yazılım Adı</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:border-brand-500 outline-none transition-all"
                    placeholder="Örn: İK Portalı"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">URL Bağlantısı</label>
                  <input
                    type="url"
                    value={formData.url || ''}
                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:border-brand-500 outline-none transition-all"
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Logo (PNG/JPG)</label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {formData.logo ? (
                        <img src={formData.logo} alt="Logo Preview" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Logo Yükle
                    </button>
                    {formData.logo && (
                      <button
                        onClick={() => setFormData({ ...formData, logo: '' })}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Logoyu Kaldır"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id={`active-${software.id}`}
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor={`active-${software.id}`} className="text-sm font-bold text-slate-700 cursor-pointer">Aktif (Menüde Göster)</label>
                </div>
                <div className="flex items-center gap-2 pt-4 mt-auto">
                  <button
                    onClick={handleSave}
                    className="flex-1 py-2.5 bg-brand-600 text-white font-black rounded-xl hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Kaydet
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      if ((formData as any).isNew && formData.id) {
                        onConfigChange({ ...config, otherSoftwares: config.otherSoftwares?.filter(s => s.id !== formData.id) });
                      }
                      setFormData({});
                    }}
                    className="px-4 py-2.5 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 flex flex-col h-full relative group">
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(software)}
                    className="p-2 bg-white/80 backdrop-blur text-slate-600 hover:text-brand-600 rounded-lg shadow-sm border border-slate-100 transition-colors"
                    title="Düzenle"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(software.id)}
                    className="p-2 bg-white/80 backdrop-blur text-slate-600 hover:text-red-600 rounded-lg shadow-sm border border-slate-100 transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 p-2">
                    {software.logo ? (
                      <img src={software.logo} alt={software.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <ExternalLink className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800 line-clamp-1">{software.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {software.isActive ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-md uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Aktif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-md uppercase tracking-widest flex items-center gap-1">
                          <X className="w-3 h-3" /> Pasif
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-slate-100">
                  <a 
                    href={software.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-slate-500 hover:text-brand-600 flex items-center gap-1 truncate transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    {software.url}
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {softwares.length === 0 && !editingId && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
              <Grid className="w-8 h-8 text-slate-300" />
            </div>
            <h4 className="text-lg font-black text-slate-800">Henüz Yazılım Eklenmedi</h4>
            <p className="text-sm font-medium text-slate-500 mt-1 max-w-sm">
              Hayrat Yardım'ın diğer yazılımlarına hızlı erişim sağlamak için yeni bağlantılar ekleyebilirsiniz.
            </p>
            <button
              onClick={handleAdd}
              className="mt-6 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-black rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> İlk Yazılımı Ekle
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
