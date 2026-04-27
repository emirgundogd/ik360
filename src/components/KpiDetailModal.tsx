
import React, { useState, useMemo } from 'react';
import { X, Search, ArrowUpDown, ArrowUp, ArrowDown, Users, Wallet, Clock, FileSpreadsheet } from 'lucide-react';
import ExcelJS from 'exceljs';

export interface KpiModalRow {
  id: string;
  name: string;
  tckn: string;
  department: string;
  title: string;
  valuePrimary: number | string; 
  valueSecondary?: string;
}

interface KpiDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'salary' | 'leave';
  monthName: string;
  rows: KpiModalRow[];
  summary: {
    count: number;
    total: string;
  };
}

export const KpiDetailModal: React.FC<KpiDetailModalProps> = ({
  isOpen,
  onClose,
  title,
  type,
  monthName,
  rows = [],
  summary
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof KpiModalRow>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null);

  const maskTckn = (tckn: string | undefined) => {
    if (!tckn || tckn.length < 11) return tckn || '-';
    return `${tckn.substring(0, 3)}******${tckn.substring(9)}`;
  };

  const filteredAndSortedRows = useMemo(() => {
    const term = searchTerm.toLocaleLowerCase('tr-TR').trim();
    
    // Safety check for rows
    const safeRows = Array.isArray(rows) ? rows : [];

    let result = safeRows.filter(row => {
      const name = (row.name || '').toLocaleLowerCase('tr-TR');
      const dept = (row.department || '').toLocaleLowerCase('tr-TR');
      const tckn = (row.tckn || '');
      return name.includes(term) || dept.includes(term) || tckn.includes(term);
    });

    result.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDir === 'asc' 
          ? valA.localeCompare(valB, 'tr-TR') 
          : valB.localeCompare(valA, 'tr-TR');
      }
      
      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      return sortDir === 'asc' ? numA - numB : numB - numA;
    });

    return result;
  }, [rows, searchTerm, sortKey, sortDir]);

  const handleSort = (key: keyof KpiModalRow) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Detay Rapor');

      worksheet.columns = [
        { header: 'Ad Soyad', key: 'name', width: 25 },
        { header: 'TCKN', key: 'tckn', width: 15 },
        { header: 'Departman', key: 'department', width: 20 },
        { header: 'Ünvan', key: 'title', width: 20 },
        { header: type === 'salary' ? 'Tutar' : 'Süre', key: 'val', width: 15 }
      ];

      filteredAndSortedRows.forEach(row => {
        worksheet.addRow({
          name: row.name,
          tckn: row.tckn,
          department: row.department,
          title: row.title,
          val: row.valuePrimary
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}_${monthName}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Excel Export Error:", e);
      setMessage({ type: 'error', text: 'Excel oluşturulurken hata oluştu.' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-start justify-center p-4 sm:p-6 pt-10" 
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        {message && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-bold shadow-xl ${message.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
            {message.text}
          </div>
        )}
        {/* Header Section */}
        <div className="bg-slate-800 text-white p-6 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-3">
              {type === 'salary' ? <Wallet className="w-6 h-6 text-orange-400" /> : <Clock className="w-6 h-6 text-blue-400" />}
              {title} – {monthName}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-slate-300 text-xs font-bold uppercase tracking-widest">
               <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {summary.count} Kişi</span>
               <span className="flex items-center gap-1">Toplam: <b className="text-white">{summary.total}</b></span>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-full transition-all"
            aria-label="Kapat"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Export Toolbar */}
        <div className="p-4 border-b bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="relative w-full sm:w-96">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Personel adı, TCKN veya Departman..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none shadow-sm"
            />
          </div>
          <button 
            type="button"
            onClick={exportToExcel}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel'e Aktar
          </button>
        </div>

        {/* Table Area (Scrollable) */}
        <div className="flex-1 overflow-auto bg-white min-h-[200px]">
          <table className="w-full text-sm text-left border-collapse min-w-[600px]">
            <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-8 py-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-2">Ad Soyad {sortKey === 'name' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-600"/> : <ArrowDown className="w-3 h-3 text-brand-600"/>) : <ArrowUpDown className="w-3 h-3 opacity-30"/>}</div>
                </th>
                <th className="px-6 py-4">TCKN</th>
                <th className="px-6 py-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('department')}>
                  <div className="flex items-center gap-2">Departman {sortKey === 'department' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-600"/> : <ArrowDown className="w-3 h-3 text-brand-600"/>) : <ArrowUpDown className="w-3 h-3 opacity-30"/>}</div>
                </th>
                <th className="px-8 py-4 text-right cursor-pointer hover:text-slate-900" onClick={() => handleSort('valuePrimary')}>
                  <div className="flex items-center justify-end gap-2">
                    {type === 'salary' ? 'Kesinti Tutarı' : 'Kesinti Süresi'}
                    {sortKey === 'valuePrimary' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-600"/> : <ArrowDown className="w-3 h-3 text-brand-600"/>) : <ArrowUpDown className="w-3 h-3 opacity-30"/>}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedRows.map(row => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors truncate max-w-[200px]" title={row.name}>{row.name}</div>
                    <div className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">{row.title}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{maskTckn(row.tckn)}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-700 truncate inline-block max-w-[150px]" title={row.department}>{row.department}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    {type === 'salary' ? (
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-red-700 text-lg">
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(row.valuePrimary))}
                        </span>
                        {row.valueSecondary && <span className="text-[10px] text-slate-500 font-bold uppercase">{row.valueSecondary}</span>}
                      </div>
                    ) : (
                      <span className="font-mono font-bold text-blue-800 text-xl">{row.valuePrimary}</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredAndSortedRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-slate-400 italic font-medium">
                    Bu kriterlere uygun kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Buttons */}
        <div className="p-6 bg-slate-50 border-t flex justify-end shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
