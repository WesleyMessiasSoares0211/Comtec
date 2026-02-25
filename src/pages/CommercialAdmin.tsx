import { useState } from 'react';
import { Plus } from 'lucide-react';

import AdminLayout from '../layouts/AdminLayout';

// Módulos
import DashboardView from '../features/dashboard/DashboardView'; // <--- IMPORTACIÓN NUEVA
import ClientsForm from '../features/clients/ClientsForm';
import ClientsList from '../features/clients/ClientsList';
import ProductsForm from '../features/catalog/ProductsForm';
import ProductsList from '../features/catalog/ProductsList';
import QuoteBuilder from '../features/quotes/QuoteBuilder';
import QuotesList from '../features/quotes/QuotesList';

import ClientStatsBoard from '../features/clients/ClientStats';
import ClientHistoryModal from '../features/clients/ClientHistoryModal';
import ClientDetailsModal from '../features/clients/ClientDetailsModal'; 
import { useClients } from '../hooks/useClients';
import type { Client } from '../types/client';
import type { Product } from '../types/product';

type TabType = 'dashboard' | 'clientes' | 'productos' | 'ofertas';

export default function CommercialAdmin() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // Hook Global de Clientes
  const { stats: clientStats, loading: clientsLoading, refreshClients } = useClients();

  // Control de Vistas (Tabs y Formularios)
  const [showQuoteBuilder, setShowQuoteBuilder] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);

  // Estados de Edición y Selección
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [quoteFilterClient, setQuoteFilterClient] = useState<Client | null>(null);
  
  // Modales de Clientes
  const [historyClient, setHistoryClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabType);
    
    // Resetear estados al cambiar de módulo para evitar conflictos visuales
    if (tab === 'clientes') {
      setShowClientForm(false);
      setClientToEdit(null);
      setHistoryClient(null);
      setViewingClient(null);
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
      
      {/* VISTA: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <DashboardView /> 
      )}

      {/* VISTA: GESTIÓN DE CLIENTES */}
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
              onViewQuotes={(client) => setHistoryClient(client)}
              onViewDetails={(client) => setViewingClient(client)}
            />
          )}

          {/* Modales Auxiliares */}
          {historyClient && (
            <ClientHistoryModal 
              client={historyClient}
              onClose={() => setHistoryClient(null)}
            />
          )}

          {viewingClient && (
            <ClientDetailsModal 
              client={viewingClient}
              onClose={() => setViewingClient(null)}
            />
          )}
        </div>
      )}

      {/* VISTA: CATÁLOGO DE PRODUCTOS */}
      {activeTab === 'productos' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Catálogo Técnico</h2>
              <p className="text-slate-400 mt-1">Gestión de inventario y fichas de producto</p>
            </div>
            <button 
              onClick={() => { setProductToEdit(null); setShowProductForm(!showProductForm); }} 
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-500/25 hover:translate-y-[-2px] transition-all"
            >
              {showProductForm ? 'Ver Catálogo' : <><Plus className="w-5 h-5" /> Catalogar Producto</>}
            </button>
          </div>
          {showProductForm ? (
            <div className="max-w-4xl">
              <ProductsForm 
                initialData={productToEdit} 
                onSuccess={() => { setShowProductForm(false); setProductToEdit(null); }} 
                onCancel={() => { setShowProductForm(false); setProductToEdit(null); }} 
              />
            </div>
          ) : (
            <ProductsList onEditProduct={handleEditProduct} />
          )}
        </div>
      )}

      {/* VISTA: OFERTAS COMERCIALES */}
      {activeTab === 'ofertas' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Ofertas Comerciales</h2>
              <p className="text-slate-400 mt-1">
                {quoteFilterClient ? `Historial de ${quoteFilterClient.razon_social}` : 'Gestión y emisión de presupuestos'}
              </p>
            </div>
            <button 
              onClick={() => setShowQuoteBuilder(!showQuoteBuilder)} 
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-cyan-500/25 hover:translate-y-[-2px] transition-all"
            >
              {showQuoteBuilder ? 'Ver Historial' : <><Plus className="w-5 h-5" /> Crear Cotización</>}
            </button>
          </div>
          {showQuoteBuilder ? (
            <QuoteBuilder />
          ) : (
            <QuotesList 
              selectedClient={quoteFilterClient} 
              onClearFilter={() => setQuoteFilterClient(null)} 
            />
          )}
        </div>
      )}
    </AdminLayout>
  );
}