// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Package, Plus, Edit, Trash2, Loader2, DollarSign, TrendingUp, Clock,
  CheckCircle2, AlertTriangle, BarChart3, ShoppingCart, Star, Download,
  Users, Wallet, X, ArrowUpRight, PieChart, Activity,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { formatPrice, getEffectivePrice, LOW_STOCK_THRESHOLD } from '@/lib/constants';
import type { Product, Vendor, Order, OrderItem, InventoryLog, VendorEarning, Profile } from '@/lib/types';
import { toast } from 'sonner';

type TabKey = 'overview' | 'products' | 'orders' | 'customers' | 'earnings' | 'analytics';

type CustomerRow = {
  profile: Profile;
  totalSpent: number;
  orderCount: number;
};

export default function VendorDashboardPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [earnings, setEarnings] = useState<VendorEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

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

      // Fetch vendor products
      const { data: prodsRes } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });
      const allProducts = (prodsRes as Product[]) ?? [];
      setProducts(allProducts);

      // Fetch vendor orders via order_items join
      const { data: itemsRes } = await supabase
        .from('order_items')
        .select('*')
        .eq('vendor_id', user.id);
      const allItems = (itemsRes as OrderItem[]) ?? [];
      setOrderItems(allItems);

      const orderIds = Array.from(new Set(allItems.map((oi) => oi.order_id)));
      if (orderIds.length > 0) {
        const { data: vendorOrders } = await supabase
          .from('orders')
          .select('*')
          .in('id', orderIds)
          .order('created_at', { ascending: false });
        setOrders((vendorOrders as Order[]) ?? []);
      }

      // Fetch customers: unique user_ids from orders
      if (orderIds.length > 0) {
        const uniqueUserIds = Array.from(new Set((vendorOrders ?? []).map((o: Order) => o.user_id)));
        if (uniqueUserIds.length > 0) {
          const { data: profilesRes } = await supabase
            .from('profiles')
            .select('*')
            .in('id', uniqueUserIds);
          const profiles = (profilesRes as Profile[]) ?? [];
          const profileMap = new Map(profiles.map((p) => [p.id, p]));

          const customerMap = new Map<string, CustomerRow>();
          (vendorOrders ?? []).forEach((o: Order) => {
            const p = profileMap.get(o.user_id);
            if (!p) return;
            const existing = customerMap.get(o.user_id);
            if (existing) {
              existing.totalSpent += o.total || 0;
              existing.orderCount += 1;
            } else {
              customerMap.set(o.user_id, { profile: p, totalSpent: o.total || 0, orderCount: 1 });
            }
          });
          setCustomers(Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent));
        }
      }

      // Fetch vendor earnings
      const { data: earningsRes } = await supabase
        .from('vendor_earnings')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });
      setEarnings((earningsRes as VendorEarning[]) ?? []);

      setLoading(false);
    })();
  }, [user, profile]);

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete product');
      return;
    }
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

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    const available = earningsCalc.available;
    if (amount > available) {
      toast.error('Amount exceeds available balance');
      return;
    }
    setWithdrawing(true);
    const { data, error } = await supabase
      .from('vendor_earnings')
      .insert({
        vendor_id: user.id,
        amount: -amount,
        type: 'withdrawal',
        status: 'pending',
      })
      .select('*')
      .single();
    setWithdrawing(false);
    if (error || !data) {
      toast.error('Withdrawal request failed');
      return;
    }
    setEarnings((prev) => [data as VendorEarning, ...prev]);
    setWithdrawOpen(false);
    setWithdrawAmount('');
    toast.success('Withdrawal request submitted');
  };

  // ===== Earnings calculations =====
  const earningsCalc = useMemo(() => {
    const totalEarnings = earnings
      .filter((e) => e.type === 'earning' && e.status === 'completed')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    const completedWithdrawals = earnings
      .filter((e) => e.type === 'withdrawal' && e.status === 'completed')
      .reduce((sum, e) => sum + Math.abs(e.amount || 0), 0);
    const pendingWithdrawals = earnings
      .filter((e) => e.type === 'withdrawal' && e.status === 'pending')
      .reduce((sum, e) => sum + Math.abs(e.amount || 0), 0);
    const available = totalEarnings - completedWithdrawals - pendingWithdrawals;
    return { totalEarnings, completedWithdrawals, pendingWithdrawals, available };
  }, [earnings]);

  const withdrawalHistory = useMemo(
    () => earnings.filter((e) => e.type === 'withdrawal'),
    [earnings]
  );

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (vendor && vendor.status !== 'approved') {
    const statusConfig = {
      pending: { icon: Clock, title: 'Application Pending', message: 'Your seller application is awaiting admin approval.' },
      rejected: { icon: X, title: 'Application Rejected', message: 'Your seller application was not approved. Please contact support.' },
      suspended: { icon: AlertTriangle, title: 'Account Suspended', message: 'Your seller account has been suspended. Please contact support.' },
    };
    const cfg = statusConfig[vendor.status as keyof typeof statusConfig] ?? statusConfig.pending;
    const StatusIcon = cfg.icon;
    return (
      <>
        <Navbar />
        <main className="container-page py-12">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="p-8">
              <StatusIcon className="mx-auto h-12 w-12 text-secondary" />
              <h1 className="mt-4 font-display text-xl font-bold">{cfg.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{cfg.message}</p>
              <Button asChild className="mt-6">
                <Link href="/">Back to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  // ===== Overview analytics =====
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const completedOrders = orders.filter((o) => o.status === 'delivered' || o.status === 'confirmed').length;
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'processing').length;
  const lowStockProducts = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD);
  const publishedCount = products.filter((p) => p.status === 'published').length;
  const draftCount = products.filter((p) => p.status === 'draft').length;
  const avgRating =
    products.length > 0
      ? (products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length).toFixed(1)
      : '0.0';

  // Sales over last 7 days
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const dayOrders = orders.filter((o) => o.created_at?.startsWith(dateStr));
    const revenue = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    return {
      date: dateStr,
      revenue,
      count: dayOrders.length,
      label: date.toLocaleDateString('en-GH', { weekday: 'short' }),
    };
  });
  const maxRevenue = Math.max(...last7Days.map((d) => d.revenue), 1);

  // Top products by stock value
  const topProducts = [...products]
    .sort((a, b) => b.price * b.stock - a.price * a.stock)
    .slice(0, 5);

  const stats = [
    { label: 'Total Revenue', value: formatPrice(totalRevenue), icon: DollarSign, color: 'text-green-600 bg-green-50' },
    { label: 'Total Orders', value: orders.length, icon: ShoppingCart, color: 'text-blue-600 bg-blue-50' },
    { label: 'Products', value: products.length, icon: Package, color: 'text-purple-600 bg-purple-50' },
    { label: 'Avg Rating', value: `${avgRating}★`, icon: Star, color: 'text-amber-600 bg-amber-50' },
  ];

  // ===== Analytics tab data =====
  // Sales over last 30 days (grouped)
  const last30Days = Array.from({ length: 30 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toISOString().split('T')[0];
    const dayOrders = orders.filter((o) => o.created_at?.startsWith(dateStr));
    const revenue = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    return {
      date: dateStr,
      revenue,
      count: dayOrders.length,
      label: date.toLocaleDateString('en-GH', { month: 'short', day: 'numeric' }),
    };
  });
  const max30Revenue = Math.max(...last30Days.map((d) => d.revenue), 1);

  // Top selling products by units sold (from order_items)
  const productSalesMap = new Map<string, { product: Product; units: number; revenue: number }>();
  orderItems.forEach((oi) => {
    const product = products.find((p) => p.id === oi.product_id);
    if (!product) return;
    const existing = productSalesMap.get(oi.product_id);
    if (existing) {
      existing.units += oi.quantity;
      existing.revenue += oi.price * oi.quantity;
    } else {
      productSalesMap.set(oi.product_id, {
        product,
        units: oi.quantity,
        revenue: oi.price * oi.quantity,
      });
    }
  });
  const topSellingProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);
  const maxUnitsSold = Math.max(...topSellingProducts.map((t) => t.units), 1);

  // Category breakdown
  const categoryMap = new Map<string, number>();
  products.forEach((p) => {
    const cat = p.category_id || 'Uncategorized';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
  });
  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([cat, count]) => ({ category: cat, count, percent: products.length > 0 ? (count / products.length) * 100 : 0 }))
    .sort((a, b) => b.count - a.count);
  const maxCategoryCount = Math.max(...categoryBreakdown.map((c) => c.count), 1);

  // Rating distribution
  const ratingBuckets = [0, 0, 0, 0, 0]; // 1-5 stars
  products.forEach((p) => {
    const r = Math.round(p.rating || 0);
    if (r >= 1 && r <= 5) ratingBuckets[r - 1] += 1;
  });
  const maxRatingBucket = Math.max(...ratingBuckets, 1);

  const orderStatusLabel = (status: string) =>
    ORDER_STATUS_LABELS?.[status] ?? { label: status, color: 'bg-gray-100 text-gray-800' };

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
              <Link href="/seller/products/new">
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Link>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
          <TabsList className="mb-6 flex flex-wrap h-auto">
            <TabsTrigger value="overview" className="gap-1.5">
              <BarChart3 className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-1.5">
              <Package className="h-4 w-4" /> Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5">
              <ShoppingCart className="h-4 w-4" /> Orders
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-1.5">
              <Users className="h-4 w-4" /> Customers
            </TabsTrigger>
            <TabsTrigger value="earnings" className="gap-1.5">
              <Wallet className="h-4 w-4" /> Earnings
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5">
              <Activity className="h-4 w-4" /> Analytics
            </TabsTrigger>
          </TabsList>

          {/* ===== Overview ===== */}
          <TabsContent value="overview" className="space-y-6">
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" /> Sales (Last 7 Days)
                </CardTitle>
              </CardHeader>
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
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
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
                    <span className="text-sm text-muted-foreground">Total Customers</span>
                    <Badge className="bg-indigo-100 text-indigo-800">{customers.length}</Badge>
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
              <CardHeader>
                <CardTitle>Top Products by Stock Value</CardTitle>
              </CardHeader>
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
                          <p className="text-xs text-muted-foreground">
                            Stock: {p.stock} - {formatPrice(p.price)} each
                          </p>
                        </div>
                        <span className="text-sm font-bold text-primary">{formatPrice(p.price * p.stock)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Products ===== */}
          <TabsContent value="products">
            <Card>
              <CardContent className="p-5">
                {products.length === 0 ? (
                  <div className="py-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      No products yet. Start selling by adding your first product!
                    </p>
                    <Button asChild className="mt-4">
                      <Link href="/seller/products/new">
                        <Plus className="mr-2 h-4 w-4" /> Add Product
                      </Link>
                    </Button>
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
                              <span className={p.stock <= LOW_STOCK_THRESHOLD ? 'text-amber-600 font-medium' : ''}>
                                {p.stock}
                              </span>
                            </td>
                            <td className="py-3">
                              <Badge variant={p.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                                {p.status}
                              </Badge>
                              {p.is_featured && (
                                <Badge className="ml-1 text-xs bg-primary/10 text-primary">Featured</Badge>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Button size="icon" variant="ghost" asChild>
                                  <Link href={`/seller/products/${p.id}`}>
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive"
                                  onClick={() => deleteProduct(p.id)}
                                >
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

          {/* ===== Orders ===== */}
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
                          <th className="py-3">Customer</th>
                          <th className="py-3">Items</th>
                          <th className="py-3">Total</th>
                          <th className="py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => {
                          const cust = customers.find((c) => c.profile.id === o.user_id);
                          const custName = cust
                            ? `${cust.profile.first_name ?? ''} ${cust.profile.last_name ?? ''}`.trim() ||
                              cust.profile.email
                            : '—';
                          const itemCount = orderItems.filter((oi) => oi.order_id === o.id).length;
                          return (
                            <tr key={o.id} className="border-b">
                              <td className="py-3 text-sm font-medium font-mono">{o.order_number}</td>
                              <td className="py-3 text-sm">{new Date(o.created_at).toLocaleDateString('en-GH')}</td>
                              <td className="py-3 text-sm">{custName}</td>
                              <td className="py-3 text-sm">{itemCount}</td>
                              <td className="py-3 text-sm font-bold">{formatPrice(o.total)}</td>
                              <td className="py-3">
                                <Badge
                                  variant={o.status === 'delivered' ? 'default' : 'secondary'}
                                  className={`text-xs ${orderStatusLabel(o.status).color}`}
                                >
                                  {o.status}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Customers ===== */}
          <TabsContent value="customers">
            <Card>
              <CardContent className="p-5">
                {customers.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">No customers yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-xs font-semibold text-muted-foreground uppercase">
                          <th className="py-3">Customer</th>
                          <th className="py-3">Email</th>
                          <th className="py-3">Orders</th>
                          <th className="py-3">Total Spent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map((c) => {
                          const name = `${c.profile.first_name ?? ''} ${c.profile.last_name ?? ''}`.trim() || c.profile.email;
                          return (
                            <tr key={c.profile.id} className="border-b">
                              <td className="py-3 text-sm font-medium">{name}</td>
                              <td className="py-3 text-sm text-muted-foreground">{c.profile.email}</td>
                              <td className="py-3 text-sm">{c.orderCount}</td>
                              <td className="py-3 text-sm font-bold text-primary">{formatPrice(c.totalSpent)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Earnings ===== */}
          <TabsContent value="earnings" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl text-green-600 bg-green-50">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xl font-bold font-display">{formatPrice(earningsCalc.totalEarnings)}</p>
                      <p className="text-sm text-muted-foreground">Total Earnings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl text-blue-600 bg-blue-50">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xl font-bold font-display">{formatPrice(earningsCalc.available)}</p>
                      <p className="text-sm text-muted-foreground">Available Balance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl text-amber-600 bg-amber-50">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xl font-bold font-display">{formatPrice(earningsCalc.pendingWithdrawals)}</p>
                      <p className="text-sm text-muted-foreground">Pending Withdrawals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl text-purple-600 bg-purple-50">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xl font-bold font-display">{formatPrice(earningsCalc.completedWithdrawals)}</p>
                      <p className="text-sm text-muted-foreground">Withdrawn</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ArrowUpRight className="h-5 w-5" /> Withdraw Funds
                  </span>
                  <Button onClick={() => setWithdrawOpen(true)} disabled={earningsCalc.available <= 0}>
                    <Wallet className="mr-2 h-4 w-4" /> Withdraw
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Available to withdraw: <span className="font-bold text-foreground">{formatPrice(earningsCalc.available)}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Withdrawal requests are reviewed by admin before payout.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Withdrawal History</CardTitle>
              </CardHeader>
              <CardContent>
                {withdrawalHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No withdrawals yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-xs font-semibold text-muted-foreground uppercase">
                          <th className="py-3">Date</th>
                          <th className="py-3">Amount</th>
                          <th className="py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawalHistory.map((w) => (
                          <tr key={w.id} className="border-b">
                            <td className="py-3 text-sm">{new Date(w.created_at).toLocaleDateString('en-GH')}</td>
                            <td className="py-3 text-sm font-bold">{formatPrice(Math.abs(w.amount))}</td>
                            <td className="py-3">
                              <Badge
                                className={`text-xs ${
                                  w.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : w.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {w.status}
                              </Badge>
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

          {/* ===== Analytics ===== */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Sales over time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" /> Sales Over Time (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between gap-1 h-56">
                  {last30Days.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className="w-full rounded-t bg-primary/60 hover:bg-primary transition-colors min-h-[2px]"
                          style={{ height: `${(day.revenue / max30Revenue) * 100}%` }}
                          title={`${day.label}: ${formatPrice(day.revenue)} - ${day.count} orders`}
                        />
                      </div>
                      {i % 5 === 0 && <span className="text-[10px] text-muted-foreground">{day.label}</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Top selling products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" /> Top Selling Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topSellingProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No sales data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {topSellingProducts.map((t, i) => (
                        <div key={t.product.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="truncate max-w-[180px]">
                              {i + 1}. {t.product.name}
                            </span>
                            <span className="font-medium">{t.units} sold</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${(t.units / maxUnitsSold) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{formatPrice(t.revenue)} revenue</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" /> Category Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryBreakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No products yet</p>
                  ) : (
                    <div className="space-y-3">
                      {categoryBreakdown.map((c) => (
                        <div key={c.category} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="truncate max-w-[180px]">{c.category}</span>
                            <span className="font-medium">{c.count} ({c.percent.toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${(c.count / maxCategoryCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Rating distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" /> Rating Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No products yet</p>
                ) : (
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = ratingBuckets[stars - 1];
                      return (
                        <div key={stars} className="flex items-center gap-3">
                          <span className="flex items-center w-16 text-sm">
                            {stars} <Star className="ml-1 h-3 w-3 fill-amber-400 text-amber-400" />
                          </span>
                          <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-amber-400"
                              style={{ width: `${(count / maxRatingBucket) * 100}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-sm text-muted-foreground">{count}</span>
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

      {/* Withdraw modal */}
      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Withdraw Funds</span>
                <Button size="icon" variant="ghost" onClick={() => setWithdrawOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">Amount (GH₵)</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Available: {formatPrice(earningsCalc.available)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setWithdrawOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleWithdraw} disabled={withdrawing}>
                  {withdrawing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {withdrawing ? 'Processing...' : 'Request Withdrawal'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
