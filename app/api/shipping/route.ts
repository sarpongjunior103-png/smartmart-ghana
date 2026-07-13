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
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json(
        { error: 'order_id query parameter is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data, error } = await supabase
      .from('shipping')
      .select(
        `id, order_id, carrier, tracking_number, status, shipping_address,
         shipping_cost, estimated_delivery, shipped_at, delivered_at, created_at`
      )
      .eq('order_id', orderId)
      .single();

    if (error) throw error;

    return NextResponse.json({ shipping: data }, { headers: corsHeaders });
  } catch (error) {
    console.error('Shipping GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping info', details: error instanceof Error ? error.message : 'Unknown error' },
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

    // Check if admin or vendor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const isAdmin = profile?.role === 'admin';
    const isVendor = !!vendor;

    if (!isAdmin && !isVendor) {
      return NextResponse.json(
        { error: 'Only admins or vendors can update shipping info' },
        { status: 403, headers: corsHeaders }
      );
    }

    const {
      order_id,
      carrier,
      tracking_number,
      status,
      shipping_address,
      shipping_cost,
      estimated_delivery,
    } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: 'order_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if shipping record exists
    const { data: existing } = await supabase
      .from('shipping')
      .select('id')
      .eq('order_id', order_id)
      .maybeSingle();

    let data: any;
    let error: any;

    if (existing) {
      const result = await supabase
        .from('shipping')
        .update({
          carrier,
          tracking_number,
          status,
          shipping_address,
          shipping_cost,
          estimated_delivery,
          ...(status === 'shipped' ? { shipped_at: new Date().toISOString() } : {}),
          ...(status === 'delivered' ? { delivered_at: new Date().toISOString() } : {}),
        })
        .eq('id', existing.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from('shipping')
        .insert({
          order_id,
          carrier,
          tracking_number,
          status: status || 'pending',
          shipping_address,
          shipping_cost,
          estimated_delivery,
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) throw error;

    return NextResponse.json({ shipping: data }, { headers: corsHeaders });
  } catch (error) {
    console.error('Shipping POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping info', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
