
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Employee, AppConfig, DEFAULT_CONFIG, MonthlyInput, MonthlyResult, UnitConfig, NotificationRecord, BackupConfig, DEFAULT_BACKUP_CONFIG, MonthStatus, AppState, SyncStatus, DocumentRecord, NotificationLog, NotificationConfig, DEFAULT_NOTIFICATION_CONFIG, DepartmentManager, MessageTemplate, ManagerMessageTemplate, User, ImportRecord, LeaveRecord, LeaveSettings, DEFAULT_LEAVE_SETTINGS, NotificationScenario, DEFAULT_MESSAGE_TEMPLATES, DEFAULT_MANAGER_TEMPLATE } from './types';
import { Task } from './types/task';
import { calculateMonthlyPayroll } from './services/calculator';
import { ExcelRow } from './services/excelService';
import { generateProfessionalReport } from './services/exportService';
import { persistence } from './services/persistence';
import { api } from './services/api';

// Components
import { MonthClosingModal } from './components/MonthClosingModal';
import { Sidebar } from './components/Sidebar';
import { MonthlyTable } from './components/MonthlyTable';
import { MonthSelector } from './components/MonthSelector';
import { NotificationModal } from './components/NotificationModal';
import { ImportWizard } from './components/ImportWizard';
import { DocumentArchive } from './components/DocumentArchive';
import { OfficialDocumentModal } from './components/OfficialDocumentModal';
import { NotificationCenter } from './components/NotificationCenter'; 
import { DeductionDetails } from './components/DeductionDetails';
import { MessageTemplatesPage } from './components/MessageTemplatesPage';
import { PersonnelNotificationPage } from './components/PersonnelNotificationPage';
import { UnitManagerNotificationPage } from './components/UnitManagerNotificationPage';
import { LoginPage } from './components/LoginPage';
import { RuleManager } from './components/RuleManager';
import { SystemSettings } from './components/SystemSettings';
import { DashboardPanel } from './components/DashboardPanel';
import { Dashboard } from './components/Dashboard';

// New Modules
import { TaskManager } from './components/modules/TaskManager';
import { LeaveModule } from './components/modules/LeaveModule';
import { NotesModule } from './components/notes/NotesModule';
import { ReminderNotification } from './components/notes/ReminderNotification';

import { PersonnelManagement } from './components/personnel/PersonnelManagement';
import { AppErrorBoundary } from './components/AppErrorBoundary';

