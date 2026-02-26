import { useState, useMemo, useEffect } from 'react';
import { useProducts } from './useProducts';
// No necesitamos importar Product explícitamente si usamos inferencia, 
// pero lo mantenemos por buenas prácticas.

const ITEMS_PER_PAGE = 10;

export function useProductCatalog() {
  const { products, loading, error, refreshProducts, deleteProduct } = useProducts();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Helper para obtener la categoría de forma segura (soporta main_category o category)
  const getCategory = (p: any): string => {
    // Intenta leer 'main_category', si no existe, usa 'category', si no, string vacío
    return p.main_category || p.category || '';
  };

  // 1. CÁLCULOS DE ESTADÍSTICAS
  const stats = useMemo(() => {
    if (!products) return { totalSku: 0, totalValue: 0, criticalStock: 0 };

    return products.reduce((acc, product) => {
      const price = product.price || 0;
      const stock = product.stock || 0;
      const minStock = product.min_stock || 0;

      acc.totalSku++;
      acc.totalValue += price * stock;
      if (stock <= minStock) acc.criticalStock++;
      return acc;
    }, { totalSku: 0, totalValue: 0, criticalStock: 0 });
  }, [products]);

  // 2. EXTRAER CATEGORÍAS (CORREGIDO PARA DETECTAR main_category)
  const availableCategories = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    const unique = new Set(
      products
        .map(p => getCategory(p)) // Usamos el helper para obtener el valor correcto
        .filter(c => c && c.trim() !== '') // Filtramos vacíos
    );
    return Array.from(unique).sort();
  }, [products]);

  // 3. FILTRADO
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter(product => {
      // Filtro de Texto
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (product.name || '').toLowerCase().includes(searchLower) ||
        (product.part_number || '').toLowerCase().includes(searchLower) ||
        (product.brand || '').toLowerCase().includes(searchLower);

      // Filtro de Categoría (CORREGIDO)
      const prodCat = getCategory(product); // Usamos el mismo helper
      const matchesCategory = categoryFilter === 'todos' || prodCat === categoryFilter;

      // Filtro de Stock
      const matchesStock = !showLowStockOnly || (product.stock || 0) <= (product.min_stock || 0);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, categoryFilter, showLowStockOnly]);

  // 4. PAGINACIÓN
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, categoryFilter, showLowStockOnly]);

  return {
    products: paginatedProducts,
    allProductsCount: filteredProducts.length,
    availableCategories,
    stats,
    loading,
    error,
    currentPage,
    totalPages,
    setCurrentPage,
    ITEMS_PER_PAGE,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    showLowStockOnly,
    setShowLowStockOnly,
    refreshProducts,
    deleteProduct
  };
}