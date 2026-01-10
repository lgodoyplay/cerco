import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Atualiza o state para que a próxima renderização mostre a UI alternativa.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Você também pode registrar o erro em um serviço de relatório de erros
    console.error("Erro capturado pelo ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // UI de fallback personalizada
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md w-full shadow-2xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-6">
              <AlertTriangle size={32} />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Algo deu errado</h1>
            <p className="text-slate-400 mb-6 text-sm">
              Ocorreu um erro inesperado ao carregar esta página.
            </p>

            <div className="bg-slate-950 rounded-lg p-4 mb-6 text-left overflow-auto max-h-32 border border-slate-800">
              <code className="text-xs text-red-400 font-mono">
                {this.state.error && this.state.error.toString()}
              </code>
            </div>

            <div className="space-y-3">
              <button 
                onClick={this.handleReload}
                className="w-full py-2.5 bg-federal-600 hover:bg-federal-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Tentar Novamente
              </button>
              
              <button 
                onClick={this.handleClearCache}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors border border-slate-700"
              >
                Limpar Cache e Recarregar
              </button>

              <button 
                onClick={this.handleGoHome}
                className="w-full py-2.5 text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Home size={16} />
                Voltar para Início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
