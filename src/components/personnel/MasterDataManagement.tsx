import React, { useState, useRef } from 'react';
import { 
  Building2, 
  Briefcase, 
  MapPin, 
  Plus, 
  Trash2, 
  LayoutGrid,
  Users,
  ShieldCheck,
  Globe,
  Map,
  Upload,
  FileDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { LocationRecord } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  departments: string[];
  titles: string[];
  locations: LocationRecord[];
  cities: string[];
  districts: Record<string, string[]>;
  onUpdateDepartments: (depts: string[]) => void;
  onUpdateTitles: (titles: string[]) => void;
  onUpdateLocations: (locs: LocationRecord[]) => void;
  onUpdateCities: (cities: string[]) => void;
  onUpdateDistricts: (districts: Record<string, string[]>) => void;
}

type Mode = 'departments' | 'titles' | 'locations' | 'cities' | 'districts';

export const MasterDataManagement: React.FC<Props> = ({ 
  departments, titles, locations,
  cities, districts,
  onUpdateDepartments, onUpdateTitles, onUpdateLocations,
  onUpdateCities, onUpdateDistricts
}) => {
  const [mode, setMode] = useState<Mode>('departments');
  const [selectedCity, setSelectedCity] = useState<string>(cities[0] || '');
  const [newItem, setNewItem] = useState('');
  const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (mode === 'cities') {
          const newItems = data.map(row => row['İl'] || row['City'] || row['il']).filter(Boolean).map(String);
          const unique = Array.from(new Set([...cities, ...newItems]));
          onUpdateCities(unique);
          setMessage({ type: 'success', text: `${newItems.length} yeni şehir eklendi.` });
        } else if (mode === 'districts') {
          if (!selectedCity) {
            setMessage({ type: 'error', text: 'Lütfen önce bir şehir seçin.' });
            return;
          }
          const newItems = data.map(row => row['İlçe'] || row['District'] || row['ilce']).filter(Boolean).map(String);
          const currentDistricts = districts[selectedCity] || [];
          const unique = Array.from(new Set([...currentDistricts, ...newItems]));
          onUpdateDistricts({ ...districts, [selectedCity]: unique });
          setMessage({ type: 'success', text: `${newItems.length} yeni ilçe eklendi.` });
        } else if (mode === 'departments') {
          const newItems = data.map(row => row['Departman'] || row['Department']).filter(Boolean).map(String);
          const unique = Array.from(new Set([...departments, ...newItems]));
          onUpdateDepartments(unique);
          setMessage({ type: 'success', text: `${newItems.length} yeni departman eklendi.` });
        } else if (mode === 'titles') {
          const newItems = data.map(row => row['Ünvan'] || row['Title']).filter(Boolean).map(String);
          const unique = Array.from(new Set([...titles, ...newItems]));
          onUpdateTitles(unique);
          setMessage({ type: 'success', text: `${newItems.length} yeni ünvan eklendi.` });
        } else if (mode === 'locations') {
          const newItems = data.map(row => row['Lokasyon'] || row['Location']).filter(Boolean).map(String);
          const currentNames = locations.map(l => l.name);
          const filteredNew = newItems.filter(name => !currentNames.includes(name));
          const newLocs = filteredNew.map(name => ({ id: Date.now().toString() + Math.random(), name, isActive: true }));
          onUpdateLocations([...locations, ...newLocs]);
          setMessage({ type: 'success', text: `${filteredNew.length} yeni lokasyon eklendi.` });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Excel dosyası işlenirken bir hata oluştu.' });
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setMessage(null), 3000);
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    let data = [];
    let filename = '';
    switch (mode) {
      case 'cities':
        data = [{ 'İl': 'İstanbul' }, { 'İl': 'Ankara' }];
        filename = 'sehir_yukleme_taslagi.xlsx';
        break;
      case 'districts':
        data = [{ 'İlçe': 'Beşiktaş' }, { 'İlçe': 'Kadıköy' }];
        filename = `ilce_yukleme_taslagi_${selectedCity || 'secili_sehir'}.xlsx`;
        break;
      case 'departments':
        data = [{ 'Departman': 'Yazılım' }, { 'Departman': 'Pazarlama' }];
        filename = 'departman_yukleme_taslagi.xlsx';
        break;
      case 'titles':
        data = [{ 'Ünvan': 'Kıdemli Yazılım Geliştirici' }, { 'Ünvan': 'Pazarlama Uzmanı' }];
        filename = 'unvan_yukleme_taslagi.xlsx';
        break;
      case 'locations':
        data = [{ 'Lokasyon': 'Merkez Ofis' }, { 'Lokasyon': 'Saha Ofisi' }];
        filename = 'lokasyon_yukleme_taslagi.xlsx';
        break;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Taslak");
    XLSX.writeFile(wb, filename);
  };

  const handleAdd = () => {
    if (!newItem.trim()) return;
    
    let updateFn: any;
    let currentList: any;

    switch (mode) {
      case 'departments': currentList = departments; updateFn = onUpdateDepartments; break;
      case 'titles': currentList = titles; updateFn = onUpdateTitles; break;
      case 'cities': currentList = cities; updateFn = onUpdateCities; break;
      case 'locations': 
        if (locations.some(l => l.name === newItem)) {
          setMessage({ type: 'error', text: 'Bu lokasyon zaten mevcut.' });
          setTimeout(() => setMessage(null), 3000);
          return;
        }
        onUpdateLocations([...locations, { id: Date.now().toString(), name: newItem, isActive: true }]);
        setNewItem('');
        setMessage({ type: 'success', text: 'Kayıt eklendi.' });
        setTimeout(() => setMessage(null), 3000);
        return;
      case 'districts':
        if (!selectedCity) {
          setMessage({ type: 'error', text: 'Önce bir şehir seçmelisiniz.' });
          setTimeout(() => setMessage(null), 3000);
          return;
        }
        const cityDistricts = districts[selectedCity] || [];
        if (cityDistricts.includes(newItem)) {
          setMessage({ type: 'error', text: 'Bu ilçe zaten mevcut.' });
          setTimeout(() => setMessage(null), 3000);
          return;
        }
        onUpdateDistricts({ ...districts, [selectedCity]: [...cityDistricts, newItem] });
        setNewItem('');
        setMessage({ type: 'success', text: 'Kayıt eklendi.' });
        setTimeout(() => setMessage(null), 3000);
        return;
      default: return;
    }

    if (currentList.includes(newItem)) {
      setMessage({ type: 'error', text: 'Bu kayıt zaten mevcut.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    updateFn([...currentList, newItem]);
    setNewItem('');
    setMessage({ type: 'success', text: 'Kayıt eklendi.' });
    setTimeout(() => setMessage(null), 3000);
  };

  const executeDelete = (item: any) => {
    switch (mode) {
      case 'departments': onUpdateDepartments(departments.filter(d => d !== item)); break;
      case 'titles': onUpdateTitles(titles.filter(t => t !== item)); break;
      case 'cities': onUpdateCities(cities.filter(c => c !== item)); break;
      case 'locations': onUpdateLocations(locations.filter(l => l.id !== item.id)); break;
      case 'districts':
        if (selectedCity) {
          onUpdateDistricts({ ...districts, [selectedCity]: districts[selectedCity].filter(d => d !== item) });
        }
        break;
    }
    setDeleteConfirm(null);
    setMessage({ type: 'success', text: 'Kayıt silindi.' });
    setTimeout(() => setMessage(null), 3000);
  };

  const menuItems: { id: Mode; label: string; icon: any; color: string }[] = [
    { id: 'departments', label: 'Departmanlar', icon: Building2, color: 'bg-blue-500' },
    { id: 'titles', label: 'Ünvanlar', icon: Briefcase, color: 'bg-indigo-500' },
    { id: 'locations', label: 'Lokasyonlar', icon: MapPin, color: 'bg-emerald-500' },
    { id: 'cities', label: 'İkamet İlleri', icon: Globe, color: 'bg-amber-500' },
    { id: 'districts', label: 'İkamet İlçeleri', icon: Map, color: 'bg-rose-500' },
  ];

  const getCurrentList = () => {
    let list = [];
    switch (mode) {
      case 'departments': list = [...departments].sort(); break;
      case 'titles': list = [...titles].sort(); break;
      case 'locations': list = [...locations].sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'cities': list = [...cities].sort(); break;
      case 'districts': list = selectedCity ? (districts[selectedCity] || []).sort() : []; break;
      default: list = [];
    }

    if (searchTerm) {
      return list.filter(item => {
        const name = typeof item === 'string' ? item : item.name;
        return name.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    return list;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2 text-center uppercase tracking-tight">Kaydı Sil</h3>
              <p className="text-slate-500 text-sm mb-8 text-center font-medium leading-relaxed">
                Bu kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve bağlı verileri etkileyebilir.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-4 text-slate-500 hover:bg-slate-100 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                >
                  İptal
                </button>
                <button 
                  onClick={() => executeDelete(deleteConfirm)}
                  className="flex-1 py-4 bg-red-500 text-white hover:bg-red-600 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-red-200"
                >
                  Evet, Sil
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar Menu */}
      <div className="lg:w-80 shrink-0 space-y-3">
        <div className="bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-2">
          <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kategoriler</p>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setMode(item.id);
                setSearchTerm('');
              }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                mode === item.id 
                  ? 'bg-brand-600 text-white shadow-xl shadow-brand-900/20' 
                  : 'bg-transparent text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${
                mode === item.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
              }`}>
                <item.icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-tight">{item.label}</span>
              {mode === item.id && (
                <motion.div 
                  layoutId="active-indicator"
                  className="ml-auto w-1.5 h-1.5 bg-white rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Info Card - Moved to Sidebar for better layout */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-900/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-brand-500/20 rounded-xl text-brand-400">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-tight">Master Veri</h4>
          </div>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            Burada tanımladığınız veriler personel kayıtlarında, Excel içe aktarma sihirbazında ve raporlarda seçenek olarak sunulacaktır. 
          </p>
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 text-[10px] font-black text-brand-400 uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3" />
              Sistem Güvenli
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div 
            key={mode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm relative overflow-hidden"
          >
            {/* Decorative Background Element */}
            <div className={`absolute top-0 right-0 w-64 h-64 opacity-[0.03] -mr-20 -mt-20 rounded-full ${menuItems.find(m => m.id === mode)?.color}`} />

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">
                    {menuItems.find(m => m.id === mode)?.label}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Veri Yönetimi ve Tanımlamalar</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={downloadTemplate}
                    className="p-3 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-xl transition-all border border-slate-100"
                    title="Taslak İndir"
                  >
                    <FileDown className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 font-black rounded-xl hover:bg-emerald-100 transition-all uppercase text-[10px] tracking-widest border border-emerald-100"
                  >
                    <Upload className="w-4 h-4" />
                    Excel
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleExcelUpload}
                    accept=".xlsx, .xls"
                    className="hidden"
                  />
                </div>
              </div>

              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl text-[11px] font-black uppercase tracking-widest mb-8 ${
                    message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                  }`}
                >
                  {message.text}
                </motion.div>
              )}

              {/* District Specific: City Selection */}
              {mode === 'districts' && (
                <div className="mb-10 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">İşlem Yapılacak Şehri Seçin</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select 
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Şehir Seçin...</option>
                      {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Add New & Search */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Yeni Kayıt Ekle</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="İsim yazın..."
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                      />
                    </div>
                    <button 
                      onClick={handleAdd}
                      className="px-8 py-4 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 transition-all uppercase text-[10px] tracking-widest shadow-lg shadow-brand-900/20"
                    >
                      Ekle
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Listede Ara</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Filtrele..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-slate-200 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-4 mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kayıtlı Veriler ({getCurrentList().length})</span>
                  <div className="h-px flex-1 bg-slate-100 mx-6" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar p-1">
                  <AnimatePresence mode="popLayout">
                    {getCurrentList().map((item, idx) => {
                      const name = typeof item === 'string' ? item : item.name;
                      const id = typeof item === 'string' ? `${mode}-${item}` : item.id;
                      
                      return (
                        <motion.div 
                          key={id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                              {idx + 1}
                            </div>
                            <span className="text-xs font-bold text-slate-700 truncate">{name}</span>
                          </div>
                          <button 
                            onClick={() => setDeleteConfirm(item)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  
                  {getCurrentList().length === 0 && (
                    <div className="col-span-full py-24 text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200">
                        <LayoutGrid className="w-10 h-10" />
                      </div>
                      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                        {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz kayıt bulunmuyor'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
