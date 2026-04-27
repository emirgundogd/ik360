
import { Task } from './types/task';

// ... existing types

/**
 * Added missing types used in App and various components
 */

export type Gender = 'Erkek' | 'Kadın' | 'Belirtilmemiş';
export type EducationLevel = string;
export type EmploymentType = 'Tam Zamanlı' | 'Kısmi Zamanlı';
export type RetirementStatus = 'Normal' | 'Emekli';
export type WorkLocationType = 'HQ' | 'FIELD';

export interface LocationRecord {
  id: string;
  name: string;
  address: string;
  type: 'HQ' | 'FIELD';
  isActive: boolean;
}

export interface SalaryHistory {
  id: string;
  employeeId: string;
  oldSalary: number;
  newSalary: number;
  changeDate: string;
  changedBy: string;
  reason: string;
}

export interface LeaveHistory {
  id: string;
  employeeId: string;
  type: 'ANNUAL' | 'COMPENSATORY' | 'OTHER';
  changeAmount: number; // + or -
  newBalance: number;
  changeDate: string;
  changedBy: string;
  reason: string;
}

export interface PersonnelDocument {
  id: string;
  employeeId: string;
  fileName: string;
  fileType: 'Sözleşme' | 'Kimlik' | 'Diploma' | 'SGK' | 'Diğer';
  fileSize: number;
  uploadDate: string;
  uploadedBy: string;
  isDeleted?: boolean;
  deletedAt?: string;
  url?: string; // Base64 or mock URL
}

export interface CorePersonnel {
  id: string;
  tcNo: string;
  name: string;
  gender: Gender;
  education: EducationLevel;
  educationDetail?: string;
  phone?: string;
  email?: string;
  residenceAddress: string;
  residenceCity?: string;
  residenceDistrict?: string;
  birthDate?: string;
  maritalStatus?: 'Bekar' | 'Evli' | 'Dul';
  childCount?: number;
  bloodGroup?: string;
  isForeign?: boolean;
}

export interface PersonnelWageInfo {
  netSalary: number;
  mealAllowance: number;
  roadAllowance: number;
  totalPaidAmount: number;
  currency: 'TRY' | 'USD' | 'EUR';
  hasIncentive?: boolean;
}

export interface PersonnelLeaveBalances {
  remainingAnnualLeaveDays: number;
  remainingCompensatoryLeaveHours: string; // HH:MM
}

export interface PersonnelWorkInfo {
  hireDate?: string;
  terminationDate?: string;
  terminationCode?: string;
  department: string;
  title: string;
  employmentType: EmploymentType;
  retirementStatus: RetirementStatus;
  workLocationType: WorkLocationType;
  actualWorkLocation: string;
  trialPeriodMonths: number;
  isUnitManager?: boolean;
  managedDepartments?: string[];
}

export interface PersonnelSystemSettings {
  showInPdks: boolean;
  isActive: boolean;
  role: 'ADMIN' | 'MANAGER' | 'USER';
}

export interface Employee {
  id: string;
  core: CorePersonnel;
  wage: PersonnelWageInfo;
  leave: PersonnelLeaveBalances;
  work: PersonnelWorkInfo;
  system: PersonnelSystemSettings;
  
  isDeleted?: boolean;
  deletedAt?: string;
  importBatchId?: string;

  // For compatibility during transition if needed
  tcNo: string;
  name: string;
  department: string;
  isActive: boolean;
  
  // PDKS Initial values
  initialLeavePoolMinutes?: number;
  initialSalaryPoolMinutes?: number;
  initialLeaveBalanceMinutes?: number;
  netSalary?: number; // Root level salary for PDKS
}

export interface AdvancedFilter {
  id: string;
  name: string;
  conditions: {
    field: string;
    operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'notEmpty';
    value: any;
  }[];
  createdBy: string;
}

export interface AuditLog {
  id: string;
  targetId: string;
  targetType: 'employee' | 'config' | 'master_data' | 'salary' | 'document';
  action: 'create' | 'update' | 'delete' | 'restore' | 'upload';
  changedBy: string;
  changedAt: string;
  details: string; // JSON string of changes
}

export interface MonthlyInput {
  missingTime: string;
  lateDays: number;
  currentLeaveBalance: string;
  hasOverride?: boolean;
  overrideSalaryDeductionAmount?: number;
  overrideLeavePoolMinutes?: number;
  overrideSalaryPoolMinutes?: number;
}

