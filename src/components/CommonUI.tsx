
import React from 'react';
import { Loader2, Inbox, AlertCircle } from 'lucide-react';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-4 animate-pulse">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="h-16 bg-slate-100 rounded-2xl w-full"></div>
    ))}
  </div>
);

export const EmptyState: React.FC<{ 
  title?: string; 
  message?: string; 
  icon?: any;
  action?: React.ReactNode;
}> = ({ 
  title = "Veri Bulunamadı", 
  message = "Görüntülenecek herhangi bir kayıt bulunmuyor.", 
  icon: Icon = Inbox,
  action
}) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200 animate-fade-in">
    <div className="w-20 h-20 bg-white text-slate-300 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
      <Icon className="w-10 h-10" />
    </div>
    <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">{title}</h3>
    <p className="text-slate-500 font-medium max-w-xs mx-auto mb-8">{message}</p>
    {action}
  </div>
);

export const ApiErrorState: React.FC<{ 
  message?: string; 
  onRetry?: () => void;
}> = ({ 
  message = "Veriler yüklenirken bir hata oluştu.", 
  onRetry 
}) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-red-50/50 rounded-[40px] border-2 border-dashed border-red-100 animate-fade-in">
    <div className="w-20 h-20 bg-white text-red-400 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
      <AlertCircle className="w-10 h-10" />
    </div>
    <h3 className="text-xl font-black text-red-800 mb-2 uppercase tracking-tight">Hata Oluştu</h3>
    <p className="text-red-600/70 font-medium max-w-xs mx-auto mb-8">{message}</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="px-8 py-3 bg-red-600 text-white font-black rounded-xl shadow-lg hover:bg-red-700 transition-all flex items-center gap-2 uppercase text-xs tracking-widest"
      >
        <Loader2 className="w-4 h-4" /> Tekrar Dene
      </button>
    )}
  </div>
);
