import React, { useState, useMemo } from 'react';
import { 
  User, 
  CreditCard, 
  Settings, 
  History, 
  ArrowLeft, 
  Save, 
  Briefcase, 
  ShieldCheck, 
  AlertCircle,
  Mail,
  Phone,
  Home,
  FileText,
  TrendingUp,
  Trash2,
  Award,
  Edit2,
  MapPin,
  Wallet,
  Calendar,
  Users
} from 'lucide-react';
import { Employee, AuditLog, LocationRecord, SalaryHistory, PersonnelDocument, User as AppUser } from '../../types';
import { calculateSeniority, formatSeniority } from '../../services/personnelUtils';
import { BLOOD_GROUPS, GENDERS, MARITAL_STATUSES, INSURANCE_TYPES, EMPLOYMENT_TYPES, EDUCATION_LEVELS } from '../../constants/personnelConstants';

interface Props {
  employee: Employee;
  auditLogs: AuditLog[];
  salaryHistory: SalaryHistory[];
  documents: PersonnelDocument[];
  departments: string[];
  titles: string[];
  locations: LocationRecord[];
  cities: string[];
  districts: Record<string, string[]>;
  onBack: () => void;
  onSave: (updated: Employee) => void;
  onUploadDocument: (doc: Omit<PersonnelDocument, 'id' | 'uploadDate' | 'uploadedBy'>) => void;
  onDeleteDocument: (id: string) => void;
  onDelete: () => void;
  user: AppUser | null;
}

type Tab = 'general' | 'salary' | 'salaryHistory' | 'work' | 'documents' | 'system' | 'history';

const Section: React.FC<{ title: string; icon: any; children: React.ReactNode; className?: string }> = ({ title, icon: Icon, children, className = '' }) => (
  <div className={`bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm ${className}`}>
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100">
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{title}</h4>
    </div>
    {children}
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode; description?: string }> = ({ label, children, description }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    {children}
    {description && <p className="text-[9px] text-slate-400 font-bold mt-1 ml-1 uppercase tracking-tighter">{description}</p>}
  </div>
);

