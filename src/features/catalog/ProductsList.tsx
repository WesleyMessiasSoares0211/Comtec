import React from 'react';
import { Loader2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Product } from '../../types/product';

// Importamos nuestras nuevas piezas modulares
import { useProductCatalog } from '../../hooks/useProductCatalog';
import ProductStats from './ProductStats';
import ProductFilters from './ProductFilters';
import ProductTable from './ProductTable';

interface Props {
  onEditProduct: (product: Product) => void;
}

export default function ProductsList({ onEditProduct }: Props) {
  // Usamos nuestro "Cerebro" (Hook) para obtener todo lo necesario
  const {
    products, 
    stats, 
    loading, 
    error,
    
    // Filtros
    searchTerm, setSearchTerm,
    categoryFilter, setCategoryFilter,
    showLowStockOnly, setShowLowStockOnly,
    
    // Paginación
    currentPage, totalPages, setCurrentPage,
    
    // Acciones
    deleteProduct,
    refreshProducts
  } = useProductCatalog();

  // Estado de Carga Inicial
  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Cargando Inventario...</p>
      </div>
    );
  }

  // Estado de Error
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-white font-bold mb-2">Error al cargar productos</h3>
        <p className="text-red-400 text-sm mb-4">{error}</p>
        <button 
          onClick={refreshProducts}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. TARJETAS DE ESTADÍSTICAS */}
      <ProductStats 
        totalSku={stats.totalSku} 
        totalValue={stats.totalValue} 
        criticalStock={stats.criticalStock} 
      />

      {/* 2. BARRA DE FILTROS */}
      <ProductFilters 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        showLowStockOnly={showLowStockOnly}
        onToggleLowStock={() => setShowLowStockOnly(!showLowStockOnly)}
      />

      {/* 3. TABLA DE DATOS */}
      <ProductTable 
        products={products}
        onEdit={onEditProduct}
        onDelete={deleteProduct}
      />

      {/* 4. CONTROLES DE PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 bg-slate-800 rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-colors text-slate-300 hover:text-white disabled:hover:text-slate-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="text-sm text-slate-500 font-mono">
            Página <span className="text-cyan-400 font-bold">{currentPage}</span> de {totalPages}
          </span>

          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 bg-slate-800 rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-colors text-slate-300 hover:text-white disabled:hover:text-slate-500"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}