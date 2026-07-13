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
import { COUNTRIES, GHANA_REGIONS, PAYMENT_METHODS, PAYMENT_GATEWAYS, DELIVERY_METHODS, formatPrice, getEffectivePrice } from '@/lib/constants';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Loader2, CheckCircle2, CreditCard, Truck, Calendar, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', country: 'Ghana', region: 'Greater Accra',
    city: '', streetAddress: '', digitalAddress: '', deliveryInstructions: '',
    deliveryMethod: 'standard', paymentMethod: 'mtn_momo', paymentGateway: 'hubtel', paymentPhone: '',
  });

  const activeItems = items.filter((i) => !i.saved_for_later);
  const deliveryMethod = DELIVERY_METHODS.find((d) => d.id === form.deliveryMethod);
  const shippingFee = deliveryMethod?.fee ?? 0;
  const total = subtotal + shippingFee;

  const estimatedDeliveryDate = (() => {
    const date = new Date();
    if (form.deliveryMethod === 'express') date.setDate(date.getDate() + 2);
    else if (form.deliveryMethod === 'pickup') date.setDate(date.getDate() + 1);
    else date.setDate(date.getDate() + 5);
    return date.toLocaleDateString('en-GH', { weekday: 'short', month: 'short', day: 'numeric' });
  })();

  const selectedGateway = PAYMENT_GATEWAYS.find((g) => g.id === form.paymentGateway);
  const availablePaymentMethods: string[] = [...(selectedGateway?.supports ?? [])];

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        email: user.email ?? '',
        fullName: [f.fullName, user.email].filter(Boolean).join(' '),
      }));
    }
  }, [user]);

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="container-page py-16 text-center">
          <p className="text-lg font-medium">Please log in to checkout</p>
          <Button asChild className="mt-4"><Link href="/login">Login</Link></Button>
        </main>
        <Footer />
      </>
    );
  }

  if (activeItems.length === 0) {
    return (
      <>
        <Navbar />
        <main className="container-page py-16 text-center">
          <p className="text-lg font-medium">Your cart is empty</p>
          <Button asChild className="mt-4"><Link href="/categories">Browse Products</Link></Button>
        </main>
        <Footer />
      </>
    );
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderNumber = `SMG-${Date.now().toString(36).toUpperCase()}`;
      const shippingAddress = {
        full_name: form.fullName,
        phone: form.phone,
        email: form.email,
        country: form.country,
        region: form.region,
        city: form.city,
        street_address: form.streetAddress,
        digital_address: form.digitalAddress,
        delivery_instructions: form.deliveryInstructions,
      };

      const deliveryDays = form.deliveryMethod === 'express' ? 2 : form.deliveryMethod === 'pickup' ? 1 : 5;
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + deliveryDays);

      const { data: order, error: orderError } = await supabase.from('orders').insert({
        order_number: orderNumber,
        user_id: user.id,
        status: 'pending',
        subtotal,
        shipping_fee: shippingFee,
        discount_amount: 0,
        total,
        payment_method: form.paymentMethod,
        delivery_method: form.deliveryMethod,
        shipping_address: shippingAddress,
        estimated_delivery_date: estimatedDate.toISOString().split('T')[0],
        delivery_status: 'order_received',
      }).select().single();

      if (orderError) throw new Error(orderError.message);

      const orderItems = activeItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product?.name ?? 'Unknown Product',
        product_image: item.product?.image_url ?? null,
        price: item.product ? getEffectivePrice(item.product) : 0,
        quantity: item.quantity,
        vendor_id: item.product?.vendor_id ?? null,
      }));
      await supabase.from('order_items').insert(orderItems);

      await supabase.from('payments').insert({
        order_id: order.id,
        user_id: user.id,
        provider: form.paymentMethod,
        gateway: form.paymentGateway,
        amount: total,
        currency: 'GHS',
        status: 'pending',
        phone: form.paymentPhone || null,
      });

      await supabase.from('shipping_addresses').insert({
        user_id: user.id,
        full_name: form.fullName,
        phone: form.phone,
        email: form.email,
        country: form.country,
        region: form.region,
        city: form.city,
        street_address: form.streetAddress,
        digital_address: form.digitalAddress || null,
        delivery_instructions: form.deliveryInstructions || null,
      });

      await clearCart();

      if (form.paymentGateway === 'cash_on_delivery') {
        router.push(`/payment/success?order=${orderNumber}`);
      } else {
        const res = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: order.id,
            user_id: user.id,
            gateway: form.paymentGateway,
            amount: total,
            email: form.email,
            callback_url: `${window.location.origin}/payment/processing`,
          }),
        });
        const paymentData = await res.json();

        if (paymentData.authorization_url) {
          window.location.href = paymentData.authorization_url;
        } else {
          router.push(`/payment/processing?order=${orderNumber}&method=${form.paymentMethod}&reference=${paymentData.reference || ''}`);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Checkout failed');
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="container-page py-6">
        <h1 className="font-display text-2xl font-bold sm:text-3xl mb-6">Checkout</h1>
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {/* Shipping info */}
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Truck className="h-5 w-5" /> Delivery Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="+233 ..." value={form.phone} onChange={(e) => set('phone', e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <select id="country" value={form.country} onChange={(e) => set('country', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region / State</Label>
                    <select id="region" value={form.region} onChange={(e) => set('region', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {GHANA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={form.city} onChange={(e) => set('city', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="streetAddress">Street Address</Label>
                  <Input id="streetAddress" value={form.streetAddress} onChange={(e) => set('streetAddress', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="digitalAddress">GPS / Digital Address (Optional)</Label>
                  <Input id="digitalAddress" placeholder="e.g. GA-123-4567" value={form.digitalAddress} onChange={(e) => set('digitalAddress', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryInstructions">Delivery Instructions (Optional)</Label>
                  <Textarea id="deliveryInstructions" rows={2} value={form.deliveryInstructions} onChange={(e) => set('deliveryInstructions', e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Delivery method */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Delivery Method</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {DELIVERY_METHODS.map((m) => (
                  <label key={m.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${form.deliveryMethod === m.id ? 'border-primary bg-accent' : 'hover:bg-accent'}`}>
                    <input type="radio" name="deliveryMethod" value={m.id} checked={form.deliveryMethod === m.id} onChange={(e) => set('deliveryMethod', e.target.value)} className="h-4 w-4 accent-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.description}</p>
                    </div>
                    <span className="text-sm font-bold">{m.fee === 0 ? 'Free' : formatPrice(m.fee)}</span>
                  </label>
                ))}
                <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>Estimated delivery: <strong>{estimatedDeliveryDate}</strong></span>
                </div>
              </CardContent>
            </Card>

            {/* Payment gateway */}
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5" /> Payment Method</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* Mobile Money Section */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <span className="text-base">📱</span> Mobile Money
                  </p>
                  <div className="space-y-2">
                    {PAYMENT_GATEWAYS.filter((g) => g.supports.includes('mtn_momo')).map((g) => (
                      <div key={`momo-${g.id}`}>
                        {PAYMENT_METHODS.filter((m) => ['mtn_momo', 'telecel_cash', 'airteltigo_money'].includes(m.id) && g.supports.includes(m.id)).map((m) => (
                          <label key={`${g.id}-${m.id}`} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${form.paymentGateway === g.id && form.paymentMethod === m.id ? 'border-primary bg-accent' : 'hover:bg-accent'}`}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={m.id}
                              checked={form.paymentGateway === g.id && form.paymentMethod === m.id}
                              onChange={() => { set('paymentGateway', g.id); set('paymentMethod', m.id); }}
                              className="h-4 w-4 accent-primary"
                            />
                            <span className="text-xl">{m.icon}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{m.label}</p>
                              <p className="text-xs text-muted-foreground">{m.description} via {g.label}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Payment Section */}
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <span className="text-base">💳</span> Card Payment
                  </p>
                  <div className="space-y-2">
                    {PAYMENT_GATEWAYS.filter((g) => g.id !== 'cash_on_delivery').map((g) => (
                      <label key={g.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${form.paymentGateway === g.id && !['mtn_momo', 'telecel_cash', 'airteltigo_money'].includes(form.paymentMethod) ? 'border-primary bg-accent' : 'hover:bg-accent'}`}>
                        <input
                          type="radio"
                          name="paymentGateway"
                          value={g.id}
                          checked={form.paymentGateway === g.id && !['mtn_momo', 'telecel_cash', 'airteltigo_money'].includes(form.paymentMethod)}
                          onChange={() => { set('paymentGateway', g.id); if (g.supports.length > 0) set('paymentMethod', g.supports[0] as string); }}
                          className="h-4 w-4 accent-primary"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{g.label}</p>
                          <p className="text-xs text-muted-foreground">{g.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Cash on Delivery */}
                <div className="pt-2 border-t">
                  <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${form.paymentGateway === 'cash_on_delivery' ? 'border-primary bg-accent' : 'hover:bg-accent'}`}>
                    <input
                      type="radio"
                      name="paymentGateway"
                      value="cash_on_delivery"
                      checked={form.paymentGateway === 'cash_on_delivery'}
                      onChange={() => { set('paymentGateway', 'cash_on_delivery'); set('paymentMethod', 'cash_on_delivery'); }}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-xl">🚚</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground">Pay when you receive your order</p>
                    </div>
                  </label>
                </div>

                {/* MoMo phone number input */}
                {['mtn_momo', 'telecel_cash', 'airteltigo_money'].includes(form.paymentMethod) && (
                  <div className="mt-3 space-y-2 rounded-lg bg-accent/50 p-3">
                    <Label htmlFor="paymentPhone">Mobile Money Number</Label>
                    <Input id="paymentPhone" type="tel" placeholder="e.g. 024 123 4567" value={form.paymentPhone} onChange={(e) => set('paymentPhone', e.target.value)} required />
                    <p className="text-xs text-muted-foreground">You will receive a prompt on this number to approve the payment.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order summary */}
          <div>
            <Card className="sticky top-20">
              <CardHeader><CardTitle className="text-lg">Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {activeItems.map((item) => {
                    const price = item.product ? getEffectivePrice(item.product) : 0;
                    return (
                      <div key={item.id} className="flex gap-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {item.product?.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.product.image_url} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product?.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          <p className="text-sm font-bold text-primary">{formatPrice(price * item.quantity)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2 text-sm border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">{shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Delivery</span>
                    <span className="font-medium">{estimatedDeliveryDate}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-base">
                    <span className="font-semibold">Total</span>
                    <span className="font-display font-bold text-primary">{formatPrice(total)}</span>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  {loading ? 'Processing...' : 'Place Order'}
                </Button>
                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                  <Shield className="h-3 w-3" /> Secure payment via {selectedGateway?.label}
                </p>
              </CardContent>
            </Card>
          </div>
        </form>
      </main>
      <Footer />
    </>
  );
}
