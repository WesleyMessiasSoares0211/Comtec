import React, { useState, useMemo } from 'react';
import { 
  Search, Edit2, Trash2, FileText, Tag, MapPin, 
  Filter, FilterX, Building2, AlertCircle
} from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { Client } from '../../types/client';
import { toast } from 'sonner';

interface ClientsListProps {
  onEditClient: (client: Client) => void;
  onViewQuotes: (client: Client) => void;
  onViewDetails: (client: Client) => void; // Prop para abrir la Ficha 360
}

export default function ClientsList({ onEditClient, onViewQuotes, onViewDetails }: ClientsListProps) {
  const { clients, loading, deleteClient } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de Filtros
  const [selectedTag, setSelectedTag] = useState<string>('todas');
  const [selectedCity, setSelectedCity] = useState<string>('todas');
  const [showFilters, setShowFilters] = useState(false);

  // 1. Obtener opciones únicas para los filtros dinámicamente
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    clients.forEach(c => c.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [clients]);

  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    clients.forEach(c => {
      if (c.ciudad) cities.add(c.ciudad);
    });
    return Array.from(cities).sort();
  }, [clients]);

  // 2. Lógica de Filtrado Combinada
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.rut.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = selectedTag === 'todas' || client.tags?.includes(selectedTag);
    const matchesCity = selectedCity === 'todas' || client.ciudad === selectedCity;

    return matchesSearch && matchesTag && matchesCity;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este cliente?')) {
      try {
        await deleteClient(id);
        toast.success('Cliente eliminado correctamente');
      } catch (error) {
        toast.error('Error al eliminar el cliente');
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTag('todas');
    setSelectedCity('todas');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm shadow-xl">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por RUT o Razón Social..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all border ${
                showFilters || selectedTag !== 'todas' || selectedCity !== 'todas'
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'OCULTAR FILTROS' : 'FILTROS'}
            </button>
            
            {(selectedTag !== 'todas' || selectedCity !== 'todas' || searchTerm !== '') && (
              <button
                onClick={clearFilters}
                className="p-3 bg-slate-950 text-red-400 border border-slate-800 hover:border-red-500/50 rounded-xl transition-all"
                title="Limpiar Filtros"
              >
                <FilterX className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Tag className="w-3 h-3" /> Categoría / Etiqueta
              </label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="todas">Todas las categorías</option>
                {uniqueTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Ubicación (Ciudad)
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="todas">Todas las ciudades</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* LISTADO DE CLIENTES */}
      <div className="grid grid-cols-1 gap-3">
        {filteredClients.length === 0 ? (
          <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl py-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No se encontraron clientes</p>
            <button onClick={clearFilters} className="text-cyan-500 text-xs font-bold mt-2 hover:underline">
              Limpiar búsqueda
            </button>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div 
              key={client.id}
              className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl group transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* ÁREA INTERACTIVA: Icono y Nombre */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div 
                    onClick={() => onViewDetails(client)}
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700 flex items-center justify-center text-cyan-500 cursor-pointer hover:scale-110 hover:border-cyan-500/50 transition-all shadow-inner"
                  >
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div 
                    onClick={() => onViewDetails(client)}
                    className="cursor-pointer group/name flex-1 min-w-0"
                  >
                    <h3 className="text-white font-bold text-base leading-tight truncate group-hover/name:text-cyan-400 transition-colors">
                      {client.razon_social}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="text-xs font-mono text-slate-500">{client.rut}</span>
                      <span className="hidden sm:inline text-slate-700">|</span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <MapPin className="w-3 h-3 text-cyan-600" />
                        {client.ciudad || 'S/C'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Etiquetas (Ocultas en móviles muy pequeños para dar prioridad a acciones) */}
                <div className="flex flex-wrap gap-1.5 lg:justify-center px-0 lg:px-4">
                  {client.tags?.map((tag, i) => (
                    <span 
                      key={i} 
                      className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border ${
                        tag === 'VIP' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        tag === 'Moroso' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-end gap-2 bg-slate-950/50 p-1.5 rounded-xl border border-slate-800/50 ml-auto lg:ml-0">
                  <button
                    onClick={() => onViewQuotes(client)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden xl:inline uppercase tracking-widest">Historial</span>
                  </button>
                  
                  <div className="w-px h-4 bg-slate-800"></div>
                  
                  <button
                    onClick={() => onEditClient(client)}
                    className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}