import { ParsedLeaveValue } from './types';

export const parseLeaveText = (text: string | number | null | undefined): ParsedLeaveValue => {
  if (text === null || text === undefined || text === '') {
    return { originalText: '0', days: 0, hours: 0, minutes: 0, totalDays: 0 };
  }

  const str = String(text).toLowerCase().trim();
  
  // If it's just a number
  if (!isNaN(Number(str))) {
    const days = Number(str);
    return { originalText: str, days, hours: 0, minutes: 0, totalDays: days };
  }

  let days = 0;
  let hours = 0;
  let minutes = 0;

  // Extract days
  const daysMatch = str.match(/(\d+(?:\.\d+)?)\s*(g[uü]n|g)/);
  if (daysMatch) days = parseFloat(daysMatch[1]);

  // Extract hours
  const hoursMatch = str.match(/(\d+(?:\.\d+)?)\s*(saat|sa|s)/);
  if (hoursMatch) hours = parseFloat(hoursMatch[1]);

  // Extract minutes
  const minutesMatch = str.match(/(\d+(?:\.\d+)?)\s*(dakika|dk|d)/);
  if (minutesMatch) minutes = parseFloat(minutesMatch[1]);

  // Calculate total days (assuming 1 day = 24 hours, or standard working hours? Usually leave is calculated in standard days. Let's assume 1 day = 24 hours for pure math, or maybe 1 day = 8 hours working? The prompt says "Ana raporlama gün mantığında çalışsın. Günü saate çevirmesin." We'll just use days + hours/24 + minutes/1440 for sorting/math, but display the original text or days.)
  // Actually, standard working day is often 8 or 9 hours, but let's stick to 24 for generic math unless specified. Let's use 24.
  const totalDays = days + (hours / 24) + (minutes / 1440);

  return {
    originalText: String(text),
    days,
    hours,
    minutes,
    totalDays
  };
};

export const formatLeaveValue = (value: ParsedLeaveValue): string => {
  if (value.hours === 0 && value.minutes === 0) {
    return `${value.days} Gün`;
  }
  let result = [];
  if (value.days > 0) result.push(`${value.days} Gün`);
  if (value.hours > 0) result.push(`${value.hours} Saat`);
  if (value.minutes > 0) result.push(`${value.minutes} Dk`);
  return result.join(' ');
};

export const calculateSeniority = (hireDateStr?: string) => {
  if (!hireDateStr) return { years: 0, months: 0, days: 0, text: '-' };
  
  const hireDate = new Date(hireDateStr);
  const today = new Date();
  
  let years = today.getFullYear() - hireDate.getFullYear();
  let months = today.getMonth() - hireDate.getMonth();
  let days = today.getDate() - hireDate.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += previousMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  let textParts = [];
  if (years > 0) textParts.push(`${years} Yıl`);
  if (months > 0) textParts.push(`${months} Ay`);
  if (days > 0 && years === 0) textParts.push(`${days} Gün`); // Only show days if less than a year for brevity, or show all. Let's show all.
  
  return {
    years,
    months,
    days,
    text: textParts.length > 0 ? textParts.join(' ') : '0 Gün'
  };
};
