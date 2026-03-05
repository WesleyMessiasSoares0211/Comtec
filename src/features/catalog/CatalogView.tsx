import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import ProductsForm from './ProductsForm';
import ProductsList from './ProductsList';
import { useAuth } from '../../hooks/useAuth';
import type { Product } from '../../types/product';

export default function CatalogView() {
  const [showProductForm, setShowProductForm] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const { canManageProducts } = useAuth();

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setShowProductForm(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Catálogo Técnico</h2>
          <p className="text-slate-400 mt-1">Gestión de inventario y fichas de producto</p>
        </div>
        {canManageProducts && (
          <button 
            onClick={() => { setProductToEdit(null); setShowProductForm(!showProductForm); }} 
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-500/25 hover:translate-y-[-2px] transition-all"
          >
            {showProductForm ? 'Ver Catálogo' : <><Plus className="w-5 h-5" /> Catalogar Producto</>}
          </button>
        )}
      </div>
      
      {showProductForm ? (
        <div className="max-w-4xl">
          <ProductsForm 
            initialData={productToEdit} 
            onSuccess={() => { setShowProductForm(false); setProductToEdit(null); }} 
            onCancel={() => { setShowProductForm(false); setProductToEdit(null); }} 
          />
        </div>
      ) : (
        <ProductsList onEditProduct={handleEditProduct} />
      )}
    </div>
  );
}