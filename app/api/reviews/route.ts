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
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!productId) {
      return NextResponse.json(
        { error: 'product_id query parameter is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('reviews')
      .select(
        `id, rating, comment, created_at,
         profiles(id, first_name, last_name, avatar_url)`,
        { count: 'exact' }
      )
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json(
      {
        reviews: data,
        pagination: {
          page, limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Reviews GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews', details: error instanceof Error ? error.message : 'Unknown error' },
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

    const { product_id, rating, comment } = body;

    if (!product_id || !rating) {
      return NextResponse.json(
        { error: 'product_id and rating are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify user has purchased the product
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['delivered', 'completed']);

    if (orders && orders.length > 0) {
      const orderIds = orders.map((o: any) => o.id);
      const { data: orderItem } = await supabase
        .from('order_items')
        .select('id')
        .eq('product_id', product_id)
        .in('order_id', orderIds)
        .maybeSingle();

      if (!orderItem) {
        return NextResponse.json(
          { error: 'You can only review products you have purchased' },
          { status: 403, headers: corsHeaders }
        );
      }
    }

    // Check if already reviewed
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('product_id', product_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        product_id,
        user_id: user.id,
        rating,
        comment,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ review: data }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Reviews POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create review', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
