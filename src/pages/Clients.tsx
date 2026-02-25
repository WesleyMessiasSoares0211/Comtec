import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import ClientsList from '../features/clients/ClientsList';
// import ClientsForm from '../features/clients/ClientsForm'; // Lo implementaremos si lo necesitas

export default function Clients() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null); // Tipar con Client cuando exista
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Cartera de Clientes</h1>
          <p className="text-slate-400 text-sm">Gestión de empresas y contactos comerciales.</p>
        </div>
        
        <button 
          onClick={handleCreate}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-cyan-900/20 flex items-center gap-2 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* LISTADO DE CLIENTES */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-1">
        <ClientsList key={refreshTrigger} onEdit={handleEdit} />
      </div>

      {/* MODAL (Placeholder por ahora) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 p-8 rounded-xl border border-slate-700">
            <h2 className="text-white font-bold mb-4">Módulo Cliente</h2>
            <p className="text-slate-400 mb-6">El formulario de clientes se implementará en el siguiente paso.</p>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}