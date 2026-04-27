import React, { useState } from 'react';
import { 
  Employee, 
  LocationRecord, 
  AuditLog, 
  ImportRecord, 
  SalaryHistory, 
  LeaveHistory, 
  PersonnelDocument, 
  AdvancedFilter,
  AppConfig,
  User
} from '../../types';
import { PersonnelDashboard } from './PersonnelDashboard';
import { PersonnelList } from './PersonnelList';
import { PersonnelDetail } from './PersonnelDetail';
import { MasterDataManagement } from './MasterDataManagement';
import { PersonnelReports } from './PersonnelReports';
import { PersonnelTrashBin } from './PersonnelTrashBin';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

interface Props {
  employees: Employee[];
  departments: string[];
  titles: string[];
  locations: LocationRecord[];
  cities: string[];
  districts: Record<string, string[]>;
  auditLogs: AuditLog[];
  salaryHistory: SalaryHistory[];
  leaveHistory: LeaveHistory[];
  documents: PersonnelDocument[];
  advancedFilters: AdvancedFilter[];
  importHistory: ImportRecord[];
  config: AppConfig;
  user: User | null;
  onUpdateEmployees: (employees: Employee[]) => void;
  onUpdateDepartments: (depts: string[]) => void;
  onUpdateTitles: (titles: string[]) => void;
  onUpdateLocations: (locs: LocationRecord[]) => void;
  onUpdateCities: (cities: string[]) => void;
  onUpdateDistricts: (districts: Record<string, string[]>) => void;
  onUpdateSalaryHistory: (history: SalaryHistory[]) => void;
  onUpdateLeaveHistory: (history: LeaveHistory[]) => void;
  onUpdateDocuments: (docs: PersonnelDocument[]) => void;
  onUpdateAdvancedFilters: (filters: AdvancedFilter[]) => void;
  onAddAuditLog: (log: AuditLog) => void;
  onUndoImport: (id: string) => void;
  onApplyImport: (data: any[], errors: string[]) => void;
  onTabChange: (tab: PersonnelTab) => void;
  initialTab?: string;
  initialEmployeeId?: string | null;
}

type PersonnelTab = 'dashboard' | 'list' | 'detail' | 'new' | 'master' | 'reports' | 'trash';

