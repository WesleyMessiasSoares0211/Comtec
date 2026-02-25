import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { useAuth } from '../../hooks/useAuth';
import ClientsList from './ClientsList';
import ClientsForm from './ClientsForm';
import ClientStatsBoard from './ClientStats';
import ClientHistoryModal from './ClientHistoryModal';

export default function AdminClientsDashboard() {
  const { clients, stats, loading, refreshClients } = useClients();
  const { canCreate } = useAuth();
  
  // Estados de UI exclusivos del Admin
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [historyClient, setHistoryClient] = useState<{id: string, name: string} | null>(null);

  // Filtrado de clientes (opcional si se requiere lógica extra en admin)
  // Por ahora pasamos la lista completa y dejamos que ClientsList filtre visualmente

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const handleSuccess = () => {
    setIsFormOpen(false);
    setEditingClient(null);
    refreshClients(); // Recarga KPIs y Tabla
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* HEADER DEL MÓDULO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">Gestión de Clientes</h2>
          <p className="text-slate-500 text-sm mt-1">Directorio comercial y métricas de cartera</p>
        </div>
        
        {canCreate && (
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all text-sm"
          >
            <Plus size={18} />
            <span>Nuevo Cliente</span>
          </button>
        )}
      </div>

      {/* DASHBOARD DE MÉTRICAS (KPIs) */}
      <ClientStatsBoard stats={stats} loading={loading} />

      {/* TABLA DE CLIENTES (Con acciones admin habilitadas) */}
      <ClientsList 
        onEditClient={handleEdit}
        onViewQuotes={(c) => setHistoryClient({ id: c.id, name: c.razon_social })}
      />

      {/* MODAL FORMULARIO (Crear/Editar) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <ClientsForm 
              initialData={editingClient}
              onSuccess={handleSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL */}
      {historyClient && (
        <ClientHistoryModal 
          clientId={historyClient.id}
          clientName={historyClient.name}
          onClose={() => setHistoryClient(null)}
        />
      )}
    </div>
  );
}