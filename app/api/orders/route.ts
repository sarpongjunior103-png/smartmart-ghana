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
    const supabase = await getSupabaseServerClient();

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
        `id, order_number, status, total, subtotal, shipping_cost, tax, created_at,
         order_items(id, product_id, quantity, unit_price, products(id, name, images))`
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
    const supabase = await getSupabaseServerClient();
    const body = await request.json();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { shipping_address_id, coupon_code } = body;

    // Fetch cart items
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(`id, quantity, products(id, name, price, stock, vendor_id)`)
      .eq('user_id', user.id);

    if (cartError) throw cartError;

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400, headers: corsHeaders });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = cartItems.map((item: any) => {
      const unitPrice = item.products.price;
      subtotal += unitPrice * item.quantity;
      return {
        product_id: item.products.id,
        quantity: item.quantity,
        unit_price: unitPrice,
        vendor_id: item.products.vendor_id,
      };
    });

    // Apply coupon if provided
    let discount = 0;
    if (coupon_code) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('id, discount_type, discount_value, min_order')
        .eq('code', coupon_code)
        .eq('is_active', true)
        .single();

      if (coupon) {
        if (coupon.min_order && subtotal < coupon.min_order) {
          return NextResponse.json(
            { error: `Minimum order of ${coupon.min_order} required for this coupon` },
            { status: 400, headers: corsHeaders }
          );
        }
        discount =
          coupon.discount_type === 'percentage'
            ? (subtotal * coupon.discount_value) / 100
            : coupon.discount_value;
      }
    }

    const shippingCost = subtotal > 100 ? 0 : 10;
    const tax = (subtotal - discount) * 0.075;
    const total = subtotal - discount + shippingCost + tax;

    // Create order
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        status: 'pending',
        subtotal,
        discount,
        shipping_cost: shippingCost,
        tax,
        total,
        shipping_address_id: shipping_address_id,
        coupon_code,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items
    const itemsWithOrderId = orderItems.map((item: any) => ({ ...item, order_id: order.id }));
    const { error: itemsError } = await supabase.from('order_items').insert(itemsWithOrderId);

    if (itemsError) throw itemsError;

    // Clear cart
    const { error: clearError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (clearError) throw clearError;

    return NextResponse.json({ order }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Orders POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
