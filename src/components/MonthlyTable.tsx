
import React, { useState, useMemo } from 'react';
import { MonthlyResult, MonthlyInput, Employee, MonthStatus, AppConfig, UnitConfig } from '../types';
import { ChevronDown, ChevronUp, Lock as LockIcon, Unlock as UnlockIcon, FileText, Search, RotateCcw, Settings2, Wallet, Bell } from 'lucide-react';
import { formatMinutesToTime } from '../services/calculator';
import { searchMatch } from '../services/personnelUtils';
import { CalculationDetail } from './CalculationDetail';
import { useTableManager } from '../hooks/useTableManager';
import { TableSettingsPanel } from './TableSettingsPanel';
import { ResizableHeader } from './ResizableHeader';

interface MonthlyTableProps {
  personnel: Employee[];
  inputs: Record<string, MonthlyInput>;
  results: Record<string, MonthlyResult>;
  allResults?: Record<string, Record<string, MonthlyResult>>;
  monthStatus: MonthStatus;
  config: AppConfig;
  currentMonth: string;
  unitConfigs?: UnitConfig[];
  onInputChange: (personId: string, field: keyof MonthlyInput, value: string | number) => void;
  onExport: () => void;
  onCloseMonth: () => void;
  onUnlockMonth: () => void;
  onViewDocument?: (employee: Employee, result: MonthlyResult) => void; 
  onNavigateToDeductions: (type: 'salary' | 'leave') => void;
  onViewPersonnelDetail?: (empId: string) => void;
  onPrepareNotificationByType?: (empId: string, type: 'late' | 'salary') => void;
  onPrepareManagerNotification?: (department: string) => void;
}