export interface MonthlyResult {
  employeeId: string;
  month: string;
  
  // Inputs (stored as minutes/counts)
  currentMissingMinutes: number;
  currentLateDays: number;
  currentImportedLeaveBalanceMinutes: number;
  
  // Previous Pools
  prevLeavePoolMinutes: number;
  prevSalaryPoolMinutes: number;
  
  // Calculation Details
  isDisciplineApplied: boolean;
  leaveDeductedMinutes: number;
  leaveEarnedMinutes: number;
  salaryDeductedMinutes: number;
  salaryDeductedAmountTry: number;
  
  // Next Pools
  nextLeavePoolMinutes: number;
  nextSalaryPoolMinutes: number;
  
  explanation: string[];
  calculationDate: string;
  scenario?: NotificationScenario;
  
  // Display info
  name?: string;
  department?: string;
  title?: string;
  inputMissingMinutes?: number;
  deductedFromImportedLeaveMinutes?: number;
  
  // Settings used for calculation
  unitConfigUsed?: {
    dailyWorkMinutes: number;
    leaveDeductionThresholdMinutes: number;
    salaryDeductionThresholdMinutes: number;
    lateDayThreshold: number;
  };
}

export interface UnitConfig {
  id: string;
  unitName: string;
  dailyWorkMinutes: number; // HH:MM -> minutes
  leaveDeductionThresholdMinutes: number; // varsayılan 04:00 (240 dk)
  salaryDeductionThresholdMinutes: number; // varsayılan = dailyWorkMinutes
  lateDayThreshold: number; // varsayılan 7
  twoMonthRuleBehavior: 'ask' | 'salary' | 'leave';
  middlePoolWaitMonths: number; // varsayılan 2
}

export interface OtherSoftware {
  id: string;
  name: string;
  url: string;
  logo: string; // base64 or URL
  isActive: boolean;
}

export interface AppConfig {
  defaultDailyWorkMinutes: number;
  defaultLeaveDeductionThresholdMinutes: number;
  defaultSalaryDeductionThresholdMinutes: number;
  defaultLateDayThreshold: number;
  twoMonthRuleBehavior: 'ask' | 'salary' | 'leave';
  middlePoolWaitMonths: number; // varsayılan 2
  // Salary Calculation Parameters
  sgkEmployerRate: number;
  unemploymentEmployerRate: number;
  fivePercentIncentive: number;
  incomeTaxRate: number; // Simplified for estimation
  stampTaxRate: number;
  // Company Settings
  companyName: string;
  weekendDays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  otherSoftwares: OtherSoftware[];
}

export const DEFAULT_CONFIG: AppConfig = {
  defaultDailyWorkMinutes: 510, // 08:30
  defaultLeaveDeductionThresholdMinutes: 240, // 04:00
  defaultSalaryDeductionThresholdMinutes: 510, // 08:30
  defaultLateDayThreshold: 7,
  twoMonthRuleBehavior: 'ask',
  middlePoolWaitMonths: 2,
  sgkEmployerRate: 15.5,
  unemploymentEmployerRate: 2,
  fivePercentIncentive: 5,
  incomeTaxRate: 15,
  stampTaxRate: 0.00759,
  companyName: 'ik360 Demo Şirketi',
  weekendDays: [0, 6], // Sunday, Saturday
  otherSoftwares: []
};

export interface BackupConfig {
  autoBackup: boolean;
  interval: number;
}

export const DEFAULT_BACKUP_CONFIG: BackupConfig = {
  autoBackup: true,
  interval: 24
};

export interface MonthStatus {
  isLocked: boolean;
  lockedAt?: string;
}

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline' | 'syncing' | 'synced';

export interface DocumentRecord {
  id: string;
  type: 'missing_work_form';
  employeeId: string;
  month: string;
  createdAt: string;
  status: string;
  isDeleted?: boolean;
  deletedAt?: string;
  snapshot: {
    missingMinutes: number;
    salaryDeductionAmount: number;
    deductedFromLeaveMinutes: number;
    isDiscipline: boolean;
  };
}

export interface NotificationRecord {
  id: string;
  employeeId: string;
  month: string;
  subject: string;
  body: string;
  status: 'draft' | 'sent' | 'failed';
  sentAt?: string;
  channels: string[];
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  level: 'info' | 'error';
  message: string;
}

export interface NotificationConfig {
  emailEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  emailEnabled: true,
};

