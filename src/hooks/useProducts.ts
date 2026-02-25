import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types/product';
import { toast } from 'sonner';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: dbError } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (dbError) throw dbError;

      setProducts(data || []);
    } catch (err: any) {
      console.error('Error cargando productos:', err);
      setError(err.message || 'Error desconocido');
      toast.error('No se pudo cargar el catálogo de productos');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProduct = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (deleteError) {
        if (deleteError.code === '23503') {
          toast.error("No se puede eliminar este producto", {
            description: "Este producto forma parte de cotizaciones históricas. Te recomendamos editarlo.",
            duration: 5000,
          });
        } else {
          throw deleteError;
        }
        return;
      }

      toast.success("Producto eliminado correctamente");
      
      // CORRECCIÓN CLAVE: Actualización Optimista
      // En lugar de recargar todo (lento), quitamos el ítem de la lista localmente (instantáneo)
      setProducts(prev => prev.filter(item => item.id !== id));

    } catch (err: any) {
      console.error("Error eliminando:", err);
      toast.error("Error al eliminar", { description: err.message });
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { 
    products, 
    loading, 
    error,
    refreshProducts: fetchProducts,
    deleteProduct 
  };
}