import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Clock, Loader2, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Client } from '../../types/client';
import { toast } from 'sonner';
import { generateQuotePDF } from '../../utils/pdfGenerator';
import QRCode from 'qrcode';

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

  // Cálculo de contadores para los filtros
  const getCount = (status: FilterStatus) => {
    if (status === 'todas') return history.length;
    return history.filter(q => q.estado === status).length;
  };

  const filteredHistory = (history || []).filter(q => {
    if (!q || !q.estado) return false;
    if (filter === 'todas') return true;
    return q.estado === filter;
  });

  const handleDownload = async (e: React.MouseEvent, quote: any) => {
    e.stopPropagation();
    if (downloadingId) return;

    setDownloadingId(quote.id);
    try {
      const baseUrl = window.location.origin;
      
      // CAMBIO IMPORTANTE: Apuntar a la Carpeta Digital y codificar el folio (por la barra /)
      const encodedFolio = encodeURIComponent(quote.folio);
      const docsUrl = `${baseUrl}/quote/${encodedFolio}/docs`;
      
      let qrDataUrl = '';
      
      try {
        // Generamos la imagen Base64
        qrDataUrl = await QRCode.toDataURL(docsUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });
      } catch (qrErr) {
        console.warn("No se pudo generar el QR, continuando sin él...", qrErr);
      }

      // Pasamos la URL generada al PDF (si falló el QR, qrDataUrl será string vacío y el PDF lo ignorará)
      const success = generateQuotePDF(quote, client, qrDataUrl);
      
      if (success) toast.success(`Cotización ${quote.folio} descargada`);
      else toast.error("No se pudo generar el PDF");
      
    } catch (err) {
      console.error("Error crítico al descargar:", err);
      toast.error("Error al generar el documento");
    } finally {
      setDownloadingId(null);
    }
  };

  // Función para obtener estilos de los botones de filtro basados en el estado activo
  const getFilterStyles = (status: FilterStatus) => {
    const isActive = filter === status;
    
    if (!isActive) return 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-300';

    switch (status) {
      case 'todas': 
        return 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(8,145,178,0.3)]';
      case 'Pendiente': 
        return 'bg-orange-500 text-white border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]';
      case 'Aceptada': 
      case 'Facturada':
        return 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
      case 'Rechazada':
        return 'bg-red-600 text-white border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.3)]';
      default:
        return 'bg-slate-800 text-white border-slate-700';
    }
  };

  const formatCurrency = (val: any) => {
    const num = Number(val);
    return isNaN(num) ? '$0' : '$' + num.toLocaleString('es-CL');
  };

  if (!client) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-xl">
              <FileText className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Historial Comercial</h3>
              <p className="text-xs text-slate-500">{client?.razon_social || 'Cliente sin nombre'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* FILTROS CON CONTADORES Y COLORES */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(['todas', 'Pendiente', 'Aceptada', 'Rechazada', 'Facturada'] as FilterStatus[]).map((status) => {
            const label = status === 'todas' ? 'TODAS' : status === 'Pendiente' ? 'PENDIENTES' : status.toUpperCase();
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${getFilterStyles(status)}`}
              >
                {label} ({getCount(status)})
              </button>
            );
          })}
        </div>

        {/* LISTA DE COTIZACIONES */}
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
                  <div className="p-2.5 rounded-xl border bg-slate-800 text-slate-400 border-slate-700">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">#{quote.folio || '---'}</span>
                      <span className="text-xs font-mono text-cyan-500 font-bold">
                        {formatCurrency(quote.total || quote.total_bruto)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                      <Calendar className="w-3 h-3" />
                      {quote.created_at ? new Date(quote.created_at).toLocaleDateString('es-CL') : 'Sin fecha'}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => handleDownload(e, quote)}
                  disabled={downloadingId === quote.id}
                  className="p-2 bg-slate-900 hover:bg-cyan-600 border border-slate-700 hover:border-cyan-500 rounded-lg text-slate-400 hover:text-white transition-all disabled:opacity-50"
                  title="Descargar PDF"
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