import { 
  LogOut, 
  Upload, 
  Key,
  Loader2,
  AlertTriangle,
  RefreshCcw,
  LayoutGrid,
  X
} from 'lucide-react';
import { motion } from 'motion/react';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.05)_0%,transparent_100%)]"></div>
    <div className="relative z-10 flex flex-col items-center">
      <div className="mb-8 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-1 select-none"
        >
          <motion.span 
            animate={{ 
              color: ['#0ea5e9', '#6366f1', '#0ea5e9'],
              textShadow: [
                '0 0 20px rgba(14,165,233,0.3)',
                '0 0 40px rgba(99,102,241,0.5)',
                '0 0 20px rgba(14,165,233,0.3)'
              ]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-6xl font-black tracking-tighter"
          >
            ik
          </motion.span>
          <motion.span 
            animate={{ 
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-6xl font-black text-white tracking-tighter"
          >
            360
          </motion.span>
        </motion.div>
      </div>
      <Loader2 className="animate-spin text-brand-500 w-12 h-12 mb-6" />
      <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Sistem Yükleniyor...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('AUTH_TOKEN');
    } catch (e) {
      console.error("localStorage access denied", e);
      return null;
    }
  });
  const [isAuthChecking, setIsAuthChecking] = useState(false);

  // App State & Routing
  const [activeModule, setActiveModule] = useState<string>('dashboard'); 
  const [activeTab, setActiveTab] = useState('dashboard'); // For PDKS internal tabs
  const [loading, setLoading] = useState(false);
  
  // Sync State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [dataVersion, setDataVersion] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<string>(new Date().toISOString());

  // Data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [unitConfigs, setUnitConfigs] = useState<UnitConfig[]>([]); // Added unit configs
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [backupConfig, setBackupConfig] = useState<BackupConfig>(DEFAULT_BACKUP_CONFIG);
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const d = new Date();
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return monthStr < '2026-01' ? '2026-01' : monthStr;
  });
  const [allInputs, setAllInputs] = useState<Record<string, Record<string, MonthlyInput>>>({});
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]); 
  const [monthStatus, setMonthStatus] = useState<Record<string, MonthStatus>>({});
  const [departments, setDepartments] = useState<string[]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<Record<string, string[]>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistory[]>([]);
  const [leaveHistory, setLeaveHistory] = useState<LeaveHistory[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilter[]>([]);
  const [departmentManagers, setDepartmentManagers] = useState<DepartmentManager[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);
  const [managerMessageTemplates, setManagerMessageTemplates] = useState<ManagerMessageTemplate[]>([]);
  const [imports, setImports] = useState<ImportRecord[]>([]);

  // Module States
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [leaveSettings, setLeaveSettings] = useState<LeaveSettings>(DEFAULT_LEAVE_SETTINGS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [notesSettings, setNotesSettings] = useState<any>(null);
  const [goals, setGoals] = useState<Goal[]>([]);

  // Password Change State
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null);

  // Sub-tab for Deduction Details
  const [deductionSubTab, setDeductionSubTab] = useState<'salary' | 'leave'>('salary');

  // Notification System State
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>(DEFAULT_NOTIFICATION_CONFIG);

  // Personnel Navigation State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [activeDraft, setActiveDraft] = useState<{emp: Employee, draft: Partial<NotificationRecord>} | null>(null);
  const [personnelInitialTab, setPersonnelInitialTab] = useState<string>('dashboard');
  const [personnelInitialId, setPersonnelInitialId] = useState<string | null>(null);
  const [initialDepartment, setInitialDepartment] = useState<string | undefined>(undefined);
  
  // Archive Viewer Modal State
  const [viewingDoc, setViewingDoc] = useState<{emp: Employee, res: MonthlyResult} | null>(null);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [showUndoConfirm, setShowUndoConfirm] = useState<string | null>(null);
  const [showMonthClosingModal, setShowMonthClosingModal] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());

  // Check Auth on Mount
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    console.log("Checking auth...");
    try {
      const savedToken = localStorage.getItem('AUTH_TOKEN');
      const savedUser = localStorage.getItem('AUTH_USER');
      console.log("Saved token:", savedToken, "Saved user:", savedUser);
      if (savedToken && savedUser) {
        try {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Failed to parse saved user", e);
          localStorage.removeItem('AUTH_USER');
          localStorage.removeItem('AUTH_TOKEN');
        }
      }
    } catch (e) {
      console.error("Failed to access localStorage", e);
    }
    setIsAuthChecking(false);
    console.log("Auth check complete. isAuthChecking set to false.");
  }, []);

  useEffect(() => {
    console.log("Health check effect running...");
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) setServerStatus('online');
        else setServerStatus('offline');
      } catch {
        setServerStatus('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // 1. Initial Data Load
  useEffect(() => {
    if (!token || !user) return;

    const init = async () => {
      console.log("Initializing data...");
      setLoading(true);
      try {
        const { state, source } = await persistence.load();
        console.log("Data loaded from:", source);
        
        setEmployees(state.employees || []);
        setUnitConfigs(state.unitConfigs || []); // Load unit configs
        setAllInputs(state.inputs || {});
        setNotifications(state.notifications || []);
        setDocuments(state.documents || []); 
        setConfig(state.config || DEFAULT_CONFIG);
        setBackupConfig(state.backupConfig || DEFAULT_BACKUP_CONFIG);
        setMonthStatus(state.monthStatus || {});
        setDepartments(state.departments || ['Yazılım', 'İK', 'Finans', 'Pazarlama']);
        setTitles(state.titles || ['Uzman', 'Müdür', 'Direktör', 'Asistan']);
        setLocations(state.locations || [
          { id: '1', name: 'Merkez', type: 'HQ', isActive: true },
          { id: '2', name: 'Saha - İstanbul', type: 'FIELD', isActive: true },
          { id: '3', name: 'Saha - Ankara', type: 'FIELD', isActive: true }
        ]);
        setAuditLogs(state.auditLogs || []);
        setSalaryHistory(state.salaryHistory || []);
        setLeaveHistory(state.leaveHistory || []);
        setAdvancedFilters(state.advancedFilters || []);
        setCities(state.cities || []);
        setDistricts(state.districts || {});
        setNotificationLogs([]);
        setNotificationConfig(state.notificationConfig || DEFAULT_NOTIFICATION_CONFIG);
        setDepartmentManagers(state.departmentManagers || []);
        setMessageTemplates(state.messageTemplates?.length ? state.messageTemplates : DEFAULT_MESSAGE_TEMPLATES);
        setManagerMessageTemplates(state.managerMessageTemplates?.length ? state.managerMessageTemplates : [DEFAULT_MANAGER_TEMPLATE]);
        setNotifications(state.notifications || []);
        setImports(state.imports || []);
        setLeaveRecords(state.leaveRecords || []);
        setLeaveSettings(state.leaveSettings || DEFAULT_LEAVE_SETTINGS);
        setTasks(state.tasks || []);
        setNotes(state.notes || []);
        setReminders(state.reminders || []);
        setNotesSettings(state.notesSettings || null);
        setGoals(state.goals || []);
        setDataVersion(state.version || 0);

        // Find the first unlocked month starting from January 2026
        const loadedMonthStatus = state.monthStatus || {};
        const startYear = 2026;
        const startMonth = 1;
        let foundMonth = '2026-01';
        
        for (let i = 0; i < 36; i++) {
          const d = new Date(startYear, startMonth - 1 + i, 1);
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (!loadedMonthStatus[monthKey]?.isLocked) {
            foundMonth = monthKey;
            break;
          }
        }
        setCurrentMonth(foundMonth);

        if (source === 'server' || source === 'local') setSyncStatus('saved');

        if (user.mustChangePassword) setShowPasswordChange(true);
        console.log("Data initialization complete.");
      } catch (err: any) {
        console.error("Failed to load initial data", err);
        if (err.message === 'AUTH_REQUIRED') handleLogout();
      } finally {
        setLoading(false);
        console.log("Loading set to false.");
      }
    };
    init();
  }, [token, user]);

  // Construct current app state object (for saving/exporting)
  const currentAppState: AppState = useMemo(() => ({
    employees,
    inputs: allInputs,
    results: {}, // We calculate this on the fly but can persist if needed
    unitConfigs,
    notifications,
    documents, 
    monthStatus,
    config,
    backupConfig,
    departments,
    titles,
    locations,
    cities,
    districts,
    auditLogs,
    salaryHistory,
    leaveHistory,
    advancedFilters,
    notificationLogs,
    notificationConfig,
    departmentManagers,
    messageTemplates,
    managerMessageTemplates,
    imports,
    leaveRecords,
    leaveSettings,
    tasks,
    notes,
    reminders,
    notesSettings,
    goals
  }), [
    employees, allInputs, notifications, documents, monthStatus, config, backupConfig, 
    departments, titles, locations,
    cities, districts,
    notificationLogs, notificationConfig, departmentManagers, 
    messageTemplates, managerMessageTemplates, imports, unitConfigs,
    auditLogs, salaryHistory, leaveHistory, advancedFilters,
    leaveRecords, leaveSettings, tasks, notes, reminders, notesSettings, goals
  ]);

  // 3. Auto Save Trigger
  const triggerSave = useCallback(() => {
    if (loading || !token) return;

    persistence.scheduleSave(
      currentAppState, 
      setSyncStatus, 
      (newVersion) => {
        setDataVersion(newVersion);
        setLastSavedAt(new Date().toISOString());
      }
    );
  }, [currentAppState, loading, token]);

  useEffect(() => {
    console.log("Auto-save effect running...");
    if (!loading) triggerSave();
  }, [triggerSave, loading]); 

  const handleUndoImport = useCallback((id: string) => {
    setImports(prevImports => {
      const record = prevImports.find(i => i.id === id);
      if (!record) return prevImports;

      const month = record.month;
      const affectedData = record.data || {};

      // 1. Remove inputs associated with this import
      setAllInputs(prevInputs => {
        const monthInputs = { ...(prevInputs[month] || {}) };
        Object.keys(affectedData).forEach(empId => {
          delete monthInputs[empId];
        });
        return { ...prevInputs, [month]: monthInputs };
      });

      // 2. Mark import as deleted in history
      return prevImports.map(imp => 
        imp.id === id ? { ...imp, isDeleted: true, deletedAt: new Date().toISOString() } : imp
      );
    });
  }, []);

  // derived data
  const activeEmployees = useMemo(() => employees.filter(e => !e.isDeleted), [employees]);
  const pdksEmployees = useMemo(() => activeEmployees.filter(e => e.system?.showInPdks !== false), [activeEmployees]);
  const deletedEmployees = useMemo(() => employees.filter(e => e.isDeleted), [employees]);
  const activeDocuments = useMemo(() => documents.filter(d => !d.isDeleted), [documents]);
  const deletedDocuments = useMemo(() => documents.filter(d => d.isDeleted), [documents]);
  const deletedNotifications = useMemo(() => notifications.filter(n => n.isDeleted), [notifications]);
  const activeManagers = useMemo(() => departmentManagers.filter(m => !m.isDeleted), [departmentManagers]);
  const deletedManagers = useMemo(() => departmentManagers.filter(m => m.isDeleted), [departmentManagers]);

  const lastImport = useMemo(() => {
    return imports
      .filter(imp => imp.month === currentMonth && !imp.isDeleted)
      .sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime())[0];
  }, [imports, currentMonth]);

  const monthName = useMemo(() => {
    const [year, month] = currentMonth.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  }, [currentMonth]);

  const allCalculatedResults = useMemo(() => {
    console.log("Recalculating all PDKS results...", { employeeCount: employees.length, monthCount: Object.keys(allInputs).length });
    try {
      const inputMonths = Object.keys(allInputs).filter(m => m >= '2026-01').sort();
      let startMonth = inputMonths.length > 0 ? inputMonths[0] : (currentMonth < '2026-01' ? '2026-01' : currentMonth);
      if (currentMonth < startMonth) startMonth = startMonth; // Ensure we don't go before startMonth
      
      // System start date constraint
      if (startMonth < '2026-01') startMonth = '2026-01';
      
      // Ensure we have at least 6 months for trend if possible
      const [cy, cm] = currentMonth.split('-').map(Number);
      const sixMonthsAgo = new Date(cy, cm - 6, 1);
      const sixMonthsAgoStr = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
      if (sixMonthsAgoStr < startMonth) startMonth = sixMonthsAgoStr;

      const monthsToProcess: string[] = [];
      let ptr = startMonth;
      while (ptr <= currentMonth) {
          monthsToProcess.push(ptr);
          const [y, m] = ptr.split('-').map(Number);
          const date = new Date(y, m); 
          const ny = date.getFullYear();
          const nm = String(date.getMonth() + 1).padStart(2, '0');
          ptr = `${ny}-${nm}`;
          if (monthsToProcess.length > 120) break; 
      }

      const monthChain: Record<string, Record<string, MonthlyResult>> = {};
      const employeeStates: Record<string, { leavePool: number, salaryPool: number }> = {};
      
      employees.forEach(emp => {
          employeeStates[emp.id] = {
              leavePool: emp.initialLeavePoolMinutes || 0,
              salaryPool: emp.initialSalaryPoolMinutes || 0
          };
      });

      monthsToProcess.forEach(m => {
          const resultsForThisMonth: Record<string, MonthlyResult> = {};
          employees.forEach(emp => {
              const state = employeeStates[emp.id] || { leavePool: emp.initialLeavePoolMinutes || 0, salaryPool: emp.initialSalaryPoolMinutes || 0 };
              const prevState = {
                  leavePoolMinutes: state.leavePool,
                  salaryPoolMinutes: state.salaryPool
              };
              const input = (allInputs[m] && allInputs[m][emp.id]) || { missingTime: '00:00', lateDays: 0, currentLeaveBalance: '00:00' };
              
              // Ensure we pass the correct salary to the calculator
              const empWithSalary = {
                ...emp,
                netSalary: emp.netSalary || emp.wage?.netSalary || 0
              };

              const result = calculateMonthlyPayroll(empWithSalary, m, input, prevState, config, unitConfigs);
              employeeStates[emp.id] = {
                  leavePool: result.nextLeavePoolMinutes,
                  salaryPool: result.nextSalaryPoolMinutes
              };
              resultsForThisMonth[emp.id] = result;
          });
          monthChain[m] = resultsForThisMonth;
      });
      console.log("Recalculation complete. Results for current month:", Object.keys(monthChain[currentMonth] || {}).length);
      return monthChain;
    } catch (err) {
      console.error("Calculation Error:", err);
      return {};
    }
  }, [employees, currentMonth, allInputs, config, unitConfigs]);

  const resultsByMonth = useMemo(() => {
    return allCalculatedResults[currentMonth] || {};
  }, [allCalculatedResults, currentMonth]);

  // Handlers
  const handleLoginSuccess = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    try {
      localStorage.setItem('AUTH_TOKEN', newToken);
      localStorage.setItem('AUTH_USER', JSON.stringify(newUser));
    } catch (e) {
      console.error("Failed to set localStorage", e);
    }
    setActiveModule('dashboard'); 
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem('AUTH_TOKEN');
      localStorage.removeItem('AUTH_USER');
    } catch (e) {
      console.error("Failed to remove localStorage", e);
    }
    setActiveTab('dashboard');
    setActiveModule('dashboard');
  };

  const handleRestoreData = (data: AppState) => {
    if (!data || !data.employees) {
      setMessage({ type: 'error', text: "Geçersiz yedek dosyası veya dosya bozuk." });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    
    setLoading(true);

    try {
      setEmployees(data.employees || []);
      setAllInputs(data.inputs || {});
      setNotifications(data.notifications || []);
      setDocuments(data.documents || []);
      setConfig(data.config || DEFAULT_CONFIG);
      setBackupConfig(data.backupConfig || DEFAULT_BACKUP_CONFIG);
      setMonthStatus(data.monthStatus || {});
      setDepartments(data.departments || []);
      setTitles(data.titles || []);
      setNotificationLogs(data.notificationLogs || []);
      setNotificationConfig(data.notificationConfig || DEFAULT_NOTIFICATION_CONFIG);
      setDepartmentManagers(data.departmentManagers || []);
      setMessageTemplates(data.messageTemplates?.length ? data.messageTemplates : DEFAULT_MESSAGE_TEMPLATES);
      setManagerMessageTemplates(data.managerMessageTemplates?.length ? data.managerMessageTemplates : [DEFAULT_MANAGER_TEMPLATE]);
      
      const newVersion = Math.max(dataVersion, (data.version || 0)) + 1;
      setDataVersion(newVersion);
      
      const stateToSave = { ...data, version: newVersion };
      
      persistence.scheduleSave(
        stateToSave, 
        setSyncStatus, 
        (v) => {
           setDataVersion(v);
           setLastSavedAt(new Date().toISOString());
           setMessage({ type: 'success', text: "Yedek başarıyla yüklendi ve sistem güncellendi." });
           setTimeout(() => setMessage(null), 3000);
           setLoading(false);
        }
      );

    } catch (e) {
      console.error("Restore Error:", e);
      setMessage({ type: 'error', text: "Yükleme sırasında bir hata oluştu." });
      setTimeout(() => setMessage(null), 3000);
      setLoading(false);
    }
  };

  const handleUpdatePersonnelTemplate = (template: MessageTemplate) => {
    setMessageTemplates(prev => prev.map(t => t.id === template.id ? template : t));
  };

  const handleUpdateManagerTemplate = (template: ManagerMessageTemplate) => {
    setManagerMessageTemplates(prev => prev.map(t => t.id === template.id ? template : t));
  };

  const handleAddPersonnelTemplate = () => {
    const newTemplate: MessageTemplate = {
      id: `pt-${Date.now()}`,
      title: 'Yeni Personel Taslağı',
      body: 'Sayın {{ad_soyad}}, ...',
      isActive: false,
      scenario: NotificationScenario.NO_MISSING_TIME
    };
    setMessageTemplates(prev => [...prev, newTemplate]);
  };

  const handleAddManagerTemplate = () => {
    const newTemplate: ManagerMessageTemplate = {
      id: `mt-${Date.now()}`,
      title: 'Yeni Yönetici Taslağı',
      body: 'Sayın {{yonetici_adi}}, ...',
      isActive: false
    };
    setManagerMessageTemplates(prev => [...prev, newTemplate]);
  };

  const handleDeletePersonnelTemplate = (id: string) => {
    setMessageTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleDeleteManagerTemplate = (id: string) => {
    setManagerMessageTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleApplyImport = (data: ExcelRow[], _errors: string[]) => {
    const updatedEmployees = [...employees];
    const currentMonthInputs = { ...(allInputs[currentMonth] || {}) };
    const importData: Record<string, MonthlyInput> = {};
    const batchId = Math.random().toString(36).substr(2, 9);
    let updatedCount = 0;
    let newCount = 0;

    // Master data tracking
    const newDepts = new Set<string>(departments);
    const newTitles = new Set<string>(titles);
    const newLocations = [...locations];

    data.forEach(row => {
      const cleanTckn = row.tckn ? row.tckn.replace(/\s/g, '') : '';
      const cleanName = row.adSoyad ? row.adSoyad.trim() : '';
      const cleanBirthDate = row.birthDate || '';

      if (!cleanTckn && !cleanName) return;

      // Smart Matching:
      // 1. Try TC
      // 2. Try Name + BirthDate
      let empIndex = -1;
      if (cleanTckn) {
        empIndex = updatedEmployees.findIndex(e => {
          const empTc = String(e.core?.tcNo || e.tcNo || '').replace(/\s/g, '');
          return empTc === cleanTckn && !e.isDeleted;
        });
      }
      if (empIndex === -1 && cleanName) {
        const normalizedCleanName = cleanName.toLocaleLowerCase('tr-TR').replace(/[^a-z0-9ğüşıöç]/g, '');
        empIndex = updatedEmployees.findIndex(e => {
          if (e.isDeleted) return false;
          const normalizedEmpName = String(e.core?.name || e.name || '').toLocaleLowerCase('tr-TR').replace(/[^a-z0-9ğüşıöç]/g, '');
          
          if (normalizedEmpName !== normalizedCleanName) return false;
          if (cleanBirthDate && e.core?.birthDate && e.core.birthDate !== cleanBirthDate) return false;
          return true;
        });
      }

      let empId = '';

      // Auto-create master data
      if (row.department && !newDepts.has(row.department)) newDepts.add(row.department);
      if (row.title && !newTitles.has(row.title)) newTitles.add(row.title);
      if (row.actualWorkLocation && !newLocations.some(l => l.name === row.actualWorkLocation)) {
        newLocations.push({ 
          id: Math.random().toString(36).substr(2, 9), 
          name: row.actualWorkLocation, 
          address: '', 
          type: (row.workLocationType === 'FIELD' ? 'FIELD' : 'HQ'),
          isActive: true 
        });
      }

      if (empIndex !== -1) {
        const emp = { ...updatedEmployees[empIndex] };
        updatedCount++;
        
        // Ensure layered structure exists
        if (!emp.core) emp.core = { id: emp.id, tcNo: emp.tcNo, name: emp.name, gender: 'Belirtmek İstemiyor', education: 'Lise', residenceAddress: '' };
        if (!emp.wage) emp.wage = { netSalary: 0, mealAllowance: 0, roadAllowance: 0, totalPaidAmount: 0, currency: 'TRY' };
        if (!emp.leave) emp.leave = { remainingAnnualLeaveDays: 0, remainingCompensatoryLeaveHours: '00:00' };
        if (!emp.work) emp.work = { hireDate: undefined, department: emp.department, title: '', employmentType: 'Tam Zamanlı', retirementStatus: 'Normal', workLocationType: 'HQ', actualWorkLocation: 'Merkez', trialPeriodMonths: 2 };
        if (!emp.system) emp.system = { showInPdks: true, isActive: emp.isActive ?? true, role: 'USER' };

        // Update values
        emp.core.name = row.adSoyad || emp.core.name;
        emp.core.tcNo = cleanTckn || emp.core.tcNo;
        emp.core.birthDate = row.birthDate || emp.core.birthDate;
        emp.core.gender = (row.gender as any) || emp.core.gender;
        emp.core.maritalStatus = (row.maritalStatus as any) || emp.core.maritalStatus;
        emp.core.childCount = row.childCount !== undefined ? row.childCount : emp.core.childCount;
        emp.core.bloodGroup = row.bloodGroup || emp.core.bloodGroup;
        emp.core.isForeign = row.isForeign !== undefined ? row.isForeign : emp.core.isForeign;
        emp.core.education = row.education || emp.core.education;
        emp.core.residenceAddress = row.residenceAddress || emp.core.residenceAddress;
        emp.core.residenceCity = row.residenceCity || emp.core.residenceCity;
        emp.core.residenceDistrict = row.residenceDistrict || emp.core.residenceDistrict;
        emp.core.phone = row.phone || emp.core.phone;
        emp.core.email = row.email || emp.core.email;

        emp.work.hireDate = row.hireDate !== undefined ? row.hireDate : emp.work.hireDate;
        emp.work.department = row.department || emp.work.department;
        emp.work.title = row.title || emp.work.title;
        emp.work.actualWorkLocation = row.actualWorkLocation || emp.work.actualWorkLocation;
        emp.work.workLocationType = (row.workLocationType as any) || emp.work.workLocationType;
        emp.work.employmentType = (row.employmentType as any) || emp.work.employmentType;
        emp.work.retirementStatus = (row.retirementStatus as any) || emp.work.retirementStatus;
        
        emp.work.terminationDate = row.exitDate || emp.work.terminationDate;
        emp.work.terminationCode = row.exitCode || emp.work.terminationCode;
        
        // Track salary change
        if (row.netSalary && row.netSalary !== emp.wage.netSalary) {
          const newHistory: SalaryHistory = {
            id: Math.random().toString(36).substr(2, 9),
            employeeId: emp.id,
            oldSalary: emp.wage.netSalary,
            newSalary: row.netSalary,
            changeDate: new Date().toISOString(),
            changedBy: user?.username || 'System',
            reason: 'Excel Import'
          };
          setSalaryHistory(prev => [newHistory, ...prev]);
          emp.wage.netSalary = row.netSalary;
        }

        emp.wage.mealAllowance = row.mealAllowance || emp.wage.mealAllowance;
        emp.wage.roadAllowance = row.roadAllowance || emp.wage.roadAllowance;
        emp.wage.totalPaidAmount = row.totalPaidAmount || emp.wage.totalPaidAmount;
        emp.wage.hasIncentive = row.hasIncentive === 'Evet';

        emp.system = { 
          ...emp.system,
          isActive: row.isActive !== undefined ? row.isActive : emp.system.isActive,
          showInPdks: row.showInPdks !== undefined ? row.showInPdks : emp.system.showInPdks
        };
        
        // Sync root properties for compatibility
        emp.name = emp.core.name;
        emp.tcNo = emp.core.tcNo;
        emp.department = emp.work.department;
        emp.isActive = emp.system.isActive;

        updatedEmployees[empIndex] = emp;
        empId = emp.id;
      } else {
        // Create new employee
        newCount++;
        empId = Math.random().toString(36).substr(2, 9);
        const newEmp: Employee = {
          id: empId,
          tcNo: cleanTckn,
          name: row.adSoyad || 'İsimsiz Personel',
          department: row.department || 'Genel',
          isActive: row.isActive !== undefined ? row.isActive : true,
          importBatchId: batchId,
          core: {
            id: empId,
            tcNo: cleanTckn,
            name: row.adSoyad || 'İsimsiz Personel',
            birthDate: row.birthDate,
            gender: (row.gender as any) || 'Belirtilmemiş',
            maritalStatus: (row.maritalStatus as any) || 'Bekar',
            childCount: row.childCount || 0,
            bloodGroup: row.bloodGroup || '-',
            isForeign: row.isForeign || false,
            education: row.education || 'Lise',
            residenceAddress: row.residenceAddress || '',
            residenceCity: row.residenceCity || '',
            residenceDistrict: row.residenceDistrict || '',
            phone: row.phone || '',
            email: row.email || '',
          },
          wage: {
            netSalary: row.netSalary || 0,
            mealAllowance: row.mealAllowance || 0,
            roadAllowance: row.roadAllowance || 0,
            totalPaidAmount: row.totalPaidAmount || 0,
            currency: 'TRY',
            hasIncentive: row.hasIncentive === 'Evet'
          },
          leave: {
            remainingAnnualLeaveDays: 0,
            remainingCompensatoryLeaveHours: '00:00',
          },
          work: {
            hireDate: row.hireDate,
            department: row.department || 'Genel',
            title: row.title || 'Personel',
            employmentType: (row.employmentType as any) || 'Tam Zamanlı',
            retirementStatus: (row.retirementStatus as any) || 'Normal',
            workLocationType: (row.workLocationType as any) || 'HQ',
            actualWorkLocation: row.actualWorkLocation || 'Merkez',
            trialPeriodMonths: 2,
            terminationDate: row.exitDate,
            terminationCode: row.exitCode
          },
          system: {
            showInPdks: row.showInPdks !== undefined ? row.showInPdks : true,
            isActive: row.isActive !== undefined ? row.isActive : true,
            role: 'USER'
          },
          isDeleted: false
        };
        updatedEmployees.push(newEmp);
      }
      
      // Update inputs if any PDKS data is present in the row
      const hasPdksData = row.missingTime !== undefined || row.lateDays !== undefined || row.currentLeaveBalance !== undefined;
      
      if (hasPdksData) {
        const input: MonthlyInput = { 
          missingTime: row.missingTime || '00:00', 
          lateDays: row.lateDays || 0, 
          currentLeaveBalance: row.currentLeaveBalance || '00:00'
        };
        currentMonthInputs[empId] = input;
        importData[empId] = input;
      }
    });
    
    const newImportRecord: ImportRecord = {
      id: batchId,
      month: currentMonth,
      importedAt: new Date().toISOString(),
      importedBy: user?.username || 'System',
      data: importData
    };

    setDepartments(Array.from(newDepts));
    setTitles(Array.from(newTitles));
    setLocations(newLocations);

    setImports(prev => {
      // Soft delete previous imports for this month
      const updated = prev.map(imp => 
        imp.month === currentMonth && !imp.isDeleted 
          ? { ...imp, isDeleted: true, deletedAt: new Date().toISOString() } 
          : imp
      );
      return [...updated, newImportRecord];
    });

    setEmployees(updatedEmployees);
    setAllInputs(prev => ({ 
      ...prev, 
      [currentMonth]: currentMonthInputs 
    }));
    setShowImportWizard(false);

    if (activeModule === 'personnel') {
      // Do not change activeTab here, let PersonnelImport show success state
      // setPersonnelInitialTab('list');
    } else {
      setActiveTab('records');
      setMessage({ type: 'success', text: 'Excel verileri başarıyla yüklendi.' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSoftDelete = (id: string, type: 'personnel' | 'document' | 'notification' | 'manager') => {
    if (type === 'personnel') setEmployees(prev => prev.map(e => e.id === id ? { ...e, isDeleted: true, deletedAt: new Date().toISOString() } : e));
    else if (type === 'document') setDocuments(prev => prev.map(d => d.id === id ? { ...d, isDeleted: true, deletedAt: new Date().toISOString() } : d));
    else if (type === 'notification') setNotifications(prev => prev.map(n => n.id === id ? { ...n, isDeleted: true, deletedAt: new Date().toISOString() } : n));
    else if (type === 'manager') setDepartmentManagers(prev => prev.map(m => m.id === id ? { ...m, isDeleted: true, deletedAt: new Date().toISOString() } : m));
  };

  const handlePermanentDelete = (id: string, type: 'personnel' | 'document' | 'notification' | 'manager') => {
    if (type === 'personnel') setEmployees(prev => prev.filter(e => e.id !== id));
    else if (type === 'document') setDocuments(prev => prev.filter(d => d.id !== id));
    else if (type === 'notification') setNotifications(prev => prev.filter(n => n.id !== id));
    else if (type === 'manager') setDepartmentManagers(prev => prev.filter(m => m.id !== id));
  };

  const handleClearTrash = () => {
    setEmployees(prev => prev.filter(e => !e.isDeleted));
    setDocuments(prev => prev.filter(d => !d.isDeleted));
    setNotifications(prev => prev.filter(n => !n.isDeleted));
    setDepartmentManagers(prev => prev.filter(m => !m.isDeleted));
  };

  const handleUnlockMonth = useCallback(() => {
    setMonthStatus(prev => {
      const updated = { ...prev };
      updated[currentMonth] = { isLocked: false };
      return updated;
    });
  }, [currentMonth]);

  const handleCloseMonth = useCallback(() => {
    setMonthStatus(prev => {
      const updated = {
        ...prev,
        [currentMonth]: { isLocked: true }
      };

      // Find the first unlocked month starting from January 2026
      const startYear = 2026;
      const startMonth = 1;
      let foundMonth = '2026-01';
      
      for (let i = 0; i < 36; i++) {
        const d = new Date(startYear, startMonth - 1 + i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!updated[monthKey]?.isLocked) {
          foundMonth = monthKey;
          break;
        }
      }
      setCurrentMonth(foundMonth);
      return updated;
    });
  }, [currentMonth]);

  const handlePrepareNotificationByType = useCallback((empId: string, type: 'late' | 'salary') => {
    setPersonnelInitialId(empId);
    setActiveTab('personnel-notifications');
    setMessage({ type: 'info', text: `${type === 'late' ? 'Geç kalma' : 'Maaş kesintisi'} bildirimi hazırlanıyor...` });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const handlePrepareManagerNotification = useCallback((department: string) => {
    setInitialDepartment(department);
    setActiveTab('unit-notifications');
    setMessage({ type: 'info', text: `${department} birim sorumlusu bildirimi hazırlanıyor...` });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const handleChangePassword = async () => {
    if (pwNew.length < 8) {
      setMessage({ type: 'error', text: "Yeni şifre en az 8 karakter olmalıdır." });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    try {
      await api.changePassword(pwCurrent, pwNew);
      setMessage({ type: 'success', text: "Şifreniz başarıyla değiştirildi." });
      setTimeout(() => setMessage(null), 3000);
      setShowPasswordChange(false);
      setPwCurrent('');
      setPwNew('');
      if (user) setUser({ ...user, mustChangePassword: false });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (isAuthChecking) return <LoadingScreen />;
  if (!token || !user) return (
    <LoginPage onLoginSuccess={handleLoginSuccess} />
  );
  if (loading) return <LoadingScreen />;

  const isValidModule = (mod: string) => {
    if (mod === 'dashboard') return true;
    if (user?.role === 'ADMIN') return true;
    
    const validModules = ['personnel', 'pdks', 'tasks', 'notes', 'leave', 'documents', 'admin'];
    if (!validModules.includes(mod)) return false;

    // Check permissions for non-admin users
    if (user?.permittedModules) {
      return user.permittedModules.includes(mod);
    }

    return true; // Default to true if permittedModules is not set (legacy users)
  };

  // --- ROUTING RENDERER ---
  return (
    <>
      {!isValidModule(activeModule) ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
          <AlertTriangle className="w-20 h-20 text-amber-500 mb-6" />
          <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Sayfa Bulunamadı</h2>
          <p className="text-slate-500 font-medium mb-8">Aradığınız modül mevcut değil veya erişim yetkiniz bulunmuyor.</p>
          <button 
            onClick={() => setActiveModule('dashboard')}
            className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all flex items-center gap-3 uppercase text-sm tracking-widest"
          >
            <RefreshCcw className="w-5 h-5" /> Paneli Sıfırla
          </button>
        </div>
      ) : activeModule === 'dashboard' ? (
        <div key="dashboard" className="animate-fade-in-up">
          <DashboardPanel 
            user={user!} 
            config={config}
            onConfigChange={setConfig}
            onNavigate={(module) => {
              setActiveModule(module);
              if (module === 'personnel' || module === 'pdks' || module === 'notes' || module === 'leave') setActiveTab('dashboard');
              if (module === 'tasks') setActiveTab('today');
              if (module === 'admin') setActiveTab('system');
            }} 
            onLogout={handleLogout} 
          />
        </div>
      ) : (
        <div className="flex min-h-screen bg-slate-50 font-sans">
          <Sidebar 
            activeModule={activeModule}
            activeSubTab={activeTab}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onChange={(module, subTab) => {
              setActiveModule(module);
              if (subTab) {
                setActiveTab(subTab);
                if (module === 'personnel') setPersonnelInitialTab(subTab);
              }
              else if (module === 'pdks') setActiveTab('dashboard');
              else if (module === 'personnel') {
                setActiveTab('dashboard');
                setPersonnelInitialTab('dashboard');
              }
              else if (module === 'notes') setActiveTab('dashboard');
              else if (module === 'tasks') setActiveTab('today');
              else if (module === 'admin') setActiveTab('system');
              else if (module === 'leave') setActiveTab('dashboard');
              setIsSidebarOpen(false);
            }} 
            userRole={user?.role} 
            permittedModules={user?.permittedModules}
            onPasswordChangeRequest={() => setShowPasswordChange(true)}
            onBackToDashboard={() => {
              setActiveModule('dashboard');
              setIsSidebarOpen(false);
            }}
          />
          
          <main className="flex-1 md:ml-64 p-4 md:p-6 lg:p-8 relative w-full md:w-[calc(100%-16rem)] overflow-x-hidden min-h-screen">
            {message && (
              <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl text-sm font-bold shadow-xl ${message.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                {message.text}
              </div>
            )}
            <AppErrorBoundary>
              <header className="flex justify-between items-center mb-8 bg-white p-5 rounded-3xl shadow-lg border border-slate-200 animate-slide-in-right sticky top-4 z-40 mx-2">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="md:hidden p-3 hover:bg-slate-100 rounded-2xl text-slate-600 transition-all shadow-sm"
                >
                  <LayoutGrid className="w-6 h-6" />
                </button>
                <div className="flex flex-col">
                  <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter line-clamp-1 font-sans">
                  {activeModule === 'pdks' ? (
                    'PDKS HESAPLAMA MODÜLÜ'
                  ) : (
                    <>
                      {activeModule === 'personnel' && 'PERSONEL YÖNETİMİ MODÜLÜ'}
                      {activeModule === 'tasks' && 'İş Takibi (Operasyon)'}
                      {activeModule === 'burak' && 'Burak (Mevzuat Asistanı)'}
                      {activeModule === 'notes' && 'Notlar / Hatırlatıcılar'}
                      {activeModule === 'leave' && 'İzin Takibi & Raporlama'}
                      {activeModule === 'documents' && 'Evrak Takibi'}
                      {activeModule === 'admin' && 'Sistem Yönetimi'}
                    </>
                  )}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {currentTime.toLocaleDateString('tr-TR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })} | {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              </div>
              
              <div className="flex items-center gap-4">
                {activeModule === 'pdks' && <MonthSelector currentMonth={currentMonth} onMonthChange={setCurrentMonth} />}

                <div className="flex items-center gap-4 border-l pl-4 border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-black text-slate-700 uppercase leading-none">{user?.username}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{user?.role}</p>
                    </div>
                    <button onClick={handleLogout} className="p-2.5 bg-slate-100 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm group" title="Oturumu Kapat">
                        <LogOut className="w-5 h-5 group-hover:scale-110" />
                    </button>
                  </div>
                </div>
              </div>
            </header>

            <div className="space-y-6 animate-fade-in-up">
              {activeModule === 'pdks' ? (
                <>
                  {activeTab === 'dashboard' && (
                    <Dashboard 
                      results={Object.values(resultsByMonth)} 
                      allResults={allCalculatedResults} 
                      employees={pdksEmployees} 
                      currentMonth={currentMonth}
                      hasData={Object.keys(allInputs[currentMonth] || {}).length > 0}
                    />
                  )}
                  {activeTab === 'rules' && <RuleManager unitConfigs={unitConfigs} systemConfig={config} onUpdateUnitConfigs={setUnitConfigs} onUpdateSystemConfig={setConfig} departments={departments} />}
                  {activeTab === 'records' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3">
                          {lastImport && (
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => setShowUndoConfirm(lastImport.id)}
                                className="px-4 py-2.5 bg-amber-50 text-amber-600 hover:bg-amber-100 font-black rounded-xl flex items-center gap-2 border border-amber-200 transition-all active:scale-95 text-xs uppercase tracking-tight"
                              >
                                <RefreshCcw className="w-4 h-4" /> Son Yüklemeyi Geri Al
                              </button>
                              <div className="flex flex-col">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter leading-none mb-0.5">Son Yükleme</span>
                                <span className="text-[10px] text-slate-600 font-black leading-none">{new Date(lastImport.importedAt).toLocaleString('tr-TR')}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => setShowImportWizard(true)} className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl flex items-center gap-2 shadow-lg transition-all active:scale-95">
                            <Upload className="w-4 h-4" /> Excel Raporu Yükle
                          </button>
                          <button onClick={() => generateProfessionalReport(pdksEmployees, resultsByMonth, currentMonth)} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl flex items-center gap-2 shadow-lg transition-all active:scale-95">Genel Rapor İndir</button>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <MonthlyTable 
                          personnel={pdksEmployees} 
                          inputs={allInputs[currentMonth] || {}} 
                          results={resultsByMonth} 
                          allResults={allCalculatedResults}
                          monthStatus={monthStatus[currentMonth] || { isLocked: false }} 
                          config={config} 
                          currentMonth={currentMonth}
                          unitConfigs={unitConfigs} 
                          onInputChange={(id, field, val) => {
                            setAllInputs(prev => ({ ...prev, [currentMonth]: { ...prev[currentMonth], [id]: { ...prev[currentMonth]?.[id] || { missingTime: '0:00', lateDays: 0, currentLeaveBalance: '0:00' }, [field]: val } } }));
                          }} 
                          onExport={() => {}} 
                          onUnlockMonth={handleUnlockMonth} 
                          onViewDocument={(emp, res) => setViewingDoc({ emp, res })} 
                          onNavigateToDeductions={(type) => { setDeductionSubTab(type); setActiveTab('deduction-details'); }}
                          onViewPersonnelDetail={(id) => {
                            setPersonnelInitialTab('detail');
                            setPersonnelInitialId(id);
                            setActiveModule('personnel');
                          }}
                          onPrepareNotificationByType={handlePrepareNotificationByType}
                          onPrepareManagerNotification={handlePrepareManagerNotification}
                          onCloseMonth={() => setShowMonthClosingModal(true)}
                        />
                      </div>
                    </div>
                  )}
                  {showMonthClosingModal && (
                    <MonthClosingModal 
                      month={currentMonth}
                      employees={pdksEmployees}
                      results={resultsByMonth}
                      onClose={() => setShowMonthClosingModal(false)}
                      onConfirm={() => {
                        handleCloseMonth();
                        setShowMonthClosingModal(false);
                      }}
                    />
                  )}
                  {activeTab === 'deduction-details' && (
                    <DeductionDetails 
                      personnel={pdksEmployees} 
                      results={resultsByMonth} 
                      allResults={allCalculatedResults}
                      currentMonth={currentMonth} 
                      activeSubTab={deductionSubTab} 
                      setActiveSubTab={setDeductionSubTab} 
                      config={config} 
                    />
                  )}
                  {activeTab === 'personnel-notifications' && (
                    <PersonnelNotificationPage 
                      employees={pdksEmployees}
                      results={resultsByMonth}
                      currentPeriod={currentMonth}
                      templates={messageTemplates}
                      initialEmployeeId={personnelInitialId}
                    />
                  )}
                  {activeTab === 'unit-notifications' && (
                    <UnitManagerNotificationPage 
                      employees={pdksEmployees}
                      results={resultsByMonth}
                      currentPeriod={currentMonth}
                      departments={departments}
                      templates={managerMessageTemplates}
                      departmentManagers={departmentManagers}
                      initialDepartment={initialDepartment}
                    />
                  )}
                  {activeTab === 'notifications' && <NotificationCenter employees={pdksEmployees} notifications={notifications} onDelete={(id) => handleSoftDelete(id, 'notification')} />}
                  {activeTab === 'templates' && (
                    <MessageTemplatesPage 
                      personnelTemplates={messageTemplates} 
                      managerTemplates={managerMessageTemplates} 
                      onUpdatePersonnelTemplate={handleUpdatePersonnelTemplate}
                      onUpdateManagerTemplate={handleUpdateManagerTemplate}
                      onAddPersonnelTemplate={handleAddPersonnelTemplate}
                      onAddManagerTemplate={handleAddManagerTemplate}
                      onDeletePersonnelTemplate={handleDeletePersonnelTemplate}
                      onDeleteManagerTemplate={handleDeleteManagerTemplate}
                    />
                  )}
                </>
              ) : (
                <>
                  {activeModule === 'personnel' && (
                    <PersonnelManagement 
                      employees={employees}
                      departments={departments}
                      titles={titles}
                      locations={locations}
                      cities={cities}
                      districts={districts}
                      auditLogs={auditLogs}
                      salaryHistory={salaryHistory}
                      leaveHistory={leaveHistory}
                      documents={documents}
                      advancedFilters={advancedFilters}
                      importHistory={imports}
                      config={config}
                      user={user}
                      onUpdateEmployees={setEmployees}
                      onUpdateDepartments={setDepartments}
                      onUpdateTitles={setTitles}
                      onUpdateLocations={setLocations}
                      onUpdateCities={setCities}
                      onUpdateDistricts={setDistricts}
                      onUpdateSalaryHistory={setSalaryHistory}
                      onUpdateLeaveHistory={setLeaveHistory}
                      onUpdateDocuments={setDocuments}
                      onUpdateAdvancedFilters={setAdvancedFilters}
                      onAddAuditLog={(log) => setAuditLogs(prev => [log, ...prev])}
                      onUndoImport={handleUndoImport}
                      onApplyImport={handleApplyImport}
                      onTabChange={(tab) => setPersonnelInitialTab(tab)}
                      initialTab={personnelInitialTab}
                      initialEmployeeId={personnelInitialId}
                    />
                  )}
                  {activeModule === 'tasks' && (
                    <TaskManager 
                      activeTab={activeTab} 
                      onBack={() => setActiveModule('dashboard')} 
                      onTabChange={(tab) => setActiveTab(tab)}
                      tasks={tasks}
                      setTasks={setTasks}
                      goals={goals}
                      setGoals={setGoals}
                    />
                  )}
                  {activeModule === 'notes' && (
                    <NotesModule 
                      activeTab={activeTab} 
                      onTabChange={setActiveTab} 
                      onBack={() => setActiveModule('dashboard')}
                      notes={notes}
                      setNotes={setNotes}
                      reminders={reminders}
                      setReminders={setReminders}
                      settings={notesSettings}
                      setSettings={setNotesSettings}
                    />
                  )}
                  {activeModule === 'leave' && (
                    <LeaveModule 
                      employees={employees} 
                      activeTab={activeTab} 
                      onTabChange={setActiveTab}
                      leaveData={leaveRecords}
                      setLeaveData={setLeaveRecords}
                      settings={leaveSettings}
                      setSettings={setLeaveSettings}
                    />
                  )}
                  {activeModule === 'documents' && <DocumentArchive documents={activeDocuments} employees={employees} onDelete={(id) => handleSoftDelete(id, 'document')} onView={(doc) => {
                      const emp = employees.find(e => e.id === doc.employeeId); 
                      if (!emp) {
                        setMessage({ type: 'error', text: "Personel bulunamadı." });
                        setTimeout(() => setMessage(null), 3000);
                        return;
                      }
                      const mockResult: MonthlyResult = { employeeId: emp.id, month: doc.month, inputMissingMinutes: doc.snapshot.missingMinutes, salaryDeductionAmount: doc.snapshot.salaryDeductionAmount, deductedFromLeaveMinutes: doc.snapshot.deductedFromLeaveMinutes, isDisciplineApplied: doc.snapshot.isDiscipline } as any;
                      setViewingDoc({ emp, res: mockResult });
                  }} />}
                  {activeModule === 'admin' && (
                    <SystemSettings 
                      activeTab={activeTab}
                      config={config} 
                      onConfigChange={setConfig} 
                      onResetConfig={() => setConfig(DEFAULT_CONFIG)} 
                      userRole={user?.role}
                      departments={departments}
                      titles={titles}
                      managers={activeManagers}
                      onUpdateDepartments={setDepartments}
                      onUpdateTitles={setTitles}
                      onUpdateManagers={setDepartmentManagers}
                      onSoftDeleteManager={(id) => handleSoftDelete(id, 'manager')}
                      backupConfig={backupConfig}
                      onBackupConfigChange={setBackupConfig}
                      onForceBackup={triggerSave}
                      onRestore={handleRestoreData}
                      lastBackupTime={lastSavedAt}
                      currentAppState={currentAppState}
                      deletedEmployees={deletedEmployees}
                      deletedDocuments={deletedDocuments}
                      deletedNotifications={deletedNotifications}
                      deletedManagers={deletedManagers}
                      onRestoreDeleted={(id, type) => {
                        if (type === 'personnel') setEmployees(employees.map(e => e.id === id ? { ...e, isDeleted: false } : e));
                        else if (type === 'document') setDocuments(documents.map(d => d.id === id ? { ...d, isDeleted: false } : d));
                        else if (type === 'manager') setDepartmentManagers(departmentManagers.map(m => m.id === id ? { ...m, isDeleted: false } : m));
                      }}
                      onPermanentDelete={handlePermanentDelete}
                      onClearTrash={handleClearTrash}
                    />
                  )}
                </>
              )}
            </div>
            </AppErrorBoundary>
          </main>
        </div>
      )}

      {/* Modals */}
      <ReminderNotification />
      {showImportWizard && <ImportWizard onApply={handleApplyImport} onCancel={() => setShowImportWizard(false)} />}
      {activeDraft && <NotificationModal employee={activeDraft.emp} draft={activeDraft.draft} config={notificationConfig} onSend={(record) => { setNotifications(prev => [record, ...prev]); setActiveDraft(null); }} onClose={() => setActiveDraft(null)} />}
      {viewingDoc && <OfficialDocumentModal employee={viewingDoc.emp} result={viewingDoc.res} onClose={() => setViewingDoc(null)} onSaveArchive={async (res) => {
           const newDoc: DocumentRecord = { id: Math.random().toString(36).substr(2, 9), type: 'missing_work_form', employeeId: res.employeeId, month: res.month, createdAt: new Date().toISOString(), status: 'generated', snapshot: { missingMinutes: res.inputMissingMinutes, salaryDeductionAmount: res.salaryDeductionAmount, deductedFromLeaveMinutes: res.deductedFromImportedLeaveMinutes, isDiscipline: res.isDisciplineApplied } };
           setDocuments(prev => [...prev, newDoc]); return true;
        }} />}
      
      {showPasswordChange && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[500] flex justify-center items-start p-4 pt-20">
           <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><Key className="w-8 h-8" /></div>
              <h3 className="text-2xl font-black text-center text-slate-800 tracking-tight uppercase">Şifre İşlemleri</h3>
              <div className="space-y-4 mt-8">
                 <input type="password" placeholder="Mevcut Şifre" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-brand-500 outline-none transition-all font-bold" />
                 <input type="password" placeholder="Yeni Şifre (Min 8 karakter)" value={pwNew} onChange={e => setPwNew(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-brand-500 outline-none transition-all font-bold" />
                 <div className="flex gap-2">
                    <button onClick={() => { setShowPasswordChange(false); setPwCurrent(''); setPwNew(''); }} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl">İptal</button>
                    <button onClick={handleChangePassword} className="flex-[2] py-4 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95">Şifreyi Güncelle</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Undo Import Confirmation Modal */}
      {showUndoConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200 overflow-hidden border border-slate-200">
            <div className="p-6 text-center relative">
              <button 
                onClick={() => setShowUndoConfirm(null)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Geri Almayı Onayla</h3>
              <p className="text-slate-500 font-bold leading-snug text-sm">
                {new Date(imports.find(i => i.id === showUndoConfirm)?.importedAt || '').toLocaleString('tr-TR')} tarihinde yapılan içe aktarma işlemini geri almak istediğinize emin misiniz? 
                <br /><br />
                <span className="text-amber-600 text-[10px]">Bu işlem bu yükleme ile gelen PDKS verilerini (eksik süre, geç gün, izin vb.) silecektir.</span>
              </p>
            </div>
            <div className="p-4 bg-slate-50 flex flex-col gap-2">
              <button 
                onClick={() => {
                  handleUndoImport(showUndoConfirm);
                  setShowUndoConfirm(null);
                  setMessage({ type: 'success', text: 'Son yükleme başarıyla geri alındı.' });
                  setTimeout(() => setMessage(null), 3000);
                }}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl shadow-lg transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
              >
                Evet, Geri Al
              </button>
              <button 
                onClick={() => setShowUndoConfirm(null)}
                className="w-full py-2.5 bg-white border-2 border-slate-200 text-slate-500 font-bold rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px]"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
    </>
  );
};

export default App;
