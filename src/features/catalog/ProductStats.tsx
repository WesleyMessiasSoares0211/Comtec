import React from 'react';
import { Package, DollarSign, AlertTriangle } from 'lucide-react';
import Card from '../../components/ui/Card';

interface Props {
  totalSku: number;
  totalValue: number;
  criticalStock: number;
}

export default function ProductStats({ totalSku, totalValue, criticalStock }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Tarjeta 1: Total SKU */}
      <Card gradient="blue">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <Package className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Total Items (SKU)</p>
            <h3 className="text-2xl font-bold text-white">{totalSku}</h3>
          </div>
        </div>
      </Card>

      {/* Tarjeta 2: Valorizado */}
      <Card gradient="emerald">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-xl">
            <DollarSign className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Inventario Valorizado</p>
            <h3 className="text-2xl font-bold text-white">
              ${totalValue.toLocaleString('es-CL')}
            </h3>
          </div>
        </div>
      </Card>

      {/* Tarjeta 3: Stock Crítico */}
      <Card gradient={criticalStock > 0 ? "orange" : "slate"}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${criticalStock > 0 ? 'bg-orange-500/20' : 'bg-slate-700/50'}`}>
            <AlertTriangle className={`w-8 h-8 ${criticalStock > 0 ? 'text-orange-400' : 'text-slate-400'}`} />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Stock Crítico</p>
            <h3 className={`text-2xl font-bold ${criticalStock > 0 ? 'text-orange-400' : 'text-white'}`}>
              {criticalStock} <span className="text-sm font-normal text-slate-500">productos</span>
            </h3>
          </div>
        </div>
      </Card>
      
    </div>
  );
}