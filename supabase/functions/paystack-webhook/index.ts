import { createHmac } from "node:crypto";

// ============================================================================
// CORS Headers
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Paystack-Signature",
};

// ============================================================================
// Helpers
// ============================================================================

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

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
  const supabaseUrl = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  return await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
}

// ============================================================================
// Signature Verification
// ============================================================================

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const hash = createHmac("sha512", secret).update(rawBody).digest("hex");
  return hash === signature;
}

// ============================================================================
// Payment Status Update
// ============================================================================

async function updatePaymentStatus(
  reference: string,
  status: string,
  amount: number,
  currency: string,
  customerEmail: string | null,
  env: Record<string, string>
): Promise<void> {
  // 1. Update payments table
  await supabaseRequest(
    "payments?reference=eq." + encodeURIComponent(reference),
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

  // 2. Update transactions table
  await supabaseRequest(
    "transactions?reference=eq." + encodeURIComponent(reference),
    "PATCH",
    {
      status,
      amount,
      currency,
      updated_at: new Date().toISOString(),
    },
    env
  );

  // 3. Update orders table (confirm order if payment successful)
  if (status === "success") {
    const orderResponse = await supabaseRequest(
      "orders?payment_reference=eq." + encodeURIComponent(reference),
      "PATCH",
      {
        payment_status: "paid",
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      env
    );

    // Send order confirmation email
    try {
      const ordersData = await orderResponse.json();
      const order = Array.isArray(ordersData) ? ordersData[0] : ordersData;
      if (order && order.id) {
        const profileRes = await supabaseRequest(
          `profiles?id=eq.${order.user_id}&select=email,first_name,last_name`,
          "GET",
          null,
          env
        );
        const profiles = await profileRes.json();
        const profile = Array.isArray(profiles) ? profiles[0] : null;
        if (profile?.email) {
          const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Customer";
          await fetch(`${env.SUPABASE_URL}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
              apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            },
            body: JSON.stringify({
              to: profile.email,
              template: "order_confirmation",
              data: { name, orderId: order.order_number, total: Number(order.total), currency: "GHS" },
            }),
          });
        }
      }
    } catch (emailErr) {
      console.error("Failed to send order confirmation email from webhook:", emailErr);
    }
  } else if (status === "failed") {
    await supabaseRequest(
      "orders?payment_reference=eq." + encodeURIComponent(reference),
      "PATCH",
      {
        payment_status: "failed",
        status: "cancelled",
        updated_at: new Date().toISOString(),
      },
      env
    );
  }

  // 4. Log activity
  await supabaseRequest("activity_logs", "POST", {
    action: `payment.${status}`,
    entity_type: "payment",
    entity_id: reference,
    description: `Paystack payment ${reference} marked as ${status}`,
    metadata: { reference, status, amount, currency, gateway: "paystack" },
    created_at: new Date().toISOString(),
  }, env);
}

// ============================================================================
// Main Handler
// ============================================================================

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
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
      PAYSTACK_SECRET_KEY: Deno.env.get("PAYSTACK_SECRET_KEY") || "",
    };

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: "Server misconfiguration" }, 500);
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify webhook signature
    if (!env.PAYSTACK_SECRET_KEY) {
      return jsonResponse({ error: "Missing PAYSTACK_SECRET_KEY" }, 500);
    }

    const isValid = verifySignature(rawBody, signature, env.PAYSTACK_SECRET_KEY);
    if (!isValid) {
      return jsonResponse({ error: "Invalid signature" }, 401);
    }

    const event = JSON.parse(rawBody);

    // Paystack event structure: { event, data: { reference, amount, currency, status, customer: { email } } }
    const data = event.data || {};
    const reference = data.reference || "";
    const amount = data.amount || 0; // in kobo
    const currency = data.currency || "GHS";
    const customerEmail = data.customer?.email || null;

    let paymentStatus = "pending";

    switch (event.event) {
      case "charge.success":
        paymentStatus = "success";
        break;
      case "charge.failed":
        paymentStatus = "failed";
        break;
      case "transfer.success":
        paymentStatus = "success";
        break;
      case "transfer.failed":
        paymentStatus = "failed";
        break;
      case "refund.processed":
        paymentStatus = "refunded";
        break;
      default:
        // Unhandled event — acknowledge but don't process
        return jsonResponse({ message: "Event acknowledged", event: event.event });
    }

    await updatePaymentStatus(reference, paymentStatus, amount, currency, customerEmail, env);

    return jsonResponse({ message: "Webhook processed", event: event.event, reference, status: paymentStatus });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
