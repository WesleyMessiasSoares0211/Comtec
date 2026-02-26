import React from 'react';
import { Search, Filter, AlertTriangle, X } from 'lucide-react';

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  showLowStockOnly: boolean;
  onToggleLowStock: () => void;
  availableCategories: string[]; // <--- NUEVA PROP
}

export default function ProductFilters({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  showLowStockOnly,
  onToggleLowStock,
  availableCategories // <--- Usamos esto
}: Props) {

  // YA NO NECESITAMOS LA LISTA HARDCODED
  // const categories = ['Sensores', 'PLCs', ...]; <--- ELIMINADO

  return (
    <div className="flex flex-col md:flex-row gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 mb-6">
      
      {/* 1. BUSCADOR DE TEXTO */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input 
          type="text" 
          placeholder="Buscar por Nombre, Código (P/N) o Marca..." 
          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none placeholder:text-slate-600"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchTerm && (
          <button 
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-4">
        {/* 2. SELECTOR DE CATEGORÍA DINÁMICO */}
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-8 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none appearance-none cursor-pointer capitalize"
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="todos">Todas las Categorías</option>
            {/* Mapeamos las categorías que existen en la BBDD */}
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {/* Triángulo del select */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-500"></div>
        </div>

        {/* 3. TOGGLE STOCK CRÍTICO */}
        <button
          onClick={onToggleLowStock}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
            showLowStockOnly
              ? 'bg-orange-500/10 border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="hidden md:inline">{showLowStockOnly ? 'Viendo Críticos' : 'Ver Críticos'}</span>
          <span className="md:hidden">Stock</span>
        </button>
      </div>
    </div>
  );
}