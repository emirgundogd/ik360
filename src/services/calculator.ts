import { Employee, MonthlyInput, AppConfig, MonthlyResult, UnitConfig, NotificationScenario } from '../types';

export function deduceScenario(r: MonthlyResult): NotificationScenario {
  if (r.scenario) return r.scenario;
  
  if ((r.salaryDeductedMinutes || 0) > 0 || (r.salaryDeductedAmountTry || 0) > 0) {
    return NotificationScenario.SALARY_DEDUCTION_APPLIED;
  } else if (r.isDisciplineApplied && (r.currentMissingMinutes || 0) > 0) {
    return NotificationScenario.DISCIPLINE_TO_SALARY;
  } else if ((r.currentMissingMinutes || 0) > 0) {
    const addedToSalaryPool = Math.max(0, (r.nextSalaryPoolMinutes || 0) - (r.prevSalaryPoolMinutes || 0));
    const addedToLeavePool = Math.max(0, (r.nextLeavePoolMinutes || 0) - (r.prevLeavePoolMinutes || 0));
    
    if (addedToSalaryPool > 0) {
      if ((r.leaveDeductedMinutes || 0) > 0) return NotificationScenario.PARTIAL_LEAVE_REST_SALARY;
      return NotificationScenario.NO_LEAVE_TO_SALARY;
    } else if ((r.leaveDeductedMinutes || 0) > 0) {
      return NotificationScenario.FULLY_COVERED_BY_LEAVE;
    } else if (addedToLeavePool > 0 || (r.nextLeavePoolMinutes || 0) > 0) {
      return NotificationScenario.LEAVE_POOL_WAITING;
    }
  } else {
    if ((r.prevSalaryPoolMinutes || 0) > 0 && (r.nextSalaryPoolMinutes || 0) > 0) {
      return NotificationScenario.SALARY_POOL_WAITING;
    } else if ((r.nextSalaryPoolMinutes || 0) > 0 || (r.nextLeavePoolMinutes || 0) > 0) {
      return NotificationScenario.ONLY_CARRYOVER;
    }
  }
  return NotificationScenario.NO_MISSING_TIME;
}

export const parseTimeToMinutes = (timeStr: string | number): number => {
  if (timeStr === undefined || timeStr === null || timeStr === '') return 0;
  if (typeof timeStr === 'number') return Math.round(timeStr);
  
  const s = String(timeStr).trim();
  if (!s) return 0;
  
  if (s.includes(':')) {
    const isNegative = s.startsWith('-');
    const cleanStr = isNegative ? s.substring(1) : s;
    const [hours, minutes] = cleanStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    const total = (hours || 0) * 60 + (minutes || 0);
    return isNegative ? -total : total;
  }
  
  const num = parseFloat(s.replace(',', '.'));
  if (!isNaN(num)) return Math.round(num);
  
  return 0;
};

export const formatMinutesToTime = (totalMinutes: number): string => {
  const isNegative = totalMinutes < 0;
  const absMinutes = Math.round(Math.abs(totalMinutes));
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  return `${isNegative ? '-' : ''}${hours}:${minutes.toString().padStart(2, '0')}`;
};

export const formatMonthTurkish = (monthStr: string): string => {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [y, m] = monthStr.split('-').map(Number);
  const months = [
    'OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN',
    'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'
  ];
  return `${y} ${months[m - 1]}`;
};

