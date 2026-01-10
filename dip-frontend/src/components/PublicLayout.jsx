import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Shield, Menu, X, Lock } from 'lucide-react';
import clsx from 'clsx';

const PublicLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Regras', path: '/rules' },
    { name: 'Como Fazer Parte', path: '/join' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 selection:bg-federal-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-federal-900 border border-federal-700 group-hover:border-federal-500 transition-colors shadow-md">
                <Shield className="w-6 h-6 text-federal-400 group-hover:text-federal-300 transition-colors" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 uppercase leading-none">DICOR</span>
                <span className="text-[10px] font-medium text-federal-700 tracking-[0.2em] uppercase mt-1">Polícia Federal</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    "text-sm font-medium transition-colors relative py-1",
                    location.pathname === item.path
                      ? "text-federal-700 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-federal-600"
                      : "text-slate-600 hover:text-federal-600"
                  )}
                >
                  {item.name}
                </Link>
              ))}
              <div className="h-6 w-px bg-slate-200 mx-2" />
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 bg-federal-600 hover:bg-federal-700 text-white text-sm font-medium rounded-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <Lock size={16} />
                Área Restrita
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-slate-600 hover:text-federal-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-federal-700 hover:bg-slate-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                to="/login"
                className="flex items-center gap-2 w-full px-3 py-2 mt-4 text-base font-medium text-white bg-federal-600 rounded-md hover:bg-federal-700"
                onClick={() => setIsMenuOpen(false)}
              >
                <Lock size={18} />
                Acesso Restrito
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-grow bg-slate-50">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-federal-400" />
                <span className="font-bold text-lg text-white">DIP - PF</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                DIP Polícia Federal.<br/>
                Compromisso com a verdade e a justiça.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Links Rápidos</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/rules" className="hover:text-federal-400 transition-colors">Regulamento</Link></li>
                <li><Link to="/join" className="hover:text-federal-400 transition-colors">Recrutamento</Link></li>
                <li><Link to="/login" className="hover:text-federal-400 transition-colors">Painel Administrativo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Contato de Emergência</h3>
              <p className="text-slate-400 text-sm mb-2">Em caso de emergência, disque:</p>
              <span className="text-2xl font-bold text-federal-400">190</span>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-slate-500 text-xs">
            &copy; {new Date().getFullYear()} DIP Polícia Federal. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