export const PersonnelDetail: React.FC<Props> = ({ 
  employee, auditLogs, salaryHistory, documents, 
  departments, titles, locations,
  cities, districts,
  onBack, onSave, onUploadDocument, onDeleteDocument, onDelete, user 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [formData, setFormData] = useState<Employee>(() => ({
    ...employee,
    core: employee.core || { 
      id: employee.id, 
      tcNo: employee.tcNo || '', 
      name: employee.name || '', 
      gender: GENDERS[0] || 'Erkek', 
      education: EDUCATION_LEVELS[0] || 'Lisans', 
      residenceAddress: '',
      residenceCity: '',
      residenceDistrict: '',
      birthDate: '',
      maritalStatus: MARITAL_STATUSES[0] || 'Bekar',
      childCount: 0,
      bloodGroup: BLOOD_GROUPS[0] || '',
      isForeign: false
    },
    wage: employee.wage || { netSalary: 0, mealAllowance: 0, roadAllowance: 0, totalPaidAmount: 0, currency: 'TRY', hasIncentive: false },
    leave: employee.leave || { remainingAnnualLeaveDays: 0, remainingCompensatoryLeaveHours: '00:00' },
    work: employee.work || { hireDate: new Date().toISOString(), department: employee.department || '', title: '', employmentType: 'Tam Zamanlı', retirementStatus: INSURANCE_TYPES[0] || 'Normal', workLocationType: 'HQ', actualWorkLocation: '', trialPeriodMonths: 2 },
    system: employee.system || { showInPdks: true, isActive: employee.isActive ?? true, role: 'USER' }
  }));
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync formData with employee prop when it changes (e.g. after import)
  React.useEffect(() => {
    setFormData({
      ...employee,
      core: employee.core || { 
        id: employee.id, 
        tcNo: employee.tcNo || '', 
        name: employee.name || '', 
        gender: GENDERS[0] || 'Erkek', 
        education: EDUCATION_LEVELS[0] || 'Lisans', 
        residenceAddress: '',
        residenceCity: '',
        residenceDistrict: '',
        birthDate: '',
        maritalStatus: MARITAL_STATUSES[0] || 'Bekar',
        childCount: 0,
        bloodGroup: BLOOD_GROUPS[0] || '',
        isForeign: false
      },
      wage: employee.wage || { netSalary: 0, mealAllowance: 0, roadAllowance: 0, totalPaidAmount: 0, currency: 'TRY', hasIncentive: false },
      leave: employee.leave || { remainingAnnualLeaveDays: 0, remainingCompensatoryLeaveHours: '00:00' },
      work: employee.work || { hireDate: new Date().toISOString(), department: employee.department || '', title: '', employmentType: 'Tam Zamanlı', retirementStatus: INSURANCE_TYPES[0] || 'Normal', workLocationType: 'HQ', actualWorkLocation: '', trialPeriodMonths: 2 },
      system: employee.system || { showInPdks: true, isActive: employee.isActive ?? true, role: 'USER' }
    });
  }, [employee]);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'general', label: 'Genel Bilgiler', icon: User },
    { id: 'salary', label: 'Ücret & Yan Haklar', icon: CreditCard },
    { id: 'salaryHistory', label: 'Maaş Geçmişi', icon: TrendingUp },
    { id: 'work', label: 'Çalışma Bilgileri', icon: Briefcase },
    { id: 'documents', label: 'Belgeler', icon: FileText },
    { id: 'system', label: 'Sistem Ayarları', icon: Settings },
    { id: 'history', label: 'Değişiklik Geçmişi', icon: History },
  ];

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => log.targetId === employee.id).sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  }, [auditLogs, employee.id]);

  const handleSave = () => {
    setError(null);
    if (!formData.core?.name || !formData.core?.tcNo) {
      setError('Ad Soyad ve TCKN zorunludur.');
      return;
    }

    onSave(formData);
    setIsEditing(false);
  };

  const handleChange = (layer: keyof Employee, field: string, value: any) => {
    setFormData(prev => {
      let finalValue = value;
      const extraChanges: Partial<Employee> = {};

      // If terminationDate is set/cleared, automatically update isActive
      if (layer === 'work' && field === 'terminationDate') {
        const isActive = !value;
        const updatedSystem = { ...(prev.system || {}), isActive };
        extraChanges.system = updatedSystem as any;
        extraChanges.isActive = isActive;
      }

      const updatedLayer = {
        ...(prev[layer] as any),
        [field]: finalValue
      };
      
      const updatedEmp = {
        ...prev,
        ...extraChanges,
        [layer]: updatedLayer
      };

      // Sync top-level fields for compatibility
      if (layer === 'core' && field === 'name') updatedEmp.name = finalValue;
      if (layer === 'core' && field === 'tcNo') updatedEmp.tcNo = finalValue;
      if (layer === 'work' && field === 'department') updatedEmp.department = finalValue;
      if (layer === 'system' && field === 'isActive') updatedEmp.isActive = finalValue;

      return updatedEmp;
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Section title="Kimlik Bilgileri" icon={User}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Ad Soyad">
                  <input 
                    type="text" 
                    value={formData.core?.name || ''} 
                    onChange={(e) => handleChange('core', 'name', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                  />
                </Field>
                <Field label="TC Kimlik No">
                  <input 
                    type="text" 
                    value={formData.core?.tcNo || ''} 
                    onChange={(e) => handleChange('core', 'tcNo', e.target.value)}
                    disabled={!isEditing}
                    maxLength={11}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                  />
                </Field>
                <Field label="Doğum Tarihi">
                  <input 
                    type="date" 
                    value={formData.core?.birthDate || ''} 
                    onChange={(e) => handleChange('core', 'birthDate', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                  />
                </Field>
                <Field label="Kan Grubu">
                  <select 
                    value={formData.core?.bloodGroup || ''} 
                    onChange={(e) => handleChange('core', 'bloodGroup', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                  >
                    <option value="">Seçiniz...</option>
                    {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Medeni Durum">
                  <select 
                    value={formData.core?.maritalStatus || 'Bekar'} 
                    onChange={(e) => handleChange('core', 'maritalStatus', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                  >
                    {MARITAL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Çocuk Sayısı">
                  <input 
                    type="number" 
                    value={formData.core?.childCount || 0} 
                    onChange={(e) => handleChange('core', 'childCount', parseInt(e.target.value) || 0)}
                    disabled={!isEditing}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                  />
                </Field>
                <Field label="Cinsiyet">
                  <select 
                    value={formData.core?.gender || 'Erkek'} 
                    onChange={(e) => handleChange('core', 'gender', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                  >
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Mezuniyet">
                  <select 
                    value={formData.core?.education || 'Lisans'} 
                    onChange={(e) => handleChange('core', 'education', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                  >
                    {EDUCATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </Field>
                <Field label="Yabancı Uyruklu mu?">
                  <select 
                    value={formData.core?.isForeign ? 'Evet' : 'Hayır'} 
                    onChange={(e) => handleChange('core', 'isForeign', e.target.value === 'Evet')}
                    disabled={!isEditing}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                  >
                    <option value="Hayır">Hayır</option>
                    <option value="Evet">Evet</option>
                  </select>
                </Field>
              </div>
            </Section>

            <Section title="İletişim & Adres" icon={MapPin}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <Field label="E-Posta">
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="email" 
                        value={formData.core.email || ''} 
                        onChange={(e) => handleChange('core', 'email', e.target.value)}
                        disabled={!isEditing}
                        className="w-full pl-10 pr-3.5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                      />
                    </div>
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Telefon">
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={formData.core.phone || ''} 
                        onChange={(e) => handleChange('core', 'phone', e.target.value)}
                        disabled={!isEditing}
                        className="w-full pl-10 pr-3.5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                      />
                    </div>
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="İkamet Adresi">
                    <div className="relative">
                      <Home className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <textarea 
                        value={formData.core.residenceAddress} 
                        onChange={(e) => handleChange('core', 'residenceAddress', e.target.value)}
                        disabled={!isEditing}
                        rows={3}
                        className="w-full pl-10 pr-3.5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all resize-none"
                      />
                    </div>
                  </Field>
                </div>
                <Field label="İkamet İli">
                  <select 
                    value={formData.core.residenceCity || ''} 
                    onChange={(e) => {
                      handleChange('core', 'residenceCity', e.target.value);
                      handleChange('core', 'residenceDistrict', '');
                    }}
                    disabled={!isEditing}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                  >
                    <option value="">Seçiniz...</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="İkamet İlçesi" description="* Bu alan Genel Merkez haritasındaki dağılımı belirler.">
                  <select 
                    value={formData.core.residenceDistrict || ''} 
                    onChange={(e) => handleChange('core', 'residenceDistrict', e.target.value)}
                    disabled={!isEditing || !formData.core.residenceCity}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                  >
                    <option value="">Seçiniz...</option>
                    {formData.core.residenceCity && (districts[formData.core.residenceCity] || []).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </Section>
          </div>
        );
      case 'salary':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Section title="Ücret Bilgileri" icon={Wallet}>
              <div className="grid grid-cols-1 gap-5">
                <Field label="Net Maaş">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">₺</span>
                    <input 
                      type="text" 
                      value={formData.wage.netSalary.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                      onChange={(e) => {
                        const val = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.')) || 0;
                        handleChange('wage', 'netSalary', val);
                      }}
                      disabled={!isEditing}
                      className="w-full pl-9 pr-3.5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                    />
                  </div>
                </Field>
                <Field label="Toplam Hesaba Yatan">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">₺</span>
                    <input 
                      type="text" 
                      value={formData.wage.totalPaidAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                      onChange={(e) => {
                        const val = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.')) || 0;
                        handleChange('wage', 'totalPaidAmount', val);
                      }}
                      disabled={!isEditing}
                      className="w-full pl-9 pr-3.5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                    />
                  </div>
                </Field>
              </div>
            </Section>

            <Section title="Yan Haklar" icon={CreditCard}>
              <div className="grid grid-cols-1 gap-5">
                <Field label="Yemek Ödeneği">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">₺</span>
                    <input 
                      type="text" 
                      value={formData.wage.mealAllowance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                      onChange={(e) => {
                        const val = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.')) || 0;
                        handleChange('wage', 'mealAllowance', val);
                      }}
                      disabled={!isEditing}
                      className="w-full pl-9 pr-3.5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                    />
                  </div>
                </Field>
                <Field label="Yol Ödeneği">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">₺</span>
                    <input 
                      type="text" 
                      value={formData.wage.roadAllowance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                      onChange={(e) => {
                        const val = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.')) || 0;
                        handleChange('wage', 'roadAllowance', val);
                      }}
                      disabled={!isEditing}
                      className="w-full pl-9 pr-3.5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                    />
                  </div>
                </Field>
              </div>
            </Section>
          </div>
        );
      case 'salaryHistory':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Section title="Ücret Değişiklik Geçmişi" icon={History}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-slate-100">
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Eski Maaş</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Yeni Maaş</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Artış</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarih</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Yapan</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Açıklama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {salaryHistory.filter(h => h.employeeId === employee.id).sort((a, b) => new Date(b.changeDate).getTime() - new Date(a.changeDate).getTime()).map(h => {
                      const increase = ((h.newSalary - h.oldSalary) / h.oldSalary) * 100;
                      return (
                        <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 text-xs text-slate-500">₺{h.oldSalary.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-4 text-xs font-black text-slate-900">₺{h.newSalary.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-4">
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg">%{increase.toFixed(1)}</span>
                          </td>
                          <td className="py-4 text-[10px] text-slate-400 font-bold uppercase">{new Date(h.changeDate).toLocaleDateString('tr-TR')}</td>
                          <td className="py-4 text-xs font-bold text-slate-600">{h.changedBy}</td>
                          <td className="py-4 text-xs text-slate-500">{h.reason}</td>
                        </tr>
                      );
                    })}
                    {salaryHistory.filter(h => h.employeeId === employee.id).length === 0 && (
                      <tr><td colSpan={6} className="py-10 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">Kayıt bulunamadı</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        );
      case 'leave':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Section title="İzin Bakiyeleri" icon={Calendar}>
              <div className="grid grid-cols-1 gap-5">
                <Field label="Kalan Yıllık İzin (Gün)">
                  <input 
                    type="number" 
                    value={formData.leave.remainingAnnualLeaveDays} 
                    onChange={(e) => handleChange('leave', 'remainingAnnualLeaveDays', parseInt(e.target.value) || 0)}
                    disabled={!isEditing}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                  />
                </Field>
                <Field label="Kalan Denkleştirme İzni (HH:MM)">
                  <input 
                    type="text" 
                    value={formData.leave.remainingCompensatoryLeaveHours} 
                    onChange={(e) => handleChange('leave', 'remainingCompensatoryLeaveHours', e.target.value)}
                    disabled={!isEditing}
                    placeholder="00:00"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all font-mono"
                  />
                </Field>
              </div>
            </Section>
            <div className="bg-amber-50 p-6 md:p-8 rounded-[2rem] border border-amber-100 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h5 className="text-sm font-black text-amber-900 uppercase tracking-tight">İzin Takibi Notu</h5>
              </div>
              <p className="text-sm text-amber-800/80 font-medium leading-relaxed">
                Yıllık izin bakiyesi her yıl işe giriş tarihinde otomatik olarak güncellenir. Denkleştirme izni ise PDKS modülündeki ekstra çalışma veya eksik çalışma durumlarına göre anlık olarak değişebilir.
              </p>
            </div>
          </div>
        );
      case 'work':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Section title="Organizasyonel Bilgiler" icon={Briefcase}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="İşe Giriş Tarihi">
                  <input 
                    type="date" 
                    value={formData.work.hireDate} 
                    onChange={(e) => handleChange('work', 'hireDate', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                  />
                </Field>
                <Field label="Çıkış Tarihi">
                  <input 
                    type="date" 
                    value={formData.work.terminationDate || ''} 
                    onChange={(e) => handleChange('work', 'terminationDate', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Çıkış Kodu">
                    <input 
                      type="text" 
                      value={formData.work.terminationCode || ''} 
                      onChange={(e) => handleChange('work', 'terminationCode', e.target.value)}
                      disabled={!isEditing}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                    />
                  </Field>
                </div>
                <Field label="Departman">
                  <select 
                    value={formData.work.department} 
                    onChange={(e) => handleChange('work', 'department', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                  >
                    {departments.slice().sort((a, b) => a.localeCompare(b)).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Ünvan">
                  <select 
                    value={formData.work.title} 
                    onChange={(e) => handleChange('work', 'title', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                  >
                    {titles.slice().sort((a, b) => a.localeCompare(b)).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Çalışma Şekli">
                  <select 
                    value={formData.work.employmentType} 
                    onChange={(e) => handleChange('work', 'employmentType', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                  >
                    {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Sigorta Türü">
                  <select 
                    value={formData.work.retirementStatus} 
                    onChange={(e) => handleChange('work', 'retirementStatus', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                  >
                    {INSURANCE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            </Section>

            <div className="space-y-6">
              <Section title="Görev Yeri Bilgileri" icon={MapPin}>
                <div className="grid grid-cols-1 gap-5">
                  <Field label="Merkez / Saha">
                    <select 
                      value={formData.work.workLocationType} 
                      onChange={(e) => handleChange('work', 'workLocationType', e.target.value)}
                      disabled={!isEditing}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                    >
                      <option value="HQ">Merkez</option>
                      <option value="FIELD">Saha</option>
                    </select>
                  </Field>
                  <Field label="Fiili Görev Yeri">
                    <select 
                      value={formData.work.actualWorkLocation} 
                      onChange={(e) => handleChange('work', 'actualWorkLocation', e.target.value)}
                      disabled={!isEditing}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                    >
                      {locations.slice().sort((a, b) => a.name.localeCompare(b.name)).map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Deneme Süresi (Ay)">
                    <input 
                      type="number" 
                      value={formData.work.trialPeriodMonths} 
                      onChange={(e) => handleChange('work', 'trialPeriodMonths', parseInt(e.target.value) || 2)}
                      disabled={!isEditing}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60 transition-all"
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Yönetici Bilgileri" icon={Users}>
                <div className="grid grid-cols-1 gap-5">
                  <label className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={formData.work.isUnitManager || false}
                        onChange={(e) => handleChange('work', 'isUnitManager', e.target.checked)}
                        disabled={!isEditing}
                        className="peer w-6 h-6 text-brand-500 bg-white border-2 border-slate-300 rounded-lg focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 transition-all cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-800 block group-hover:text-brand-700 transition-colors">Birim Sorumlusu</span>
                      <span className="text-[10px] font-medium text-slate-500 mt-0.5 block">Bu personel bir veya birden fazla birimin yöneticisidir.</span>
                    </div>
                  </label>

                  {formData.work.isUnitManager && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sorumlu Olduğu Birimler</label>
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 max-h-60 overflow-y-auto space-y-3 custom-scrollbar">
                        {departments.slice().sort((a, b) => a.localeCompare(b)).map(dept => (
                          <label key={dept} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={(formData.work.managedDepartments || []).includes(dept)}
                              onChange={(e) => {
                                const current = formData.work.managedDepartments || [];
                                const updated = e.target.checked 
                                  ? [...current, dept] 
                                  : current.filter(d => d !== dept);
                                handleChange('work', 'managedDepartments', updated);
                              }}
                              disabled={!isEditing}
                              className="w-5 h-5 text-brand-500 bg-white border-2 border-slate-300 rounded focus:ring-brand-500 focus:ring-offset-1 disabled:opacity-50 transition-all cursor-pointer"
                            />
                            <span className="text-sm font-bold text-slate-700 group-hover:text-brand-600 transition-colors">{dept}</span>
                          </label>
                        ))}
                        {departments.length === 0 && (
                          <div className="text-center py-4">
                            <span className="text-xs text-slate-400 font-medium">Sistemde kayıtlı departman bulunmuyor.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            </div>
          </div>
        );
      case 'documents':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Section 
              title="Özlük Dosyası & Belgeler" 
              icon={FileText}
              action={
                <label className="cursor-pointer px-4 py-2 bg-brand-50 text-brand-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-100 transition-all">
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onUploadDocument({
                          employeeId: employee.id,
                          fileName: file.name,
                          fileType: 'Diğer',
                          fileSize: file.size
                        });
                      }
                    }}
                  />
                  Belge Yükle
                </label>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {documents.filter(d => d.employeeId === employee.id && !d.isDeleted).map(doc => (
                  <div key={doc.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between group hover:border-brand-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-brand-500 border border-slate-200 shadow-sm">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 truncate max-w-[150px]">{doc.fileName}</p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-tight mt-0.5">{doc.fileType} • {(doc.fileSize / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => window.open(doc.fileUrl, '_blank')}
                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                        title="Görüntüle"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDeleteDocument(doc.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {documents.filter(d => d.employeeId === employee.id && !d.isDeleted).length === 0 && (
                  <div className="col-span-full py-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                      <FileText className="w-8 h-8" />
                    </div>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Henüz belge yüklenmemiş</p>
                  </div>
                )}
              </div>
            </Section>
          </div>
        );
      case 'system':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Section title="Entegrasyon Ayarları" icon={Settings}>
              <div className="grid grid-cols-1 gap-5">
                <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <p className="text-sm font-bold text-slate-800">PDKS'de Görünsün mü?</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-0.5">Bu personel PDKS listesine dahil edilsin mi?</p>
                  </div>
                  <button 
                    onClick={() => isEditing && handleChange('system', 'showInPdks', formData.system.showInPdks === false ? true : false)}
                    disabled={!isEditing}
                    className={`w-14 h-7 rounded-full transition-all relative ${formData.system.showInPdks !== false ? 'bg-brand-500 shadow-inner' : 'bg-slate-300'} disabled:opacity-60`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${formData.system.showInPdks !== false ? 'left-8' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>
            </Section>
            <div className="bg-slate-900 p-8 md:p-10 rounded-[2rem] text-white flex flex-col justify-center shadow-lg">
              <ShieldCheck className="w-14 h-14 text-brand-400 mb-6" />
              <h5 className="text-xl font-black uppercase tracking-tight mb-3">Güvenli Veri Yönetimi</h5>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                Personel verileri şifrelenmiş olarak saklanır. Yapılan tüm değişiklikler denetim günlüğüne kaydedilir ve geri alınabilir.
              </p>
            </div>
          </div>
        );
      case 'history':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Section title="Değişiklik Geçmişi" icon={History}>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredLogs.length > 0 ? filteredLogs.map(log => (
                  <div key={log.id} className="flex gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-brand-200 transition-colors group">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-brand-500 shrink-0 border border-slate-200 shadow-sm">
                      <History className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1.5">
                        <p className="text-sm font-bold text-slate-800 group-hover:text-brand-700 transition-colors">{log.action.toUpperCase()} - {log.changedBy}</p>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.changedAt).toLocaleString('tr-TR')}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">{log.details}</p>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                      <History className="w-8 h-8" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Henüz bir değişiklik kaydı bulunmuyor</p>
                  </div>
                )}
              </div>
            </Section>
          </div>
        );
    }
  };

  const seniority = useMemo(() => calculateSeniority(formData.work.hireDate), [formData.work.hireDate]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 print:p-0">
      {/* Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:shadow-none print:border-none print:p-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-3 bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-all print:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1.5">
                <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">{formData.core.name}</h2>
                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${
                  formData.work?.terminationDate 
                    ? 'bg-red-50 text-red-600 border border-red-100/50' 
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100/50'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    formData.work?.terminationDate ? 'bg-red-500' : 'bg-emerald-500'
                  }`} />
                  {formData.work?.terminationDate ? 'İşten Ayrıldı' : 'Aktif'}
                </span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-50 text-brand-600 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border border-brand-100/50">
                  <Award className="w-3.5 h-3.5" />
                  {formatSeniority(seniority)} Kıdem
                </div>
              </div>
              <p className="text-xs md:text-sm font-bold text-slate-500 flex items-center gap-2">
                <Briefcase className="w-4 h-4 opacity-50" />
                {formData.work.department} <span className="text-slate-300">•</span> {formData.work.title}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-4 md:mt-0 print:hidden">
          {!isEditing && (
            <button 
              onClick={onDelete}
              className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-red-50 text-red-600 font-black rounded-2xl hover:bg-red-100 transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Sil</span>
            </button>
          )}
          {isEditing ? (
            <button 
              onClick={handleSave}
              className="flex-1 md:flex-none px-6 md:px-8 py-3 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 transition-all uppercase text-xs tracking-widest shadow-lg shadow-brand-900/20 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Kaydet
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex-1 md:flex-none px-6 md:px-8 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all uppercase text-xs tracking-widest shadow-lg flex items-center justify-center gap-2"
            >
              <Edit2 className="w-4 h-4" /> Düzenle
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 flex items-center gap-3 text-sm font-bold">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/80 overflow-x-auto scrollbar-none">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[150px] flex items-center justify-center gap-2.5 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                activeTab === tab.id 
                  ? 'bg-white text-brand-600 border-brand-600' 
                  : 'text-slate-500 hover:text-slate-700 border-transparent hover:bg-white/50'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-brand-500' : 'opacity-50'}`} />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-8 md:p-10">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};
