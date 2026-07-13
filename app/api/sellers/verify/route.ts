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
      return NextResponse.json({ error: 'Only admins can approve or reject sellers' }, { status: 403, headers: corsHeaders });
    }

    const { vendor_id, action, rejection_reason } = body;

    if (!vendor_id || !action) {
      return NextResponse.json({ error: 'vendor_id and action are required' }, { status: 400, headers: corsHeaders });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400, headers: corsHeaders });
    }

    const { data: vendor } = await supabase
      .from('vendors')
      .select('id, business_name, business_email, owner_name, status')
      .eq('id', vendor_id)
      .maybeSingle();

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404, headers: corsHeaders });
    }

    if (action === 'approve') {
      const { error } = await supabase
        .from('vendors')
        .update({ status: 'approved', rejection_reason: null })
        .eq('id', vendor_id);

      if (error) throw error;

      const emailResult = await sendEmail(
        vendor.business_email || '',
        'vendor_approval',
        { name: vendor.owner_name || vendor.business_name, storeName: vendor.business_name }
      );

      return NextResponse.json({
        success: true,
        message: 'Seller approved and notification email sent',
        email_sent: emailResult.success,
      }, { headers: corsHeaders });
    } else {
      if (!rejection_reason) {
        return NextResponse.json({ error: 'rejection_reason is required when rejecting a seller' }, { status: 400, headers: corsHeaders });
      }

      const { error } = await supabase
        .from('vendors')
        .update({ status: 'rejected', rejection_reason })
        .eq('id', vendor_id);

      if (error) throw error;

      const emailResult = await sendEmail(
        vendor.business_email || '',
        'vendor_rejection',
        { name: vendor.owner_name || vendor.business_name, reason: rejection_reason }
      );

      return NextResponse.json({
        success: true,
        message: 'Seller rejected and notification email sent',
        email_sent: emailResult.success,
      }, { headers: corsHeaders });
    }
  } catch (error) {
    console.error('Seller verification error:', error);
    return NextResponse.json(
      { error: 'Failed to process seller verification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
