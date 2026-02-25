import { ReactNode, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard, Users, Package, FileText,
  Settings as SettingsIcon, LogOut, ChevronRight,
  Wrench, Boxes, ShieldAlert, Menu, Bell, Search,
  UserCircle
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function AdminLayout({ children, activeTab, onTabChange }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserEmail(user.email);
    });
    
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const routeNames: Record<string, string> = {
    'dashboard': 'Panel de Control',
    'clientes': 'Directorio',
    'productos': 'Catálogo',
    'ofertas': 'Cotizador'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      
      {/* HEADER SUPERIOR */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-slate-950/90 border-b border-slate-800 z-50 flex items-center justify-between px-4 lg:px-6 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-4 lg:w-64">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-900 rounded-xl transition-colors focus:outline-none"
            title="Alternar Menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <SettingsIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col justify-center hidden sm:flex">
              <h1 className="text-lg font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent tracking-tight leading-none">
                COMTEC
              </h1>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Industrial System</span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-1 max-w-xl px-8">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar folio de cotización, cliente o P/N..." 
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 outline-none text-slate-200 placeholder-slate-500 transition-all shadow-inner"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              <kbd className="hidden lg:inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-mono font-bold text-slate-500 bg-slate-800 border border-slate-700 rounded">⌘</kbd>
              <kbd className="hidden lg:inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-mono font-bold text-slate-500 bg-slate-800 border border-slate-700 rounded">K</kbd>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-6 justify-end flex-1 md:flex-none">
          <div className="hidden sm:flex items-center gap-2 text-sm bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg shadow-inner shrink-0">
            <button onClick={() => handleTabClick('dashboard')} className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors group">
              <LayoutDashboard className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              <span className="text-slate-500 group-hover:text-cyan-400 font-bold text-[10px] uppercase tracking-widest hidden lg:inline transition-colors">Inicio</span>
            </button>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-cyan-400 font-bold text-[10px] lg:text-xs uppercase tracking-wider">
              {routeNames[activeTab] || activeTab}
            </span>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-4 lg:pl-6">
            <button className="relative p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-900 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-slate-950"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-2 cursor-pointer group">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:border-cyan-500/50 group-hover:text-cyan-400 transition-colors overflow-hidden">
                <UserCircle className="w-6 h-6" />
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-bold text-slate-200 truncate max-w-[120px]">{userEmail || 'Usuario'}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Administrador</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* OVERLAY MÓVIL */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 top-16 bg-slate-950/80 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside 
        className={`fixed top-16 left-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 z-40 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar mt-2">
          <div className="mb-6">
            <NavItem icon={<LayoutDashboard className="w-5 h-5" />} label="Panel de Control" active={activeTab === 'dashboard'} onClick={() => handleTabClick('dashboard')} />
          </div>

          <div className="mb-6">
            <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Área Comercial</h3>
            <nav className="space-y-1">
              <NavItem icon={<Users className="w-5 h-5" />} label="Directorio Clientes" active={activeTab === 'clientes'} onClick={() => handleTabClick('clientes')} />
              <NavItem icon={<Package className="w-5 h-5" />} label="Catálogo Técnico" active={activeTab === 'productos'} onClick={() => handleTabClick('productos')} />
              <NavItem icon={<FileText className="w-5 h-5" />} label="Gestión de Ofertas" active={activeTab === 'ofertas'} onClick={() => handleTabClick('ofertas')} />
            </nav>
          </div>

          <div className="mb-6">
            <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              Operaciones <ShieldAlert className="w-3 h-3 text-orange-500/50" title="Próximamente" />
            </h3>
            <nav className="space-y-1">
              <NavItem icon={<Wrench className="w-5 h-5" />} label="Órdenes de Trabajo" active={activeTab === 'taller'} onClick={() => {}} disabled={true} />
              <NavItem icon={<Boxes className="w-5 h-5" />} label="Almacenes" active={activeTab === 'almacen'} onClick={() => {}} disabled={true} />
            </nav>
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-slate-800 bg-slate-950/30 shrink-0">
          <button onClick={handleLogout} className="flex items-center gap-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all w-full px-4 py-3 group">
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold tracking-wide">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <main 
        className={`pt-16 flex-1 flex flex-col transition-all duration-300 ease-in-out pb-8 ${
          isSidebarOpen ? 'lg:pl-64' : 'pl-0'
        }`}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>
      
    </div>
  );
}

function NavItem({ icon, label, active, onClick, disabled = false }: { icon: ReactNode; label: string; active: boolean; onClick: () => void; disabled?: boolean; }) {
  if (disabled) {
    return (
      <div className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl opacity-40 cursor-not-allowed group">
        <span className="text-slate-600">{icon}</span>
        <span className="text-sm font-medium tracking-wide text-slate-500">{label}</span>
        <span className="ml-auto text-[8px] font-bold text-slate-600 uppercase tracking-widest border border-slate-700/50 px-1.5 py-0.5 rounded">Fase 2</span>
      </div>
    );
  }

  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group ${active ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/5 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.05)]' : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 border border-transparent hover:border-slate-700/50'}`}>
      <span className={`transition-colors duration-300 ${active ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400/70'}`}>{icon}</span>
      <span className="text-sm font-semibold tracking-wide truncate">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse shrink-0" />}
    </button>
  );
}