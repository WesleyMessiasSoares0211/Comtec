import React from 'react';
import { Plus } from 'lucide-react';
import QuotesList from '../features/quotes/QuotesList'; // Asegúrate de que esta ruta sea correcta
// Si QuotesList.tsx está en src/features/quotes/QuotesList.tsx

export default function Quotes() {
  
  const handleCreateRevision = (quote: any) => {
    // Aquí implementaremos la lógica de revisión más adelante o redirigiremos
    console.log("Crear revisión para:", quote);
    // navigate('/quotes/new', { state: { parentQuote: quote } });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER DE LA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Cotizaciones</h1>
          <p className="text-slate-400 text-sm">Historial completo y estado de documentos.</p>
        </div>
        
        {/* Este botón podría abrir un modal o redirigir al constructor de cotizaciones */}
        <button 
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-cyan-900/20 flex items-center gap-2 transition-all active:scale-95"
          onClick={() => alert("El módulo 'Crear Cotización' se implementará en el siguiente paso")}
        >
          <Plus className="w-4 h-4" />
          Nueva Cotización
        </button>
      </div>

      {/* CONTENIDO: EL COMPONENTE QUE YA HICIMOS */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-1">
        <QuotesList 
           onCreateRevision={handleCreateRevision}
        />
      </div>
    </div>
  );
}