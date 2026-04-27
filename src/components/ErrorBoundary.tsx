
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, Home, ClipboardList } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleCopyError = () => {
    const errorDetails = `
Error: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
    `;
    navigator.clipboard.writeText(errorDetails);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 3000);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl border border-slate-200 p-12 text-center animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
              <AlertCircle className="w-12 h-12" />
            </div>
            
            <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tight">Bir Hata Oluştu</h2>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed">
              Üzgünüz, beklenmedik bir sorunla karşılaştık. Lütfen sayfayı yenilemeyi deneyin veya teknik destek ekibine bildirin.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <button 
                onClick={this.handleRetry}
                className="flex flex-col items-center justify-center p-6 bg-slate-900 text-white rounded-3xl hover:bg-black transition-all group"
              >
                <RotateCcw className="w-6 h-6 mb-2 group-hover:rotate-180 transition-transform duration-500" />
                <span className="text-xs font-black uppercase tracking-widest">Tekrar Dene</span>
              </button>
              
              <button 
                onClick={() => window.location.href = '/'}
                className="flex flex-col items-center justify-center p-6 bg-white border-2 border-slate-200 text-slate-700 rounded-3xl hover:border-brand-500 hover:text-brand-600 transition-all"
              >
                <Home className="w-6 h-6 mb-2" />
                <span className="text-xs font-black uppercase tracking-widest">Ana Sayfa</span>
              </button>

              <button 
                onClick={this.handleCopyError}
                className="flex flex-col items-center justify-center p-6 bg-slate-100 text-slate-600 rounded-3xl hover:bg-slate-200 transition-all"
              >
                <ClipboardList className="w-6 h-6 mb-2" />
                <span className="text-xs font-black uppercase tracking-widest">{this.state.copied ? 'Kopyalandı' : 'Detayları Kopyala'}</span>
              </button>
            </div>

            <div className="text-left bg-slate-50 p-6 rounded-2xl border border-slate-200 overflow-auto max-h-40">
              <p className="text-[10px] font-mono text-slate-400 uppercase mb-2 tracking-widest">Teknik Detay</p>
              <p className="text-xs font-mono text-red-600 font-bold break-all">
                {this.state.error?.message || 'Bilinmeyen Hata'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
