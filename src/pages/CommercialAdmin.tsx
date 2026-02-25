import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, Activity, TrendingUp, CheckCircle2, 
  PackageSearch, AlertTriangle, Lock 
} from 'lucide-react';

import AdminLayout from '../layouts/AdminLayout';
import ClientsForm from '../features/clients/ClientsForm';
import ClientsList from '../features/clients/ClientsList';
import ProductsForm from '../features/catalog/ProductsForm';
import ProductsList from '../features/catalog/ProductsList';
import QuoteBuilder from '../features/quotes/QuoteBuilder';
import QuotesList from '../features/quotes/QuotesList';

import ClientStatsBoard from '../features/clients/ClientStats';
import ClientHistoryModal from '../features/clients/ClientHistoryModal';
import { useClients } from '../hooks/useClients';
import type { Client } from '../types/client';
import type { Product } from '../types/product';

type TabType = 'dashboard' | 'clientes' | 'productos' | 'ofertas';
type DateFilterType = 'month' | 'quarter' | 'all';

export default function CommercialAdmin() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('month');
  
  // Hook Global de Clientes
  const { stats: clientStats, loading: clientsLoading, refreshClients } = useClients();

  // Control de Vistas
  const [showQuoteBuilder, setShowQuoteBuilder] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);

  // Estados de Edición
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [quoteFilterClient, setQuoteFilterClient] = useState<Client | null>(null);
  const [historyClient, setHistoryClient] = useState<{id: string, name: string} | null>(null);

  const [stats, setStats] = useState({
    totalPendiente: 0,
    totalAceptado: 0,
    clientesContador: 0,
    productosContador: 0
  });

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardStats();
    }
  }, [activeTab, dateFilter]);

  async function fetchDashboardStats() {
    let query = supabase.from('crm_quotes').select('total_bruto, total, estado, created_at');
    const now = new Date();
    
    if (dateFilter === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      query = query.gte('created_at', firstDay);
    } else if (dateFilter === 'quarter') {
      const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3)).toISOString();
      query = query.gte('created_at', threeMonthsAgo);
    }

    const { data: quotes } = await query;
    const { count: clientCount } = await supabase.from('crm_clients').select('*', { count: 'exact', head: true });
    const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });

    if (quotes) {
      const pendiente = quotes
        .filter(q => ['Pendiente', 'Borrador'].includes(q.estado))
        .reduce((acc, q) => acc + (Number(q.total) || 0), 0);

      const aceptado = quotes
        .filter(q => ['Aceptada', 'Facturada'].includes(q.estado))
        .reduce((acc, q) => acc + (Number(q.total) || 0), 0);

      setStats({
        totalPendiente: pendiente,
        totalAceptado: aceptado,
        clientesContador: clientCount || 0,
        productosContador: productCount || 0
      });
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabType);
    if (tab === 'clientes') {
      setShowClientForm(false);
      setClientToEdit(null);
      setHistoryClient(null);
    }
    if (tab === 'productos') {
      setShowProductForm(false);
      setProductToEdit(null);
    }
    if (tab === 'ofertas') setShowQuoteBuilder(false);
  };

  const handleEditClient = (client: Client) => {
    setClientToEdit(client);
    setShowClientForm(true);
  };

  const handleViewClientQuotes = (client: Client) => {
    // Aquí aseguramos que el ID y Nombre se pasen correctamente al modal
    if (client && client.id) {
      setHistoryClient({ id: client.id, name: client.razon_social });
    }
  };

  const handleClientSuccess = () => {
    setShowClientForm(false);
    setClientToEdit(null);
    refreshClients();
  };

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setShowProductForm(true);
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={handleTabChange}>
      
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight">
                Panel de Control
              </h2>
              <p className="text-slate-400 mt-1 text-sm">Resumen de rendimiento comercial y operativo</p>
            </div>
            <div className="flex bg-slate-900/80 border border-slate-800 p-1 rounded-xl shadow-inner backdrop-blur-sm">
              <FilterBtn label="Mes" active={dateFilter === 'month'} onClick={() => setDateFilter('month')} />
              <FilterBtn label="Trimestre" active={dateFilter === 'quarter'} onClick={() => setDateFilter('quarter')} />
              <FilterBtn label="Todo" active={dateFilter === 'all'} onClick={() => setDateFilter('all')} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="Proyectado (Pendiente)" 
              value={`$${stats.totalPendiente.toLocaleString('es-CL')}`} 
              trend="Venta en Seguimiento" 
              color="text-amber-400" 
              icon={<TrendingUp className="w-5 h-5 text-amber-500" />}
              glowColor="shadow-amber-500/10"
            />
            <StatCard 
              title="Realizado (Aceptado)" 
              value={`$${stats.totalAceptado.toLocaleString('es-CL')}`} 
              trend="Venta Confirmada" 
              color="text-emerald-400" 
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              glowColor="shadow-emerald-500/10"
            />
            <StatCard 
              title="Alcance de Catálogo" 
              value={stats.productosContador.toString()} 
              trend={`${stats.clientesContador} Clientes Registrados`} 
              color="text-cyan-400" 
              icon={<PackageSearch className="w-5 h-5 text-cyan-500" />}
              glowColor="shadow-cyan-500/10"
            />
          </div>
          
          {/* ... (Sección de gráficos existente se mantiene igual) ... */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col shadow-xl backdrop-blur-sm">
               <h3 className="text-white font-bold mb-8 flex items-center gap-2 text-sm">
                 <Activity className="w-5 h-5 text-cyan-500" />
                 Distribución de Ventas
               </h3>
               <div className="flex-1 flex items-end gap-8 max-w-md mx-auto w-full pt-4">
                 <ProgressBar label="Pendiente" value={stats.totalPendiente} total={stats.totalPendiente + stats.totalAceptado} color="bg-gradient-to-t from-amber-600 to-amber-400" />
                 <ProgressBar label="Cerrado" value={stats.totalAceptado} total={stats.totalPendiente + stats.totalAceptado} color="bg-gradient-to-t from-emerald-600 to-emerald-400" />
               </div>
             </div>
             <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
               <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
                 <Lock className="w-6 h-6 text-slate-400 mb-3" />
                 <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest border border-cyan-500/30 bg-slate-900/90 px-3 py-1.5 rounded-lg">Módulo Operaciones</span>
               </div>
               <h3 className="text-slate-400 font-bold flex items-center gap-2 text-sm mb-6"><AlertTriangle className="w-4 h-4" /> Alertas de Taller</h3>
             </div>
           </div>
        </div>
      )}

      {activeTab === 'clientes' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Gestión de Clientes</h2>
              <p className="text-slate-400 mt-1">Directorio comercial y métricas de cartera</p>
            </div>
            <button
              onClick={() => {
                setClientToEdit(null);
                setShowClientForm(!showClientForm);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-500/25 hover:translate-y-[-2px] transition-all"
            >
              {showClientForm ? 'Ver Listado' : <><Plus className="w-5 h-5" /> Nuevo Cliente</>}
            </button>
          </div>
          
          {!showClientForm && <ClientStatsBoard stats={clientStats} loading={clientsLoading} />}

          {showClientForm ? (
            <div className="max-w-4xl">
              <ClientsForm 
                initialData={clientToEdit}
                onSuccess={handleClientSuccess} 
                onCancel={() => { setShowClientForm(false); setClientToEdit(null); }}
              />
            </div>
          ) : (
            <ClientsList 
              onEditClient={handleEditClient}
              onViewQuotes={handleViewClientQuotes}
            />
          )}

          {historyClient && (
            <ClientHistoryModal 
              clientId={historyClient.id}
              clientName={historyClient.name}
              onClose={() => setHistoryClient(null)}
            />
          )}
        </div>
      )}

      {/* ... (Tabs de Productos y Ofertas se mantienen igual) ... */}
      {activeTab === 'productos' && (
        <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Catálogo Técnico</h2>
              <p className="text-slate-400 mt-1">Gestión de inventario y fichas de producto</p>
            </div>
            <button onClick={() => { setProductToEdit(null); setShowProductForm(!showProductForm); }} className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-500/25 hover:translate-y-[-2px] transition-all">
              {showProductForm ? 'Ver Catálogo' : <><Plus className="w-5 h-5" /> Catalogar Producto</>}
            </button>
          </div>
          {showProductForm ? <div className="max-w-4xl"><ProductsForm initialData={productToEdit} onSuccess={() => { setShowProductForm(false); setProductToEdit(null); }} onCancel={() => { setShowProductForm(false); setProductToEdit(null); }} /></div> : <ProductsList onEditProduct={handleEditProduct} />}
        </div>
      )}

      {activeTab === 'ofertas' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Ofertas Comerciales</h2>
              <p className="text-slate-400 mt-1">{quoteFilterClient ? `Historial de ${quoteFilterClient.razon_social}` : 'Gestión y emisión de presupuestos'}</p>
            </div>
            <button onClick={() => setShowQuoteBuilder(!showQuoteBuilder)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-cyan-500/25 hover:translate-y-[-2px] transition-all">
              {showQuoteBuilder ? 'Ver Historial' : <><Plus className="w-5 h-5" /> Crear Cotización</>}
            </button>
          </div>
          {showQuoteBuilder ? <QuoteBuilder /> : <QuotesList selectedClient={quoteFilterClient} onClearFilter={() => setQuoteFilterClient(null)} />}
        </div>
      )}
    </AdminLayout>
  );
}

