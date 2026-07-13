// @ts-nocheck
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/shared/product-card';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

async function getCategoryData(slug: string) {
  const supabase = getSupabaseServerClient();

  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (catError || !category) return null;

  const { data: products } = await supabase
    .from('products')
    .select('*, vendors(business_name, slug, logo_url)')
    .eq('category_id', category.id)
    .eq('status', 'published')
    .gt('stock', 0)
    .order('created_at', { ascending: false });

  return { category, products: products ?? [] };
}

export default async function CategoryPage({ params }: PageProps) {
  const data = await getCategoryData(params.slug);

  if (!data) notFound();

  const { category, products } = data;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/categories">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            All Categories
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} product{products.length !== 1 ? 's' : ''} in {category.name}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h3 className="font-semibold text-lg">No products in this category yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Check back soon for new arrivals.</p>
            <Link href="/products"><Button className="mt-6">Browse All Products</Button></Link>
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
