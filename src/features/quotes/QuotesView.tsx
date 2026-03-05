import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import QuoteBuilder from './QuoteBuilder';
import QuotesList from './QuotesList';
import type { Client } from '../../types/client';

export default function QuotesView() {
  const [showQuoteBuilder, setShowQuoteBuilder] = useState(false);
  const [quoteToRevise, setQuoteToRevise] = useState<any>(null);
  const [quoteFilterClient, setQuoteFilterClient] = useState<Client | null>(null);

  const handleCreateRevision = (quote: any) => {
    setQuoteToRevise(quote);      
    setShowQuoteBuilder(true);    
  };

  const handleQuoteSuccess = () => {
    setShowQuoteBuilder(false);
    setQuoteToRevise(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Ofertas Comerciales</h2>
          <p className="text-slate-400 mt-1">
            {quoteFilterClient ? `Historial de ${quoteFilterClient.razon_social}` : 'Gestión y emisión de presupuestos'}
          </p>
        </div>
        <button 
          onClick={() => {
            setShowQuoteBuilder(!showQuoteBuilder);
            setQuoteToRevise(null);
          }} 
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-cyan-500/25 hover:translate-y-[-2px] transition-all"
        >
          {showQuoteBuilder ? 'Ver Historial' : <><Plus className="w-5 h-5" /> Crear Cotización</>}
        </button>
      </div>
      
      {showQuoteBuilder ? (
        <QuoteBuilder 
          initialData={quoteToRevise}
          onSuccess={handleQuoteSuccess}
        />
      ) : (
        <QuotesList 
          selectedClient={quoteFilterClient} 
          onClearFilter={() => setQuoteFilterClient(null)} 
          onCreateRevision={handleCreateRevision}
        />
      )}
    </div>
  );
}