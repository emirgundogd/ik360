import React, { useState, useRef, useEffect } from 'react';
import { Settings, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WidgetFilterProps {
  allDepartments: { name: string, count: number }[];
  selectedDepartments: string[];
  onChange: (depts: string[]) => void;
}

export const WidgetFilter: React.FC<WidgetFilterProps> = ({ allDepartments, selectedDepartments, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDepartment = (dept: string) => {
    if (selectedDepartments.includes(dept)) {
      onChange(selectedDepartments.filter(d => d !== dept));
    } else {
      onChange([...selectedDepartments, dept]);
    }
  };

  const selectAll = () => onChange(allDepartments.map(d => d.name));
  const clearAll = () => onChange([]);

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        title="Rapor Ayarları"
      >
        <Settings className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Departman Filtreleri</h4>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            </div>
            
            <div className="max-h-60 overflow-y-auto p-2 space-y-1">
              {allDepartments.map(dept => (
                <div 
                  key={dept.name}
                  onClick={() => toggleDepartment(dept.name)}
                  className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedDepartments.includes(dept.name) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                    {selectedDepartments.includes(dept.name) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">{dept.name}</span>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{dept.count}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex gap-2">
              <button 
                onClick={selectAll}
                className="flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                Hepsini Seç
              </button>
              <button 
                onClick={clearAll}
                className="flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Tümü Kaldır
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const useWidgetFilter = (widgetId: string, allDepartments: string[], scope: string = 'default') => {
  const storageKey = `widget_filter_${widgetId}_${scope}`;

  const [selectedDepartments, _setSelectedDepartments] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error parsing widget filter settings', e);
    }
    return allDepartments;
  });

  // Sync state when scope changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        _setSelectedDepartments(JSON.parse(saved));
      } else {
        _setSelectedDepartments(allDepartments);
      }
    } catch (e) {
      console.error('Error parsing widget filter settings', e);
      _setSelectedDepartments(allDepartments);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]); // Intentionally omitting allDepartments to avoid resets on data refresh

  const setSelectedDepartments = (depts: string[]) => {
    _setSelectedDepartments(depts);
    try {
      localStorage.setItem(storageKey, JSON.stringify(depts));
    } catch (e) {
      console.error('Error saving widget filter settings', e);
    }
  };

  return { selectedDepartments, setSelectedDepartments };
};
