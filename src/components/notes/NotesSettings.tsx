import React, { useState, useEffect } from 'react';
import { Settings, Volume2, Save, Trash2, LayoutGrid, List } from 'lucide-react';
import { notesService } from '../../services/notesService';
import { NotesSettings as NotesSettingsType } from '../../types/notes';

interface NotesSettingsProps {
  settings: NotesSettingsType;
  setSettings: React.Dispatch<React.SetStateAction<NotesSettingsType>>;
}

export const NotesSettings: React.FC<NotesSettingsProps> = ({ settings, setSettings }) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    notesService.saveSettings(settings, settings);
    setTimeout(() => setIsSaving(false), 500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-500" />
          Ayarlar
        </h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Volume2 className="w-5 h-5 text-slate-400" />
            Bildirim Sesleri
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">Sesli Bildirimler</p>
                <p className="text-sm text-slate-500">Hatırlatıcı zamanı geldiğinde ses çal</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.isSoundEnabled}
                  onChange={e => setSettings({ ...settings, isSoundEnabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {settings.isSoundEnabled && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Varsayılan Bildirim Sesi</label>
                <select
                  value={settings.defaultSound}
                  onChange={e => setSettings({ ...settings, defaultSound: e.target.value })}
                  className="w-full sm:w-64 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="bell">Zil Sesi</option>
                  <option value="chime">Çan Sesi</option>
                  <option value="pop">Pop Sesi</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-slate-400" />
            Genel Tercihler
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Varsayılan Erteleme Süresi</label>
              <select
                value={settings.defaultSnoozeTime}
                onChange={e => setSettings({ ...settings, defaultSnoozeTime: Number(e.target.value) })}
                className="w-full sm:w-64 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value={5}>5 Dakika</option>
                <option value={10}>10 Dakika</option>
                <option value={15}>15 Dakika</option>
                <option value={30}>30 Dakika</option>
                <option value={60}>1 Saat</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Varsayılan Not Görünümü</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSettings({ ...settings, defaultNoteView: 'card' })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                    settings.defaultNoteView === 'card' 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Kart Görünümü
                </button>
                <button
                  onClick={() => setSettings({ ...settings, defaultNoteView: 'list' })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                    settings.defaultNoteView === 'list' 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <List className="w-4 h-4" />
                  Liste Görünümü
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Trash2 className="w-5 h-5 text-slate-400" />
            Çöp Kutusu
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Otomatik Temizleme Süresi</label>
            <select
              value={settings.autoEmptyTrashDays}
              onChange={e => setSettings({ ...settings, autoEmptyTrashDays: Number(e.target.value) })}
              className="w-full sm:w-64 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value={7}>7 Gün Sonra</option>
              <option value={15}>15 Gün Sonra</option>
              <option value={30}>30 Gün Sonra</option>
              <option value={0}>Asla Otomatik Temizleme</option>
            </select>
            <p className="text-xs text-slate-500 mt-2">
              Çöp kutusuna taşınan öğeler belirtilen süre sonunda kalıcı olarak silinir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
