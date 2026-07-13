// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { sendOrderEmail } from '@/lib/email';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
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
        { error: 'Only admins and vendors can update order status' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { order_id, status, tracking_number, delivery_status } = body;

    if (!order_id || !status) {
      return NextResponse.json(
        { error: 'order_id and status are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, status, user_id')
      .eq('id', order_id)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: corsHeaders });
    }

    // If vendor, verify they have items in this order
    if (profile.role === 'vendor') {
      const { data: orderItem } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', order_id)
        .eq('vendor_id', user.id)
        .maybeSingle();

      if (!orderItem) {
        return NextResponse.json(
          { error: 'You can only update orders containing your products' },
          { status: 403, headers: corsHeaders }
        );
      }
    }

    // Update order
    const updates: Record<string, unknown> = { status };
    if (tracking_number) updates.tracking_number = tracking_number;
    if (delivery_status) updates.delivery_status = delivery_status;

    // Map order status to delivery status if not explicitly provided
    if (!delivery_status) {
      const statusToDelivery: Record<string, string> = {
        confirmed: 'processing',
        processing: 'processing',
        shipped: 'dispatched',
        delivered: 'delivered',
        cancelled: 'cancelled',
        refunded: 'returned',
      };
      if (statusToDelivery[status]) {
        updates.delivery_status = statusToDelivery[status];
      }
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', order_id);

    if (updateError) throw updateError;

    // Send email notification based on new status
    const templateMap: Record<string, string> = {
      confirmed: 'order_confirmation',
      shipped: 'order_shipped',
      delivered: 'order_delivered',
      cancelled: 'order_cancelled',
      refunded: 'refund_notification',
    };

    const template = templateMap[status];
    if (template) {
      const extraData: Record<string, unknown> = {};
      if (tracking_number) extraData.trackingNumber = tracking_number;
      if (status === 'cancelled') extraData.reason = 'Order cancelled by seller/admin';
      if (status === 'refunded') extraData.refundAmount = Number(order.total);

      await sendOrderEmail(supabase, order_id, template, extraData);
    }

    return NextResponse.json({
      success: true,
      message: `Order status updated to "${status}" and email notification sent`,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Order status update error:', error);
    return NextResponse.json(
      { error: 'Failed to update order status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