// Componentes auxiliares visuales
function FilterBtn({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return <button onClick={onClick} className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all ${active ? 'bg-slate-800 text-cyan-400 shadow-md border border-slate-700/50' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}`}>{label.toUpperCase()}</button>;
}
function ProgressBar({ label, value, total, color }: { label: string, value: number, total: number, color: string }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return <div className="flex-1 flex flex-col items-center gap-3"><div className="w-full bg-slate-950/50 rounded-t-xl h-48 flex items-end border border-slate-800/50 p-1.5"><div className={`${color} w-full rounded-t-lg transition-all duration-1000 relative group shadow-[0_0_15px_rgba(0,0,0,0.2)]`} style={{ height: `${percentage}%` }}><div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{percentage.toFixed(1)}%</div></div></div><div className="text-center mt-1"><span className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest">{label}</span><span className="block text-sm text-white font-mono mt-0.5">${value.toLocaleString('es-CL')}</span></div></div>;
}
function StatCard({ title, value, trend, color, icon, glowColor }: any) {
  return <div className={`bg-slate-900/50 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all duration-300 group shadow-lg ${glowColor} hover:shadow-2xl`}><div className="flex justify-between items-start mb-4"><p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-tight w-2/3">{title}</p><div className="p-2 bg-slate-950/50 rounded-lg border border-slate-800 group-hover:scale-110 transition-transform">{icon}</div></div><div className="flex flex-col gap-1 mt-2"><h3 className={`text-3xl font-mono font-bold tracking-tight ${color}`}>{value}</h3><span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-2">{trend}</span></div></div>;
}