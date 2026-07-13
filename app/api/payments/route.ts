// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    let query = supabase
      .from('payments')
      .select('id, order_id, amount, currency, provider, gateway, status, reference, phone, created_at')
      .order('created_at', { ascending: false });

    if (orderId) {
      query = query.eq('order_id', orderId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ payments: data }, { headers: corsHeaders });
  } catch (error) {
    console.error('Payments GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments', details: error instanceof Error ? error.message : 'Unknown error' },
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

    const { order_id, gateway, amount, email, callback_url } = body;

    if (!order_id || !gateway || !amount) {
      return NextResponse.json(
        { error: 'order_id, gateway, and amount are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total, order_number')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: corsHeaders });
    }

    const reference = `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    let authorizationUrl: string | null = null;
    let provider = gateway;

    switch (gateway) {
      case 'paystack': {
        const paystackKey = process.env.PAYSTACK_SECRET_KEY;
        if (!paystackKey) {
          return NextResponse.json(
            { error: 'Paystack not configured' },
            { status: 500, headers: corsHeaders }
          );
        }
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${paystackKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email || user.email,
            amount: Math.round(amount * 100),
            currency: 'GHS',
            reference,
            callback_url: callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/processing`,
          }),
        });
        const paystackData = await response.json();
        authorizationUrl = paystackData?.data?.authorization_url || null;
        break;
      }
      case 'flutterwave': {
        const flutterwaveKey = process.env.FLUTTERWAVE_SECRET_KEY;
        if (!flutterwaveKey) {
          return NextResponse.json(
            { error: 'Flutterwave not configured' },
            { status: 500, headers: corsHeaders }
          );
        }
        const response = await fetch('https://api.flutterwave.com/v3/payments', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${flutterwaveKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tx_ref: reference,
            amount,
            currency: 'GHS',
            customer: { email: email || user.email },
            redirect_url: callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/processing`,
          }),
        });
        const flutterwaveData = await response.json();
        authorizationUrl = flutterwaveData?.data?.link || null;
        break;
      }
      case 'hubtel': {
        const hubtelKey = process.env.HUBTEL_SECRET_KEY;
        if (!hubtelKey) {
          return NextResponse.json(
            { error: 'Hubtel not configured' },
            { status: 500, headers: corsHeaders }
          );
        }
        authorizationUrl = `https://pay.hubtel.com/checkout/${reference}`;
        break;
      }
      case 'stripe': {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) {
          return NextResponse.json(
            { error: 'Stripe not configured' },
            { status: 500, headers: corsHeaders }
          );
        }
        const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            'mode': 'payment',
            'line_items[0][price_data][unit_amount]': String(Math.round(amount * 100)),
            'line_items[0][price_data][currency]': 'ghs',
            'line_items[0][price_data][product_data][name]': order.order_number,
            'line_items[0][quantity]': '1',
            'success_url': `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
            'cancel_url': `${process.env.NEXT_PUBLIC_APP_URL}/payment/failure`,
            'client_reference_id': reference,
          }),
        });
        const stripeData = await response.json();
        authorizationUrl = stripeData?.url || null;
        break;
      }
      case 'cash_on_delivery': {
        authorizationUrl = null;
        break;
      }
      default:
        return NextResponse.json(
          { error: 'Unsupported payment gateway' },
          { status: 400, headers: corsHeaders }
        );
    }

    // Record payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id,
        provider,
        gateway,
        amount,
        currency: 'GHS',
        status: 'pending',
        reference,
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    return NextResponse.json(
      { payment, authorization_url: authorizationUrl, reference },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Payments POST error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize payment', details: error instanceof Error ? error.message : 'Unknown error' },
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

    const { payment_id, status, gateway_reference, gateway_response } = body;

    if (!payment_id || !status) {
      return NextResponse.json(
        { error: 'payment_id and status are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data, error } = await supabase
      .from('payments')
      .update({
        status,
        gateway_reference: gateway_reference || null,
        gateway_response: gateway_response || null,
      })
      .eq('id', payment_id)
      .select()
      .single();

    if (error) throw error;

    // If payment is successful, update order status and send email
    if (status === 'success' || status === 'completed') {
      await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', data.order_id);

      try {
        const { sendOrderEmail } = await import('@/lib/email');
        await sendOrderEmail(supabase, data.order_id, 'order_confirmation');
      } catch (emailErr) {
        console.error('Failed to send order confirmation email:', emailErr);
      }
    }

    return NextResponse.json({ payment: data }, { headers: corsHeaders });
  } catch (error) {
    console.error('Payments PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
