import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  FileText, Calendar, User, Search, 
  AlertCircle, Loader2, Download, CopyPlus // Nuevo icono
} from 'lucide-react';
import { Client } from '../../types/client';
import { toast } from 'sonner';
import { generateQuotePDF } from '../../utils/pdfGenerator';
import QRCode from 'qrcode'; // Recuerda importar esto para que funcionen las descargas con QR

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
  version?: number; // Soportamos versión
  client: Client;
}

interface Props {
  selectedClient?: Client | null;
  onClearFilter?: () => void;
  onCreateRevision?: (quote: any) => void; // Prop Nueva
}

export default function QuotesList({ selectedClient, onClearFilter, onCreateRevision }: Props) {
  // ... (Estados y useEffect iguales) ...
  const [quotes, setQuotes] = useState<QuoteWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, [selectedClient]);

  const fetchQuotes = async () => {
      // ... (Misma lógica de carga) ...
      // Asegúrate de ordenar por created_at descendente para ver las últimas versiones primero
      try {
        setLoading(true);
        let query = supabase
          .from('crm_quotes')
          .select(`*, client:crm_clients (*)`)
          .order('created_at', { ascending: false });

        if (selectedClient) {
          query = query.eq('client_id', selectedClient.id);
        }
        const { data, error } = await query;
        if (error) throw error;
        setQuotes(data || []);
      } catch (error) {
        console.error(error);
        toast.error('Error cargando cotizaciones');
      } finally {
        setLoading(false);
      }
  };

  const handleDownload = async (quote: QuoteWithClient) => {
     // ... (Misma lógica de descarga con QR que ya tienes) ...
     // Asegúrate de usar la lógica de QR actualizada aquí también si quieres consistencia
     setDownloadingId(quote.id);
     try {
       const baseUrl = window.location.origin;
      const docsUrl = `${baseUrl}/quote/docs?folio=${encodeURIComponent(quote.folio)}`;
       const qrDataUrl = await QRCode.toDataURL(docsUrl, { width: 200, margin: 2 });       
       const success = generateQuotePDF(quote, quote.client, qrDataUrl);
       
       if(success) toast.success("Descargado correctamente");
     } catch (e) {
       console.error(e);
       generateQuotePDF(quote, quote.client); // Fallback sin QR
     } finally {
       setDownloadingId(null);
     }
  };

  // ... (Resto de filtros) ...
  const filteredQuotes = quotes.filter(q => {
      const searchLower = searchTerm.toLowerCase();
      const folio = (q.folio || '').toLowerCase();
      const clientName = (q.client?.razon_social || '').toLowerCase();
      return folio.includes(searchLower) || clientName.includes(searchLower);
  });

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-500" /></div>;

  return (
    <div className="space-y-4">
       {/* ... (Barra de Filtros Igual) ... */}
       <div className="flex flex-col md:flex-row gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Buscar por Folio o Cliente..."
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
       <div className="space-y-3">
        {filteredQuotes.map((quote) => (
            <div key={quote.id} className="bg-slate-900/30 border border-slate-800 hover:border-cyan-500/30 p-4 rounded-xl transition-all group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                   {/* Icono Estado */}
                   <div className={`p-3 rounded-lg ${
                      quote.estado === 'Aceptada' ? 'bg-emerald-500/10 text-emerald-400' : 
                      quote.estado === 'Pendiente' ? 'bg-amber-500/10 text-amber-400' : 
                      'bg-slate-800 text-slate-400'
                    }`}>
                      <FileText className="w-5 h-5" />
                   </div>
                   
                   {/* Datos Principales */}
                   <div>
                      <div className="flex items-center gap-2">
                         <h4 className="text-white font-bold text-sm">{quote.folio || 'S/F'}</h4>
                         {/* Badge de Versión */}
                         {(quote.version && quote.version > 1) && (
                            <span className="text-[10px] bg-cyan-900/50 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20 font-mono">
                               v{quote.version}
                            </span>
                         )}
                         <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase ${
                            quote.estado === 'Pendiente' ? 'bg-amber-900/20 text-amber-400 border-amber-500/20' : 
                            'bg-slate-800 text-slate-400 border-slate-700'
                         }`}>
                           {quote.estado}
                         </span>
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
                   
                   {/* BOTÓN REVISIÓN / EDITAR */}
                   {onCreateRevision && (
                     <button
                       onClick={() => onCreateRevision(quote)}
                       className="p-2 bg-slate-800 hover:bg-amber-600/20 hover:text-amber-400 text-slate-400 border border-slate-700 hover:border-amber-500/50 rounded-lg transition-all"
                       title="Crear Nueva Versión / Editar"
                     >
                        <CopyPlus className="w-4 h-4" />
                     </button>
                   )}

                   {/* BOTÓN DESCARGAR */}
                   <button 
                      onClick={() => handleDownload(quote)}
                      disabled={downloadingId === quote.id}
                      className="p-2 bg-slate-800 hover:bg-cyan-600/20 hover:text-cyan-400 text-slate-400 border border-slate-700 hover:border-cyan-500/50 rounded-lg transition-all"
                      title="Descargar PDF"
                   >
                      {downloadingId === quote.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                   </button>
                </div>
              </div>
            </div>
        ))}
       </div>
    </div>
  );
}