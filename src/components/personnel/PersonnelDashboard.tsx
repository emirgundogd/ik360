import React, { useMemo, useState, useCallback } from 'react';
import { compareValues } from '../../utils';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  Clock,
  UserCheck,
  Calendar,
  ChevronUp,
  ChevronDown,
  Search,
  X,
  ArrowUpRight,
  Cake,
  GraduationCap,
  UserMinus,
  Timer,
  Droplets,
  Heart,
  Baby,
  Briefcase,
  Award,
  Activity,
  Download,
  Globe,
  PieChart as PieChartIcon,
  Bell,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { Employee, LocationRecord, SalaryHistory, AppConfig } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { calculateSeniority, formatSeniority, calculateTrialRemaining, searchMatch } from '../../services/personnelUtils';
import { excelService } from '../../services/excelService';
import { TurkeyMap } from './TurkeyMap';
import { IstanbulMap } from './IstanbulMap';

import { useWidgetFilter, WidgetFilter } from './WidgetFilter';

interface Props {
  employees: Employee[];
  departments: string[];
  titles: string[];
  locations: LocationRecord[];
  salaryHistory: SalaryHistory[];
  config: AppConfig;
  onDrillDown: (filter: any) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4', '#14b8a6', '#f43f5e'];
const AGE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];
const MARITAL_COLORS = [...COLORS.slice(2), ...COLORS.slice(0, 2)];
const BLOOD_COLORS = [...COLORS.slice(4), ...COLORS.slice(0, 4)];

const formatDeptName = (name: string) => {
  if (name.toLowerCase().includes('insan kaynakları ve kurumsal gelişim')) return 'İK';
  return name;
};

