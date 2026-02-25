import { supabase } from '../lib/supabase';
import { Client, CreateClientData, ClientStats, ClientQuoteHistory } from '../types/client';

export const clientService = {
  
  // --- LECTURA PAGINADA ---
  async getPaginated(page: number, pageSize: number, searchTerm: string = ''): Promise<{ data: Client[]; count: number }> {
    try {
      // Solicitamos los clientes activos e incluimos sus contactos con un join
      let query = supabase
        .from('crm_clients')
        .select('*, contacts:crm_client_contacts(*)', { count: 'exact' })
        .is('deleted_at', null);

      if (searchTerm) {
        query = query.or(`razon_social.ilike.%${searchTerm}%,rut.ilike.%${searchTerm}%,giro.ilike.%${searchTerm}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data: (data as Client[]) || [], count: count || 0 };
    } catch (err) {
      console.error('Error fetching clients:', err);
      throw err;
    }
  },

  // --- LECTURA COMPLETA (Para Selects/Buscadores) ---
  async getAll(): Promise<{ data: Client[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('crm_clients')
        .select('*, contacts:crm_client_contacts(*)')
        .is('deleted_at', null)
        .order('razon_social', { ascending: true });

      if (error) throw error;
      return { data: data as Client[], error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  },

  // --- HISTORIAL DE COTIZACIONES ---
  async getHistory(clientId: string): Promise<ClientQuoteHistory[]> {
    if (!clientId) return [];
    
    try {
      // Verificamos si existe la tabla de cotizaciones antes de consultar
      const { data, error } = await supabase
        .from('crm_quotes')
        .select('id, folio, total, estado, created_at, items')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error obteniendo historial (puede que no haya cotizaciones):', error.message);
        return [];
      }
      
      return (data || []).map(q => ({
        ...q,
        total: Number(q.total) || 0,
        folio: q.folio || 'S/F',
        estado: q.estado || 'Pendiente'
      }));
    } catch (err) {
      console.error('Error en getHistory:', err);
      return [];
    }
  },

  // --- DASHBOARD Y ESTADÍSTICAS ---
  async getStats(): Promise<ClientStats> {
    try {
      const { count: totalActive } = await supabase
        .from('crm_clients')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);
      
      const { data: quotes } = await supabase
        .from('crm_quotes') 
        .select('client_id, total, crm_clients!inner(razon_social)')
        .eq('estado', 'Aceptada');

      const clientMap = new Map<string, any>();
      if (quotes) {
        quotes.forEach((q: any) => {
          const current = clientMap.get(q.client_id) || { id: q.client_id, razon_social: q.crm_clients?.razon_social || 'Cliente', totalAmount: 0 };
          current.totalAmount += (Number(q.total) || 0);
          clientMap.set(q.client_id, current);
        });
      }

      const topClients = Array.from(clientMap.values())
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5);
        
      return { totalActive: totalActive || 0, newThisMonth: 0, topClients };
    } catch (err) {
      console.error('Error stats:', err);
      return { totalActive: 0, newThisMonth: 0, topClients: [] };
    }
  },

  // --- CREAR CLIENTE ---
  async create(clientData: CreateClientData) {
    try {
      // 1. Validar duplicados (considerando Soft Delete)
      const { data: existing } = await supabase
        .from('crm_clients')
        .select('id, deleted_at, razon_social')
        .eq('rut', clientData.rut)
        .maybeSingle();

      if (existing) {
        if (!existing.deleted_at) {
           throw new Error('Este RUT ya existe activo en el sistema.');
        }
        // Código especial para UI: Sugerir restauración
        throw { code: 'CLIENT_INACTIVE', clientId: existing.id, clientName: existing.razon_social };
      }

      // 2. Preparar datos de compatibilidad (campos planos)
      let legacyEmail = clientData.email_contacto;
      let legacyPhone = clientData.telefono;
      
      // Si hay contactos, tomamos el principal para rellenar los campos "legacy"
      if (clientData.contacts && clientData.contacts.length > 0) {
        const principal = clientData.contacts.find(c => c.es_principal) || clientData.contacts[0];
        legacyEmail = principal.email || legacyEmail;
        legacyPhone = principal.telefono || legacyPhone;
      }

      // 3. Insertar Cliente
      // Nota: Eliminamos 'contacts' del objeto antes de insertar en crm_clients
      const { contacts, ...clientPayload } = clientData;
      
      const { data: newClient, error: clientError } = await supabase
        .from('crm_clients')
        .insert([{
          ...clientPayload, 
          razon_social: clientData.razon_social.trim(), 
          giro: clientData.giro.trim(),
          email_contacto: legacyEmail, 
          telefono: legacyPhone, 
          tags: clientData.tags || [], 
          estado_financiero: 'pendiente'
        }])
        .select()
        .single();

      if (clientError) throw clientError;

      // 4. Insertar Contactos (si existen)
      if (contacts && contacts.length > 0 && newClient) {
        const contactsWithId = contacts.map(c => ({ 
          ...c, 
          client_id: newClient.id 
        }));
        
        const { error: contactError } = await supabase
          .from('crm_client_contacts')
          .insert(contactsWithId);
          
        if (contactError) {
          console.error("Error insertando contactos:", contactError);
          // No lanzamos error fatal, el cliente ya se creó
        }
      }

      this.logAction(newClient.id, 'crear', { rut: newClient.rut });
      return { data: newClient, error: null };
    } catch (err) { 
      return { data: null, error: err as any }; 
    }
  },

  // --- ACTUALIZAR CLIENTE ---
  async update(id: string, updates: Partial<CreateClientData>) {
    try {
      const { contacts, ...updatePayload } = updates;

      // 1. Actualizar datos base del cliente
      const { error } = await supabase
        .from('crm_clients')
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;

      // 2. Gestionar Contactos (Estrategia: Reemplazo Total)
      if (contacts !== undefined) {
        // a) Borrar contactos existentes
        const { error: deleteError } = await supabase
            .from('crm_client_contacts')
            .delete()
            .eq('client_id', id);
            
        if (deleteError) {
            console.error('Error limpiando contactos antiguos:', deleteError);
            throw new Error('Error al actualizar lista de contactos.');
        }

        // b) Insertar nuevos contactos
        if (contacts.length > 0) {
          const contactsPayload = contacts.map(c => {
            // Eliminamos el ID si viene del frontend para que se genere uno nuevo
            // o lo mantenemos si queremos "recuperar" el mismo ID (arriesgado en reemplazo total)
            // Aquí optamos por dejar que la DB genere nuevos IDs para limpieza
            const { id: _, ...contactData } = c; 
            return {
              ...contactData,
              client_id: id
            };
          });
          
          const { error: insertError } = await supabase
            .from('crm_client_contacts')
            .insert(contactsPayload);
            
          if (insertError) throw insertError;
        }
      }

      this.logAction(id, 'editar', updates);
      return { data: null, error: null };
    } catch (err) {
      console.error('Error updating client:', err);
      return { data: null, error: err as Error };
    }
  },

  // --- ELIMINACIÓN (Soft Delete) ---
  async softDelete(id: string) {
    try {
      const { error } = await supabase
        .from('crm_clients')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      this.logAction(id, 'eliminar', { deleted_at: new Date().toISOString() });
      return { data: null, error: null };
    } catch (err) {
      console.error('Error deleting client:', err);
      return { data: null, error: err as Error };
    }
  },

  async restore(id: string) {
    try {
      const { error } = await supabase
        .from('crm_clients')
        .update({ deleted_at: null })
        .eq('id', id);

      if (error) throw error;
      this.logAction(id, 'restaurar', { deleted_at: null });
      return { data: null, error: null };
    } catch (err) {
      console.error('Error restoring client:', err);
      return { data: null, error: err as Error };
    }
  },

  async delete(id: string) {
    return this.softDelete(id);
  },

  // --- AUDITORÍA ---
  async logAction(clientId: string, action: string, details: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        supabase.from('crm_client_logs')
        .insert([{ client_id: clientId, user_id: user.id, action, details }])
        .then(({ error }) => {
            if (error) console.error("Error audit log:", error);
        });
    }
  },

  exportToCSV(clients: Client[]) {
    const headers = ['RUT', 'Razón Social', 'Giro', 'Ciudad', 'Condición', 'Email', 'Teléfono'];
    const rows = clients.map(c => [c.rut, `"${c.razon_social}"`, `"${c.giro}"`, c.ciudad || '', c.condicion_comercial || 'Contado', c.email_contacto || '', c.telefono || '']);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url); link.setAttribute('download', `export_clientes_${new Date().getTime()}.csv`);
    link.click();
  }
};