import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Search, X, FileSpreadsheet, ExternalLink, Star, AlertCircle, Building2, Phone, Mail } from 'lucide-react';
import { searchMatch } from '../../services/personnelUtils';
import { Employee } from '../../types';
import { istanbulDistricts } from './istanbulPaths';
import * as XLSX from 'xlsx';

interface Props {
  employees: Employee[];
  onDrillDown: (filter: any) => void;
}

export const istanbulGrid = [
  // Europe
  { id: 'silivri', name: 'Silivri', side: 'europe' },
  { id: 'catalca', name: 'Çatalca', side: 'europe' },
  { id: 'buyukcekmece', name: 'Büyükçekmece', side: 'europe' },
  { id: 'arnavutkoy', name: 'Arnavutköy', side: 'europe' },
  { id: 'esenyurt', name: 'Esenyurt', side: 'europe' },
  { id: 'beylikduzu', name: 'Beylikdüzü', side: 'europe' },
  { id: 'basaksehir', name: 'Başakşehir', side: 'europe' },
  { id: 'avcilar', name: 'Avcılar', side: 'europe' },
  { id: 'kucukcekmece', name: 'Küçükçekmece', side: 'europe' },
  { id: 'bakirkoy', name: 'Bakırköy', side: 'europe' },
  { id: 'sultangazi', name: 'Sultangazi', side: 'europe' },
  { id: 'bagcilar', name: 'Bağcılar', side: 'europe' },
  { id: 'esenler', name: 'Esenler', side: 'europe' },
  { id: 'bahcelievler', name: 'Bahçelievler', side: 'europe' },
  { id: 'gungoren', name: 'Güngören', side: 'europe' },
  { id: 'zeytinburnu', name: 'Zeytinburnu', side: 'europe' },
  { id: 'eyupsultan', name: 'Eyüpsultan', side: 'europe' },
  { id: 'gaziosmanpasa', name: 'Gaziosmanpaşa', side: 'europe' },
  { id: 'bayrampasa', name: 'Bayrampaşa', side: 'europe' },
  { id: 'fatih', name: 'Fatih', side: 'europe' },
  { id: 'sariyer', name: 'Sarıyer', side: 'europe' },
  { id: 'kagithane', name: 'Kağıthane', side: 'europe' },
  { id: 'sisli', name: 'Şişli', side: 'europe' },
  { id: 'besiktas', name: 'Beşiktaş', side: 'europe' },
  { id: 'beyoglu', name: 'Beyoğlu', side: 'europe' },
  
  // Asia
  { id: 'beykoz', name: 'Beykoz', side: 'asia' },
  { id: 'uskudar', name: 'Üsküdar', side: 'asia' },
  { id: 'kadikoy', name: 'Kadıköy', side: 'asia' },
  { id: 'umraniye', name: 'Ümraniye', side: 'asia' },
  { id: 'atasehir', name: 'Ataşehir', side: 'asia' },
  { id: 'maltepe', name: 'Maltepe', side: 'asia' },
  { id: 'cekmekoy', name: 'Çekmeköy', side: 'asia' },
  { id: 'sancaktepe', name: 'Sancaktepe', side: 'asia' },
  { id: 'kartal', name: 'Kartal', side: 'asia' },
  { id: 'sile', name: 'Şile', side: 'asia' },
  { id: 'sultanbeyli', name: 'Sultanbeyli', side: 'asia' },
  { id: 'pendik', name: 'Pendik', side: 'asia' },
  { id: 'tuzla', name: 'Tuzla', side: 'asia' },
  { id: 'adalar', name: 'Adalar', side: 'asia' },
];

