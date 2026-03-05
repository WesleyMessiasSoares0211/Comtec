import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import ClientsForm from './ClientsForm';
import ClientsList from './ClientsList';
import ClientStatsBoard from './ClientStats';
import ClientHistoryModal from './ClientHistoryModal';
import ClientDetailsModal from './ClientDetailsModal'; 
import { useClients } from '../../hooks/useClients';
import type { Client } from '../../types/client';

interface Props {
  onNavigateToQuotes?: () => void;
}

export default function ClientView({ onNavigateToQuotes }: Props) {
  const { stats: clientStats, loading: clientsLoading, refreshClients } = useClients();
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [historyClient, setHistoryClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  const handleEditClient = (client: Client) => {
    setClientToEdit(client);
    setShowClientForm(true);
  };

  const handleClientSuccess = () => {
    setShowClientForm(false);
    setClientToEdit(null);
    refreshClients();
  };

  return (
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

      {historyClient && (
        <ClientHistoryModal 
          client={historyClient}
          onClose={() => setHistoryClient(null)}
          onCreateRevision={(quote) => {
             // Opcional: Podrías usar un contexto (Context API) a futuro para pasar esta cotización
             // a la vista de cotizaciones. Por ahora, cerramos el modal e indicamos al usuario.
             setHistoryClient(null);
             if (onNavigateToQuotes) onNavigateToQuotes();
          }} 
        />
      )}

      {viewingClient && (
        <ClientDetailsModal 
          client={viewingClient}
          onClose={() => setViewingClient(null)}
        />
      )}
    </div>
  );
}