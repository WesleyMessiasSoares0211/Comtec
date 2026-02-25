import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { QuoteItem } from '../services/quoteService';
import { clientService } from '../services/clientService';
import { productService } from '../services/productService';

const LOCAL_STORAGE_KEY = 'comtec_quote_builder_state';

export function useQuoteBuilder() {
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClientsAndSet = async (clientId: string | null) => {
    const { data: cData, error: clientError } = await clientService.getAll();
    if (clientError) {
      console.error("Error fetching clients for persistency:", clientError);
      return;
    }
    if (cData) {
      setClients(cData);
      if (clientId) {
        const client = cData.find(c => c.id === clientId);
        if (client) setSelectedClient(client);
      }
    }
  };

  const fetchData = async () => {
    try {
      const pData = await productService.getAll();
      setProducts(pData || []);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      toast.error(`Error al cargar productos: ${error.message}`);
    }
  };

  useEffect(() => {
    const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setItems(parsedState.items || []);
        fetchClientsAndSet(parsedState.selectedClientId || null);
      } catch (e) {
        console.error("Failed to parse saved state from localStorage:", e);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        fetchClientsAndSet(null);
      }
    } else {
      fetchClientsAndSet(null);
    }
    fetchData();
  }, []);

  useEffect(() => {
    const stateToSave = {
      items,
      selectedClientId: selectedClient?.id,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [items, selectedClient]);

  const addItemFromCatalog = (product: any) => {
    const exists = items.find(item => item.id === product.id);
    if (exists) {
      toast.warning('Este producto ya está en la cotización.');
      return;
    }

    setItems([...items, {
      id: product.id,
      name: product.name,
      part_number: product.part_number,
      quantity: 1,
      unit_price: product.price,
      total: product.price,
      technical_spec_url: product.datasheet_url
    }]);
    toast.success(`${product.name} añadido a la cotización.`);
  };

  const addManualItem = async (manualItem: {name: string, part_number: string, price: string}, saveToCatalog: boolean) => {
    if (!manualItem.name || !manualItem.part_number || !manualItem.price) {
      toast.error('Por favor, complete todos los campos obligatorios del ítem manual.');
      return false;
    }
    const price = parseFloat(manualItem.price);
    if (isNaN(price) || price <= 0) {
      toast.error('El precio debe ser un número positivo.');
      return false;
    }

    const newItem: QuoteItem = {
      name: manualItem.name,
      part_number: manualItem.part_number,
      quantity: 1,
      unit_price: price,
      total: price,
      is_manual: true
    };
    setItems([...items, newItem]);

    if (saveToCatalog) {
      try {
        await productService.create({
          name: manualItem.name,
          part_number: manualItem.part_number,
          price: price,
          main_category: 'Otros',
          description: `Producto añadido manualmente desde el cotizador (P/N: ${manualItem.part_number})`,
          image_url: '',
          featured: false,
          subcategory: '',
          protocol: '',
          connectivity: '',
          datasheet_url: '',
          ej_uso: '',
          metadata: {}
        });
        toast.success(`Ítem manual "${newItem.name}" añadido y guardado en catálogo.`);
        fetchData();
      } catch (error: any) {
        toast.error(`Error al guardar en catálogo: ${error.message}`);
      }
    } else {
      toast.success(`Ítem manual "${newItem.name}" añadido a la cotización.`);
    }
    
    return true; // Éxito al agregar
  };

  const updateQuantity = (index: number, qty: number) => {
    if (qty < 0) qty = 0;
    const newItems = [...items];
    newItems[index].quantity = qty;
    newItems[index].total = qty * newItems[index].unit_price;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const removedItemName = items[index].name;
    setItems(items.filter((_, i) => i !== index));
    toast.info(`${removedItemName} eliminado de la cotización.`);
  };

  const clearQuote = () => {
    if (items.length > 0 || selectedClient) {
      if (confirm('¿Estás seguro de que quieres borrar toda la cotización actual? Esta acción es irreversible.')) {
        setItems([]);
        setSelectedClient(null);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        toast.info('Cotización actual borrada.');
      }
    } else {
      toast.info('No hay cotización activa para borrar.');
    }
  };

  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const iva = subtotal * 0.19;
  const total = subtotal + iva;

  return {
    clients,
    products,
    selectedClient,
    setSelectedClient,
    items,
    searchTerm,
    setSearchTerm,
    addItemFromCatalog,
    addManualItem,
    updateQuantity,
    removeItem,
    clearQuote,
    subtotal,
    iva,
    total
  };
}