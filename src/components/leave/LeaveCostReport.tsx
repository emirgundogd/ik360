import React, { useMemo } from 'react';
import { LeaveRecord, LeaveSettings } from './types';
import { Calculator, Download, Building2, MapPin } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  data: LeaveRecord[];
  settings: LeaveSettings;
}

export const LeaveCostReport: React.FC<Props> = ({ data, settings }) => {
  const { totalCost, totalAnnualCost, totalCompensatoryCost, deptCosts, locationCosts, sortedData } = useMemo(() => {
    let total = 0;
    let annualTotal = 0;
    let compTotal = 0;
    const dCosts: Record<string, number> = {};
    const lCosts: Record<string, number> = {};

    const validData = data.filter(d => d.totalEstimatedCost && d.totalEstimatedCost > 0);

    validData.forEach(emp => {
      const cost = emp.totalEstimatedCost || 0;
      total += cost;
      annualTotal += emp.estimatedAnnualLeaveCost || 0;
      compTotal += emp.estimatedCompensatoryLeaveCost || 0;

      const dept = emp.department || 'Belirtilmemiş';
      dCosts[dept] = (dCosts[dept] || 0) + cost;

      const loc = emp.locationType || 'Belirtilmemiş';
      lCosts[loc] = (lCosts[loc] || 0) + cost;
    });

    const sorted = [...validData].sort((a, b) => (b.totalEstimatedCost || 0) - (a.totalEstimatedCost || 0));

    return { totalCost: total, totalAnnualCost: annualTotal, totalCompensatoryCost: compTotal, deptCosts: dCosts, locationCosts: lCosts, sortedData: sorted };
  }, [data]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);

  const handleExport = () => {
    const exportData = sortedData.map(emp => ({
      'Ad Soyad': emp.name,
      'TC': emp.tc,
      'Departman': emp.department || '-',
      'Ünvan': emp.title || '-',
      'Kalan Yıllık İzin': emp.remainingAnnualLeave.originalText,
      'Kalan Denkleştirme İzni': emp.remainingCompensatoryLeave.originalText,
      'Net Maaş': emp.netSalary || 0,
      'Yıllık İzin Maliyeti': emp.estimatedAnnualLeaveCost || 0,
      'Denkleştirme İzni Maliyeti': emp.estimatedCompensatoryLeaveCost || 0,
      'Toplam Maliyet': emp.totalEstimatedCost || 0,
      'Lokasyon': emp.locationType || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Maliyet Raporu');
    XLSX.writeFile(wb, 'izin_maliyet_raporu.xlsx');
  };

  if (data.length === 0) {
    return (
      <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm text-center">
        <p className="text-slate-500 font-medium">Maliyet analizi için veri bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <Calculator className="w-8 h-8 text-brand-500" /> İzin Maliyet Raporu
          </h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
            Hesaplama Yöntemi: {settings.costCalculationMethod === 'netSalary/30' ? 'Net Maaş / 30' : 'Brüt Maaş / 30'}
          </p>
        </div>
        <button 
          onClick={handleExport}
          className="px-6 py-3 bg-emerald-50 text-emerald-600 font-black rounded-2xl hover:bg-emerald-100 transition-all uppercase text-xs tracking-widest flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Excel'e Aktar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4">
            <Calculator className="w-8 h-8 text-brand-500" />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Toplam İzin Yükü Maliyeti</p>
          <p className="text-4xl font-black text-slate-800">{formatCurrency(totalCost)}</p>
          <div className="mt-4 pt-4 border-t border-slate-100 w-full flex justify-between items-center px-4">
            <div className="text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Yıllık</p>
              <p className="text-sm font-black text-slate-700">{formatCurrency(totalAnnualCost)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Denk.</p>
              <p className="text-sm font-black text-slate-700">{formatCurrency(totalCompensatoryCost)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Departman Bazlı</h3>
          </div>
          <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(deptCosts)
              .sort(([, a], [, b]) => b - a)
              .map(([dept, cost]) => (
                <div key={dept} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 truncate max-w-[150px]">{dept}</span>
                  <span className="text-xs font-black text-slate-800 bg-slate-50 px-2 py-1 rounded-lg">{formatCurrency(cost)}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Lokasyon Bazlı</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(locationCosts)
              .sort(([, a], [, b]) => b - a)
              .map(([loc, cost]) => (
                <div key={loc} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">{loc}</span>
                  <span className="text-xs font-black text-slate-800 bg-slate-50 px-2 py-1 rounded-lg">{formatCurrency(cost)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Personel Maliyet Detayı</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Personel</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Departman</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Lokasyon</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Kalan Yıllık</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Kalan Denk.</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Net Maaş</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Toplam Maliyet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedData.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{emp.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{emp.tc}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">{emp.department || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      emp.locationType === 'Genel Merkez' ? 'bg-indigo-50 text-indigo-600' :
                      emp.locationType === 'Saha' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {emp.locationType || 'Belirtilmemiş'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-brand-600">
                    {emp.remainingAnnualLeave.totalDays.toFixed(1)} Gün
                    <div className="text-[10px] text-slate-400 font-medium">{formatCurrency(emp.estimatedAnnualLeaveCost || 0)}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-indigo-600">
                    {emp.remainingCompensatoryLeave.totalDays.toFixed(1)} Gün
                    <div className="text-[10px] text-slate-400 font-medium">{formatCurrency(emp.estimatedCompensatoryLeaveCost || 0)}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-500">
                    {formatCurrency(emp.netSalary || 0)}
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-800">
                    {formatCurrency(emp.totalEstimatedCost || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
