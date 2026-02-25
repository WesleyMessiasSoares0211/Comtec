import { useState, useMemo, useEffect } from 'react';
import { useProducts } from './useProducts'; // Importamos el hook base existente
import { Product } from '../types/product';

const ITEMS_PER_PAGE = 10;

export function useProductCatalog() {
  // Obtenemos los datos crudos del hook base
  const availableCategories = useMemo(() => {
    if (!products) return [];
    // 1. Mapeamos solo las categorías
    // 2. Usamos Set para eliminar duplicados
    // 3. Convertimos de nuevo a Array y ordenamos alfabéticamente
    const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return uniqueCategories.sort();
  }, [products]);

  // Estados de UI para el Catálogo
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 1. CÁLCULOS DE ESTADÍSTICAS (Memorizados para no recalcular en cada render)
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

  // 2. FILTRADO DE DATOS (Búsqueda + Categoría + Stock)
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter(product => {
      // Filtro de Texto (Nombre, Código o Marca)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (product.name || '').toLowerCase().includes(searchLower) ||
        (product.part_number || '').toLowerCase().includes(searchLower) ||
        (product.brand || '').toLowerCase().includes(searchLower);

      // Filtro de Categoría
      const matchesCategory = categoryFilter === 'todos' || product.category === categoryFilter;

      // Filtro de Stock Bajo
      const matchesStock = !showLowStockOnly || (product.stock || 0) <= (product.min_stock || 0);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, categoryFilter, showLowStockOnly]);

  // 3. PAGINACIÓN
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  // Resetear a página 1 si cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, showLowStockOnly]);

  return {
    // Datos procesados
    products: paginatedProducts,
    allProductsCount: filteredProducts.length,
    stats,
    loading,
    error,
    
    // Paginación
    currentPage,
    totalPages,
    setCurrentPage,
    ITEMS_PER_PAGE,

    // Controles de Filtros
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    showLowStockOnly,
    setShowLowStockOnly,

    // Acciones
    refreshProducts,
    deleteProduct
  };
}