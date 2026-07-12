import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function getEnv(key: string): string {
  return Deno.env.get(key) ?? "";
}

async function updatePaymentStatus(supabaseUrl: string, supabaseKey: string, reference: string, status: string, gatewayResponse: unknown) {
  const res = await fetch(`${supabaseUrl}/rest/v1/payments?gateway_reference=eq.${reference}`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  const payments = await res.json();
  if (!payments || payments.length === 0) return;

  await fetch(`${supabaseUrl}/rest/v1/payments?id=eq.${payments[0].id}`, {
    method: "PATCH",
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ status, gateway_response: gatewayResponse }),
  });

  await fetch(`${supabaseUrl}/rest/v1/transactions?transaction_reference=eq.${reference}`, {
    method: "PATCH",
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ status }),
  });

  if (status === "success" && payments[0].order_id) {
    await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${payments[0].order_id}`, {
      method: "PATCH",
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ status: "confirmed" }),
    });
  }

  await fetch(`${supabaseUrl}/rest/v1/activity_logs`, {
    method: "POST",
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ action: `payment_${status}`, entity_type: "payment", entity_id: payments[0].id, details: { reference, status } }),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { url, key } = { url: getEnv("SUPABASE_URL"), key: getEnv("SUPABASE_SERVICE_ROLE_KEY") };
    const paystackSignature = req.headers.get("x-paystack-signature");
    const body = await req.text();

    if (!paystackSignature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      await updatePaymentStatus(url, key, event.data.reference, "success", event.data);
    } else if (event.event === "charge.failed") {
      await updatePaymentStatus(url, key, event.data.reference, "failed", event.data);
    } else if (event.event === "refund.processed") {
      await updatePaymentStatus(url, key, event.data.reference, "refunded", event.data);
    }

    return new Response(JSON.stringify({ status: "success" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