const normalizeIstanbulDistrict = (address: string): string | null => {
  if (!address) return null;
  const normalized = address.toLowerCase()
    .replace(/i̇/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

  // Exact match first
  for (const district of istanbulGrid) {
    const dNorm = district.name.toLowerCase()
      .replace(/i̇/g, 'i')
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
    
    if (normalized === dNorm) {
      return district.name;
    }
  }

  // Word match
  const words = normalized.split(/[\s,.-/]+/);
  for (const district of istanbulGrid) {
    const dNorm = district.name.toLowerCase()
      .replace(/i̇/g, 'i')
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
    
    if (words.includes(dNorm)) {
      return district.name;
    }
  }

  // Special cases
  if (normalized.includes('eyup')) return 'Eyüpsultan';
  if (normalized.includes('gaziosman')) return 'Gaziosmanpaşa';
  if (normalized.includes('kucukcekmece')) return 'Küçükçekmece';
  if (normalized.includes('buyukcekmece')) return 'Büyükçekmece';

  return null;
};

export const IstanbulMap: React.FC<Props> = React.memo(({ employees, onDrillDown }) => {
  const [hoveredDistrict, setHoveredDistrict] = useState<{ name: string, count: number } | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<{ name: string, employees: Employee[] } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [hqDistrict, setHqDistrict] = useState<string | null>(() => {
    try {
      return localStorage.getItem('hqDistrict');
    } catch (e) {
      return null;
    }
  });
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, district: string } | null>(null);

  const [isOtherCitiesModalOpen, setIsOtherCitiesModalOpen] = useState(false);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const stats = useMemo(() => {
    const districtStats: Record<string, Employee[]> = {};
    const otherCities: Record<string, Employee[]> = {};
    const unknownDistricts: Employee[] = [];
    let europeCount = 0;
    let asiaCount = 0;

    employees.forEach(emp => {
      // For MERKEZ, we look at residence district first, then address
      const address = emp.core?.residenceDistrict || emp.core?.residenceAddress || emp.work?.actualWorkLocation || '';
      
      if (!address) {
        unknownDistricts.push(emp);
        return;
      }

      // Check if it's a known non-Istanbul city
      const isIstanbul = address.toLowerCase().includes('istanbul') || address.toLowerCase().includes('i̇stanbul');
      const districtName = normalizeIstanbulDistrict(address);

      if (districtName) {
        if (!districtStats[districtName]) districtStats[districtName] = [];
        districtStats[districtName].push(emp);

        const districtInfo = istanbulGrid.find(d => d.name === districtName);
        if (districtInfo?.side === 'europe') europeCount++;
        if (districtInfo?.side === 'asia') asiaCount++;
      } else if (isIstanbul) {
        unknownDistricts.push(emp);
      } else {
        // Assume it's another city, try to extract city name or just use the whole address if short
        const city = address.split(/[,.-]/)[0].trim();
        const displayCity = city.length < 20 ? city : 'Diğer Şehirler';
        if (!otherCities[displayCity]) otherCities[displayCity] = [];
        otherCities[displayCity].push(emp);
      }
    });

    const totalKnown = europeCount + asiaCount;
    const europePercent = totalKnown > 0 ? Math.round((europeCount / totalKnown) * 100) : 0;
    const asiaPercent = totalKnown > 0 ? Math.round((asiaCount / totalKnown) * 100) : 0;

    return { districtStats, otherCities, unknownDistricts, europePercent, asiaPercent, totalKnown };
  }, [employees]);

  const getColor = (count: number) => {
    if (count === 0) return '#f8fafc'; // slate-50
    if (count <= 5) return '#e0e7ff'; // indigo-100
    if (count <= 15) return '#818cf8'; // indigo-400
    if (count <= 30) return '#4f46e5'; // indigo-600
    return '#312e81'; // indigo-900
  };

  const filteredSelectedEmployees = useMemo(() => {
    if (!selectedDistrict) return [];
    const filtered = !searchTerm ? selectedDistrict.employees : selectedDistrict.employees.filter(e => 
      searchMatch(e.core?.name || '', searchTerm) ||
      searchMatch(e.work?.department || '', searchTerm) ||
      searchMatch(e.work?.title || '', searchTerm)
    );

    return [...filtered].sort((a, b) => (a.core?.name || '').localeCompare(b.core?.name || '', 'tr'));
  }, [selectedDistrict, searchTerm]);

  const handleExport = () => {
    if (!selectedDistrict) return;
    const exportData = selectedDistrict.employees.map(emp => ({
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
    XLSX.utils.book_append_sheet(workbook, worksheet, `${selectedDistrict.name}_Personelleri`);
    XLSX.writeFile(workbook, `ik360_${selectedDistrict.name}_Personelleri_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleContextMenu = (e: React.MouseEvent, districtName: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, district: districtName });
  };

  const setHeadquarters = (districtName: string) => {
    setHqDistrict(districtName);
    localStorage.setItem('hqDistrict', districtName);
    setContextMenu(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-6"
    >
      {/* Main Map Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">GENEL MERKEZ PERSONEL İKAMET DAĞILIMI</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">İSTANBUL İLÇE BAZLI PERSONEL İKAMET HARİTASI</p>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Europe/Asia Ratio */}
            {stats.totalKnown > 0 && (
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avrupa</span>
                  <span className="text-sm font-black text-indigo-600">%{stats.europePercent}</span>
                </div>
                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-indigo-500" style={{ width: `${stats.europePercent}%` }} />
                  <div className="h-full bg-emerald-500" style={{ width: `${stats.asiaPercent}%` }} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asya</span>
                  <span className="text-sm font-black text-emerald-600">%{stats.asiaPercent}</span>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs font-bold text-slate-500 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-md bg-slate-50 border border-slate-200"></div>0</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-md bg-indigo-100"></div>1-5</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-md bg-indigo-400"></div>6-15</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-md bg-indigo-600"></div>16-30</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-md bg-indigo-900"></div>30+</div>
            </div>
          </div>
        </div>

        <div className="relative w-full overflow-x-auto bg-slate-50/30 p-8 flex justify-center" onMouseMove={handleMouseMove}>
          <svg
            viewBox="0 0 1000 600"
            className="w-full max-w-[1000px] h-auto drop-shadow-sm"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' }}
          >
            <g>
              {[...istanbulDistricts].sort((a, b) => {
                const getZIndex = (districtName: string) => {
                  if (hoveredDistrict?.name === districtName) return 3;
                  if (hqDistrict === districtName) return 2;
                  if (selectedDistrict?.name === districtName) return 1;
                  return 0;
                };
                return getZIndex(a.name) - getZIndex(b.name);
              }).map((district) => {
                const count = stats.districtStats[district.name]?.length || 0;
                const isHovered = hoveredDistrict?.name === district.name;
                const isSelected = selectedDistrict?.name === district.name;
                const isHq = hqDistrict === district.name;
                
                const [cx, cy] = district.centroid;

                return (
                  <g 
                    key={district.name} 
                    className="cursor-pointer transition-transform duration-200"
                    onMouseEnter={() => setHoveredDistrict({ name: district.name, count })}
                    onMouseLeave={() => setHoveredDistrict(null)}
                    onClick={() => {
                      if (count > 0) {
                        setSelectedDistrict({ name: district.name, employees: stats.districtStats[district.name] });
                      }
                    }}
                    onContextMenu={(e) => handleContextMenu(e, district.name)}
                    style={{
                      transformOrigin: `${cx}px ${cy}px`,
                      transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                    }}
                  >
                    <path 
                      d={district.path}
                      fill={getColor(count)}
                      stroke={isHovered || isSelected || isHq ? '#1e1b4b' : '#cbd5e1'}
                      strokeWidth={isHovered || isSelected ? 1.5 : isHq ? 2 : 1}
                      className="transition-colors duration-200"
                    />

                    {/* HQ Star */}
                    {isHq && (
                      <g transform={`translate(${cx - 10}, ${cy - 18})`}>
                        <circle cx="10" cy="10" r="10" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }} />
                        <path d="M10 2l2.4 5.4 5.6.5-4.2 3.8 1.2 5.3-4.8-2.8-4.8 2.8 1.2-5.3-4.2-3.8 5.6-.5z" fill="white" transform="scale(0.6) translate(6, 6)" />
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Other Cities Button (Bottom Left) */}
          {(Object.keys(stats.otherCities).length > 0 || stats.unknownDistricts.length > 0) && (
            <div className="absolute bottom-6 left-6 z-20">
              <button
                onClick={() => setIsOtherCitiesModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">İstanbul Dışı</span>
                  <span className="text-xs font-bold">İkametleri Görüntüle</span>
                </div>
              </button>
            </div>
          )}

          {/* Custom Tooltip */}
          {typeof document !== 'undefined' && createPortal(
            <AnimatePresence>
              {hoveredDistrict && (
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
                  <span className="text-sm font-black tracking-tight">{hoveredDistrict.name}</span>
                  <div className="flex items-center gap-2 text-indigo-300">
                    <MapPin className="w-3 h-3" />
                    <span className="text-xs font-bold">{hoveredDistrict.count} Personel</span>
                  </div>
                  {hqDistrict === hoveredDistrict.name && (
                    <div className="flex items-center gap-1.5 text-amber-400 mt-1">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Genel Merkez</span>
                    </div>
                  )}
                  <div className="text-[9px] text-slate-400 mt-1 italic">Sağ tık: Merkez belirle</div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}

          {/* Context Menu */}
          {typeof document !== 'undefined' && createPortal(
            <AnimatePresence>
              {contextMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed z-[9999] bg-white rounded-xl shadow-xl border border-slate-200 py-2 min-w-[200px]"
                  style={{ left: contextMenu.x, top: contextMenu.y }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{contextMenu.district}</span>
                  </div>
                  <button
                    onClick={() => setHeadquarters(contextMenu.district)}
                    className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 transition-colors"
                  >
                    <Building2 className="w-4 h-4" />
                    Genel Merkez Olarak Belirle
                  </button>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}
        </div>
      </div>


      {/* Other Cities Modal */}
      <AnimatePresence>
        {isOtherCitiesModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
              onClick={() => setIsOtherCitiesModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-[15%] bottom-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[800px] bg-white rounded-[2.5rem] shadow-2xl z-[60] flex flex-col overflow-hidden border border-slate-200"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                    <ExternalLink className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">İSTANBUL DIŞI İKAMETLER</h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Şehir ve belirlenemeyen adres dağılımı</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOtherCitiesModalOpen(false)}
                  className="w-12 h-12 rounded-2xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {/* Other Cities Grid */}
                {Object.keys(stats.otherCities).length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                      <MapPin className="w-3 h-3" /> Şehir Bazlı Dağılım
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {Object.entries(stats.otherCities).map(([loc, emps]) => (
                        <button 
                          key={loc}
                          onClick={() => {
                            setIsOtherCitiesModalOpen(false);
                            setSelectedDistrict({ name: loc, employees: emps });
                          }}
                          className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left group shadow-sm hover:shadow-md"
                        >
                          <div className="text-sm font-black text-slate-700 group-hover:text-indigo-700 truncate">{loc}</div>
                          <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{emps.length} Personel</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unknown Districts */}
                {stats.unknownDistricts.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest border-b border-amber-100 pb-2 flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" /> İlçesi Belirlenemeyenler
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {stats.unknownDistricts.map((emp, index) => (
                        <button 
                          key={`${emp.id}-${index}`}
                          onClick={() => {
                            setIsOtherCitiesModalOpen(false);
                            onDrillDown({ type: 'employee', id: emp.id });
                          }}
                          className="p-4 rounded-2xl border border-amber-100 bg-amber-50/30 hover:bg-amber-50 hover:border-amber-200 transition-all text-left group"
                        >
                          <div className="text-sm font-black text-slate-700 group-hover:text-amber-700">{emp.core?.name}</div>
                          <div className="text-[10px] text-slate-500 mt-1 line-clamp-1 font-medium" title={emp.core?.residenceAddress || emp.work?.actualWorkLocation}>
                            {emp.core?.residenceAddress || emp.work?.actualWorkLocation || 'Adres bilgisi yok'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Toplam {Object.values(stats.otherCities).flat().length + stats.unknownDistricts.length} Kayıt Listeleniyor
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Drill Down Modal */}
      <AnimatePresence>
        {selectedDistrict && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
              onClick={() => setSelectedDistrict(null)}
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
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">{selectedDistrict.name}</h2>
                    <p className="text-sm font-medium text-slate-500">{selectedDistrict.employees.length} Personel</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedDistrict(null)}
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
                          <th className="px-4 py-3 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">Ünvan</th>
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
                            <td className="px-4 py-3 text-xs font-bold text-slate-600">{emp.work?.title}</td>
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
                                  setSelectedDistrict(null);
                                  onDrillDown({ type: 'employee', id: emp.id });
                                }}
                                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm inline-flex"
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
    </motion.div>
  );
});
