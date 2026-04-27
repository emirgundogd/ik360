export interface ParsedLeaveValue {
  originalText: string;
  days: number;
  hours: number;
  minutes: number;
  totalDays: number; // Decimal representation for calculations
}

export interface LeaveRecord {
  id: string;
  employeeId?: string; // Matched from Personnel Management
  tc: string;
  name: string;
  
  // Excel Data
  annualLeave: ParsedLeaveValue;
  usedAnnualLeave: ParsedLeaveValue;
  remainingAnnualLeave: ParsedLeaveValue;
  compensatoryLeave: ParsedLeaveValue;
  usedCompensatoryLeave: ParsedLeaveValue;
  remainingCompensatoryLeave: ParsedLeaveValue;

  // Enriched Data from Personnel Management
  department?: string;
  title?: string;
  hireDate?: string;
  seniority?: { years: number; months: number; days: number };
  netSalary?: number;
  locationType?: 'Genel Merkez' | 'Saha' | 'Belirtilmemiş';
  manager?: string;
  isActive?: boolean;
  
  // Calculated
  estimatedAnnualLeaveCost?: number;
  estimatedCompensatoryLeaveCost?: number;
  totalEstimatedCost?: number;
}

export interface LeaveSettings {
  criticalLeaveThreshold: number; // e.g., 5 days
  riskyNegativeThreshold: number; // e.g., 0 days
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
