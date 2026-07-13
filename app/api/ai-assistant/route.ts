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

interface AIResponse {
  message: string;
  intent: string;
  data?: any;
  suggestions?: string[];
}

function detectIntent(query: string): string {
  const lower = query.toLowerCase();
  if (/order|track|delivery|shipping|where.*package/.test(lower)) return 'order';
  if (/product|price|buy|search|find|looking for/.test(lower)) return 'product';
  if (/return|refund|cancel/.test(lower)) return 'return';
  if (/coupon|discount|promo|deal/.test(lower)) return 'coupon';
  if (/account|profile|password|login/.test(lower)) return 'account';
  if (/shipping.*cost|delivery.*fee|shipping.*rate/.test(lower)) return 'shipping_info';
  if (/help|support|contact|talk to human/.test(lower)) return 'support';
  return 'general';
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

    const { query, conversation_id } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const intent = detectIntent(query);
    let response: AIResponse = {
      message: '',
      intent,
    };

    switch (intent) {
      case 'order': {
        // Look up user's orders
        const { data: orders } = await supabase
          .from('orders')
          .select('id, order_number, status, total, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (orders && orders.length > 0) {
          response.message = `Here are your recent orders:\n${orders
            .map((o: any) => `• ${o.order_number} - ${o.status} - $${o.total}`)
            .join('\n')}`;
          response.data = { orders };
          response.suggestions = ['Track my latest order', 'View order details', 'Report a problem with an order'];
        } else {
          response.message = "You don't have any orders yet. Would you like to browse our products?";
          response.suggestions = ['Browse products', 'Search for a product'];
        }
        break;
      }

      case 'product': {
        // Search products based on query
        const { data: products } = await supabase
          .from('products')
          .select('id, name, price, images, rating')
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .eq('is_active', true)
          .limit(5);

        if (products && products.length > 0) {
          response.message = `I found these products that might interest you:\n${products
            .map((p: any) => `• ${p.name} - $${p.price} (Rating: ${p.rating || 'N/A'})`)
            .join('\n')}`;
          response.data = { products };
          response.suggestions = ['Add to cart', 'View product details', 'Search for more products'];
        } else {
          response.message = "I couldn't find any products matching your query. Could you try different keywords?";
          response.suggestions = ['Browse all products', 'Browse categories'];
        }
        break;
      }

      case 'shipping_info': {
        response.message = 'Our shipping rates are:\n• Standard shipping (3-5 business days): $10\n• Express shipping (1-2 business days): $25\n• Free shipping on orders over $100';
        response.suggestions = ['Track my order', 'View my orders'];
        break;
      }

      case 'return': {
        response.message = 'You can request a return or refund within 30 days of delivery. Please go to your order history, select the order, and click "Request Return". A support agent will review your request within 24 hours.';
        response.suggestions = ['View my orders', 'Create a support ticket'];
        break;
      }

      case 'coupon': {
        const { data: coupons } = await supabase
          .from('coupons')
          .select('code, description, discount_type, discount_value')
          .eq('is_active', true)
          .lte('valid_from', new Date().toISOString())
          .gte('valid_until', new Date().toISOString())
          .limit(5);

        if (coupons && coupons.length > 0) {
          response.message = `Here are the available coupons:\n${coupons
            .map((c: any) => `• ${c.code} - ${c.description || `${c.discount_value}${c.discount_type === 'percentage' ? '%' : '$'} off`}`)
            .join('\n')}`;
          response.data = { coupons };
        } else {
          response.message = "There are no active coupons available at the moment. Please check back later!";
        }
        break;
      }

      case 'account': {
        response.message = 'You can manage your account settings from your profile page. There you can update your password, personal information, and notification preferences.';
        response.suggestions = ['View my profile', 'Change my password'];
        break;
      }

      case 'support': {
        response.message = 'You can create a support ticket and our team will get back to you within 24 hours. Would you like me to help you create one?';
        response.suggestions = ['Create a support ticket', 'View my tickets'];
        break;
      }

      default: {
        response.message = "I'm here to help with products, orders, shipping, returns, and more. What would you like to know about?";
        response.suggestions = ['Track my order', 'Search products', 'Shipping information', 'Request a return'];
        break;
      }
    }

    // Store the conversation if conversation_id provided
    if (conversation_id) {
      await supabase.from('ai_chat_logs').insert({
        user_id: user.id,
        conversation_id,
        query,
        intent,
        response: response.message,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('AI assistant error:', error);
    return NextResponse.json(
      { error: 'Failed to process query', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
