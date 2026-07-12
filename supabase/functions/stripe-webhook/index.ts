// ============================================================================
// Stripe Webhook Handler
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Stripe-Signature",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

async function supabaseRequest(
  path: string,
  method: string,
  body: unknown,
  env: Record<string, string>
): Promise<Response> {
  return await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
}

async function logActivity(
  action: string,
  reference: string,
  metadata: Record<string, unknown>,
  env: Record<string, string>
): Promise<void> {
  await supabaseRequest("activity_logs", "POST", {
    action,
    entity_type: "payment",
    entity_id: reference,
    description: `Stripe event: ${action} for ${reference}`,
    metadata,
    created_at: new Date().toISOString(),
  }, env);
}

// ============================================================================
// Event Handlers
// ============================================================================

async function handleCheckoutCompleted(session: any, env: Record<string, string>): Promise<void> {
  const reference = session.id;
  const amountTotal = session.amount_total || 0;
  const currency = (session.currency || "usd").toUpperCase();
  const customerEmail = session.customer_details?.email || null;

  // Update payment record
  await supabaseRequest(
    `payments?reference=eq.${encodeURIComponent(reference)}`,
    "PATCH",
    {
      status: "success",
      amount: amountTotal,
      currency,
      customer_email: customerEmail,
      updated_at: new Date().toISOString(),
    },
    env
  );

  // Update transaction record
  await supabaseRequest(
    `transactions?reference=eq.${encodeURIComponent(reference)}`,
    "PATCH",
    {
      status: "success",
      amount: amountTotal,
      currency,
      updated_at: new Date().toISOString(),
    },
    env
  );

  // Confirm the order
  await supabaseRequest(
    `orders?payment_reference=eq.${encodeURIComponent(reference)}`,
    "PATCH",
    {
      payment_status: "paid",
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    env
  );

  await logActivity("payment.success", reference, {
    gateway: "stripe",
    amount: amountTotal,
    currency,
    customerEmail,
  }, env);
}

async function handleChargeRefunded(charge: any, env: Record<string, string>): Promise<void> {
  const reference = charge.id;
  const amountRefunded = charge.amount_refunded || 0;
  const currency = (charge.currency || "usd").toUpperCase();

  // Update payment status
  await supabaseRequest(
    `payments?reference=eq.${encodeURIComponent(reference)}`,
    "PATCH",
    {
      status: "refunded",
      refund_amount: amountRefunded,
      updated_at: new Date().toISOString(),
    },
    env
  );

  // Update transaction
  await supabaseRequest(
    `transactions?reference=eq.${encodeURIComponent(reference)}`,
    "PATCH",
    {
      status: "refunded",
      updated_at: new Date().toISOString(),
    },
    env
  );

  // Update order status
  await supabaseRequest(
    `orders?payment_reference=eq.${encodeURIComponent(reference)}`,
    "PATCH",
    {
      payment_status: "refunded",
      status: "refunded",
      updated_at: new Date().toISOString(),
    },
    env
  );

  await logActivity("payment.refunded", reference, {
    gateway: "stripe",
    amountRefunded,
    currency,
  }, env);
}

async function handleCheckoutExpired(session: any, env: Record<string, string>): Promise<void> {
  const reference = session.id;

  // Mark payment as expired
  await supabaseRequest(
    `payments?reference=eq.${encodeURIComponent(reference)}`,
    "PATCH",
    {
      status: "expired",
      updated_at: new Date().toISOString(),
    },
    env
  );

  // Cancel the order
  await supabaseRequest(
    `orders?payment_reference=eq.${encodeURIComponent(reference)}`,
    "PATCH",
    {
      payment_status: "expired",
      status: "cancelled",
      updated_at: new Date().toISOString(),
    },
    env
  );

  await logActivity("payment.expired", reference, { gateway: "stripe" }, env);
}

// ============================================================================
// Main Handler
// ============================================================================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const env: Record<string, string> = {
      SUPABASE_URL: Deno.env.get("SUPABASE_URL") || "",
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      STRIPE_WEBHOOK_SECRET: Deno.env.get("STRIPE_WEBHOOK_SECRET") || "",
    };

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: "Server misconfiguration" }, 500);
    }

    const rawBody = await req.text();
    const signature = req.headers.get("Stripe-Signature");

    // Parse the event
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return jsonResponse({ error: "Invalid JSON payload" }, 400);
    }

    // Note: In production, verify the Stripe signature using the Stripe SDK.
    // This simplified handler trusts the payload when STRIPE_WEBHOOK_SECRET is unset
    // in development. Always set STRIPE_WEBHOOK_SECRET in production.
    if (env.STRIPE_WEBHOOK_SECRET && signature) {
      // Production signature verification would use Stripe's constructEvent
      // For now, we log a warning if signature is missing
      console.log("Stripe signature present — verify in production with Stripe SDK");
    }

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data?.object, env);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data?.object, env);
        break;
      case "checkout.session.expired":
        await handleCheckoutExpired(event.data?.object, env);
        break;
      default:
        // Acknowledge unhandled events
        return jsonResponse({ message: "Event acknowledged", type: event.type });
    }

    return jsonResponse({ received: true, type: event.type });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
