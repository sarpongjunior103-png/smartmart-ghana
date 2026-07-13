// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { CONTACT } from '@/lib/contact';
import { DELIVERY_METHODS, PAYMENT_METHODS, PAYMENT_GATEWAYS } from '@/lib/constants';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

// ─── Intent detection ──────────────────────────────────────────────────────

type Intent =
  | 'product_search'
  | 'product_recommend'
  | 'product_compare'
  | 'product_discount'
  | 'order_track'
  | 'shipping_info'
  | 'return_refund'
  | 'payment_help'
  | 'seller_help'
  | 'customer_support'
  | 'faq'
  | 'general';

function detectIntent(message: string): Intent {
  const m = message.toLowerCase();
  // Order tracking: must be specific — "track my order", "track order", "where is my order"
  if (/\btrack\b.*\border\b|\border\b.*\btrack\b|my order|order status|where.*my.*order|recent order|delivery status/.test(m)) return 'order_track';
  if (/compare|vs\.?|versus|difference between|which is better/.test(m)) return 'product_compare';
  if (/discount|on sale|deal|reduced|clearance|special offer|coupon|promo/.test(m)) return 'product_discount';
  if (/shipping|delivery.*fee|delivery.*cost|how long.*deliver|shipping rate|dispatch|courier/.test(m)) return 'shipping_info';
  if (/return|refund|cancel.*order|money back|exchange policy|warranty/.test(m)) return 'return_refund';
  if (/pay|payment|mobile money|momo|card|checkout|how to pay|payment method|visa|mastercard|hubtel|paystack/.test(m)) return 'payment_help';
  if (/sell|vendor|seller|become a seller|list.*product|store|my products|dashboard.*seller/.test(m)) return 'seller_help';
  if (/support|contact|help.*human|talk to.*human|agent|ticket|complaint|issue/.test(m)) return 'customer_support';
  if (/recommend|best.*for|suggest|what.*should i|good.*for|top.*product/.test(m)) return 'product_recommend';
  if (/faq|frequently asked|how do i|can i|do you|is it possible|what.*policy|how.*work/.test(m)) return 'faq';
  if (/search|find|show me|looking for|do you have|browse|filter|under|over|by brand|by category/.test(m)) return 'product_search';
  return 'general';
}

// ─── Price extraction ───────────────────────────────────────────────────────

function extractPriceConstraint(query: string): { maxPrice?: number; minPrice?: number } {
  const lower = query.toLowerCase();
  const result: { maxPrice?: number; minPrice?: number } = {};
  const maxMatch = lower.match(/(?:under|below|max(?:imum)?|less than|cheaper than)\s*(?:gh[s₵¢]?\s*)?([\d,.]+)/);
  const minMatch = lower.match(/(?:over|above|min(?:imum)?|more than|at least)\s*(?:gh[s₵¢]?\s*)?([\d,.]+)/);
  if (maxMatch) result.maxPrice = parseFloat(maxMatch[1].replace(/,/g, ''));
  if (minMatch) result.minPrice = parseFloat(minMatch[1].replace(/,/g, ''));
  return result;
}

// ─── Keyword extraction ─────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'recommend', 'show', 'me', 'find', 'looking', 'for', 'search', 'product', 'products',
  'under', 'over', 'below', 'above', 'ghs', 'gh₵', 'featured', 'popular', 'trending',
  'best', 'compare', 'vs', 'versus', 'i', 'im', 'i\'m', 'i', 'am', 'a', 'an', 'the',
  'please', 'help', 'with', 'some', 'good', 'cheap', 'affordable', 'want', 'need',
  'buy', 'purchase', 'order', 'get', 'see', 'have', 'do', 'you', 'is', 'are', 'was',
  'were', 'can', 'could', 'would', 'should', 'will', 'my', 'your', 'our', 'they',
  'them', 'it', 'this', 'that', 'these', 'those', 'and', 'or', 'but', 'in', 'on',
  'at', 'to', 'from', 'of', 'by', 'as', 'like', 'than', 'so', 'if', 'then',
  'which', 'what', 'who', 'where', 'when', 'why', 'how', 'about',
]);

function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

// ─── Brand extraction ───────────────────────────────────────────────────────

const KNOWN_BRANDS = [
  'samsung', 'iphone', 'apple', 'nokia', 'tecno', 'infinix', 'itel', 'huawei', 'xiaomi',
  'oppo', 'vivo', 'motorola', 'sony', 'lg', 'hp', 'dell', 'lenovo', 'asus', 'acer',
  'macbook', 'canon', 'nikon', 'jbl', 'anker', 'logitech', 'adidas', 'nike', 'puma',
];

