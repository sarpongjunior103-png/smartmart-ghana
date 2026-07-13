// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { CONTACT } from '@/lib/contact';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

function extractPriceConstraint(query: string): { maxPrice?: number; minPrice?: number } {
  const lower = query.toLowerCase();
  const underMatch = lower.match(/under\s+gh[₵¢]?\s*([\d,.]+)/);
  const belowMatch = lower.match(/below\s+gh[₵¢]?\s*([\d,.]+)/);
  const maxMatch = lower.match(/max(?:imum)?\s+gh[₵¢]?\s*([\d,.]+)/);
  const overMatch = lower.match(/over\s+gh[₵¢]?\s*([\d,.]+)/);
  const aboveMatch = lower.match(/above\s+gh[₵¢]?\s*([\d,.]+)/);

  const result: { maxPrice?: number; minPrice?: number } = {};
  const maxSrc = underMatch || belowMatch || maxMatch;
  if (maxSrc) result.maxPrice = parseFloat(maxSrc[1].replace(/,/g, ''));
  const minSrc = overMatch || aboveMatch;
  if (minSrc) result.minPrice = parseFloat(minSrc[1].replace(/,/g, ''));
  return result;
}

async function fetchRelevantProducts(supabase: any, message: string) {
  const { maxPrice, minPrice } = extractPriceConstraint(message);
  const isFeatured = /featured|popular|trending|best/.test(message.toLowerCase());

  let query = supabase
    .from('products')
    .select('id, name, price, discount_price, image_url, rating, brand, stock, description, is_featured')
    .eq('is_active', true);

  if (maxPrice !== undefined) query = query.lte('price', maxPrice);
  if (minPrice !== undefined) query = query.gte('price', minPrice);
  if (isFeatured) query = query.eq('is_featured', true);

  const keywords = message
    .toLowerCase()
    .replace(/(recommend|show me|find|looking for|search|products?|under|over|below|above|gh[₵¢]?|[\d,.]+|featured|popular|trending|best|compare|for me|i'm|i am|a|an|the|please|help|me|with|some|good|cheap|affordable)/g, ' ')
    .split(/\s+/)
    .filter((w: string) => w.length > 2);

  if (keywords.length > 0) {
    const firstKeyword = keywords[0];
    query = query.or(`name.ilike.%${firstKeyword}%,description.ilike.%${firstKeyword}%,brand.ilike.%${firstKeyword}%`);
  }

  const { data: products, error } = await query
    .order('rating', { ascending: false })
    .limit(5);

  if (error) return [];
  return products || [];
}

function buildSystemPrompt(products: any[], user: any): string {
  const productList = products.length > 0
    ? products.map((p, i) =>
        `${i + 1}. ${p.name} — GH₵${Number(p.price).toFixed(2)}${p.discount_price ? ` (discount: GH₵${Number(p.discount_price).toFixed(2)})` : ''} — Brand: ${p.brand || 'N/A'} — Rating: ${p.rating || 'N/A'} — Stock: ${p.stock} — ${p.description?.slice(0, 100) || ''}`
      ).join('\n')
    : 'No products matched the query.';

  return `You are the AI shopping assistant for SmartMart Ghana, an e-commerce marketplace for Ghana and Africa. Prices are in Ghana Cedis (GH₵).

Your role:
- Help users find products, compare options, and get shopping recommendations
- Answer questions about orders, shipping, returns, coupons, and account
- Be friendly, concise, and helpful. Keep responses under 150 words.
- When recommending products, reference them by name and price from the data below
- If the user asks about orders, shipping, returns, coupons, or support, give helpful guidance based on the store policies below

Store policies:
- Standard delivery (3-5 business days): GH₵15
- Express delivery (1-2 business days): GH₵35
- Pickup station: Free
- Free standard shipping on orders over GH₵500
- Returns/refunds within 7 days of delivery
- Support contact: ${CONTACT.phone}, ${CONTACT.email}

${user ? `The current user is signed in (ID: ${user.id}).` : 'The current user is not signed in.'}

Relevant products from our catalog:
${productList}

Respond naturally as a helpful shopping assistant. If products are listed above, recommend them in your response. If no products matched, suggest browsing categories or trying different keywords.`;
}

async function callOpenAI(message: string, products: any[], user: any): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const systemPrompt = buildSystemPrompt(products, user);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
}

function fallbackResponse(message: string, products: any[]): { response: string; recommendations: any[] } {
  const lower = message.toLowerCase();

  if (/shipping.*cost|delivery.*fee|shipping.*rate/.test(lower)) {
    return {
      response: 'Our shipping rates are:\n• Standard delivery (3-5 business days): GH₵15\n• Express delivery (1-2 business days): GH₵35\n• Pickup station: Free\n\nFree standard shipping on orders over GH₵500!',
      recommendations: [],
    };
  }
  if (/return|refund|cancel/.test(lower)) {
    return {
      response: 'You can request a return or refund within 7 days of delivery. Go to your order history, select the order, and click "Request Return". Our support team will review your request within 24 hours.',
      recommendations: [],
    };
  }
  if (/help|support|contact|talk to human/.test(lower)) {
    return {
      response: `You can reach our support team at:\n📞 Phone: ${CONTACT.phone}\n✉️ Email: ${CONTACT.email}\n\nOr create a support ticket from your dashboard and we'll get back to you within 24 hours.`,
      recommendations: [],
    };
  }

  if (products.length > 0) {
    return {
      response: `I found ${products.length} product${products.length > 1 ? 's' : ''} that might interest you:`,
      recommendations: products,
    };
  }

  return {
    response: "I'm here to help with products, orders, shipping, returns, coupons, and more. What would you like to know about?",
    recommendations: [],
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const body = await request.json();

    const message = body.message ?? body.query;
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    const products = await fetchRelevantProducts(supabase, message);

    // If OpenAI key is configured, use it for natural language responses
    if (process.env.OPENAI_API_KEY) {
      try {
        const aiResponse = await callOpenAI(message, products, user);
        return NextResponse.json({
          response: aiResponse,
          recommendations: products,
        }, { headers: corsHeaders });
      } catch (err) {
        console.error('OpenAI call failed, falling back:', err);
      }
    }

    // Fallback to rule-based responses if no API key or OpenAI fails
    const fallback = fallbackResponse(message, products);
    return NextResponse.json(fallback, { headers: corsHeaders });
  } catch (error) {
    console.error('AI assistant error:', error);
    return NextResponse.json(
      { error: 'Failed to process query', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
