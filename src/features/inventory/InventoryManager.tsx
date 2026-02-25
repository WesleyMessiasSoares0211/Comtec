import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Package, Edit, Trash2, Loader2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import GradientButton from '../../components/ui/GradientButton';
import { productService } from '../../services/productService';
import { Product, ItemType } from '../../types/product';

export default function InventoryManager() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ItemType | 'todos'>('todos');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setItems(data || []);
    } catch (error) {
      console.error("Error al cargar el inventario:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeStyles = (type?: ItemType) => {
    switch (type) {
      case 'materia_prima':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'producto_final':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'insumo':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'servicio_maquinaria':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const formatTypeLabel = (type?: ItemType) => {
    if (!type) return 'Sin Clasificar';
    return type.replace('_', ' ').toUpperCase();
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.part_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'todos' || item.tipo_item === typeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER Y CONTROLES */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Inventario y Catálogo
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestión de productos finales, materias primas y servicios.
          </p>
        </div>
        
        <GradientButton icon={Plus} onClick={() => alert('Abrir modal de nuevo ítem')}>
          Nuevo Ítem
        </GradientButton>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <Card className="p-0">
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por P/N o descripción..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 placeholder-slate-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-cyan-500 outline-none text-slate-200 appearance-none cursor-pointer"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ItemType | 'todos')}
            >
              <option value="todos">Todos los tipos</option>
              <option value="producto_final">Producto Final</option>
              <option value="materia_prima">Materia Prima</option>
              <option value="insumo">Insumo</option>
              <option value="servicio_maquinaria">Servicio Maquinaria</option>
            </select>
          </div>
        </div>

        {/* TABLA DE DATOS */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-t border-slate-800">
            <thead className="bg-slate-950/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">P/N / Descripción</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clasificación</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Categoría</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Precio Base</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-cyan-500" />
                    Cargando inventario...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 flex flex-col items-center">
                    <Package className="w-8 h-8 mb-3 text-slate-600" />
                    <p>No se encontraron ítems que coincidan con la búsqueda.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-mono text-[11px] text-cyan-500 mb-0.5">{item.part_number || 'S/N'}</div>
                      <div className="text-sm font-medium text-slate-200">{item.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-md border ${getTypeStyles(item.tipo_item)}`}>
                        {formatTypeLabel(item.tipo_item)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {item.main_category || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-white text-right">
                      ${(item.price || 0).toLocaleString('es-CL')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 bg-slate-800 hover:bg-cyan-600 text-slate-400 hover:text-white rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}