export const MonthlyTable: React.FC<MonthlyTableProps> = ({ 
  personnel, inputs, results, allResults, monthStatus, config, currentMonth, unitConfigs, onInputChange, onCloseMonth, onUnlockMonth, onViewDocument, onNavigateToDeductions, onViewPersonnelDetail, onPrepareNotificationByType, onPrepareManagerNotification
}) => {
  const [expandedRow, setExpandedRow] = useState<{ id: string, type: 'detail' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [sortKey, setSortKey] = useState<string | null>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  const isLocked = !!monthStatus?.isLocked;

  const initialCols = [
    { id: 'index', label: 'Sıra No', defaultWidth: 70 },
    { id: 'tckn', label: 'TCKN', defaultWidth: 120 },
    { id: 'name', label: 'Personel Ad Soyad', defaultWidth: 220, wrap: true },
    { id: 'department', label: 'Birim', defaultWidth: 180, wrap: true },
    { id: 'missingTime', label: 'Eksik Süre', defaultWidth: 110 },
    { id: 'lateDays', label: 'Geç Gün', defaultWidth: 90 },
    { id: 'leaveBalance', label: 'Mevcut İzin', defaultWidth: 120 },
    { id: 'leaveDed', label: 'İzin Kesintisi', defaultWidth: 130 },
    { id: 'salaryDed', label: 'Maaş Kesintisi', defaultWidth: 140 },
    { id: 'prevLeavePool', label: 'Devredilen İzin', defaultWidth: 110 },
    { id: 'prevSalaryPool', label: 'Devredilen Maaş', defaultWidth: 110 },
    { id: 'leavePool', label: 'Devredilecek İzin', defaultWidth: 110 },
    { id: 'salaryPool', label: 'Devredilecek Maaş', defaultWidth: 110 },
    { id: 'status', label: 'Durum', defaultWidth: 100 },
    { id: 'actions', label: 'İşlemler', defaultWidth: 120 }
  ];

  const tableManager = useTableManager('monthly-payroll', initialCols);

  const departments = useMemo(() => {
    const deps = new Set<string>();
    personnel.forEach(p => {
      if (p.department) deps.add(p.department);
    });
    return Array.from(deps).sort((a, b) => a.localeCompare(b, 'tr-TR'));
  }, [personnel]);

  const processedData = useMemo(() => {
    let data = personnel.map(p => ({
      person: p,
      input: inputs[p.id] || { missingTime: "0:00", lateDays: 0, currentLeaveBalance: "0:00" },
      result: results[p.id]
    }));

    if (selectedDepartment !== 'all') {
      data = data.filter(d => d.person.department === selectedDepartment);
    }

    if (searchTerm) {
      data = data.filter(d => 
        searchMatch(d.person.name || '', searchTerm) || 
        searchMatch(d.person.department || '', searchTerm) ||
        searchMatch(d.person.tcNo || '', searchTerm)
      );
    }

    if (sortKey && sortDir) {
      data.sort((a, b) => {
        let vA: any; let vB: any;
        switch(sortKey) {
          case 'tckn': vA = a.person.tcNo; vB = b.person.tcNo; break;
          case 'name': vA = a.person.name; vB = b.person.name; break;
          case 'department': vA = a.person.department; vB = b.person.department; break;
          case 'prevLeavePool': vA = a.result?.prevLeavePoolMinutes || 0; vB = b.result?.prevLeavePoolMinutes || 0; break;
          case 'prevSalaryPool': vA = a.result?.prevSalaryPoolMinutes || 0; vB = b.result?.prevSalaryPoolMinutes || 0; break;
          case 'missingTime': vA = a.result?.currentMissingMinutes || 0; vB = b.result?.currentMissingMinutes || 0; break;
          case 'lateDays': vA = a.result?.currentLateDays || 0; vB = b.result?.currentLateDays || 0; break;
          case 'leaveBalance': vA = a.result?.currentImportedLeaveBalanceMinutes || 0; vB = b.result?.currentImportedLeaveBalanceMinutes || 0; break;
          case 'leaveDed': vA = a.result?.leaveDeductedMinutes || 0; vB = b.result?.leaveDeductedMinutes || 0; break;
          case 'salaryDed': vA = a.result?.salaryDeductedAmountTry || 0; vB = b.result?.salaryDeductedAmountTry || 0; break;
          case 'leavePool': vA = a.result?.nextLeavePoolMinutes || 0; vB = b.result?.nextLeavePoolMinutes || 0; break;
          case 'salaryPool': vA = a.result?.nextSalaryPoolMinutes || 0; vB = b.result?.nextSalaryPoolMinutes || 0; break;
          case 'status': vA = (a.result?.leaveDeductedMinutes || 0) + (a.result?.salaryDeductedAmountTry || 0); vB = (b.result?.leaveDeductedMinutes || 0) + (b.result?.salaryDeductedAmountTry || 0); break;
          default: vA = 0; vB = 0;
        }
        if (typeof vA === 'string' && typeof vB === 'string') {
          return sortDir === 'asc' ? vA.localeCompare(vB, 'tr-TR') : vB.localeCompare(vA, 'tr-TR');
        }
        return sortDir === 'asc' ? (vA > vB ? 1 : -1) : (vA < vB ? 1 : -1);
      });
    }
    return data;
  }, [personnel, inputs, results, searchTerm, selectedDepartment, sortKey, sortDir]);

  const totalPages = Math.ceil(processedData.length / rowsPerPage);
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return processedData.slice(start, start + rowsPerPage);
  }, [processedData, currentPage, rowsPerPage]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment]);

  return (
    <div className="flex flex-col space-y-8 relative">
      <TableSettingsPanel isOpen={tableManager.isSettingsOpen} onClose={() => tableManager.setIsSettingsOpen(false)} columns={tableManager.columns} onToggle={tableManager.toggleVisibility} onReorder={tableManager.reorderColumn} onReset={tableManager.resetToDefaults} />

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-card">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-100/50">
           <div className="flex items-center gap-4 w-full md:flex-1 flex-wrap">
               <div className="relative w-full md:w-80">
                 <Search className="w-5 h-5 absolute left-3 top-3 text-slate-500" />
                 <input type="text" placeholder="Personel ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none shadow-inner" />
               </div>
               <select
                 value={selectedDepartment}
                 onChange={e => setSelectedDepartment(e.target.value)}
                 className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm bg-white"
               >
                 <option value="all">Tüm Birimler</option>
                 {departments.map(dep => (
                   <option key={dep} value={dep}>{dep}</option>
                 ))}
               </select>
               <div className="flex gap-2">
                 <button onClick={() => tableManager.setIsSettingsOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-sm"><Settings2 className="w-4 h-4" /> Sütunlar</button>
                 <button onClick={tableManager.resetToDefaults} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-sm"><RotateCcw className="w-4 h-4" /> Sığdır</button>
               </div>
           </div>
           
           <div className={`relative px-4 py-2 rounded-xl text-sm flex items-center gap-2 border shadow-sm ${isLocked ? 'bg-orange-100 text-orange-950 border-orange-300' : 'bg-emerald-100 text-emerald-950 border-emerald-300'}`}>
             {isLocked ? <LockIcon className="w-4 h-4" /> : <UnlockIcon className="w-4 h-4" />}
             <span className="font-black tracking-wide uppercase">{isLocked ? 'DÖNEM KİLİTLİ' : 'DÖNEM AÇIK'}</span>
             
             {!isLocked ? (
               <button type="button" onClick={onCloseMonth} className="ml-3 text-[10px] bg-white px-3 py-1.5 rounded-lg border border-emerald-400 hover:bg-emerald-500 hover:text-white transition-all font-black uppercase text-emerald-800 shadow-sm">Dönemi Kapat</button>
             ) : (
               <button 
                 type="button" 
                 onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUnlockMonth(); }} 
                 className="relative z-50 ml-3 text-[10px] bg-white px-3 py-1.5 rounded-lg border border-orange-400 hover:bg-orange-600 hover:text-white transition-all font-black uppercase text-orange-800 shadow-lg cursor-pointer pointer-events-auto"
               >
                 Kilidi Aç
               </button>
             )}
           </div>
        </div>

        <div className="overflow-auto relative table-container max-h-[calc(100vh-150px)] border-t border-slate-200">
          <table className="w-full text-sm text-left border-separate border-spacing-0 table-fixed">
            <thead className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
              <tr>
                {tableManager.columns.filter(c => c.visible).map(col => (
                  <ResizableHeader 
                    key={col.id} 
                    id={col.id} 
                    label={col.label} 
                    width={col.width} 
                    onResize={tableManager.resizeColumn} 
                    onAutoFit={() => {}} 
                    onSort={() => {
                      if (col.id === 'index' || col.id === 'actions') return;
                      if (sortKey === col.id) {
                        setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc');
                        if (sortDir === 'desc') setSortKey(null);
                      } else {
                        setSortKey(col.id);
                        setSortDir('asc');
                      }
                    }} 
                    sortDir={sortKey === col.id ? sortDir : null} 
                    className={`bg-slate-900 text-white border-b ${col.id === 'leaveDed' ? 'border-slate-950 border-x bg-slate-800/50' : col.id === 'salaryDed' ? 'border-slate-950 border-r bg-slate-800/50' : 'border-slate-700'}`}
                  />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {currentData.map(({ person, input, result }, rowIndex) => {
                 const globalIndex = (currentPage - 1) * rowsPerPage + rowIndex + 1;
                 const hasDeduction = result ? (result.leaveDeductedMinutes > 0 || result.salaryDeductedAmountTry > 0) : false;
                 return (
                   <React.Fragment key={`${person.id}-${rowIndex}`}>
                     <tr className={`group transition-all hover:bg-slate-50 ${expandedRow?.id === person.id ? 'bg-slate-50' : ''}`}>
                        {tableManager.visibleColumns.map(col => {
                          const cellStyle = { width: `${col.width}px`, minWidth: `${col.width}px`, maxWidth: `${col.width}px` };
                          const cellKey = `${person.id}-${col.id}-${rowIndex}`;
                          switch(col.id) {
                            case 'index': return <td key={cellKey} style={cellStyle} className="px-6 py-4 font-black text-slate-400 text-xs border-r border-slate-50 border-b border-slate-100">{globalIndex}</td>;
                            case 'tckn': return <td key={cellKey} style={cellStyle} className="px-6 py-4 font-mono text-slate-600 border-b border-slate-100">{person.tcNo}</td>;
                            case 'name': return (
                              <td key={cellKey} style={cellStyle} className="px-6 py-4 cell-wrap border-b border-slate-100">
                                <button 
                                  onClick={() => onViewPersonnelDetail?.(person.id)}
                                  className="font-black text-slate-900 hover:text-brand-600 hover:underline text-left transition-colors"
                                >
                                  {person.name}
                                </button>
                              </td>
                            );
                            case 'department': return <td key={cellKey} style={cellStyle} className="px-6 py-4 text-xs font-bold text-slate-600 italic cell-wrap border-b border-slate-100">{person.department}</td>;
                            case 'prevLeavePool': return <td key={cellKey} style={cellStyle} className="px-3 py-4 text-center font-mono font-bold text-amber-600 bg-amber-50/40 border-l border-amber-100 border-b border-slate-100">{(result?.prevLeavePoolMinutes || 0) > 0 ? formatMinutesToTime(result!.prevLeavePoolMinutes) : '-'}</td>;
                            case 'prevSalaryPool': return <td key={cellKey} style={cellStyle} className="px-3 py-4 text-center font-mono font-bold text-amber-600 bg-amber-50/40 border-l border-amber-100 border-b border-slate-100">{(result?.prevSalaryPoolMinutes || 0) > 0 ? formatMinutesToTime(result!.prevSalaryPoolMinutes) : '-'}</td>;
                            case 'missingTime': return (
                              <td key={cellKey} style={cellStyle} className="px-2 py-4 bg-slate-100/30 border-b border-slate-100">
                                <input 
                                  type="text" 
                                  value={input.missingTime} 
                                  disabled={isLocked}
                                  onChange={e => onInputChange(person.id, 'missingTime', e.target.value)}
                                  className="w-full text-center font-mono font-bold text-slate-900 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-brand-500 rounded"
                                />
                              </td>
                            );
                            case 'lateDays': return (
                              <td key={cellKey} style={cellStyle} className="px-2 py-4 bg-slate-100/30 border-b border-slate-100">
                                <input 
                                  type="number" 
                                  value={input.lateDays} 
                                  disabled={isLocked}
                                  onChange={e => onInputChange(person.id, 'lateDays', parseInt(e.target.value) || 0)}
                                  className="w-full text-center font-mono font-bold text-slate-900 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-brand-500 rounded"
                                />
                              </td>
                            );
                            case 'leaveBalance': return (
                              <td key={cellKey} style={cellStyle} className="px-2 py-4 bg-slate-100/30 border-b border-slate-100">
                                <input 
                                  type="text" 
                                  value={input.currentLeaveBalance} 
                                  disabled={isLocked}
                                  onChange={e => onInputChange(person.id, 'currentLeaveBalance', e.target.value)}
                                  className="w-full text-center font-mono font-bold text-slate-900 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-brand-500 rounded"
                                />
                              </td>
                            );
                            case 'leaveDed': return <td key={cellKey} style={cellStyle} className="px-3 py-4 text-center border-x border-slate-950 bg-red-50/50 border-b border-slate-100">{result?.leaveDeductedMinutes > 0 ? <span className="text-sm font-black text-red-600">{formatMinutesToTime(result.leaveDeductedMinutes)}</span> : <span className="text-slate-400 font-bold">-</span>}</td>;
                            case 'salaryDed': return <td key={cellKey} style={cellStyle} className="px-3 py-4 text-center border-r border-slate-950 bg-red-50/50 border-b border-slate-100">{result?.salaryDeductedAmountTry > 0 ? <div className="flex flex-col"><span className="text-sm font-black text-red-600 leading-none">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(result.salaryDeductedAmountTry)}</span><span className="text-[9px] text-red-500 font-black opacity-80 mt-0.5">{formatMinutesToTime(result.salaryDeductedMinutes)}</span></div> : <span className="text-slate-400 font-bold">-</span>}</td>;
                            case 'leavePool': return <td key={cellKey} style={cellStyle} className="px-3 py-4 text-center font-mono font-black text-red-700 bg-red-100/20 border-l border-red-100 border-b border-slate-100">{(result?.nextLeavePoolMinutes || 0) > 0 ? formatMinutesToTime(result!.nextLeavePoolMinutes) : '-'}</td>;
                            case 'salaryPool': return <td key={cellKey} style={cellStyle} className="px-3 py-4 text-center font-mono font-black text-red-700 bg-red-100/20 border-l border-red-100 border-b border-slate-100">{(result?.nextSalaryPoolMinutes || 0) > 0 ? formatMinutesToTime(result!.nextSalaryPoolMinutes) : '-'}</td>;
                            case 'status': return (
                              <td key={cellKey} style={cellStyle} className="px-3 py-4 text-center border-b border-slate-100">
                                {hasDeduction ? (
                                  <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-black rounded-full uppercase tracking-tighter">Kesinti Var</span>
                                ) : (result?.currentMissingMinutes || 0) < 0 ? (
                                  <span className="px-2 py-1 bg-brand-100 text-brand-700 text-[10px] font-black rounded-full uppercase tracking-tighter">Ekstra Çalışma</span>
                                ) : (
                                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-tighter">Temiz</span>
                                )}
                              </td>
                            );
                            case 'actions': {
                              return (
                                <td key={cellKey} style={cellStyle} className="px-6 py-4 text-right flex justify-end gap-2 border-l border-b border-slate-100">
                                  <button onClick={() => hasDeduction ? onViewDocument?.(person, result) : null} disabled={!hasDeduction} className={`p-2 border rounded-lg transition-all shadow-sm bg-white ${hasDeduction ? 'border-brand-200 text-brand-600 hover:bg-brand-50' : 'border-slate-100 text-slate-300 cursor-not-allowed'}`}><FileText className="w-4 h-4" /></button>
                                  <button onClick={() => setExpandedRow(expandedRow?.id === person.id && expandedRow.type === 'detail' ? null : { id: person.id, type: 'detail' })} className={`p-2 border rounded-lg transition-all ${expandedRow?.id === person.id && expandedRow.type === 'detail' ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'border-slate-200 text-slate-500 hover:bg-slate-100 bg-white shadow-sm'}`}>{expandedRow?.id === person.id && expandedRow.type === 'detail' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
                                </td>
                              );
                            }
                            default: return <td key={cellKey} style={cellStyle}></td>;
                          }
                        })}
                     </tr>
                     {expandedRow?.id === person.id && expandedRow.type === 'detail' && result && (
                       <tr><td colSpan={tableManager.visibleColumns.length} className="bg-slate-50 p-6 border-y shadow-inner"><CalculationDetail result={result} config={config} employee={person} /></td></tr>
                     )}
                   </React.Fragment>
                 );
              })}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-500">
              Toplam {processedData.length} kayıttan {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, processedData.length)} arası gösteriliyor
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-bold disabled:opacity-50"
              >
                Önceki
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-bold disabled:opacity-50"
              >
                Sonraki
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
