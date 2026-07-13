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
    const productId = searchParams.get('product_id');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!productId) {
      return NextResponse.json(
        { error: 'product_id query parameter is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('inventory_logs')
      .select(
        `id, product_id, change_type, quantity_change, previous_stock, new_stock,
         reason, created_at,
         profiles(id, full_name)`,
        { count: 'exact' }
      )
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json(
      {
        logs: data,
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
    console.error('Inventory GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory logs', details: error instanceof Error ? error.message : 'Unknown error' },
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

    // Check if vendor
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Only vendors can update inventory' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { product_id, quantity_change, change_type, reason } = body;

    if (!product_id || quantity_change === undefined) {
      return NextResponse.json(
        { error: 'product_id and quantity_change are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get current product stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, stock, vendor_id')
      .eq('id', product_id)
      .single();

    if (productError) throw productError;

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
    }

    // Verify vendor owns the product
    if (product.vendor_id !== vendor.id) {
      return NextResponse.json(
        { error: 'You can only update inventory for your own products' },
        { status: 403, headers: corsHeaders }
      );
    }

    const previousStock = product.stock;
    const newStock = change_type === 'decrease' ? previousStock - Math.abs(quantity_change) : previousStock + Math.abs(quantity_change);

    if (newStock < 0) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update product stock
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', product_id);

    if (updateError) throw updateError;

    // Create inventory log
    const { data: log, error: logError } = await supabase
      .from('inventory_logs')
      .insert({
        product_id,
        user_id: user.id,
        change_type: change_type || 'increase',
        quantity_change: change_type === 'decrease' ? -Math.abs(quantity_change) : Math.abs(quantity_change),
        previous_stock: previousStock,
        new_stock: newStock,
        reason,
      })
      .select()
      .single();

    if (logError) throw logError;

    return NextResponse.json({ log, new_stock: newStock }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Inventory POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
