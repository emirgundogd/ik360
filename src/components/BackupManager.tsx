
import React, { useRef, useState } from 'react';
import { Cloud, Save, Download, Upload, HardDrive, Check, Server, AlertTriangle } from 'lucide-react';
import { BackupConfig, AppState } from '../types';
import { exportData, importData } from '../services/storage';

interface BackupManagerProps {
  config: BackupConfig;
  lastBackupTime?: string;
  currentAppState: AppState; // Canlı uygulama durumu
  onConfigChange: (cfg: BackupConfig) => void;
  onForceBackup: () => void;
  onRestore: (data: AppState) => void; // Hot-restore function
}

export const BackupManager: React.FC<BackupManagerProps> = ({ 
  config, 
  lastBackupTime, 
  currentAppState,
  onConfigChange, 
  onForceBackup, 
  onRestore 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null);
  const [confirmImport, setConfirmImport] = useState<File | null>(null);

  const handleExport = () => {
    onForceBackup(); // Trigger app save for good measure
    // Doğrudan prop olarak gelen güncel state'i indir
    exportData(currentAppState);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';

    setConfirmImport(file);
  };

  const executeImport = async () => {
    if (!confirmImport) return;
    try {
      const data = await importData(confirmImport);
      onRestore(data);
      setMessage({ type: 'success', text: 'Yedek başarıyla yüklendi.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: "Veri yükleme hatası: " + err });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setConfirmImport(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
      {confirmImport && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Veri Yükleme Onayı
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              DİKKAT: Dışarıdan veri yüklemek mevcut tüm verilerinizi ve ayarlarınızı silecektir. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmImport(null)}
                className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold transition-colors"
              >
                İptal
              </button>
              <button 
                onClick={executeImport}
                className="px-4 py-2 bg-brand-600 text-white hover:bg-brand-700 rounded-xl font-bold transition-colors"
              >
                Yükle
              </button>
            </div>
          </div>
        </div>
      )}
      {message && (
        <div className={`p-4 text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {message.text}
        </div>
      )}
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <div>
           <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <Cloud className="w-5 h-5 text-brand-600" />
             Veri ve Yedekleme Merkezi
           </h2>
           <p className="text-xs text-slate-500">Bulut tabanlı veri yönetimi (Client-Side Cloud)</p>
        </div>
        <div className="text-right">
           <div className="text-xs font-bold text-slate-500 uppercase">Son Kayıt</div>
           <div className="text-sm font-mono font-medium text-slate-800">
             {lastBackupTime ? new Date(lastBackupTime).toLocaleString('tr-TR') : 'Otomatik'}
           </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Auto Save Status */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b pb-2">Sistem Durumu</h3>
          
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <h4 className="text-sm font-bold text-green-900 mb-2 flex items-center gap-2">
              <Check className="w-4 h-4" /> Bulut Hazır
            </h4>
            <p className="text-xs text-green-800 leading-relaxed">
              Uygulama tarayıcı tabanlı (Client-Side Cloud) modunda çalışmaktadır. Verileriniz anlık olarak korunmaktadır. Farklı bir bilgisayara geçiş yapmak için "Veri Paketini İndir" seçeneğini kullanınız.
            </p>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
            <label className="text-sm font-medium text-slate-700">Her İşlemde Otomatik Kaydet</label>
            <input 
              type="checkbox" 
              checked={true}
              disabled
              className="w-5 h-5 accent-brand-600 opacity-50"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-6">
           <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b pb-2">Veri Transferi</h3>
           
           <button 
             onClick={handleExport}
             className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-3 shadow-md group active:scale-95"
           >
             <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition-colors">
               <Download className="w-5 h-5" />
             </div>
             <div className="text-left">
               <span className="block text-sm">Veri Paketini İndir (Yedek)</span>
               <span className="block text-[10px] opacity-80 font-normal">Tüm sistemi tek dosya olarak kaydeder</span>
             </div>
           </button>

           <div className="relative">
             <input 
               type="file" 
               ref={fileInputRef}
               onChange={handleFileChange}
               className="hidden"
               accept=".json"
             />
             <button 
               onClick={handleImportClick}
               className="w-full py-4 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-3 group active:scale-95"
             >
               <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-slate-200 transition-colors">
                 <Upload className="w-5 h-5 text-slate-600" />
               </div>
               <div className="text-left">
                 <span className="block text-sm">Veri Paketi Yükle (Restore)</span>
                 <span className="block text-[10px] text-slate-400 font-normal">Başka bir bilgisayardan alınan yedeği yükler</span>
               </div>
             </button>
           </div>
        </div>

      </div>
    </div>
  );
};
