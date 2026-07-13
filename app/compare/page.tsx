// @ts-nocheck
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';
import { formatPrice, getEffectivePrice } from '@/lib/constants';
import type { Product } from '@/lib/types';
import { GitCompare, X, Star, Loader2 } from 'lucide-react';

const COMPARE_KEY = 'compare_list';

export default function ComparePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const compareRaw = localStorage.getItem(COMPARE_KEY);
        const compareList: string[] = compareRaw ? JSON.parse(compareRaw) : [];

        if (compareList.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .in('id', compareList);

        if (error) {
          console.error('Error fetching products:', error);
          setProducts([]);
        } else {
          // Preserve the order from localStorage
          const ordered = (data || [])
            .map((p: Product) => p)
            .sort(
              (a: Product, b: Product) =>
                compareList.indexOf(a.id) - compareList.indexOf(b.id)
            );
          setProducts(ordered as Product[]);
        }
      } catch (err) {
        console.error('Failed to load compare list:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [hydrated]);

  const removeFromCompare = (productId: string) => {
    try {
      const compareRaw = localStorage.getItem(COMPARE_KEY);
      const compareList: string[] = compareRaw ? JSON.parse(compareRaw) : [];
      const updated = compareList.filter((id) => id !== productId);
      localStorage.setItem(COMPARE_KEY, JSON.stringify(updated));
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      console.error('Failed to update compare list:', err);
    }
  };

  const clearAll = () => {
    localStorage.removeItem(COMPARE_KEY);
    setProducts([]);
  };

  // Collect all unique specification keys across products
  const allSpecKeys: string[] = Array.from(
    new Set(
      products.flatMap((p) =>
        p.specifications ? Object.keys(p.specifications) : []
      )
    )
  ).sort();

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalf) {
        stars.push(
          <div key={i} className="relative">
            <Star className="h-4 w-4 text-yellow-400" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
      }
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  const renderStockStatus = (stock: number) => {
    if (stock > 10) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
          <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
          In Stock
        </span>
      );
    } else if (stock > 0) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
          Low Stock ({stock} left)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
          <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
          Out of Stock
        </span>
      );
    }
  };

  // Loading state
  if (loading && hydrated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading comparison...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Empty state
  if (hydrated && products.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <Card className="max-w-md w-full text-center border-0 shadow-lg">
            <CardContent className="p-8 sm:p-12">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <GitCompare className="h-10 w-10 text-muted-foreground" />
              </div>
              <h1 className="font-display text-2xl font-bold mb-3">
                No Products to Compare
              </h1>
              <p className="text-muted-foreground mb-8">
                You haven&apos;t added any products to your comparison list yet.
                Browse our catalog and add products to compare them side by side.
              </p>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/categories">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Pre-hydration skeleton (avoids flash of empty state)
  if (!hydrated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <main className="flex-1 container-page py-8 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GitCompare className="h-6 w-6 text-primary" />
              <h1 className="font-display text-2xl sm:text-3xl font-bold">
                Compare Products
              </h1>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">
              Comparing {products.length}{' '}
              {products.length === 1 ? 'product' : 'products'} side by side
            </p>
          </div>
          {products.length > 0 && (
            <Button variant="outline" onClick={clearAll}>
              Clear All
            </Button>
          )}
        </div>

        {/* Comparison Table — horizontal scroll on mobile */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="min-w-max inline-block w-full">
            <Card className="border shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <table className="w-full border-collapse">
                  <tbody>
                    {/* Product Image Row */}
                    <tr className="border-b border-border">
                      <td className="sticky left-0 z-10 bg-card align-bottom p-4 font-medium text-sm text-muted-foreground w-32 sm:w-40">
                        Product
                      </td>
                      {products.map((product) => (
                        <td
                          key={`img-${product.id}`}
                          className="align-bottom p-4 border-l border-border min-w-[200px] sm:min-w-[240px]"
                        >
                          <div className="relative">
                            <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted mb-3">
                              {product.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <GitCompare className="h-10 w-10 text-muted-foreground/40" />
                                </div>
                              )}
                            </div>
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 h-7 w-7 shadow-md"
                              onClick={() => removeFromCompare(product.id)}
                              aria-label={`Remove ${product.name} from comparison`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Name Row */}
                    <tr className="border-b border-border">
                      <td className="sticky left-0 z-10 bg-card align-top p-4 font-medium text-sm text-muted-foreground">
                        Name
                      </td>
                      {products.map((product) => (
                        <td
                          key={`name-${product.id}`}
                          className="align-top p-4 border-l border-border"
                        >
                          <Link
                            href={`/products/${product.id}`}
                            className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2"
                          >
                            {product.name}
                          </Link>
                        </td>
                      ))}
                    </tr>

                    {/* Price Row */}
                    <tr className="border-b border-border bg-muted/20">
                      <td className="sticky left-0 z-10 bg-muted/20 align-top p-4 font-medium text-sm text-muted-foreground">
                        Price
                      </td>
                      {products.map((product) => {
                        const effective = getEffectivePrice(product);
                        const hasDiscount =
                          product.discount_price &&
                          product.discount_price < product.price;
                        return (
                          <td
                            key={`price-${product.id}`}
                            className="align-top p-4 border-l border-border"
                          >
                            <div className="flex flex-col gap-1">
                              <span className="text-lg font-bold text-primary">
                                {formatPrice(effective)}
                              </span>
                              {hasDiscount && (
                                <span className="text-sm text-muted-foreground line-through">
                                  {formatPrice(product.price)}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Brand Row */}
                    <tr className="border-b border-border">
                      <td className="sticky left-0 z-10 bg-card align-top p-4 font-medium text-sm text-muted-foreground">
                        Brand
                      </td>
                      {products.map((product) => (
                        <td
                          key={`brand-${product.id}`}
                          className="align-top p-4 border-l border-border"
                        >
                          <span className="text-sm">
                            {product.brand || '—'}
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Rating Row */}
                    <tr className="border-b border-border">
                      <td className="sticky left-0 z-10 bg-card align-top p-4 font-medium text-sm text-muted-foreground">
                        Rating
                      </td>
                      {products.map((product) => (
                        <td
                          key={`rating-${product.id}`}
                          className="align-top p-4 border-l border-border"
                        >
                          <div className="flex flex-col gap-1">
                            {renderStars(product.rating || 0)}
                            <span className="text-xs text-muted-foreground">
                              {product.rating
                                ? `${product.rating.toFixed(1)}${
                                    product.review_count
                                      ? ` (${product.review_count} reviews)`
                                      : ''
                                  }`
                                : 'No ratings'}
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Stock Row */}
                    <tr className="border-b border-border">
                      <td className="sticky left-0 z-10 bg-card align-top p-4 font-medium text-sm text-muted-foreground">
                        Availability
                      </td>
                      {products.map((product) => (
                        <td
                          key={`stock-${product.id}`}
                          className="align-top p-4 border-l border-border"
                        >
                          {renderStockStatus(product.stock || 0)}
                        </td>
                      ))}
                    </tr>

                    {/* Description Row */}
                    <tr className="border-b border-border">
                      <td className="sticky left-0 z-10 bg-card align-top p-4 font-medium text-sm text-muted-foreground">
                        Description
                      </td>
                      {products.map((product) => (
                        <td
                          key={`desc-${product.id}`}
                          className="align-top p-4 border-l border-border"
                        >
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                            {product.description || 'No description available.'}
                          </p>
                        </td>
                      ))}
                    </tr>

                    {/* Specification Rows — one per unique spec key */}
                    {allSpecKeys.map((specKey, idx) => (
                      <tr
                        key={`spec-${specKey}`}
                        className={
                          idx % 2 === 0
                            ? 'border-b border-border bg-muted/20'
                            : 'border-b border-border'
                        }
                      >
                        <td
                          className={`sticky left-0 z-10 align-top p-4 font-medium text-sm text-muted-foreground capitalize ${
                            idx % 2 === 0 ? 'bg-muted/20' : 'bg-card'
                          }`}
                        >
                          {specKey}
                        </td>
                        {products.map((product) => (
                          <td
                            key={`spec-${specKey}-${product.id}`}
                            className={`align-top p-4 border-l border-border ${
                              idx % 2 === 0 ? 'bg-muted/20' : ''
                            }`}
                          >
                            <span className="text-sm">
                              {product.specifications?.[specKey] || (
                                <span className="text-muted-foreground/50">
                                  —
                                </span>
                              )}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}

                    {/* Remove Button Row */}
                    <tr>
                      <td className="sticky left-0 z-10 bg-card align-top p-4 font-medium text-sm text-muted-foreground">
                        Actions
                      </td>
                      {products.map((product) => (
                        <td
                          key={`action-${product.id}`}
                          className="align-top p-4 border-l border-border"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-destructive hover:text-destructive hover:bg-destructive/5 hover:border-destructive/30"
                            onClick={() => removeFromCompare(product.id)}
                          >
                            <X className="h-4 w-4 mr-1.5" />
                            Remove
                          </Button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Back to browsing */}
        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link href="/categories">Continue Browsing</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
