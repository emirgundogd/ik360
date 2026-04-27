import { Employee, MonthlyResult } from '../types';

export const generatePersonnelMessage = (emp: Employee, result: MonthlyResult, period: string) => {
  const { missingTime, lateDays, salaryDeductedAmountTry, leaveDeductedMinutes } = result;

  if (salaryDeductedAmountTry > 0) {
    return `Sayın ${emp.name}, ${period} dönemi PDKS analiziniz sonucunda ${lateDays} gün geç kalma ve ${missingTime} eksik süre nedeniyle ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(salaryDeductedAmountTry)} maaş kesintisi uygulanmıştır.`;
  }
  
  if (leaveDeductedMinutes > 0) {
    return `Sayın ${emp.name}, ${period} dönemi PDKS analiziniz sonucunda ${missingTime} eksik süre nedeniyle ${Math.floor(leaveDeductedMinutes / 60)} saat ${leaveDeductedMinutes % 60} dakika izin mahsubu yapılmıştır.`;
  }

  return `Sayın ${emp.name}, ${period} dönemi PDKS analizinizde herhangi bir kesinti veya mahsup işlemi bulunmamaktadır. Teşekkür ederiz.`;
};

export const generateUnitManagerMessage = (unitName: string, period: string, personnelResults: { emp: Employee, result: MonthlyResult }[]) => {
  const totalPersonnel = personnelResults.length;
  const totalDeduction = personnelResults.reduce((acc, curr) => acc + curr.result.salaryDeductedAmountTry, 0);
  
  let message = `Sayın Birim Sorumlusu, ${period} dönemi ${unitName} birimi PDKS analiz özeti aşağıdadır:\n\n`;
  message += `Toplam Personel: ${totalPersonnel}\n`;
  message += `Toplam Maaş Kesintisi: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalDeduction)}\n\n`;
  message += `Personel Detayları:\n`;
  
  personnelResults.forEach(item => {
    message += `- ${item.emp.name}: ${item.result.salaryDeductedAmountTry > 0 ? 'Kesinti Var' : 'Temiz'}\n`;
  });
  
  return message;
};
