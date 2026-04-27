import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Employee } from '../../types';
import { LeaveRecord } from './types';
import { parseLeaveText, calculateSeniority } from './utils';

interface Props {
  onImport: (data: LeaveRecord[]) => void;
  employees: Employee[];
}

const EXPECTED_HEADERS = [
  'Ad Soyad',
  'TC',
  'Yıllık İzin',
  'Kullanılan Yıllık İzin',
  'Kalan Yıllık İzin',
  'Denkleştirme İzni',
  'Kullanılan Denkleştirme İzni',
  'Kalan Denkleştirme İzni'
];

export const LeaveImport: React.FC<Props> = ({ onImport, employees }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<LeaveRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, matched: 0, errors: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([EXPECTED_HEADERS]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'İzin Verileri');
    XLSX.writeFile(wb, 'izin_sablonu.xlsx');
  };

  const processExcel = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (jsonData.length < 2) {
        throw new Error('Dosya boş veya sadece başlıklar var.');
      }

      const headers = jsonData[0].map(h => String(h).trim().toLocaleLowerCase('tr-TR'));
      
      const findHeaderIndex = (possibleNames: string[]) => {
        return headers.findIndex(h => {
          const normalizedHeader = h.replace(/[\s.]/g, '');
          return possibleNames.some(p => {
            const normalizedP = p.toLocaleLowerCase('tr-TR').replace(/[\s.]/g, '');
            return normalizedHeader.includes(normalizedP);
          });
        });
      };

      const headerMap: Record<string, number> = {
        'Ad Soyad': findHeaderIndex(['ad soyad', 'isim', 'personel']),
        'TC': findHeaderIndex(['tc', 'tckn', 'kimlik']),
        'Yıllık İzin': findHeaderIndex(['yıllık izin', 'hak edilen yıllık']),
        'Kullanılan Yıllık İzin': findHeaderIndex(['kullanılan yıllık']),
        'Kalan Yıllık İzin': findHeaderIndex(['kalan yıllık']),
        'Denkleştirme İzni': findHeaderIndex(['denkleştirme izni', 'hak edilen denkleştirme']),
        'Kullanılan Denkleştirme İzni': findHeaderIndex(['kullanılan denkleştirme']),
        'Kalan Denkleştirme İzni': findHeaderIndex(['kalan denkleştirme']),
      };

      const missingHeaders = Object.entries(headerMap)
        .filter(([_, index]) => index === -1)
        .map(([key]) => key);

      if (missingHeaders.length > 0) {
        throw new Error(`Eksik sütunlar: ${missingHeaders.join(', ')}. Lütfen şablonu kullanın.`);
      }

      const records: LeaveRecord[] = [];
      let matchedCount = 0;
      let errorCount = 0;

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0 || (!row[headerMap['TC']] && !row[headerMap['Ad Soyad']])) continue; // Skip empty rows

        const tc = String(row[headerMap['TC']] || '').replace(/\s/g, '');
        const name = String(row[headerMap['Ad Soyad']] || '').trim().replace(/\s+/g, ' ');

        // Match with personnel
        const matchedEmployee = employees.find(e => {
          const empTc = String(e.core?.tcNo || e.tcNo || '').replace(/\s/g, '');
          const empName = String(e.core?.name || e.name || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR');
          const searchName = name.toLocaleLowerCase('tr-TR');
          
          if (tc && empTc && tc === empTc) return true;
          if (searchName && empName && searchName === empName) return true;
          return false;
        });

        if (matchedEmployee) matchedCount++;
        else errorCount++;

        const dept = matchedEmployee?.work?.department || matchedEmployee?.department || '';
        const unitManager = employees.find(e => 
          e.work?.isUnitManager && 
          e.work?.managedDepartments?.includes(dept)
        );

        const record: LeaveRecord = {
          id: `leave_${Date.now()}_${i}`,
          employeeId: matchedEmployee?.id,
          tc,
          name,
          
          annualLeave: parseLeaveText(row[headerMap['Yıllık İzin']]),
          usedAnnualLeave: parseLeaveText(row[headerMap['Kullanılan Yıllık İzin']]),
          remainingAnnualLeave: parseLeaveText(row[headerMap['Kalan Yıllık İzin']]),
          
          compensatoryLeave: parseLeaveText(row[headerMap['Denkleştirme İzni']]),
          usedCompensatoryLeave: parseLeaveText(row[headerMap['Kullanılan Denkleştirme İzni']]),
          remainingCompensatoryLeave: parseLeaveText(row[headerMap['Kalan Denkleştirme İzni']]),

          // Enriched Data
          department: dept,
          title: matchedEmployee?.work?.title || matchedEmployee?.title,
          hireDate: matchedEmployee?.work?.hireDate || matchedEmployee?.hireDate,
          seniority: calculateSeniority(matchedEmployee?.work?.hireDate || matchedEmployee?.hireDate),
          netSalary: matchedEmployee?.wage?.netSalary || matchedEmployee?.salary,
          locationType: matchedEmployee?.work?.workLocationType === 'HQ' ? 'Genel Merkez' : matchedEmployee?.work?.workLocationType === 'FIELD' ? 'Saha' : 'Belirtilmemiş',
          manager: unitManager?.core?.name || unitManager?.name,
          isActive: matchedEmployee?.system?.isActive ?? matchedEmployee?.isActive ?? true,
        };

        // Calculate estimated cost
        if (record.netSalary && record.netSalary > 0) {
          const dailyCost = record.netSalary / 30;
          record.estimatedAnnualLeaveCost = dailyCost * record.remainingAnnualLeave.totalDays;
          record.estimatedCompensatoryLeaveCost = dailyCost * record.remainingCompensatoryLeave.totalDays;
          record.totalEstimatedCost = record.estimatedAnnualLeaveCost + record.estimatedCompensatoryLeaveCost;
        } else {
          record.estimatedAnnualLeaveCost = 0;
          record.estimatedCompensatoryLeaveCost = 0;
          record.totalEstimatedCost = 0;
        }

        records.push(record);
      }

      setPreviewData(records);
      setStats({
        total: records.length,
        matched: matchedCount,
        errors: errorCount
      });

    } catch (err: any) {
      setError(err.message || 'Dosya okunurken bir hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processExcel(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      processExcel(droppedFile);
    } else {
      setError('Lütfen sadece Excel (.xlsx, .xls) dosyası yükleyin.');
    }
  };

  const handleConfirm = () => {
    if (previewData.length > 0) {
      onImport(previewData);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <Upload className="w-8 h-8 text-brand-500" /> Excel Yükleme
          </h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">İzin verilerini sisteme aktarın</p>
        </div>
        <button 
          onClick={handleDownloadTemplate}
          className="px-6 py-3 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Örnek Şablon İndir
        </button>
      </div>

      {!previewData.length && !isProcessing && (
        <div 
          className={`bg-white p-12 rounded-[3rem] border-2 border-dashed transition-all ${isDragging ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6">
              <FileSpreadsheet className="w-10 h-10 text-brand-500" />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Excel Dosyasını Sürükleyin</h3>
            <p className="text-slate-500 font-medium mb-8">veya bilgisayarınızdan seçin (.xlsx, .xls)</p>
            
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-4 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 transition-all uppercase text-xs tracking-widest shadow-lg shadow-brand-900/20"
            >
              Dosya Seç
            </button>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center">
          <RefreshCw className="w-12 h-12 text-brand-500 animate-spin mb-4" />
          <p className="text-lg font-bold text-slate-700">Excel işleniyor...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div>
            <h4 className="text-red-800 font-bold mb-1">Yükleme Hatası</h4>
            <p className="text-red-600 text-sm">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-200"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      )}

      {previewData.length > 0 && !isProcessing && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Okunan Kayıt</p>
                <p className="text-2xl font-black text-slate-800">{stats.total}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eşleşen Personel</p>
                <p className="text-2xl font-black text-slate-800">{stats.matched}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eşleşmeyen</p>
                <p className="text-2xl font-black text-slate-800">{stats.errors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Önizleme (İlk 5 Kayıt)</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => setPreviewData([])}
                  className="px-6 py-3 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest"
                >
                  İptal
                </button>
                <button 
                  onClick={handleConfirm}
                  className="px-8 py-3 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all uppercase text-xs tracking-widest shadow-lg shadow-emerald-900/20 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Verileri Aktar
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Durum</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Ad Soyad</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">TC</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Kalan Yıllık</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Kalan Denkleştirme</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {previewData.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        {row.employeeId ? (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold uppercase">Eşleşti</span>
                        ) : (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold uppercase">Eşleşmedi</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">{row.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{row.tc}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{row.remainingAnnualLeave.originalText}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{row.remainingCompensatoryLeave.originalText}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
