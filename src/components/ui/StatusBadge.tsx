import React from 'react';
import { QuoteStatus } from '../../types/quotes';

interface StatusBadgeProps {
  status: QuoteStatus | string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStyles = (s: string) => {
    switch (s) {
      case 'Aceptada': 
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Rechazada': 
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Facturada': 
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'En Produccion':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'Pendiente':
      default: 
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStyles(status)}`}>
      {status.toUpperCase()}
    </span>
  );
}