export interface DepartmentManager {
  id: string;
  departmentName: string;
  managerName: string;
  managerEmail?: string;
  managerPhone?: string;
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
}

export enum NotificationScenario {
  LEAVE_POOL_WAITING = 'LEAVE_POOL_WAITING',
  FULLY_COVERED_BY_LEAVE = 'FULLY_COVERED_BY_LEAVE',
  PARTIAL_LEAVE_REST_SALARY = 'PARTIAL_LEAVE_REST_SALARY',
  NO_LEAVE_TO_SALARY = 'NO_LEAVE_TO_SALARY',
  DISCIPLINE_TO_SALARY = 'DISCIPLINE_TO_SALARY',
  SALARY_POOL_WAITING = 'SALARY_POOL_WAITING',
  SALARY_DEDUCTION_APPLIED = 'SALARY_DEDUCTION_APPLIED',
  ONLY_CARRYOVER = 'ONLY_CARRYOVER',
  NO_MISSING_TIME = 'NO_MISSING_TIME'
}

export const SCENARIO_LABELS: Record<NotificationScenario, string> = {
  [NotificationScenario.NO_MISSING_TIME]: 'Eksik Yok (Sıfır Kesinti)',
  [NotificationScenario.LEAVE_POOL_WAITING]: 'İzin Havuzunda Bekliyor (4 Saat Altı)',
  [NotificationScenario.FULLY_COVERED_BY_LEAVE]: 'Tamamı İzinden Düşüldü',
  [NotificationScenario.PARTIAL_LEAVE_REST_SALARY]: 'Kısmi İzin + Kalanı Maaş Havuzuna',
  [NotificationScenario.NO_LEAVE_TO_SALARY]: 'İzin Yok (Doğrudan Maaş Havuzuna)',
  [NotificationScenario.DISCIPLINE_TO_SALARY]: 'Disiplin Kuralı (Doğrudan Maaş Havuzuna)',
  [NotificationScenario.SALARY_POOL_WAITING]: 'Maaş Havuzunda Bekliyor (8.5 Saat Altı)',
  [NotificationScenario.SALARY_DEDUCTION_APPLIED]: 'Maaş Kesintisi Uygulandı',
  [NotificationScenario.ONLY_CARRYOVER]: 'Sadece Devir (İşlem Yok)'
};

export const SCENARIO_DESCRIPTIONS: Record<NotificationScenario, string> = {
  [NotificationScenario.NO_MISSING_TIME]: 'Personelin ilgili dönemde hiçbir eksik süresi veya geç kalma ihlali bulunmadığında tetiklenir.',
  [NotificationScenario.LEAVE_POOL_WAITING]: 'Eksik süre 4 saatin altında olduğu için izinden düşülmez, izin havuzunda bekletilir.',
  [NotificationScenario.FULLY_COVERED_BY_LEAVE]: 'Eksik sürenin tamamı personelin mevcut izninden düşülür.',
  [NotificationScenario.PARTIAL_LEAVE_REST_SALARY]: 'Eksik sürenin bir kısmı personelin mevcut izninden düşülür, kalan yetersiz kısım ise maaş havuzuna aktarılır.',
  [NotificationScenario.NO_LEAVE_TO_SALARY]: 'Personelin hiç izni bulunmadığı için eksik sürenin tamamı doğrudan maaş havuzuna aktarılır.',
  [NotificationScenario.DISCIPLINE_TO_SALARY]: 'Personel, 7 gün geç kalma kuralını ihlal ettiği için izni olsa dahi eksik süre doğrudan maaş havuzuna aktarılır.',
  [NotificationScenario.SALARY_POOL_WAITING]: 'Maaş havuzundaki toplam süre 8.5 saatin altında olduğu için kesinti yapılmaz, havuzda bekletilir.',
  [NotificationScenario.SALARY_DEDUCTION_APPLIED]: 'Maaş havuzundaki toplam süre 8.5 saati aştığı için tam gün katları üzerinden maaş kesintisi uygulanır.',
  [NotificationScenario.ONLY_CARRYOVER]: 'Sadece önceki aylardan devreden süreler bulunur, bu ay yeni bir eksik süre oluşmamıştır.'
};

export interface MessageTemplate {
  id: string;
  title: string;
  scenario: NotificationScenario;
  body: string;
  isActive: boolean;
}

