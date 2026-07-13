// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Package, Truck, Home, Loader2, MapPin, Clock, Navigation, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { formatPrice, ORDER_STATUS_LABELS, DELIVERY_STATUS_LABELS, DELIVERY_TIMELINE } from '@/lib/constants';
import type { Order, OrderItem, Shipping, TrackingEvent } from '@/lib/types';

function TrackContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') ?? '';
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [shipping, setShipping] = useState<Shipping | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber || !user) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        const orderData = data as Order;
        setOrder(orderData);
        const { data: itemData } = await supabase.from('order_items').select('*').eq('order_id', orderData.id);
        setItems((itemData as OrderItem[]) ?? []);

        const { data: shippingData } = await supabase
          .from('shipping')
          .select('*')
          .eq('order_id', orderData.id)
          .maybeSingle();
        if (shippingData) {
          setShipping(shippingData as Shipping);
          const { data: eventsData } = await supabase
            .from('tracking_events')
            .select('*')
            .eq('shipping_id', (shippingData as Shipping).id)
            .order('created_at', { ascending: true });
          setTrackingEvents((eventsData as TrackingEvent[]) ?? []);
        }
      }
      setLoading(false);
    })();
  }, [orderNumber, user]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container-page flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <main className="container-page py-16 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">Order not found</p>
          <Button asChild className="mt-4"><Link href="/orders">View Orders</Link></Button>
        </main>
        <Footer />
      </>
    );
  }

  const statusInfo = ORDER_STATUS_LABELS[order.status] ?? ORDER_STATUS_LABELS.pending;
  const deliveryStatus = order.delivery_status || 'order_received';
  const deliveryInfo = DELIVERY_STATUS_LABELS[deliveryStatus] ?? DELIVERY_STATUS_LABELS.order_received;
  const currentStep = deliveryInfo.step;
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded' || deliveryStatus === 'cancelled' || deliveryStatus === 'returned';

  const stepIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    order_received: CheckCircle2,
    processing: Package,
    packed: Package,
    dispatched: Truck,
    out_for_delivery: Navigation,
    delivered: Home,
  };

  return (
    <>
      <Navbar />
      <main className="container-page py-6">
        <h1 className="font-display text-2xl font-bold sm:text-3xl mb-2">Track Order</h1>
        <p className="text-sm text-muted-foreground mb-6">Order #{order.order_number}</p>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {/* Delivery status banner */}
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Status</p>
                  <Badge className={`mt-1 ${deliveryInfo.color}`}>{deliveryInfo.label}</Badge>
                </div>
                {shipping?.estimated_delivery_date && !isCancelled && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                      <Calendar className="h-3.5 w-3.5" /> Est. Delivery
                    </p>
                    <p className="font-semibold text-sm">
                      {new Date(shipping.estimated_delivery_date).toLocaleDateString('en-GH', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tracking timeline */}
            <Card>
              <CardContent className="p-6">
                {isCancelled ? (
                  <div className="text-center py-8">
                    <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                    <p className="mt-3 text-sm text-muted-foreground">This order has been {order.status}.</p>
                  </div>
                ) : (
                  <div className="relative">
                    {DELIVERY_TIMELINE.map((step, i) => {
                      const isDone = i < currentStep;
                      const isCurrent = i === currentStep - 1 || (i === 0 && currentStep === 1);
                      const StepIcon = stepIcons[step.key] || CheckCircle2;
                      const event = trackingEvents.find((e) => e.status === step.key);
                      const stepReached = (deliveryInfo.step > i) || (deliveryInfo.step === i + 1);

                      return (
                        <div key={step.key} className="flex gap-4 pb-8 last:pb-0 relative">
                          {i < DELIVERY_TIMELINE.length - 1 && (
                            <div className={`absolute left-5 top-10 h-full w-0.5 ${stepReached ? 'bg-primary' : 'bg-border'}`} />
                          )}
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${stepReached ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                            <StepIcon className="h-5 w-5" />
                          </div>
                          <div className="pt-1.5">
                            <p className={`font-medium ${stepReached ? '' : 'text-muted-foreground'}`}>{step.label}</p>
                            <p className="text-xs text-muted-foreground">{step.description}</p>
                            {event && (
                              <p className="text-xs text-primary mt-1">
                                {new Date(event.created_at).toLocaleString('en-GH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                {event.location && ` - ${event.location}`}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping info */}
            {shipping && (
              <Card>
                <CardContent className="p-5">
                  <h2 className="font-display font-semibold mb-3 flex items-center gap-2">
                    <Truck className="h-4 w-4" /> Shipping Information
                  </h2>
                  <div className="space-y-2 text-sm">
                    {shipping.carrier && <div className="flex justify-between"><span className="text-muted-foreground">Carrier</span><span className="font-medium">{shipping.carrier}</span></div>}
                    {shipping.tracking_number && <div className="flex justify-between"><span className="text-muted-foreground">Tracking Number</span><span className="font-medium font-mono">{shipping.tracking_number}</span></div>}
                    {shipping.shipped_at && <div className="flex justify-between"><span className="text-muted-foreground">Shipped Date</span><span className="font-medium">{new Date(shipping.shipped_at).toLocaleString('en-GH')}</span></div>}
                    {shipping.delivered_at && <div className="flex justify-between"><span className="text-muted-foreground">Delivered Date</span><span className="font-medium">{new Date(shipping.delivered_at).toLocaleString('en-GH')}</span></div>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order items */}
            <Card>
              <CardContent className="p-5">
                <h2 className="font-display font-semibold mb-3">Items in this order</h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {item.product_image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.product_image} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="text-sm font-bold text-primary">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div>
            <Card className="sticky top-20">
              <CardContent className="p-5 space-y-4">
                <div>
                  <h2 className="font-display font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Delivery Address
                  </h2>
                  {order.shipping_address && (
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <p>{order.shipping_address.full_name}</p>
                      <p>{order.shipping_address.street_address}</p>
                      <p>{order.shipping_address.city}, {order.shipping_address.region}</p>
                      <p>{order.shipping_address.country}</p>
                      <p>{order.shipping_address.phone}</p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{order.shipping_fee === 0 ? 'Free' : formatPrice(order.shipping_fee)}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(order.discount_amount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between text-base">
                    <span className="font-semibold">Total</span>
                    <span className="font-display font-bold text-primary">{formatPrice(order.total)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Placed on {new Date(order.created_at).toLocaleString('en-GH')}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Payment: <span className="font-medium">{order.payment_method.replace(/_/g, ' ')}</span>
                </div>

                <Button asChild variant="outline" className="w-full">
                  <Link href={`/orders/invoice/${order.id}`}>View Invoice</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="container-page py-24 text-center">Loading...</div>}>
      <TrackContent />
    </Suspense>
  );
}