const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all ${className}`}>
    {children}
  </div>
);

const StatCard: React.FC<{ 
  label: string, 
  value: string | number, 
  subValue?: string, 
  badge?: string,
  onBadgeClick?: () => void,
  icon: any, 
  color: string, 
  delay?: number,
  onClick?: () => void
}> = ({ label, value, subValue, badge, onBadgeClick, icon: Icon, color, delay = 0, onClick }) => {
  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-200',
    rose: 'from-rose-500 to-rose-600 shadow-rose-200',
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-200',
    amber: 'from-amber-500 to-amber-600 shadow-amber-200',
    violet: 'from-violet-500 to-violet-600 shadow-violet-200',
    blue: 'from-blue-500 to-blue-600 shadow-blue-200',
    cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-200',
  };
  const gradient = colorMap[color] || colorMap.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="h-full w-full relative"
    >
      {/* Badge positioned at the very top right - moved outside overflow-hidden for better visibility */}
      {badge && (
        <div 
          onClick={(e) => {
            if (onBadgeClick) {
              e.stopPropagation();
              onBadgeClick();
            }
          }}
          className={`absolute top-0 right-0 -translate-y-2 translate-x-4 z-30 bg-indigo-600 px-3 py-1.5 rounded-xl border border-white/30 shadow-xl transition-all select-none ${onBadgeClick ? 'cursor-pointer hover:bg-indigo-700 active:scale-95' : ''}`}
        >
          <span className="text-[9px] font-black uppercase tracking-widest text-white whitespace-nowrap flex items-center gap-1.5">
            {badge}
            {onBadgeClick && <ArrowUpRight className="w-3 h-3 opacity-70" />}
          </span>
        </div>
      )}

      <div 
        onClick={onClick}
        className={`relative overflow-hidden bg-gradient-to-br ${gradient} p-6 rounded-[2rem] shadow-lg text-white h-full flex flex-col justify-between group transition-all ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}`}
      >
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>

        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
            <Icon className="w-6 h-6 text-white" />
          </div>
          {/* Only show the standalone arrow if there's no badge */}
          {!badge && onClick && <ArrowUpRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />}
        </div>

        <div className="relative z-10">
          <p className="text-white/80 text-xs font-black uppercase tracking-widest mb-1">
            {label}
          </p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-3xl font-black leading-tight">
              {value}
            </p>
            {subValue && <p className="text-sm font-bold text-white/70">{subValue}</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SectionHeader: React.FC<{ title: string, icon: any, description?: string }> = ({ title, icon: Icon, description }) => (
  <div className="mb-6 mt-12">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
        <Icon className="w-5 h-5" />
      </div>
      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{title}</h2>
    </div>
    {description && <p className="text-[10px] font-black text-slate-400 ml-12 uppercase tracking-widest">{description}</p>}
  </div>
);

const DataTable: React.FC<{ 
  title: string, 
  icon: any, 
  data: any[], 
  columns: { key: string, label: string, render?: (val: any, item: any) => React.ReactNode }[],
  onRowClick?: (item: any) => void,
  headerAction?: React.ReactNode,
  description?: string
}> = ({ title, icon: Icon, data, columns, onRowClick, headerAction, description }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      const getValue = (item: any, key: string) => {
        // Handle common nested patterns for personnel
        if (key === 'name') return item.core?.name || item.name || '';
        if (key === 'age') {
          const bDate = new Date(item.core?.birthDate || item.birthDate);
          return isNaN(bDate.getTime()) ? 0 : new Date().getFullYear() - bDate.getFullYear();
        }
        if (key === 'birthDate') return item.core?.birthDate || item.birthDate || '';
        if (key === 'department' || key === 'dept') return item.work?.department || item.department || '';
        if (key === 'title') return item.work?.title || item.title || '';
        if (key === 'hireDate') return item.work?.hireDate || item.hireDate || '';
        if (key === 'netSalary' || key === 'salary') return item.wage?.netSalary || item.salary || 0;
        if (key === 'tcNo') return item.core?.tcNo || item.tcNo || '';
        
        return item[key];
      };

      const aVal = getValue(a, sortConfig.key);
      const bVal = getValue(b, sortConfig.key);
      return compareValues(aVal, bVal, sortConfig.direction);
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-slate-50 text-slate-600">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{title}</h3>
            {description && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{description}</p>}
          </div>
        </div>
        {headerAction}
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr>
              <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 text-center">No</th>
              {columns.map(col => (
                <th 
                  key={col.key} 
                  className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600 transition-colors"
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortConfig?.key === col.key && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, idx) => (
              <tr 
                key={idx} 
                className="group hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => onRowClick?.(item)}
              >
                <td className="px-4 py-3 text-center text-[10px] font-black text-slate-400 first:rounded-l-2xl bg-slate-50/50 group-hover:bg-slate-100/50 transition-colors">
                  {idx + 1}
                </td>
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-xs font-bold text-slate-700 last:rounded-r-2xl bg-slate-50/50 group-hover:bg-slate-100/50 transition-colors">
                    {col.render ? col.render(item[col.key], item) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="py-10 text-center text-slate-400 text-xs font-bold">Seçili departman bulunamadı.</div>
        )}
      </div>
    </Card>
  );
};

const ALL_COLUMNS = [
  { key: 'name', label: 'Ad Soyad', render: (_: any, item: any) => item.core?.name || item.name },
  { key: 'tcNo', label: 'TCKN', render: (_: any, item: any) => item.core?.tcNo || item.tcNo },
  { key: 'department', label: 'Departman', render: (_: any, item: any) => item.work?.department || item.department },
  { key: 'title', label: 'Ünvan', render: (_: any, item: any) => item.work?.title || item.title },
  { key: 'hireDate', label: 'Giriş Tarihi', render: (_: any, item: any) => {
    const date = item.work?.hireDate || item.hireDate;
    return date ? new Date(date).toLocaleDateString('tr-TR') : '-';
  }},
  { key: 'netSalary', label: 'Maaş', render: (_: any, item: any) => `₺${(item.wage?.netSalary || item.salary || 0).toLocaleString('tr-TR')}` }
];

const DrillDownModal: React.FC<{ 
  isOpen: boolean, 
  onClose: () => void, 
  title: string, 
  employees: Employee[],
  onDrillDown: (filter: any) => void
}> = ({ isOpen, onClose, title, employees, onDrillDown }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(ALL_COLUMNS.map(c => c.key));
  const [ageRange, setAgeRange] = useState({ min: '', max: '' });
  
  const filtered = useMemo(() => {
    let data = employees;

    // Age Range Filter (if applicable)
    if (title.includes('Yaş') && (ageRange.min || ageRange.max)) {
      data = data.filter(e => {
        const bDate = new Date(e.core?.birthDate || e.birthDate);
        if (isNaN(bDate.getTime())) return false;
        const age = new Date().getFullYear() - bDate.getFullYear();
        const min = ageRange.min ? parseInt(ageRange.min) : 0;
        const max = ageRange.max ? parseInt(ageRange.max) : 999;
        return age >= min && age <= max;
      });
    }

    if (searchTerm) {
      data = data.filter(e => 
        searchMatch(e.core?.name || '', searchTerm) ||
        (e.core?.tcNo || '').includes(searchTerm) ||
        searchMatch(e.work?.department || '', searchTerm)
      );
    }

    // Sort alphabetically by name A-Z
    return [...data].sort((a, b) => {
      const nameA = a.core?.name || a.name || '';
      const nameB = b.core?.name || b.name || '';
      return nameA.localeCompare(nameB, 'tr');
    });
  }, [employees, searchTerm, ageRange, title]);

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => 
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    );
  };

  const handleExport = () => {
    const exportData = filtered.map(e => {
      const bDate = new Date(e.core?.birthDate || e.birthDate);
      const age = isNaN(bDate.getTime()) ? '-' : new Date().getFullYear() - bDate.getFullYear();
      
      return {
        'Ad Soyad': e.core?.name || e.name,
        'TCKN': e.core?.tcNo || '',
        'Departman': e.work?.department || e.department,
        'Ünvan': e.work?.title || e.title,
        'Yaş': age,
        'Doğum Tarihi': isNaN(bDate.getTime()) ? '-' : bDate.toLocaleDateString('tr-TR'),
        'İşe Giriş': e.work?.hireDate || '',
        'Telefon': e.core?.phone || '',
        'E-posta': e.core?.email || ''
      };
    });

    excelService.exportToExcel(exportData, `${title}_Listesi_${new Date().toLocaleDateString('tr-TR')}`);
  };

  const columns = useMemo(() => {
    let cols = ALL_COLUMNS.filter(c => visibleColumns.includes(c.key));
    if (title.includes('Yaş')) {
      // Add Age and BirthDate columns if not already present
      if (!cols.find(c => c.key === 'age')) {
        cols.push({
          key: 'age',
          label: 'Yaş',
          render: (_: any, item: any) => {
            const bDate = new Date(item.core?.birthDate || item.birthDate);
            if (isNaN(bDate.getTime())) return '-';
            return new Date().getFullYear() - bDate.getFullYear();
          }
        });
      }
      if (!cols.find(c => c.key === 'birthDate')) {
        cols.push({
          key: 'birthDate',
          label: 'Doğum Tarihi',
          render: (_: any, item: any) => {
            const bDate = new Date(item.core?.birthDate || item.birthDate);
            if (isNaN(bDate.getTime())) return '-';
            return bDate.toLocaleDateString('tr-TR');
          }
        });
      }
    }
    return cols;
  }, [visibleColumns, title]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-10 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white w-full max-w-5xl h-[80vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{title}</h2>
                <p className="text-xs font-bold text-slate-400 mt-1">{filtered.length} Personel Listeleniyor</p>
              </div>
              <div className="flex items-center gap-4">
                {title.includes('Yaş') && (
                  <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-black text-slate-400 uppercase ml-2">Yaş:</span>
                    <input 
                      type="number" 
                      placeholder="Min" 
                      className="w-16 px-2 py-1 text-xs font-bold border-none focus:ring-0 bg-slate-50 rounded-lg"
                      value={ageRange.min}
                      onChange={(e) => setAgeRange(prev => ({ ...prev, min: e.target.value }))}
                    />
                    <span className="text-slate-300">-</span>
                    <input 
                      type="number" 
                      placeholder="Max" 
                      className="w-16 px-2 py-1 text-xs font-bold border-none focus:ring-0 bg-slate-50 rounded-lg"
                      value={ageRange.max}
                      onChange={(e) => setAgeRange(prev => ({ ...prev, max: e.target.value }))}
                    />
                  </div>
                )}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Ara..." 
                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                >
                  <Download className="w-4 h-4" /> Excel
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
            
            {/* Column Selector */}
            <div className="px-8 py-4 bg-slate-50 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-500 uppercase">Sütunlar:</span>
              {ALL_COLUMNS.map(col => (
                <button
                  key={col.key}
                  onClick={() => toggleColumn(col.key)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${visibleColumns.includes(col.key) ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                >
                  {col.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-auto p-8">
              <DataTable 
                title="Personel Listesi"
                icon={Users}
                data={filtered}
                columns={columns}
                onRowClick={(item) => {
                  onClose();
                  onDrillDown({ id: item.id });
                }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const GenericPieChart = React.memo(({ 
  data, 
  colors, 
  onSliceClick, 
  innerRadius = 50, 
  outerRadius = 70, 
  paddingAngle = 2,
  legendFormatter,
  animationDuration = 400,
  legendWrapperStyle
}: {
  data: any[],
  colors: string[],
  onSliceClick?: (data: any) => void,
  innerRadius?: number,
  outerRadius?: number,
  paddingAngle?: number,
  legendFormatter?: (value: string) => string,
  animationDuration?: number,
  legendWrapperStyle?: any
}) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 20, right: 0, bottom: 20, left: 0 }}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={paddingAngle}
          dataKey="value"
          onClick={onSliceClick}
          isAnimationActive={true}
          animationDuration={animationDuration}
          animationBegin={0}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          itemStyle={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}
          cursor={false}
        />
        <Legend 
          verticalAlign="bottom" 
          align="center"
          iconType="rect" 
          iconSize={8}
          wrapperStyle={legendWrapperStyle || { fontSize: '10px', fontWeight: 700, paddingTop: '10px', lineHeight: '1.2', width: '100%' }}
          formatter={legendFormatter}
        />
      </PieChart>
    </ResponsiveContainer>
  );
});

export const PersonnelDashboard: React.FC<Props> = ({ employees, departments, titles, locations, salaryHistory, config, onDrillDown }) => {
  const [drillDownData, setDrillDownData] = useState<{ title: string, employees: Employee[] } | null>(null);
  const [locationFilter, setLocationFilter] = useState<string>('Tümü');

  const allDepartments = useMemo(() => {
    const depts = new Set(employees.map(e => e.work?.department || 'Belirtilmemiş'));
    return Array.from(depts).sort();
  }, [employees]);

  // Widget Filters
  const { selectedDepartments: deptDistSelected, setSelectedDepartments: setDeptDistSelected } = useWidgetFilter('dept_dist', allDepartments, locationFilter);
  const { selectedDepartments: highPaidSelected, setSelectedDepartments: setHighPaidSelected } = useWidgetFilter('high_paid', allDepartments, locationFilter);
  const { selectedDepartments: lowPaidSelected, setSelectedDepartments: setLowPaidSelected } = useWidgetFilter('low_paid', allDepartments, locationFilter);
  const { selectedDepartments: deptTenureSelected, setSelectedDepartments: setDeptTenureSelected } = useWidgetFilter('dept_tenure', allDepartments, locationFilter);
  const { selectedDepartments: deptSalarySelected, setSelectedDepartments: setDeptSalarySelected } = useWidgetFilter('dept_salary', allDepartments, locationFilter);

  const activeEmployees = useMemo(() => employees.filter(e => !e.isDeleted && !e.work?.terminationDate), [employees]);
  
  const departmentsByCount = useMemo(() => {
    const counts: Record<string, number> = {};
    activeEmployees.forEach(e => {
      const dept = e.work?.department || 'Belirtilmemiş';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return allDepartments.map(dept => ({
      name: dept,
      count: counts[dept] || 0
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [activeEmployees, allDepartments]);

  const filteredEmployees = useMemo(() => {
    if (locationFilter === 'Tümü') return activeEmployees;
    const mappedFilter = locationFilter === 'Merkez' ? 'HQ' : 'FIELD';
    return activeEmployees.filter(e => e.work?.workLocationType === mappedFilter);
  }, [activeEmployees, locationFilter]);
  
  // Distributions
  const ageData = useMemo(() => {
    const groups = { '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '56+': 0 };
    filteredEmployees.forEach(e => {
      if (!e.core?.birthDate) return;
      const bDate = new Date(e.core.birthDate);
      if (isNaN(bDate.getTime())) return;
      
      const age = new Date().getFullYear() - bDate.getFullYear();
      
      if (age >= 18 && age <= 25) groups['18-25']++;
      else if (age >= 26 && age <= 35) groups['26-35']++;
      else if (age >= 36 && age <= 45) groups['36-45']++;
      else if (age >= 46 && age <= 55) groups['46-55']++;
      else if (age >= 56) groups['56+']++;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [filteredEmployees]);

  const deptData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEmployees.forEach(e => {
      const dept = e.work?.department || 'Belirtilmemiş';
      const formattedDept = formatDeptName(dept);
      if (deptDistSelected.includes(dept)) {
        counts[formattedDept] = (counts[formattedDept] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredEmployees, deptDistSelected]);



  const genderData = useMemo(() => {
    const counts: Record<string, number> = { 'Erkek': 0, 'Kadın': 0, 'Belirtilmemiş': 0 };
    filteredEmployees.forEach(e => {
      const gender = e.core?.gender || 'Belirtilmemiş';
      counts[gender] = (counts[gender] || 0) + 1;
    });
    return Object.entries(counts).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [filteredEmployees]);

  const maritalData = useMemo(() => {
    const counts: Record<string, number> = { 'Evli': 0, 'Bekar': 0, 'Dul': 0, 'Boşanmış': 0 };
    filteredEmployees.forEach(e => {
      const status = e.core?.maritalStatus || 'Bekar';
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [filteredEmployees]);

  const childData = useMemo(() => {
    const counts: Record<string, number> = { '0': 0, '1': 0, '2': 0, '3+': 0 };
    filteredEmployees.forEach(e => {
      const count = e.core?.childCount || 0;
      if (count === 0) counts['0']++;
      else if (count === 1) counts['1']++;
      else if (count === 2) counts['2']++;
      else counts['3+']++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredEmployees]);

  const bloodData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEmployees.forEach(e => {
      const group = e.core?.bloodGroup || 'Bilinmiyor';
      counts[group] = (counts[group] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredEmployees]);

  const eduData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEmployees.forEach(e => {
      const edu = e.core?.education || 'Belirtilmemiş';
      counts[edu] = (counts[edu] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredEmployees]);

  // Tenure & Salary Analysis
  const validTenureEmps = useMemo(() => filteredEmployees.filter(e => e.work?.hireDate && !isNaN(new Date(e.work.hireDate).getTime())), [filteredEmployees]);
  const mostTenured = useMemo(() => [...validTenureEmps].sort((a, b) => new Date(a.work.hireDate!).getTime() - new Date(b.work.hireDate!).getTime()).slice(0, 5), [validTenureEmps]);
  const leastTenured = useMemo(() => {
    return [...validTenureEmps]
      .filter(e => calculateTrialRemaining(e.work?.hireDate || '', e.work?.trialPeriodMonths || 2) <= 0)
      .sort((a, b) => new Date(b.work.hireDate!).getTime() - new Date(a.work.hireDate!).getTime())
      .slice(0, 5);
  }, [validTenureEmps]);
  
  const highestPaid = useMemo(() => [...filteredEmployees]
    .filter(e => highPaidSelected.includes(e.work?.department || 'Belirtilmemiş'))
    .sort((a, b) => (b.wage?.netSalary || 0) - (a.wage?.netSalary || 0))
    .slice(0, 5), [filteredEmployees, highPaidSelected]);
  const lowestPaid = useMemo(() => [...filteredEmployees]
    .filter(e => lowPaidSelected.includes(e.work?.department || 'Belirtilmemiş'))
    .sort((a, b) => (a.wage?.netSalary || 0) - (b.wage?.netSalary || 0))
    .slice(0, 5), [filteredEmployees, lowPaidSelected]);

  const deptTenure = useMemo(() => {
    const depts: Record<string, { total: number, count: number }> = {};
    validTenureEmps.forEach(e => {
      const d = e.work?.department || 'Belirtilmemiş';
      if (deptTenureSelected.includes(d)) {
        if (!depts[d]) depts[d] = { total: 0, count: 0 };
        const seniority = calculateSeniority(e.work.hireDate);
        depts[d].total += seniority.years + (seniority.months / 12);
        depts[d].count++;
      }
    });
    return Object.entries(depts).map(([name, data]) => ({ name, avg: data.total / data.count })).sort((a, b) => b.avg - a.avg);
  }, [validTenureEmps, deptTenureSelected]);

  const deptSalary = useMemo(() => {
    const depts: Record<string, { total: number, count: number }> = {};
    filteredEmployees.forEach(e => {
      const d = e.work?.department || 'Belirtilmemiş';
      if (deptSalarySelected.includes(d)) {
        if (!depts[d]) depts[d] = { total: 0, count: 0 };
        depts[d].total += e.wage?.netSalary || 0;
        depts[d].count++;
      }
    });
    return Object.entries(depts).map(([name, data]) => ({ name, avg: data.total / data.count })).sort((a, b) => b.avg - a.avg);
  }, [filteredEmployees, deptSalarySelected]);

  const probationEmployees = useMemo(() => {
    return filteredEmployees.filter(e => {
      const remaining = calculateTrialRemaining(e.work.hireDate, e.work.trialPeriodMonths || 2);
      return remaining >= 0;
    }).sort((a, b) => {
      const remA = calculateTrialRemaining(a.work.hireDate, a.work.trialPeriodMonths || 2);
      const remB = calculateTrialRemaining(b.work.hireDate, b.work.trialPeriodMonths || 2);
      return remA - remB;
    });
  }, [filteredEmployees]);

  const upcomingBirthdays = useMemo(() => {
    return filteredEmployees.filter(e => {
      if (!e.core?.birthDate) return false;
      const bday = new Date(e.core.birthDate);
      const today = new Date();
      const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
      const nextYearBday = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate());
      
      const diffTime = thisYearBday.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays <= 30) return true;
      
      const nextYearDiffTime = nextYearBday.getTime() - today.getTime();
      const nextYearDiffDays = Math.ceil(nextYearDiffTime / (1000 * 60 * 60 * 24));
      
      return nextYearDiffDays >= 0 && nextYearDiffDays <= 30;
    }).sort((a, b) => {
      const bdayA = new Date(a.core.birthDate!);
      const bdayB = new Date(b.core.birthDate!);
      return bdayA.getMonth() - bdayB.getMonth() || bdayA.getDate() - bdayB.getDate();
    });
  }, [filteredEmployees]);

  const handleChartClick = useCallback((title: string, filterFn: (e: Employee) => boolean) => {
    const filtered = filteredEmployees.filter(filterFn);
    setDrillDownData({ title, employees: filtered });
  }, [filteredEmployees]);

  const handleAgeClick = useCallback((data: any) => {
    if (!data) return;
    handleChartClick(`${data.name} Yaş Aralığındaki Personeller`, e => {
      if (!e.core?.birthDate) return false;
      const bDate = new Date(e.core.birthDate);
      const age = new Date().getFullYear() - bDate.getFullYear();
      if (data.name === '18-25') return age >= 18 && age <= 25;
      if (data.name === '26-35') return age >= 26 && age <= 35;
      if (data.name === '36-45') return age >= 36 && age <= 45;
      if (data.name === '46-55') return age >= 46 && age <= 55;
      if (data.name === '56+') return age >= 56;
      return false;
    });
  }, [handleChartClick]);

  const handleDeptClick = useCallback((data: any) => {
    if (!data) return;
    handleChartClick(`${data.name} Departmanı Personelleri`, e => {
      const dept = e.work?.department || 'Belirtilmemiş';
      return formatDeptName(dept) === data.name;
    });
  }, [handleChartClick]);

  const handleMaritalClick = useCallback((data: any) => {
    if (!data) return;
    handleChartClick(`${data.name} Personeller`, e => e.core?.maritalStatus === data.name);
  }, [handleChartClick]);

  const handleBloodClick = useCallback((data: any) => {
    if (!data) return;
    handleChartClick(`${data.name} Kan Grubuna Sahip Personeller`, e => e.core?.bloodGroup === data.name);
  }, [handleChartClick]);

  const handleGenderClick = useCallback((data: any) => {
    if (!data) return;
    handleChartClick(`${data.name} Personeller`, e => (e.core?.gender || 'Belirtilmemiş') === data.name);
  }, [handleChartClick]);

  // KPIs
  const kpis = useMemo(() => {
    const totalPersonnel = filteredEmployees.length;
    const retiredPersonnel = filteredEmployees.filter(e => e.work?.retirementStatus === 'Emekli').length;
    const partTimePersonnel = filteredEmployees.filter(e => e.work?.employmentType === 'Kısmi Zamanlı').length;

    const validAgeEmployees = filteredEmployees.filter(e => e.core?.birthDate && !isNaN(new Date(e.core.birthDate).getTime()));
    const avgAge = validAgeEmployees.length > 0 ? validAgeEmployees.reduce((acc, e) => {
      const bDate = new Date(e.core.birthDate!);
      const age = new Date().getFullYear() - bDate.getFullYear();
      return acc + age;
    }, 0) / validAgeEmployees.length : 0;
    
    const validTenureEmployees = filteredEmployees.filter(e => e.work?.hireDate && !isNaN(new Date(e.work.hireDate).getTime()));
    const avgTenure = validTenureEmployees.length > 0 ? validTenureEmployees.reduce((acc, e) => {
      const seniority = calculateSeniority(e.work.hireDate);
      return acc + seniority.years + (seniority.months / 12);
    }, 0) / validTenureEmployees.length : 0;

    const avgYears = Math.floor(avgTenure);
    const avgMonths = Math.round((avgTenure - avgYears) * 12);
    const avgTenureStr = `${avgYears > 0 ? `${avgYears} Yıl ` : ''}${avgMonths > 0 ? `${avgMonths} Ay` : ''}` || '0 Ay';

    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const newHires = filteredEmployees.filter(e => {
      if (!e.work?.hireDate) return false;
      const hDate = new Date(e.work.hireDate);
      return hDate.getMonth() === thisMonth && hDate.getFullYear() === thisYear;
    }).length;

    const foreignPersonnel = filteredEmployees.filter(e => e.core?.isForeign).length;

    return [
      { 
        label: 'Toplam Personel', 
        value: totalPersonnel, 
        badge: `Bu ay +${newHires} yeni`,
        onBadgeClick: () => handleChartClick('Bu Ay İşe Giren Personeller', e => {
          if (!e.work?.hireDate) return false;
          const hDate = new Date(e.work.hireDate);
          return hDate.getMonth() === thisMonth && hDate.getFullYear() === thisYear;
        }),
        icon: Users, 
        color: 'indigo' 
      },
      { 
        label: 'Emekli Personel', 
        value: retiredPersonnel, 
        icon: UserMinus, 
        color: 'rose',
        onClick: () => handleChartClick('Emekli Personeller', e => e.work?.retirementStatus === 'Emekli')
      },
      { 
        label: 'Kısmi Zamanlı', 
        value: partTimePersonnel, 
        icon: Timer, 
        color: 'emerald',
        onClick: () => handleChartClick('Kısmi Zamanlı Personeller', e => e.work?.employmentType === 'Kısmi Zamanlı')
      },
      { 
        label: 'Yabancı Uyruklu', 
        value: foreignPersonnel, 
        icon: Globe, 
        color: 'cyan',
        onClick: () => handleChartClick('Yabancı Uyruklu Personeller', e => e.core?.isForeign)
      },
      { label: 'Ortalama Yaş', value: Math.round(avgAge), icon: Calendar, color: 'amber' },
      { label: 'Ortalama Kıdem', value: avgTenureStr, icon: Clock, color: 'violet' },
    ];
  }, [filteredEmployees, handleChartClick]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 bg-slate-50/50 min-h-full font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Özet (Dashboard)</h2>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
            Şu anda <span className="text-indigo-600">{locationFilter}</span> lokasyonunda <span className="text-indigo-600">{filteredEmployees.length}</span> aktif personel inceleniyor.
          </p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          {(['Tümü', 'Merkez', 'Saha'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setLocationFilter(type)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${locationFilter === type ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
        {kpis.map((kpi, idx) => (
          <StatCard key={idx} {...kpi} delay={idx * 0.1} />
        ))}
      </div>

      {/* Turkey Map - Only for SAHA */}
      <AnimatePresence mode="wait">
        {locationFilter === 'Saha' && (
          <TurkeyMap 
            employees={filteredEmployees} 
            onDrillDown={onDrillDown}
          />
        )}
      </AnimatePresence>

      {/* Istanbul Map - Only for MERKEZ */}
      <AnimatePresence mode="wait">
        {locationFilter === 'Merkez' && (
          <IstanbulMap 
            employees={filteredEmployees} 
            onDrillDown={onDrillDown}
          />
        )}
      </AnimatePresence>

      <SectionHeader title="Demografik Yapı" icon={PieChartIcon} description="Personelin yaş, cinsiyet, medeni hal ve eğitim durumu dağılımları." />
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="h-[350px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" /> Cinsiyet Dağılımı
            </h3>
            <ArrowUpRight className="w-4 h-4 text-slate-300" />
          </div>
          <div className="flex-1 flex items-center justify-center w-full">
            <GenericPieChart 
              data={genderData} 
              colors={COLORS} 
              onSliceClick={handleGenderClick}
              innerRadius={50}
              outerRadius={70}
              legendWrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '20px' }}
            />
          </div>
        </Card>

        <Card className="h-[350px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500" /> Medeni Hal Dağılımı
            </h3>
            <ArrowUpRight className="w-4 h-4 text-slate-300" />
          </div>
          <div className="flex-1 flex items-center justify-center w-full">
            <GenericPieChart 
              data={maritalData} 
              colors={MARITAL_COLORS}
              onSliceClick={handleMaritalClick}
              innerRadius={50}
              outerRadius={70}
              legendWrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '20px' }}
            />
          </div>
        </Card>

        <Card className="h-[350px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Baby className="w-4 h-4 text-amber-500" /> Çocuk Sayısı Raporu
            </h3>
            <ArrowUpRight className="w-4 h-4 text-slate-300" />
          </div>
          <div className="flex-1 flex items-center justify-center w-full">
            <GenericPieChart 
              data={childData} 
              colors={AGE_COLORS} 
              onSliceClick={(data) => data && handleChartClick(`${data.name} Çocuklu Personeller`, e => {
                const c = e.core?.childCount || 0;
                if (data.name === '3+') return c >= 3;
                return c.toString() === data.name;
              })}
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              legendWrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '20px' }}
            />
          </div>
        </Card>

        <Card className="h-[350px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Droplets className="w-4 h-4 text-red-500" /> Kan Grubu Dağılımı
            </h3>
            <ArrowUpRight className="w-4 h-4 text-slate-300" />
          </div>
          <div className="flex-1 flex items-center justify-center w-full pt-10">
            <GenericPieChart 
              data={bloodData} 
              colors={BLOOD_COLORS}
              onSliceClick={handleBloodClick}
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              legendWrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '40px' }}
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" /> Yaş Raporu
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleChartClick('Yaş Aralığı Raporu', e => true)}
                className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors"
              >
                Detay
              </button>
              <ArrowUpRight className="w-4 h-4 text-slate-300" />
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
              <BarChart 
                data={ageData}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                onClick={(data) => data && handleAgeClick({ name: data.activeLabel })}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} dy={10} />
                <YAxis hide />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="h-[400px] flex flex-col">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-500" /> Eğitim Seviyesi Dağılımı
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
              <BarChart 
                data={eduData} 
                layout="vertical"
                margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                onClick={(data) => data && handleChartClick(`${data.activeLabel} Mezunu Personeller`, e => e.core?.education === data.activeLabel)}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                  width={120}
                />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <SectionHeader title="Organizasyon & Kıdem" icon={Briefcase} description="Departman dağılımları ve personel kıdem analizleri." />

      <div className="flex flex-col gap-6">
        <Card className="w-full min-h-[500px] flex flex-col overflow-hidden p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                Departman Dağılımı
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Personel sayısına göre departman sıralaması</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Departman ara..."
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all w-full md:w-64"
                  onChange={(e) => {
                    const term = e.target.value.toLowerCase();
                    const filtered = departmentsByCount.filter(d => d.name.toLowerCase().includes(term)).map(d => d.name);
                    setDeptDistSelected(filtered);
                  }}
                />
              </div>
              <button 
                onClick={() => setDeptDistSelected(departmentsByCount.map(d => d.name))}
                className="px-4 py-2 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors"
              >
                Tümünü Seç
              </button>
            </div>
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[600px]">
            {deptData.length > 0 ? (
              deptData.map((dept, index) => {
                const percentage = filteredEmployees.length > 0 ? (dept.value / filteredEmployees.length) * 100 : 0;
                return (
                  <motion.div 
                    key={dept.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group cursor-pointer"
                    onClick={() => handleDeptClick({ name: dept.name })}
                  >
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-400 w-6">{index + 1}.</span>
                        <span className="text-sm font-black text-slate-700 group-hover:text-emerald-600 transition-colors uppercase">{dept.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-800">{dept.value} <span className="text-[10px] text-slate-400 font-bold uppercase">Kişi</span></span>
                        <span className="text-[10px] font-black text-emerald-600 ml-2 bg-emerald-50 px-2 py-0.5 rounded-lg">%{percentage.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-emerald-500 rounded-full group-hover:bg-emerald-600 transition-colors relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-300">
                <Building2 className="w-12 h-12 opacity-20 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Kayıt bulunamadı</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Toplam {deptData.length} Departman Listeleniyor
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DataTable 
            title="En Kıdemli Personeller"
            icon={Award}
            data={mostTenured}
            columns={[
              { key: 'name', label: 'Ad Soyad', render: (_, item) => item.core?.name || item.name },
              { key: 'hireDate', label: 'Giriş', render: (_, item) => item.work?.hireDate ? new Date(item.work.hireDate).toLocaleDateString('tr-TR') : '-' },
              { key: 'tenure', label: 'Kıdem', render: (_, item) => formatSeniority(calculateSeniority(item.work?.hireDate || '')) }
            ]}
            onRowClick={(item) => onDrillDown({ id: item.id })}
          />
          <DataTable 
            title="En Az Kıdemli Personeller"
            icon={Clock}
            data={leastTenured}
            description="Deneme süreci tamamlanmış personeller arasından"
            columns={[
              { key: 'name', label: 'Ad Soyad', render: (_, item) => item.core?.name || item.name },
              { key: 'hireDate', label: 'Giriş', render: (_, item) => item.work?.hireDate ? new Date(item.work.hireDate).toLocaleDateString('tr-TR') : '-' },
              { key: 'tenure', label: 'Kıdem', render: (_, item) => formatSeniority(calculateSeniority(item.work?.hireDate || '')) }
            ]}
            onRowClick={(item) => onDrillDown({ id: item.id })}
          />
        </div>
      </div>

      <SectionHeader title="Ücretlendirme & Maliyet" icon={TrendingUp} description="Maaş analizleri ve departman bazlı maliyetler." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataTable 
          title="En Yüksek Maaşlı Personeller"
          icon={TrendingUp}
          data={highestPaid}
          columns={[
            { key: 'name', label: 'Ad Soyad', render: (_, item) => item.core?.name || item.name },
            { key: 'dept', label: 'Departman', render: (_, item) => item.work?.department || item.department },
            { key: 'salary', label: 'Maaş', render: (_, item) => `₺${(item.wage?.netSalary || 0).toLocaleString('tr-TR')}` }
          ]}
          onRowClick={(item) => onDrillDown({ id: item.id })}
          headerAction={<WidgetFilter allDepartments={departmentsByCount} selectedDepartments={highPaidSelected} onChange={setHighPaidSelected} />}
        />
        <DataTable 
          title="En Düşük Maaşlı Personeller"
          icon={TrendingUp}
          data={lowestPaid}
          columns={[
            { key: 'name', label: 'Ad Soyad', render: (_, item) => item.core?.name || item.name },
            { key: 'dept', label: 'Departman', render: (_, item) => item.work?.department || item.department },
            { key: 'salary', label: 'Maaş', render: (_, item) => `₺${(item.wage?.netSalary || 0).toLocaleString('tr-TR')}` }
          ]}
          onRowClick={(item) => onDrillDown({ id: item.id })}
          headerAction={<WidgetFilter allDepartments={departmentsByCount} selectedDepartments={lowPaidSelected} onChange={setLowPaidSelected} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <DataTable 
          title="Departman Bazlı Ortalama Kıdem"
          icon={Clock}
          data={deptTenure}
          columns={[
            { key: 'name', label: 'Departman' },
            { 
              key: 'avg', 
              label: 'Ort. Kıdem', 
              render: (val) => {
                const years = Math.floor(val);
                const months = Math.round((val - years) * 12);
                const parts = [];
                if (years > 0) parts.push(`${years} Yıl`);
                if (months > 0) parts.push(`${months} Ay`);
                return parts.join(' ') || '0 Ay';
              } 
            }
          ]}
          onRowClick={(item) => handleChartClick(`${item.name} Departmanı Personelleri`, e => (e.work?.department || e.department) === item.name)}
          headerAction={<WidgetFilter allDepartments={departmentsByCount} selectedDepartments={deptTenureSelected} onChange={setDeptTenureSelected} />}
        />
        <DataTable 
          title="Departman Bazlı Ortalama Maaş"
          icon={TrendingUp}
          data={deptSalary}
          columns={[
            { key: 'name', label: 'Departman' },
            { key: 'avg', label: 'Ort. Maaş', render: (val) => `₺${Math.round(val).toLocaleString('tr-TR')}` }
          ]}
          onRowClick={(item) => handleChartClick(`${item.name} Departmanı Personelleri`, e => (e.work?.department || e.department) === item.name)}
          headerAction={<WidgetFilter allDepartments={departmentsByCount} selectedDepartments={deptSalarySelected} onChange={setDeptSalarySelected} />}
        />
      </div>

      <SectionHeader title="Etkinlikler & Takip" icon={Activity} description="Yaklaşan doğum günleri ve deneme süresi bitişleri." />

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500" /> Deneme Sürecindeki Personeller
            </h3>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                {probationEmployees.length} Personel
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {probationEmployees.map((emp, idx) => {
              const remaining = calculateTrialRemaining(emp.work?.hireDate || '', emp.work?.trialPeriodMonths || 2);
              const empName = emp.core?.name || emp.name || '';
              const isAlert = remaining <= 5;
              
              return (
                <div 
                  key={`${emp.id}-${idx}`} 
                  className={`p-4 rounded-2xl transition-all cursor-pointer group relative border-2 ${
                    isAlert 
                      ? 'bg-red-50/30 border-red-100 hover:bg-red-50/50 hover:border-red-200' 
                      : 'bg-slate-50 border-transparent hover:bg-slate-100 hover:border-slate-200'
                  }`}
                  onClick={() => onDrillDown({ id: emp.id })}
                >
                  {isAlert && (
                    <div className="absolute -top-3 -right-1.5 group/info">
                      <div className="p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors shadow-sm border border-white">
                        <Info className="w-3.5 h-3.5" />
                      </div>
                      <div className="absolute bottom-full right-1.5 mb-0 whitespace-nowrap px-2.5 py-1.5 bg-slate-900 text-white text-[9px] font-black rounded-xl opacity-0 group-hover/info:opacity-100 transition-all duration-200 pointer-events-none z-10 shadow-2xl translate-y-1 group-hover/info:translate-y-0">
                        Deneme süreci bitimini hatırlat
                        <div className="absolute top-full right-3 border-[5px] border-transparent border-t-slate-900" />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-sm group-hover:scale-110 transition-transform ${
                      isAlert ? 'bg-red-100 text-red-600' : 'bg-white text-slate-400'
                    }`}>
                      {empName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate">{empName}</p>
                      <p className="text-[10px] font-bold text-slate-400 truncate">{emp.work?.department || emp.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Kalan Süre:
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      isAlert ? 'text-red-600' : 'text-emerald-600'
                    }`}>
                      {remaining} Gün
                    </span>
                  </div>
                </div>
              );
            })}
            {probationEmployees.length === 0 && (
              <div className="col-span-full py-10 text-center text-slate-400 text-xs font-bold">Deneme sürecinde personel bulunmuyor.</div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Cake className="w-4 h-4 text-pink-500" /> Yaklaşan Doğum Günleri (Gelecek 30 Gün)
            </h3>
            <span className="px-3 py-1 bg-pink-50 text-pink-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              {upcomingBirthdays.length} Kutlama
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {upcomingBirthdays.map((emp, idx) => {
              const bday = new Date(emp.core?.birthDate || '');
              const today = new Date();
              const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
              const turningAge = (thisYearBday < today) 
                ? today.getFullYear() + 1 - bday.getFullYear() 
                : today.getFullYear() - bday.getFullYear();

              const empName = emp.core?.name || emp.name || '';

              return (
                <div 
                  key={`${emp.id}-${idx}`} 
                  className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all cursor-pointer group"
                  onClick={() => onDrillDown({ id: emp.id })}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-black text-slate-400 shadow-sm group-hover:scale-110 transition-transform">
                      {empName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate">{empName}</p>
                      <p className="text-[10px] font-bold text-slate-400 truncate">{emp.work?.department || emp.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {new Date(emp.core?.birthDate || '').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                      </span>
                      <span className="text-[9px] font-bold text-pink-600 uppercase tracking-tighter">
                        {turningAge}. Yaş Günü
                      </span>
                    </div>
                    <Cake className="w-3 h-3 text-pink-400" />
                  </div>
                </div>
              );
            })}
            {upcomingBirthdays.length === 0 && (
              <div className="col-span-full py-10 text-center text-slate-400 text-xs font-bold">Önümüzdeki 30 gün içinde doğum günü bulunmuyor.</div>
            )}
          </div>
        </Card>
      </div>

      <DrillDownModal 
        isOpen={!!drillDownData}
        onClose={() => setDrillDownData(null)}
        title={drillDownData?.title || ''}
        employees={drillDownData?.employees || []}
        onDrillDown={onDrillDown}
      />
    </div>
  );
};