function extractBrands(query: string): string[] {
  const lower = query.toLowerCase();
  return KNOWN_BRANDS.filter((b) => lower.includes(b));
}

// ─── Category extraction ────────────────────────────────────────────────────

const KNOWN_CATEGORIES: Record<string, string[]> = {
  phones: ['phone', 'phones', 'smartphone', 'smartphones', 'mobile', 'mobile phone'],
  computers: ['laptop', 'laptops', 'computer', 'computers', 'pc', 'desktop', 'notebook'],
  electronics: ['electronic', 'electronics', 'gadget', 'gadgets', 'device'],
  fashion: ['fashion', 'clothing', 'clothes', 'shirt', 'shoes', 'sneakers', 'dress', 'apparel'],
  beauty: ['beauty', 'cosmetics', 'makeup', 'lipstick', 'skincare', 'perfume'],
  groceries: ['groceries', 'food', 'snacks', 'drinks', 'beverages'],
  health: ['health', 'wellness', 'vitamins', 'medicine', 'medical'],
  'home & kitchen': ['home', 'kitchen', 'appliance', 'appliances', 'cookware', 'decor'],
  furniture: ['furniture', 'chair', 'table', 'sofa', 'bed', 'desk'],
  books: ['book', 'books', 'novel', 'textbook', 'stationery'],
  sports: ['sports', 'fitness', 'gym', 'exercise', 'football', 'soccer'],
  gaming: ['gaming', 'game', 'games', 'console', 'xbox', 'playstation', 'controller'],
  automotive: ['car', 'auto', 'automotive', 'vehicle', 'motor', 'parts'],
  agriculture: ['agric', 'agriculture', 'farming', 'farm', 'tools', 'seeds'],
};

function extractCategoryKeywords(query: string): string[] {
  const lower = query.toLowerCase();
  const matched: string[] = [];
  for (const [cat, aliases] of Object.entries(KNOWN_CATEGORIES)) {
    if (aliases.some((alias) => lower.includes(alias))) matched.push(cat);
  }
  return matched;
}

// ─── Data fetching ──────────────────────────────────────────────────────────

async function fetchProducts(supabase: any, message: string, opts: { limit?: number; featuredOnly?: boolean; discountedOnly?: boolean } = {}) {
  const { maxPrice, minPrice } = extractPriceConstraint(message);
  const limit = opts.limit ?? 5;
  const brands = extractBrands(message);
  const categoryKeywords = extractCategoryKeywords(message);
  const keywords = extractKeywords(message);

  let query = supabase
    .from('products')
    .select('id, name, price, discount_price, image_url, rating, brand, stock, description, is_featured, category_id, specifications, tags')
    .eq('status', 'published');

  if (maxPrice !== undefined) query = query.lte('price', maxPrice);
  if (minPrice !== undefined) query = query.gte('price', minPrice);
  if (opts.featuredOnly) query = query.eq('is_featured', true);
  if (opts.discountedOnly) query = query.not('discount_price', 'is', null).filter('discount_price', 'lt', 'price');

  // Category filter
  if (categoryKeywords.length > 0) {
    const { data: cats } = await supabase.from('categories').select('id, name').ilike('name', `%${categoryKeywords[0]}%`);
    if (cats && cats.length > 0) {
      query = query.eq('category_id', cats[0].id);
    }
  }

  // Brand filter
  if (brands.length > 0) {
    query = query.ilike('brand', `%${brands[0]}%`);
  }

  // Keyword search — only when no brand or category filter is active,
  // otherwise the keyword (often the category name itself) excludes products
  // that belong to the category but don't have the word in their name.
  if (keywords.length > 0 && brands.length === 0 && categoryKeywords.length === 0) {
    const firstKeyword = keywords[0];
    query = query.or(`name.ilike.%${firstKeyword}%,description.ilike.%${firstKeyword}%,brand.ilike.%${firstKeyword}%`);
  }

  const { data: products, error } = await query.order('rating', { ascending: false }).limit(limit);
  if (error) {
    console.error('Product fetch error:', error);
    return [];
  }
  return products || [];
}

