import React, { useState } from 'react';
import { ExcelRow, excelService } from '../services/excelService';
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react';

interface ImportWizardProps {
  onApply: (data: ExcelRow[], errors: string[]) => void;
  onCancel: () => void;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({ onApply, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ExcelRow[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setError(null);
    setImportErrors([]);

    try {
      const { data, errors } = await excelService.parsePdksExcel(selectedFile);
      setPreviewData(data);
      setImportErrors(errors);
      if (data.length === 0 && errors.length > 0) {
        setError('Dosya işlenemedi. Lütfen formatı kontrol edin.');
      }
    } catch (err: any) {
      setError('Dosya okunurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-start p-4 pt-10">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">PDKS Excel İçe Aktar</h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => excelService.downloadPdksTemplate()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm mr-4"
            >
              <Download className="w-4 h-4" /> Taslak İndir
            </button>
            <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="p-8">
          {!file ? (
            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-brand-500 hover:bg-brand-50/30 transition-all group cursor-pointer relative">
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                <Upload className="w-8 h-8" />
              </div>
              <p className="text-lg font-black text-slate-700 mb-1">PDKS Raporunu buraya bırakın veya seçin</p>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">XLSX, XLS veya CSV (Maks. 10MB)</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">{file.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button onClick={() => { setFile(null); setPreviewData([]); setImportErrors([]); }} className="text-xs font-black text-red-500 hover:underline uppercase">Değiştir</button>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Veriler İşleniyor...</p>
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm font-bold">{error}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <p className="text-sm font-bold uppercase tracking-tight">Önizleme ({previewData.length} Satır)</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-[10px]">
                        <thead className="bg-slate-50 sticky top-0 font-black uppercase text-slate-400 tracking-tighter">
                          <tr>
                            <th className="px-4 py-2">TCKN</th>
                            <th className="px-4 py-2">AD SOYAD</th>
                            <th className="px-4 py-2">Eksik Süre</th>
                            <th className="px-4 py-2">Geç Gün</th>
                            <th className="px-4 py-2">Denkleştirme İzni</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {previewData.map((row, i) => (
                            <tr key={i} className={row.error ? 'bg-red-50/50' : ''}>
                              <td className="px-4 py-2 font-mono">{row.tckn}</td>
                              <td className="px-4 py-2 font-bold">{row.adSoyad}</td>
                              <td className="px-4 py-2">{row.missingTime}</td>
                              <td className="px-4 py-2">{row.lateDays}</td>
                              <td className="px-4 py-2">{row.currentLeaveBalance}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertCircle className="w-5 h-5" />
                      <p className="text-sm font-bold uppercase tracking-tight">Hatalar ve Uyarılar ({importErrors.length})</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto border border-amber-100 rounded-xl bg-amber-50/30 p-4">
                      {importErrors.length === 0 ? (
                        <p className="text-xs text-slate-400 font-bold uppercase text-center py-8 italic">Hata bulunamadı.</p>
                      ) : (
                        <ul className="space-y-2">
                          {importErrors.map((err, i) => (
                            <li key={i} className="text-[10px] text-red-600 font-bold bg-white p-2 rounded-lg border border-red-100 shadow-sm">
                              {err}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onCancel} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all">İptal</button>
          <button 
            onClick={() => onApply(previewData, importErrors)} 
            disabled={!file || loading || !!error || previewData.length === 0}
            className="px-8 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl shadow-lg shadow-brand-900/20 transition-all active:scale-95 uppercase text-sm"
          >
            Verileri Uygula
          </button>
        </div>
      </div>
    </div>
  );
};
