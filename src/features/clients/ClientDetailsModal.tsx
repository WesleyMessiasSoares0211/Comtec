import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Building2, Mail, Phone, MapPin, Hash, 
  TrendingUp, CheckCircle2, FileText, Loader2,
  Calendar, CreditCard, Tag as TagIcon, BarChart3
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Client } from '../../types/client';

interface ClientDetailsModalProps {
  client: Client;
  onClose: () => void;
}

export default function ClientDetailsModal({ client, onClose }: ClientDetailsModalProps) {
  const [stats, setStats] = useState({
    pendingAmount: 0,
    acceptedAmount: 0,
    quoteCount: 0
  });
  const [chartData, setChartData] = useState<{ month: string, total: number, status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClientStats() {
      if (!client.id) return;
      try {
        // Obtenemos cotizaciones de los últimos 6 meses para el gráfico
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const { data, error } = await supabase
          .from('crm_quotes')
          .select('total_bruto, total, estado, created_at')
          .eq('client_id', client.id)
          .gte('created_at', sixMonthsAgo.toISOString())
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
          // 1. Cálculos Generales (Totales históricos)
          const pending = data
            .filter(q => ['Pendiente', 'Borrador'].includes(q.estado))
            .reduce((acc, q) => acc + (Number(q.total_bruto || q.total) || 0), 0);
          
          const accepted = data
            .filter(q => ['Aceptada', 'Facturada'].includes(q.estado))
            .reduce((acc, q) => acc + (Number(q.total_bruto || q.total) || 0), 0);

          setStats({
            pendingAmount: pending,
            acceptedAmount: accepted,
            quoteCount: data.length
          });

          // 2. Preparación de Datos para el Gráfico (Agrupado por Mes)
          const monthlyMap = new Map<string, number>();
          // Inicializamos los últimos 6 meses en 0
          for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toLocaleString('es-CL', { month: 'short' }).toUpperCase(); // ENE, FEB...
            monthlyMap.set(key, 0);
          }

          data.forEach(q => {
            const date = new Date(q.created_at);
            const key = date.toLocaleString('es-CL', { month: 'short' }).toUpperCase();
            const val = Number(q.total_bruto || q.total) || 0;
            
            if (monthlyMap.has(key)) {
              monthlyMap.set(key, (monthlyMap.get(key) || 0) + val);
            }
          });

          // Convertir a array para renderizar
          const chartArray = Array.from(monthlyMap).map(([month, total]) => ({
            month,
            total,
            status: total > 0 ? 'active' : 'empty'
          }));
          
          setChartData(chartArray);
        }
      } catch (err) {
        console.error("Error fetching client stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchClientStats();
  }, [client.id]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[95vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="relative p-6 md:p-8 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-800">
          <div className="flex justify-between items-start relative z-10">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white leading-tight tracking-tight">
                  {client.razon_social}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                    {client.rut}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
          
          {/* GRÁFICO DE RENDIMIENTO (EVOLUCIÓN) */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <BarChart3 className="w-3 h-3" /> Evolución Comercial (6 Meses)
              </h3>
              {!loading && (
                 <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                   stats.quoteCount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                 }`}>
                   {stats.quoteCount > 0 ? 'Cliente Activo' : 'Sin Movimiento'}
                 </span>
              )}
            </div>

            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
              </div>
            ) : (
              <SimpleBarChart data={chartData} />
            )}
          </div>

          {/* MÉTRICAS RÁPIDAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatMiniCard 
              label="Cotizaciones Pendientes"
              value={`$${stats.pendingAmount.toLocaleString('es-CL')}`}
              icon={<TrendingUp className="w-4 h-4" />}
              color="text-amber-400"
              bgColor="bg-amber-500/10"
              loading={loading}
            />
            <StatMiniCard 
              label="Ventas Cerradas Total"
              value={`$${stats.acceptedAmount.toLocaleString('es-CL')}`}
              icon={<CheckCircle2 className="w-4 h-4" />}
              color="text-emerald-400"
              bgColor="bg-emerald-500/10"
              loading={loading}
            />
          </div>

          {/* INFORMACIÓN DE CATASTRO */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Hash className="w-3 h-3" /> Información de Catastro
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 bg-slate-950/30 p-6 rounded-3xl border border-slate-800/50">
              <DataRow icon={<MapPin />} label="Ubicación" value={`${client.direccion || ''} ${client.comuna ? ', ' + client.comuna : ''}`} />
              <DataRow icon={<Mail />} label="Email Principal" value={client.email_contacto || 'No registrado'} />
              <DataRow icon={<Phone />} label="Teléfono" value={client.telefono || 'No registrado'} />
              <DataRow icon={<CreditCard />} label="Condición Comercial" value={client.condicion_comercial} />
              <DataRow icon={<Calendar />} label="Registrado el" value={client.created_at ? new Date(client.created_at).toLocaleDateString() : '---'} />
              <DataRow icon={<FileText />} label="Giro" value={client.giro || 'No especificado'} />
            </div>
          </div>

          {/* ETIQUETAS */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <TagIcon className="w-3 h-3" /> Etiquetas del Cliente
            </h3>
            <div className="flex flex-wrap gap-2">
              {client.tags && client.tags.length > 0 ? (
                client.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-600 italic">Sin etiquetas asignadas</span>
              )}
            </div>
          </div>
        </div>
        
        {/* FOOTER */}
        <div className="p-6 bg-slate-950/40 border-t border-slate-800 flex justify-center">
           <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Resumen de Actividad - Comtec Industrial</p>
        </div>
      </div>
    </div>
  );
}

// --- SUBCOMPONENTES ---

// Gráfico SVG Personalizado Ultraligero
function SimpleBarChart({ data }: { data: { month: string, total: number }[] }) {
  const maxVal = Math.max(...data.map(d => d.total), 1); // Evitar división por cero

  return (
    <div className="w-full h-32 flex items-end justify-between gap-2 px-2">
      {data.map((item, idx) => {
        const heightPercent = (item.total / maxVal) * 100;
        const isZero = item.total === 0;
        
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
            {/* Tooltip simple */}
            <div className="opacity-0 group-hover:opacity-100 absolute -mt-8 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded transition-opacity pointer-events-none whitespace-nowrap z-10 border border-slate-700">
               ${item.total.toLocaleString('es-CL')}
            </div>
            
            {/* Barra */}
            <div className="w-full bg-slate-900 rounded-t-lg relative h-full flex items-end overflow-hidden">
               <div 
                 className={`w-full rounded-t-lg transition-all duration-1000 ${
                   isZero ? 'bg-slate-800/30' : 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                 }`}
                 style={{ height: isZero ? '4px' : `${heightPercent}%` }}
               />
            </div>
            
            {/* Etiqueta Eje X */}
            <span className={`text-[9px] font-bold uppercase tracking-wider ${isZero ? 'text-slate-700' : 'text-cyan-500'}`}>
              {item.month}
            </span>
          </div>
        )
      })}
    </div>
  );
}

function StatMiniCard({ label, value, icon, color, bgColor, loading }: any) {
  return (
    <div className={`p-4 rounded-2xl border border-slate-800/50 bg-slate-900/50 flex items-center gap-4 hover:border-slate-700 transition-colors`}>
      <div className={`p-2.5 rounded-xl ${bgColor} ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{label}</p>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-700 mt-1" />
        ) : (
          <p className={`text-lg font-mono font-bold ${color}`}>{value}</p>
        )}
      </div>
    </div>
  );
}

function DataRow({ icon, label, value }: any) {
  return (
    <div className="flex gap-3 py-1">
      <div className="mt-1 text-cyan-600">
        {React.cloneElement(icon, { size: 14 })}
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-slate-300 font-medium truncate max-w-[200px]" title={String(value)}>{value}</p>
      </div>
    </div>
  );
}