async function fetchProductsForCompare(supabase: any, message: string) {
  const brands = extractBrands(message);
  const keywords = extractKeywords(message);
  const results: any[] = [];

  for (const brand of brands) {
    // Search by brand column OR by name (since many products have null brand)
    const { data } = await supabase
      .from('products')
      .select('id, name, price, discount_price, image_url, rating, brand, stock, description, specifications')
      .eq('status', 'published')
      .or(`brand.ilike.%${brand}%,name.ilike.%${brand}%`)
      .order('rating', { ascending: false })
      .limit(2);
    if (data) results.push(...data);
  }

  // If no brands detected, try keywords
  if (results.length === 0 && keywords.length > 0) {
    for (const kw of keywords.slice(0, 2)) {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, discount_price, image_url, rating, brand, stock, description, specifications')
        .eq('status', 'published')
        .or(`name.ilike.%${kw}%,brand.ilike.%${kw}%`)
        .order('rating', { ascending: false })
        .limit(2);
      if (data) results.push(...data);
    }
  }

  // Deduplicate by id
  const seen = new Set<string>();
  return results.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  }).slice(0, 4);
}

async function fetchUserOrders(supabase: any, userId: string) {
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, total, payment_method, delivery_method,
      created_at, estimated_delivery_date, tracking_number, delivery_status,
      order_items (product_name, quantity, price, product_image)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Order fetch error:', error);
    return [];
  }
  return orders || [];
}

// ─── System prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(products: any[], user: any, intent: Intent, orders: any[]): string {
  const productList = products.length > 0
    ? products.map((p, i) =>
        `${i + 1}. ${p.name} — GH₵${Number(p.price).toFixed(2)}${p.discount_price ? ` (discount: GH₵${Number(p.discount_price).toFixed(2)})` : ''} — Brand: ${p.brand || 'N/A'} — Rating: ${p.rating || 'N/A'} — Stock: ${p.stock} — ${p.description?.slice(0, 120) || ''}`
      ).join('\n')
    : 'No products matched the query.';

  const orderList = orders.length > 0
    ? orders.map((o) =>
        `Order ${o.order_number}: status=${o.status}, total=GH₵${Number(o.total).toFixed(2)}, delivery=${o.delivery_status}, placed=${new Date(o.created_at).toLocaleDateString()}, est. delivery=${o.estimated_delivery_date || 'TBD'}, tracking=${o.tracking_number || 'N/A'}, items: ${o.order_items?.map((i: any) => `${i.product_name} x${i.quantity}`).join(', ') || 'N/A'}`
      ).join('\n')
    : 'No recent orders found.';

  const deliveryInfo = DELIVERY_METHODS.map(d => `${d.label}: ${d.description}, GH₵${d.fee}`).join('\n');
  const paymentInfo = PAYMENT_METHODS.map(p => `${p.label}: ${p.description}`).join('\n');
  const gateways = PAYMENT_GATEWAYS.map(g => `${g.label}: ${g.description}`).join('\n');

  return `You are the AI shopping assistant for SmartMart Ghana, an e-commerce marketplace for Ghana and Africa. Prices are in Ghana Cedis (GH₵).

You help with: product search, product recommendations, product comparisons, order tracking, shipping info, return/refund policies, payment assistance, seller assistance, customer support, and FAQs.

Guidelines:
- Be friendly, concise, and helpful. Keep responses under 200 words.
- When recommending or comparing products, reference them by name and price from the data below.
- For order tracking, summarize the order status, delivery status, and estimated delivery date.
- For shipping questions, use the delivery options below.
- For return/refund questions, use the policy below.
- For payment questions, use the payment methods below.
- For seller questions, explain how to become a seller and manage products.
- If the user is not signed in and asks about orders, tell them to sign in first.
- Never make up product data — only use the products listed below.

Store policies:
- Returns/refunds within 7 days of delivery. Go to Order History → select order → Request Return.
- Support contact: ${CONTACT.phone}, ${CONTACT.email}

Delivery options:
${deliveryInfo}
Free standard shipping on orders over GH₵200.

Payment methods:
${paymentInfo}

Payment gateways:
${gateways}

Seller info:
- Register at /seller/register to become a vendor.
- Manage products at /seller/dashboard.
- Vendor commission rate: 5%.

${user ? `The current user is signed in (ID: ${user.id}).` : 'The current user is not signed in.'}

Detected intent: ${intent}

Relevant products from our catalog:
${productList}

${orders.length > 0 ? `User's recent orders:\n${orderList}` : ''}

