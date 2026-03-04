import React, { useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { Product } from '../../types/product';
import { useProductCatalog } from '../../hooks/useProductCatalog';
import ProductStats from './ProductStats';
import ProductFilters from './ProductFilters';
import ProductTable from './ProductTable';
import { PasswordDeleteModal } from '../../components/ui/SecurityModals';

// NUEVA IMPORTACIÓN: Traemos el hook de autenticación
import { useAuth } from '../../hooks/useAuth';

interface Props {
  onEditProduct: (product: Product) => void;
}

export default function ProductsList({ onEditProduct }: Props) {
  const {
    products, stats, availableCategories, loading, error,
    searchTerm, setSearchTerm,
    categoryFilter, setCategoryFilter,
    showLowStockOnly, setShowLowStockOnly,
    currentPage, totalPages, setCurrentPage,
    deleteProduct, refreshProducts
  } = useProductCatalog();

  // NUEVA LÍNEA: Obtenemos el permiso para gestionar productos
  const { canManageProducts } = useAuth();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const onRequestDelete = (id: string) => {
    const product = products?.find(p => p.id === id);
    if (product) {
      setProductToDelete(product);
      setDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(true);
    await deleteProduct(productToDelete.id);
    
    setIsDeleting(false);
    setDeleteModalOpen(false);
    setProductToDelete(null);
  };

  if (loading && (!products || products.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Cargando Inventario...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-white font-bold mb-2">Error al cargar productos</h3>
        <p className="text-red-400 text-sm mb-4">{error}</p>
        <button onClick={refreshProducts} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm">Reintentar</button>
      </div>
    );
  }

  // Modificamos cómo se pasa la función onEdit y onDelete a la tabla
  // Si el usuario no tiene permisos, pasamos undefined para que la tabla no renderice las acciones
  const tableOnEdit = canManageProducts ? onEditProduct : undefined;
  const tableOnDelete = canManageProducts ? onRequestDelete : undefined;

  return (
    <div className="space-y-6">
      <ProductStats totalSku={stats.totalSku} totalValue={stats.totalValue} criticalStock={stats.criticalStock} />

      <ProductFilters 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        showLowStockOnly={showLowStockOnly}
        onToggleLowStock={() => setShowLowStockOnly(!showLowStockOnly)}
        availableCategories={availableCategories || []}
      />

      <ProductTable 
        products={products || []}
        // Pasamos las funciones condicionadas por el rol
        onEdit={tableOnEdit}
        onDelete={tableOnDelete} 
      />

      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 bg-slate-800 rounded-lg disabled:opacity-50 hover:bg-slate-700 text-slate-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="text-sm text-slate-500 font-mono">
            Página <span className="text-cyan-400 font-bold">{currentPage}</span> de {totalPages}
          </span>

          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 bg-slate-800 rounded-lg disabled:opacity-50 hover:bg-slate-700 text-slate-300"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* El modal se renderiza igual, pero solo se podrá abrir si canManageProducts es true */}
      <PasswordDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        itemName={productToDelete?.name}
      />
    </div>
  );
}