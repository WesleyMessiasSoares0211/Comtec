import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, TrendingUp, Package } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="relative isolate overflow-hidden bg-slate-950 min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-4xl mx-auto py-24">
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-6 tracking-tighter">
          CRM Industrial v2
        </h1>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Plataforma centralizada para gestión de activos, cotizaciones técnicas y automatización comercial.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Link 
            to="/login" 
            className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-2xl shadow-lg shadow-cyan-900/20 transition-all active:scale-95"
          >
            Ingresar al Sistema
          </Link>
          <Link 
            to="/catalog" 
            className="px-8 py-4 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-2xl transition-all"
          >
            Ver Catálogo Público
          </Link>
        </div>
      </div>
    </div>
  );
}