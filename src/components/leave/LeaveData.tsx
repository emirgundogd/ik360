import React, { useState, useMemo } from 'react';
import { LeaveRecord, LeaveSettings } from './types';
import { Search, Download, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  data: LeaveRecord[];
  settings: LeaveSettings;
}

export const LeaveData: React.FC<Props> = ({ data, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    title: '',
    locationType: '',
    status: '', // 'critical', 'risky', 'safe'
    isActive: 'all'
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof LeaveRecord | string, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredData = useMemo(() => {
    return data.filter(emp => {
      const matchesSearch = 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.tc.includes(searchTerm) ||
        (emp.department || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDept = !filters.department || emp.department === filters.department;
      const matchesTitle = !filters.title || emp.title === filters.title;
      const matchesLocation = !filters.locationType || emp.locationType === filters.locationType;
      
      const remaining = emp.remainingAnnualLeave.totalDays;
      let matchesStatus = true;
      if (filters.status === 'critical') matchesStatus = remaining >= settings.criticalLeaveThreshold;
      if (filters.status === 'risky') matchesStatus = remaining < settings.riskyNegativeThreshold;
      if (filters.status === 'safe') matchesStatus = remaining < settings.criticalLeaveThreshold && remaining >= settings.riskyNegativeThreshold;

      let matchesActive = true;
      if (filters.isActive === 'active') matchesActive = emp.isActive === true;
      if (filters.isActive === 'passive') matchesActive = emp.isActive === false;

      return matchesSearch && matchesDept && matchesTitle && matchesLocation && matchesStatus && matchesActive;
    }).sort((a, b) => {
      let aVal: any = a[sortConfig.key as keyof LeaveRecord];
      let bVal: any = b[sortConfig.key as keyof LeaveRecord];

      // Handle nested values
      if (sortConfig.key === 'remainingAnnualLeave') {
        aVal = a.remainingAnnualLeave.totalDays;
        bVal = b.remainingAnnualLeave.totalDays;
      } else if (sortConfig.key === 'remainingCompensatoryLeave') {
        aVal = a.remainingCompensatoryLeave.totalDays;
        bVal = b.remainingCompensatoryLeave.totalDays;
      } else if (sortConfig.key === 'seniority') {
        aVal = a.seniority?.years || 0;
        bVal = b.seniority?.years || 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, searchTerm, filters, sortConfig, settings]);

  const departments = Array.from(new Set(data.map(d => d.department).filter(Boolean))) as string[];
  const titles = Array.from(new Set(data.map(d => d.title).filter(Boolean))) as string[];

  const handleExport = () => {
    const exportData = filteredData.map(emp => ({
      'Ad Soyad': emp.name,
      'TC': emp.tc,
      'Departman': emp.department || '-',
      'Ünvan': emp.title || '-',
      'İşe Giriş': emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('tr-TR') : '-',
      'Kıdem': emp.seniority?.text || '-',
      'Yıllık İzin': emp.annualLeave.originalText,
      'Kullanılan Yıllık İzin': emp.usedAnnualLeave.originalText,
      'Kalan Yıllık İzin': emp.remainingAnnualLeave.originalText,
      'Denkleştirme İzni': emp.compensatoryLeave.originalText,
      'Kullanılan Denkleştirme İzni': emp.usedCompensatoryLeave.originalText,
      'Kalan Denkleştirme İzni': emp.remainingCompensatoryLeave.originalText,
      'Net Maaş': emp.netSalary || 0,
      'Yıllık İzin Maliyeti': emp.estimatedAnnualLeaveCost || 0,
      'Denkleştirme İzni Maliyeti': emp.estimatedCompensatoryLeaveCost || 0,
      'Toplam Maliyet': emp.totalEstimatedCost || 0,
      'Lokasyon': emp.locationType || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'İzin Verileri');
    XLSX.writeFile(wb, 'izin_verileri.xlsx');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex-1 w-full flex items-center gap-4 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Ad Soyad, TC veya Departman ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm font-bold text-slate-800"
          />
        </div>
        <button 
          onClick={handleExport}
          className="px-6 py-3 bg-emerald-50 text-emerald-600 font-black rounded-2xl hover:bg-emerald-100 transition-all uppercase text-xs tracking-widest flex items-center gap-2 whitespace-nowrap"
        >
          <Download className="w-4 h-4" /> Excel'e Aktar
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4">
        <select 
          value={filters.department} 
          onChange={(e) => setFilters({...filters, department: e.target.value})}
          className="px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 outline-none"
        >
          <option value="">Tüm Departmanlar</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select 
          value={filters.title} 
          onChange={(e) => setFilters({...filters, title: e.target.value})}
          className="px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 outline-none"
        >
          <option value="">Tüm Ünvanlar</option>
          {titles.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select 
          value={filters.locationType} 
          onChange={(e) => setFilters({...filters, locationType: e.target.value})}
          className="px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 outline-none"
        >
          <option value="">Tüm Lokasyonlar</option>
          <option value="Genel Merkez">Genel Merkez</option>
          <option value="Saha">Saha</option>
          <option value="Belirtilmemiş">Belirtilmemiş</option>
        </select>
        <select 
          value={filters.status} 
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          className="px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 outline-none"
        >
          <option value="">Tüm Durumlar</option>
          <option value="safe">Güvenli</option>
          <option value="critical">Kritik İzin</option>
          <option value="risky">Eksi Bakiye</option>
        </select>
        <select 
          value={filters.isActive} 
          onChange={(e) => setFilters({...filters, isActive: e.target.value})}
          className="px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 outline-none"
        >
          <option value="all">Tümü (Aktif/Pasif)</option>
          <option value="active">Sadece Aktif</option>
          <option value="passive">Sadece Pasif</option>
        </select>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-2">Ad Soyad <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('department')}>
                  <div className="flex items-center gap-2">Departman <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('locationType')}>
                  <div className="flex items-center gap-2">Lokasyon <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('seniority')}>
                  <div className="flex items-center gap-2">Kıdem <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('remainingAnnualLeave')}>
                  <div className="flex items-center gap-2">Kalan Yıllık <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('remainingCompensatoryLeave')}>
                  <div className="flex items-center gap-2">Kalan Denkleştirme <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('estimatedAnnualLeaveCost')}>
                  <div className="flex items-center gap-2">Yıllık İzin Maliyeti <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('estimatedCompensatoryLeaveCost')}>
                  <div className="flex items-center gap-2">Denkleştirme Maliyeti <ArrowUpDown className="w-3 h-3" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((emp) => {
                const remaining = emp.remainingAnnualLeave.totalDays;
                let statusColor = 'text-slate-700';
                if (remaining < settings.riskyNegativeThreshold) statusColor = 'text-red-600';
                else if (remaining >= settings.criticalLeaveThreshold) statusColor = 'text-amber-600';

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{emp.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{emp.tc}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-700">{emp.department || '-'}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{emp.title || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        emp.locationType === 'Genel Merkez' ? 'bg-indigo-50 text-indigo-600' :
                        emp.locationType === 'Saha' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {emp.locationType || 'Belirtilmemiş'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-600">
                      {emp.seniority?.text || '-'}
                    </td>
                    <td className={`px-6 py-4 text-sm font-black ${statusColor}`}>
                      {emp.remainingAnnualLeave.originalText}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">
                      {emp.remainingCompensatoryLeave.originalText}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(emp.estimatedAnnualLeaveCost || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(emp.estimatedCompensatoryLeaveCost || 0)}
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
