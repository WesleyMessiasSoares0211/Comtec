import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types/product'; // Asegúrate de que este tipo exista, si no, usa 'any' temporalmente
import { toast } from 'sonner';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      // Seleccionamos todo, incluyendo la columna datasheet_url
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.error('No se pudo cargar el catálogo de productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { 
    products, 
    loading, 
    refreshProducts: fetchProducts 
  };
}