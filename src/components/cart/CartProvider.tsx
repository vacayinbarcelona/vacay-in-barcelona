'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartItem } from '@/types';

const STORAGE_KEY = 'vib_cart';

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  itemCount: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}

function readStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Cart lives in localStorage so it survives page navigation and reloads
  // without needing an account/session. Starts empty on the server and
  // hydrates from storage after mount to avoid an SSR/client mismatch.
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  function addItem(item: Omit<CartItem, 'id'>) {
    const id = `${item.attractionSlug}-${item.ticketOptionName}-${item.date}-${item.timeSlot}-${Date.now()}`
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-');
    setItems((prev) => [...prev, { ...item, id }]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clear() {
    setItems([]);
  }

  const itemCount = items.reduce((sum, i) => sum + i.adults + i.children, 0);
  const subtotal = items.reduce((sum, i) => sum + i.adults * i.pricePerAdult + i.children * i.pricePerChild, 0);

  const value = useMemo(
    () => ({ items, addItem, removeItem, clear, itemCount, subtotal }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, itemCount, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
