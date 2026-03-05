import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types/product';
import { toast } from 'sonner';
import { productService } from '../services/productService';

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

  // Función de eliminar actualizada y conectada a productService
  const deleteProduct = async (id: string) => {
    try {
      // 1. Llamamos a nuestro servicio blindado (Postgres + Storage)
      await productService.delete(id);
      
      // 2. Si pasa sin arrojar error, mostramos éxito
      toast.success("Producto eliminado correctamente");
      
      // 3. RECARGA COMPLETA: Volvemos a pedir los datos a la DB para asegurar sincronía
      await fetchProducts(); 

    } catch (err: any) {
      console.error("Error eliminando:", err);
      
      // Manejo de error específico de llave foránea (usado en cotizaciones)
      if (err?.code === '23503') {
        toast.error("No se puede eliminar este producto", {
          description: "Este producto forma parte de cotizaciones históricas. Te recomendamos editarlo u ocultarlo.",
          duration: 5000,
        });
      } else {
        // Cualquier otro error (ej: permisos, red)
        toast.error("Error al eliminar", { description: err?.message || 'Error desconocido' });
      }
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