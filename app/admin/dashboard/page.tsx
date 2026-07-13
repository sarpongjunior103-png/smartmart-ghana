// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navbar } from '@/components/shared/navbar';
import { Users, Store, Clock, Package, CheckCircle2, XCircle, LogOut, TrendingUp, Loader2, ShoppingCart, DollarSign, RotateCcw, CreditCard, Ticket, Settings, LifeBuoy, Truck, BarChart3, BarChart2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { formatPrice, ORDER_STATUS_LABELS, DELIVERY_STATUS_LABELS, PAYMENT_GATEWAYS, LOW_STOCK_THRESHOLD } from '@/lib/constants';
import type { Order, OrderItem, Product, Payment, Coupon, SupportTicket } from '@/lib/types';
import { toast } from 'sonner';

interface Stats {
  totalUsers: number;
  totalSellers: number;
  pendingSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  dailySales: number;
  monthlySales: number;
}

interface RecentReg {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

interface PendingSeller {
  id: string;
  business_name: string;
  owner_name: string | null;
  business_email: string | null;
  phone: string | null;
  country: string | null;
  business_category: string | null;
  status: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentReg[]>([]);
  const [pending, setPending] = useState<PendingSeller[]>([]);
  const [allProfiles, setAllProfiles] = useState<RecentReg[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [topProducts, setTopProducts] = useState<{ product: Product; count: number }[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});

  // Coupon form
  const [couponForm, setCouponForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', min_order: '', max_uses: '', expires_at: '' });
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  // Settings form
  const [settings, setSettings] = useState({ siteName: 'SmartMart Ghana', supportEmail: 'smrtmart304@gmail.com', lowStockThreshold: LOW_STOCK_THRESHOLD.toString(), currency: 'GHS' });

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchData();
    }
  }, [user, profile]);

  const fetchData = async () => {
    setDataLoading(true);
    const [
      { data: profiles },
      { data: vendors },
      { data: products },
      { data: pendingVendors },
      { data: allOrders },
      { data: allPayments },
      { data: allCoupons },
      { data: allTickets },
    ] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('vendors').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*'),
      supabase.from('vendors').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('coupons').select('*').order('created_at', { ascending: false }),
      supabase.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(20),
    ]);

    const profileList = (profiles ?? []) as RecentReg[];
    const vendorList = (vendors ?? []) as PendingSeller[];
    const pendingData = (pendingVendors ?? []) as PendingSeller[];
    const allOrderList = (allOrders ?? []) as Order[];
    const productList = (products ?? []) as Product[];

    const totalRevenue = allOrderList
      .filter((o) => !['cancelled', 'refunded'].includes(o.status))
      .reduce((sum, o) => sum + Number(o.total), 0);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const dailySales = allOrderList
      .filter((o) => new Date(o.created_at) >= todayStart && !['cancelled', 'refunded'].includes(o.status))
      .reduce((sum, o) => sum + Number(o.total), 0);

    const monthlySales = allOrderList
      .filter((o) => new Date(o.created_at) >= monthStart && !['cancelled', 'refunded'].includes(o.status))
      .reduce((sum, o) => sum + Number(o.total), 0);

    setStats({
      totalUsers: profileList.length,
      totalSellers: vendorList.length,
      pendingSellers: pendingData.length,
      totalProducts: productList.length,
      totalOrders: allOrderList.length,
      totalRevenue,
      dailySales,
      monthlySales,
    });
    setRecent(profileList.slice(0, 5));
    setAllProfiles(profileList);
    setPending(pendingData);
    setOrders(allOrderList.slice(0, 20));
    setAllProducts(productList);
    setPayments((allPayments ?? []) as Payment[]);
    setCoupons((allCoupons ?? []) as Coupon[]);
    setTickets((allTickets ?? []) as SupportTicket[]);

    // Fetch order items for each order
    const itemsMap: Record<string, OrderItem[]> = {};
    await Promise.all(
      allOrderList.slice(0, 20).map(async (o) => {
        const { data: items } = await supabase.from('order_items').select('*').eq('order_id', o.id);
        if (items) itemsMap[o.id] = items as OrderItem[];
      })
    );
    setOrderItems(itemsMap);

    // Top selling products
    const productCounts: Record<string, number> = {};
    Object.values(itemsMap).forEach((items) => {
      items.forEach((item) => {
        if (item.product_id) {
          productCounts[item.product_id] = (productCounts[item.product_id] ?? 0) + item.quantity;
        }
      });
    });
    const top = Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([pid, count]) => ({ product: productList.find((p) => p.id === pid)!, count }))
      .filter((t) => t.product);
    setTopProducts(top);

    setDataLoading(false);
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase.from('vendors').update({ status: 'approved' }).eq('id', id);
    setActionLoading(null);
    if (error) { toast.error('Failed to approve seller'); return; }
    toast.success('Seller approved');
    fetchData();
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase.from('vendors').update({ status: 'rejected' }).eq('id', id);
    setActionLoading(null);
    if (error) { toast.error('Failed to reject seller'); return; }
    toast.success('Seller rejected');
    fetchData();
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) { toast.error('Failed to update order'); return; }
    toast.success(`Order ${status}`);
    fetchData();
  };

  const refundOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to refund this order?')) return;
    const { error: orderError } = await supabase.from('orders').update({ status: 'refunded' }).eq('id', orderId);
    if (orderError) { toast.error('Failed to refund order'); return; }
    await supabase.from('payments').update({ status: 'refunded' }).eq('order_id', orderId);
    toast.success('Order refunded');
    fetchData();
  };

  const updateDeliveryStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ delivery_status: status }).eq('id', orderId);
    if (error) { toast.error('Failed to update delivery'); return; }
    const { data: shipping } = await supabase.from('shipping').select('id').eq('order_id', orderId).maybeSingle();
    if (shipping) {
      await supabase.from('shipping').update({ status, updated_at: new Date().toISOString() }).eq('id', shipping.id);
      await supabase.from('tracking_events').insert({ shipping_id: shipping.id, status, description: `Status updated to ${status}` });
    }
    toast.success('Delivery status updated');
    fetchData();
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCoupon(true);
    const { error } = await supabase.from('coupons').insert({
      code: couponForm.code.toUpperCase(),
      discount_type: couponForm.discount_type,
      discount_value: parseFloat(couponForm.discount_value),
      min_order_amount: couponForm.min_order ? parseFloat(couponForm.min_order) : null,
      max_uses: couponForm.max_uses ? parseInt(couponForm.max_uses) : null,
      expires_at: couponForm.expires_at || null,
      active: true,
    });
    if (error) { toast.error(error.message); } else {
      toast.success('Coupon created');
      setCouponForm({ code: '', discount_type: 'percentage', discount_value: '', min_order: '', max_uses: '', expires_at: '' });
      fetchData();
    }
    setCreatingCoupon(false);
  };

  const toggleCoupon = async (id: string, current: boolean) => {
    const { error } = await supabase.from('coupons').update({ active: !current }).eq('id', id);
    if (error) { toast.error('Failed to toggle coupon'); return; }
    toast.success(`Coupon ${!current ? 'activated' : 'deactivated'}`);
    fetchData();
  };

  const updateTicketStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('support_tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Failed to update ticket'); return; }
    toast.success('Ticket updated');
    fetchData();
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Sellers', value: stats?.totalSellers ?? 0, icon: Store, color: 'text-green-600 bg-green-50' },
    { label: 'Pending Applications', value: stats?.pendingSellers ?? 0, icon: Clock, color: 'text-orange-600 bg-orange-50' },
    { label: 'Total Products', value: stats?.totalProducts ?? 0, icon: Package, color: 'text-purple-600 bg-purple-50' },
    { label: 'Total Orders', value: stats?.totalOrders ?? 0, icon: ShoppingCart, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Total Revenue', value: formatPrice(stats?.totalRevenue ?? 0), icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Daily Sales', value: formatPrice(stats?.dailySales ?? 0), icon: TrendingUp, color: 'text-cyan-600 bg-cyan-50' },
    { label: 'Monthly Sales', value: formatPrice(stats?.monthlySales ?? 0), icon: TrendingUp, color: 'text-rose-600 bg-rose-50' },
  ];

  return (
    <>
      <Navbar />
      <main className="container-page py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your marketplace</p>
          </div>
          <Button variant="outline" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold font-display truncate">{dataLoading ? '...' : s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="sellers" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="sellers" className="gap-1.5"><Store className="h-4 w-4" /> Sellers</TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5"><Users className="h-4 w-4" /> Users</TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5"><ShoppingCart className="h-4 w-4" /> Orders</TabsTrigger>
            <TabsTrigger value="products" className="gap-1.5"><Package className="h-4 w-4" /> Products</TabsTrigger>
            <TabsTrigger value="payments" className="gap-1.5"><CreditCard className="h-4 w-4" /> Payments</TabsTrigger>
            <TabsTrigger value="coupons" className="gap-1.5"><Ticket className="h-4 w-4" /> Coupons</TabsTrigger>
            <TabsTrigger value="shipping" className="gap-1.5"><Truck className="h-4 w-4" /> Shipping</TabsTrigger>
            <TabsTrigger value="tickets" className="gap-1.5"><LifeBuoy className="h-4 w-4" /> Support</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Analytics</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5"><Settings className="h-4 w-4" /> Settings</TabsTrigger>
          </TabsList>

          {/* Sellers tab */}
          <TabsContent value="sellers" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" /> Pending Seller Applications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dataLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : pending.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pending applications</p>
                  ) : (
                    pending.map((v) => (
                      <div key={v.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{v.business_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{v.business_email} - {v.business_category}</p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button size="sm" className="h-8 px-2 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(v.id)} disabled={actionLoading === v.id}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" className="h-8 px-2" onClick={() => handleReject(v.id)} disabled={actionLoading === v.id}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" /> Recent Registrations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dataLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : recent.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No registrations yet</p>
                  ) : (
                    recent.map((r) => (
                      <div key={r.id} className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {r.full_name?.[0]?.toUpperCase() ?? r.email[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{r.full_name ?? r.email}</p>
                          <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                        </div>
                        <Badge variant="secondary" className="capitalize text-xs">{r.role}</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader><CardTitle className="text-lg">All Users</CardTitle></CardHeader>
              <CardContent>
                {dataLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-xs font-semibold text-muted-foreground uppercase">
                          <th className="py-3">Name</th>
                          <th className="py-3">Email</th>
                          <th className="py-3">Role</th>
                          <th className="py-3">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allProfiles.map((p) => (
                          <tr key={p.id} className="border-b">
                            <td className="py-3 text-sm font-medium">{p.full_name ?? '-'}</td>
                            <td className="py-3 text-sm">{p.email}</td>
                            <td className="py-3"><Badge variant="secondary" className="capitalize text-xs">{p.role}</Badge></td>
                            <td className="py-3 text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString('en-GH')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> All Orders</CardTitle></CardHeader>
              <CardContent>
                {dataLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No orders yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-xs font-semibold text-muted-foreground uppercase">
                          <th className="py-3">Order #</th>
                          <th className="py-3">Date</th>
                          <th className="py-3">Items</th>
                          <th className="py-3">Total</th>
                          <th className="py-3">Status</th>
                          <th className="py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => {
                          const statusInfo = ORDER_STATUS_LABELS[o.status] ?? ORDER_STATUS_LABELS.pending;
                          const items = orderItems[o.id] ?? [];
                          return (
                            <tr key={o.id} className="border-b">
                              <td className="py-3 text-sm font-medium">{o.id}</td>
                              <td className="py-3 text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString('en-GH')}</td>
                              <td className="py-3 text-sm">{items.length}</td>
                              <td className="py-3 text-sm font-medium">{formatPrice(Number(o.total))}</td>
                              <td className="py-3">
                                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                              </td>
                              <td className="py-3 text-right">
                                <div className="flex justify-end gap-1">
                                  <Select defaultValue={o.status} onValueChange={(v) => updateOrderStatus(o.id, v)}>
                                    <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="confirmed">Confirmed</SelectItem>
                                      <SelectItem value="processing">Processing</SelectItem>
                                      <SelectItem value="shipped">Shipped</SelectItem>
                                      <SelectItem value="delivered">Delivered</SelectItem>
                                      <SelectItem value="cancelled">Cancel</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-orange-600" onClick={() => refundOrder(o.id)} title="Refund">
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                </div>
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

          {/* Products tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Package className="h-5 w-5" /> All Products</CardTitle></CardHeader>
              <CardContent>
                {dataLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-xs font-semibold text-muted-foreground uppercase">
                          <th className="py-3">Product</th>
                          <th className="py-3">Price</th>
                          <th className="py-3">Stock</th>
                          <th className="py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allProducts.map((p) => (
                          <tr key={p.id} className="border-b">
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                                  {(p as any).image_url && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={(p as any).image_url} alt="" className="h-full w-full object-cover" />
                                  )}
                                </div>
                                <span className="text-sm font-medium truncate max-w-[200px]">{p.name}</span>
                              </div>
                            </td>
                            <td className="py-3 text-sm font-medium">{formatPrice(Number(p.price))}</td>
                            <td className="py-3 text-sm">
                              <span className={p.stock <= LOW_STOCK_THRESHOLD ? 'text-amber-600 font-medium' : ''}>{p.stock}</span>
                            </td>
                            <td className="py-3"><Badge variant="secondary" className="text-xs">{p.status}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5" /> Recent Payments</CardTitle></CardHeader>
              <CardContent>
                {dataLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No payments yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-xs font-semibold text-muted-foreground uppercase">
                          <th className="py-3">Amount</th>
                          <th className="py-3">Gateway</th>
                          <th className="py-3">Method</th>
                          <th className="py-3">Status</th>
                          <th className="py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id} className="border-b">
                            <td className="py-3 text-sm font-medium">{formatPrice(Number(p.amount))}</td>
                            <td className="py-3 text-sm capitalize">{p.gateway || '-'}</td>
                            <td className="py-3 text-sm capitalize">{(p.provider || '').replace(/_/g, ' ')}</td>
                            <td className="py-3">
                              <Badge className={p.status === 'success' ? 'bg-green-100 text-green-800' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                                {p.status}
                              </Badge>
                            </td>
                            <td className="py-3 text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString('en-GH')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coupons tab */}
          <TabsContent value="coupons">
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <Card>
                <CardHeader><CardTitle className="text-lg">Active Coupons</CardTitle></CardHeader>
                <CardContent>
                  {dataLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : coupons.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No coupons yet</p>
                  ) : (
                    <div className="space-y-2">
                      {coupons.map((c) => (
                        <div key={c.id} className="flex items-center justify-between border-b pb-2">
                          <div>
                            <p className="font-mono text-sm font-medium">{c.code}</p>
                            <p className="text-xs text-muted-foreground">
                              {c.discount_type === 'percentage' ? `${c.discount_value}%` : formatPrice(Number(c.discount_value))} off
                              {c.expires_at && ` - exp ${new Date(c.expires_at).toLocaleDateString('en-GH')}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={c.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {c.active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button size="sm" variant="outline" onClick={() => toggleCoupon(c.id, c.active)}>
                              {c.active ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Create Coupon</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateCoupon} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="c_code">Code</Label>
                      <Input id="c_code" value={couponForm.code} onChange={(e) => setCouponForm((f) => ({ ...f, code: e.target.value }))} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={couponForm.discount_type} onValueChange={(v) => setCouponForm((f) => ({ ...f, discount_type: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="c_value">Value</Label>
                        <Input id="c_value" type="number" step="0.01" value={couponForm.discount_value} onChange={(e) => setCouponForm((f) => ({ ...f, discount_value: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="c_min">Min Order</Label>
                        <Input id="c_min" type="number" step="0.01" value={couponForm.min_order} onChange={(e) => setCouponForm((f) => ({ ...f, min_order: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="c_max">Max Uses</Label>
                        <Input id="c_max" type="number" value={couponForm.max_uses} onChange={(e) => setCouponForm((f) => ({ ...f, max_uses: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="c_exp">Expiry Date</Label>
                      <Input id="c_exp" type="date" value={couponForm.expires_at} onChange={(e) => setCouponForm((f) => ({ ...f, expires_at: e.target.value }))} />
                    </div>
                    <Button type="submit" disabled={creatingCoupon} className="w-full">
                      {creatingCoupon && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Coupon
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Shipping tab */}
          <TabsContent value="shipping">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Truck className="h-5 w-5" /> Delivery Management</CardTitle></CardHeader>
              <CardContent>
                {dataLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No orders to manage</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-xs font-semibold text-muted-foreground uppercase">
                          <th className="py-3">Order #</th>
                          <th className="py-3">Delivery Method</th>
                          <th className="py-3">Est. Delivery</th>
                          <th className="py-3">Status</th>
                          <th className="py-3 text-right">Update</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => {
                          const deliveryStatus = o.delivery_status || 'order_received';
                          const deliveryInfo = DELIVERY_STATUS_LABELS[deliveryStatus] ?? DELIVERY_STATUS_LABELS.order_received;
                          return (
                            <tr key={o.id} className="border-b">
                              <td className="py-3 text-sm font-medium">{o.id}</td>
                              <td className="py-3 text-sm capitalize">{o.delivery_method}</td>
                              <td className="py-3 text-sm text-muted-foreground">
                                {o.estimated_delivery_date ? new Date(o.estimated_delivery_date).toLocaleDateString('en-GH') : '-'}
                              </td>
                              <td className="py-3"><Badge className={deliveryInfo.color}>{deliveryInfo.label}</Badge></td>
                              <td className="py-3 text-right">
                                <Select defaultValue={deliveryStatus} onValueChange={(v) => updateDeliveryStatus(o.id, v)}>
                                  <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="order_received">Order Received</SelectItem>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="packed">Packed</SelectItem>
                                    <SelectItem value="dispatched">Dispatched</SelectItem>
                                    <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="returned">Returned</SelectItem>
                                  </SelectContent>
                                </Select>
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

          {/* Support tickets tab */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><LifeBuoy className="h-5 w-5" /> Support Tickets</CardTitle></CardHeader>
              <CardContent>
                {dataLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : tickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No support tickets</p>
                ) : (
                  <div className="space-y-2">
                    {tickets.map((t) => (
                      <div key={t.id} className="flex items-center justify-between border-b pb-3">
                        <div>
                          <p className="text-sm font-medium">{t.subject}</p>
                          <p className="text-xs text-muted-foreground font-mono">{t.ticket_number} - {t.category}</p>
                          <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString('en-GH')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            t.status === 'open' ? 'bg-blue-100 text-blue-800' :
                            t.status === 'in_progress' ? 'bg-amber-100 text-amber-800' :
                            t.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }>{t.status.replace('_', ' ')}</Badge>
                          <Select defaultValue={t.status} onValueChange={(v) => updateTicketStatus(t.id, v)}>
                            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BarChart2 className="h-5 w-5 text-primary" /> Top Selling Products</CardTitle></CardHeader>
              <CardContent>
                {dataLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No sales data yet</p>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map(({ product, count }, i) => (
                      <div key={product.id} className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-primary">{i + 1}</span>
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {product.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.image_url} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{formatPrice(Number(product.price))}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">{count} sold</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Daily Sales</p>
                  <p className="mt-1 font-display text-2xl font-bold text-primary">{formatPrice(stats?.dailySales ?? 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Monthly Sales</p>
                  <p className="mt-1 font-display text-2xl font-bold text-primary">{formatPrice(stats?.monthlySales ?? 0)}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings tab */}
          <TabsContent value="settings">
            <Card className="max-w-md">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Settings className="h-5 w-5" /> Platform Settings</CardTitle></CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success('Settings saved (demo)'); }}>
                  <div className="space-y-2">
                    <Label htmlFor="s_site">Site Name</Label>
                    <Input id="s_site" value={settings.siteName} onChange={(e) => setSettings((s) => ({ ...s, siteName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s_email">Support Email</Label>
                    <Input id="s_email" type="email" value={settings.supportEmail} onChange={(e) => setSettings((s) => ({ ...s, supportEmail: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s_threshold">Low Stock Threshold</Label>
                    <Input id="s_threshold" type="number" value={settings.lowStockThreshold} onChange={(e) => setSettings((s) => ({ ...s, lowStockThreshold: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s_currency">Currency</Label>
                    <Input id="s_currency" value={settings.currency} onChange={(e) => setSettings((s) => ({ ...s, currency: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Gateways</Label>
                    <div className="space-y-1">
                      {PAYMENT_GATEWAYS.map((g) => (
                        <div key={g.id} className="flex items-center justify-between text-sm border rounded-lg p-2">
                          <span>{g.label} - <span className="text-muted-foreground">{g.description}</span></span>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button type="submit">Save Settings</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
