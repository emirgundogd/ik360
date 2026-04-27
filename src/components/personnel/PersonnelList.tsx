import React, { useState, useMemo, useEffect } from 'react';
import { compareValues } from '../../utils';
import { 
  Search, 
  Filter, 
  Download, 
  Upload,
  Edit2, 
  Trash2, 
  ChevronDown, 
  Columns,
  Check,
  X,
  Plus,
  ArrowUpDown,
  Save,
  Play
} from 'lucide-react';
import { Employee, LocationRecord, ColumnConfig, AdvancedFilter, User, ImportRecord } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { calculateSeniority, formatSeniority, searchMatch } from '../../services/personnelUtils';
import { PersonnelImport } from './PersonnelImport';

interface Props {
  employees: Employee[];
  departments: string[];
  titles: string[];
  locations: LocationRecord[];
  advancedFilters: AdvancedFilter[];
  importHistory: ImportRecord[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  onExport: () => void;
  onUndoImport: (id: string) => void;
  onApplyImport: (data: any[], errors: string[]) => void;
  onUpdateAdvancedFilters: (filters: AdvancedFilter[]) => void;
  user: User | null;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'name', label: 'Ad Soyad', width: 200, visible: true, order: 0 },
  { id: 'tcNo', label: 'TCKN', width: 120, visible: true, order: 1 },
  { id: 'department', label: 'Departman', width: 150, visible: true, order: 2 },
  { id: 'title', label: 'Ünvan', width: 150, visible: true, order: 3 },
  { id: 'hireDate', label: 'Giriş Tarihi', width: 120, visible: true, order: 4 },
  { id: 'seniority', label: 'Kıdem', width: 150, visible: true, order: 5 },
  { id: 'actualWorkLocation', label: 'Lokasyon', width: 150, visible: true, order: 6 },
  { id: 'netSalary', label: 'Net Maaş', width: 120, visible: true, order: 7 },
  { id: 'isActive', label: 'Durum', width: 100, visible: true, order: 8 },
];

