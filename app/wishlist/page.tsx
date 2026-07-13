// @ts-nocheck
'use client'

import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/shared/product-card';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Heart, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWishlist() {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('wishlist')
        .select('product_id, products(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const items = (data ?? []).map((row) => row.products).filter(Boolean);
      setProducts(items);
      setLoading(false);
    }

    if (!authLoading) fetchWishlist();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Sign in to view your wishlist</h2>
          <p className="text-sm text-muted-foreground mt-2">Save items you love and access them anytime.</p>
          <Link href="/login?redirect=/wishlist">
            <Button className="mt-6">Sign In</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">My Wishlist</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length === 0 ? 'No saved items yet' : `${products.length} saved item${products.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">Your wishlist is empty</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Browse products and tap the heart icon to save items you love.
            </p>
            <Link href="/products"><Button className="mt-6">Browse Products</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
