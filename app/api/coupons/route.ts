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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

    let query = supabase
      .from('coupons')
      .select('id, code, description, discount_type, discount_value, min_order, max_discount, usage_limit, used_count, is_active, valid_from, valid_until, created_at');

    if (!isAdmin) {
      query = query.eq('is_active', true).lte('valid_from', new Date().toISOString()).gte('valid_until', new Date().toISOString());
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
    const supabase = await getSupabaseServerClient();
    const body = await request.json();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Check if admin
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

    const { code, description, discount_type, discount_value, min_order, max_discount, usage_limit, valid_from, valid_until } = body;

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
        min_order,
        max_discount,
        usage_limit,
        valid_from: valid_from || new Date().toISOString(),
        valid_until,
        is_active: true,
        used_count: 0,
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
    const supabase = await getSupabaseServerClient();
    const body = await request.json();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Check if admin
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
    const supabase = await getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const couponId = searchParams.get('id');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Check if admin
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