export const DEFAULT_MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'mt-1',
    title: 'İzin Havuzunda Bekliyor (< 4 Saat)',
    scenario: NotificationScenario.LEAVE_POOL_WAITING,
    body: 'EKSİK ÇALIŞMA BİLDİRİMİ\nKonu: Eksik Çalışma Süresinin İzin Havuzunda Bekletilmesi Hakkında Bilgilendirme\n\nSelamünaleyküm [PERSONEL_ADI],\n\n[AY_YIL] dönemi mesai kayıtlarınız incelenmiştir.\n\nİlgili dönem içerisinde oluşan eksik çalışma süreniz, mevcut izin hakkınız kapsamında değerlendirilmiştir. Ancak izin yönünden işlem uygulanabilmesi için gerekli alt limit olan 4 saatlik süreye henüz ulaşılmadığından, bu ay için izinden herhangi bir düşüm yapılmamıştır.\n\nToplam eksik süre: [TOPLAM_EKSIK_SURE]\nGeç gün adedi: [GEC_GUN_ADEDI]\nİzin havuzunda bekleyen süre: [IZIN_HAVUZU_BEKLEYEN]\nSonraki aya devreden izin süresi: [DEVREDEN_IZIN_HAVUZU]\n\nBu ay için ücret kesintisi uygulanmamıştır. İlgili süre izin havuzunda bekletilerek sonraki dönem hesaplamalarına devredilecektir.\n\nBu bildirim, eksik çalışma sürecinin doğru ve şeffaf biçimde yürütülmesi amacıyla tarafınıza tebliğ edilmektedir.\n\nHayırlı Çalışmalar.',
    isActive: true
  },
  {
    id: 'mt-2',
    title: 'Tamamen İzinden Karşılandı',
    scenario: NotificationScenario.FULLY_COVERED_BY_LEAVE,
    body: 'EKSİK ÇALIŞMA BİLDİRİMİ\nKonu: Eksik Çalışma Süresinin İzin Bakiyesinden Karşılanması Hakkında Bilgilendirme\n\nSelamünaleyküm [PERSONEL_ADI],\n\n[AY_YIL] dönemi mesai kayıtlarınız incelenmiştir.\n\nİlgili dönem içerisinde oluşan eksik çalışma süreniz, mevcut izin hakkınız kapsamında değerlendirilmiş ve tamamı izin bakiyenizden karşılanmıştır.\n\nToplam eksik süre: [TOPLAM_EKSIK_SURE]\nGeç gün adedi: [GEC_GUN_ADEDI]\nİzinden karşılanan süre: [IZINDEN_DUSULEN_SURE]\nKalan izin bakiyesi: [KALAN_IZIN_BAKIYESI]\n\nBu değerlendirme sonucunda ilgili dönem için ücret kesintisi uygulanmamıştır.\n\nBu bildirim, eksik çalışma sürecinin doğru ve şeffaf biçimde yürütülmesi amacıyla tarafınıza tebliğ edilmektedir.\n\nHayırlı Çalışmalar.',
    isActive: true
  },
  {
    id: 'mt-3',
    title: 'Kısmi İzin + Kalanı Maaş Havuzuna',
    scenario: NotificationScenario.PARTIAL_LEAVE_REST_SALARY,
    body: 'EKSİK ÇALIŞMA BİLDİRİMİ\nKonu: Eksik Çalışma Süresinin Kısmen İzin, Kısmen Maaş Havuzu Yönünden Değerlendirilmesi Hakkında Bilgilendirme\n\nSelamünaleyküm [PERSONEL_ADI],\n\n[AY_YIL] dönemi mesai kayıtlarınız incelenmiştir.\n\nİlgili dönem içerisinde oluşan eksik çalışma süreniz, mevcut izin hakkınız kapsamında değerlendirilmiştir. İzin hakkınızın yeterli olduğu kısım izinden karşılanmış, karşılanamayan kalan süre ise maaş havuzuna aktarılmıştır.\n\nToplam eksik süre: [TOPLAM_EKSIK_SURE]\nGeç gün adedi: [GEC_GUN_ADEDI]\nİzinden karşılanan süre: [IZINDEN_DUSULEN_SURE]\nMaaş havuzuna aktarılan süre: [MAAS_HAVUZUNA_AKTARILAN]\nSonraki aya devreden maaş süresi: [DEVREDEN_MAAS_HAVUZU]\n\nMaaş havuzuna aktarılan süre, ücret kesintisine esas alt limit olan 8 saat 30 dakikaya ulaşması halinde sonraki dönem bordro işlemlerinde dikkate alınacaktır.\n\nBu bildirim, eksik çalışma sürecinin doğru ve şeffaf biçimde yürütülmesi amacıyla tarafınıza tebliğ edilmektedir.\n\nHayırlı Çalışmalar.',
    isActive: true
  },
  {
    id: 'mt-4',
    title: 'İzin Yok (Doğrudan Maaş Havuzuna)',
    scenario: NotificationScenario.NO_LEAVE_TO_SALARY,
    body: 'EKSİK ÇALIŞMA BİLDİRİMİ\nKonu: Eksik Çalışma Süresinin Maaş Havuzuna Aktarılması Hakkında Bilgilendirme\n\nSelamünaleyküm [PERSONEL_ADI],\n\n[AY_YIL] dönemi mesai kayıtlarınız incelenmiştir.\n\nİlgili dönem içerisinde oluşan eksik çalışma süreniz için kullanılabilir izin hakkınız bulunmadığından, ilgili süre doğrudan maaş havuzuna aktarılmıştır.\n\nToplam eksik süre: [TOPLAM_EKSIK_SURE]\nGeç gün adedi: [GEC_GUN_ADEDI]\nMaaş havuzuna aktarılan süre: [MAAS_HAVUZUNA_AKTARILAN]\nSonraki aya devreden maaş süresi: [DEVREDEN_MAAS_HAVUZU]\n\nİlgili süre, ücret kesintisi alt limiti olan 8 saat 30 dakikaya ulaşması halinde bordro işlemlerinde dikkate alınacaktır.\n\nBu bildirim, eksik çalışma sürecinin doğru ve şeffaf biçimde yürütülmesi amacıyla tarafınıza tebliğ edilmektedir.\n\nHayırlı Çalışmalar.',
    isActive: true
  },
  {
    id: 'mt-5',
    title: '7 Gün Disiplin Kuralı (Maaş Havuzuna)',
    scenario: NotificationScenario.DISCIPLINE_TO_SALARY,
    body: 'EKSİK ÇALIŞMA BİLDİRİMİ\nKonu: Disiplin Uygulaması Kapsamında Eksik Çalışma Süresinin Maaş Yönünden Değerlendirilmesi Hakkında Bilgilendirme\n\nSelamünaleyküm [PERSONEL_ADI],\n\n[AY_YIL] dönemi mesai kayıtlarınız incelenmiştir.\n\nİlgili dönem içerisinde [GEC_GUN_ADEDI] gün geç kalma kaydınız bulunduğundan, kurum disiplin uygulaması gereği eksik çalışma süreniz mevcut izin hakkınızdan bağımsız olarak doğrudan maaş havuzuna aktarılmıştır.\n\nToplam eksik süre: [TOPLAM_EKSIK_SURE]\nGeç gün adedi: [GEC_GUN_ADEDI]\nMaaş havuzuna aktarılan süre: [MAAS_HAVUZUNA_AKTARILAN]\nSonraki aya devreden maaş süresi: [DEVREDEN_MAAS_HAVUZU]\n\nİlgili süre, ücret kesintisine esas alt limite ulaşması halinde bordro işlemlerinde dikkate alınacaktır.\n\nBu bildirim, eksik çalışma sürecinin doğru ve şeffaf biçimde yürütülmesi amacıyla tarafınıza tebliğ edilmektedir.\n\nHayırlı Çalışmalar.',
    isActive: true
  },
  {
    id: 'mt-6',
    title: 'Maaş Havuzunda Bekliyor (< 8:30)',
    scenario: NotificationScenario.SALARY_POOL_WAITING,
    body: 'EKSİK ÇALIŞMA BİLDİRİMİ\nKonu: Maaş Havuzunda Bekleyen Eksik Süre Hakkında Bilgilendirme\n\nSelamünaleyküm [PERSONEL_ADI],\n\n[AY_YIL] dönemi mesai kayıtlarınız incelenmiştir.\n\nİlgili dönem içerisinde maaş havuzuna aktarılan eksik çalışma süreniz oluşmuştur. Ancak ücret kesintisi uygulanabilmesi için gerekli alt limit olan 8 saat 30 dakikalık süreye henüz ulaşılmadığından, bu ay için maaş kesintisi uygulanmamıştır.\n\nToplam eksik süre: [TOPLAM_EKSIK_SURE]\nMaaş havuzunda bekleyen süre: [MAAS_HAVUZU_BEKLEYEN]\nSonraki aya devreden maaş süresi: [DEVREDEN_MAAS_HAVUZU]\n\nİlgili süre maaş havuzunda bekletilerek sonraki dönem hesaplamalarına devredilecektir.\n\nBu bildirim, eksik çalışma sürecinin doğru ve şeffaf biçimde yürütülmesi amacıyla tarafınıza tebliğ edilmektedir.\n\nHayırlı Çalışmalar.',
    isActive: true
  },
  {
    id: 'mt-7',
    title: 'Maaş Kesintisi Uygulandı',
    scenario: NotificationScenario.SALARY_DEDUCTION_APPLIED,
    body: 'EKSİK ÇALIŞMA BİLDİRİMİ\nKonu: Eksik Çalışma ve Ücret Kesinti İşlemi Hakkında Bilgilendirme\n\nSelamünaleyküm [PERSONEL_ADI],\n\n[AY_YIL] dönemi mesai kayıtlarınız incelenmiştir.\n\nYapılan değerlendirme sonucunda, maaş havuzunda biriken eksik çalışma süreniz ücret kesintisine esas alt limit olan 8 saat 30 dakikaya ulaştığından, ilgili dönem bordro işlemlerinde ücret kesintisi uygulanmıştır.\n\nToplam eksik süre: [TOPLAM_EKSIK_SURE]\nGeç gün adedi: [GEC_GUN_ADEDI]\nMaaş kesintisine esas süre: [MAAS_KESINTISINE_ESAS_SURE]\nKesinti tutarı: [KESINTI_TUTARI]\nSonraki aya devreden maaş süresi: [DEVREDEN_MAAS_HAVUZU]\n\nBu bildirim, eksik çalışma sürecinin doğru ve şeffaf biçimde yürütülmesi amacıyla tarafınıza tebliğ edilmektedir.\n\nLütfen gerekli imza işlemleri için İnsan Kaynakları birimine geliniz.\n\nHayırlı Çalışmalar.',
    isActive: true
  },
  {
    id: 'mt-8',
    title: 'Sadece Devreden İşlem',
    scenario: NotificationScenario.ONLY_CARRYOVER,
    body: 'EKSİK ÇALIŞMA BİLDİRİMİ\nKonu: Eksik Çalışma ve Denkleştirme İşlemi Hakkında Bilgilendirme\n\nSelamünaleyküm [PERSONEL_ADI],\n\n[AY_YIL] dönemi mesai kayıtlarınız incelenmiştir.\n\nİlgili dönemde fiili bir kesinti uygulanmamış olup, mevcut eksik süreleriniz kurallar çerçevesinde havuzlarınızda bekletilerek sonraki aya devredilmiştir.\nDevreden Toplam Süre: [DEVREDEN_SURE]\n\nBu bildirim, eksik çalışma sürecinin doğru ve şeffaf biçimde yürütülmesi amacıyla tarafınıza tebliğ edilmektedir.\n\nHayırlı Çalışmalar.',
    isActive: true
  },
  {
    id: 'mt-9',
    title: 'Eksik Çalışma Yok',
    scenario: NotificationScenario.NO_MISSING_TIME,
    body: 'BİLGİLENDİRME\nKonu: Mesai Kayıtları Hakkında Bilgilendirme\n\nSelamünaleyküm [PERSONEL_ADI],\n\n[AY_YIL] dönemi mesai kayıtlarınız incelenmiş olup, herhangi bir eksik çalışmanız veya kesintiniz bulunmamaktadır.\n\nHayırlı Çalışmalar.',
    isActive: true
  }
];

