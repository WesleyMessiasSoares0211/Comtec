import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  FileText, Calendar, User, Search, 
  AlertCircle, Loader2, Download, CopyPlus,
  ChevronLeft, ChevronRight, ChevronDown, Activity, ShieldAlert, CheckCircle2, Lock
} from 'lucide-react';
import { Client } from '../../types/client';
import { toast } from 'sonner';
import { generateQuotePDF } from '../../utils/pdfGenerator';
import QRCode from 'qrcode';
import { quoteService } from '../../services/quoteService';
import QuoteTelemetryModal from './QuoteTelemetryModal';
import { useAuth } from '../../hooks/useAuth';

interface QuoteWithClient {
  id: string;
  folio: string;
  created_at: string;
  total_bruto: number;
  total: number;
  estado: string;
  items: any[];
  subtotal_neto: number;
  iva: number;
  notes?: string;
  terms?: string;
  validity_days?: number;
  version?: number;
  has_new_activity?: boolean;
  client: Client;
  vendedor_id?: string;
}

interface Props {
  selectedClient?: Client | null;
  onClearFilter?: () => void;
  onCreateRevision?: (quote: any) => void;
}

const ITEMS_PER_PAGE = 10;

export default function QuotesList({ selectedClient, onClearFilter, onCreateRevision }: Props) {
  const { session } = useAuth();
  const [userRole, setUserRole] = useState<'vendedor' | 'super_admin' | 'admin'>('vendedor');
  
  const [quotes, setQuotes] = useState<QuoteWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  const [trackingQuote, setTrackingQuote] = useState<QuoteWithClient | null>(null);

  // 1. Obtener el rol del usuario actual al cargar
  useEffect(() => {
    const fetchRole = async () => {
      if (session?.user?.id) {
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (data && data.role) setUserRole(data.role);
      }
    };
    fetchRole();
  }, [session]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedClient]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuotes();
    }, 400); 
    return () => clearTimeout(timer);
  }, [page, searchTerm, selectedClient]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query;

      if (searchTerm) {
        query = supabase
          .rpc('search_quotes', { term: searchTerm })
          .select(`*, client:crm_clients (*)`, { count: 'exact' })
          .range(from, to);
      } else {
        query = supabase
          .from('crm_quotes')
          .select(`*, client:crm_clients (*)`, { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to);
      }

      if (selectedClient) {
        query = query.eq('client_id', selectedClient.id);
      }

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      setQuotes(data || []);
      setTotalItems(count || 0);

    } catch (error) {
      console.error(error);
      toast.error('Error cargando cotizaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTracking = async (quote: QuoteWithClient) => {
    setTrackingQuote(quote);
    if (quote.has_new_activity) {
      setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, has_new_activity: false } : q));
      try {
        await supabase.from('crm_quotes').update({ has_new_activity: false }).eq('id', quote.id);
      } catch (err) {
        console.error("No se pudo limpiar la alerta de actividad", err);
      }
    }
  };

  const handleDownload = async (quote: QuoteWithClient) => {
     setDownloadingId(quote.id);
     try {
       const baseUrl = window.location.origin;
       const docsUrl = `${baseUrl}/quote/docs?folio=${encodeURIComponent(quote.folio)}`;
       const qrDataUrl = await QRCode.toDataURL(docsUrl, { width: 200, margin: 2 });
       
       const success = generateQuotePDF(quote, quote.client, qrDataUrl);
       if(success) toast.success("PDF generado y descargado correctamente");
     } catch (e) {
       console.error(e);
       generateQuotePDF(quote, quote.client);
     } finally {
       setDownloadingId(null);
     }
  };

  const handleStatusChange = async (quoteId: string, newStatus: string) => {
    setUpdatingId(quoteId);
    try {
      const success = await quoteService.updateStatus(quoteId, newStatus);
      if (success) {
        toast.success(`Estado actualizado a ${newStatus}`);
        setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, estado: newStatus } : q));
      } else {
        toast.error("No se pudo actualizar el estado");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión");
    } finally {
      setUpdatingId(null);
    }
  };

  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendiente de Aprobacion': return 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.2)]';
      case 'Aprobada': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
      case 'Aceptada': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Facturada': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Rechazada': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Borrador': return 'bg-slate-800 text-slate-400 border-slate-700';
      default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
       {/* FILTROS */}
       <div className="flex flex-col md:flex-row gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Buscar Folio, Cliente, Producto, Estado..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none"
            />
          </div>
          {selectedClient && (
            <button onClick={onClearFilter} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Filtro: {selectedClient.razon_social} (X)
            </button>
          )}
       </div>

       {/* LISTADO */}
       <div className="space-y-3 min-h-[400px]">
        {loading ? (
           <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-500" /></div>
        ) : quotes.length === 0 ? (
           <div className="text-center py-10 text-slate-500">No se encontraron cotizaciones.</div>
        ) : (
          quotes.map((quote) => {
            const isPendingApproval = quote.estado === 'Pendiente de Aprobacion';
            
            return (
              <div key={quote.id} className={`bg-slate-900/30 border p-4 rounded-xl transition-all group ${isPendingApproval ? 'border-orange-500/30 bg-orange-950/10' : 'border-slate-800 hover:border-cyan-500/30'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                     {/* Icono Estado */}
                     <div className={`p-3 rounded-lg ${
                        quote.estado === 'Pendiente de Aprobacion' ? 'bg-orange-500/20 text-orange-400' : 
                        quote.estado === 'Aprobada' || quote.estado === 'Aceptada' ? 'bg-emerald-500/10 text-emerald-400' : 
                        quote.estado === 'Pendiente' ? 'bg-amber-500/10 text-amber-400' : 
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {isPendingApproval ? <ShieldAlert className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                     </div>
                     
                     {/* Datos Principales */}
                     <div>
                        <div className="flex items-center gap-2">
                           <h4 className="text-white font-bold text-sm">{quote.folio || 'S/F'}</h4>
                           
                           {(quote.version && quote.version > 1) && (
                              <span className="text-[10px] bg-cyan-900/50 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20 font-mono">
                                 v{quote.version}
                              </span>
                           )}

                           {/* SELECTOR DE ESTADO CON ICONO */}
                           <div className="relative group/status inline-block">
                             <select
                               value={quote.estado}
                               disabled={updatingId === quote.id || (isPendingApproval && !isAdmin)}
                               onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                               className={`appearance-none cursor-pointer text-[10px] pl-2 pr-6 py-0.5 rounded-full border uppercase font-bold outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-900 ${getStatusColor(quote.estado)} ${updatingId === quote.id || (isPendingApproval && !isAdmin) ? 'opacity-50 cursor-not-allowed' : ''}`}
                               style={{ textAlignLast: 'center' }}
                             >
                               <option value="Borrador" className="bg-slate-900 text-slate-400">Borrador</option>
                               <option value="Pendiente de Aprobacion" className="bg-slate-900 text-orange-400">En Revisión</option>
                               <option value="Aprobada" className="bg-slate-900 text-emerald-400">Aprobada</option>
                               <option value="Pendiente" className="bg-slate-900 text-amber-400">Pendiente Envío</option>
                               <option value="Aceptada" className="bg-slate-900 text-emerald-400">Aceptada</option>
                               <option value="Facturada" className="bg-slate-900 text-blue-400">Facturada</option>
                               <option value="Rechazada" className="bg-slate-900 text-red-400">Rechazada</option>
                             </select>
                             
                             {updatingId !== quote.id && !(isPendingApproval && !isAdmin) && (
                               <div className="absolute inset-y-0 right-1.5 flex items-center pointer-events-none">
                                 <ChevronDown className="w-3 h-3 opacity-60" />
                               </div>
                             )}

                             {updatingId === quote.id && (
                               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                 <Loader2 className="w-3 h-3 animate-spin text-white" />
                               </div>
                             )}
                           </div>
                        </div>
                        <p className="text-slate-500 text-xs flex items-center gap-2 mt-1">
                          <User className="w-3 h-3" /> {quote.client?.razon_social}
                          <span className="text-slate-700">|</span>
                          <Calendar className="w-3 h-3" /> {new Date(quote.created_at).toLocaleDateString('es-CL')}
                        </p>
                     </div>
                  </div>

                  <div className="flex items-center gap-3 justify-end">
                     <div className="text-right hidden sm:block mr-2">
                        <p className="text-cyan-400 font-mono font-bold">${(quote.total || quote.total_bruto).toLocaleString('es-CL')}</p>
                     </div>

                     {/* BOTÓN DE AUTORIZACIÓN RÁPIDA (SOLO ADMINS) */}
                     {isPendingApproval && isAdmin && (
                        <button 
                          onClick={() => handleStatusChange(quote.id, 'Aprobada')}
                          disabled={updatingId === quote.id}
                          className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-900/20 transition-all animate-pulse"
                          title="Autorizar Emisión"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Aprobar
                        </button>
                     )}
                     
                     {/* Botón de Rastreo con Alerta Dinámica */}
                     <button 
                       onClick={() => handleOpenTracking(quote)}
                       className={`p-2 rounded-lg transition-all border shadow-md relative ${
                         quote.has_new_activity 
                         ? 'bg-orange-500/20 text-orange-400 border-orange-500/50 hover:bg-orange-500/30 shadow-orange-500/20' 
                         : 'bg-slate-800 hover:bg-indigo-600/20 hover:text-indigo-400 text-slate-400 border-slate-700 hover:border-indigo-500/50'
                       }`}
                       title="Rastreo de Actividad"
                     >
                       <Activity className={`w-4 h-4 ${quote.has_new_activity ? 'animate-pulse' : ''}`} />
                       {quote.has_new_activity && (
                         <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                         </span>
                       )}
                     </button>
                     
                     {onCreateRevision && (
                       <button
                         onClick={() => onCreateRevision(quote)}
                         className="p-2 bg-slate-800 hover:bg-amber-600/20 hover:text-amber-400 text-slate-400 border border-slate-700 hover:border-amber-500/50 rounded-lg transition-all"
                         title="Crear Nueva Versión / Editar"
                       >
                          <CopyPlus className="w-4 h-4" />
                       </button>
                     )}

                     {/* BOTÓN DE DESCARGA (BLOQUEADO SI ESTÁ PENDIENTE DE APROBACIÓN) */}
                     <button 
                        onClick={() => handleDownload(quote)}
                        disabled={downloadingId === quote.id || isPendingApproval}
                        className={`p-2 rounded-lg transition-all border ${
                          isPendingApproval 
                            ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed' 
                            : 'bg-slate-800 hover:bg-cyan-600/20 hover:text-cyan-400 text-slate-400 border-slate-700 hover:border-cyan-500/50'
                        }`}
                        title={isPendingApproval ? "Bloqueado: Requiere Aprobación" : "Descargar PDF"}
                     >
                        {downloadingId === quote.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (isPendingApproval ? <Lock className="w-4 h-4" /> : <Download className="w-4 h-4" />)}
                     </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
       </div>

       {/* PAGINACIÓN */}
       {totalPages > 1 && (
         <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800 mt-4">
           <button 
             onClick={() => setPage(p => Math.max(1, p - 1))}
             disabled={page === 1}
             className="p-2 bg-slate-800 rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-colors"
           >
             <ChevronLeft className="w-4 h-4 text-slate-300" />
           </button>
           
           <span className="text-xs text-slate-500 font-mono">
             Página <span className="text-cyan-400 font-bold">{page}</span> de {totalPages}
           </span>

           <button 
             onClick={() => setPage(p => Math.min(totalPages, p + 1))}
             disabled={page === totalPages}
             className="p-2 bg-slate-800 rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-colors"
           >
             <ChevronRight className="w-4 h-4 text-slate-300" />
           </button>
         </div>
       )}

       {/* MODAL DE RASTREO */}
       {trackingQuote && (
         <QuoteTelemetryModal
           quoteId={trackingQuote.id}
           folio={trackingQuote.folio}
           clientName={trackingQuote.client?.razon_social || 'Cliente no especificado'}
           onClose={() => setTrackingQuote(null)}
         />
       )}
    </div>
  );
}