export const PersonnelList: React.FC<Props> = ({ 
  employees, departments, titles, locations, advancedFilters, importHistory,
  onView, onEdit, onDelete, onAddNew, onExport, onUndoImport, onApplyImport, onUpdateAdvancedFilters, user
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    title: '',
    location: '',
    status: 'active', // active, passive, all
    employmentType: '',
    workLocationType: '',
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [activeAdvancedFilterId, setActiveAdvancedFilterId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    try {
      const saved = localStorage.getItem('PERSONNEL_LIST_COLUMNS');
      return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    } catch (e) {
      return DEFAULT_COLUMNS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('PERSONNEL_LIST_COLUMNS', JSON.stringify(columns));
    } catch (e) {
      console.error('Failed to save columns', e);
    }
  }, [columns]);

  const filteredEmployees = useMemo(() => {
    let result = employees.filter(emp => {
      if (emp.isDeleted) return false;
      
      const matchesSearch = 
        searchMatch(emp.core?.name || '', searchTerm) ||
        (emp.core?.tcNo || '').includes(searchTerm);
        
      const empDept = emp.work?.department || emp.department;
      const empTitle = emp.work?.title || emp.title;
      const empLocation = emp.work?.actualWorkLocation || emp.actualWorkLocation;
      const empWorkLocationType = emp.work?.workLocationType || emp.workLocationType;
      const empEmploymentType = emp.work?.employmentType || emp.employmentType;
      const empTerminationDate = emp.work?.terminationDate || emp.terminationDate;

      const matchesDept = !filters.department || empDept === filters.department;
      const matchesTitle = !filters.title || empTitle === filters.title;
      const matchesLocation = !filters.location || empLocation === filters.location;
      const matchesStatus = 
        filters.status === 'all' || 
        (filters.status === 'active' && !empTerminationDate) || 
        (filters.status === 'passive' && !!empTerminationDate);
      const matchesEmployment = !filters.employmentType || empEmploymentType === filters.employmentType;
      const matchesWorkType = !filters.workLocationType || empWorkLocationType === filters.workLocationType;
      
      return matchesSearch && matchesDept && matchesTitle && matchesLocation && matchesStatus && matchesEmployment && matchesWorkType;
    });

    // Apply advanced filter if active
    if (activeAdvancedFilterId) {
      const advFilter = advancedFilters.find(f => f.id === activeAdvancedFilterId);
      if (advFilter) {
        result = result.filter(emp => {
          return advFilter.conditions.every(cond => {
            let val: any;
            // Map field to layered structure
            if (cond.field === 'netSalary') val = emp.wage?.netSalary;
            else if (cond.field === 'department') val = emp.work?.department;
            else if (cond.field === 'hireDate') val = emp.work?.hireDate;
            else if (cond.field === 'isActive') val = emp.system?.isActive;
            else if (cond.field === 'retirementStatus') val = emp.work?.retirementStatus;
            else if (cond.field === 'terminationDate') val = emp.work?.terminationDate;
            else val = (emp as any)[cond.field];

            switch (cond.operator) {
              case 'equals': return val === cond.value;
              case 'contains': return String(val).toLowerCase().includes(String(cond.value).toLowerCase());
              case 'gt': return Number(val) > Number(cond.value);
              case 'lt': return Number(val) < Number(cond.value);
              case 'gte': return Number(val) >= Number(cond.value);
              case 'lte': return Number(val) <= Number(cond.value);
              case 'notEmpty': return val !== null && val !== undefined && val !== '';
              default: return true;
            }
          });
        });
      }
    }

    // Sort
    return result.sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      if (sortConfig.key === 'name') {
        aVal = a.core?.name || '';
        bVal = b.core?.name || '';
      } else if (sortConfig.key === 'tcNo') {
        aVal = a.core?.tcNo || '';
        bVal = b.core?.tcNo || '';
      } else if (sortConfig.key === 'department') {
        aVal = a.work?.department || '';
        bVal = b.work?.department || '';
      } else if (sortConfig.key === 'title') {
        aVal = a.work?.title || '';
        bVal = b.work?.title || '';
      } else if (sortConfig.key === 'hireDate' || sortConfig.key === 'seniority') {
        aVal = a.work?.hireDate || '';
        bVal = b.work?.hireDate || '';
      } else if (sortConfig.key === 'actualWorkLocation') {
        aVal = a.work?.actualWorkLocation || '';
        bVal = b.work?.actualWorkLocation || '';
      } else if (sortConfig.key === 'netSalary') {
        aVal = a.wage?.netSalary || 0;
        bVal = b.wage?.netSalary || 0;
      } else if (sortConfig.key === 'isActive') {
        aVal = a.system?.isActive ? 1 : 0;
        bVal = b.system?.isActive ? 1 : 0;
      } else {
        aVal = (a as any)[sortConfig.key] || '';
        bVal = (b as any)[sortConfig.key] || '';
      }

      return compareValues(aVal, bVal, sortConfig.direction);
    });
  }, [employees, searchTerm, filters, activeAdvancedFilterId, advancedFilters, sortConfig]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(start, start + itemsPerPage);
  }, [filteredEmployees, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, activeAdvancedFilterId]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleColumn = (id: string) => {
    setColumns(prev => prev.map(col => col.id === id ? { ...col, visible: !col.visible } : col));
  };

  const handleSaveFilter = () => {
    if (!newFilterName) {
      setMessage({ type: 'error', text: 'Lütfen filtre adı girin.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    
    // Create filter from current basic filters for demo purposes
    // In a real app, we'd have a UI to build complex conditions
    const newFilter: AdvancedFilter = {
      id: Math.random().toString(36).substr(2, 9),
      name: newFilterName,
      createdBy: user?.username || 'Admin',
      conditions: [
        ...(filters.department ? [{ field: 'department', operator: 'equals' as const, value: filters.department }] : []),
        ...(filters.status === 'active' ? [{ field: 'isActive', operator: 'equals' as const, value: true }] : []),
        ...(filters.status === 'passive' ? [{ field: 'isActive', operator: 'equals' as const, value: false }] : []),
        ...(filters.status === 'terminated' ? [{ field: 'terminationDate', operator: 'notEmpty' as const, value: '' }] : []),
      ]
    };

    onUpdateAdvancedFilters([...advancedFilters, newFilter]);
    setNewFilterName('');
    setMessage({ type: 'success', text: 'Filtre kaydedildi.' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {message && (
        <div className={`p-4 rounded-2xl text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {message.text}
        </div>
      )}
      {/* Action Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="İsim veya TCKN ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500 transition-all"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 md:p-3 rounded-xl md:rounded-2xl border transition-all flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest ${showFilters ? 'bg-brand-50 border-brand-200 text-brand-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <Filter className="w-4 h-4" /> <span className="hidden sm:inline">Filtrele</span>
          </button>
          <button 
            onClick={() => setShowColumnConfig(!showColumnConfig)}
            className="p-2 md:p-3 bg-white border border-slate-200 text-slate-600 rounded-xl md:rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest"
          >
            <Columns className="w-4 h-4" /> <span className="hidden sm:inline">Sütunlar</span>
          </button>
          <button 
            onClick={onExport}
            className="p-2 md:p-3 bg-white border border-slate-200 text-slate-600 rounded-xl md:rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest"
          >
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Dışa Aktar</span>
          </button>
          <button 
            onClick={() => setShowImport(true)}
            className="p-2 md:p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl md:rounded-2xl hover:bg-emerald-100 transition-all flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest"
          >
            <Upload className="w-4 h-4" /> <span className="hidden sm:inline">Toplu Yükle</span>
          </button>
          <button 
            onClick={onAddNew}
            className="flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 bg-brand-600 text-white font-black rounded-xl md:rounded-2xl hover:bg-brand-700 transition-all flex items-center justify-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-900/20"
          >
            <Plus className="w-4 h-4" /> Yeni Personel
          </button>
        </div>
      </div>

      {/* Advanced Filters Bar */}
      {advancedFilters.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Hazır Filtreler:</span>
          <button 
            onClick={() => setActiveAdvancedFilterId(null)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${!activeAdvancedFilterId ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
          >
            Tümü
          </button>
          {advancedFilters.map(f => (
            <button 
              key={f.id}
              onClick={() => setActiveAdvancedFilterId(f.id)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 flex items-center gap-2 ${activeAdvancedFilterId === f.id ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
            >
              <Play className="w-3 h-3" /> {f.name}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Departman</label>
                  <select 
                    value={filters.department}
                    onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Tümü</option>
                    {departments.slice().sort((a, b) => a.localeCompare(b)).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ünvan</label>
                  <select 
                    value={filters.title}
                    onChange={(e) => setFilters(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Tümü</option>
                    {titles.slice().sort((a, b) => a.localeCompare(b)).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lokasyon</label>
                  <select 
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Tümü</option>
                    {locations.slice().sort((a, b) => a.name.localeCompare(b.name)).map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Çalışma Şekli</label>
                  <select 
                    value={filters.employmentType}
                    onChange={(e) => setFilters(prev => ({ ...prev, employmentType: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Tümü</option>
                    <option value="Tam Zamanlı">Tam Zamanlı</option>
                    <option value="Kısmi Zamanlı">Kısmi Zamanlı</option>
                    <option value="Stajyer">Stajyer</option>
                    <option value="Sözleşmeli">Sözleşmeli</option>
                  </select>
                </div>
                <div className="space-y-2">
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
                <div className="space-y-2">
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
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <input 
                    type="text" 
                    placeholder="Filtre Adı..." 
                    value={newFilterName}
                    onChange={(e) => setNewFilterName(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                  <button 
                    onClick={handleSaveFilter}
                    className="flex items-center gap-2 text-[10px] font-black text-brand-600 uppercase tracking-widest hover:text-brand-700"
                  >
                    <Save className="w-4 h-4" /> Filtreyi Kaydet
                  </button>
                </div>
                <button 
                  onClick={() => {
                    setFilters({ department: '', title: '', location: '', status: 'active', employmentType: '', workLocationType: '' });
                    setActiveAdvancedFilterId(null);
                  }}
                  className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors"
                >
                  Filtreleri Temizle
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto w-full max-h-[600px]">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest w-12 text-center sticky top-0 bg-slate-50 z-10">No</th>
                {columns.filter(c => c.visible).sort((a, b) => a.order - b.order).map(col => (
                  <th 
                    key={col.id} 
                    className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors group sticky top-0 bg-slate-50 z-10"
                    onClick={() => handleSort(col.id)}
                  >
                    <div className="flex items-center gap-2 group-hover:text-slate-700 transition-colors">
                      {col.label} 
                      {sortConfig.key === col.id ? (
                        sortConfig.direction === 'asc' ? <ChevronDown className="w-3 h-3 text-brand-500" /> : <ChevronDown className="w-3 h-3 rotate-180 text-brand-500" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right sticky top-0 bg-slate-50 z-10">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedEmployees.map((emp, index) => (
                <tr key={`${emp.id}-${index}`} className="group hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 text-center">
                    <span className="text-[10px] font-black text-slate-400">{(currentPage - 1) * itemsPerPage + index + 1}</span>
                  </td>
                  {columns.filter(c => c.visible).sort((a, b) => a.order - b.order).map(col => (
                    <td key={col.id} className="px-6 py-4">
                      {col.id === 'name' ? (
                          <span className="text-sm font-bold text-slate-800">{emp.core?.name || 'İsimsiz'}</span>
                      ) : col.id === 'isActive' ? (
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${
                          emp.work?.terminationDate 
                            ? 'bg-red-50 text-red-600 border border-red-100/50' 
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100/50'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            emp.work?.terminationDate ? 'bg-red-500' : 'bg-emerald-500'
                          }`} />
                          {emp.work?.terminationDate ? 'İşten Ayrıldı' : 'Aktif'}
                        </span>
                      ) : col.id === 'netSalary' ? (
                        <span className="text-sm font-black text-slate-800 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: emp.wage?.currency || 'TRY' }).format(emp.wage?.netSalary || 0)}
                        </span>
                      ) : col.id === 'hireDate' ? (
                        <span className="text-xs font-bold text-slate-500">{emp.work?.hireDate ? new Date(emp.work.hireDate).toLocaleDateString('tr-TR') : '-'}</span>
                      ) : col.id === 'seniority' ? (
                        <span className="text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{emp.work?.hireDate ? formatSeniority(calculateSeniority(emp.work.hireDate)) : '-'}</span>
                      ) : col.id === 'department' ? (
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">{emp.work?.department || '-'}</span>
                      ) : col.id === 'title' ? (
                        <span className="text-xs font-bold text-slate-600">{emp.work?.title || '-'}</span>
                      ) : col.id === 'actualWorkLocation' ? (
                        <span className="text-xs font-bold text-slate-600">{emp.work?.actualWorkLocation || '-'}</span>
                      ) : col.id === 'tcNo' ? (
                        <span className="text-xs font-bold text-slate-500 font-mono">{emp.core?.tcNo || '-'}</span>
                      ) : (
                        <span className="text-xs font-bold text-slate-600">{(emp as any)[col.id]}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onEdit(emp.id)}
                        className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-amber-100/50 shadow-sm"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Düzenle</span>
                      </button>
                      <button 
                        onClick={() => onDelete(emp.id)}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-red-100/50 shadow-sm"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Sil</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedEmployees.length === 0 && (
                <tr>
                  <td colSpan={columns.filter(c => c.visible).length + 1} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="text-xs font-bold text-slate-500">Arama kriterlerinize uygun personel bulunamadı.</p>
                      <button 
                        onClick={() => {
                          setSearchTerm('');
                          setFilters({ department: '', title: '', location: '', status: 'active', employmentType: '', workLocationType: '' });
                          setActiveAdvancedFilterId(null);
                        }}
                        className="mt-4 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors"
                      >
                        Filtreleri Temizle
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="bg-slate-50/80 p-6 border-t border-slate-200 flex justify-between items-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Toplam {filteredEmployees.length} Kayıt • Sayfa {currentPage} / {totalPages || 1}
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Geri
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              İleri
            </button>
          </div>
        </div>
      </div>

      {/* Column Config Modal */}
      <AnimatePresence>
        {showColumnConfig && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-10 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Sütun Ayarları</h3>
                <button onClick={() => setShowColumnConfig(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-8 space-y-3 max-h-[400px] overflow-y-auto">
                {columns.map(col => (
                  <button 
                    key={col.id}
                    onClick={() => toggleColumn(col.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${col.visible ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                  >
                    <span className="text-sm font-bold">{col.label}</span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${col.visible ? 'bg-brand-500 text-white' : 'bg-slate-200 text-transparent'}`}>
                      <Check className="w-3 h-3" />
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-8 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setShowColumnConfig(false)}
                  className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all uppercase text-xs tracking-widest"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Import Modal */}
      <AnimatePresence>
        {showImport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-50 w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden my-8"
            >
              <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Toplu Personel Yükleme</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Excel dosyası ile hızlı veri aktarımı</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowImport(false)}
                  className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-8 max-h-[80vh] overflow-y-auto">
                <PersonnelImport 
                  onApply={(data, errors) => {
                    onApplyImport(data, errors);
                    // We don't close immediately because PersonnelImport has its own success state
                  }}
                  onCancel={() => setShowImport(false)}
                  importHistory={importHistory}
                  onUndoImport={onUndoImport}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