export interface ManagerMessageTemplate {
  id: string;
  title: string;
  body: string;
  isActive: boolean;
}

export const DEFAULT_MANAGER_TEMPLATE: ManagerMessageTemplate = {
  id: 'mmt-1',
  title: 'Birim Sorumlusu Toplu Bildirimi',
  body: 'BİRİM SORUMLUSU TOPLU BİLDİRİMİ\nKonu: [AY_YIL] Dönemi Eksik Çalışma İşlemleri Hakkında Bilgilendirme\n\nSelamünaleyküm [BIRIM_SORUMLUSU_ADI],\n\n[BIRIM_ADI] birimine bağlı personellerin [AY_YIL] dönemi mesai kayıtları incelenmiştir.\n\nİlgili dönem içerisinde eksik çalışma kaydı bulunan personellere ait değerlendirmeler, sistem kuralları doğrultusunda tamamlanmıştır. Personel bazlı işlem özeti aşağıda bilgilerinize sunulmuştur:\n\n[PERSONEL_OZET_LISTESI]\n\nGenel Özet:\n• Toplam değerlendirilen personel: [TOPLAM_PERSONEL]\n• İşlem uygulanan personel: [ISLEM_UYGULANAN_PERSONEL]\n• İzinden karşılanan personel: [IZINDEN_KARSILANAN_PERSONEL]\n• Maaş havuzuna aktarılan personel: [MAAS_HAVUZUNA_AKTARILAN_PERSONEL]\n• Maaş kesintisi uygulanan personel: [MAAS_KESINTISI_UYGULANAN_PERSONEL]\n• 7 gün ve üzeri geç kalma nedeniyle disiplin kapsamında değerlendirilen personel: [YEDI_GUN_KURALINA_TAKILAN_PERSONEL]\n• Sonraki aya devreden kayıt sayısı: [DEVREDEN_KAYIT_SAYISI]\n\nBu bildirim, ilgili döneme ait eksik çalışma işlemlerinin birim bazında toplu ve şeffaf şekilde bilginize sunulması amacıyla oluşturulmuştur.\n\nHayırlı Çalışmalar.',
  isActive: true
};

