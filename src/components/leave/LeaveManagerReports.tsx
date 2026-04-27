import React, { useState, useMemo } from 'react';
import { LeaveRecord, LeaveSettings } from './types';
import { Employee } from '../../types';
import { Users, Copy, Printer, FileText, ChevronRight } from 'lucide-react';

interface Props {
  data: LeaveRecord[];
  settings: LeaveSettings;
  employees: Employee[];
}

export const LeaveManagerReports: React.FC<Props> = ({ data, settings, employees }) => {
  const [selectedManager, setSelectedManager] = useState<string | null>(null);

  const managers = useMemo(() => {
    const mgrMap: Record<string, LeaveRecord[]> = {};
    
    const unitManagers = employees.filter(e => e.work?.isUnitManager && e.work?.managedDepartments && e.work.managedDepartments.length > 0);
    
    if (unitManagers.length > 0) {
      unitManagers.forEach(manager => {
        const managerName = manager.core?.name || manager.name || 'Bilinmeyen Yönetici';
        const managedDepts = manager.work?.managedDepartments || [];
        
        const managedEmployees = data.filter(emp => emp.department && managedDepts.includes(emp.department));
        
        if (managedEmployees.length > 0) {
          mgrMap[managerName] = managedEmployees;
        }
      });

      const managedEmployeeIds = new Set<string>();
      Object.values(mgrMap).forEach(list => list.forEach(e => managedEmployeeIds.add(e.id)));
      
      const unmanagedEmployees = data.filter(e => !managedEmployeeIds.has(e.id));
      if (unmanagedEmployees.length > 0) {
        mgrMap['Diğer Personeller'] = unmanagedEmployees;
      }
    } else {
      data.forEach(emp => {
        const mgr = emp.manager || 'Yöneticisi Belirtilmeyenler';
        if (!mgrMap[mgr]) mgrMap[mgr] = [];
        mgrMap[mgr].push(emp);
      });
    }
    
    return mgrMap;
  }, [data, employees]);

  const managerList = Object.keys(managers).sort();

  const currentData = useMemo(() => {
    return selectedManager ? managers[selectedManager] : [];
  }, [selectedManager, managers]);

  const reportStats = useMemo(() => {
    if (!currentData.length) return null;

    let totalAnnual = 0;
    let totalComp = 0;
    let criticalCount = 0;
    let riskyCount = 0;
    let totalCost = 0;

    currentData.forEach(emp => {
      const remaining = emp.remainingAnnualLeave.totalDays;
      totalAnnual += remaining;
      totalComp += emp.remainingCompensatoryLeave.totalDays;
      
      if (remaining >= settings.criticalLeaveThreshold) criticalCount++;
      if (remaining < settings.riskyNegativeThreshold) riskyCount++;
      
      if (emp.totalEstimatedCost) totalCost += emp.totalEstimatedCost;
    });

    const highestLeave = [...currentData].sort((a, b) => b.remainingAnnualLeave.totalDays - a.remainingAnnualLeave.totalDays).slice(0, 3);
    const lowestLeave = [...currentData].sort((a, b) => a.remainingAnnualLeave.totalDays - b.remainingAnnualLeave.totalDays).slice(0, 3);

    return { totalAnnual, totalComp, criticalCount, riskyCount, totalCost, highestLeave, lowestLeave };
  }, [currentData, settings]);

  const selectedManagerDepts = useMemo(() => {
    if (!selectedManager) return [];
    const manager = employees.find(e => `${e.firstName} ${e.lastName}` === selectedManager);
    return manager?.work?.managedDepartments || [];
  }, [selectedManager, employees]);

  const generateReportText = () => {
    if (!selectedManager || !reportStats) return '';
    
    const date = new Date().toLocaleDateString('tr-TR');
    const deptsText = selectedManagerDepts.length > 0 ? ` (${selectedManagerDepts.join(', ')})` : '';
    
    return `Sayın ${selectedManager},

${date} tarihi itibarıyla biriminize${deptsText} bağlı ${currentData.length} personelin izin durumu aşağıda özetlenmiştir:

• Toplam Yıllık İzin Bakiyesi: ${reportStats.totalAnnual.toFixed(1)} Gün
• Toplam Denkleştirme İzni: ${reportStats.totalComp.toFixed(1)} Gün
• Kritik İzin Seviyesindeki Personel Sayısı (>=${settings.criticalLeaveThreshold} gün): ${reportStats.criticalCount}
• Eksi Bakiyedeki (Riskli) Personel Sayısı: ${reportStats.riskyCount}
• Biriminizin Yaklaşık İzin Maliyet Yükü: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(reportStats.totalCost)}

En Yüksek İzin Bakiyesine Sahip Personeller:
${reportStats.highestLeave.map(e => `- ${e.name}: ${e.remainingAnnualLeave.originalText}`).join('\n')}

Lütfen izin planlamalarınızı bu veriler ışığında değerlendiriniz.

Saygılarımızla,
İnsan Kaynakları`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateReportText());
    alert('Rapor metni kopyalandı.');
  };

  const handlePrint = () => {
    window.print();
  };

  if (data.length === 0) {
    return (
      <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm text-center">
        <p className="text-slate-500 font-medium">Rapor oluşturmak için veri bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Sidebar */}
      <div className="w-full lg:w-80 bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <Users className="w-6 h-6 text-brand-500" /> Birimler
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {managerList.map(mgr => (
            <button
              key={mgr}
              onClick={() => setSelectedManager(mgr)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all text-left ${
                selectedManager === mgr 
                  ? 'bg-brand-50 border border-brand-200 shadow-sm' 
                  : 'bg-slate-50 border border-transparent hover:bg-slate-100'
              }`}
            >
              <div>
                <p className={`text-sm font-bold ${selectedManager === mgr ? 'text-brand-700' : 'text-slate-700'}`}>{mgr}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{managers[mgr].length} Personel</p>
              </div>
              <ChevronRight className={`w-4 h-4 ${selectedManager === mgr ? 'text-brand-500' : 'text-slate-400'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {selectedManager && reportStats ? (
          <>
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{selectedManager}</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Birim İzin Raporu {selectedManagerDepts.length > 0 && `(${selectedManagerDepts.join(', ')})`}
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleCopy}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-all uppercase text-[10px] tracking-widest flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" /> Kopyala
                </button>
                <button 
                  onClick={handlePrint}
                  className="px-4 py-2 bg-brand-50 text-brand-600 font-black rounded-xl hover:bg-brand-100 transition-all uppercase text-[10px] tracking-widest flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Yazdır
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar flex flex-col lg:flex-row gap-8">
              {/* Stats Grid */}
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Toplam Yıllık İzin</p>
                    <p className="text-2xl font-black text-slate-800">{reportStats.totalAnnual.toFixed(1)} Gün</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kritik / Riskli</p>
                    <p className="text-2xl font-black text-amber-500">{reportStats.criticalCount} <span className="text-slate-300">/</span> <span className="text-red-500">{reportStats.riskyCount}</span></p>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">En Yüksek Bakiyeler</h4>
                  <div className="space-y-3">
                    {reportStats.highestLeave.map(emp => (
                      <div key={emp.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-sm font-bold text-slate-700">{emp.name}</span>
                        <span className="text-xs font-black text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">{emp.remainingAnnualLeave.originalText}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Text Template */}
              <div className="flex-1 bg-slate-50 rounded-3xl border border-slate-200 p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Otomatik Rapor Metni</h4>
                </div>
                <textarea 
                  readOnly
                  value={generateReportText()}
                  className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-600 outline-none resize-none custom-scrollbar"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Users className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Birim Seçin</h3>
            <p className="text-slate-500 font-medium max-w-sm">
              Raporunu görüntülemek istediğiniz birim sorumlusunu sol taraftaki listeden seçin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
