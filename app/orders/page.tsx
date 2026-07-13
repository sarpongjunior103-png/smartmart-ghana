// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Loader2, ChevronRight, Download } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { formatPrice, ORDER_STATUS_LABELS } from '@/lib/constants';
import type { Order, OrderItem } from '@/lib/types';
import { toast } from 'sonner';

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        toast.error('Failed to load orders');
        setLoading(false);
        return;
      }
      const orderList = (data as Order[]) ?? [];
      // Fetch items for each order
      const ordersWithItems = await Promise.all(
        orderList.map(async (o) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', o.id);
          return { ...o, items: (items as OrderItem[]) ?? [] };
        })
      );
      setOrders(ordersWithItems);
      setLoading(false);
    })();
  }, [user, authLoading]);

  const cancelOrder = async (orderId: string) => {
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    if (error) {
      toast.error('Failed to cancel order');
      return;
    }
    toast.success('Order cancelled');
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o)));
  };

  if (!user && !authLoading) {
    return (
      <>
        <Navbar />
        <main className="container-page py-16 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">Please log in to view your orders</p>
          <Button asChild className="mt-4"><Link href="/login">Login</Link></Button>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container-page py-6">
        <h1 className="font-display text-2xl font-bold sm:text-3xl mb-6">Order History</h1>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium text-lg">No orders yet</p>
                <p className="text-sm text-muted-foreground">When you place orders, they&apos;ll appear here</p>
              </div>
              <Button asChild><Link href="/categories">Start Shopping</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = ORDER_STATUS_LABELS[order.status] ?? ORDER_STATUS_LABELS.pending;
              const canCancel = ['pending', 'confirmed'].includes(order.status);
              return (
                <Card key={order.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold">{order.order_number}</span>
                          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(order.created_at).toLocaleDateString('en-GH', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-primary">{formatPrice(order.total)}</p>
                        <p className="text-xs text-muted-foreground">{order.items?.length ?? 0} item(s)</p>
                      </div>
                    </div>

                    {/* Items preview */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex shrink-0 items-center gap-2 rounded-lg border p-2">
                          <div className="h-12 w-12 overflow-hidden rounded bg-muted">
                            {item.product_image && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.product_image} alt="" className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate max-w-[120px]">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/orders/track?order=${order.order_number}`}>
                          Track Order <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/orders/invoice/${order.id}`}>
                          <Download className="mr-1 h-3.5 w-3.5" /> Invoice
                        </Link>
                      </Button>
                      {canCancel && (
                        <Button size="sm" variant="destructive" onClick={() => cancelOrder(order.id)}>
                          Cancel Order
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
