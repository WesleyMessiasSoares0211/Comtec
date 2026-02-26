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

  // Nueva función para eliminar con protección de historial
  const deleteProduct = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (deleteError) {
        // Código Postgres 23503 = Violación de llave foránea (El producto está en uso)
        if (deleteError.code === '23503') {
          toast.error("No se puede eliminar este producto", {
            description: "Este producto forma parte de cotizaciones históricas. Te recomendamos editarlo en su lugar.",
            duration: 5000,
          });
        } else {
          throw deleteError;
        }
        return;
      }

      // Si se eliminó correctamente en BD, actualizamos el estado local
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success("Producto eliminado correctamente");

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
    error, // Exportamos el error
    refreshProducts: fetchProducts,
    deleteProduct // Exportamos la acción de eliminar
  };
}