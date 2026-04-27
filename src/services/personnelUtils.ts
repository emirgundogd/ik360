import { AppConfig } from '../types';

/**
 * Normalizes text for Turkish-aware case-insensitive search
 */
export const normalizeText = (text: string): string => {
  if (!text) return '';
  return text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFC')
    .trim();
};

/**
 * Checks if a target string matches a search string (Turkish-aware, case-insensitive, partial, multi-term)
 */
export const searchMatch = (target: string, search: string): boolean => {
  if (!search) return true;
  const normalizedTarget = normalizeText(target);
  const normalizedSearch = normalizeText(search);
  
  const searchTerms = normalizedSearch.split(/\s+/).filter(Boolean);
  if (searchTerms.length === 0) return true;

  // All search terms must be present in the target string
  return searchTerms.every(term => normalizedTarget.includes(term));
};

/**
 * Calculates seniority in years, months, and days
 */
export const calculateSeniority = (hireDate?: string) => {
  if (!hireDate) return { years: 0, months: 0, days: 0 };
  const start = new Date(hireDate);
  if (isNaN(start.getTime())) return { years: 0, months: 0, days: 0 };
  const end = new Date();
  
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  
  if (days < 0) {
    months--;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return { years, months, days };
};

/**
 * Formats seniority object into a readable string
 */
export const formatSeniority = (seniority: { years: number, months: number, days: number }) => {
  const parts = [];
  if (seniority.years > 0) parts.push(`${seniority.years} Yıl`);
  if (seniority.months > 0) parts.push(`${seniority.months} Ay`);
  if (seniority.days > 0) parts.push(`${seniority.days} Gün`);
  
  if (parts.length === 0) return '0 Gün';
  return parts.join(', ');
};

/**
 * Calculates days remaining for trial period end
 */
export const calculateTrialRemaining = (hireDate: string | undefined, trialMonths: number) => {
  if (!hireDate) return 0;
  const start = new Date(hireDate);
  const trialEnd = new Date(start);
  trialEnd.setMonth(start.getMonth() + trialMonths);
  
  const today = new Date();
  const diffTime = trialEnd.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Calculates days remaining for 1 year anniversary
 */
export const calculateAnniversaryRemaining = (hireDate?: string) => {
  if (!hireDate) return 0;
  const start = new Date(hireDate);
  const today = new Date();
  
  const nextAnniversary = new Date(start);
  nextAnniversary.setFullYear(today.getFullYear());
  
  if (nextAnniversary < today) {
    nextAnniversary.setFullYear(today.getFullYear() + 1);
  }
  
  const diffTime = nextAnniversary.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Estimates Gross salary and Employer Cost from Net salary
 * This is a simplified estimation for UI purposes.
 */
export const estimateSalaryCosts = (netSalary: number, config: AppConfig) => {
  // Very simplified reverse calculation for estimation
  // Net = Gross - (Gross * SGK_Rate) - (Gross * IncomeTax_Rate) - (Gross * StampTax)
  // Gross = Net / (1 - SGK_Rate - IncomeTax_Rate - StampTax)
  
  const sgkRate = 0.14 + 0.01; // SGK + Unemployment
  const incomeTaxRate = config.incomeTaxRate / 100;
  const stampTaxRate = config.stampTaxRate;
  
  const divisor = 1 - sgkRate - incomeTaxRate - stampTaxRate;
  const estimatedGross = netSalary / divisor;
  
  // Employer Cost = Gross + (Gross * Employer_SGK) + (Gross * Employer_Unemployment) - (Gross * Incentive)
  const employerSgkRate = config.sgkEmployerRate / 100;
  const employerUnemploymentRate = config.unemploymentEmployerRate / 100;
  const incentiveRate = config.fivePercentIncentive / 100;
  
  const employerCost = estimatedGross * (1 + employerSgkRate + employerUnemploymentRate - incentiveRate);
  
  return {
    gross: estimatedGross,
    cost: employerCost
  };
};

/**
 * Determines leave alert status
 */
export const getLeaveAlertStatus = (days: number) => {
  if (days < 5) return 'critical';
  if (days < 10) return 'warning';
  return 'normal';
};
