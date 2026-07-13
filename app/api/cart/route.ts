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
      .from('cart_items')
      .select(
        `id, quantity, created_at,
         products(id, name, slug, price, compare_at_price, images, stock)`
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ cart: data }, { headers: corsHeaders });
  } catch (error) {
    console.error('Cart GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart', details: error instanceof Error ? error.message : 'Unknown error' },
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

    const { product_id, quantity = 1 } = body;

    if (!product_id) {
      return NextResponse.json(
        { error: 'product_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if item already in cart
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ cart_item: data }, { headers: corsHeaders });
    }

    const { data, error } = await supabase
      .from('cart_items')
      .insert({
        user_id: user.id,
        product_id,
        quantity,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ cart_item: data }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Cart POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add to cart', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const { item_id, quantity } = body;

    if (!item_id || quantity === undefined) {
      return NextResponse.json(
        { error: 'item_id and quantity are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (quantity <= 0) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', item_id)
        .eq('user_id', user.id);

      if (error) throw error;
      return NextResponse.json({ message: 'Item removed' }, { headers: corsHeaders });
    }

    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', item_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ cart_item: data }, { headers: corsHeaders });
  } catch (error) {
    console.error('Cart PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update cart', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('item_id');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    if (!itemId) {
      return NextResponse.json(
        { error: 'item_id query parameter is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Item removed from cart' }, { headers: corsHeaders });
  } catch (error) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove from cart', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
