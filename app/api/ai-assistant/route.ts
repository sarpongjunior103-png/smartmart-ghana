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

function detectIntent(query: string): string {
  const lower = query.toLowerCase();
  if (/order|track|delivery|shipping|where.*package/.test(lower)) return 'order';
  if (/return|refund|cancel/.test(lower)) return 'return';
  if (/coupon|discount|promo|deal/.test(lower)) return 'coupon';
  if (/account|profile|password|login/.test(lower)) return 'account';
  if (/shipping.*cost|delivery.*fee|shipping.*rate/.test(lower)) return 'shipping_info';
  if (/help|support|contact|talk to human/.test(lower)) return 'support';
  if (/product|price|buy|search|find|looking for|recommend|show me|compare|phone|electronics|laptop|fashion|feature/.test(lower)) return 'product';
  return 'general';
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

    const intent = detectIntent(message);

    // Try to get user for personalized responses (optional)
    const { data: { user } } = await supabase.auth.getUser();

    switch (intent) {
      case 'product': {
        const { maxPrice, minPrice } = extractPriceConstraint(message);
        const isFeatured = /featured|popular|trending|best/.test(message.toLowerCase());

        let query = supabase
          .from('products')
          .select('id, name, price, discount_price, image_url, rating, brand, stock, is_active, is_featured')
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

        if (error) {
          return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500, headers: corsHeaders }
          );
        }

        if (products && products.length > 0) {
          const priceNote = maxPrice !== undefined ? ` under GH₵${maxPrice}` : '';
          return NextResponse.json({
            response: `I found ${products.length} product${products.length > 1 ? 's' : ''}${priceNote} that might interest you:`,
            recommendations: products,
            intent,
          }, { headers: corsHeaders });
        }

        return NextResponse.json({
          response: "I couldn't find any products matching your query. Could you try different keywords or browse our categories?",
          recommendations: [],
          intent,
        }, { headers: corsHeaders });
      }

      case 'order': {
        if (!user) {
          return NextResponse.json({
            response: "To track your orders, please sign in to your account first. You can also browse our products without an account!",
            recommendations: [],
            intent,
          }, { headers: corsHeaders });
        }

        const { data: orders, error } = await supabase
          .from('orders')
          .select('id, status, total, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          return NextResponse.json({
            response: "I had trouble retrieving your orders. Please try again later.",
            recommendations: [],
            intent,
          }, { headers: corsHeaders });
        }

        if (orders && orders.length > 0) {
          const orderList = orders
            .map((o: any) => `• Order #${o.id.slice(0, 8)} — ${o.status} — GH₵${Number(o.total).toFixed(2)}`)
            .join('\n');
          return NextResponse.json({
            response: `Here are your recent orders:\n${orderList}\n\nYou can view full details in your dashboard.`,
            recommendations: [],
            intent,
          }, { headers: corsHeaders });
        }

        return NextResponse.json({
          response: "You don't have any orders yet. Would you like to browse our products?",
          recommendations: [],
          intent,
        }, { headers: corsHeaders });
      }

      case 'shipping_info': {
        return NextResponse.json({
          response: 'Our shipping rates are:\n• Standard delivery (3-5 business days): GH₵15\n• Express delivery (1-2 business days): GH₵35\n• Pickup station: Free\n\nFree standard shipping on orders over GH₵500!',
          recommendations: [],
          intent,
        }, { headers: corsHeaders });
      }

      case 'return': {
        return NextResponse.json({
          response: 'You can request a return or refund within 7 days of delivery. Go to your order history, select the order, and click "Request Return". Our support team will review your request within 24 hours.',
          recommendations: [],
          intent,
        }, { headers: corsHeaders });
      }

      case 'coupon': {
        const { data: coupons, error } = await supabase
          .from('coupons')
          .select('code, description, discount_type, discount_value')
          .eq('is_active', true)
          .lte('valid_from', new Date().toISOString())
          .gte('valid_until', new Date().toISOString())
          .limit(5);

        if (error) {
          return NextResponse.json({
            response: "I couldn't fetch coupons at the moment. Please try again later.",
            recommendations: [],
            intent,
          }, { headers: corsHeaders });
        }

        if (coupons && coupons.length > 0) {
          const couponList = coupons
            .map((c: any) => `• ${c.code} — ${c.description || `${c.discount_value}${c.discount_type === 'percentage' ? '%' : ' GH₵'} off`}`)
            .join('\n');
          return NextResponse.json({
            response: `Here are the available coupons:\n${couponList}`,
            recommendations: [],
            intent,
          }, { headers: corsHeaders });
        }

        return NextResponse.json({
          response: "There are no active coupons available at the moment. Please check back later!",
          recommendations: [],
          intent,
        }, { headers: corsHeaders });
      }

      case 'account': {
        return NextResponse.json({
          response: 'You can manage your account settings from your profile page. There you can update your password, personal information, and notification preferences.',
          recommendations: [],
          intent,
        }, { headers: corsHeaders });
      }

      case 'support': {
        return NextResponse.json({
          response: `You can reach our support team at:\n📞 Phone: ${CONTACT.phone}\n✉️ Email: ${CONTACT.email}\n\nOr create a support ticket from your dashboard and we'll get back to you within 24 hours.`,
          recommendations: [],
          intent,
        }, { headers: corsHeaders });
      }

      default: {
        return NextResponse.json({
          response: "I'm here to help with products, orders, shipping, returns, coupons, and more. What would you like to know about?",
          recommendations: [],
          intent,
        }, { headers: corsHeaders });
      }
    }
  } catch (error) {
    console.error('AI assistant error:', error);
    return NextResponse.json(
      { error: 'Failed to process query', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
