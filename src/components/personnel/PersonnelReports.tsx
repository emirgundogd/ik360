import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Filter, 
  Search, 
  FileSpreadsheet,
  Users
} from 'lucide-react';
import { Employee, LocationRecord } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { calculateSeniority, formatSeniority, searchMatch } from '../../services/personnelUtils';
import { GENDERS, INSURANCE_TYPES, EMPLOYMENT_TYPES, EDUCATION_LEVELS } from '../../constants/personnelConstants';
import * as XLSX from 'xlsx';

interface Props {
  employees: Employee[];
  departments: string[];
  titles: string[];
  locations: LocationRecord[];
  onExport: () => void;
  salaryHistory?: any[];
  leaveHistory?: any[];
  config?: any;
}

export const PersonnelReports: React.FC<Props> = ({ 
  employees, 
  departments, 
  titles, 
  locations, 
  onExport,
  salaryHistory,
  leaveHistory,
  config
}) => {
  const [filters, setFilters] = useState({
    department: '',
    title: '',
    location: '',
    status: 'active',
    employmentType: '',
    workLocationType: '',
    retirementStatus: '',
    gender: '',
    education: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  const handleLocalExport = () => {
    const exportData = filteredData.map((emp, index) => ({
      'No': index + 1,
      'Ad Soyad': emp.core?.name || emp.name || '',
      'TCKN': emp.core?.tcNo || emp.tcNo || '',
      'Telefon': emp.core?.phone || '',
      'E-Posta': emp.core?.email || '',
      'Departman': emp.work?.department || emp.department || '',
      'Ünvan': emp.work?.title || emp.title || '',
      'Lokasyon': emp.work?.actualWorkLocation || '',
      'İşe Giriş Tarihi': emp.work?.hireDate || emp.hireDate || '',
      'Kıdem': formatSeniority(calculateSeniority(emp.work?.hireDate || emp.hireDate || new Date().toISOString())),
      'Net Maaş': emp.wage?.netSalary || emp.salary || 0,
      'Çalışma Şekli': emp.work?.employmentType || 'Tam Zamanlı',
      'Durum': emp.work?.terminationDate ? 'İşten Ayrıldı' : 'Aktif'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Personel_Raporu');
    
    // Auto-size columns
    const maxWidths = Object.keys(exportData[0] || {}).map(key => {
      const headerLen = key.length;
      const maxContentLen = exportData.reduce((max, row) => {
        const val = String((row as any)[key]);
        return Math.max(max, val.length);
      }, 0);
      return Math.max(headerLen, maxContentLen) + 2;
    });
    
    worksheet['!cols'] = maxWidths.map(w => ({ wch: w }));

    XLSX.writeFile(workbook, `IK360_Rapor_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredData = useMemo(() => {
    const filtered = employees.filter(emp => {
      if (emp.isDeleted) return false;
      
      const empName = emp.core?.name || emp.name || '';
      const empTcNo = emp.core?.tcNo || emp.tcNo || '';
      const empDept = emp.work?.department || emp.department || '';
      const empTitle = emp.work?.title || '';
      const empLocation = emp.work?.actualWorkLocation || '';
      const empEmploymentType = emp.work?.employmentType || '';
      const empWorkLocationType = emp.work?.workLocationType || '';
      const empRetirementStatus = emp.work?.retirementStatus || '';
      const empGender = emp.core?.gender || '';
      const empEducation = emp.core?.education || '';

      const empTerminationDate = emp.work?.terminationDate;

      const matchesSearch = 
        searchMatch(empName, searchTerm) ||
        empTcNo.includes(searchTerm);
        
      const matchesDept = !filters.department || empDept === filters.department;
      const matchesTitle = !filters.title || empTitle === filters.title;
      const matchesLocation = !filters.location || empLocation === filters.location;
      const matchesStatus = 
        filters.status === 'all' || 
        (filters.status === 'active' && !empTerminationDate) || 
        (filters.status === 'passive' && !!empTerminationDate);
      const matchesEmployment = !filters.employmentType || empEmploymentType === filters.employmentType;
      const matchesWorkType = !filters.workLocationType || empWorkLocationType === filters.workLocationType;
      const matchesRetirement = !filters.retirementStatus || empRetirementStatus === filters.retirementStatus;
      const matchesGender = !filters.gender || empGender === filters.gender;
      const matchesEducation = !filters.education || empEducation === filters.education;
      
      return matchesSearch && matchesDept && matchesTitle && matchesLocation && matchesStatus && matchesEmployment && matchesWorkType && matchesRetirement && matchesGender && matchesEducation;
    });

    return [...filtered].sort((a, b) => (a.core?.name || '').localeCompare(b.core?.name || '', 'tr'));
  }, [employees, searchTerm, filters]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-brand-500" /> Personel Raporları
          </h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Gelişmiş filtreleme ve dışa aktarma</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-1 md:flex-none px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 ${showFilters ? 'bg-brand-50 border-brand-200 text-brand-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <Filter className="w-4 h-4" /> Filtreler
          </button>
          <button 
            onClick={handleLocalExport}
            className="flex-1 md:flex-none px-8 py-3 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all uppercase text-xs tracking-widest shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel'e Aktar
          </button>
        </div>
      </div>

      {/* Results Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="lg:col-span-1 space-y-6 overflow-hidden"
            >
              <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Arama</h4>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="İsim veya TCKN..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Organizasyon</h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Departman</label>
                      <select 
                        value={filters.department}
                        onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="">Tümü</option>
                        {[...departments].sort((a, b) => a.localeCompare(b)).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ünvan</label>
                      <select 
                        value={filters.title}
                        onChange={(e) => setFilters(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="">Tümü</option>
                        {[...titles].sort((a, b) => a.localeCompare(b)).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lokasyon</label>
                      <select 
                        value={filters.location}
                        onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="">Tümü</option>
                        {[...locations].sort((a, b) => a.name.localeCompare(b.name)).map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Durum</label>
                      <select 
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="all">Tümü</option>
                        <option value="active">Aktif</option>
                        <option value="passive">Pasif</option>
                        <option value="terminated">İşten Ayrıldı</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Çalışma Şekli</label>
                      <select 
                        value={filters.employmentType}
                        onChange={(e) => setFilters(prev => ({ ...prev, employmentType: e.target.value }))}
                        className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="">Tümü</option>
                        {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Merkez/Saha</label>
                      <select 
                        value={filters.workLocationType}
                        onChange={(e) => setFilters(prev => ({ ...prev, workLocationType: e.target.value }))}
                        className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="">Tümü</option>
                        <option value="HQ">Merkez</option>
                        <option value="FIELD">Saha</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sigorta Türü</label>
                      <select 
                        value={filters.retirementStatus}
                        onChange={(e) => setFilters(prev => ({ ...prev, retirementStatus: e.target.value }))}
                        className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="">Tümü</option>
                        {INSURANCE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Kişisel Bilgiler</h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cinsiyet</label>
                      <select 
                        value={filters.gender}
                        onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="">Tümü</option>
                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mezuniyet</label>
                      <select 
                        value={filters.education}
                        onChange={(e) => setFilters(prev => ({ ...prev, education: e.target.value }))}
                        className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="">Tümü</option>
                        {EDUCATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setFilters({ department: '', title: '', location: '', status: 'active', employmentType: '', workLocationType: '', retirementStatus: '', gender: '', education: '' })}
                  className="w-full py-3 bg-slate-100 text-slate-500 font-black rounded-xl hover:bg-slate-200 transition-all uppercase text-[10px] tracking-widest"
                >
                  Filtreleri Temizle
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Area */}
        <div className={`${showFilters ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-6`}>
          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto max-h-[800px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 bg-slate-50 z-10 w-12 text-center">No</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 bg-slate-50 z-10">Personel</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 bg-slate-50 z-10">İletişim</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 bg-slate-50 z-10">Organizasyon</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 bg-slate-50 z-10">Giriş/Kıdem</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 bg-slate-50 z-10">Maaş Bilgisi</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 bg-slate-50 z-10">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.map((emp, index) => {
                    const empName = emp.core?.name || emp.name || '';
                    const empTcNo = emp.core?.tcNo || emp.tcNo || '';
                    const empPhone = emp.core?.phone || '';
                    const empEmail = emp.core?.email || '';
                    const empDept = emp.work?.department || emp.department || '';
                    const empTitle = emp.work?.title || emp.title || '';
                    const empLocation = emp.work?.actualWorkLocation || '';
                    const empHireDate = emp.work?.hireDate || emp.hireDate || new Date().toISOString();
                    const empNetSalary = emp.wage?.netSalary || emp.salary || 0;
                    const empIsActive = emp.system?.isActive ?? emp.isActive ?? true;
                    const empTerminationDate = emp.work?.terminationDate || emp.terminationDate;

                    return (
                    <tr key={`${emp.id}-${index}`} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 text-center">
                        <span className="text-[10px] font-black text-slate-400">{index + 1}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800">{empName}</span>
                          <span className="text-[10px] font-bold text-slate-400 tracking-wider">{empTcNo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-600">{empPhone || '-'}</span>
                          <span className="text-[10px] font-medium text-slate-400">{empEmail || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{empDept}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{empTitle}</span>
                          <span className="text-[10px] font-medium text-slate-400 italic">{empLocation}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-600">{new Date(empHireDate).toLocaleDateString('tr-TR')}</span>
                          <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">{formatSeniority(calculateSeniority(empHireDate))}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(empNetSalary)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{emp.work?.employmentType || 'Tam Zamanlı'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-block ${
                          empTerminationDate 
                            ? 'bg-orange-50 text-orange-600 border border-orange-100' 
                            : empIsActive 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                              : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          {empTerminationDate ? 'İşten Ayrıldı' : empIsActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                    </tr>
                  )})}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-32 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-300">
                          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <Users className="w-10 h-10 opacity-20" />
                          </div>
                          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Filtrelere uygun kayıt bulunamadı</p>
                          <p className="text-xs font-bold text-slate-300 mt-2">Lütfen filtrelerinizi kontrol edin veya aramayı temizleyin.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50/50 p-8 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Toplam <span className="text-brand-600">{filteredData.length}</span> Personel
                  </p>
                </div>
                <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Aktif <span className="text-emerald-600">{filteredData.filter(e => (e.system?.isActive ?? e.isActive ?? true) && !e.work?.terminationDate).length}</span>
                  </p>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 italic">
                Son Güncelleme: {new Date().toLocaleDateString('tr-TR')} {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
