import React, { useState, useEffect } from 'react';
import { Search, Building2, MapPin, Phone, Mail, Edit2, Trash2, FileText, Loader, AlertCircle, Shield, Download, CalendarClock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, User } from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { useAuth } from '../../hooks/useAuth';
import { clientService, Client } from '../../services/clientService';
import { PasswordDeleteModal } from '../../components/ui/SecurityModals';
import { toast } from 'sonner';

// Hook simple de debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface ClientsListProps {
  onEditClient?: (client: Client) => void;
  onViewQuotes?: (client: Client) => void; 
}

const TagBadge = ({ tag }: { tag: string }) => {
  const styles: Record<string, string> = {
    'VIP': 'text-amber-400 bg-amber-950/30 border-amber-500/30',
    'Moroso': 'text-red-400 bg-red-950/30 border-red-500/30',
    'Potencial': 'text-emerald-400 bg-emerald-950/30 border-emerald-500/30',
    'Recurrente': 'text-blue-400 bg-blue-950/30 border-blue-500/30',
    'Distribuidor': 'text-purple-400 bg-purple-950/30 border-purple-500/30',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${styles[tag] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
      {tag}
    </span>
  );
};

const FinancialBadge = ({ status, condition }: { status?: string, condition?: string }) => {
  if (status === 'aprobado') {
    return (
      <div className="flex flex-col items-end">
        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-0.5">Aprobado</span>
        <span className="text-[9px] text-slate-500">{condition || 'Contado'}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-end">
      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-0.5">Pendiente</span>
      <span className="text-[9px] text-slate-500 italic">Auditoría Requerida</span>
    </div>
  );
};

export default function ClientsList({ onEditClient, onViewQuotes }: ClientsListProps) {
  const { clients, totalCount, loading, isFetching, error, refreshClients, page, setPage, pageSize, setSearchTerm } = useClients();
  const { canDelete, canEdit } = useAuth();
  
  const [localSearch, setLocalSearch] = useState('');
  const debouncedSearch = useDebounce(localSearch, 500);

  useEffect(() => {
    setSearchTerm(debouncedSearch);
    setPage(1); 
  }, [debouncedSearch, setSearchTerm, setPage]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Paginación
  const totalPages = Math.ceil(totalCount / pageSize);
  const startRecord = (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    const toastId = toast.loading('Eliminando cliente...');

    try {
      const { error } = await clientService.delete(clientToDelete.id);
      if (error) throw error;
      
      toast.success('Cliente eliminado', { id: toastId });
      setSelectedIds(prev => prev.filter(id => id !== clientToDelete.id));
      await refreshClients();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar', { id: toastId });
    } finally {
      setIsDeleting(false);
      setClientToDelete(null);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(clients.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const isAllSelected = clients.length > 0 && clients.every(c => selectedIds.includes(c.id));

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm overflow-hidden shadow-xl flex flex-col min-h-[600px]">
          
          {/* HEADER */}
          <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-950/30">
            <div className="relative w-full md:max-w-xl flex gap-3">
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isFetching ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
                <input 
                  type="text" 
                  placeholder="Buscar por RUT, Nombre, Giro..." 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-cyan-500 outline-none text-slate-200 transition-all" 
                  value={localSearch} 
                  onChange={(e) => setLocalSearch(e.target.value)} 
                />
              </div>
              <button 
                onClick={() => {
                  if (selectedIds.length === 0) return toast.info("Selecciona clientes para exportar");
                  clientService.exportToCSV(clients.filter(c => selectedIds.includes(c.id)));
                }}
                disabled={selectedIds.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500 hover:bg-slate-700 disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Exportar
              </button>
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
              TOTAL: {totalCount} CLIENTES
            </div>
          </div>

          {/* TABLA */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="pl-6 pr-2 py-4 w-10">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-cyan-500" checked={isAllSelected} onChange={handleSelectAll} disabled={clients.length === 0} />
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Empresa</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ubicación</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contacto</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/20">
                {loading && clients.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-32 text-center text-slate-500"><Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-cyan-500" /><p className="text-sm">Cargando...</p></td></tr>
                ) : clients.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-32 text-center text-slate-500"><Building2 className="w-12 h-12 mb-4 text-slate-700 mx-auto" /><p className="text-sm">No hay clientes registrados</p></td></tr>
                ) : (
                  clients.map((client) => {
                    const isSelected = selectedIds.includes(client.id);
                    // Lógica visual para contacto: Priorizar el contacto principal
                    const principalContact = client.contacts?.find(c => c.es_principal) || client.contacts?.[0];
                    const displayName = principalContact?.nombre || 'General';
                    const displayEmail = principalContact?.email || client.email_contacto;
                    const displayPhone = principalContact?.telefono || client.telefono;

                    return (
                      <tr key={client.id} className={`transition-colors group ${isSelected ? 'bg-cyan-900/10 hover:bg-cyan-900/20' : 'hover:bg-slate-800/40'}`}>
                        <td className="pl-6 pr-2 py-4"><input type="checkbox" className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-cyan-500" checked={isSelected} onChange={() => handleSelectOne(client.id)} /></td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-semibold text-white">{client.razon_social}</div>
                              <div className="text-xs text-slate-500 font-mono">{client.rut}</div>
                              <div className="flex gap-1 mt-1">{client.tags?.map(t => <TagBadge key={t} tag={t}/>)}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-xs text-slate-300 font-medium">{client.giro || '-'}</div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                            <MapPin className="w-3 h-3" /> {client.ciudad || 'Sin ciudad'}
                          </div>
                        </td>

                        <td className="px-6 py-4 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300"><User className="w-3 h-3 text-cyan-500"/> {displayName}</div>
                          {displayEmail && <div className="flex items-center gap-1.5 text-xs text-slate-500"><Mail className="w-3 h-3"/> {displayEmail}</div>}
                          {displayPhone && <div className="flex items-center gap-1.5 text-xs text-slate-500"><Phone className="w-3 h-3"/> {displayPhone}</div>}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <FinancialBadge status={client.estado_financiero} condition={client.condicion_comercial} />
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onViewQuotes && onViewQuotes(client)} className="p-2 bg-slate-800 hover:text-cyan-400 rounded-lg"><FileText className="w-4 h-4" /></button>
                            {canEdit && <button onClick={() => onEditClient && onEditClient(client)} className="p-2 bg-slate-800 hover:text-blue-400 rounded-lg"><Edit2 className="w-4 h-4" /></button>}
                            {canDelete && <button onClick={() => setClientToDelete(client)} className="p-2 bg-slate-800 hover:text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINADOR */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
            <div className="text-xs text-slate-500">Mostrando {startRecord} - {endRecord} de {totalCount}</div>
            <div className="flex items-center gap-2">
               <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded bg-slate-900 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-50"><ChevronLeft className="w-4 h-4"/></button>
               <span className="text-xs font-bold text-slate-400">Pág {page} de {totalPages || 1}</span>
               <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded bg-slate-900 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-50"><ChevronRight className="w-4 h-4"/></button>
            </div>
          </div>

        </div>
      </div>
      
      <PasswordDeleteModal isOpen={!!clientToDelete} itemName={clientToDelete?.razon_social || ''} loading={isDeleting} onClose={() => setClientToDelete(null)} onConfirm={handleDeleteConfirm} />
    </>
  );
}