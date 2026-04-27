import { useMemo } from 'react';
import { Employee } from '../../types';
import { calculateSeniority, calculateTrialRemaining } from '../../services/personnelUtils';

export const usePersonnelStats = (
  employees: Employee[],
  locationFilter: string,
  deptDistSelected: string[],
  highPaidSelected: string[],
  lowPaidSelected: string[],
  deptTenureSelected: string[],
  deptSalarySelected: string[]
) => {
  const activeEmployees = useMemo(() => employees.filter(e => e.system?.isActive && !e.isDeleted && !e.work?.terminationDate), [employees]);
  
  const filteredEmployees = useMemo(() => {
    if (locationFilter === 'Tümü') return activeEmployees;
    const mappedFilter = locationFilter === 'Merkez' ? 'HQ' : 'FIELD';
    return activeEmployees.filter(e => e.work?.workLocationType === mappedFilter);
  }, [activeEmployees, locationFilter]);

  const allDepartments = useMemo(() => {
    const depts = new Set(employees.map(e => e.work?.department || 'Belirtilmemiş'));
    return Array.from(depts).sort();
  }, [employees]);

  const kpis = useMemo(() => {
    const totalPersonnel = filteredEmployees.length;
    const retiredPersonnel = filteredEmployees.filter(e => e.work?.retirementStatus === 'Emekli').length;
    const partTimePersonnel = filteredEmployees.filter(e => e.work?.employmentType === 'Kısmi Zamanlı').length;

    let totalAge = 0;
    let validAgeCount = 0;
    
    let totalTenure = 0;
    let validTenureCount = 0;

    const todayYear = new Date().getFullYear();

    filteredEmployees.forEach(e => {
      if (e.core?.birthDate) {
        const bDate = new Date(e.core.birthDate);
        if (!isNaN(bDate.getTime())) {
          totalAge += todayYear - bDate.getFullYear();
          validAgeCount++;
        }
      }

      if (e.work?.hireDate) {
        const hDate = new Date(e.work.hireDate);
        if (!isNaN(hDate.getTime())) {
           const seniority = calculateSeniority(e.work.hireDate);
           totalTenure += seniority.years + (seniority.months / 12);
           validTenureCount++;
        }
      }
    });

    const avgAge = validAgeCount > 0 ? totalAge / validAgeCount : 0;
    const avgTenure = validTenureCount > 0 ? totalTenure / validTenureCount : 0;

    const avgYears = Math.floor(avgTenure);
    const avgMonths = Math.round((avgTenure - avgYears) * 12);
    const avgTenureStr = `${avgYears > 0 ? `${avgYears} Yıl ` : ''}${avgMonths > 0 ? `${avgMonths} Ay` : ''}` || '0 Ay';

    return {
      totalPersonnel,
      retiredPersonnel,
      partTimePersonnel,
      avgAge: Math.round(avgAge),
      avgTenureStr
    };
  }, [filteredEmployees]);

  const ageData = useMemo(() => {
    const groups = { '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '56+': 0 };
    const todayYear = new Date().getFullYear();
    
    filteredEmployees.forEach(e => {
      if (!e.core?.birthDate) return;
      const bDate = new Date(e.core.birthDate);
      if (isNaN(bDate.getTime())) return;
      
      const age = todayYear - bDate.getFullYear();
      
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
      if (deptDistSelected.includes(dept)) {
        counts[dept] = (counts[dept] || 0) + 1;
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

  const validTenureEmps = useMemo(() => filteredEmployees.filter(e => e.work?.hireDate && !isNaN(new Date(e.work.hireDate).getTime())), [filteredEmployees]);
  
  const mostTenured = useMemo(() => [...validTenureEmps].sort((a, b) => new Date(a.work.hireDate!).getTime() - new Date(b.work.hireDate!).getTime()).slice(0, 5), [validTenureEmps]);
  
  const leastTenured = useMemo(() => [...validTenureEmps].sort((a, b) => new Date(b.work.hireDate!).getTime() - new Date(a.work.hireDate!).getTime()).slice(0, 5), [validTenureEmps]);

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

  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next30 = new Date(today);
    next30.setDate(today.getDate() + 30);
    
    return filteredEmployees.filter(e => {
      if (!e.core.birthDate) return false;
      const bday = new Date(e.core.birthDate);
      if (isNaN(bday.getTime())) return false;
      const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
      const nextYearBday = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate());
      
      return (thisYearBday >= today && thisYearBday <= next30) || (nextYearBday >= today && nextYearBday <= next30);
    }).sort((a, b) => {
      const bdayA = new Date(a.core.birthDate!);
      const bdayB = new Date(b.core.birthDate!);
      return bdayA.getMonth() - bdayB.getMonth() || bdayA.getDate() - bdayB.getDate();
    });
  }, [filteredEmployees]);

  const probationEmployees = useMemo(() => {
    return filteredEmployees.filter(e => {
      const remaining = calculateTrialRemaining(e.work.hireDate, e.work.trialPeriodMonths || 2);
      return remaining > 0;
    }).sort((a, b) => {
      const remA = calculateTrialRemaining(a.work.hireDate, a.work.trialPeriodMonths || 2);
      const remB = calculateTrialRemaining(b.work.hireDate, b.work.trialPeriodMonths || 2);
      return remA - remB;
    });
  }, [filteredEmployees]);

  return {
    activeEmployees,
    filteredEmployees,
    allDepartments,
    kpis,
    ageData,
    deptData,
    genderData,
    maritalData,
    childData,
    bloodData,
    eduData,
    mostTenured,
    leastTenured,
    highestPaid,
    lowestPaid,
    deptTenure,
    deptSalary,
    upcomingBirthdays,
    probationEmployees
  };
};
