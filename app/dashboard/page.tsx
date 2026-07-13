// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { formatPrice, ORDER_STATUS_LABELS, TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUS_LABELS, GHANA_REGIONS, COUNTRIES } from '@/lib/constants';
import type { Order, ShippingAddress, Payment, Invoice, SupportTicket, Notification, Review, Product } from '@/lib/types';
import { User, Package, CreditCard, FileText, Star, Bell, LifeBuoy, Heart, MapPin, Loader2, MessageSquare, CheckCircle2, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

type TabKey = 'profile' | 'addresses' | 'orders' | 'wishlist' | 'payments' | 'invoices' | 'reviews' | 'tickets' | 'notifications';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [loading, setLoading] = useState(true);

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [wishlist, setWishlist] = useState<{ product: Product }[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Form states
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' });
  const [addressForm, setAddressForm] = useState({ full_name: '', phone: '', country: 'Ghana', region: 'Greater Accra', city: '', street_address: '', digital_address: '', delivery_instructions: '' });
  const [ticketForm, setTicketForm] = useState({ subject: '', description: '', category: 'general', priority: 'medium' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!user) return;
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const loadAllData = async () => {
    if (!user) return;
    setLoading(true);

    const [ordersRes, addrRes, payRes, invRes, tickRes, notifRes, wishRes, revRes] = await Promise.all([
      supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('shipping_addresses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('wishlist').select('product:products(*)').eq('user_id', user.id),
      supabase.from('reviews').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    setOrders((ordersRes.data as Order[]) ?? []);
    setAddresses((addrRes.data as ShippingAddress[]) ?? []);
    setPayments((payRes.data as Payment[]) ?? []);
    setInvoices((invRes.data as Invoice[]) ?? []);
    setTickets((tickRes.data as SupportTicket[]) ?? []);
    setNotifications((notifRes.data as Notification[]) ?? []);
    setWishlist((wishRes.data as unknown as { product: Product }[]) ?? []);
    setReviews((revRes.data as Review[]) ?? []);

    if (profile) {
      setProfileForm({ full_name: [profile.first_name, profile.last_name].filter(Boolean).join(' '), phone: profile.phone ?? '' });
    }

    setLoading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    const nameParts = profileForm.full_name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ');
    const { error } = await supabase.from('profiles').update({
      first_name: firstName,
      last_name: lastName,
      phone: profileForm.phone,
    }).eq('id', user.id);
    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
      refreshProfile?.();
    }
    setSavingProfile(false);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingAddress(true);
    const { error } = await supabase.from('shipping_addresses').insert({
      user_id: user.id,
      ...addressForm,
    });
    if (error) {
      toast.error('Failed to add address');
    } else {
      toast.success('Address added');
      setAddressForm({ full_name: '', phone: '', country: 'Ghana', region: 'Greater Accra', city: '', street_address: '', digital_address: '', delivery_instructions: '' });
      loadAllData();
    }
    setSavingAddress(false);
  };

  const handleDeleteAddress = async (id: string) => {
    const { error } = await supabase.from('shipping_addresses').delete().eq('id', id);
    if (error) { toast.error('Failed to delete address'); return; }
    toast.success('Address deleted');
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreatingTicket(true);
    const res = await fetch('/api/support-tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        subject: ticketForm.subject,
        description: ticketForm.description,
        category: ticketForm.category,
        priority: ticketForm.priority,
      }),
    });
    if (res.ok) {
      toast.success('Support ticket created');
      setTicketForm({ subject: '', description: '', category: 'general', priority: 'medium' });
      loadAllData();
    } else {
      toast.error('Failed to create ticket');
    }
    setCreatingTicket(false);
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    const res = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, markAllRead: true }),
    });
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleCancelOrder = async (orderId: string) => {
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    if (error) { toast.error('Failed to cancel order'); return; }
    toast.success('Order cancelled');
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'cancelled' } : o));
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <>
        <Navbar />
        <div className="container-page flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        <Footer />
      </>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <Navbar />
      <main className="container-page py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">My Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user?.email}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
          <TabsList className="mb-6 flex flex-wrap h-auto">
            <TabsTrigger value="profile" className="gap-1.5"><User className="h-4 w-4" /> Profile</TabsTrigger>
            <TabsTrigger value="addresses" className="gap-1.5"><MapPin className="h-4 w-4" /> Addresses</TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5"><Package className="h-4 w-4" /> Orders</TabsTrigger>
            <TabsTrigger value="wishlist" className="gap-1.5"><Heart className="h-4 w-4" /> Wishlist</TabsTrigger>
            <TabsTrigger value="payments" className="gap-1.5"><CreditCard className="h-4 w-4" /> Payments</TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1.5"><FileText className="h-4 w-4" /> Invoices</TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1.5"><Star className="h-4 w-4" /> Reviews</TabsTrigger>
            <TabsTrigger value="tickets" className="gap-1.5"><LifeBuoy className="h-4 w-4" /> Support</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 relative">
              <Bell className="h-4 w-4" /> Notifications
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unreadCount}</span>}
            </TabsTrigger>
          </TabsList>

          {/* Profile */}
          <TabsContent value="profile">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Profile Information</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email ?? ''} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input id="full_name" value={profileForm.full_name} onChange={(e) => setProfileForm((f) => ({ ...f, full_name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <Button type="submit" disabled={savingProfile}>
                    {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses */}
          <TabsContent value="addresses">
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <div className="space-y-3">
                <h2 className="font-display text-lg font-semibold">Saved Addresses</h2>
                {addresses.length === 0 ? (
                  <Card><CardContent className="py-8 text-center text-muted-foreground">No saved addresses yet</CardContent></Card>
                ) : (
                  addresses.map((addr) => (
                    <Card key={addr.id}>
                      <CardContent className="p-4 flex items-start justify-between">
                        <div className="text-sm space-y-1">
                          <p className="font-medium">{addr.full_name}</p>
                          <p className="text-muted-foreground">{addr.street_address}</p>
                          <p className="text-muted-foreground">{addr.city}, {addr.region}</p>
                          <p className="text-muted-foreground">{addr.country} - {addr.phone}</p>
                          {addr.digital_address && <p className="text-muted-foreground">GPS: {addr.digital_address}</p>}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAddress(addr.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4" /> Add New Address</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleAddAddress} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="addr_name">Full Name</Label>
                      <Input id="addr_name" value={addressForm.full_name} onChange={(e) => setAddressForm((f) => ({ ...f, full_name: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addr_phone">Phone</Label>
                      <Input id="addr_phone" type="tel" value={addressForm.phone} onChange={(e) => setAddressForm((f) => ({ ...f, phone: e.target.value }))} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="addr_country">Country</Label>
                        <select id="addr_country" value={addressForm.country} onChange={(e) => setAddressForm((f) => ({ ...f, country: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="addr_region">Region</Label>
                        <select id="addr_region" value={addressForm.region} onChange={(e) => setAddressForm((f) => ({ ...f, region: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          {GHANA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addr_city">City</Label>
                      <Input id="addr_city" value={addressForm.city} onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addr_street">Street Address</Label>
                      <Input id="addr_street" value={addressForm.street_address} onChange={(e) => setAddressForm((f) => ({ ...f, street_address: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addr_gps">GPS Address</Label>
                      <Input id="addr_gps" value={addressForm.digital_address} onChange={(e) => setAddressForm((f) => ({ ...f, digital_address: e.target.value }))} />
                    </div>
                    <Button type="submit" disabled={savingAddress} className="w-full">
                      {savingAddress && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Address
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders */}
          <TabsContent value="orders">
            <div className="space-y-3">
              {orders.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">
                  <Package className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  No orders yet. <Link href="/categories" className="text-primary underline">Start shopping</Link>
                </CardContent></Card>
              ) : (
                orders.map((order) => {
                  const statusInfo = ORDER_STATUS_LABELS[order.status] ?? ORDER_STATUS_LABELS.pending;
                  return (
                    <Card key={order.id}>
                      <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">#{order.order_number}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('en-GH')}</p>
                          <Badge className={`mt-1 ${statusInfo.color}`}>{statusInfo.label}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{formatPrice(order.total)}</p>
                          <p className="text-xs text-muted-foreground">{order.payment_method.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm"><Link href={`/orders/track?order=${order.order_number}`}>Track</Link></Button>
                          <Button asChild variant="outline" size="sm"><Link href={`/orders/invoice/${order.id}`}>Invoice</Link></Button>
                          {(order.status === 'pending' || order.status === 'confirmed') && (
                            <Button variant="destructive" size="sm" onClick={() => handleCancelOrder(order.id)}>Cancel</Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Wishlist */}
          <TabsContent value="wishlist">
            <div className="space-y-3">
              {wishlist.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">
                  <Heart className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  No wishlist items yet
                </CardContent></Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {wishlist.map(({ product }) => (
                    <Card key={product.id}>
                      <CardContent className="p-4">
                        {product.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.image_url} alt={product.name} className="h-32 w-full rounded-lg object-cover mb-3" />
                        )}
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="font-bold text-primary mt-1">{formatPrice(product.price)}</p>
                        <Button asChild size="sm" className="mt-2 w-full"><Link href={`/products/${product.id}`}>View Product</Link></Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments">
            <div className="space-y-3">
              {payments.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">
                  <CreditCard className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  No payment records yet
                </CardContent></Card>
              ) : (
                payments.map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{formatPrice(payment.amount)}</p>
                        <p className="text-xs text-muted-foreground">{payment.provider?.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground">{new Date(payment.created_at).toLocaleDateString('en-GH')}</p>
                      </div>
                      <Badge className={payment.status === 'success' ? 'bg-green-100 text-green-800' : payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                        {payment.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Invoices */}
          <TabsContent value="invoices">
            <div className="space-y-3">
              {invoices.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">
                  <FileText className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  No invoices yet
                </CardContent></Card>
              ) : (
                invoices.map((invoice) => (
                  <Card key={invoice.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium font-mono">{invoice.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">{formatPrice(invoice.amount)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(invoice.created_at).toLocaleDateString('en-GH')}</p>
                      </div>
                      <Badge className={invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {invoice.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews">
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">
                  <Star className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  No reviews yet
                </CardContent></Card>
              ) : (
                reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                        ))}
                      </div>
                      <p className="text-sm">{review.comment}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(review.created_at).toLocaleDateString('en-GH')}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Support Tickets */}
          <TabsContent value="tickets">
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <div className="space-y-3">
                <h2 className="font-display text-lg font-semibold">Your Support Tickets</h2>
                {tickets.length === 0 ? (
                  <Card><CardContent className="py-8 text-center text-muted-foreground">
                    <LifeBuoy className="mx-auto h-10 w-10 mb-2 opacity-50" />
                    No support tickets yet
                  </CardContent></Card>
                ) : (
                  tickets.map((ticket) => {
                    const statusInfo = TICKET_STATUS_LABELS[ticket.status] ?? TICKET_STATUS_LABELS.open;
                    const priorityInfo = TICKET_PRIORITIES.find((p) => p.id === ticket.priority);
                    return (
                      <Card key={ticket.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{ticket.subject}</p>
                              <p className="text-xs text-muted-foreground font-mono">{ticket.ticket_number}</p>
                              <p className="text-xs text-muted-foreground mt-1">{new Date(ticket.created_at).toLocaleDateString('en-GH')}</p>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                              {priorityInfo && <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>}
                            </div>
                          </div>
                          {ticket.description && <p className="text-sm text-muted-foreground mt-2">{ticket.description}</p>}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-4 w-4" /> New Ticket</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTicket} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="tkt_subject">Subject</Label>
                      <Input id="tkt_subject" value={ticketForm.subject} onChange={(e) => setTicketForm((f) => ({ ...f, subject: e.target.value }))} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={ticketForm.category} onValueChange={(v) => setTicketForm((f) => ({ ...f, category: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {TICKET_CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select value={ticketForm.priority} onValueChange={(v) => setTicketForm((f) => ({ ...f, priority: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {TICKET_PRIORITIES.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tkt_desc">Description</Label>
                      <Textarea id="tkt_desc" rows={4} value={ticketForm.description} onChange={(e) => setTicketForm((f) => ({ ...f, description: e.target.value }))} required />
                    </div>
                    <Button type="submit" disabled={creatingTicket} className="w-full">
                      {creatingTicket && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Ticket
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Notifications</h2>
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Mark all read
                  </Button>
                )}
              </div>
              {notifications.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">
                  <Bell className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  No notifications yet
                </CardContent></Card>
              ) : (
                notifications.map((notif) => (
                  <Card key={notif.id} className={notif.is_read ? '' : 'border-primary'}>
                    <CardContent className="p-4 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className={`text-sm ${notif.is_read ? '' : 'font-semibold'}`}>{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(notif.created_at).toLocaleString('en-GH')}</p>
                      </div>
                      <div className="flex gap-1">
                        {!notif.is_read && <span className="h-2 w-2 rounded-full bg-primary mt-2" />}
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteNotification(notif.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </>
  );
}
