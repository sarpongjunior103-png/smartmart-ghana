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
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const vendor = searchParams.get('vendor');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const supabase = await getSupabaseServerClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('products')
      .select('id, name, slug, description, price, compare_at_price, images, rating, stock, category_id, vendor_id, created_at', {
        count: 'exact',
      })
      .eq('is_active', true);

    if (category) query = query.eq('category_id', category);
    if (vendor) query = query.eq('vendor_id', vendor);
    if (minPrice) query = query.gte('price', parseFloat(minPrice));
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice));

    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json(
      {
        products: data,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const body = await request.json();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Check if user is a vendor
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select('id, is_active')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendorData || !vendorData.is_active) {
      return NextResponse.json(
        { error: 'Only active vendors can create products' },
        { status: 403, headers: corsHeaders }
      );
    }

    const {
      name,
      slug,
      description,
      price,
      compare_at_price,
      images,
      category_id,
      stock,
      sku,
      weight,
      dimensions,
    } = body;

    if (!name || !price || !category_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name, price, category_id' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        description,
        price,
        compare_at_price,
        images,
        category_id,
        vendor_id: vendorData.id,
        stock: stock || 0,
        sku,
        weight,
        dimensions,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ product: data }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
