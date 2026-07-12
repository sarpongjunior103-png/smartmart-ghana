// ============================================================================
// Hubtel Webhook Handler
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
    description: `Hubtel event: ${action} for ${reference}`,
    metadata,
    created_at: new Date().toISOString(),
  }, env);
}

// ============================================================================
// Status Handlers
// ============================================================================

async function handleSuccess(data: any, env: Record<string, string>): Promise<void> {
  const reference = data.ClientReference || data.TransactionId || "";
  const amount = data.Amount || 0;
  const currency = (data.Currency || "GHS").toUpperCase();
  const customerPhone = data.CustomerMobileNumber || null;

  // Update payment
  await supabaseRequest(
    `payments?reference=eq.${encodeURIComponent(reference)}`,
    "PATCH",
    {
      status: "success",
      amount,
      currency,
      customer_phone: customerPhone,
      updated_at: new Date().toISOString(),
    },
    env
  );

  // Update transaction
  await supabaseRequest(
    `transactions?reference=eq.${encodeURIComponent(reference)}`,
    "PATCH",
    {
      status: "success",
      amount,
      currency,
      updated_at: new Date().toISOString(),
    },
    env
  );

  // Confirm order
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
    gateway: "hubtel",
    amount,
    currency,
    customerPhone,
  }, env);
}

async function handleFailed(data: any, env: Record<string, string>): Promise<void> {
  const reference = data.ClientReference || data.TransactionId || "";
  const reason = data.Reason || data.Description || "Payment failed";

  // Update payment
  await supabaseRequest(
    `payments?reference=eq.${encodeURIComponent(reference)}`,
    "PATCH",
    {
      status: "failed",
      failure_reason: reason,
      updated_at: new Date().toISOString(),
    },
    env
  );

  // Update transaction
  await supabaseRequest(
    `transactions?reference=eq.${encodeURIComponent(reference)}`,
    "PATCH",
    {
      status: "failed",
      updated_at: new Date().toISOString(),
    },
    env
  );

  // Cancel order
  await supabaseRequest(
    `orders?payment_reference=eq.${encodeURIComponent(reference)}`,
    "PATCH",
    {
      payment_status: "failed",
      status: "cancelled",
      updated_at: new Date().toISOString(),
    },
    env
  );

  await logActivity("payment.failed", reference, {
    gateway: "hubtel",
    reason,
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
      HUBTEL_WEBHOOK_SECRET: Deno.env.get("HUBTEL_WEBHOOK_SECRET") || "",
    };

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: "Server misconfiguration" }, 500);
    }

    const rawBody = await req.text();
    const data = JSON.parse(rawBody);

    // Hubtel sends a status field: "Success" or "Failed"
    // Optionally verify the webhook secret if configured
    const providedSecret = req.headers.get("X-Hubtel-Signature");
    if (env.HUBTEL_WEBHOOK_SECRET && providedSecret !== env.HUBTEL_WEBHOOK_SECRET) {
      return jsonResponse({ error: "Invalid webhook signature" }, 401);
    }

    const status = (data.Status || data.status || "").toLowerCase();

    switch (status) {
      case "success":
        await handleSuccess(data, env);
        break;
      case "failed":
        await handleFailed(data, env);
        break;
      default:
        return jsonResponse({ message: "Event acknowledged", status });
    }

    return jsonResponse({ message: "Webhook processed", status });
  } catch (error) {
    console.error("Hubtel webhook error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
