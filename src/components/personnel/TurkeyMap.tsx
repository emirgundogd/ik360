import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Search, X, FileSpreadsheet, ExternalLink, Phone, Mail, Users } from 'lucide-react';
import { searchMatch } from '../../services/personnelUtils';
import { Employee } from '../../types';
import { turkeyCities } from './turkeyCities';
import * as XLSX from 'xlsx';

interface Props {
  employees: Employee[];
  onDrillDown: (filter: any) => void;
}

const normalizeCity = (city: string): string => {
  if (!city) return '';
  const trimmed = city.trim().toLowerCase();
  
  const map: Record<string, string> = {
    'sanliurfa': 'Şanlıurfa',
    'urfa': 'Şanlıurfa',
    'kahramanmaras': 'Kahramanmaraş',
    'k.maras': 'Kahramanmaraş',
    'maras': 'Kahramanmaraş',
    'afyon': 'Afyonkarahisar',
    'izmit': 'Kocaeli',
    'icel': 'Mersin',
    'sanli urfa': 'Şanlıurfa',
    'k. maraş': 'Kahramanmaraş',
    'istanbul': 'İstanbul',
    'izmir': 'İzmir',
    'ankara': 'Ankara',
  };

  if (map[trimmed]) return map[trimmed];
  
  const normalized = trimmed
    .replace(/i̇/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

  const found = turkeyCities.find(c => {
    const cNorm = c.city.toLowerCase()
      .replace(/i̇/g, 'i')
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
    return cNorm === normalized;
  });

  return found ? found.city : city;
};

export const TurkeyMap: React.FC<Props> = React.memo(({ employees, onDrillDown }) => {
  const [hoveredCity, setHoveredCity] = useState<{ name: string, count: number } | null>(null);
  const [selectedCity, setSelectedCity] = useState<{ name: string, employees: Employee[] } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOtherLocationsModal, setShowOtherLocationsModal] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const cityStats = useMemo(() => {
    const stats: Record<string, Employee[]> = {};
    const others: Record<string, Employee[]> = {};

    employees.forEach(emp => {
      const rawLoc = emp.work?.actualWorkLocation || 'Belirtilmemiş';
      const normalized = normalizeCity(rawLoc);
      
      const isTurkishCity = turkeyCities.some(c => c.city === normalized);
      
      if (isTurkishCity) {
        if (!stats[normalized]) stats[normalized] = [];
        stats[normalized].push(emp);
      } else {
        if (!others[rawLoc]) others[rawLoc] = [];
        others[rawLoc].push(emp);
      }
    });

    return { stats, others };
  }, [employees]);

  const getColor = (count: number) => {
    if (count === 0) return '#f1f5f9'; // slate-100
    if (count < 5) return '#e0e7ff'; // indigo-100
    if (count < 15) return '#818cf8'; // indigo-400
    if (count < 50) return '#4f46e5'; // indigo-600
    return '#312e81'; // indigo-900
  };

  const filteredSelectedEmployees = useMemo(() => {
    if (!selectedCity) return [];
    const filtered = !searchTerm ? selectedCity.employees : selectedCity.employees.filter(e => 
      searchMatch(e.core?.name || '', searchTerm) ||
      searchMatch(e.work?.department || '', searchTerm) ||
      searchMatch(e.work?.title || '', searchTerm)
    );

    return [...filtered].sort((a, b) => (a.core?.name || '').localeCompare(b.core?.name || '', 'tr'));
  }, [selectedCity, searchTerm]);

  const handleExport = () => {
    if (!selectedCity) return;
    const exportData = selectedCity.employees.map(emp => ({
      'Ad Soyad': emp.core.name,
      'TCKN': emp.core.tcNo,
      'İşe Giriş Tarihi': emp.work.hireDate,
      'Departman': emp.work.department,
      'Ünvan': emp.work.title,
      'Fiili Görev Yeri': emp.work.actualWorkLocation,
      'İkamet Adresi': emp.core.residenceAddress,
      'Net Maaş': emp.wage.netSalary,
      'Kısmi/Tam Zamanlı': emp.work.employmentType,
      'Emekli Durumu': emp.work.retirementStatus,
      'Cinsiyet': emp.core.gender,
      'Mezuniyet': emp.core.education,
      'Kalan Yıllık İzin': emp.leave.remainingAnnualLeaveDays,
      'İkamet İli': emp.core.residenceCity || '',
      'İkamet İlçesi': emp.core.residenceDistrict || '',
      'Çıkış Tarihi': emp.work.terminationDate || '',
      'Çıkış Kodu': emp.work.terminationCode || '',
      'Aktif mi?': emp.work.terminationDate ? 'İşten Ayrıldı' : emp.system.isActive ? 'Evet' : 'Hayır'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${selectedCity.name}_Personelleri`);
    XLSX.writeFile(workbook, `ik360_${selectedCity.name}_Personelleri_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">Saha Personel Dağılımı</h3>
            <p className="text-sm text-slate-500 font-medium mt-1 uppercase">FİİLİ GÖREV YERİNE GÖRE TÜRKİYE HARİTASI</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 md:mt-0">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200"></div>Personel Yok</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-100"></div>1-5</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-400"></div>5-15</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-600"></div>15-50</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-900"></div>50+</div>
          </div>
        </div>

        <div className="relative w-full aspect-[2.2] bg-slate-50/30 p-8" onMouseMove={handleMouseMove}>
          <svg
            viewBox="0 0 1007 443"
            className="w-full h-full drop-shadow-sm"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' }}
          >
            <g>
              {turkeyCities.map((cityData) => {
                const count = cityStats.stats[cityData.city]?.length || 0;
                const isHovered = hoveredCity?.name === cityData.city;
                const isSelected = selectedCity?.name === cityData.city;

                return (
                  <path
                    key={cityData.plate}
                    d={cityData.draw}
                    fill={getColor(count)}
                    stroke={isHovered || isSelected ? '#1e1b4b' : '#cbd5e1'}
                    strokeWidth={isHovered || isSelected ? 2 : 1}
                    className="transition-all duration-200 cursor-pointer outline-none"
                    onMouseEnter={() => setHoveredCity({ name: cityData.city, count })}
                    onMouseLeave={() => setHoveredCity(null)}
                    onClick={() => {
                      if (count > 0) {
                        setSelectedCity({ name: cityData.city, employees: cityStats.stats[cityData.city] });
                      }
                    }}
                    style={{
                      transformOrigin: 'center',
                      transform: isHovered ? 'scale(1.001)' : 'scale(1)',
                    }}
                  />
                );
              })}
            </g>
          </svg>

          {/* Harita Dışı Lokasyonlar Butonu */}
          {Object.keys(cityStats.others).length > 0 && (
            <div className="absolute bottom-8 right-8 z-20">
              <button
                onClick={() => setShowOtherLocationsModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">HARİTA DIŞI</p>
                  <p className="text-xs font-bold uppercase tracking-tight">LOKASYONLARI GÖRÜNTÜLE</p>
                </div>
                <div className="ml-1 px-2 py-0.5 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 group-hover:bg-indigo-200 group-hover:text-indigo-700 transition-colors">
                  {Object.keys(cityStats.others).length}
                </div>
              </button>
            </div>
          )}

          {/* Custom Tooltip */}
          {hoveredCity && typeof document !== 'undefined' && createPortal(
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="fixed z-[9999] pointer-events-none bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700/50 flex flex-col gap-1 min-w-[140px]"
                style={{
                  left: tooltipPos.x + 15,
                  top: tooltipPos.y + 15,
                }}
              >
                <span className="text-sm font-black tracking-tight uppercase">{hoveredCity.name}</span>
                <div className="flex items-center gap-2 text-indigo-300">
                  <MapPin className="w-3 h-3" />
                  <span className="text-xs font-bold uppercase">{hoveredCity.count} Personel</span>
                </div>
              </motion.div>
            </AnimatePresence>,
            document.body
          )}
        </div>
      </div>

      {/* Harita Dışı Lokasyonlar Modalı */}
      <AnimatePresence>
        {showOtherLocationsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">HARİTA DIŞI LOKASYONLAR</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Sistemde tanımlı ancak haritada yer almayan bölgeler</p>
                </div>
                <button 
                  onClick={() => setShowOtherLocationsModal(false)}
                  className="p-3 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(cityStats.others).map(([loc, emps]) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setSelectedCity({ name: loc, employees: emps });
                        setShowOtherLocationsModal(false);
                      }}
                      className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-brand-200 hover:bg-brand-50 transition-all text-left group flex justify-between items-center"
                    >
                      <div>
                        <p className="text-sm font-black text-slate-700 group-hover:text-brand-600 uppercase tracking-tight">{loc}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{emps.length} PERSONEL</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-100 group-hover:border-brand-200 group-hover:scale-110 transition-all">
                        <Users className="w-5 h-5 text-slate-300 group-hover:text-brand-500" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setShowOtherLocationsModal(false)}
                  className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all uppercase text-xs tracking-widest shadow-lg shadow-slate-900/20"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Drill Down Modal */}
      <AnimatePresence>
        {selectedCity && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
              onClick={() => setSelectedCity(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="fixed inset-x-4 bottom-4 top-24 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[900px] bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden border border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">{selectedCity.name}</h2>
                    <p className="text-sm font-medium text-slate-500">{selectedCity.employees.length} Personel</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCity(null)}
                  className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-white">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Personel, departman veya ünvan ara..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel'e Aktar
                </button>
              </div>

              <div className="flex-1 overflow-auto bg-slate-50/30 p-4">
                {filteredSelectedEmployees.length > 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">Personel</th>
                          <th className="px-4 py-3 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">Departman</th>
                          <th className="px-4 py-3 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">İletişim</th>
                          <th className="px-4 py-3 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">İkamet Adresi</th>
                          <th className="px-4 py-3 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSelectedEmployees.map((emp, index) => (
                          <tr key={`${emp.id}-${index}`} className="group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-800">{emp.core?.name}</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-tighter font-medium">{emp.core?.tcNo}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs font-bold text-slate-600">{emp.work?.department}</td>
                            <td className="px-4 py-3 text-xs font-medium text-slate-500">
                              <div className="flex flex-col gap-1">
                                {emp.core?.phone && (
                                  <div className="flex items-center gap-1.5">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span>{emp.core.phone}</span>
                                  </div>
                                )}
                                {emp.core?.email && (
                                  <div className="flex items-center gap-1.5">
                                    <Mail className="w-3 h-3 text-slate-400" />
                                    <span className="truncate max-w-[150px]" title={emp.core.email}>{emp.core.email}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs font-medium text-slate-500 max-w-[200px] truncate" title={emp.core?.residenceAddress}>
                              {emp.core?.residenceAddress || '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button 
                                onClick={() => {
                                  setSelectedCity(null);
                                  onDrillDown({ type: 'employee', id: emp.id });
                                }}
                                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Search className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm font-bold">Arama kriterlerine uygun personel bulunamadı.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});
