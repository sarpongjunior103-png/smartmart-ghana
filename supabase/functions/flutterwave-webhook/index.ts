// ============================================================================
// Flutterwave Webhook Handler
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
    description: `Flutterwave event: ${action} for ${reference}`,
    metadata,
    created_at: new Date().toISOString(),
  }, env);
}

// ============================================================================
// Event Handlers
// ============================================================================

async function handleChargeCompleted(data: any, env: Record<string, string>): Promise<void> {
  const reference = data.tx_ref || data.flw_ref || "";
  const amount = data.amount || 0;
  const currency = (data.currency || "NGN").toUpperCase();
  const customerEmail = data.customer?.email || null;
  const status = data.status === "successful" ? "success" : (data.status || "pending");

  // Update payment
  await supabaseRequest(
    `payments?reference=eq.${encodeURIComponent(reference)}`,
    "PATCH",
    {
      status,
      amount,
      currency,
      customer_email: customerEmail,
      updated_at: new Date().toISOString(),
    },
    env
  );

  // Update transaction
  await supabaseRequest(
    `transactions?reference=eq.${encodeURIComponent(reference)}`,
    "PATCH",
    {
      status,
      amount,
      currency,
      updated_at: new Date().toISOString(),
    },
    env
  );

  // Confirm order if successful
  if (status === "success") {
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
  }

  await logActivity(`payment.${status}`, reference, {
    gateway: "flutterwave",
    amount,
    currency,
    customerEmail,
  }, env);
}

async function handleRefundCompleted(data: any, env: Record<string, string>): Promise<void> {
  const reference = data.tx_ref || data.flw_ref || "";
  const amount = data.amount || 0;
  const currency = (data.currency || "NGN").toUpperCase();

  // Update payment
  await supabaseRequest(
    `payments?reference=eq.${encodeURIComponent(reference)}`,
    "PATCH",
    {
      status: "refunded",
      refund_amount: amount,
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

  // Update order
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
    gateway: "flutterwave",
    amount,
    currency,
  }, env);
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
      FLUTTERWAVE_SECRET_KEY: Deno.env.get("FLUTTERWAVE_SECRET_KEY") || "",
      FLUTTERWAVE_WEBHOOK_HASH: Deno.env.get("FLUTTERWAVE_WEBHOOK_HASH") || "",
    };

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: "Server misconfiguration" }, 500);
    }

    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    // Flutterwave sends: { event, data: { ... } }
    // Verify the webhook hash if configured
    const providedHash = req.headers.get("verif-hash");
    if (env.FLUTTERWAVE_WEBHOOK_HASH && providedHash !== env.FLUTTERWAVE_WEBHOOK_HASH) {
      return jsonResponse({ error: "Invalid webhook hash" }, 401);
    }

    const eventType = body.event;
    const data = body.data || {};

    switch (eventType) {
      case "charge.completed":
        await handleChargeCompleted(data, env);
        break;
      case "refund.completed":
        await handleRefundCompleted(data, env);
        break;
      default:
        return jsonResponse({ message: "Event acknowledged", event: eventType });
    }

    return jsonResponse({ message: "Webhook processed", event: eventType });
  } catch (error) {
    console.error("Flutterwave webhook error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
