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
      .from('wishlist_items')
      .select(
        `id, created_at,
         products(id, name, slug, price, compare_at_price, images, stock)`
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ wishlist: data }, { headers: corsHeaders });
  } catch (error) {
    console.error('Wishlist GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlist', details: error instanceof Error ? error.message : 'Unknown error' },
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

    const { product_id } = body;

    if (!product_id) {
      return NextResponse.json(
        { error: 'product_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if already in wishlist
    const { data: existing } = await supabase
      .from('wishlist_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Product already in wishlist' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data, error } = await supabase
      .from('wishlist_items')
      .insert({
        user_id: user.id,
        product_id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ wishlist_item: data }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add to wishlist', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const itemId = searchParams.get('item_id');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    let query = supabase.from('wishlist_items').delete().eq('user_id', user.id);

    if (itemId) {
      query = query.eq('id', itemId);
    } else if (productId) {
      query = query.eq('product_id', productId);
    } else {
      return NextResponse.json(
        { error: 'item_id or product_id query parameter is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { error } = await query;

    if (error) throw error;

    return NextResponse.json({ message: 'Item removed from wishlist' }, { headers: corsHeaders });
  } catch (error) {
    console.error('Wishlist DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove from wishlist', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
