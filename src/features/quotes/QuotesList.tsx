import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  FileText, Calendar, User, Search, 
  ArrowRight, AlertCircle, Loader2, Download 
} from 'lucide-react';
import { Client } from '../../types/client';
import { toast } from 'sonner';
import { generateQuotePDF } from '../../utils/pdfGenerator';

// Tipo extendido para incluir datos del cliente
interface QuoteWithClient {
  id: string;
  folio: string;
  created_at: string;
  total_bruto: number;
  total: number; // Compatibilidad
  estado: string;
  items: any[];
  subtotal_neto: number;
  iva: number;
  notes?: string;
  terms?: string;
  validity_days?: number;
  client: Client; // Relación
}

interface Props {
  selectedClient?: Client | null;
  onClearFilter?: () => void;
}

export default function QuotesList({ selectedClient, onClearFilter }: Props) {
  const [quotes, setQuotes] = useState<QuoteWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, [selectedClient]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('crm_quotes')
        .select(`
          *,
          client:crm_clients (*)
        `)
        .order('created_at', { ascending: false });

      if (selectedClient) {
        query = query.eq('client_id', selectedClient.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error('Error cargando cotizaciones:', error);
      toast.error('Error al cargar el listado');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (quote: QuoteWithClient) => {
    setDownloadingId(quote.id);
    try {
      // NOTA: Para el historial, el QR se generará sin imagen incrustada 
      // a menos que usemos una librería externa de generación de QR en memoria.
      // Por ahora, pasamos null en el QR para evitar errores, pero el PDF se genera igual.
      const success = generateQuotePDF(quote, quote.client, undefined);
      
      if (success) toast.success(`Folio ${quote.folio} descargado`);
      else toast.error("Error al generar PDF");
    } catch (err) {
      console.error(err);
      toast.error("Error crítico en descarga");
    } finally {
      setDownloadingId(null);
    }
  };

  // Filtrado local
  const filteredQuotes = quotes.filter(q => {
    const searchLower = searchTerm.toLowerCase();
    const folio = (q.folio || '').toLowerCase();
    const clientName = (q.client?.razon_social || '').toLowerCase();
    return folio.includes(searchLower) || clientName.includes(searchLower);
  });

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* BARRA DE FILTROS */}
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
          <button 
            onClick={onClearFilter}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            Filtrando por: {selectedClient.razon_social} (X)
          </button>
        )}
      </div>

      {/* LISTADO */}
      <div className="space-y-3">
        {filteredQuotes.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
            <p className="text-slate-500">No hay cotizaciones registradas.</p>
          </div>
        ) : (
          filteredQuotes.map((quote) => (
            <div key={quote.id} className="bg-slate-900/30 border border-slate-800 hover:border-cyan-500/30 p-4 rounded-xl transition-all group">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    quote.estado === 'Aceptada' ? 'bg-emerald-500/10 text-emerald-400' : 
                    quote.estado === 'Pendiente' ? 'bg-amber-500/10 text-amber-400' : 
                    'bg-slate-800 text-slate-400'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm flex items-center gap-2">
                      {quote.folio || 'S/F'}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 uppercase">
                        {quote.estado}
                      </span>
                    </h4>
                    <p className="text-slate-500 text-xs flex items-center gap-2 mt-1">
                      <User className="w-3 h-3" /> {quote.client?.razon_social || 'Cliente desconocido'}
                      <span className="text-slate-700">|</span>
                      <Calendar className="w-3 h-3" /> {new Date(quote.created_at).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-500 font-bold uppercase">Total Neto</p>
                    <p className="text-cyan-400 font-mono font-bold">
                      ${(quote.subtotal_neto || 0).toLocaleString('es-CL')}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => handleDownload(quote)}
                    disabled={downloadingId === quote.id}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                    title="Descargar PDF"
                  >
                    {downloadingId === quote.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}