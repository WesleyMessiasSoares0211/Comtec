import { ClientStats } from '../../types/client';
import { Users, UserPlus, Trophy, TrendingUp } from 'lucide-react';

interface Props {
  stats: ClientStats | null;
  loading: boolean;
}

export default function ClientStatsBoard({ stats, loading }: Props) {
  if (loading || !stats) return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-900/50 rounded-xl border border-slate-800" />)}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      
      {/* Card 1: Total Activos */}
      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center gap-4 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
        <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="p-3 bg-blue-500/10 rounded-lg shrink-0">
          <Users className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cartera Activa</p>
          <p className="text-2xl font-black text-slate-200 mt-0.5">{stats.totalActive}</p>
        </div>
      </div>

      {/* Card 2: Nuevos Mes */}
      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center gap-4 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
        <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="p-3 bg-emerald-500/10 rounded-lg shrink-0">
          <UserPlus className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nuevos (Mes)</p>
          <p className="text-2xl font-black text-slate-200 mt-0.5">+{stats.newThisMonth}</p>
        </div>
      </div>

      {/* Card 3: Top Cliente */}
      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center gap-4 relative overflow-hidden group hover:border-amber-500/30 transition-colors md:col-span-1">
        <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="p-3 bg-amber-500/10 rounded-lg shrink-0">
          <Trophy className="w-6 h-6 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cliente Top Ventas</p>
          {stats.topClients.length > 0 ? (
            <div>
               <p className="text-sm font-bold text-slate-200 truncate">{stats.topClients[0].razon_social}</p>
               <p className="text-xs font-mono text-amber-400/90 font-bold">${stats.topClients[0].totalAmount.toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Sin datos de ventas</p>
          )}
        </div>
      </div>
    </div>
  );
}