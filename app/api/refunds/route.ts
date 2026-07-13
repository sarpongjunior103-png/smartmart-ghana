// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { sendEmail, sendOrderEmail } from '@/lib/email';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    let query = supabase
      .from('refunds')
      .select(`*, orders(order_number, total, status, order_items(product_name, quantity, price))`)
      .order('created_at', { ascending: false });

    if (profile?.role === 'admin') {
      // Admins see all refund requests
    } else if (profile?.role === 'vendor') {
      // Vendors see refunds for orders containing their products
      query = query.in('order_id', (
        supabase.from('order_items').select('order_id').eq('vendor_id', user.id)
      ));
    } else {
      // Customers see only their own refunds
      query = query.eq('user_id', user.id);
    }

    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ refunds: data }, { headers: corsHeaders });
  } catch (error) {
    console.error('Refunds GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch refunds', details: error instanceof Error ? error.message : 'Unknown error' },
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

    const { order_id, type, reason } = body;

    if (!order_id || !type || !reason) {
      return NextResponse.json(
        { error: 'order_id, type, and reason are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!['refund', 'cancellation'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be "refund" or "cancellation"' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, total, status, user_id')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: corsHeaders });
    }

    // Check if order is eligible for refund/cancellation
    if (type === 'cancellation' && !['pending', 'confirmed', 'processing'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Order can only be cancelled when in pending, confirmed, or processing state' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (type === 'refund' && !['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Order is not eligible for a refund' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check for existing refund request
    const { data: existing } = await supabase
      .from('refunds')
      .select('id')
      .eq('order_id', order_id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'A pending refund/cancellation request already exists for this order' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create refund request
    const { data: refund, error: refundError } = await supabase
      .from('refunds')
      .insert({
        order_id,
        user_id: user.id,
        type,
        reason,
        status: 'pending',
        amount: Number(order.total),
      })
      .select()
      .single();

    if (refundError) throw refundError;

    // If cancellation, update order status immediately to 'cancelled'
    if (type === 'cancellation') {
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order_id);
      await sendOrderEmail(supabase, order_id, 'order_cancelled', { reason });
    }

    return NextResponse.json({ refund }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Refunds POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create refund request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !['admin', 'vendor'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Only admins and vendors can process refund requests' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { refund_id, action, admin_notes, rejection_reason } = body;

    if (!refund_id || !action) {
      return NextResponse.json(
        { error: 'refund_id and action are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!['approve', 'reject', 'complete'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "approve", "reject", or "complete"' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data: refund, error: fetchError } = await supabase
      .from('refunds')
      .select('*, orders(id, order_number, total, status, user_id)')
      .eq('id', refund_id)
      .maybeSingle();

    if (fetchError || !refund) {
      return NextResponse.json({ error: 'Refund request not found' }, { status: 404, headers: corsHeaders });
    }

    if (refund.status !== 'pending' && action !== 'complete') {
      return NextResponse.json(
        { error: 'Refund request has already been processed' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (action === 'approve') {
      await supabase
        .from('refunds')
        .update({ status: 'approved', admin_notes: admin_notes || null, processed_by: user.id })
        .eq('id', refund_id);

      // Update order status
      if (refund.type === 'cancellation') {
        await supabase.from('orders').update({ status: 'cancelled' }).eq('id', refund.order_id);
        await sendOrderEmail(supabase, refund.order_id, 'order_cancelled', { reason: refund.reason });
      } else {
        await supabase.from('orders').update({ status: 'refunded' }).eq('id', refund.order_id);
        await sendOrderEmail(supabase, refund.order_id, 'refund_notification', {
          refundAmount: Number(refund.amount),
          reason: refund.reason,
        });
      }
    } else if (action === 'reject') {
      if (!rejection_reason) {
        return NextResponse.json(
          { error: 'rejection_reason is required when rejecting a refund request' },
          { status: 400, headers: corsHeaders }
        );
      }

      await supabase
        .from('refunds')
        .update({ status: 'rejected', admin_notes: admin_notes || null, rejection_reason, processed_by: user.id })
        .eq('id', refund_id);

      // Notify customer of rejection
      const { data: customerProfile } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', refund.user_id)
        .maybeSingle();

      if (customerProfile?.email) {
        const name = [customerProfile.first_name, customerProfile.last_name].filter(Boolean).join(' ') || 'Customer';
        await sendEmail(customerProfile.email, 'refund_notification', {
          name,
          orderId: refund.orders?.order_number || '',
          refundAmount: 0,
          currency: 'GHS',
          reason: `Your refund request was rejected: ${rejection_reason}`,
        });
      }
    } else if (action === 'complete') {
      await supabase
        .from('refunds')
        .update({ status: 'completed', processed_by: user.id })
        .eq('id', refund_id);

      await supabase.from('orders').update({ status: 'refunded' }).eq('id', refund.order_id);
      await sendOrderEmail(supabase, refund.order_id, 'refund_notification', {
        refundAmount: Number(refund.amount),
        reason: refund.reason,
      });
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Refunds PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to process refund request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
