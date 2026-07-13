// @ts-nocheck
import { getSupabaseServerClient } from '@/lib/supabase/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function sendEmail(
  to: string,
  template: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ to, template, data }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`sendEmail failed (${response.status}):`, errorBody);
      return { success: false, error: `Email send failed: ${response.status}` };
    }

    const result = await response.json();
    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error('sendEmail error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendOrderEmail(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  orderId: string,
  template: string,
  extraData: Record<string, unknown> = {}
): Promise<void> {
  const { data: order } = await supabase
    .from('orders')
    .select(`id, order_number, total, user_id, shipping_address`)
    .eq('id', orderId)
    .maybeSingle();

  if (!order) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, first_name, last_name')
    .eq('id', order.user_id)
    .maybeSingle();

  if (!profile?.email) return;

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Customer';
  const shippingAddress = order.shipping_address
    ? typeof order.shipping_address === 'object'
      ? `${order.shipping_address.full_name ?? ''}, ${order.shipping_address.street_address ?? ''}, ${order.shipping_address.city ?? ''}, ${order.shipping_address.region ?? ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '')
      : String(order.shipping_address)
    : 'N/A';

  await sendEmail(profile.email, template, {
    name,
    orderId: order.order_number,
    total: Number(order.total),
    currency: 'GHS',
    shippingAddress,
    ...extraData,
  });
}
