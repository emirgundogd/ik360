import React, { useState } from 'react';
import { Employee, MonthlyResult } from '../types';
import { X, FileText, Download, Archive, CheckCircle2, Loader2 } from 'lucide-react';
import { formatMinutesToTime } from '../services/calculator';

interface Props {
  employee: Employee;
  result: MonthlyResult;
  onClose: () => void;
  onSaveArchive: (res: MonthlyResult) => Promise<boolean>;
}

export const OfficialDocumentModal: React.FC<Props> = ({ employee, result, onClose, onSaveArchive }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleArchive = async () => {
    setIsSaving(true);
    const success = await onSaveArchive(result);
    if (success) {
      setIsSaved(true);
    }
    setIsSaving(false);
  };

  const today = new Date().toLocaleDateString('tr-TR');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-start p-4 pt-10">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Kesinti Bildirim Formu</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50">
          <div className="bg-white p-12 shadow-xl border border-slate-200 rounded-sm mx-auto max-w-[210mm] min-h-[297mm] font-serif text-slate-800 relative">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none rotate-45">
              <span className="text-9xl font-black">ik360</span>
            </div>

            <div className="text-center mb-12 border-b-2 border-slate-900 pb-6">
              <h1 className="text-2xl font-bold uppercase tracking-widest">Eksik Çalışma ve Ücret Kesinti Bildirimi</h1>
              <p className="text-sm mt-2 font-bold text-slate-500">Tarih: {today}</p>
            </div>

            <div className="space-y-8 text-sm leading-relaxed">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="font-bold uppercase text-[10px] text-slate-400">Personel Bilgileri</p>
                  <p><strong>Ad Soyad:</strong> {employee.name}</p>
                  <p><strong>TC Kimlik No:</strong> {employee.tcNo}</p>
                  <p><strong>Birim/Departman:</strong> {employee.department}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-bold uppercase text-[10px] text-slate-400">Dönem Bilgileri</p>
                  <p><strong>Hesaplama Dönemi:</strong> {result.month}</p>
                  <p><strong>Hesaplama Tarihi:</strong> {new Date(result.calculationDate).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4">
                <h3 className="font-bold uppercase text-xs border-b border-slate-300 pb-2">Kesinti Detayları</h3>
                <div className="grid grid-cols-2 gap-y-3">
                  <p>Toplam Eksik Süre:</p>
                  <p className="font-bold text-right">{formatMinutesToTime(result.currentMissingMinutes)}</p>
                  
                  <p>İzin Bakiyesinden Kesilen:</p>
                  <p className="font-bold text-right text-blue-700">{formatMinutesToTime(result.leaveDeductedMinutes)}</p>
                  
                  <p>Ücret Kesintisine Esas Süre:</p>
                  <p className="font-bold text-right text-red-700">{formatMinutesToTime(result.salaryDeductedMinutes)}</p>
                  
                  <div className="col-span-2 border-t border-slate-300 pt-3 flex justify-between items-center">
                    <p className="font-black uppercase">Toplam Kesinti Tutarı:</p>
                    <p className="text-xl font-black text-slate-900">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(result.salaryDeductedAmountTry)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-8">
                <p>Sayın {employee.name},</p>
                <p>
                  Yukarıda belirtilen dönem içerisinde gerçekleşen eksik çalışma süreleriniz, şirketimiz PDKS kuralları ve iş sözleşmeniz gereği hesaplanmıştır. 
                  Bu sürelerin bir kısmı mevcut izin bakiyenizden kesilmiş, kalan süreler ise ilgili ayın ücret tahakkukundan kesilmek üzere bordronuza yansıtılmıştır.
                </p>
                <p>
                  İşbu bildirim, 4857 sayılı İş Kanunu ve ilgili mevzuat uyarınca tarafınıza tebliğ mahiyetindedir.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-20 pt-20">
                <div className="text-center space-y-12">
                  <p className="font-bold">İşveren / Yetkili İmza</p>
                  <div className="h-20 border-b border-slate-300"></div>
                </div>
                <div className="text-center space-y-12">
                  <p className="font-bold">Personel İmza / Tebellüğ</p>
                  <div className="h-20 border-b border-slate-300"></div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-12 left-12 right-12 text-[8px] text-slate-400 text-center border-t pt-4">
              Bu belge ik360 Dijital İK Yönetim Sistemi tarafından otomatik olarak oluşturulmuştur.
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <button onClick={() => window.print()} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2 shadow-sm">
            <Download className="w-4 h-4" /> PDF Olarak İndir
          </button>
          
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all">Kapat</button>
            <button 
              onClick={handleArchive}
              disabled={isSaving || isSaved}
              className={`px-8 py-2.5 font-black rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 uppercase text-sm ${
                isSaved 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-900/20'
              }`}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
              {isSaving ? 'Arşivleniyor...' : isSaved ? 'Arşivlendi' : 'Evrakı Arşivle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