export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  permittedModules?: string[]; // IDs of modules the user can access
  mustChangePassword?: boolean;
  createdAt: string;
}

export interface ColumnConfig {
  id: string;
  label: string;
  width: number;
  visible: boolean;
  order: number;
  wrap?: boolean;
}

export interface ImportRecord {
  id: string;
  month: string;
  importedAt: string;
  importedBy: string;
  data: Record<string, MonthlyInput>;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface AppState {
  employees: Employee[];
  inputs: Record<string, Record<string, MonthlyInput>>;
  results: Record<string, Record<string, MonthlyResult>>;
  unitConfigs: UnitConfig[];
  notifications: NotificationRecord[];
  documents: DocumentRecord[];
  monthStatus: Record<string, MonthStatus>;
  config: AppConfig;
  backupConfig: BackupConfig;
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
  notificationLogs: NotificationLog[];
  notificationConfig: NotificationConfig;
  departmentManagers: DepartmentManager[];
  messageTemplates: MessageTemplate[];
  managerMessageTemplates: ManagerMessageTemplate[];
  version: number;
  lastBackupTime?: string;
  imports?: ImportRecord[];
  leaveRecords?: LeaveRecord[];
  leaveSettings?: LeaveSettings;
  tasks?: Task[];
  notes?: any[];
  reminders?: any[];
  notesSettings?: any;
  goals?: Goal[];
}

export interface ParsedLeaveValue {
  originalText: string;
  days: number;
  hours: number;
  minutes: number;
  totalDays: number;
}

export interface LeaveRecord {
  id: string;
  employeeId?: string;
  tc: string;
  name: string;
  annualLeave: ParsedLeaveValue;
  usedAnnualLeave: ParsedLeaveValue;
  remainingAnnualLeave: ParsedLeaveValue;
  compensatoryLeave: ParsedLeaveValue;
  usedCompensatoryLeave: ParsedLeaveValue;
  remainingCompensatoryLeave: ParsedLeaveValue;
  department?: string;
  title?: string;
  hireDate?: string;
  seniority?: { years: number; months: number; days: number };
  netSalary?: number;
  locationType?: 'Genel Merkez' | 'Saha' | 'Belirtilmemiş';
  manager?: string;
  isActive?: boolean;
  estimatedAnnualLeaveCost?: number;
  estimatedCompensatoryLeaveCost?: number;
  totalEstimatedCost?: number;
}

export interface LeaveSettings {
  criticalLeaveThreshold: number;
  riskyNegativeThreshold: number;
  costCalculationMethod: 'netSalary/30' | 'grossSalary/30';
  reportColors: {
    critical: string;
    risky: string;
    safe: string;
  };
}

export const DEFAULT_LEAVE_SETTINGS: LeaveSettings = {
  criticalLeaveThreshold: 5,
  riskyNegativeThreshold: 0,
  costCalculationMethod: 'netSalary/30',
  reportColors: {
    critical: 'text-amber-500 bg-amber-50',
    risky: 'text-red-500 bg-red-50',
    safe: 'text-emerald-500 bg-emerald-50'
  }
};