Respond naturally as a helpful shopping assistant based on the intent and data above.`;
}

// ─── OpenAI call ────────────────────────────────────────────────────────────

async function callOpenAI(message: string, products: any[], user: any, intent: Intent, orders: any[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');

  const systemPrompt = buildSystemPrompt(products, user, intent, orders);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 400,
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

// ─── Fallback responses (no OpenAI) ─────────────────────────────────────────

function fallbackResponse(message: string, products: any[], intent: Intent, orders: any[]): { response: string; recommendations: any[] } {
  const m = message.toLowerCase();

  switch (intent) {
    case 'order_track': {
      if (orders.length === 0) {
        return {
          response: orders.length === 0 && !products.length
            ? "I couldn't find any recent orders. Please make sure you're signed in, then ask me again. You can also track your order on the Track Order page using your order number."
            : "I couldn't find any recent orders. Please make sure you're signed in, then ask me again.",
          recommendations: [],
        };
      }
      const lines = orders.map((o: any) => {
        const items = o.order_items?.map((i: any) => `${i.product_name} x${i.quantity}`).join(', ') || 'N/A';
        return `Order ${o.order_number} — Status: ${o.status} — Delivery: ${o.delivery_status} — Total: GH₵${Number(o.total).toFixed(2)} — Est. delivery: ${o.estimated_delivery_date || 'TBD'} — Items: ${items}`;
      });
      return {
        response: `Here are your recent orders:\n\n${lines.join('\n\n')}\n\nYou can view full details on your Orders page.`,
        recommendations: [],
      };
    }

    case 'product_compare': {
      if (products.length < 2) {
        return {
          response: "I'd be happy to compare products for you. Please specify which products or brands you'd like to compare, e.g., 'Compare Samsung and iPhone'.",
          recommendations: products,
        };
      }
      const lines = products.map((p: any) =>
        `${p.name} — GH₵${Number(p.price).toFixed(2)}${p.discount_price ? ` (discount: GH₵${Number(p.discount_price).toFixed(2)})` : ''} — Rating: ${p.rating || 'N/A'} — Stock: ${p.stock}`
      );
      return {
        response: `Here's a comparison of the products I found:\n\n${lines.join('\n\n')}\n\nTap any product to view full details and specifications.`,
        recommendations: products,
      };
    }

    case 'product_discount': {
      if (products.length === 0) {
        return {
          response: "There are no products on discount at the moment. Check back soon — we regularly update our deals! You can also browse our featured products for great value options.",
          recommendations: [],
        };
      }
      return {
        response: `I found ${products.length} product${products.length > 1 ? 's' : ''} on discount for you:`,
        recommendations: products,
      };
    }

    case 'shipping_info': {
      return {
        response: `Here are our shipping options:\n\n• Standard Delivery (3-5 business days): GH₵15\n• Express Delivery (1-2 business days): GH₵35\n• Pickup Station: Free\n\nFree standard shipping on orders over GH₵200.\n\nYou can select your preferred delivery method at checkout.`,
        recommendations: [],
      };
    }

    case 'return_refund': {
      return {
        response: `Our return and refund policy:\n\n• Returns accepted within 7 days of delivery\n• Items must be unused and in original packaging\n• To request a return: go to Order History → select the order → click "Request Return"\n• Refunds are processed within 5-7 business days after we receive the returned item\n• For damaged or wrong items, contact us immediately at ${CONTACT.email}\n\nNeed help with a specific return? I can connect you with our support team.`,
        recommendations: [],
      };
    }

    case 'payment_help': {
      return {
        response: `We support several payment methods:\n\n• MTN Mobile Money\n• Telecel Cash\n• AirtelTigo Money\n• Visa / Mastercard (via Paystack, Flutterwave, or Stripe)\n• Cash on Delivery\n\nAt checkout, select your preferred payment method. For mobile money, you'll receive a prompt on your phone to authorize the payment. For cards, enter your card details securely.\n\nHaving payment issues? Contact us at ${CONTACT.phone}.`,
        recommendations: [],
      };
    }

    case 'seller_help': {
      return {
        response: `Want to sell on SmartMart Ghana? Here's how:\n\n1. Register as a vendor at /seller/register\n2. After approval, access your seller dashboard at /seller/dashboard\n3. Add products with photos, descriptions, and pricing\n4. Manage inventory, track orders, and view sales analytics\n5. Commission rate: 5% per sale\n\nYou keep 95% of every sale, and we handle payment processing and customer support.`,
        recommendations: [],
      };
    }

    case 'customer_support': {
      return {
        response: `I'm here to help! For additional support:\n\n📞 Phone: ${CONTACT.phone}\n✉️ Email: ${CONTACT.email}\n\nYou can also create a support ticket from your dashboard — our team responds within 24 hours. For urgent issues, call us directly during business hours (8am–6pm GMT).`,
        recommendations: [],
      };
    }

    case 'faq': {
      return {
        response: `Here are answers to common questions:\n\n• How do I track my order? Go to /orders/track and enter your order number.\n• What payment methods do you accept? MTN MoMo, Telecel Cash, AirtelTigo, Visa/Mastercard, and Cash on Delivery.\n• How long does delivery take? Standard: 3-5 days, Express: 1-2 days.\n• Can I return a product? Yes, within 7 days of delivery.\n• Do you ship nationwide? Yes, we deliver across all 16 regions of Ghana.\n• How do I become a seller? Register at /seller/register.\n\nAsk me any of these questions directly for more details!`,
        recommendations: [],
      };
    }

    case 'product_recommend': {
      if (products.length === 0) {
        return {
          response: "I'd love to recommend products for you! Tell me what you're looking for — e.g., 'best laptops for students', 'phones under GHS 3,000', or 'featured products'.",
          recommendations: [],
        };
      }
      const names = products.map((p) => `${p.name} (GH₵${Number(p.price).toFixed(2)})`).join(', ');
      return {
        response: `Based on your request, here are my top recommendations: ${names}. These have great ratings and value for money. Tap any product to see full details!`,
        recommendations: products,
      };
    }

    case 'product_search': {
      if (products.length === 0) {
        return {
          response: "I couldn't find products matching your search. Try different keywords, browse by category, or ask me to recommend something. For example: 'Show me phones under GHS 3,000' or 'Recommend laptops for students'.",
          recommendations: [],
        };
      }
      return {
        response: `I found ${products.length} product${products.length > 1 ? 's' : ''} matching your search:`,
        recommendations: products,
      };
    }

    default: {
      if (products.length > 0) {
        return {
          response: `Here are some products that might interest you:`,
          recommendations: products,
        };
      }
      return {
        response: "I'm your SmartMart shopping assistant! I can help you:\n\n• Find and compare products\n• Track your orders\n• Answer questions about shipping, returns, and payments\n• Get product recommendations\n• Help with seller questions\n\nWhat would you like to know?",
        recommendations: [],
      };
    }
  }
}

