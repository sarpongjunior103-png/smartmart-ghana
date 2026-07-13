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

const commonMisspellings: Record<string, string> = {
  phne: 'phone', labtop: 'laptop', labtops: 'laptops', headfones: 'headphones',
  shoos: 'shoes', shooes: 'shoes', tshrit: 'tshirt', watchs: 'watches',
  camara: 'camera', camaras: 'cameras', speker: 'speaker', spekers: 'speakers',
};

function correctSpelling(query: string): string {
  const words = query.toLowerCase().split(/\s+/);
  const corrected = words.map((w) => commonMisspellings[w] || w);
  return corrected.join(' ');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const rating = searchParams.get('rating');
    const sort = searchParams.get('sort') || 'relevance';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const autocomplete = searchParams.get('autocomplete') === 'true';

    if (!q) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const correctedQuery = correctSpelling(q);
    const wasCorrected = correctedQuery !== q;

    const supabase = getSupabaseServerClient();
    const offset = (page - 1) * limit;

    if (autocomplete) {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug')
        .eq('status', 'published')
        .or(`name.ilike.%${correctedQuery}%,slug.ilike.%${correctedQuery}%`)
        .limit(8);

      if (error) throw error;

      return NextResponse.json(
        { suggestions: data, correctedQuery: wasCorrected ? correctedQuery : null },
        { headers: corsHeaders }
      );
    }

    let query = supabase
      .from('products')
      .select('id, name, slug, description, price, discount_price, image_url, rating, stock, category_id, vendor_id, brand, review_count, created_at', {
        count: 'exact',
      })
      .eq('status', 'published')
      .or(`name.ilike.%${correctedQuery}%,description.ilike.%${correctedQuery}%,brand.ilike.%${correctedQuery}%`);

    if (category) query = query.eq('category_id', category);
    if (minPrice) query = query.gte('price', parseFloat(minPrice));
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice));
    if (rating) query = query.gte('rating', parseFloat(rating));

    switch (sort) {
      case 'price_asc': query = query.order('price', { ascending: true }); break;
      case 'price_desc': query = query.order('price', { ascending: false }); break;
      case 'rating': query = query.order('rating', { ascending: false }); break;
      case 'newest': query = query.order('created_at', { ascending: false }); break;
      default: query = query.order('rating', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json(
      {
        results: data,
        query: q,
        correctedQuery: wasCorrected ? correctedQuery : null,
        pagination: {
          page, limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
