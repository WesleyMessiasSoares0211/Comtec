import { useState, useMemo, useEffect } from 'react';
import { useProducts } from './useProducts';

const ITEMS_PER_PAGE = 10;

export function useProductCatalog() {
  const { products, loading, error, refreshProducts, deleteProduct } = useProducts();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(''); // Estado interno para el Debounce
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Helper para obtener la categoría de forma segura
  const getCategory = (p: any): string => {
    return p.main_category || p.category || '';
  };

  // 1. LÓGICA DE DEBOUNCE (Espera 500ms tras dejar de teclear)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Volvemos a la primera página si la búsqueda cambia
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 2. CÁLCULOS DE ESTADÍSTICAS
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

  // 3. EXTRAER CATEGORÍAS
  const availableCategories = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    const unique = new Set(
      products
        .map(p => getCategory(p))
        .filter(c => c && c.trim() !== '')
    );
    return Array.from(unique).sort();
  }, [products]);

  // 4. FILTRADO (Ahora usamos debouncedSearch en lugar de searchTerm)
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter(product => {
      // Filtro de Texto (Aplica el debounce)
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch = 
        (product.name || '').toLowerCase().includes(searchLower) ||
        (product.part_number || '').toLowerCase().includes(searchLower) ||
        (product.brand || '').toLowerCase().includes(searchLower);

      // Filtro de Categoría
      const prodCat = getCategory(product);
      const matchesCategory = categoryFilter === 'todos' || prodCat === categoryFilter;

      // Filtro de Stock
      const matchesStock = !showLowStockOnly || (product.stock || 0) <= (product.min_stock || 0);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, debouncedSearch, categoryFilter, showLowStockOnly]);

  // 5. PAGINACIÓN
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;

  // Resetear paginación al cambiar otros filtros
  useEffect(() => { setCurrentPage(1); }, [categoryFilter, showLowStockOnly]);

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