import React from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, FileText, 
  AlertTriangle, Package, Clock, ArrowRight 
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { metrics, recentActivity, loading } = useDashboard();

  if (loading) {
    return (
      <div className="p-8 animate-pulse space-y-8">
        <div className="h-8 bg-slate-800 w-1/4 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-800 rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  // Calculamos crecimiento vs mes anterior
  const growth = metrics.previousMonthSales > 0 
    ? ((metrics.monthlySales - metrics.previousMonthSales) / metrics.previousMonthSales) * 100 
    : 100;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Panel de Control</h1>
        <p className="text-slate-400 text-sm">Resumen general de tu operación hoy.</p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. VENTAS DEL MES */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-16 h-16 text-cyan-500" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase">Ventas (Mes)</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            ${metrics.monthlySales.toLocaleString('es-CL')}
          </h3>
          <div className={`text-xs font-medium flex items-center gap-1 ${growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(growth).toFixed(1)}% vs mes anterior
          </div>
        </div>

        {/* 2. COTIZACIONES PENDIENTES */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText className="w-16 h-16 text-amber-500" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase">Por Cerrar</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {metrics.pendingQuotes}
          </h3>
          <p className="text-xs text-slate-500">Cotizaciones en estado Pendiente</p>
        </div>

        {/* 3. ALERTAS DE STOCK */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-red-500/30 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="w-16 h-16 text-red-500" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase">Stock Crítico</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {metrics.lowStockCount}
          </h3>
          <p className="text-xs text-slate-500">Productos bajo stock mínimo</p>
        </div>

        {/* 4. TOTAL PRODUCTOS */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Package className="w-16 h-16 text-blue-500" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase">Inventario</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {metrics.totalProducts}
          </h3>
          <p className="text-xs text-slate-500">SKUs activos en catálogo</p>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: TABLA Y ACCESOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TABLA DE ACTIVIDAD RECIENTE (Ocupa 2 columnas) */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              Últimas Cotizaciones
            </h3>
            <Link to="/quotes" className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1">
              Ver Todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-xs font-bold text-slate-500 uppercase border-b border-slate-800 text-left">
                <tr>
                  <th className="pb-3 pl-2">Folio</th>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3 text-right">Monto</th>
                  <th className="pb-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentActivity.map((quote) => (
                  <tr key={quote.id} className="group hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pl-2 font-mono text-sm text-white group-hover:text-cyan-400">
                      {quote.folio}
                    </td>
                    <td className="py-3 text-sm text-slate-300">
                      {quote.client?.razon_social}
                    </td>
                    <td className="py-3 text-sm text-slate-300 text-right font-mono">
                      ${(quote.total_bruto || 0).toLocaleString('es-CL')}
                    </td>
                    <td className="py-3 text-center">
                       <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                          quote.estado === 'Aceptada' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          quote.estado === 'Pendiente' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                          'bg-slate-800 text-slate-400 border-slate-700'
                       }`}>
                          {quote.estado}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentActivity.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-sm italic">
                No hay actividad reciente.
              </div>
            )}
          </div>
        </div>

        {/* ACCESOS RÁPIDOS (Ocupa 1 columna) */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4">Accesos Rápidos</h3>
            <div className="space-y-3">
              <Link to="/quotes/new" className="block w-full p-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-center font-bold shadow-lg shadow-cyan-900/20 transition-all active:scale-[0.98]">
                + Nueva Cotización
              </Link>
              <Link to="/products/new" className="block w-full p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-center font-medium border border-slate-700 transition-all">
                + Nuevo Producto
              </Link>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4">Salud del Sistema</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Base de Datos</span>
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Conectado
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Módulo PDF</span>
                <span className="text-slate-300 text-xs">v2.1 (Activo)</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}