import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export function useDashboard() {
  const [metrics, setMetrics] = useState({
    monthlySales: 0,
    previousMonthSales: 0,
    pendingQuotes: 0,
    lowStockCount: 0,
    totalProducts: 0
  });
  
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      
      // 1. VENTAS ESTE MES (Estado = 'Aceptada' o 'Facturada')
      const { data: currentSales } = await supabase
        .from('crm_quotes')
        .select('total_bruto')
        .in('estado', ['Aceptada', 'Facturada'])
        .gte('created_at', startOfMonth(now).toISOString())
        .lte('created_at', endOfMonth(now).toISOString());

      const totalCurrent = currentSales?.reduce((sum, item) => sum + (item.total_bruto || 0), 0) || 0;

      // 2. VENTAS MES ANTERIOR (Para comparar)
      const lastMonth = subMonths(now, 1);
      const { data: lastSales } = await supabase
        .from('crm_quotes')
        .select('total_bruto')
        .in('estado', ['Aceptada', 'Facturada'])
        .gte('created_at', startOfMonth(lastMonth).toISOString())
        .lte('created_at', endOfMonth(lastMonth).toISOString());

      const totalLast = lastSales?.reduce((sum, item) => sum + (item.total_bruto || 0), 0) || 0;

      // 3. PENDIENTES (Oportunidades abiertas)
      const { count: pendingCount } = await supabase
        .from('crm_quotes')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'Pendiente');

      // 4. INVENTARIO (Stock Crítico)
      // Nota: Traemos todos para filtrar en JS si la lógica de stock mínimo es compleja,
      // o usamos RPC si son muchos datos. Por ahora JS es seguro para <1000 items.
      const { data: products } = await supabase
        .from('products')
        .select('stock, min_stock');
      
      const lowStock = products?.filter(p => (p.stock || 0) <= (p.min_stock || 0)).length || 0;

      // 5. ACTIVIDAD RECIENTE (Últimas 5 cotizaciones)
      const { data: recent } = await supabase
        .from('crm_quotes')
        .select(`
          id, folio, created_at, total_bruto, estado,
          client:crm_clients(razon_social)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setMetrics({
        monthlySales: totalCurrent,
        previousMonthSales: totalLast,
        pendingQuotes: pendingCount || 0,
        lowStockCount: lowStock,
        totalProducts: products?.length || 0
      });

      setRecentActivity(recent || []);

    } catch (error) {
      console.error('Error dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { metrics, recentActivity, loading, refresh: fetchDashboardData };
}