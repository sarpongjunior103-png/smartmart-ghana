// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Plus, Edit, Trash2, Loader2, DollarSign, TrendingUp, Clock, CheckCircle2, AlertTriangle, BarChart3, ShoppingCart, Star, Download, Upload } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { formatPrice, getEffectivePrice, LOW_STOCK_THRESHOLD, INVENTORY_CHANGE_TYPES } from '@/lib/constants';
import type { Product, Vendor, Order, InventoryLog } from '@/lib/types';
import { toast } from 'sonner';

type TabKey = 'overview' | 'products' | 'orders' | 'inventory';

export default function VendorDashboardPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'vendor')) {
      router.push('/seller/register');
    }
  }, [user, profile, authLoading, router]);

  useEffect(() => {
    if (!user || profile?.role !== 'vendor') return;
    (async () => {
      const { data: v } = await supabase.from('vendors').select('*').eq('id', user.id).maybeSingle();
      setVendor(v as Vendor | null);
      if (v && (v as Vendor).status !== 'approved') {
        setLoading(false);
        return;
      }
      const [prodsRes, ordersRes] = await Promise.all([
        supabase.from('products').select('*').eq('vendor_id', user.id).order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
      ]);
      const allProducts = (prodsRes.data as Product[]) ?? [];
      setProducts(allProducts);

      // Get vendor orders via order_items
      const productIds = allProducts.map((p) => p.id);
      if (productIds.length > 0) {
        const { data: orderItems } = await supabase.from('order_items').select('order_id').in('product_id', productIds);
        const orderIds = Array.from(new Set((orderItems ?? []).map((oi) => oi.order_id)));
        if (orderIds.length > 0) {
          const { data: vendorOrders } = await supabase.from('orders').select('*').in('id', orderIds).order('created_at', { ascending: false });
          setOrders((vendorOrders as Order[]) ?? []);
        }
      }

      // Load inventory logs
      const { data: logs } = await supabase.from('inventory_logs').select('*').eq('vendor_id', user.id).order('created_at', { ascending: false }).limit(20);
      setInventoryLogs((logs as InventoryLog[]) ?? []);

      setLoading(false);
    })();
  }, [user, profile]);

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast.error('Failed to delete product'); return; }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success('Product deleted');
  };

  const exportInventoryCSV = () => {
    const headers = ['Name', 'SKU', 'Price', 'Stock', 'Status', 'Category'];
    const rows = products.map((p) => [
      `"${p.name}"`,
      p.sku || '',
      p.price.toString(),
      p.stock.toString(),
      p.status,
      p.category_id || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Inventory exported');
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (vendor && vendor.status !== 'approved') {
    return (
      <>
        <Navbar />
        <main className="container-page py-12">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="p-8">
              <Clock className="mx-auto h-12 w-12 text-secondary" />
              <h1 className="mt-4 font-display text-xl font-bold">Application {vendor.status === 'pending' ? 'Pending' : 'Rejected'}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {vendor.status === 'pending'
                  ? 'Your seller application is awaiting admin approval.'
                  : 'Your seller application was not approved. Please contact support.'}
              </p>
              <Button asChild className="mt-6"><Link href="/">Back to Home</Link></Button>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  // Calculate analytics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const completedOrders = orders.filter((o) => o.status === 'delivered' || o.status === 'confirmed').length;
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'processing').length;
  const lowStockProducts = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD);
  const publishedCount = products.filter((p) => p.status === 'published').length;
  const draftCount = products.filter((p) => p.status === 'draft').length;
  const featuredCount = products.filter((p) => p.is_featured).length;
  const avgRating = products.length > 0
    ? (products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length).toFixed(1)
    : '0.0';

  // Sales over last 7 days
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const dayOrders = orders.filter((o) => o.created_at?.startsWith(dateStr));
    const revenue = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    return { date: dateStr, revenue, count: dayOrders.length, label: date.toLocaleDateString('en-GH', { weekday: 'short' }) };
  });

  const maxRevenue = Math.max(...last7Days.map((d) => d.revenue), 1);

  // Top products by stock value
  const topProducts = [...products].sort((a, b) => (b.price * b.stock) - (a.price * a.stock)).slice(0, 5);

  const stats = [
    { label: 'Total Revenue', value: formatPrice(totalRevenue), icon: DollarSign, color: 'text-green-600 bg-green-50' },
    { label: 'Total Orders', value: orders.length, icon: ShoppingCart, color: 'text-blue-600 bg-blue-50' },
    { label: 'Products', value: products.length, icon: Package, color: 'text-purple-600 bg-purple-50' },
    { label: 'Avg Rating', value: `${avgRating}★`, icon: Star, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <>
      <Navbar />
      <main className="container-page py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Seller Dashboard</h1>
            <p className="text-sm text-muted-foreground">{vendor?.business_name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportInventoryCSV}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button asChild>
              <Link href="/seller/products/new"><Plus className="mr-2 h-4 w-4" /> Add Product</Link>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Overview</TabsTrigger>
            <TabsTrigger value="products" className="gap-1.5"><Package className="h-4 w-4" /> Products</TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5"><ShoppingCart className="h-4 w-4" /> Orders</TabsTrigger>
            <TabsTrigger value="inventory" className="gap-1.5"><TrendingUp className="h-4 w-4" /> Inventory</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((s) => (
                <Card key={s.label}>
                  <CardContent className="flex items-center gap-3 p-5">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.color}`}>
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold font-display">{s.value}</p>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Sales chart */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Sales (Last 7 Days)</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-end justify-between gap-2 h-48">
                  {last7Days.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className="w-full rounded-t-md bg-primary/80 hover:bg-primary transition-colors min-h-[2px]"
                          style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
                          title={`${formatPrice(day.revenue)} - ${day.count} orders`}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{day.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Order status summary */}
              <Card>
                <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <Badge className="bg-green-100 text-green-800">{completedOrders}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pending</span>
                    <Badge className="bg-yellow-100 text-yellow-800">{pendingOrders}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Published Products</span>
                    <Badge className="bg-blue-100 text-blue-800">{publishedCount}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Draft Products</span>
                    <Badge className="bg-orange-100 text-orange-800">{draftCount}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Featured Products</span>
                    <Badge className="bg-purple-100 text-purple-800">{featuredCount}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Low stock alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" /> Low Stock Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lowStockProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">All products well stocked</p>
                  ) : (
                    <div className="space-y-2">
                      {lowStockProducts.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-sm">
                          <span className="truncate max-w-[200px]">{p.name}</span>
                          <Badge className={p.stock === 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}>
                            {p.stock} left
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top products */}
            <Card>
              <CardHeader><CardTitle>Top Products by Stock Value</CardTitle></CardHeader>
              <CardContent>
                {topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No products yet</p>
                ) : (
                  <div className="space-y-2">
                    {topProducts.map((p, i) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-6">{i + 1}</span>
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {p.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">Stock: {p.stock} - {formatPrice(p.price)} each</p>
                        </div>
                        <span className="text-sm font-bold text-primary">{formatPrice(p.price * p.stock)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products */}
          <TabsContent value="products">
            <Card>
              <CardContent className="p-5">
                {products.length === 0 ? (
                  <div className="py-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">No products yet. Start selling by adding your first product!</p>
                    <Button asChild className="mt-4"><Link href="/seller/products/new"><Plus className="mr-2 h-4 w-4" /> Add Product</Link></Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-xs font-semibold text-muted-foreground uppercase">
                          <th className="py-3">Product</th>
                          <th className="py-3">Price</th>
                          <th className="py-3">Stock</th>
                          <th className="py-3">Status</th>
                          <th className="py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                          <tr key={p.id} className="border-b">
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                                  {p.image_url && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate max-w-[200px]">{p.name}</p>
                                  {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-sm font-medium">{formatPrice(getEffectivePrice(p))}</td>
                            <td className="py-3 text-sm">
                              <span className={p.stock <= LOW_STOCK_THRESHOLD ? 'text-amber-600 font-medium' : ''}>{p.stock}</span>
                            </td>
                            <td className="py-3">
                              <Badge variant={p.status === 'published' ? 'default' : 'secondary'} className="text-xs">{p.status}</Badge>
                              {p.is_featured && <Badge className="ml-1 text-xs bg-primary/10 text-primary">Featured</Badge>}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Button size="icon" variant="ghost" asChild>
                                  <Link href={`/seller/products/${p.id}`}><Edit className="h-4 w-4" /></Link>
                                </Button>
                                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteProduct(p.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders */}
          <TabsContent value="orders">
            <Card>
              <CardContent className="p-5">
                {orders.length === 0 ? (
                  <div className="py-12 text-center">
                    <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">No orders yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-xs font-semibold text-muted-foreground uppercase">
                          <th className="py-3">Order #</th>
                          <th className="py-3">Date</th>
                          <th className="py-3">Total</th>
                          <th className="py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => (
                          <tr key={o.id} className="border-b">
                            <td className="py-3 text-sm font-medium font-mono">{o.order_number}</td>
                            <td className="py-3 text-sm">{new Date(o.created_at).toLocaleDateString('en-GH')}</td>
                            <td className="py-3 text-sm font-bold">{formatPrice(o.total)}</td>
                            <td className="py-3">
                              <Badge variant={o.status === 'delivered' ? 'default' : 'secondary'} className="text-xs">{o.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Total Stock Units</p>
                  <p className="text-2xl font-bold font-display mt-1">{products.reduce((sum, p) => sum + p.stock, 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Stock Value</p>
                  <p className="text-2xl font-bold font-display mt-1">{formatPrice(products.reduce((sum, p) => sum + p.price * p.stock, 0))}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Low Stock Items</p>
                  <p className="text-2xl font-bold font-display mt-1 text-amber-600">{lowStockProducts.length}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Inventory Log</span>
                  <Button variant="outline" size="sm" onClick={exportInventoryCSV}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {inventoryLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No inventory changes logged yet</p>
                ) : (
                  <div className="space-y-2">
                    {inventoryLogs.map((log) => {
                      const changeInfo = INVENTORY_CHANGE_TYPES[log.change_type];
                      return (
                        <div key={log.id} className="flex items-center justify-between border-b pb-2">
                          <div>
                            <Badge className={changeInfo?.color}>{changeInfo?.label}</Badge>
                            <span className="ml-2 text-sm">{log.reason || log.change_type}</span>
                          </div>
                          <div className="text-right text-sm">
                            <span className={log.quantity_change < 0 ? 'text-red-600' : 'text-green-600'}>
                              {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                            </span>
                            <span className="text-muted-foreground ml-2">({log.previous_stock} → {log.new_stock})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </>
  );
}
