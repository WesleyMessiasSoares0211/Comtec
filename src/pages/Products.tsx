import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import ProductsList from '../features/catalog/ProductsList';
import ProductsForm from '../features/catalog/ProductsForm';
import { Product } from '../types/product';

export default function Products() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Para forzar recarga si es necesario

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(undefined);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    setEditingProduct(undefined);
    setRefreshTrigger(prev => prev + 1); // Disparador para refrescar lista
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Catálogo de Productos</h1>
          <p className="text-slate-400 text-sm">Administración de inventario y precios.</p>
        </div>
        
        <button 
          onClick={handleCreate}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-cyan-900/20 flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </button>
      </div>

      {/* LISTADO PRINCIPAL */}
      <ProductsList key={refreshTrigger} onEditProduct={handleEdit} />

      {/* MODAL DE CREACIÓN/EDICIÓN */}
      {isModalOpen && (
        <ProductsForm 
          initialData={editingProduct || undefined} // Pasamos undefined si es nuevo
          onClose={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}