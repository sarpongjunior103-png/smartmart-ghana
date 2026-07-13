// @ts-nocheck
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/shared/product-card';
import { CategoryCard } from '@/components/shared/category-card';
import { CONTACT } from '@/lib/contact';
import Link from 'next/link';
import { ShoppingBag, Store, Truck, ShieldCheck, ArrowRight, Star } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getHomepageData() {
  const supabase = getSupabaseServerClient();

  const [{ data: featuredProducts }, { data: recentProducts }, { data: categories }, { data: topVendors }] =
    await Promise.all([
      supabase
        .from('products')
        .select('*, vendors(business_name, slug, logo_url)')
        .eq('status', 'published')
        .eq('is_featured', true)
        .gt('stock', 0)
        .order('rating', { ascending: false })
        .limit(8),
      supabase
        .from('products')
        .select('*, vendors(business_name, slug, logo_url)')
        .eq('status', 'published')
        .gt('stock', 0)
        .order('created_at', { ascending: false })
        .limit(12),
      supabase.from('categories').select('*').limit(12),
      supabase
        .from('vendors')
        .select('id, business_name, slug, logo_url, banner_url, description, rating, city')
        .eq('status', 'approved')
        .order('rating', { ascending: false })
        .limit(6),
    ]);

  return {
    featuredProducts: featuredProducts ?? [],
    recentProducts: recentProducts ?? [],
    categories: categories ?? [],
    topVendors: topVendors ?? [],
  };
}

export default async function HomePage() {
  const { featuredProducts, recentProducts, categories, topVendors } = await getHomepageData();

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm border border-white/10">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              Trusted by thousands across Ghana
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              SmartMart Ghana
            </h1>
            <p className="mt-4 text-lg text-slate-300 max-w-xl">
              Your trusted multi-vendor marketplace for quality products across Ghana and Africa.
              Shop from hundreds of vendors with secure payments and fast delivery.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-slate-900 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-all hover:scale-105"
              >
                Start Shopping
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/seller/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white/10 border border-white/20 text-white text-sm font-semibold rounded-lg hover:bg-white/20 transition-all backdrop-blur-sm"
              >
                <Store className="h-4 w-4" />
                Become a Vendor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: ShieldCheck, title: 'Secure Payments', desc: 'MTN MoMo, Telecel Cash, Cards' },
              { icon: Truck, title: 'Fast Delivery', desc: 'Nationwide & same-day in Accra' },
              { icon: ShoppingBag, title: 'Quality Products', desc: 'From verified vendors' },
              { icon: Star, title: 'Rated & Reviewed', desc: 'Transparent vendor ratings' },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Shop by Category</h2>
                <p className="text-muted-foreground text-sm mt-1">Browse our most popular categories</p>
              </div>
              <Link href="/categories" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-14 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Featured Products</h2>
                <p className="text-muted-foreground text-sm mt-1">Hand-picked top-rated items</p>
              </div>
              <Link href="/products?filter=featured" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                See more
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Vendors */}
      {topVendors.length > 0 && (
        <section className="py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Top Vendors</h2>
                <p className="text-muted-foreground text-sm mt-1">Discover quality stores on SmartMart</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topVendors.map((vendor) => (
                <Link
                  key={vendor.id}
                  href={`/stores/${vendor.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border bg-card p-5 transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted flex items-center justify-center">
                    {vendor.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={vendor.logo_url} alt={vendor.business_name} className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{vendor.business_name}</h3>
                    {vendor.city && <p className="text-sm text-muted-foreground">{vendor.city}</p>}
                    <div className="mt-1 flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">{vendor.rating?.toFixed(1) ?? '0.0'}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {recentProducts.length > 0 && (
        <section className="py-14 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">New Arrivals</h2>
                <p className="text-muted-foreground text-sm mt-1">Fresh from our vendors</p>
              </div>
              <Link href="/products" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {recentProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-10 lg:p-16 text-center text-white">
            <h2 className="text-3xl font-bold">Ready to start selling?</h2>
            <p className="mt-3 text-slate-300 max-w-xl mx-auto">
              Join SmartMart Ghana as a vendor and reach thousands of customers across the country.
              Set up your store in minutes.
            </p>
            <Link
              href="/seller/register"
              className="mt-8 inline-flex items-center gap-2 px-8 py-3 bg-white text-slate-900 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-all hover:scale-105"
            >
              <Store className="h-4 w-4" />
              Become a Vendor
            </Link>
          </div>
        </div>
      </section>

      {/* Contact strip */}
      <section className="bg-card border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-sm">
            <a href={`tel:${CONTACT.phoneRaw}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="font-medium">Call Us:</span> {CONTACT.phone}
            </a>
            <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Email Us:</span> {CONTACT.email}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
