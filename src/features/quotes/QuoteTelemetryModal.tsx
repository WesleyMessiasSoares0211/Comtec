import React, { useEffect, useState } from 'react';
import { 
  X, Activity, Eye, Download, FileText, FileArchive, Loader2, 
  Monitor, Smartphone, Mail, Globe, Filter, Server, Tablet, 
  Users, BarChart3
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { QuoteTelemetry } from '../../types/quotes';

interface Props {
  quoteId: string;
  folio: string;
  clientName: string;
  onClose: () => void;
}

type FilterType = 'ALL' | 'VIEWS' | 'DOWNLOADS' | 'SPECS';

export default function QuoteTelemetryModal({ quoteId, folio, clientName, onClose }: Props) {
  const [events, setEvents] = useState<QuoteTelemetry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('ALL');

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

  // --- ANALIZADOR DE USER-AGENT ---
  const parseUserAgent = (ua: string) => {
    let browser = 'Desconocido';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';

    let os = 'Desconocido';
    if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    const isMobile = /Mobi|Android|iPhone/i.test(ua);
    const isTablet = /Tablet|iPad/i.test(ua);
    
    let DeviceIcon = Monitor;
    if (isMobile) DeviceIcon = Smartphone;
    if (isTablet) DeviceIcon = Tablet;

    return { browser, os, DeviceIcon };
  };

  // --- ESTILOS DE ACCIÓN ---
  const getActionStyles = (action: string) => {
    switch(action) {
      case 'view_portal': 
        return { icon: Eye, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', shadow: 'shadow-blue-500/20', text: 'Visualización de Portal' };
      case 'download_official_pdf': 
        return { icon: Download, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', shadow: 'shadow-orange-500/25', text: 'Descarga PDF Oficial' };
      case 'open_single_spec': 
      case 'open_multiple_specs': 
        return { icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', shadow: 'shadow-cyan-500/20', text: 'Lectura de Fichas Técnicas' };
      case 'download_zip_specs': 
        return { icon: FileArchive, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', shadow: 'shadow-emerald-500/20', text: 'Descarga de Paquete ZIP' };
      default: 
        return { icon: Activity, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', shadow: 'shadow-slate-500/20', text: 'Interacción Registrada' };
    }
  };

  // --- FORMATEADOR DE FECHAS ---
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      time: d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      date: d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }).replace('.', '').toUpperCase()
    };
  };

  // --- FORMATEADOR DE METADATOS ---
  const renderMetadata = (action: string, meta: any) => {
    if (!meta || Object.keys(meta).length === 0) return null;
    
    if (action === 'download_zip_specs' || action === 'open_multiple_specs') {
       return (
         <div className="flex items-center justify-between mt-3 p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
           <div className="flex items-center gap-2">
             <FileArchive className="w-4 h-4 text-emerald-500" />
             <span className="text-slate-400 font-medium">Volumen extraído:</span>
           </div>
           <span className="text-emerald-400 font-black font-mono">{meta.cantidad_archivos} Archivos</span>
         </div>
       );
    }
    if (action === 'open_single_spec') {
       return (
         <div className="flex items-center justify-between mt-3 p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
           <div className="flex items-center gap-2">
             <Server className="w-4 h-4 text-cyan-500" />
             <span className="text-slate-400 font-medium">Especificación (P/N):</span>
           </div>
           <span className="text-cyan-400 font-black font-mono">{meta.part_number}</span>
         </div>
       );
    }
    return (
      <div className="mt-3 text-[10px] font-mono text-cyan-600/60 bg-cyan-950/20 p-2.5 rounded-lg border border-cyan-900/30 overflow-x-auto">
        {JSON.stringify(meta)}
      </div>
    );
  };

  // --- MÉTRICAS Y FILTROS ---
  const stats = {
    views: events.filter(e => e.action_type === 'view_portal').length,
    downloads: events.filter(e => ['download_official_pdf', 'download_zip_specs'].includes(e.action_type)).length,
    users: new Set(events.map(e => e.client_email)).size
  };

  const filteredEvents = events.filter(e => {
    if (filter === 'ALL') return true;
    if (filter === 'VIEWS') return e.action_type === 'view_portal';
    if (filter === 'DOWNLOADS') return ['download_official_pdf', 'download_zip_specs'].includes(e.action_type);
    if (filter === 'SPECS') return ['open_single_spec', 'open_multiple_specs'].includes(e.action_type);
    return true;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* HEADER (con shrink-0) */}
        <div className="shrink-0 p-6 border-b border-slate-800 flex justify-between items-start bg-gradient-to-r from-slate-950/80 to-slate-900/80">
          <div className="flex gap-4">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl h-fit shadow-lg shadow-cyan-500/10">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight mb-1">Telemetría Comercial</h3>
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-cyan-500 border-r border-slate-700 pr-3">Folio: {folio}</p>
                <p className="text-xs text-slate-400">{clientName}</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-950/50 border border-slate-800 hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MÉTRICAS (KPIs) (con shrink-0) */}
        <div className="shrink-0 grid grid-cols-3 gap-3 p-4 md:px-8 bg-slate-900/50 border-b border-slate-800">
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex items-center gap-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Eye className="w-5 h-5" /></div>
            <div><p className="text-[10px] text-slate-500 uppercase tracking-wider font-black mb-1">Total Vistas</p><p className="text-2xl font-black text-white leading-none">{stats.views}</p></div>
          </div>
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex items-center gap-4">
            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400"><Download className="w-5 h-5" /></div>
            <div><p className="text-[10px] text-slate-500 uppercase tracking-wider font-black mb-1">Descargas Efectivas</p><p className="text-2xl font-black text-white leading-none">{stats.downloads}</p></div>
          </div>
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex items-center gap-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><Users className="w-5 h-5" /></div>
            <div><p className="text-[10px] text-slate-500 uppercase tracking-wider font-black mb-1">Usuarios Únicos</p><p className="text-2xl font-black text-white leading-none">{stats.users}</p></div>
          </div>
        </div>

        {/* PESTAÑAS DE FILTRO (con shrink-0) */}
        <div className="shrink-0 px-4 md:px-8 py-3 bg-slate-950 flex gap-2 overflow-x-auto no-scrollbar border-b border-slate-800">
          <Filter className="w-4 h-4 text-slate-500 my-auto mr-2 shrink-0" />
          {[
            { id: 'ALL', label: 'Historial Completo' },
            { id: 'VIEWS', label: 'Aperturas' },
            { id: 'DOWNLOADS', label: 'Descargas' },
            { id: 'SPECS', label: 'Interés Técnico' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as FilterType)}
              className={`shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap border ${
                filter === tab.id 
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg shadow-cyan-900/40' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TIMELINE CENTRALIZADO (con flex-1) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-slate-950/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mb-3" />
              <p className="text-xs font-bold uppercase tracking-widest">Cargando telemetría...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/50 mx-auto max-w-lg">
              <Activity className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
              <p className="text-slate-400 text-sm">No existen registros para esta selección.</p>
            </div>
          ) : (
            <div className="relative w-full max-w-5xl mx-auto">
              {/* Eje Central */}
              <div className="absolute top-0 bottom-0 left-8 md:left-1/2 md:-translate-x-1/2 w-0.5 bg-gradient-to-b from-cyan-500/40 via-slate-800 to-transparent"></div>

              {filteredEvents.map((event, idx) => {
                const style = getActionStyles(event.action_type);
                const Icon = style.icon;
                const { time, date } = formatDate(event.created_at);
                const { browser, os, DeviceIcon } = parseUserAgent(event.user_agent);
                const isEven = idx % 2 === 0;

                return (
                  <div key={event.id} className={`relative mb-10 flex items-center w-full ${isEven ? 'md:flex-row-reverse' : ''}`}>
                    
                    {/* Espaciador Desktop */}
                    <div className="hidden md:block w-[calc(50%-3.5rem)]"></div>

                    {/* NODO CENTRAL (Pilar de Tiempo e Icono) */}
                    <div className="absolute left-0 md:relative md:left-auto w-16 md:w-28 flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-2xl py-3 shadow-xl shrink-0 z-10 transition-transform hover:scale-105">
                      <div className={`p-2 rounded-xl mb-2 ${style.bg} ${style.border} border shadow-lg ${style.shadow}`}>
                        <Icon className={`w-4 h-4 md:w-5 md:h-5 ${style.color}`} />
                      </div>
                      <span className="text-white font-black text-xs md:text-sm leading-none tracking-tight">{time}</span>
                      <span className="text-slate-500 text-[9px] md:text-[10px] font-bold uppercase mt-1 tracking-widest">{date}</span>
                    </div>

                    {/* TARJETA DE DETALLE */}
                    <div className={`w-[calc(100%-5rem)] ml-[5rem] md:ml-0 md:w-[calc(50%-3.5rem)] bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-xl hover:shadow-cyan-900/10 ${isEven ? 'md:mr-auto' : 'md:ml-auto'}`}>
                      
                      <h4 className={`text-xs md:text-sm font-black uppercase tracking-wider mb-4 border-b border-slate-800 pb-2 ${style.color}`}>
                        {style.text}
                      </h4>
                      
                      {/* Identidad de Usuario */}
                      <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 mb-4">
                        <div className="bg-slate-800 p-2 rounded-lg shrink-0">
                          <Mail className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Operador Registrado</p>
                          <p className="text-sm font-bold text-slate-200 truncate">{event.client_email}</p>
                        </div>
                      </div>
                      
                      {/* Huella de Dispositivo (Badges) */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <div className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-md border border-indigo-500/20 text-[10px] font-bold tracking-wide">
                          <DeviceIcon className="w-3 h-3" /> {os}
                        </div>
                        <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-md border border-blue-500/20 text-[10px] font-bold tracking-wide">
                          <Globe className="w-3 h-3" /> {browser}
                        </div>
                      </div>

                      {/* Extractor de Metadatos */}
                      {renderMetadata(event.action_type, event.metadata)}

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