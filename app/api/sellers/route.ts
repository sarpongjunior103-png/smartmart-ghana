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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('vendors')
      .select(
        `id, business_name, slug, logo_url, description, rating, total_sales,
         is_active, is_verified, created_at,
         profiles(id, full_name, email, avatar_url)`,
        { count: 'exact' }
      )
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json(
      {
        vendors: data,
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
    console.error('Sellers GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors', details: error instanceof Error ? error.message : 'Unknown error' },
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

    // Check if already a vendor
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingVendor) {
      return NextResponse.json(
        { error: 'You are already registered as a vendor' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { business_name, slug, logo_url, description, business_email, phone, address } = body;

    if (!business_name) {
      return NextResponse.json(
        { error: 'business_name is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data: vendor, error } = await supabase
      .from('vendors')
      .insert({
        user_id: user.id,
        business_name,
        slug: slug || business_name.toLowerCase().replace(/\s+/g, '-'),
        logo_url,
        description,
        business_email: business_email || user.email,
        phone,
        address,
        is_active: false,
        is_verified: false,
        rating: 0,
        total_sales: 0,
      })
      .select()
      .single();

    if (error) throw error;

    // Update user profile role
    await supabase
      .from('profiles')
      .update({ role: 'vendor' })
      .eq('id', user.id);

    return NextResponse.json({ vendor }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Sellers POST error:', error);
    return NextResponse.json(
      { error: 'Failed to register as vendor', details: error instanceof Error ? error.message : 'Unknown error' },
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

    // Get vendor record for this user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const { business_name, slug, logo_url, description, business_email, phone, address } = body;

    const { data: updated, error } = await supabase
      .from('vendors')
      .update({
        business_name,
        slug,
        logo_url,
        description,
        business_email,
        phone,
        address,
      })
      .eq('id', vendor.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ vendor: updated }, { headers: corsHeaders });
  } catch (error) {
    console.error('Sellers PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
