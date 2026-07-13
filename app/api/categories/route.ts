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

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, image_url, parent_id, is_active, created_at')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ categories: data }, { headers: corsHeaders });
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const body = await request.json();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can create categories' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { name, slug, description, image_url, parent_id } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        description,
        image_url,
        parent_id,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ category: data }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Categories POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create category', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
