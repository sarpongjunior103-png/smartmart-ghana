import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { spellCorrect } from '@/lib/search/spell-correct';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') ?? '';
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minRating = searchParams.get('rating');
    const sort = searchParams.get('sort') ?? 'relevance';
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const autocomplete = searchParams.get('autocomplete') === 'true';

    const supabase = getSupabaseServerClient();

    if (autocomplete && q.length >= 2) {
      const { data: suggestions } = await supabase
        .from('products')
        .select('name, brand, category_id')
        .ilike('name', `%${q}%`)
        .eq('status', 'published')
        .limit(8);

      const uniqueNames = [...new Map((suggestions ?? []).map((s: any) => [s.name, s])).values()];
      return NextResponse.json({
        suggestions: uniqueNames.map((s: any) => ({
          name: s.name,
          brand: s.brand,
          category: s.category_id,
        })),
      });
    }

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('status', 'published');

    if (q) {
      const corrected = spellCorrect(q);
      const searchTerm = corrected !== q ? corrected : q;
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`);
    }

    if (category) {
      query = query.eq('category_id', category);
    }

    if (minPrice) query = query.gte('price', parseFloat(minPrice));
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice));
    if (minRating) query = query.gte('rating', parseFloat(minRating));

    switch (sort) {
      case 'price_low':
        query = query.order('price', { ascending: true });
        break;
      case 'price_high':
        query = query.order('price', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'relevance':
      default:
        if (q) {
          query = query.order('is_featured', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }
        break;
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: products, error, count } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const popularSearches = ['phones', 'laptops', 'shoes', 'fashion', 'groceries', 'electronics'];

    return NextResponse.json({
      products: products ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
      query: q,
      correctedQuery: spellCorrect(q) !== q ? spellCorrect(q) : undefined,
      popularSearches: !q ? popularSearches : undefined,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
