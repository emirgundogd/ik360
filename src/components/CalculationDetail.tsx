import React from 'react';
import { MonthlyResult, AppConfig, Employee } from '../types';
import { formatMinutesToTime } from '../services/calculator';
import { Info, AlertCircle } from 'lucide-react';

interface CalculationDetailProps {
  result: MonthlyResult;
  config: AppConfig;
  employee: Employee;
}

export const CalculationDetail: React.FC<CalculationDetailProps> = ({ result, config, employee }) => {
  const netSalary = employee.wage?.netSalary || employee.netSalary || 0;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Giriş Verileri</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Eksik Süre:</span>
              <span className="font-bold text-slate-900">{formatMinutesToTime(result.currentMissingMinutes)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Geç Gün:</span>
              <span className="font-bold text-slate-900">{result.currentLateDays} Gün</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Mevcut İzin:</span>
              <span className="font-bold text-slate-900">{formatMinutesToTime(result.currentImportedLeaveBalanceMinutes)}</span>
            </div>
            <div className="flex justify-between text-xs border-t pt-1 mt-1">
              <span className="text-slate-600">Net Maaş:</span>
              <span className="font-bold text-slate-900">
                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(netSalary)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Havuz Durumu</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Devredilen İzin:</span>
              <span className="font-bold text-slate-900">{formatMinutesToTime(result.prevLeavePoolMinutes)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Devredilen Maaş:</span>
              <span className="font-bold text-slate-900">{formatMinutesToTime(result.prevSalaryPoolMinutes)}</span>
            </div>
            <div className="flex justify-between text-xs border-t pt-1 mt-1">
              <span className="text-slate-600">Bir Sonraki Aya Devredilecek İzin:</span>
              <span className="font-bold text-orange-700">{formatMinutesToTime(result.nextLeavePoolMinutes)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Bir Sonraki Aya Devredilecek Maaş:</span>
              <span className="font-bold text-indigo-800">{formatMinutesToTime(result.nextSalaryPoolMinutes)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Kesinti Özeti</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">İzin Kesintisi:</span>
              <span className="font-bold text-blue-700">{formatMinutesToTime(result.leaveDeductedMinutes)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Maaş Kesintisi:</span>
              <span className="font-bold text-red-700">{formatMinutesToTime(result.salaryDeductedMinutes)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 border-t pt-2 mt-2">
              <span>Toplam Tutar:</span>
              <span>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(result.salaryDeductedAmountTry)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Hesaplama Ayarları</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Günlük Süre:</span>
              <span className="font-bold text-slate-900">{result.unitConfigUsed ? formatMinutesToTime(result.unitConfigUsed.dailyWorkMinutes) : '-'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">İzin Eşiği:</span>
              <span className="font-bold text-slate-900">{result.unitConfigUsed ? formatMinutesToTime(result.unitConfigUsed.leaveDeductionThresholdMinutes) : '-'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Maaş Eşiği:</span>
              <span className="font-bold text-slate-900">{result.unitConfigUsed ? formatMinutesToTime(result.unitConfigUsed.salaryDeductionThresholdMinutes) : '-'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Geç Gün Eşiği:</span>
              <span className="font-bold text-slate-900">{result.unitConfigUsed?.lateDayThreshold || '-'} Gün</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-brand-400" />
          <h4 className="text-xs font-black text-white uppercase tracking-widest">Hesaplama Günlüğü (Audit Log)</h4>
        </div>
        <div className="space-y-2">
          {result.explanation.map((line, i) => (
            <div key={i} className="flex gap-3 text-[10px] font-medium text-slate-300 border-l-2 border-slate-700 pl-4 py-1 hover:border-brand-500 transition-colors">
              <span className="text-slate-500 font-mono">{String(i + 1).padStart(2, '0')}</span>
              <span>{line}</span>
            </div>
          ))}
          {result.explanation.length === 0 && (
            <p className="text-[10px] text-slate-500 italic">Kayıt bulunamadı.</p>
          )}
        </div>
      </div>
    </div>
  );
};
