import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  Lock as LockIcon,
  Search,
  Filter
} from 'lucide-react';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import { searchMatch } from '../services/personnelUtils';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PASSIVE'>('ALL');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'USER' as UserRole,
    isActive: true,
    permittedModules: [] as string[]
  });
  const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null);

  const availableModules = [
    { id: 'personnel', label: 'Personel Yönetimi' },
    { id: 'pdks', label: 'PDKS / Bordro' },
    { id: 'tasks', label: 'İş Takibi' },
    { id: 'notes', label: 'Notlar' },
    { id: 'leave', label: 'İzin Takibi' },
    { id: 'admin', label: 'Sistem Yönetimi' }
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Kullanıcılar yüklenirken hata oluştu.' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!user || !user.username) return false;
    const matchesSearch = user.username.toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || 
                         (statusFilter === 'ACTIVE' && user.isActive) || 
                         (statusFilter === 'PASSIVE' && !user.isActive);
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    console.log("Users state updated:", users);
    console.log("Filtered users:", filteredUsers);
  }, [users, filteredUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[ik360-UI] Creating user with data:", formData);
    try {
      await api.createUser(formData);
      console.log("[ik360-UI] User created successfully.");
      setMessage({ type: 'success', text: 'Kullanıcı başarıyla oluşturuldu.' });
      setShowAddModal(false);
      setFormData({ username: '', password: '', role: 'USER', isActive: true, permittedModules: [] });
      loadUsers();
    } catch (error: any) {
      console.error("[ik360-UI] User creation failed:", error);
      setMessage({ type: 'error', text: error.message || 'Kullanıcı oluşturulamadı.' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await api.updateUser(selectedUser.id, formData);
      setMessage({ type: 'success', text: 'Kullanıcı başarıyla güncellendi.' });
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData({ username: '', password: '', role: 'USER', isActive: true, permittedModules: [] });
      loadUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Kullanıcı güncellenemedi.' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.deleteUser(id);
      setMessage({ type: 'success', text: 'Kullanıcı başarıyla silindi.' });
      setDeleteConfirmId(null);
      loadUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Kullanıcı silinemedi.' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
      isActive: user.isActive,
      permittedModules: user.permittedModules || []
    });
    setShowEditModal(true);
  };

  const toggleModule = (moduleId: string) => {
    setFormData(prev => {
      const current = prev.permittedModules || [];
      if (current.includes(moduleId)) {
        return { ...prev, permittedModules: current.filter(id => id !== moduleId) };
      } else {
        return { ...prev, permittedModules: [...current, moduleId] };
      }
    });
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-700 uppercase tracking-widest">
            <ShieldAlert className="w-3 h-3" /> YÖNETİCİ
          </span>
        );
      case 'USER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" /> STANDART
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="space-y-8 animate-in fade-in duration-500 relative">
      {message && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-bold shadow-xl ${message.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
          {message.text}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Kullanıcı Yönetimi</h2>
          <p className="text-slate-500 font-medium text-lg mt-1">Sistem kullanıcıları ve yetkilendirme ayarları</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl flex items-center gap-2 shadow-xl shadow-brand-900/20 transition-all active:scale-95 uppercase text-sm tracking-widest"
        >
          <UserPlus className="w-5 h-5" /> Yeni Kullanıcı Ekle
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Kullanıcı adı ile ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-brand-500 outline-none transition-all font-bold text-slate-900"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-6 py-3.5 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest outline-none cursor-pointer border-none"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="ACTIVE">Sadece Aktifler</option>
            <option value="PASSIVE">Sadece Pasifler</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 animate-pulse flex items-center gap-6">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl"></div>
              <div className="flex-1">
                <div className="h-6 bg-slate-100 rounded-full w-1/4 mb-2"></div>
                <div className="h-4 bg-slate-100 rounded-full w-1/6"></div>
              </div>
            </div>
          ))
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white p-12 rounded-[3rem] border border-slate-200 text-center">
            <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">Kullanıcı bulunamadı.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kullanıcı</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Durum</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kayıt Tarihi</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shadow-inner ${
                          user.role === 'ADMIN' ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'
                        }`}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-lg font-black text-slate-800 tracking-tight">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-8 py-5">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl font-black uppercase text-[10px] tracking-widest">
                          <Check className="w-3 h-3" /> AKTİF
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-400 rounded-xl font-black uppercase text-[10px] tracking-widest">
                          <X className="w-3 h-3" /> PASİF
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-slate-500 font-bold text-sm">
                        {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-brand-50 hover:text-brand-600 transition-all"
                          title="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(user.id)}
                          className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Authorization Settings Section */}
      <div className="mt-12 bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Shield className="w-64 h-64" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-white/10 rounded-3xl">
              <LockIcon className="w-8 h-8 text-brand-400" />
            </div>
            <div>
              <h3 className="text-3xl font-black tracking-tight uppercase">Yetkilendirme Ayarları</h3>
              <p className="text-slate-400 font-medium text-lg">Modül bazlı erişim kısıtlamaları ve rol tanımları</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
              <h4 className="text-xl font-black mb-6 flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-red-400" />
                Yönetici (ADMIN) Yetkileri
              </h4>
              <div className="space-y-4">
                {[
                  'Tüm modüllere ve verilere tam erişim',
                  'Kullanıcı oluşturma, silme ve yetkilendirme',
                  'Sistem genel ayarlarını değiştirme',
                  'Veri yedekleme ve geri yükleme',
                  'Çöp kutusu üzerinden veri kurtarma'
                ].map(perm => (
                  <div key={perm} className="flex items-center gap-3 text-slate-300 font-medium">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                    {perm}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
              <h4 className="text-xl font-black mb-6 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
                Standart (USER) Yetkileri
              </h4>
              <div className="space-y-4">
                {[
                  'Yetki verilen modüllere erişim (Örn: İş Takibi)',
                  'Sadece atanmış görevler ve bildirimler',
                  'Kendi şifresini değiştirme',
                  'Sistem giriş ve çıkış loglarını izleme'
                ].map(perm => (
                  <div key={perm} className="flex items-center gap-3 text-slate-300 font-medium">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    {perm}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 flex justify-end">
            <button className="px-10 py-4 bg-white text-slate-900 font-black rounded-2xl shadow-xl hover:bg-slate-100 transition-all active:scale-95 uppercase text-sm tracking-widest">
              Rol Tanımlarını Güncelle
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-10 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                  {showAddModal ? 'Yeni Kullanıcı' : 'Kullanıcı Düzenle'}
                </h3>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Sistem Erişim Bilgileri</p>
              </div>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedUser(null);
                  setFormData({ username: '', password: '', role: 'USER', isActive: true });
                }}
                className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-600 transition-all shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleCreateUser : handleUpdateUser} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kullanıcı Adı</label>
                <input 
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-brand-500 outline-none transition-all font-bold text-slate-900"
                  placeholder="Kullanıcı adı giriniz..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {showAddModal ? 'Şifre' : 'Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)'}
                </label>
                <div className="relative">
                  <LockIcon className="w-5 h-5 absolute left-5 top-4 text-slate-400" />
                  <input 
                    type="password"
                    required={showAddModal}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-brand-500 outline-none transition-all font-bold text-slate-900"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kullanıcı Rolü</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-brand-500 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer"
                >
                  <option value="USER">Standart Kullanıcı</option>
                  <option value="ADMIN">Yönetici</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Erişilebilir Modüller</label>
                <div className="grid grid-cols-1 gap-2 bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 max-h-48 overflow-y-auto">
                  {availableModules.map(mod => (
                    <label key={mod.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-xl transition-all cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={formData.role === 'ADMIN' || (formData.permittedModules || []).includes(mod.id)}
                        disabled={formData.role === 'ADMIN'}
                        onChange={() => toggleModule(mod.id)}
                        className="w-5 h-5 rounded-lg border-2 border-slate-200 text-brand-600 focus:ring-brand-500 disabled:opacity-50"
                      />
                      <span className={`text-sm font-bold ${formData.role === 'ADMIN' ? 'text-slate-400' : 'text-slate-700'}`}>
                        {mod.label}
                      </span>
                    </label>
                  ))}
                  {formData.role === 'ADMIN' && (
                    <p className="text-[10px] text-brand-600 font-bold italic px-2">Yöneticiler tüm modüllere tam erişime sahiptir.</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
                <input 
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="w-5 h-5 rounded-lg border-2 border-slate-200 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-slate-700 cursor-pointer">Kullanıcı Aktif</label>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl shadow-xl shadow-brand-900/20 transition-all active:scale-95 uppercase text-sm tracking-widest"
                >
                  {showAddModal ? 'Kullanıcıyı Oluştur' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 pt-20 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase mb-2">Kullanıcıyı Sil?</h3>
            <p className="text-slate-500 font-medium mb-8">Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest"
              >
                Vazgeç
              </button>
              <button 
                onClick={() => handleDeleteUser(deleteConfirmId)}
                className="py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 shadow-xl shadow-red-900/20 transition-all active:scale-95 uppercase text-xs tracking-widest"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
