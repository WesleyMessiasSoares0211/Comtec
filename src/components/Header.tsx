import { Menu, X, ChevronDown, Settings, LogIn, Shield } from 'lucide-react';
import { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  onNavigate: (page: string, filter?: string) => void;
  currentPage: string;
  session: Session | null;
}

export default function Header({ onNavigate, currentPage, session }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isSuperAdmin } = useAuth();

  const productCategories = [
    { name: 'Sensor', id: 'sensor' },
    { name: 'Gateway', id: 'gateway' },
    { name: 'Software', id: 'software' },
    { name: 'Servicios', id: 'servicios' }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Comtec</h1>
              <h1 className="text-white font-bold text-lg leading-tight">Industrial</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => onNavigate('home')}
              className={`text-sm font-medium transition-colors ${
                currentPage === 'home' ? 'text-cyan-400' : 'text-gray-300 hover:text-white'
              }`}
            >
              Inicio
            </button>

            <div 
              className="relative py-4"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <button
                onClick={() => onNavigate('catalog')}
                className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                  currentPage === 'catalog' ? 'text-cyan-400' : 'text-gray-300 hover:text-white'
                }`}
              >
                Productos
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {productCategories.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate('catalog', item.id);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-cyan-400 transition-colors"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigate('solutions')}
              className={`text-sm font-medium transition-colors ${
                currentPage === 'solutions' ? 'text-cyan-400' : 'text-gray-300 hover:text-white'
              }`}
            >
              Soluciones
            </button>
            <button
              onClick={() => onNavigate('nosotros')}
              className={`text-sm font-medium transition-colors ${
                currentPage === 'nosotros' ? 'text-cyan-400' : 'text-gray-300 hover:text-white'
              }`}
            >
              Nosotros
            </button>
          </nav>

          {/* Acciones */}
          <div className="hidden md:flex items-center space-x-4">
            {isSuperAdmin && (
              <button
                onClick={() => onNavigate('system')}
                className={`p-2 rounded-lg border transition-all ${
                  currentPage === 'system'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                    : 'border-slate-700 text-slate-400 hover:border-purple-500 hover:text-purple-400'
                }`}
                title="Configuración del Sistema (Super Admin)"
              >
                <Shield size={20} />
              </button>
            )}

            <button
              onClick={() => onNavigate('admin')}
              className={`p-2 rounded-lg border transition-all ${
                currentPage === 'admin'
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                : 'border-slate-700 text-slate-400 hover:border-cyan-500 hover:text-cyan-400'
              } ${session ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5' : ''}`}
              title={session ? "Sesión Activa - CRM" : "Administración"}
            >
              {session ? <Settings size={20} /> : <LogIn size={20} />}
            </button>

            <button
              onClick={() => onNavigate('clients')}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/25">
              Envíanos tus Consultas
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            <button
              onClick={() => onNavigate('admin')}
              className={`p-2 ${currentPage === 'admin' ? 'text-cyan-400' : session ? 'text-emerald-400' : 'text-slate-400'}`}
            >
              <Settings size={20} />
            </button>
            <button
              className="p-2 text-gray-300 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}