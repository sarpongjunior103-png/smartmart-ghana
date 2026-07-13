// @ts-nocheck
'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { CartItem, Product } from '@/lib/types';
import { toast } from 'sonner';

interface CartContextValue {
  items: CartItem[];
  loading: boolean;
  count: number;
  subtotal: number;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  saveForLater: (id: string, saved: boolean) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('cart')
      .select('*, product:products(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setItems((data as CartItem[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (productId: string, quantity = 1) => {
    if (!user) {
      toast.error('Please log in to add items to cart');
      return;
    }
    // Check if already in cart
    const existing = items.find((i) => i.product_id === productId && !i.saved_for_later);
    if (existing) {
      await updateQuantity(existing.id, existing.quantity + quantity);
      return;
    }
    const { error } = await supabase
      .from('cart')
      .insert({ user_id: user.id, product_id: productId, quantity, saved_for_later: false });
    if (error) {
      toast.error('Failed to add to cart');
      return;
    }
    toast.success('Added to cart');
    fetchCart();
  }, [user, items, fetchCart]);

  const removeFromCart = useCallback(async (id: string) => {
    const { error } = await supabase.from('cart').delete().eq('id', id);
    if (error) {
      toast.error('Failed to remove item');
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback(async (id: string, quantity: number) => {
    if (quantity < 1) return;
    const { error } = await supabase.from('cart').update({ quantity }).eq('id', id);
    if (error) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  }, []);

  const saveForLater = useCallback(async (id: string, saved: boolean) => {
    const { error } = await supabase.from('cart').update({ saved_for_later: saved }).eq('id', id);
    if (error) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, saved_for_later: saved } : i)));
  }, []);

  const clearCart = useCallback(async () => {
    if (!user) return;
    await supabase.from('cart').delete().eq('user_id', user.id);
    setItems([]);
  }, [user]);

  const refresh = useCallback(async () => {
    await fetchCart();
  }, [fetchCart]);

  const activeItems = items.filter((i) => !i.saved_for_later);
  const count = activeItems.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = activeItems.reduce((sum, i) => {
    const price = i.product?.discount_price && i.product.discount_price < i.product.price
      ? i.product.discount_price
      : i.product?.price ?? 0;
    return sum + price * i.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{ items, loading, count, subtotal, addToCart, removeFromCart, updateQuantity, saveForLater, clearCart, refresh }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
