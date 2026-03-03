import React, { useEffect, useState } from 'react';
import { X, Activity, Eye, Download, FileText, FileArchive, Loader2, Calendar, Monitor, Smartphone, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { QuoteTelemetry } from '../../types/quotes';

interface Props {
  quoteId: string;
  folio: string;
  clientName: string;
  onClose: () => void;
}

export default function QuoteTelemetryModal({ quoteId, folio, clientName, onClose }: Props) {
  const [events, setEvents] = useState<QuoteTelemetry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('quote_telemetry')
          .select('*')
          .eq('quote_id', quoteId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setEvents(data || []);
      } catch (err) {
        console.error("Error cargando telemetría:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
  }, [quoteId]);

  const getActionStyles = (action: string) => {
    switch(action) {
      case 'view_portal': 
        return { icon: Eye, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'Visualizó el Portal' };
      case 'download_official_pdf': 
        return { icon: Download, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'Descargó PDF Oficial' };
      case 'open_single_spec': 
      case 'open_multiple_specs': 
        return { icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'Abrió Ficha(s) Técnica(s)' };
      case 'download_zip_specs': 
        return { icon: FileArchive, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'Descargó Paquete ZIP' };
      default: 
        return { icon: Activity, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'Interacción Registrada' };
    }
  };

  const isMobile = (userAgent: string) => /Mobi|Android|iPhone/i.test(userAgent);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-gradient-to-r from-slate-950/50 to-slate-900/50">
          <div className="flex gap-4">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl h-fit">
              <Activity className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight mb-1">Rastreo Comercial</h3>
              <p className="text-sm font-bold text-cyan-500 mb-1">Folio: {folio}</p>
              <p className="text-xs text-slate-400">{clientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TIMELINE */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-slate-950/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mb-3" />
              <p className="text-xs font-bold uppercase tracking-widest">Cargando eventos...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
              <Eye className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
              <p className="text-slate-400 text-sm">El cliente aún no ha revisado este documento.</p>
            </div>
          ) : (
            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-cyan-500/20 before:via-slate-800 before:to-transparent">
              {events.map((event, idx) => {
                const style = getActionStyles(event.action_type);
                const Icon = style.icon;
                const date = new Date(event.created_at);

                return (
                  <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    
                    {/* Icono Centralizado */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 ${style.bg} ${style.color} shadow-lg md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Tarjeta de Evento */}
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-800 bg-slate-900 hover:border-slate-700 transition-colors shadow-lg shadow-black/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-black uppercase tracking-wider ${style.color}`}>
                          {style.text}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                          {date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mt-3 pt-3 border-t border-slate-800/50">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate">{event.client_email}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {isMobile(event.user_agent) ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                          <span className="truncate">{isMobile(event.user_agent) ? 'Dispositivo Móvil' : 'PC / Escritorio'}</span>
                        </div>
                        
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="mt-2 text-[10px] font-mono text-cyan-600/60 bg-cyan-950/20 p-2 rounded-lg border border-cyan-900/30">
                            {JSON.stringify(event.metadata)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}