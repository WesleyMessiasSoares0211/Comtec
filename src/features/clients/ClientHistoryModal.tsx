import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Clock, CheckCircle2, XCircle, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Client } from '../../types/client';
import { toast } from 'sonner';
import { generateQuotePDF } from '../../utils/pdfGenerator';

interface ClientHistoryModalProps {
  client: Client;
  onClose: () => void;
}

type FilterStatus = 'todas' | 'Pendiente' | 'Aceptada' | 'Rechazada' | 'Facturada';

export default function ClientHistoryModal({ client, onClose }: ClientHistoryModalProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('todas');

  useEffect(() => {
    let isMounted = true;
    
    const loadHistory = async () => {
      if (!client?.id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('crm_quotes')
          .select('*')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (isMounted) setHistory(data || []);
      } catch (error) {
        console.error("Error cargando historial:", error);
        if (isMounted) toast.error('No se pudo cargar el historial');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadHistory();
    return () => { isMounted = false; };
  }, [client]);

  // Filtrado seguro: verificamos que 'q' y 'q.estado' existan
  const filteredHistory = (history || []).filter(q => {
    if (!q) return false;
    if (filter === 'todas') return true;
    return q.estado === filter;
  });

  const handleDownload = async (e: React.MouseEvent, quote: any) => {
    e.stopPropagation(); // Detener propagación
    setDownloadingId(quote.id);
    try {
      const success = generateQuotePDF(quote, client);
      if (success) toast.success(`Cotización ${quote.folio} descargada`);
      else toast.error("No se pudo generar el PDF");
    } catch (err) {
      console.error(err);
      toast.error("Error al generar el documento");
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusStyle = (status: string) => {
    const s = String(status || ''); // Asegurar string
    switch (s) {
      case 'Aceptada': case 'Facturada': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Rechazada': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Pendiente': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  // Helper para formatear moneda de forma segura
  const formatCurrency = (val: any) => {
    const num = Number(val);
    if (isNaN(num)) return '$0';
    return '$' + num.toLocaleString('es-CL');
  };

  // Helper para fecha segura
  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return 'Sin fecha';
      return new Date(dateStr).toLocaleDateString('es-CL');
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-xl">
              <FileText className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Historial Comercial</h3>
              <p className="text-xs text-slate-500">{client.razon_social || 'Cliente sin nombre'}</p>
            </div>
          </div>
          <button onClick={onClose} type="button" className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* FILTROS */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(['todas', 'Pendiente', 'Aceptada', 'Rechazada', 'Facturada'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              type="button" // IMPORTANTE
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                filter === status ? 'bg-cyan-600 text-white border-cyan-500' : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* LISTA */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mb-2" />
              <span className="text-sm">Buscando documentos...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl">
              <p className="text-slate-500 text-sm">No se encontraron registros en este estado.</p>
            </div>
          ) : (
            filteredHistory.map((quote) => (
              <div key={quote.id || Math.random()} className="bg-slate-950/40 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex items-center justify-between group transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl border ${getStatusStyle(quote.estado)}`}>
                    {['Aceptada', 'Facturada'].includes(quote.estado) ? <CheckCircle2 className="w-5 h-5" /> : 
                     quote.estado === 'Rechazada' ? <XCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">#{String(quote.folio || '---')}</span>
                      <span className="text-xs font-mono text-cyan-500 font-bold">
                        {formatCurrency(quote.total || quote.total_bruto)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(quote.created_at)}
                    </div>
                  </div>
                </div>
                
                <button 
                  type="button" // IMPORTANTE PARA EVITAR RECARGA
                  onClick={(e) => handleDownload(e, quote)}
                  disabled={downloadingId === quote.id}
                  className="p-2 bg-slate-900 hover:bg-cyan-600 border border-slate-700 hover:border-cyan-500 rounded-lg text-slate-400 hover:text-white transition-all disabled:opacity-50"
                  title="Descargar PDF Original"
                >
                  {downloadingId === quote.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}