// ─── Main handler ────────────────────────────────────────────────────────────

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
    const intent = detectIntent(message);

    // Fetch data based on intent
    let products: any[] = [];
    let orders: any[] = [];

    switch (intent) {
      case 'product_compare':
        products = await fetchProductsForCompare(supabase, message);
        break;
      case 'product_discount':
        products = await fetchProducts(supabase, message, { discountedOnly: true, limit: 5 });
        break;
      case 'product_recommend':
        products = await fetchProducts(supabase, message, { limit: 5 });
        break;
      case 'product_search':
        products = await fetchProducts(supabase, message, { limit: 5 });
        break;
      case 'order_track':
        if (user) orders = await fetchUserOrders(supabase, user.id);
        break;
      default:
        // For general/faq/shipping/returns/payment/seller/support intents,
        // still try to fetch relevant products if the query mentions product-like terms
        if (/product|phone|laptop|electronic|fashion|beauty|home|book|sport|game|car|agric/.test(message.toLowerCase())) {
          products = await fetchProducts(supabase, message, { limit: 3 });
        }
        break;
    }

    // Try OpenAI first
    if (process.env.OPENAI_API_KEY) {
      try {
        const aiResponse = await callOpenAI(message, products, user, intent, orders);
        return NextResponse.json({
          response: aiResponse,
          recommendations: products,
          intent,
        }, { headers: corsHeaders });
      } catch (err) {
        console.error('OpenAI call failed, falling back:', err);
      }
    }

    // Fallback to rule-based responses
    const fallback = fallbackResponse(message, products, intent, orders);
    return NextResponse.json({
      ...fallback,
      intent,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('AI assistant error:', error);
    // Return a friendly error response instead of a 500
    return NextResponse.json({
      response: "I'm having trouble right now. Please try again in a moment, or contact our support team at " + CONTACT.phone + ".",
      recommendations: [],
      intent: 'general',
    }, { status: 200, headers: corsHeaders });
  }
}
