import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, MapPin, Phone, Mail, Edit, Trash2, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Client {
  id: string;
  razon_social: string;
  rut: string;
  email: string;
  phone: string;
  address: string;
  giro: string;
}

interface Props {
  onEdit: (client: Client) => void;
}

export default function ClientsList({ onEdit }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar Clientes
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('crm_clients')
        .select('*')
        .order('razon_social', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error(error);
      toast.error('Error cargando clientes');
    } finally {
      setLoading(false);
    }
  };

  // Filtrado simple en memoria
  const filteredClients = clients.filter(client => 
    client.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.rut?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-cyan-500" /></div>;

  return (
    <div className="p-4 space-y-4">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input 
          type="text"
          placeholder="Buscar por Razón Social o RUT..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none"
        />
      </div>

      {/* Tabla / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-cyan-500/30 transition-all group">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-colors">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm line-clamp-1">{client.razon_social}</h3>
                  <p className="text-xs text-cyan-400 font-mono">{client.rut}</p>
                </div>
              </div>
              <button 
                onClick={() => onEdit(client)}
                className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 text-xs text-slate-400">
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3 text-slate-600" />
                  <a href={`mailto:${client.email}`} className="hover:text-cyan-400 truncate">{client.email}</a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 text-slate-600" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-3 h-3 text-slate-600 mt-0.5" />
                  <span className="line-clamp-2">{client.address}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="col-span-full text-center py-10 text-slate-500">
            No se encontraron clientes.
          </div>
        )}
      </div>
    </div>
  );
}