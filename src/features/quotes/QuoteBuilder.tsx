import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, FileText, User, Settings, Save, PackagePlus, Eraser, Star, AlertCircle } from 'lucide-react';
import QuotePreview from './QuotePreview';
import { useQuoteBuilder } from '../../hooks/useQuoteBuilder';
import { clientService } from '../../services/clientService';
import { Client } from '../../types/client';

export default function QuoteBuilder() {
  const {
    products, selectedClient, setSelectedClient, items, 
    searchTerm, setSearchTerm, addItemFromCatalog, addManualItem, 
    updateQuantity, removeItem, clearQuote, subtotal, iva, total
  } = useQuoteBuilder();

  // --- ESTADOS LOCALES PARA CLIENTES (BYPASS PAGINACIÓN) ---
  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [showManualForm, setShowManualForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [manualItem, setManualItem] = useState({ name: '', part_number: '', price: '' });

  // Cargar lista completa de clientes para el selector
  useEffect(() => {
    const loadAllClients = async () => {
      setLoadingClients(true);
      try {
        const { data } = await clientService.getAll();
        if (data) setAvailableClients(data);
      } catch (error) {
        console.error("Error cargando clientes para el cotizador:", error);
      } finally {
        setLoadingClients(false);
      }
    };
    loadAllClients();
  }, []);

  const handleManualSubmit = async (saveToCatalog: boolean) => {
    const success = await addManualItem(manualItem, saveToCatalog);
    if (success) {
      setManualItem({ name: '', part_number: '', price: '' });
      setShowManualForm(false);
    }
  };

  // Identificar contacto principal para mostrar en el resumen del cliente seleccionado
  const principalContact = selectedClient?.contacts?.find(c => c.es_principal) || selectedClient?.contacts?.[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
      {/* PANEL IZQUIERDO: BUSQUEDA Y SELECCIÓN */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm shadow-xl">
          <h3 className="text-sm font-bold text-cyan-400 mb-4 flex items-center gap-2">
            <User className="w-4 h-4" /> 1. Cliente
          </h3>
          
          <div className="relative">
            <select
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-white focus:border-cyan-500 outline-none appearance-none cursor-pointer disabled:opacity-50"
              value={selectedClient?.id || ''}
              disabled={loadingClients}
              onChange={(e) => setSelectedClient(availableClients.find(c => c.id === e.target.value) || null)}
            >
              <option value="">{loadingClients ? 'Cargando clientes...' : 'Seleccionar cliente...'}</option>
              {availableClients.map(c => (
                <option key={c.id} value={c.id}>{c.razon_social} ({c.rut})</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <Settings className="w-3 h-3" />
            </div>
          </div>

          {selectedClient && (
            <div className="mt-4 p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">RUT: {selectedClient.rut}</p>
                  <p className="text-xs text-slate-200 mt-1">{selectedClient.direccion}, {selectedClient.comuna}</p>
                </div>
                <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                  selectedClient.estado_financiero === 'aprobado' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {selectedClient.estado_financiero === 'aprobado' ? 'Aprobado' : 'Solo Cotizar'}
                </div>
              </div>

              {/* Mostrar Contacto Principal */}
              {principalContact && (
                <div className="pt-2 border-t border-slate-800/50">
                   <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                     <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Atención a:
                   </p>
                   <p className="text-sm font-semibold text-white">{principalContact.nombre}</p>
                   <p className="text-xs text-slate-400">{principalContact.email || principalContact.telefono}</p>
                </div>
              )}
              
              <p className="text-[10px] font-bold text-cyan-500">
                Condición: {selectedClient.condicion_comercial || 'Contado'}
              </p>
            </div>
          )}
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
              <PackagePlus className="w-4 h-4" /> 2. Ítems
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={clearQuote}
                className="text-[10px] bg-slate-800 hover:bg-red-700/50 px-2 py-1 rounded text-red-300 flex items-center gap-1"
                title="Borrar cotización actual"
              >
                <Eraser className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setShowManualForm(!showManualForm)}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300"
              >
                {showManualForm ? 'Cancelar' : '+ Manual'}
              </button>
            </div>
          </div>

          {showManualForm ? (
            <div className="space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-800 animate-in zoom-in-95">
              <input placeholder="Nombre ítem" className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-3 text-xs text-white placeholder-slate-500" value={manualItem.name} onChange={e => setManualItem({...manualItem, name: e.target.value})}/>
              <input placeholder="P/N" className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-3 text-xs text-white placeholder-slate-500" value={manualItem.part_number} onChange={e => setManualItem({...manualItem, part_number: e.target.value})}/>
              <input placeholder="Precio Unitario" type="number" step="0.01" className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-3 text-xs text-white placeholder-slate-500" value={manualItem.price} onChange={e => setManualItem({...manualItem, price: e.target.value})}/>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleManualSubmit(false)} className="flex-1 bg-slate-800 py-1.5 rounded-lg text-[10px] font-bold text-slate-200 hover:bg-slate-700">AGREGAR</button>
                <button type="button" onClick={() => handleManualSubmit(true)} className="flex-1 bg-cyan-600 py-1.5 rounded-lg text-[10px] font-bold text-white text-center flex items-center justify-center gap-1 hover:bg-cyan-500"><Save className="w-3 h-3"/> + CATÁLOGO</button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filtrar catálogo..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-white outline-none focus:border-cyan-500 placeholder-slate-500"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar text-slate-200">
                {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.part_number?.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => addItemFromCatalog(p)}
                    className="w-full flex items-center justify-between p-2 hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-700 transition-all text-left"
                  >
                    <div>
                      <p className="text-xs font-medium">{p.name}</p>
                      <p className="text-[10px] text-cyan-500 font-mono">{p.part_number}</p>
                    </div>
                    <Plus className="w-4 h-4 text-slate-500" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* PANEL DERECHO: DETALLE Y TOTALES */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
          <table className="w-full text-left">
            <thead className="bg-slate-950/50 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Descripción / P/N</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase w-20 text-center">Cant.</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-right">Unitario</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-right">Subtotal</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-600 italic text-sm">
                    <FileText className="w-10 h-10 text-slate-800 mx-auto mb-3" />
                    No hay ítems en la cotización
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-200 font-medium">{item.name}</p>
                      <p className="text-[10px] text-cyan-500 font-mono">{item.part_number}</p>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-14 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm outline-none focus:border-cyan-500 text-white text-center font-bold"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 text-right">
                      ${item.unit_price.toLocaleString('es-CL')}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-white text-right">
                      ${item.total.toLocaleString('es-CL')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button type="button" onClick={() => removeItem(index)} className="text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="p-8 bg-slate-950/30 border-t border-slate-800 flex justify-end">
            <div className="w-72 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 uppercase font-bold text-[10px] tracking-widest">Subtotal Neto:</span>
                <span className="text-slate-200 font-mono">${subtotal.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 uppercase font-bold text-[10px] tracking-widest">IVA (19%):</span>
                <span className="text-slate-200 font-mono">${iva.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-3 border-t border-slate-800">
                <span className="text-cyan-400">TOTAL:</span>
                <span className="text-white font-mono">${total.toLocaleString('es-CL')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          {selectedClient?.estado_financiero === 'pendiente' && (
             <div className="flex items-center gap-2 text-[10px] text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20 mr-auto">
               <AlertCircle className="w-4 h-4" />
               Cliente pendiente de auditoría comercial.
             </div>
          )}

          <button type="button" className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-slate-300 rounded-xl font-bold border border-slate-800 hover:bg-slate-800 transition-all">
            <Settings className="w-4 h-4" /> Ajustes
          </button>

          <button
            type="button"
            onClick={() => setShowPreview(true)}
            disabled={!selectedClient || items.length === 0}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl font-bold text-white shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale"
          >
            <FileText className="w-5 h-5" /> Pre-visualizar Oferta
          </button>
        </div>
      </div>

      {showPreview && (
        <QuotePreview
          client={selectedClient}
          items={items}
          totals={{ subtotal, iva, total }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}