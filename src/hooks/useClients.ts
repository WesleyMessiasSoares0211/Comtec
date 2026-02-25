import { useState } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { clientService } from '../services/clientService';
import { Client } from '../types/client';

export function useClients() {
  const queryClient = useQueryClient();
  
  // Estados locais para controle da tabela
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Padrão 10 itens por página
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Query Paginada (Depende de page, pageSize e searchTerm)
  const clientsQuery = useQuery({
    queryKey: ['clients', page, pageSize, searchTerm],
    queryFn: async () => {
      return await clientService.getPaginated(page, pageSize, searchTerm);
    },
    placeholderData: keepPreviousData, // Mantém dados antigos enquanto carrega os novos (UX fluida)
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // 2. Query de Estatísticas (Independente da paginação)
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
      console.error("Erro ao atualizar clientes:", error);
    }
  };

  return {
    // Dados Paginados
    clients: clientsQuery.data?.data || [],
    totalCount: clientsQuery.data?.count || 0,
    
    // Dados de Estatísticas
    stats: statsQuery.data || null,
    
    // Estados de Controle
    page,
    setPage,
    pageSize,
    setPageSize,
    searchTerm,
    setSearchTerm, // O componente deve usar debounce ao setar isso
    
    // Feedback
    loading: clientsQuery.isLoading || statsQuery.isLoading,
    isFetching: clientsQuery.isFetching, // Útil para mostrar spinner pequeno ao mudar página
    error: clientsQuery.error ? (clientsQuery.error as Error).message : null,
    
    // Ações
    refreshClients
  };
}