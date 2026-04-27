
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8 text-center animate-fade-in">
          <div className="w-24 h-24 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl animate-bounce-slight">
            <AlertTriangle className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Bir Hata Oluştu</h1>
          <p className="text-slate-500 font-medium mb-12 max-w-md mx-auto leading-relaxed">
            Uygulama beklenmedik bir hata ile karşılaştı. Lütfen sayfayı yenilemeyi deneyin veya ana panele dönün.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all flex items-center gap-3 uppercase text-xs tracking-widest"
            >
              <RefreshCcw className="w-4 h-4" /> Sayfayı Yenile
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-600 font-black rounded-2xl shadow-sm hover:bg-slate-50 transition-all flex items-center gap-3 uppercase text-xs tracking-widest"
            >
              <Home className="w-4 h-4" /> Ana Panele Dön
            </button>
          </div>

          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <div className="mt-12 p-6 bg-slate-900 rounded-2xl text-left max-w-2xl mx-auto overflow-auto border border-white/10 shadow-2xl">
              <p className="text-brand-400 font-mono text-[10px] mb-2 uppercase tracking-widest font-black">Hata Detayı (Geliştirici Modu)</p>
              <pre className="text-slate-300 font-mono text-xs whitespace-pre-wrap">
                {this.state.error.stack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
