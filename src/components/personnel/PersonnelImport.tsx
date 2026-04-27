import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Loader2,
  ArrowLeft,
  AlertTriangle,
  History,
  RotateCcw
} from 'lucide-react';
import { excelService, ExcelRow } from '../../services/excelService';
import { ImportRecord } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onApply: (data: ExcelRow[], errors: string[]) => void;
  onCancel: () => void;
  importHistory: ImportRecord[];
  onUndoImport: (id: string) => void;
}

export const PersonnelImport: React.FC<Props> = ({ onApply, onCancel, importHistory, onUndoImport }) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'history' | 'success'>('upload');
  const [previewData, setPreviewData] = useState<ExcelRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setLoading(true);
    try {
      const result = await excelService.parseExcel(selectedFile);
      setPreviewData(result.data);
      setErrors(result.errors);
      setWarnings(result.warnings);
      setStep('preview');
    } catch (err) {
      setMessage({ type: 'error', text: 'Excel dosyası okunurken bir hata oluştu.' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
      setLoading(true);
      try {
        const result = await excelService.parseExcel(droppedFile);
        setPreviewData(result.data);
        setErrors(result.errors);
        setWarnings(result.warnings);
        setStep('preview');
      } catch (err) {
        setMessage({ type: 'error', text: 'Excel dosyası okunurken bir hata oluştu.' });
        setTimeout(() => setMessage(null), 3000);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownloadTemplate = () => {
    excelService.downloadTemplate();
  };

  const handleApply = () => {
    if (previewData.length === 0) return;
    
    // Sadece geçerli satırları al (hata içermeyenler)
    const validRows = previewData.filter(row => !row.errors || row.errors.length === 0);
    
    // Tüm hataları topla
    const allErrors = previewData.flatMap(row => row.errors || []);
    
    setLoading(true);
    // Simulate a small delay for better UX
    setTimeout(() => {
      onApply(validRows, allErrors);
      setStep('success');
      setLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {message && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-bold shadow-xl ${message.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
          {message.text}
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <button 
            onClick={onCancel}
            className="p-3 bg-slate-100 text-slate-500 hover:text-slate-900 rounded-2xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Toplu Personel Yükleme</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Excel üzerinden toplu veri aktarımı</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setStep('history')}
            className={`px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-2 ${step === 'history' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            <History className="w-4 h-4" /> Geçmiş
          </button>
          <button 
            onClick={handleDownloadTemplate}
            className="px-6 py-3 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all uppercase text-xs tracking-widest shadow-lg shadow-emerald-900/20 flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Şablon İndir
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-12 rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-8"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="w-24 h-24 bg-brand-50 text-brand-500 rounded-[2.5rem] flex items-center justify-center animate-bounce">
              <Upload className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">Excel Dosyasını Sürükleyin</h3>
              <p className="text-slate-400 font-bold max-w-md mx-auto leading-relaxed">
                Personel listesini içeren .xlsx dosyasını buraya bırakın veya bilgisayarınızdan seçin.
              </p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx"
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="px-10 py-5 bg-slate-900 text-white font-black rounded-[2rem] hover:bg-slate-800 transition-all uppercase text-sm tracking-[0.2em] shadow-2xl flex items-center gap-3"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
              Dosya Seçin
            </button>
          </motion.div>
        )}

        {step === 'preview' && (
          <motion.div 
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Validation Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest">Başarılı Satırlar</h4>
                </div>
                <p className="text-3xl font-black text-emerald-600">{previewData.filter(r => !r.error).length}</p>
              </div>
              <div className="bg-red-50 p-6 rounded-[2.5rem] border border-red-100">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h4 className="text-xs font-black text-red-900 uppercase tracking-widest">Hatalı Satırlar</h4>
                </div>
                <p className="text-3xl font-black text-red-600">{previewData.filter(r => r.error).length}</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest">Uyarılar</h4>
                </div>
                <p className="text-3xl font-black text-amber-600">{warnings.length}</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-[2.5rem] flex flex-col justify-center">
                <button 
                  onClick={handleApply}
                  disabled={previewData.length === 0}
                  className="w-full py-4 bg-brand-500 text-white font-black rounded-2xl hover:bg-brand-600 transition-all uppercase text-xs tracking-widest shadow-lg shadow-brand-900/20 flex items-center justify-center gap-2"
                >
                  İçe Aktarmayı Başlat <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview Table */}
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Veri Ön İzleme (İlk 10 Satır)</h3>
                <button onClick={() => setStep('upload')} className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Dosyayı Değiştir</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Durum</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">TCKN</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ad Soyad</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Doğum Tarihi</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">İletişim</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Departman</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Çalışma Şekli</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sigorta Türü</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">PDKS</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Maaş</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Çıkış Tarihi</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Çıkış Kodu</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hata / Uyarı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {previewData.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className={row.error ? 'bg-red-50/30' : warnings.some(w => w.includes(`Satır ${row.rowIndex}:`)) ? 'bg-amber-50/30' : ''}>
                        <td className="px-6 py-4">
                          {row.error ? <AlertCircle className="w-4 h-4 text-red-500" /> : warnings.some(w => w.includes(`Satır ${row.rowIndex}:`)) ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-700">{row.tckn}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-700">{row.adSoyad}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{row.birthDate ? new Date(row.birthDate).toLocaleDateString('tr-TR') : '-'}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">
                          {row.phone && <div>{row.phone}</div>}
                          {row.email && <div className="text-[10px] text-slate-400">{row.email}</div>}
                          {!row.phone && !row.email && '-'}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{(row as any).department || '-'}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{row.employmentType || 'Tam Zamanlı'}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{row.retirementStatus || 'Normal'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${row.showInPdks !== false ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-400'}`}>
                            {row.showInPdks !== false ? 'Evet' : 'Hayır'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-black text-slate-800">{row.netSalary} ₺</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{row.exitDate ? new Date(row.exitDate).toLocaleDateString('tr-TR') : '-'}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{row.exitCode || '-'}</td>
                        <td className="px-6 py-4 text-[10px] font-bold uppercase">
                          {row.error && <div className="text-red-500">{row.error}</div>}
                          {warnings.filter(w => w.includes(`Satır ${row.rowIndex}:`)).map((w, i) => (
                            <div key={i} className="text-amber-500">{w.replace(`Satır ${row.rowIndex}: `, '')}</div>
                          ))}
                          {!row.error && !warnings.some(w => w.includes(`Satır ${row.rowIndex}:`)) && <span className="text-slate-400">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Yükleme Geçmişi</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {importHistory.length > 0 ? importHistory.map(record => (
                <div key={record.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${record.isDeleted ? 'bg-slate-100 text-slate-400' : 'bg-brand-50 text-brand-600'}`}>
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className={`text-sm font-black ${record.isDeleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          {record.month} Dönemi Yüklemesi
                        </p>
                        {record.isDeleted && <span className="px-2 py-0.5 bg-slate-200 text-slate-500 text-[8px] font-black rounded uppercase">Geri Alındı</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        {new Date(record.importedAt).toLocaleString('tr-TR')} • {record.importedBy} • {Object.keys(record.data).length} Kayıt
                      </p>
                    </div>
                  </div>
                  {!record.isDeleted && (
                    <button 
                      onClick={() => onUndoImport(record.id)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 opacity-0 group-hover:opacity-100"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Geri Al
                    </button>
                  )}
                </div>
              )) : (
                <div className="py-20 text-center text-slate-300">
                  <History className="w-12 h-12 opacity-20 mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Henüz bir yükleme kaydı bulunmuyor</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
        {step === 'success' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-8"
          >
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">İçe Aktarma Başarılı</h3>
              <p className="text-slate-500 font-bold max-w-md mx-auto leading-relaxed">
                Personel verileri başarıyla sisteme kaydedildi.
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setStep('upload')}
                className="px-8 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest"
              >
                Yeni Dosya Yükle
              </button>
              <button 
                onClick={onCancel}
                className="px-8 py-4 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 transition-all uppercase text-xs tracking-widest shadow-lg shadow-brand-900/20"
              >
                Listeye Dön
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
