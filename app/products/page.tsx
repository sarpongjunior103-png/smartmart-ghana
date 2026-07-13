// @ts-nocheck
'use client'

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/shared/product-card';
import { supabase } from '@/lib/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const PER_PAGE = 24;

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'featured';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') ?? 'all');
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) ?? 'newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data }) => setCategories(data ?? []));
  }, []);

  const fetchProducts = useCallback(async (resetPage = false) => {
    setLoading(true);
    const currentPage = resetPage ? 0 : page;
    if (resetPage) {
      setPage(0);
      setProducts([]);
    }

    let query = supabase
      .from('products')
      .select('*, vendors(business_name, slug, logo_url)', { count: 'exact' })
      .eq('status', 'published')
      .gt('stock', 0);

    if (search.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,brand.ilike.%${search.trim()}%`);
    }

    if (selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory);
    }

    if (searchParams.get('filter') === 'featured') {
      query = query.eq('is_featured', true);
    }

    if (minPrice) query = query.gte('price', parseFloat(minPrice));
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice));

    switch (sortBy) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      case 'featured':
        query = query.order('is_featured', { ascending: false }).order('rating', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    query = query.range(currentPage * PER_PAGE, (currentPage + 1) * PER_PAGE - 1);

    const { data, count } = await query;

    setProducts((prev) => resetPage ? (data ?? []) : [...prev, ...(data ?? [])]);
    setTotalCount(count ?? 0);
    setHasMore((data?.length ?? 0) === PER_PAGE);
    setLoading(false);
  }, [search, selectedCategory, sortBy, minPrice, maxPrice, page, searchParams]);

  useEffect(() => {
    fetchProducts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategory, sortBy, minPrice, maxPrice]);

  const loadMore = () => {
    setPage((p) => p + 1);
    fetchProducts(false);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSortBy('newest');
    setMinPrice('');
    setMaxPrice('');
  };

  const hasActiveFilters = search || selectedCategory !== 'all' || minPrice || maxPrice;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">All Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? 'Loading...' : `${totalCount} product${totalCount !== 1 ? 's' : ''} found`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
              <SelectItem value="featured">Featured First</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="sm:w-auto"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="mb-6 rounded-xl border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Filters</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Min Price (GH&#8373;)</label>
                <Input type="number" placeholder="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Max Price (GH&#8373;)</label>
                <Input type="number" placeholder="10000" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {loading && products.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-5 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">No products found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {hasActiveFilters ? 'Try adjusting your filters or search terms.' : 'Check back soon as vendors list new products.'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear filters</Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <Button variant="outline" onClick={loadMore} disabled={loading}>
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
