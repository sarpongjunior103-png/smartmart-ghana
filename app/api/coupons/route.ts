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
      .single();

    const isAdmin = profile?.role === 'admin';

    let query = supabase
      .from('coupons')
      .select('id, code, description, discount_type, discount_value, min_order_amount, max_uses, used_count, active, expires_at, created_at');

    if (!isAdmin) {
      query = query.eq('active', true).gte('expires_at', new Date().toISOString());
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ coupons: data }, { headers: corsHeaders });
  } catch (error) {
    console.error('Coupons GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons', details: error instanceof Error ? error.message : 'Unknown error' },
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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can create coupons' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { code, description, discount_type, discount_value, min_order_amount, max_uses, expires_at } = body;

    if (!code || !discount_type || discount_value === undefined) {
      return NextResponse.json(
        { error: 'code, discount_type, and discount_value are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data, error } = await supabase
      .from('coupons')
      .insert({
        code: code.toUpperCase(),
        description,
        discount_type,
        discount_value,
        min_order_amount,
        max_uses,
        active: true,
        used_count: 0,
        expires_at,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ coupon: data }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Coupons POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create coupon', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update coupons' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Coupon id is required' }, { status: 400, headers: corsHeaders });
    }

    const { data, error } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ coupon: data }, { headers: corsHeaders });
  } catch (error) {
    console.error('Coupons PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update coupon', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const couponId = searchParams.get('id');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can delete coupons' },
        { status: 403, headers: corsHeaders }
      );
    }

    if (!couponId) {
      return NextResponse.json({ error: 'id query parameter is required' }, { status: 400, headers: corsHeaders });
    }

    const { error } = await supabase.from('coupons').delete().eq('id', couponId);

    if (error) throw error;

    return NextResponse.json({ message: 'Coupon deleted' }, { headers: corsHeaders });
  } catch (error) {
    console.error('Coupons DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete coupon', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
