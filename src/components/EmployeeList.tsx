import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import { Search, CheckCircle2, XCircle, Trash2, Plus, Edit2, X, Save } from 'lucide-react';
import { searchMatch } from '../services/personnelUtils';

interface Props {
  employees: Employee[];
  departments: string[];
  titles: string[];
  onAddEmployee: (emp: Employee) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
}

export const EmployeeList: React.FC<Props> = ({ 
  employees, 
  departments, 
  titles, 
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedTitle, setSelectedTitle] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    tcNo: '',
    email: '',
    phone: '',
    department: '',
    title: '',
    netSalary: 0,
    isActive: true,
    initialLeavePoolMinutes: 0,
    initialSalaryPoolMinutes: 0,
    initialLeaveBalanceMinutes: 0
  });

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const empName = emp.name || '';
      const empTcNo = emp.tcNo || '';
      const empEmail = emp.email || '';
      
      const matchesSearch = searchMatch(empName, searchTerm) || 
                            empTcNo.includes(searchTerm) ||
                            searchMatch(empEmail, searchTerm);
      
      const matchesDept = selectedDept === 'all' || emp.department === selectedDept;
      const matchesTitle = selectedTitle === 'all' || emp.title === selectedTitle;
      const matchesStatus = selectedStatus === 'all' || 
                            (selectedStatus === 'active' ? emp.isActive : !emp.isActive);

      return matchesSearch && matchesDept && matchesTitle && matchesStatus;
    });
  }, [employees, searchTerm, selectedDept, selectedTitle, selectedStatus]);

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      tcNo: '',
      email: '',
      phone: '',
      department: departments[0] || 'Genel',
      title: titles[0] || 'Personel',
      netSalary: 0,
      isActive: true,
      initialLeavePoolMinutes: 0,
      initialSalaryPoolMinutes: 0,
      initialLeaveBalanceMinutes: 0
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({ ...emp });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.tcNo) {
      setMessage({ type: 'error', text: 'Lütfen Ad Soyad ve TCKN alanlarını doldurun.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (editingEmployee) {
      onUpdateEmployee({ ...editingEmployee, ...formData } as Employee);
    } else {
      const newEmployee: Employee = {
        ...(formData as Employee),
        id: Math.random().toString(36).substr(2, 9),
        isDeleted: false
      };
      onAddEmployee(newEmployee);
    }
    handleCloseModal();
  };

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Personel Yönetimi</h2>
          <button 
            onClick={handleOpenAddModal}
            className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl flex items-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> Yeni Personel Ekle
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Personel ara (Ad, TCKN, E-posta)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium text-slate-900"
            />
          </div>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <select 
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none bg-white text-slate-700"
            >
              <option value="all">Tüm Departmanlar</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select 
              value={selectedTitle}
              onChange={(e) => setSelectedTitle(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none bg-white text-slate-700"
            >
              <option value="all">Tüm Ünvanlar</option>
              {titles.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none bg-white text-slate-700"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="passive">Pasif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Personel Bilgileri</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Departman / Ünvan</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">İletişim</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Durum</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp, index) => (
                <tr key={`${emp.id}-${index}`} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-black text-lg shadow-sm">
                        {(emp.name || '?').charAt(0)}
                      </div>
                      <div>
                        <div className="font-black text-slate-800 uppercase tracking-tight">{emp.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold font-mono tracking-tighter">{emp.tcNo}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-black text-slate-700 uppercase tracking-tight">{emp.department}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{emp.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-slate-600">{emp.email || '-'}</div>
                    <div className="text-[10px] text-slate-400 font-bold">{emp.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {emp.isActive ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 uppercase tracking-wider">
                        <XCircle className="w-3 h-3" /> Pasif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleOpenEditModal(emp)}
                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
                        title="Düzenle"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDeleteEmployee(emp.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-12 h-12 text-slate-200" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aranan kriterlere uygun personel bulunamadı.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-start p-4 pt-10">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200 max-h-[90vh] relative">
            {message && (
              <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-bold shadow-xl ${message.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                {message.text}
              </div>
            )}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800">
                {editingEmployee ? 'Personel Düzenle' : 'Yeni Personel Ekle'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <form id="employeeForm" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Temel Bilgiler</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Ad Soyad *</label>
                        <input 
                          type="text" 
                          required
                          value={formData.name || ''} 
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">TC Kimlik No *</label>
                        <input 
                          type="text" 
                          required
                          maxLength={11}
                          value={formData.tcNo || ''} 
                          onChange={e => setFormData({...formData, tcNo: e.target.value})}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">İletişim</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">E-posta</label>
                        <input 
                          type="email" 
                          value={formData.email || ''} 
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Telefon</label>
                        <input 
                          type="tel" 
                          value={formData.phone || ''} 
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Job Info */}
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">İş Bilgileri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Departman</label>
                        <select 
                          value={formData.department || ''} 
                          onChange={e => setFormData({...formData, department: e.target.value})}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium bg-white"
                        >
                          <option value="">Seçiniz...</option>
                          {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Ünvan</label>
                        <select 
                          value={formData.title || ''} 
                          onChange={e => setFormData({...formData, title: e.target.value})}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium bg-white"
                        >
                          <option value="">Seçiniz...</option>
                          {titles.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Net Maaş (₺)</label>
                        <input 
                          type="number" 
                          value={formData.netSalary || 0} 
                          onChange={e => setFormData({...formData, netSalary: parseFloat(e.target.value) || 0})}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                        />
                      </div>
                      <div className="flex items-center mt-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={formData.isActive ?? true} 
                            onChange={e => setFormData({...formData, isActive: e.target.checked})}
                            className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          />
                          <span className="text-sm font-bold text-slate-700">Aktif Personel</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* PDKS Info */}
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">PDKS Başlangıç Değerleri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Başlangıç İzin Havuzu (Dk)</label>
                        <input 
                          type="number" 
                          value={formData.initialLeavePoolMinutes || 0} 
                          onChange={e => setFormData({...formData, initialLeavePoolMinutes: parseInt(e.target.value) || 0})}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Başlangıç Maaş Kesinti Havuzu (Dk)</label>
                        <input 
                          type="number" 
                          value={formData.initialSalaryPoolMinutes || 0} 
                          onChange={e => setFormData({...formData, initialSalaryPoolMinutes: parseInt(e.target.value) || 0})}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Mevcut İzin Bakiyesi (Dk)</label>
                        <input 
                          type="number" 
                          value={formData.initialLeaveBalanceMinutes || 0} 
                          onChange={e => setFormData({...formData, initialLeaveBalanceMinutes: parseInt(e.target.value) || 0})}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
              <button 
                type="button"
                onClick={handleCloseModal} 
                className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all"
              >
                İptal
              </button>
              <button 
                type="submit"
                form="employeeForm"
                className="px-6 py-3 bg-brand-600 text-white font-black hover:bg-brand-700 rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95"
              >
                <Save className="w-5 h-5" /> {editingEmployee ? 'Değişiklikleri Kaydet' : 'Personeli Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
