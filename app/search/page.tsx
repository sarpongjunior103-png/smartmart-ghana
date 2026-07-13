// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { ProductCard } from '@/components/shared/product-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Category, Product } from '@/lib/types';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    category: 'all',
    minPrice: '',
    maxPrice: '',
    minRating: '0',
    sort: 'newest',
  });

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      setCategories((data as Category[]) ?? []);
    });
  }, []);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase.from('products').select('*').eq('status', 'published');

      if (query.trim()) {
        q = q.or(`name.ilike.%${query}%,brand.ilike.%${query}%,tags.cs.{${query}}`);
      }
      if (filters.category !== 'all') {
        const cat = categories.find((c) => c.slug === filters.category);
        if (cat) q = q.eq('category_id', cat.id);
      }
      if (filters.minPrice) q = q.gte('price', Number(filters.minPrice));
      if (filters.maxPrice) q = q.lte('price', Number(filters.maxPrice));
      if (Number(filters.minRating) > 0) q = q.gte('rating', Number(filters.minRating));

      switch (filters.sort) {
        case 'newest': q = q.order('created_at', { ascending: false }); break;
        case 'price_low': q = q.order('price', { ascending: true }); break;
        case 'price_high': q = q.order('price', { ascending: false }); break;
        case 'rating': q = q.order('rating', { ascending: false }); break;
        case 'featured': q = q.order('is_featured', { ascending: false }).order('rating', { ascending: false }); break;
        default: break;
      }

      const { data } = await q.limit(48);
      setProducts((data as Product[]) ?? []);
      setLoading(false);
    })();
  }, [query, filters, categories]);

  const setFilter = (k: string, v: string) => setFilters((f) => ({ ...f, [k]: v }));
  const clearFilters = () => setFilters({ category: 'all', minPrice: '', maxPrice: '', minRating: '0', sort: 'newest' });

  return (
    <>
      <Navbar />
      <main className="container-page py-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold sm:text-3xl mb-1">Search Results</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? 'Searching...' : `${products.length} result${products.length !== 1 ? 's' : ''}${query ? ` for "${query}"` : ''}`}
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by product name, brand, or tags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={() => setShowFilters((s) => !s)} className="lg:hidden">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Filters sidebar */}
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="sticky top-20 space-y-4 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold">Filters</h2>
                <button onClick={clearFilters} className="text-xs text-primary hover:underline">Clear all</button>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={filters.category} onValueChange={(v) => setFilter('category', v)}>
                  <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Price Range (GH₵)</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => setFilter('minPrice', e.target.value)} />
                  <span className="text-muted-foreground">-</span>
                  <Input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => setFilter('maxPrice', e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Minimum Rating</Label>
                <Select value={filters.minRating} onValueChange={(v) => setFilter('minRating', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any Rating</SelectItem>
                    <SelectItem value="3">3+ Stars</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={filters.sort} onValueChange={(v) => setFilter('sort', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Best Rated</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : products.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
                <Button onClick={clearFilters} variant="outline" className="mt-4">Clear Filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container-page py-24 text-center">Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
