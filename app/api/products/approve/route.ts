// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

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

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can approve or reject products' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { product_id, action, rejection_reason } = body;

    if (!product_id || !action) {
      return NextResponse.json(
        { error: 'product_id and action are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "approve" or "reject"' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data: product } = await supabase
      .from('products')
      .select('id, name, vendor_id, status')
      .eq('id', product_id)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
    }

    // Get vendor email
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id, business_name, business_email, owner_name')
      .eq('id', product.vendor_id)
      .maybeSingle();

    if (action === 'approve') {
      const { error } = await supabase
        .from('products')
        .update({ status: 'published' })
        .eq('id', product_id);

      if (error) throw error;

      let emailSent = false;
      if (vendor?.business_email) {
        const result = await sendEmail(vendor.business_email, 'product_approval', {
          name: vendor.owner_name || vendor.business_name,
          productName: product.name,
        });
        emailSent = result.success;
      }

      return NextResponse.json({
        success: true,
        message: 'Product approved and is now live',
        email_sent: emailSent,
      }, { headers: corsHeaders });
    } else {
      if (!rejection_reason) {
        return NextResponse.json(
          { error: 'rejection_reason is required when rejecting a product' },
          { status: 400, headers: corsHeaders }
        );
      }

      const { error } = await supabase
        .from('products')
        .update({ status: 'rejected' })
        .eq('id', product_id);

      if (error) throw error;

      let emailSent = false;
      if (vendor?.business_email) {
        const result = await sendEmail(vendor.business_email, 'product_rejection', {
          name: vendor.owner_name || vendor.business_name,
          productName: product.name,
          reason: rejection_reason,
        });
        emailSent = result.success;
      }

      return NextResponse.json({
        success: true,
        message: 'Product rejected and seller notified',
        email_sent: emailSent,
      }, { headers: corsHeaders });
    }
  } catch (error) {
    console.error('Product approval error:', error);
    return NextResponse.json(
      { error: 'Failed to process product approval', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
