// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Minus, Plus, Trash2, ShoppingBag, BookmarkPlus, ArrowRight, Tag, Loader2, X } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { formatPrice, getEffectivePrice } from '@/lib/constants';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Coupon } from '@/lib/types';

export default function CartPage() {
  const { items, loading, subtotal, removeFromCart, updateQuantity, saveForLater, refresh } = useCart();
  const { user } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [shippingFee, setShippingFee] = useState(15);

  const applyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('active', true)
      .maybeSingle();
    setCouponLoading(false);
    if (error || !data) {
      toast.error('Invalid coupon code');
      setAppliedCoupon(null);
      return;
    }
    if (data.min_order_amount && subtotal < data.min_order_amount) {
      toast.error(`Minimum order of ${formatPrice(data.min_order_amount)} required`);
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon(data as Coupon);
    toast.success(`Coupon "${data.code}" applied!`);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const discountAmount = appliedCoupon
    ? appliedCoupon.discount_type === 'percentage'
      ? (subtotal * appliedCoupon.discount_value) / 100
      : appliedCoupon.discount_value
    : 0;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  const activeItems = items.filter((i) => !i.saved_for_later);
  const savedItems = items.filter((i) => i.saved_for_later);

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="container-page py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium text-lg">Please log in to view your cart</p>
                <p className="text-sm text-muted-foreground">Your shopping cart is tied to your account</p>
              </div>
              <Button asChild><Link href="/login">Login</Link></Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container-page py-6">
        <h1 className="font-display text-2xl font-bold sm:text-3xl mb-6">Shopping Cart</h1>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : activeItems.length === 0 && savedItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium text-lg">Your cart is empty</p>
                <p className="text-sm text-muted-foreground">Browse our categories and find something you love</p>
              </div>
              <Button asChild><Link href="/categories">Start Shopping <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* Cart items */}
            <div className="space-y-4">
              {activeItems.length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-display text-lg font-semibold">Cart Items ({activeItems.length})</h2>
                  {activeItems.map((item) => {
                    const price = item.product ? getEffectivePrice(item.product) : 0;
                    return (
                      <Card key={item.id}>
                        <CardContent className="flex gap-4 p-4">
                          <Link href={`/products/${item.product_id}`} className="shrink-0">
                            <div className="h-24 w-24 overflow-hidden rounded-lg bg-muted">
                              {item.product?.image_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" />
                              )}
                            </div>
                          </Link>
                          <div className="flex flex-1 flex-col">
                            <Link href={`/products/${item.product_id}`}>
                              <h3 className="font-medium leading-snug hover:text-primary">{item.product?.name}</h3>
                            </Link>
                            {item.product?.brand && <p className="text-xs text-muted-foreground">{item.product.brand}</p>}
                            <p className="font-display font-bold text-primary mt-1">{formatPrice(price)}</p>
                            <div className="mt-auto flex items-center justify-between pt-2">
                              <div className="flex items-center rounded-lg border">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                                  <Minus className="h-3.5 w-3.5" />
                                </Button>
                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => saveForLater(item.id, true)}>
                                  <BookmarkPlus className="h-4 w-4" /> Save
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeFromCart(item.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Saved for later */}
              {savedItems.length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-display text-lg font-semibold">Saved for Later ({savedItems.length})</h2>
                  {savedItems.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="flex gap-4 p-4">
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {item.product?.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="flex flex-1 flex-col">
                          <h3 className="font-medium">{item.product?.name}</h3>
                          <p className="font-display font-bold text-primary">{formatPrice(item.product?.price ?? 0)}</p>
                          <div className="mt-auto pt-2">
                            <Button variant="outline" size="sm" onClick={() => saveForLater(item.id, false)}>
                              Move to Cart
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Order summary */}
            <div>
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Coupon */}
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-lg bg-accent p-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{appliedCoupon.code}</span>
                      </div>
                      <button onClick={removeCoupon} className="text-destructive"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <form onSubmit={applyCoupon} className="flex gap-2">
                      <Input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                      <Button type="submit" variant="outline" disabled={couponLoading}>
                        {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                      </Button>
                    </form>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping Fee</span>
                      <span className="font-medium">{formatPrice(shippingFee)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-base">
                      <span className="font-semibold">Total</span>
                      <span className="font-display font-bold text-primary">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <Button className="w-full" size="lg" asChild disabled={activeItems.length === 0}>
                    <Link href="/checkout">Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/categories">Continue Shopping</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
