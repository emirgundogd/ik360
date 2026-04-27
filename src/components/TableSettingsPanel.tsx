import React from 'react';
import { X, Eye, EyeOff, GripVertical, RotateCcw } from 'lucide-react';
import { ColumnDef } from '../hooks/useTableManager';

interface TableSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnDef[];
  onToggle: (id: string) => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
  onReset: () => void;
}

export const TableSettingsPanel: React.FC<TableSettingsPanelProps> = ({
  isOpen, onClose, columns, onToggle, onReset
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex justify-end">
      <div className="w-80 bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Görünüm Ayarları</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sütun Görünürlüğü</p>
          <div className="space-y-2">
            {columns.map((col) => (
              <div 
                key={col.id} 
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  col.visible ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-transparent opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-slate-300 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{col.label}</span>
                </div>
                <button 
                  onClick={() => onToggle(col.id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    col.visible ? 'text-brand-600 hover:bg-brand-50' : 'text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {col.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <button 
            onClick={onReset}
            className="w-full py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 text-xs"
          >
            <RotateCcw className="w-4 h-4" /> Varsayılanlara Dön
          </button>
        </div>
      </div>
    </div>
  );
};
