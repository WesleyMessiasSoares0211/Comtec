import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-500/10">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">Algo salió mal</h2>
          <p className="text-slate-400 max-w-md mb-8">
            Hemos encontrado un error inesperado al procesar esta vista. Nuestro equipo técnico ha sido notificado.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold border border-slate-700 transition-all active:scale-95"
          >
            <RefreshCw className="w-5 h-5" />
            Recargar Página
          </button>
          
          {/* Opcional: Mostrar el error técnico solo en desarrollo */}
          {process.env.NODE_ENV === 'development' && (
             <div className="mt-8 p-4 bg-slate-950 rounded-lg border border-red-900/50 max-w-2xl overflow-auto text-left">
               <code className="text-xs text-red-400 font-mono">{this.state.errorMsg}</code>
             </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}