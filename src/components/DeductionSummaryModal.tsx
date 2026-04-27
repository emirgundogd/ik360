import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2, Download, Calendar, CreditCard, Clock, Loader2 } from 'lucide-react';
import { Employee, MonthlyResult } from '../types';
import { formatMinutesToTime, formatMonthTurkish } from '../services/calculator';
import { toPng } from 'html-to-image';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  results: { person: Employee; result: MonthlyResult }[];
  currentMonth: string;
  companyName: string;
  reportType: 'salary' | 'leave';
}

export const DeductionSummaryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  results,
  currentMonth,
  companyName,
  reportType
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSaveImage = async () => {
    if (!reportRef.current) return;
    try {
      setIsSaving(true);
      
      // html-to-image handles modern CSS like oklch much better than html2canvas
      const dataUrl = await toPng(reportRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const link = document.createElement('a');
      link.download = `${companyName}_${currentMonth}_${reportType === 'salary' ? 'Maas' : 'Izin'}_Kesinti_Ozeti.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Resim kaydedilirken hata oluştu:', error);
      alert('Resim kaydedilirken bir hata oluştu. Lütfen tarayıcınızın güncel olduğundan emin olun.');
    } finally {
      setIsSaving(false);
    }
  };

  const isSalary = reportType === 'salary';
  const filteredResults = results.filter(item => 
    isSalary ? (item.result.salaryDeductedAmountTry > 0) : (item.result.leaveDeductedMinutes > 0)
  );

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-start justify-center p-4 md:p-8 overflow-y-auto bg-slate-900/80 backdrop-blur-md pt-24 md:pt-32">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 cursor-pointer"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col mb-12"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${isSalary ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                {isSalary ? <CreditCard className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                  {isSalary ? 'Maaş Kesinti Özeti' : 'İzin Kesinti Özeti'}
                </h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{formatMonthTurkish(currentMonth)} Dönemi Raporu</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={onClose}
                className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8 bg-slate-50/30">
            <div ref={reportRef} className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden p-8" id="shareable-report" style={{ backgroundColor: '#ffffff' }}>
              {/* Report Branding */}
              <div className="flex justify-between items-start mb-10 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-4">
                  <div className="flex items-center px-3 py-1.5 bg-slate-900 rounded-xl" style={{ backgroundColor: '#0f172a' }}>
                    <span className="text-white font-black text-xl tracking-tighter" style={{ color: '#ffffff' }}>ik360</span>
                  </div>
                  <div className="w-px h-8 bg-slate-200 mx-2" style={{ backgroundColor: '#e2e8f0' }}></div>
                  <div className="flex flex-col justify-center">
                    <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none" style={{ color: '#0f172a' }}>{companyName}</h1>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-2.5 px-5 py-2 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-md" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                    <Calendar className="w-4 h-4" />
                    {formatMonthTurkish(currentMonth)}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 mr-2" style={{ color: '#94a3b8' }}>Rapor Tarihi: {new Date().toLocaleDateString('tr-TR')}</p>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Etkilenen Personel</p>
                  <p className="text-2xl font-black text-slate-900" style={{ color: '#0f172a' }}>{filteredResults.length} Kişi</p>
                </div>
                {isSalary ? (
                  <div className="p-6 bg-red-50 rounded-3xl border border-red-100" style={{ backgroundColor: '#fef2f2', borderColor: '#fee2e2' }}>
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1" style={{ color: '#f87171' }}>Toplam Maaş Kesintisi</p>
                    <p className="text-2xl font-black text-red-600" style={{ color: '#dc2626' }}>
                      ₺{filteredResults.reduce((acc, curr) => acc + (curr.result.salaryDeductedAmountTry || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                ) : (
                  <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100" style={{ backgroundColor: '#fff7ed', borderColor: '#ffedd5' }}>
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1" style={{ color: '#fb923c' }}>Toplam İzin Kesintisi</p>
                    <p className="text-2xl font-black text-orange-600" style={{ color: '#ea580c' }}>
                      {formatMinutesToTime(filteredResults.reduce((acc, curr) => acc + (curr.result.leaveDeductedMinutes || 0), 0))}
                    </p>
                  </div>
                )}
              </div>

              {/* Main Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                      <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">Personel Bilgileri</th>
                      <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">Birim</th>
                      <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-right">
                        {isSalary ? 'Kesinti Tutarı' : 'Kesinti Süresi'}
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">Açıklama / Sebep</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100" style={{ borderColor: '#f1f5f9' }}>
                    {filteredResults.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900" style={{ color: '#0f172a' }}>{item.person.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-slate-700" style={{ color: '#334155' }}>{item.person.department}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isSalary ? (
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-black text-red-600" style={{ color: '#dc2626' }}>
                                ₺{item.result.salaryDeductedAmountTry.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                              </span>
                              <span className="text-[9px] font-bold text-red-400 uppercase" style={{ color: '#f87171' }}>{formatMinutesToTime(item.result.salaryDeductedMinutes)}</span>
                            </div>
                          ) : (
                            <span className="text-sm font-black text-orange-600" style={{ color: '#ea580c' }}>
                              {formatMinutesToTime(item.result.leaveDeductedMinutes)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[10px] font-medium text-slate-500 leading-tight max-w-[250px]" style={{ color: '#64748b' }}>
                            {item.result.explanation?.[0] || 'Hesaplama kuralı uygulandı.'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Report Footer */}
              <div className="mt-10 flex justify-between items-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                  Bu rapor ik360 sistemi tarafından otomatik olarak oluşturulmuştur.
                </div>
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-slate-300" style={{ color: '#cbd5e1' }} />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest" style={{ color: '#cbd5e1' }}>ik360 Raporlama Servisi</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">
              <span className="text-red-500">*</span> Görüntüyü kaydet butonu ile raporu PNG formatında indirebilirsiniz.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
              >
                Kapat
              </button>
              <button 
                onClick={handleSaveImage}
                disabled={isSaving}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isSaving ? 'Kaydediliyor...' : 'Görüntüyü Kaydet'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

