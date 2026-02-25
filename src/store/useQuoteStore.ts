import { create } from 'zustand';
import { QuoteItem, Client } from '../types/quotes';

interface QuoteState {
  selectedClient: Client | null;
  items: QuoteItem[];
  setClient: (client: Client | null) => void;
  addItem: (item: QuoteItem) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, qty: number) => void;
  clearQuote: () => void;
  getTotals: () => { subtotal: number; iva: number; total: number };
}

export const useQuoteStore = create<QuoteState>((set, get) => ({
  selectedClient: null,
  items: [],
  setClient: (selectedClient) => set({ selectedClient }),
  addItem: (newItem) => set((state) => ({ 
    items: [...state.items, newItem] 
  })),
  removeItem: (index) => set((state) => ({
    items: state.items.filter((_, i) => i !== index)
  })),
  updateQuantity: (index, quantity) => set((state) => {
    const newItems = [...state.items];
    newItems[index] = { ...newItems[index], quantity, total: quantity * newItems[index].unit_price };
    return { items: newItems };
  }),
  clearQuote: () => set({ items: [], selectedClient: null }),
  getTotals: () => {
    const subtotal = get().items.reduce((acc, item) => acc + item.total, 0);
    const iva = subtotal * 0.19;
    return { subtotal, iva, total: subtotal + iva };
  },
}));