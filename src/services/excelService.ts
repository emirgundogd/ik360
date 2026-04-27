import * as XLSX from 'xlsx';

export interface ExcelRow {
  tckn: string;
  adSoyad: string;
  birthDate?: string;
  gender?: string;
  maritalStatus?: string;
  childCount?: number;
  bloodGroup?: string;
  hireDate?: string;
  department?: string;
  title?: string;
  actualWorkLocation?: string;
  workLocationType?: string; // HQ / FIELD
  residenceAddress?: string;
  residenceCity?: string;
  residenceDistrict?: string;
  phone?: string;
  email?: string;
  netSalary: number;
  mealAllowance?: number;
  roadAllowance?: number;
  totalPaidAmount?: number;
  employmentType?: string;
  retirementStatus?: string;
  education?: string;
  isForeign?: boolean;
  hasIncentive?: string;
  isActive?: boolean;
  exitDate?: string;
  exitCode?: string;
  
  // PDKS specific
  missingTime?: string;
  lateDays?: number;
  currentLeaveBalance?: string;
  
  showInPdks?: boolean;

  error?: string;
  rowIndex: number;
}

const normalizeString = (str: string) => {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, ''); // remove all non-alphanumeric
};

export const excelService = {
  parseExcel: async (file: File): Promise<{ data: ExcelRow[], errors: string[], warnings: string[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];

          if (jsonData.length === 0) {
            resolve({ data: [], errors: ['Dosya boş.'], warnings: [] });
            return;
          }

          // 1. Find the header row (look for common keywords in the first 20 rows)
          let headerRowIdx = -1;
          const commonKeywords = ['tc', 'tckn', 'ad', 'soyad', 'isim', 'personel'];
          
          for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
            const row = jsonData[i];
            if (row && row.some(cell => {
              const normalized = normalizeString(String(cell || ''));
              return commonKeywords.some(k => normalized === k || normalized.includes(k));
            })) {
              headerRowIdx = i;
              break;
            }
          }

          if (headerRowIdx === -1) headerRowIdx = 0;

          const rawHeaders = jsonData[headerRowIdx].map(h => String(h || '').trim());
          const normalizedHeaders = rawHeaders.map(h => normalizeString(h).replace(/[\s.]/g, ''));
          const rows = jsonData.slice(headerRowIdx + 1);

          const findHeaderIndex = (possibleNames: string[]) => {
            return normalizedHeaders.findIndex(h => {
              return possibleNames.some(p => {
                const normalizedP = normalizeString(p).replace(/[\s.]/g, '');
                return h.includes(normalizedP);
              });
            });
          };

          const nameIdx = findHeaderIndex(['adsoyad', 'isim', 'personeladi']);
          const tcknIdx = findHeaderIndex(['tc', 'tckn', 'kimlik']);
          const hireDateIdx = findHeaderIndex(['isegiris', 'giristarihi', 'baslama']);
          const birthDateIdx = findHeaderIndex(['dogum', 'dogumtarihi']);
          const maritalIdx = findHeaderIndex(['medeni', 'medenidurum']);
          const childIdx = findHeaderIndex(['cocuk', 'cocuksayisi']);
          const phoneIdx = findHeaderIndex(['telefon', 'tel', 'cep']);
          const emailIdx = findHeaderIndex(['eposta', 'email', 'mail']);
          const bloodIdx = findHeaderIndex(['kan', 'kangrubu']);
          const deptIdx = findHeaderIndex(['departman', 'bolum', 'birim']);
          const titleIdx = findHeaderIndex(['unvan', 'gorev', 'pozisyon']);
          const locationIdx = findHeaderIndex(['lokasyon', 'gorevyeri', 'fiiligorevyeri']);
          const addressIdx = findHeaderIndex(['adres', 'ikametadresi']);
          const cityIdx = findHeaderIndex(['il', 'sehir', 'ikametili']);
          const districtIdx = findHeaderIndex(['ilce', 'ikametilcesi']);
          const salaryIdx = findHeaderIndex(['maas', 'netmaas', 'ucret']);
          const mealIdx = findHeaderIndex(['yemek', 'yemekodenegi']);
          const roadIdx = findHeaderIndex(['yol', 'yolodenegi']);
          const totalPaidIdx = findHeaderIndex(['toplam', 'toplamhesaba', 'toplamyatan']);
          const employmentTypeIdx = findHeaderIndex(['calismasekli', 'istihdam', 'kismitam', 'zamanli']);
          const retirementIdx = findHeaderIndex(['emekli', 'emeklilik']);
          const genderIdx = findHeaderIndex(['cinsiyet', 'cins']);
          const educationIdx = findHeaderIndex(['egitim', 'mezuniyet', 'ogrenim']);
          const workLocTypeIdx = findHeaderIndex(['merkezsaha', 'sahamerkez', 'calismayeri']);
          const showInPdksIdx = findHeaderIndex(['pdks', 'gorunsun']);
          const exitDateIdx = findHeaderIndex(['cikis', 'ayrilma', 'tenkis', 'istencikis']);
          const exitCodeIdx = findHeaderIndex(['cikiskodu', 'cikissebebi', 'cikiskod']);

          const foreignIdx = findHeaderIndex(['yabanci', 'uyruk']);
          const incentiveIdx = findHeaderIndex(['tesvik', 'indirim']);
          const missingTimeIdx = findHeaderIndex(['eksik', 'eksikmesai']);
          const lateDaysIdx = findHeaderIndex(['gec', 'geckalma']);
          const leaveBalanceIdx = findHeaderIndex(['izin', 'kalanizin']);

          const parseEmploymentType = (val: any) => {
            if (!val) return 'Tam Zamanlı';
            const s = normalizeString(String(val));
            if (s.includes('kismi') || s.includes('part')) return 'Kısmi Zamanlı';
            return 'Tam Zamanlı';
          };

          const parseRetirementStatus = (val: any) => {
            if (!val) return 'Normal';
            const s = normalizeString(String(val));
            if (s.includes('emekli')) return 'Emekli';
            return 'Normal';
          };

          const resultData: ExcelRow[] = [];
          const globalErrors: string[] = [];
          const globalWarnings: string[] = [];

          const parseAmount = (val: any) => {
            if (val === undefined || val === null || val === '') return 0;
            if (typeof val === 'number') return val;
            let s = String(val).trim();
            if (s.includes('.') && s.includes(',')) {
              const lastDot = s.lastIndexOf('.');
              const lastComma = s.lastIndexOf(',');
              if (lastComma > lastDot) {
                s = s.replace(/\./g, '').replace(',', '.');
              } else {
                s = s.replace(/,/g, '');
              }
            } else if (s.includes(',')) {
              if (/, \d{2}$/.test(s)) s = s.replace(',', '.');
              else s = s.replace(',', '');
            }
            const num = parseFloat(s);
            return isNaN(num) ? 0 : num;
          };

          const parseDate = (val: any, fieldName: string, rowIndex: number) => {
            if (val === undefined || val === null || val === '') return undefined;
            
            // A) Date object
            if (val instanceof Date) {
              const offset = val.getTimezoneOffset() * 60000;
              const localDate = new Date(val.getTime() - offset);
              return localDate.toISOString().split('T')[0];
            }
            
            // B) Numeric (Excel serial date)
            if (typeof val === 'number') {
              const date = new Date(Math.round((val - 25569) * 86400 * 1000));
              return date.toISOString().split('T')[0];
            }
            
            // C) String
            const s = String(val).trim();
            if (!s) return undefined;

            const normalizeForDate = (str: string) => str.toLowerCase()
              .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
              .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');

            const parts = s.split(/[./\-\s]+/);
            
            const monthMap: {[key: string]: string} = {
              'ocak': '01', 'oca': '01', 'subat': '02', 'sub': '02', 'mart': '03', 'mar': '03',
              'nisan': '04', 'nis': '04', 'mayis': '05', 'may': '05', 'haziran': '06', 'haz': '06',
              'temmuz': '07', 'tem': '07', 'agustos': '08', 'agu': '08', 'eylul': '09', 'eyl': '09',
              'ekim': '10', 'eki': '10', 'kasim': '11', 'kas': '11', 'aralik': '12', 'ara': '12',
              'jan': '01', 'feb': '02', 'apr': '04', 'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
            };

            const normalizedParts = parts.map(p => {
               const lower = normalizeForDate(p);
               for (const [mName, mNum] of Object.entries(monthMap)) {
                 if (lower.includes(mName)) return mNum;
               }
               return p;
            });

            if (normalizedParts.length >= 3) {
               if (normalizedParts[0].length === 4) {
                 return `${normalizedParts[0]}-${normalizedParts[1].padStart(2, '0')}-${normalizedParts[2].padStart(2, '0')}`;
               }
               return `${normalizedParts[2]}-${normalizedParts[1].padStart(2, '0')}-${normalizedParts[0].padStart(2, '0')}`;
            }

            const d = new Date(s);
            if (!isNaN(d.getTime())) {
              return d.toISOString().split('T')[0];
            }

            // D) Parse failed
            globalWarnings.push(`Satır ${rowIndex}: ${fieldName} parse edilemedi ("${val}")`);
            return undefined;
          };

          const parseBool = (val: any, def = true) => {
            if (val === undefined || val === null || val === '') return def;
            const s = normalizeString(String(val));
            if (['e', 'evet', 'true', '1', 'y', 'yes', 'aktif', 'gm', 'on', 'dahil'].includes(s)) return true;
            if (['h', 'hayir', 'false', '0', 'n', 'no', 'pasif', 'off', 'dahildegil', 'haric'].includes(s)) return false;
            return def;
          };

          const parseTimeRobust = (val: any) => {
            if (val === undefined || val === null || val === '') return '00:00';
            if (typeof val === 'number' && val < 1 && val > 0) {
              const totalMinutes = Math.round(val * 24 * 60);
              const h = Math.floor(totalMinutes / 60);
              const m = totalMinutes % 60;
              return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            }
            if (typeof val === 'number' && val >= 1) {
              const h = Math.floor(val);
              const m = Math.round((val - h) * 60);
              return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            }
            let s = String(val).trim().toLowerCase();
            if (s === '0' || s === '') return '00:00';
            if (/^\d+[.,]\d+$/.test(s)) {
               const num = parseFloat(s.replace(',', '.'));
               const h = Math.floor(num);
               const m = Math.round((num - h) * 60);
               return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            }
            const timeMatch = s.match(/^(\d{1,3}):(\d{2})$/);
            if (timeMatch) {
              const h = parseInt(timeMatch[1]);
              const m = parseInt(timeMatch[2]);
              if (m < 60) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            }
            return '00:00';
          };

          const parsePhone = (val: any, rowIndex: number) => {
            if (val === undefined || val === null || val === '') return '';
            let s = String(val).trim();
            // scientific notation check
            if (s.includes('E') || s.includes('e')) {
              s = Number(val).toLocaleString('fullwide', { useGrouping: false });
            }
            s = s.replace(/\D/g, '');
            if (s.length === 10) return `0${s}`;
            if (s.length === 11 && s.startsWith('0')) return s;
            if (s.length === 12 && s.startsWith('90')) return `0${s.substring(2)}`;
            if (s.length > 0) {
              globalWarnings.push(`Satır ${rowIndex}: Telefon Numarası formatı geçersiz ("${val}")`);
            }
            return String(val).trim();
          };

          const parseEmail = (val: any, rowIndex: number) => {
            if (val === undefined || val === null || val === '') return '';
            let s = String(val).trim().toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (s && !emailRegex.test(s)) {
              globalWarnings.push(`Satır ${rowIndex}: e-Mail formatı geçersiz ("${val}")`);
            }
            return s;
          };

          const parseBloodGroup = (val: any, rowIndex: number) => {
            if (!val) return 'Bilinmiyor';
            let s = String(val).trim().toUpperCase().replace(/\s+/g, '');
            if (s === 'A+') return 'A Rh+';
            if (s === 'A-') return 'A Rh-';
            if (s === 'B+') return 'B Rh+';
            if (s === 'B-') return 'B Rh-';
            if (s === 'AB+') return 'AB Rh+';
            if (s === 'AB-') return 'AB Rh-';
            if (s === '0+' || s === 'O+') return '0 Rh+';
            if (s === '0-' || s === 'O-') return '0 Rh-';
            if (s.includes('RH')) {
              s = s.replace('RH', ' Rh');
              if (!s.includes('+') && !s.includes('-')) s += '+';
              return s;
            }
            // If it's already properly formatted like "A Rh+"
            if (['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-'].includes(String(val).trim())) {
              return String(val).trim();
            }
            
            globalWarnings.push(`Satır ${rowIndex}: Kan Grubu formatı tanınmadı ("${val}")`);
            return String(val).trim();
          };

          const parseLocationType = (val: any, rowIndex: number) => {
            if (val === undefined || val === null || val === '') return undefined;
            const s = String(val).trim().toLowerCase();
            const normalized = s.replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');
            
            if (['genel merkez', 'merkez', 'gm', 'genelmerkez'].includes(normalized)) return 'HQ';
            if (['saha', 'field', 'arazi', 'sube', 'bolge'].includes(normalized)) return 'FIELD';
            
            globalWarnings.push(`Satır ${rowIndex}: Genel Merkez Durumu tanınmadı ("${val}")`);
            return undefined;
          };

          rows.forEach((row, idx) => {
            const rowIndex = headerRowIdx + idx + 2;
            const rowErrors: string[] = [];

            let tckn = '';
            if (tcknIdx !== -1) {
              const val = row[tcknIdx];
              tckn = typeof val === 'number' ? val.toFixed(0) : String(val || '').trim();
              if (tckn && !/^\d+$/.test(tckn)) rowErrors.push(`TCKN sadece sayı olmalıdır.`);
            }

            const adSoyad = nameIdx !== -1 ? String(row[nameIdx] || '').trim() : '';
            if (!adSoyad) rowErrors.push(`AD_SOYAD boş olamaz.`);
            
            if (!tckn && !adSoyad) return;

            const rowResult: ExcelRow = {
              tckn,
              adSoyad,
              birthDate: birthDateIdx !== -1 ? parseDate(row[birthDateIdx], 'Doğum Tarihi', rowIndex) : undefined,
              gender: genderIdx !== -1 ? String(row[genderIdx] || '').trim() : 'Belirtilmemiş',
              maritalStatus: maritalIdx !== -1 ? String(row[maritalIdx] || '').trim() : 'Bekar',
              childCount: childIdx !== -1 ? parseInt(String(row[childIdx] || '0')) || 0 : 0,
              bloodGroup: bloodIdx !== -1 ? parseBloodGroup(row[bloodIdx], rowIndex) : '-',
              hireDate: hireDateIdx !== -1 ? parseDate(row[hireDateIdx], 'İşe Giriş Tarihi', rowIndex) : undefined,
              department: deptIdx !== -1 ? String(row[deptIdx] || '').trim() : undefined,
              title: titleIdx !== -1 ? String(row[titleIdx] || '').trim() : undefined,
              actualWorkLocation: locationIdx !== -1 ? String(row[locationIdx] || '').trim() : undefined,
              workLocationType: workLocTypeIdx !== -1 ? parseLocationType(row[workLocTypeIdx], rowIndex) : undefined,
              residenceAddress: addressIdx !== -1 ? String(row[addressIdx] || '').trim() : '',
              residenceCity: cityIdx !== -1 ? String(row[cityIdx] || '').trim() : '',
              residenceDistrict: districtIdx !== -1 ? String(row[districtIdx] || '').trim() : '',
              phone: phoneIdx !== -1 ? parsePhone(row[phoneIdx], rowIndex) : '',
              email: emailIdx !== -1 ? parseEmail(row[emailIdx], rowIndex) : '',
              netSalary: parseAmount(row[salaryIdx]),
              mealAllowance: parseAmount(row[mealIdx]),
              roadAllowance: parseAmount(row[roadIdx]),
              totalPaidAmount: parseAmount(row[totalPaidIdx]),
              employmentType: parseEmploymentType(employmentTypeIdx !== -1 ? row[employmentTypeIdx] : undefined),
              retirementStatus: parseRetirementStatus(retirementIdx !== -1 ? row[retirementIdx] : undefined),
              education: educationIdx !== -1 ? String(row[educationIdx] || '').trim() : undefined,
              isForeign: parseBool(row[foreignIdx], false),
              hasIncentive: incentiveIdx !== -1 ? String(row[incentiveIdx] || '').trim() : 'Hayır',
              exitDate: exitDateIdx !== -1 ? parseDate(row[exitDateIdx], 'Çıkış Tarihi', rowIndex) : undefined,
              exitCode: exitCodeIdx !== -1 ? String(row[exitCodeIdx] || '').trim() : undefined,
              isActive: true, // Default to true, will be derived
              showInPdks: showInPdksIdx !== -1 ? parseBool(row[showInPdksIdx], true) : true,
              
              missingTime: missingTimeIdx !== -1 ? parseTimeRobust(row[missingTimeIdx]) : '00:00',
              lateDays: lateDaysIdx !== -1 ? (typeof row[lateDaysIdx] === 'number' ? Math.floor(row[lateDaysIdx]) : parseInt(String(row[lateDaysIdx] || '0')) || 0) : 0,
              currentLeaveBalance: leaveBalanceIdx !== -1 ? parseTimeRobust(row[leaveBalanceIdx]) : '00:00',
              
              rowIndex,
              error: rowErrors.join(' | ')
            };

            rowResult.isActive = !rowResult.exitDate;

            resultData.push(rowResult);
            if (rowResult.error) globalErrors.push(`Satır ${rowIndex}: ${rowResult.error}`);
          });

          resolve({ data: resultData, errors: globalErrors, warnings: globalWarnings });
        } catch (err) {
          console.error('Excel parsing error:', err);
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  },

  parsePdksExcel: async (file: File): Promise<{ data: ExcelRow[], errors: string[], warnings: string[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];

          if (jsonData.length === 0) {
            resolve({ data: [], errors: ['Dosya boş.'], warnings: [] });
            return;
          }

          // Fixed indices for PDKS as per user request (A=0, B=1, ...)
          // A: TCKN, B: AD_SOYAD, C: EKSIK_SURE, D: GEC_GUN, E: MEVCUT_DENKLESTIRME_IZNI
          const tcknIdx = 0;
          const nameIdx = 1;
          const missingTimeIdx = 2;
          const lateDaysIdx = 3;
          const leaveBalanceIdx = 4;

          const parseTimeRobust = (val: any) => {
            if (val === undefined || val === null || val === '') return '00:00';
            if (typeof val === 'number' && val < 1 && val > 0) {
              const totalMinutes = Math.round(val * 24 * 60);
              const h = Math.floor(totalMinutes / 60);
              const m = totalMinutes % 60;
              return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            }
            if (typeof val === 'number' && val >= 1) {
              const h = Math.floor(val);
              const m = Math.round((val - h) * 60);
              return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            }
            let s = String(val).trim().toLowerCase();
            if (s === '0' || s === '') return '00:00';
            if (/^\d+[.,]\d+$/.test(s)) {
               const num = parseFloat(s.replace(',', '.'));
               const h = Math.floor(num);
               const m = Math.round((num - h) * 60);
               return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            }
            const timeMatch = s.match(/^(\d{1,3}):(\d{2})$/);
            if (timeMatch) {
              const h = parseInt(timeMatch[1]);
              const m = parseInt(timeMatch[2]);
              if (m < 60) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            }
            return '00:00';
          };

          const resultData: ExcelRow[] = [];
          const globalErrors: string[] = [];
          const globalWarnings: string[] = [];

          const rows = jsonData.slice(1); // Skip header row

          rows.forEach((row, idx) => {
            const rowIndex = idx + 2;
            const rowErrors: string[] = [];

            let tckn = '';
            const tcknVal = row[tcknIdx];
            tckn = typeof tcknVal === 'number' ? tcknVal.toFixed(0) : String(tcknVal || '').trim();
            if (tckn && !/^\d+$/.test(tckn)) rowErrors.push(`TCKN sadece sayı olmalıdır.`);

            const adSoyad = String(row[nameIdx] || '').trim();
            if (!adSoyad) rowErrors.push(`AD_SOYAD boş olamaz.`);
            
            if (!tckn && !adSoyad) return;

            const rowResult: ExcelRow = {
              tckn,
              adSoyad,
              netSalary: 0, // Will be taken from Personnel Management
              missingTime: parseTimeRobust(row[missingTimeIdx]),
              lateDays: typeof row[lateDaysIdx] === 'number' ? Math.floor(row[lateDaysIdx]) : parseInt(String(row[lateDaysIdx] || '0')) || 0,
              currentLeaveBalance: parseTimeRobust(row[leaveBalanceIdx]),
              rowIndex,
              error: rowErrors.join(' | ')
            };

            resultData.push(rowResult);
            if (rowResult.error) globalErrors.push(`Satır ${rowIndex}: ${rowResult.error}`);
          });

          resolve({ data: resultData, errors: globalErrors, warnings: globalWarnings });
        } catch (err) {
          console.error('PDKS Excel parsing error:', err);
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  },

  downloadPdksTemplate: () => {
    const headers = ['TCKN', 'AD_SOYAD', 'EKSIK_SURE', 'GEC_GUN', 'MEVCUT_DENKLESTIRME_IZNI'];
    const data = [
      headers,
      ['12345678901', 'Ahmet Yılmaz', '02:30', '1', '05:00'],
      ['98765432109', 'Ayşe Demir', '00:00', '0', '02:15']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PDKS_Taslak');
    
    worksheet['!cols'] = headers.map(() => ({ wch: 25 }));

    XLSX.writeFile(workbook, 'ik360_PDKS_Rapor_Taslak.xlsx');
  },

  downloadTemplate: () => {
    const headers = [
      'Ad Soyad', 'TCKN', 'İşe Giriş Tarihi', 'Doğum Tarihi', 'Medeni Hali', 'Çocuk Sayısı', 
      'Telefon Numarası', 'e-Mail', 'Kan Grubu', 'Departman', 'Ünvan', 'Fiili Görev Yeri', 
      'İkamet Adresi', 'İkamet İli', 'İkamet İlçesi', 'Net Maaş', 'Yemek Ödeneği', 'Yol Ödeneği', 
      'Toplam Hesaba Yatan', 'Kısmi/Tam Zamanlı', 'Emekli Durumu', 'Cinsiyet', 'Mezuniyet', 
      'PDKS’de Görünsün mü?', 'Çıkış Tarihi', 'Çıkış Kodu', 'Yabancı Uyruklu mu?'
    ];
    const data = [
      headers,
      ['Ahmet Yılmaz', '12345678901', '01.01.2024', '01.01.1990', 'Evli', '2', '05551234567', 'ahmet@example.com', 'A Rh+', 'Yazılım', 'Uzman', 'Merkez', 'İstanbul Cad. No:1', 'İstanbul', 'Fatih', '45000', '3000', '2000', '50000', 'Tam Zamanlı', 'Normal', 'Erkek', 'Lisans', 'Genel Merkez', 'Evet', '', '', 'Hayır'],
      ['Ayşe Demir', '98765432109', '15.02.2024', '15.05.1985', 'Bekar', '0', '05321234567', 'ayse@example.com', '0 Rh-', 'İK', 'Müdür', 'Saha - İstanbul', 'Ankara Cad. No:2', 'İstanbul', 'Beşiktaş', '55000', '3000', '2500', '60500', 'Tam Zamanlı', 'Normal', 'Kadın', 'Yüksek Lisans', 'Saha', 'Evet', '', '', 'Hayır']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Personel_Taslak');
    
    worksheet['!cols'] = headers.map(() => ({ wch: 20 }));

    XLSX.writeFile(workbook, 'ik360_Personel_Yonetimi_Taslak.xlsx');
  },

  exportToExcel: (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Personel_Listesi');
    
    // Auto-size columns
    const max_width = data.reduce((w, r) => Math.max(w, Object.keys(r).length), 10);
    worksheet['!cols'] = Array(max_width).fill({ wch: 20 });

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }
};