export const calculateMonthlyPayroll = (
  emp: Employee,
  month: string,
  input: MonthlyInput,
  prevState: { leavePoolMinutes: number; salaryPoolMinutes: number; intermediatePoolMinutes?: number },
  config: AppConfig,
  unitConfigs: UnitConfig[] = []
): MonthlyResult => {
  // 1. Determine Unit Settings
  const unit = unitConfigs.find(u => u.unitName === emp.department);
  const dailyWorkMinutes = unit?.dailyWorkMinutes || config.defaultDailyWorkMinutes;
  const leaveThreshold = unit?.leaveDeductionThresholdMinutes || config.defaultLeaveDeductionThresholdMinutes;
  const salaryThreshold = unit?.salaryDeductionThresholdMinutes || config.defaultSalaryDeductionThresholdMinutes;
  const lateDayThreshold = unit?.lateDayThreshold || config.defaultLateDayThreshold;
  const twoMonthRuleBehavior = unit?.twoMonthRuleBehavior || config.twoMonthRuleBehavior || 'ask';
  const middlePoolWaitMonths = unit?.middlePoolWaitMonths || config.middlePoolWaitMonths || 2;

  // 2. Parse Inputs
  const currentMissingMinutes = parseTimeToMinutes(input.missingTime);
  const currentLateDays = input.lateDays || 0;
  const currentImportedLeaveBalanceMinutes = parseTimeToMinutes(input.currentLeaveBalance);
  
  let leavePool = prevState.leavePoolMinutes || 0;
  let salaryPool = prevState.salaryPoolMinutes || 0;
  
  let leaveDeductedMinutes = 0;
  let leaveEarnedMinutes = 0;
  let salaryDeductedMinutes = 0;
  let salaryDeductedAmountTry = 0;
  const explanation: string[] = [];

  const isDisciplineApplied = currentLateDays >= lateDayThreshold;
  
  // 3. Process Missing Time and Pools
  // Toplam işlenecek süre = Bu ayki eksiklik + Geçen aydan devreden izin havuzu borcu
  let totalMissingToProcess = currentMissingMinutes + leavePool;
  leavePool = 0; // Havuzu sıfırlayıp yeniden hesaplayacağız

  // DURUM A: Ekstra Çalışma (Toplam süre negatifse)
  if (totalMissingToProcess < 0) {
    leaveEarnedMinutes = Math.abs(totalMissingToProcess);
    explanation.push(`BİLGİ: Toplam ${formatMinutesToTime(leaveEarnedMinutes)} ekstra çalışma tespit edildi. Bu süre mevcut izne eklenecek.`);
    // İzin havuzu zaten sıfırlandı
  } 
  // DURUM B: Eksik Çalışma (Toplam süre pozitifse)
  else if (totalMissingToProcess > 0) {
    if (isDisciplineApplied) {
      // Kural 4: Disiplin (7 Gün Kuralı) -> Tüm eksiklik doğrudan maaş havuzuna
      salaryPool += totalMissingToProcess;
      explanation.push(`KURAL: Geç kalma limiti (${lateDayThreshold} gün) aşıldığı için tüm eksik süre (${formatMinutesToTime(totalMissingToProcess)}) doğrudan maaş havuzuna aktarıldı.`);
    } else {
      if (currentImportedLeaveBalanceMinutes <= 0) {
        // Kural 1: İzin hakkı yok -> Maaş havuzuna
        salaryPool += totalMissingToProcess;
        explanation.push(`KURAL: İzin hakkı bulunmadığı için eksik süre (${formatMinutesToTime(totalMissingToProcess)}) maaş havuzuna aktarıldı.`);
      } else {
        // İzin hakkı var
        if (totalMissingToProcess >= leaveThreshold) {
          // Kural 2: Eksik süre eşiği (4 saat) aşıldı -> Mevcut izinden düş
          const deductFromLeave = Math.min(totalMissingToProcess, currentImportedLeaveBalanceMinutes);
          leaveDeductedMinutes += deductFromLeave;
          explanation.push(`KURAL: Eksik süre (${formatMinutesToTime(totalMissingToProcess)}) eşiği aştığı için ${formatMinutesToTime(deductFromLeave)} mevcut izinden düşüldü.`);
          
          const remainingAfterLeave = totalMissingToProcess - deductFromLeave;
          if (remainingAfterLeave > 0) {
            salaryPool += remainingAfterLeave;
            explanation.push(`KURAL: İzin yetmediği için kalan ${formatMinutesToTime(remainingAfterLeave)} maaş havuzuna aktarıldı.`);
          }
        } else {
          // Kural 5: Eksik süre eşiğin altında -> İzin havuzunda (borç) beklet
          leavePool = totalMissingToProcess;
          explanation.push(`KURAL: Eksik süre (${formatMinutesToTime(totalMissingToProcess)}) eşiğin altında olduğu için izin havuzuna (zaman borcu) eklendi.`);
        }
      }
    }
  }

  // 4. Maaş Havuzu Kontrolü (8.5 saat kuralı)
  if (salaryPool >= salaryThreshold) {
    const fullDaysToDeduct = Math.floor(salaryPool / salaryThreshold);
    if (fullDaysToDeduct > 0) {
      const minutesToDeduct = fullDaysToDeduct * salaryThreshold;
      salaryDeductedMinutes += minutesToDeduct;
      salaryPool -= minutesToDeduct;
      explanation.push(`KURAL: Maaş havuzu ${fullDaysToDeduct} tam gün (${formatMinutesToTime(minutesToDeduct)}) kesintiye ulaştı. Kalan ${formatMinutesToTime(salaryPool)} bir sonraki aya devredildi.`);
    } else {
      explanation.push(`KURAL: Maaş havuzu eşiği aşıldı ancak tam gün oluşmadığı için kesinti yapılmadı, ${formatMinutesToTime(salaryPool)} bekletiliyor.`);
    }
  } else if (salaryPool > 0) {
    explanation.push(`KURAL: Maaş havuzundaki ${formatMinutesToTime(salaryPool)} borç eşiğin altında olduğu için bekletiliyor.`);
  }

  // 5. Maaş Kesintisi Tutar Hesaplama
  if (salaryDeductedMinutes > 0) {
    const netSalary = emp.wage?.netSalary || emp.netSalary || 0;
    const gunlukNet = netSalary / 30;
    const kesilecekGun = salaryDeductedMinutes / salaryThreshold;
    salaryDeductedAmountTry = kesilecekGun * gunlukNet;
    explanation.push(`HESAP: ${kesilecekGun.toFixed(2)} gün karşılığı ${Math.round(salaryDeductedAmountTry).toLocaleString('tr-TR')} ₺ maaş kesintisi yapıldı.`);
  }

  // 6. Final Result Construction
  let nextLeavePoolMinutes = leavePool;
  let nextSalaryPoolMinutes = salaryPool;
  let finalSalaryDeductedAmountTry = Math.round(salaryDeductedAmountTry);

  if (input.hasOverride) {
    if (input.overrideLeavePoolMinutes !== undefined) nextLeavePoolMinutes = input.overrideLeavePoolMinutes;
    if (input.overrideSalaryPoolMinutes !== undefined) nextSalaryPoolMinutes = input.overrideSalaryPoolMinutes;
    if (input.overrideSalaryDeductionAmount !== undefined) finalSalaryDeductedAmountTry = input.overrideSalaryDeductionAmount;
    explanation.push(`BİLGİ: Yönetici tarafından manuel müdahale uygulandı.`);
  }

  // 7. Determine Scenario
  let scenario = NotificationScenario.NO_MISSING_TIME;
  if (currentMissingMinutes <= 0 && (prevState.leavePoolMinutes || 0) === 0 && (prevState.salaryPoolMinutes || 0) === 0) {
    scenario = NotificationScenario.NO_MISSING_TIME;
  } else if (salaryDeductedMinutes > 0 || finalSalaryDeductedAmountTry > 0) {
    scenario = NotificationScenario.SALARY_DEDUCTION_APPLIED;
  } else if (isDisciplineApplied && currentMissingMinutes > 0) {
    scenario = NotificationScenario.DISCIPLINE_TO_SALARY;
  } else if (currentMissingMinutes > 0) {
    // We need to know if time went to salary pool this month
    const addedToSalaryPool = Math.max(0, salaryPool - (prevState.salaryPoolMinutes || 0));
    const addedToLeavePool = Math.max(0, leavePool - (prevState.leavePoolMinutes || 0));
    
    if (addedToSalaryPool > 0) {
      if (leaveDeductedMinutes > 0) {
        scenario = NotificationScenario.PARTIAL_LEAVE_REST_SALARY;
      } else {
        scenario = NotificationScenario.NO_LEAVE_TO_SALARY;
      }
    } else if (leaveDeductedMinutes > 0) {
      scenario = NotificationScenario.FULLY_COVERED_BY_LEAVE;
    } else if (addedToLeavePool > 0 || leavePool > 0) {
      scenario = NotificationScenario.LEAVE_POOL_WAITING;
    }
  } else {
    if ((prevState.salaryPoolMinutes || 0) > 0) {
      scenario = NotificationScenario.SALARY_POOL_WAITING;
    } else {
      scenario = NotificationScenario.ONLY_CARRYOVER;
    }
  }

  return {
    employeeId: emp.id,
    month,
    currentMissingMinutes,
    currentLateDays,
    currentImportedLeaveBalanceMinutes,
    prevLeavePoolMinutes: prevState.leavePoolMinutes || 0,
    prevSalaryPoolMinutes: prevState.salaryPoolMinutes || 0,
    isDisciplineApplied,
    leaveDeductedMinutes,
    leaveEarnedMinutes,
    salaryDeductedMinutes,
    salaryDeductedAmountTry: finalSalaryDeductedAmountTry,
    nextLeavePoolMinutes,
    nextSalaryPoolMinutes,
    explanation,
    calculationDate: new Date().toISOString(),
    unitConfigUsed: {
      dailyWorkMinutes,
      leaveDeductionThresholdMinutes: leaveThreshold,
      salaryDeductionThresholdMinutes: salaryThreshold,
      lateDayThreshold,
    },
    scenario
  };
}
