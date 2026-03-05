import React, { useState } from 'react';
import { 
  TrendingUp, Activity, DollarSign, Users, 
  AlertTriangle, ShieldAlert, CheckCircle, Clock, 
  ChevronRight, ArrowUpRight, ArrowDownRight, UserPlus
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function DashboardView() {
  const { canManageUsers } = useAuth(); // Usamos esto para identificar al Admin
  const [activeTab, setActiveTab] = useState<'pendientes' | 'resueltas'>('pendientes');

  // Datos simulados para la maqueta visual (Luego vendrán de Supabase)
  const stats = [
    { label: "Pipeline Activo (Cotizado)", value: "$124.5M", trend: "+12%", up: true, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Tasa de Conversión", value: "32.4%", trend: "+2.1%", up: true, icon: Activity, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Cotizaciones en Espera", value: "18", trend: "-3", up: false, icon: Clock, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Nuevos Clientes (Mes)", value: "5", trend: "+1", up: true, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
  ];

  const adminAlerts = [
    { 
      id: 1, 
      type: 'margin', 
      title: 'Aprobación de Margen Requerida', 
      desc: 'Cotización COT-2026-008 (Minera Escondida) tiene un margen del 12% (Mínimo permitido: 15%). Emitida por: Vendedor 1.', 
      time: 'Hace 2 horas',
      icon: AlertTriangle,
      color: 'text-orange-500',
      border: 'border-orange-500/30'
    },
    { 
      id: 2, 
      type: 'delay', 
      title: 'Alerta de Despacho (P-102)', 
      desc: 'Pedido interno P-102 para Proyecto Centinela presenta 2 días de atraso logístico en integración.', 
      time: 'Hace 5 horas',
      icon: Clock,
      color: 'text-red-500',
      border: 'border-red-500/30'
    },
    { 
      id: 3, 
      type: 'security', 
      title: 'Solicitud de Acceso al Sistema', 
      desc: 'Nuevo registro detectado: jperez@comtec.cl requiere asignación de rol y permisos para acceder al directorio.', 
      time: 'Ayer',
      icon: UserPlus,
      color: 'text-cyan-500',
      border: 'border-cyan-500/30'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. CABECERA */}
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          Centro de Comando <span className="text-sm font-normal px-3 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700">Q1 - 2026</span>
        </h2>
        <p className="text-slate-400 mt-1">Visión general del negocio y alertas operativas.</p>
      </div>

      {/* 2. KPIs GLOBALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className={`flex items-center gap-1 text-xs font-bold ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.trend}
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">{stat.value}</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 3. CENTRO DE ACCIÓN (Prioridad para Admins) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-cyan-500" />
              Bandeja de Autorizaciones
            </h3>
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
              <button 
                onClick={() => setActiveTab('pendientes')}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'pendientes' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Pendientes ({adminAlerts.length})
              </button>
              <button 
                onClick={() => setActiveTab('resueltas')}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'resueltas' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Resueltas
              </button>
            </div>
          </div>

          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
            {!canManageUsers ? (
              // Vista de Vendedor (Vacía por ahora, motivacional)
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <CheckCircle className="w-12 h-12 text-emerald-500/50 mb-3" />
                <h4 className="text-slate-300 font-bold">Todo al día</h4>
                <p className="text-slate-500 text-sm mt-1">No tienes alertas pendientes ni seguimientos urgentes.</p>
              </div>
            ) : activeTab === 'pendientes' ? (
              // Vista de Admin (Acciones Críticas)
              <div className="divide-y divide-slate-800/50">
                {adminAlerts.map(alert => (
                  <div key={alert.id} className="p-5 hover:bg-slate-800/30 transition-colors group">
                    <div className="flex gap-4">
                      <div className={`p-3 rounded-full border bg-slate-950 shrink-0 ${alert.border}`}>
                        <alert.icon className={`w-5 h-5 ${alert.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="text-slate-200 font-bold text-sm group-hover:text-cyan-400 transition-colors">{alert.title}</h4>
                          <span className="text-[10px] text-slate-500 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">{alert.time}</span>
                        </div>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">{alert.desc}</p>
                        
                        {/* Botones de Acción contextuales */}
                        <div className="mt-3 flex gap-2">
                          <button className="text-xs font-bold bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                            Revisar Detalles
                          </button>
                          {alert.type === 'margin' && (
                            <button className="text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors">
                              Aprobar Excepción
                            </button>
                          )}
                          {alert.type === 'security' && (
                            <button className="text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1.5 rounded-lg hover:bg-cyan-500/20 transition-colors">
                              Configurar Perfil
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm">
                El historial de acciones resueltas está limpio.
              </div>
            )}
          </div>
        </div>

        {/* 4. WIDGET SECUNDARIO (Ej: Top Clientes / Actividad Reciente) */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Top Clientes (Mes)
          </h3>
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-4 space-y-4">
            {/* Lista mock de clientes top */}
            {[
              { name: 'Minera Escondida', amount: '$45.2M', quotes: 12 },
              { name: 'Antofagasta Minerals', amount: '$28.1M', quotes: 5 },
              { name: 'Codelco Norte', amount: '$15.9M', quotes: 8 },
              { name: 'SQM Salar', amount: '$8.4M', quotes: 3 },
            ].map((c, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer group">
                <div>
                  <h4 className="text-slate-200 text-sm font-bold group-hover:text-cyan-400 transition-colors">{c.name}</h4>
                  <p className="text-slate-500 text-xs mt-0.5">{c.quotes} cotizaciones activas</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-mono font-bold text-sm">{c.amount}</span>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-500 transition-colors" />
                </div>
              </div>
            ))}
            <button className="w-full py-3 mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-t border-slate-800 hover:text-cyan-400 transition-colors">
              Ver Reporte Completo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}