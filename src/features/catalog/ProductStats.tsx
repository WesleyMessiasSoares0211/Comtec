import React from 'react';
import { Package, DollarSign, Star } from 'lucide-react';
import Card from '../../components/ui/Card';

interface Props {
  totalSku: number;
  totalValue: number;
  featuredCount: number; // Reemplazamos criticalStock por los destacados
}

export default function ProductStats({ totalSku, totalValue, featuredCount }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Tarjeta 1: Total SKU */}
      <Card gradient="blue">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl shadow-inner">
            <Package className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Ítems (SKU)</p>
            <h3 className="text-2xl font-black text-white tracking-tight">{totalSku}</h3>
          </div>
        </div>
      </Card>

      {/* Tarjeta 2: Valor Referencial del Catálogo */}
      <Card gradient="emerald">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shadow-inner">
            <DollarSign className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Valorización Base Catálogo</p>
            <h3 className="text-2xl font-black text-white tracking-tight font-mono">
              ${totalValue.toLocaleString('es-CL')}
            </h3>
          </div>
        </div>
      </Card>

      {/* Tarjeta 3: Productos Destacados */}
      <Card gradient="orange">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl shadow-inner">
            <Star className="w-8 h-8 text-orange-400 fill-orange-400/20" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Ítems Estratégicos (VIP)</p>
            <h3 className="text-2xl font-black text-orange-400 tracking-tight">
              {featuredCount} <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Destacados</span>
            </h3>
          </div>
        </div>
      </Card>
      
    </div>
  );
}