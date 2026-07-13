// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { data, error } = await supabase
      .from('orders')
      .select(
        `id, order_number, status, total, subtotal, shipping_fee, discount_amount, payment_method, delivery_method, created_at, estimated_delivery_date, tracking_number, delivery_status,
         order_items(id, product_id, product_name, product_image, price, quantity, vendor_id)`
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ orders: data }, { headers: corsHeaders });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const body = await request.json();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { shipping_address, delivery_method, payment_method, coupon_code } = body;

    // Fetch cart items
    const { data: cartItems, error: cartError } = await supabase
      .from('cart')
      .select(`id, quantity, products(id, name, price, discount_price, stock, vendor_id, image_url)`)
      .eq('user_id', user.id)
      .eq('saved_for_later', false);

    if (cartError) throw cartError;

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400, headers: corsHeaders });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = cartItems.map((item: any) => {
      const price = item.products?.discount_price && item.products.discount_price < item.products.price
        ? item.products.discount_price
        : item.products?.price ?? 0;
      subtotal += price * item.quantity;
      return {
        product_id: item.products.id,
        product_name: item.products.name,
        product_image: item.products.image_url,
        price,
        quantity: item.quantity,
        vendor_id: item.products.vendor_id,
      };
    });

    // Apply coupon if provided
    let discount = 0;
    if (coupon_code) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('id, discount_type, discount_value, min_order_amount, max_uses, used_count, active, expires_at')
        .eq('code', coupon_code)
        .eq('active', true)
        .maybeSingle();

      if (coupon) {
        if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
          return NextResponse.json(
            { error: `Minimum order of ${coupon.min_order_amount} required for this coupon` },
            { status: 400, headers: corsHeaders }
          );
        }
        if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
          return NextResponse.json(
            { error: 'Coupon usage limit reached' },
            { status: 400, headers: corsHeaders }
          );
        }
        discount =
          coupon.discount_type === 'percentage'
            ? (subtotal * coupon.discount_value) / 100
            : coupon.discount_value;
      }
    }

    const shippingFee = subtotal > 100 ? 0 : 10;
    const total = subtotal - discount + shippingFee;

    // Create order
    const orderNumber = `SMG-${Date.now().toString(36).toUpperCase()}`;
    const deliveryDays = delivery_method === 'express' ? 2 : delivery_method === 'pickup' ? 1 : 5;
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + deliveryDays);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        status: 'pending',
        subtotal,
        discount_amount: discount,
        shipping_fee: shippingFee,
        total,
        payment_method,
        delivery_method,
        coupon_code,
        shipping_address,
        estimated_delivery_date: estimatedDate.toISOString().split('T')[0],
        delivery_status: 'order_received',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items
    const itemsWithOrderId = orderItems.map((item: any) => ({ ...item, order_id: order.id }));
    const { error: itemsError } = await supabase.from('order_items').insert(itemsWithOrderId);

    if (itemsError) throw itemsError;

    // Record payment
    await supabase.from('payments').insert({
      order_id: order.id,
      provider: payment_method,
      amount: total,
      currency: 'GHS',
      status: 'pending',
    });

    // Clear cart
    await supabase.from('cart').delete().eq('user_id', user.id).eq('saved_for_later', false);

    return NextResponse.json({ order }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Orders POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
