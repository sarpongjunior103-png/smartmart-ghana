// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { CategoryCard } from '@/components/shared/category-card';
import { ProductCard } from '@/components/shared/product-card';
import { supabase } from '@/lib/supabase/client';
import type { Category, Product } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('products').select('*').order('rating', { ascending: false }),
      ]);
      setCategories(cats as Category[] ?? []);
      setProducts(prods as Product[] ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = selected ? products.filter((p) => p.category_id === selected) : products;

  return (
    <>
      <Navbar />
      <main className="container-page py-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl mb-2">All Categories</h1>
        <p className="text-sm text-muted-foreground mb-6">Browse products by category</p>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelected(null)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${!selected ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${selected === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Category grid (when no filter) */}
        {!selected && (
          <div className="mb-10 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        )}

        {/* Products */}
        <h2 className="font-display text-xl font-bold mb-4">
          {selected ? categories.find((c) => c.id === selected)?.name : 'All Products'}
        </h2>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">No products in this category yet</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
