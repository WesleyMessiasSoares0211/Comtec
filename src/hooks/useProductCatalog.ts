import { useState, useMemo, useEffect } from 'react';
import { useProducts } from './useProducts';
import { Product } from '../types/product';

const ITEMS_PER_PAGE = 10;

export function useProductCatalog() {
  const { products, loading, error, refreshProducts, deleteProduct } = useProducts();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 1. CÁLCULOS DE ESTADÍSTICAS
  const stats = useMemo(() => {
    // Protección: Si products es null/undefined, devolvemos ceros
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

  // 2. EXTRAER CATEGORÍAS (NUEVO y BLINDADO)
  const availableCategories = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    // Obtenemos categorías únicas no vacías
    const unique = new Set(
      products
        .map(p => p.category)
        .filter(c => c && typeof c === 'string' && c.trim() !== '')
    );
    return Array.from(unique).sort();
  }, [products]);

  // 3. FILTRADO
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter(product => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (product.name || '').toLowerCase().includes(searchLower) ||
        (product.part_number || '').toLowerCase().includes(searchLower) ||
        (product.brand || '').toLowerCase().includes(searchLower);

      const matchesCategory = categoryFilter === 'todos' || product.category === categoryFilter;
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
    availableCategories, // <--- Importante: Esto se envía a la vista
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