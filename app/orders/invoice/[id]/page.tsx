// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/shared/navbar';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { formatPrice, ORDER_STATUS_LABELS } from '@/lib/constants';
import type { Order, OrderItem } from '@/lib/types';

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setOrder(data as Order);
        const { data: itemData } = await supabase.from('order_items').select('*').eq('order_id', (data as Order).id);
        setItems((itemData as OrderItem[]) ?? []);
      }
      setLoading(false);
    })();
  }, [id, user]);

  if (loading) {
    return <div className="container-page py-24 text-center">Loading...</div>;
  }

  if (!order) {
    return <div className="container-page py-24 text-center">Invoice not found</div>;
  }

  const statusInfo = ORDER_STATUS_LABELS[order.status] ?? ORDER_STATUS_LABELS.pending;

  return (
    <>
      <Navbar />
      <main className="container-page py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center justify-between print:hidden">
            <h1 className="font-display text-2xl font-bold">Invoice</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
              <Button size="sm" onClick={() => window.print()}>
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-8">
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-display font-bold text-lg">S</div>
                  <span className="font-display text-lg font-bold">SmartMart Ghana</span>
                </div>
                <p className="text-xs text-muted-foreground">Oxford Street, Osu, Accra, Ghana</p>
                <p className="text-xs text-muted-foreground">smrtmart304@gmail.com</p>
              </div>
              <div className="text-right">
                <h2 className="font-display text-xl font-bold">INVOICE</h2>
                <p className="text-sm text-muted-foreground">{order.order_number}</p>
                <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
              </div>
            </div>

            {/* Customer info */}
            <div className="grid grid-cols-2 gap-6 py-6 border-b">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Bill To</p>
                {order.shipping_address && (
                  <div className="text-sm space-y-0.5">
                    <p className="font-medium">{order.shipping_address.full_name}</p>
                    <p className="text-muted-foreground">{order.shipping_address.phone}</p>
                    <p className="text-muted-foreground">{order.shipping_address.email}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Ship To</p>
                {order.shipping_address && (
                  <div className="text-sm space-y-0.5">
                    <p className="text-muted-foreground">{order.shipping_address.street_address}</p>
                    <p className="text-muted-foreground">{order.shipping_address.city}, {order.shipping_address.region}</p>
                    <p className="text-muted-foreground">{order.shipping_address.country}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            <table className="w-full py-4">
              <thead>
                <tr className="border-b text-left text-xs font-semibold text-muted-foreground uppercase">
                  <th className="py-3">Product</th>
                  <th className="py-3 text-center">Qty</th>
                  <th className="py-3 text-right">Price</th>
                  <th className="py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3 text-sm">{item.product_name}</td>
                    <td className="py-3 text-sm text-center">{item.quantity}</td>
                    <td className="py-3 text-sm text-right">{formatPrice(item.price)}</td>
                    <td className="py-3 text-sm text-right font-medium">{formatPrice(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="ml-auto mt-4 w-full max-w-xs space-y-2 text-sm">
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
              <div className="border-t pt-2 flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
              <p>Thank you for shopping with SmartMart Ghana!</p>
              <p>Payment Method: {order.payment_method.replace(/_/g, ' ')} · Delivery: {order.delivery_method}</p>
              <p className="mt-1">Invoice generated on {new Date().toLocaleDateString('en-GH')}</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
