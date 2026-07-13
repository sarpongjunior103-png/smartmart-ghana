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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // If order_id is provided, get specific invoice
    if (orderId) {
      // Verify order belongs to user
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(
          `id, order_number, status, subtotal, discount, shipping_cost, tax, total, created_at,
           shipping_address, shipping(address, carrier, tracking_number),
           order_items(id, product_id, quantity, unit_price, products(id, name, images)),
           profiles(id, full_name, email)`
        )
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (orderError || !order) {
        return NextResponse.json(
          { error: 'Invoice not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      // Get invoice record
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('id, invoice_number, pdf_url, status, created_at, due_date')
        .eq('order_id', orderId)
        .single();

      if (invoiceError) {
        // Generate invoice data from order if no invoice record exists
        return NextResponse.json(
          {
            invoice: {
              invoice_number: `INV-${order.order_number}`,
              order,
              status: order.status,
              created_at: order.created_at,
            },
          },
          { headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { invoice: { ...invoice, order } },
        { headers: corsHeaders }
      );
    }

    // List all invoices for user
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('invoices')
      .select(
        `id, invoice_number, order_id, status, pdf_url, created_at, due_date,
         orders(id, order_number, total, status)`,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json(
      {
        invoices: data,
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
    console.error('Invoices GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
