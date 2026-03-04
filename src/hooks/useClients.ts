import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { clientService } from '../services/clientService';
import { Client } from '../types/client';

export function useClients() {
  const queryClient = useQueryClient();
  
  // Estados locales para el control de la tabla
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado interno para el Debounce
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Lógica de Debounce (Espera 500ms después de que el usuario deja de escribir)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Volver a la primera página si la búsqueda cambia
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 1. Query Paginada (Depende de page, pageSize y debouncedSearch)
  const clientsQuery = useQuery({
    queryKey: ['clients', page, pageSize, debouncedSearch],
    queryFn: async () => {
      return await clientService.getPaginated(page, pageSize, debouncedSearch);
    },
    placeholderData: keepPreviousData, // Mantiene datos antiguos mientras carga (UX fluida)
    staleTime: 1000 * 60 * 5, // Caché por 5 minutos
  });

  // 2. Query de Estadísticas (Independiente de la paginación)
  const statsQuery = useQuery({
    queryKey: ['clientStats'],
    queryFn: async () => {
      return await clientService.getStats();
    },
    staleTime: 1000 * 60 * 10,
  });

  const refreshClients = async () => {
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['clients'] }),
        queryClient.invalidateQueries({ queryKey: ['clientStats'] })
      ]);
    } catch (error) {
      console.error("Error al actualizar clientes:", error);
    }
  };

  return {
    // Datos Paginados
    clients: clientsQuery.data?.data || [],
    totalCount: clientsQuery.data?.count || 0,
    
    // Datos de Estadísticas
    stats: statsQuery.data || null,
    
    // Estados de Control
    page,
    setPage,
    pageSize,
    setPageSize,
    searchTerm,
    setSearchTerm,
    
    // Feedback de Carga y Errores
    loading: clientsQuery.isLoading || statsQuery.isLoading,
    isFetching: clientsQuery.isFetching,
    error: clientsQuery.error ? (clientsQuery.error as Error).message : null,
    
    // Acciones
    refreshClients
  };
}