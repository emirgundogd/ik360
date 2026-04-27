import React, { useMemo } from 'react';
import { LeaveRecord, LeaveSettings } from './types';
import { AlertTriangle, TrendingDown, ShieldAlert, AlertCircle } from 'lucide-react';

interface Props {
  data: LeaveRecord[];
  settings: LeaveSettings;
}

export const LeaveRiskAnalysis: React.FC<Props> = ({ data, settings }) => {
  const { riskyPersonnel, criticalPersonnel } = useMemo(() => {
    const risky = data.filter(emp => emp.remainingAnnualLeave.totalDays < settings.riskyNegativeThreshold)
      .sort((a, b) => a.remainingAnnualLeave.totalDays - b.remainingAnnualLeave.totalDays);
    
    const critical = data.filter(emp => 
      emp.remainingAnnualLeave.totalDays >= settings.criticalLeaveThreshold
    ).sort((a, b) => b.remainingAnnualLeave.totalDays - a.remainingAnnualLeave.totalDays);

    return { riskyPersonnel: risky, criticalPersonnel: critical };
  }, [data, settings]);

  if (data.length === 0) {
    return (
      <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm text-center">
        <p className="text-slate-500 font-medium">Risk analizi için veri bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-brand-500" /> Riskli Personeller
        </h2>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Eksi bakiye ve kritik seviye izin takibi</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risky Personnel */}
        <div className="bg-white rounded-[3rem] border border-red-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-red-100 bg-red-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="text-lg font-black text-red-800 uppercase tracking-tight">Eksi Bakiye (Riskli)</h3>
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-1">&lt; {settings.riskyNegativeThreshold} Gün</p>
              </div>
            </div>
            <div className="text-3xl font-black text-red-500">{riskyPersonnel.length}</div>
          </div>
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar max-h-[600px]">
            {riskyPersonnel.length > 0 ? (
              <div className="space-y-4">
                {riskyPersonnel.map(emp => (
                  <div key={emp.id} className="bg-white border border-red-100 p-4 rounded-2xl flex items-center justify-between hover:border-red-300 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800">{emp.name}</p>
                      <p className="text-xs font-medium text-slate-500">
                        {emp.department || '-'} • {emp.title || '-'} • {emp.locationType || 'Belirtilmemiş'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-red-600">{emp.remainingAnnualLeave.originalText}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kalan Yıllık</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <AlertCircle className="w-12 h-12 text-emerald-300 mb-4" />
                <p className="text-emerald-600 font-bold">Eksi bakiyede personel bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>

        {/* Critical Personnel */}
        <div className="bg-white rounded-[3rem] border border-amber-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-amber-100 bg-amber-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <div>
                <h3 className="text-lg font-black text-amber-800 uppercase tracking-tight">Kritik Seviye</h3>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1">&ge; {settings.criticalLeaveThreshold} Gün</p>
              </div>
            </div>
            <div className="text-3xl font-black text-amber-500">{criticalPersonnel.length}</div>
          </div>
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar max-h-[600px]">
            {criticalPersonnel.length > 0 ? (
              <div className="space-y-4">
                {criticalPersonnel.map(emp => (
                  <div key={emp.id} className="bg-white border border-amber-100 p-4 rounded-2xl flex items-center justify-between hover:border-amber-300 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800">{emp.name}</p>
                      <p className="text-xs font-medium text-slate-500">
                        {emp.department || '-'} • {emp.title || '-'} • {emp.locationType || 'Belirtilmemiş'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-amber-600">{emp.remainingAnnualLeave.originalText}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kalan Yıllık</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <AlertCircle className="w-12 h-12 text-emerald-300 mb-4" />
                <p className="text-emerald-600 font-bold">Kritik seviyede personel bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