export const PersonnelManagement: React.FC<Props> = ({ 
  employees, departments, titles, locations,
  cities, districts,
  auditLogs, importHistory,
  salaryHistory, leaveHistory, documents, advancedFilters, config, user,
  onUpdateEmployees, onUpdateDepartments, onUpdateTitles, onUpdateLocations,
  onUpdateCities, onUpdateDistricts,
  onUpdateSalaryHistory, onUpdateLeaveHistory, onUpdateDocuments, onUpdateAdvancedFilters,
  onAddAuditLog, onUndoImport, onApplyImport, onTabChange,
  initialTab, initialEmployeeId
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(initialEmployeeId || null);

  // Sync with initial props if they change
  React.useEffect(() => {
    if (initialEmployeeId) setSelectedEmployeeId(initialEmployeeId);
  }, [initialEmployeeId]);

  const activeTab = (initialTab as PersonnelTab) || 'dashboard';

  const handleViewEmployee = (id: string) => {
    setSelectedEmployeeId(id);
    onTabChange('detail');
  };

  const handleEditEmployee = (id: string) => {
    setSelectedEmployeeId(id);
    onTabChange('detail');
  };

  const handleAddNew = () => {
    const newId = Date.now().toString();
    const newEmp: Employee = {
      id: newId,
      tcNo: '',
      name: 'Yeni Personel',
      department: departments[0] || '',
      isActive: true,
      core: {
        id: newId,
        tcNo: '',
        name: 'Yeni Personel',
        gender: 'Belirtmek İstemiyor',
        education: 'Lisans',
        residenceAddress: '',
      },
      wage: {
        netSalary: 0,
        mealAllowance: 0,
        roadAllowance: 0,
        totalPaidAmount: 0,
        currency: 'TRY'
      },
      leave: {
        remainingAnnualLeaveDays: 0,
        remainingCompensatoryLeaveHours: '00:00',
      },
      work: {
        hireDate: new Date().toISOString().split('T')[0],
        department: departments[0] || '',
        title: titles[0] || '',
        employmentType: 'Tam Zamanlı',
        retirementStatus: 'Normal',
        workLocationType: 'HQ',
        actualWorkLocation: locations[0]?.name || '',
        trialPeriodMonths: 2
      },
      system: {
        showInPdks: true,
        isActive: true,
        role: 'USER'
      }
    };
    onUpdateEmployees([...employees, newEmp]);
    setSelectedEmployeeId(newId);
    onTabChange('detail');
    
    onAddAuditLog({
      id: Date.now().toString(),
      targetId: newId,
      targetType: 'employee',
      action: 'create',
      changedBy: user?.username || 'Admin',
      changedAt: new Date().toISOString(),
      details: 'Yeni personel kaydı oluşturuldu.'
    });
  };

  const handleDelete = (id: string) => {
    const updated = employees.map(e => e.id === id ? { ...e, isDeleted: true, deletedAt: new Date().toISOString() } : e);
    onUpdateEmployees(updated);
    onAddAuditLog({
      id: Date.now().toString(),
      targetId: id,
      targetType: 'employee',
      action: 'delete',
      changedBy: user?.username || 'Admin',
      changedAt: new Date().toISOString(),
      details: 'Personel çöp kutusuna taşındı.'
    });
    // If we are in detail view, go back to list
    if (activeTab === 'detail') {
      onTabChange('list');
    }
  };

  const handleRestore = (id: string) => {
    const updated = employees.map(e => e.id === id ? { ...e, isDeleted: false, deletedAt: undefined } : e);
    onUpdateEmployees(updated);
    onAddAuditLog({
      id: Date.now().toString(),
      targetId: id,
      targetType: 'employee',
      action: 'restore',
      changedBy: user?.username || 'Admin',
      changedAt: new Date().toISOString(),
      details: 'Personel çöp kutusundan geri yüklendi.'
    });
  };

  const handlePermanentDelete = (id: string) => {
    onUpdateEmployees(employees.filter(e => e.id !== id));
  };

  const handleSaveEmployee = (updatedEmp: Employee) => {
    const oldEmp = employees.find(e => e.id === updatedEmp.id);
    
    // Track salary change
    if (oldEmp && oldEmp.wage.netSalary !== updatedEmp.wage.netSalary) {
      const newHistory: SalaryHistory = {
        id: Math.random().toString(36).substr(2, 9),
        employeeId: updatedEmp.id,
        oldSalary: oldEmp.wage.netSalary,
        newSalary: updatedEmp.wage.netSalary,
        changeDate: new Date().toISOString(),
        changedBy: user?.username || 'Admin',
        reason: 'Maaş Revizyonu'
      };
      onUpdateSalaryHistory([newHistory, ...salaryHistory]);
    }

    const updated = employees.map(e => e.id === updatedEmp.id ? updatedEmp : e);
    onUpdateEmployees(updated);
    
    // Simple diff for audit log
    const changes = [];
    if (oldEmp) {
      if (oldEmp.core.name !== updatedEmp.core.name) changes.push(`İsim: ${oldEmp.core.name} -> ${updatedEmp.core.name}`);
      if (oldEmp.wage.netSalary !== updatedEmp.wage.netSalary) changes.push(`Maaş: ${oldEmp.wage.netSalary} -> ${updatedEmp.wage.netSalary}`);
      if (oldEmp.work.department !== updatedEmp.work.department) changes.push(`Departman: ${oldEmp.work.department} -> ${updatedEmp.work.department}`);
    }

    onAddAuditLog({
      id: Date.now().toString(),
      targetId: updatedEmp.id,
      targetType: 'employee',
      action: 'update',
      changedBy: user?.username || 'Admin',
      changedAt: new Date().toISOString(),
      details: changes.length > 0 ? changes.join(', ') : 'Personel bilgileri güncellendi.'
    });
  };

  const handleExport = () => {
    const exportData = employees.filter(e => !e.isDeleted).map(emp => ({
      'Ad Soyad': emp.core.name,
      'TCKN': emp.core.tcNo,
      'İşe Giriş Tarihi': emp.work.hireDate,
      'Departman': emp.work.department,
      'Ünvan': emp.work.title,
      'Fiili Görev Yeri': emp.work.actualWorkLocation,
      'İkamet Adresi': emp.core.residenceAddress,
      'Net Maaş': emp.wage.netSalary,
      'Yemek Ödeneği': emp.wage.mealAllowance,
      'Yol Ödeneği': emp.wage.roadAllowance,
      'Toplam Hesaba Yatan': emp.wage.totalPaidAmount,
      'Kısmi/Tam Zamanlı': emp.work.employmentType,
      'Emekli Durumu': emp.work.retirementStatus,
      'Cinsiyet': emp.core.gender,
      'Mezuniyet': emp.core.education,
      'Merkez/Saha Durumu': emp.work.workLocationType === 'HQ' ? 'Merkez' : 'Saha',
      'Kalan Yıllık İzin': emp.leave.remainingAnnualLeaveDays,
      'Kalan Denkleştirme İzni': emp.leave.remainingCompensatoryLeaveHours,
      'İkamet İli': emp.core.residenceCity || '',
      'İkamet İlçesi': emp.core.residenceDistrict || '',
      'Çıkış Tarihi': emp.work.terminationDate || '',
      'Çıkış Kodu': emp.work.terminationCode || '',
      'PDKS’de Görünsün mü?': emp.system.showInPdks !== false ? 'Evet' : 'Hayır',
      'Yabancı Uyruklu mu?': emp.core.isForeign ? 'Evet' : 'Hayır',
      'Aktif mi?': emp.work.terminationDate ? 'İşten Ayrıldı' : 'Evet'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Personel_Listesi');
    XLSX.writeFile(workbook, `IK360_Personel_Listesi_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleUploadDocument = (doc: Omit<PersonnelDocument, 'id' | 'uploadDate' | 'uploadedBy'>) => {
    const newDoc: PersonnelDocument = {
      ...doc,
      id: Math.random().toString(36).substr(2, 9),
      uploadDate: new Date().toISOString(),
      uploadedBy: user?.username || 'Admin'
    };
    onUpdateDocuments([newDoc, ...documents]);
    onAddAuditLog({
      id: Date.now().toString(),
      targetId: doc.employeeId,
      targetType: 'employee',
      action: 'update',
      changedBy: user?.username || 'Admin',
      changedAt: new Date().toISOString(),
      details: `Belge yüklendi: ${doc.fileName}`
    });
  };

  const handleDeleteDocument = (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;
    const updated = documents.map(d => d.id === id ? { ...d, isDeleted: true, deletedAt: new Date().toISOString() } : d);
    onUpdateDocuments(updated);
    onAddAuditLog({
      id: Date.now().toString(),
      targetId: doc.employeeId,
      targetType: 'employee',
      action: 'update',
      changedBy: user?.username || 'Admin',
      changedAt: new Date().toISOString(),
      details: `Belge silindi: ${doc.fileName}`
    });
  };

  const handleDrillDown = (filter: any) => {
    if (filter.id) {
      setSelectedEmployeeId(filter.id);
      onTabChange('detail');
    } else {
      onUpdateAdvancedFilters({
        ...advancedFilters,
        department: filter.department || '',
        gender: filter.gender || '',
        location: filter.location || '',
      });
      onTabChange('list');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <PersonnelDashboard 
            employees={employees} 
            departments={departments} 
            titles={titles} 
            locations={locations} 
            salaryHistory={salaryHistory}
            config={config}
            onDrillDown={handleDrillDown}
            user={user}
          />
        );
      case 'list':
        return (
          <PersonnelList 
            employees={employees} 
            departments={departments} 
            titles={titles} 
            locations={locations}
            advancedFilters={advancedFilters}
            importHistory={importHistory}
            onView={handleViewEmployee}
            onEdit={handleEditEmployee}
            onDelete={handleDelete}
            onAddNew={handleAddNew}
            onExport={handleExport}
            onUndoImport={onUndoImport}
            onApplyImport={onApplyImport}
            onUpdateAdvancedFilters={onUpdateAdvancedFilters}
            user={user}
          />
        );
      case 'detail':
        const emp = employees.find(e => e.id === selectedEmployeeId);
        if (!emp) return <div className="p-20 text-center text-slate-400">Personel bulunamadı.</div>;
        return (
          <PersonnelDetail 
            employee={emp} 
            auditLogs={auditLogs} 
            salaryHistory={salaryHistory}
            documents={documents}
            departments={departments} 
            titles={titles} 
            locations={locations}
            cities={cities}
            districts={districts}
            user={user}
            onBack={() => onTabChange('list')}
            onSave={handleSaveEmployee}
            onUploadDocument={handleUploadDocument}
            onDeleteDocument={handleDeleteDocument}
            onDelete={() => handleDelete(emp.id)}
          />
        );
      case 'master':
        return (
          <MasterDataManagement 
            departments={departments} 
            titles={titles} 
            locations={locations}
            cities={cities}
            districts={districts}
            onUpdateDepartments={onUpdateDepartments}
            onUpdateTitles={onUpdateTitles}
            onUpdateLocations={onUpdateLocations}
            onUpdateCities={onUpdateCities}
            onUpdateDistricts={onUpdateDistricts}
          />
        );
      case 'reports':
        return (
          <PersonnelReports 
            employees={employees} 
            departments={departments} 
            titles={titles} 
            locations={locations} 
            onExport={handleExport} 
            salaryHistory={salaryHistory}
            leaveHistory={leaveHistory}
            config={config}
          />
        );
      case 'trash':
        return <PersonnelTrashBin employees={employees} onRestore={handleRestore} onPermanentDelete={handlePermanentDelete} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-white relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
