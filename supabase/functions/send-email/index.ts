import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function getEnv(key: string): string {
  return Deno.env.get(key) ?? "";
}

// ============================================================================
// SmartMart Ghana — Email Template Engine
// ============================================================================

const BRAND = {
  name: "SmartMart Ghana",
  primaryColor: "#0F766E",
  primaryDark: "#0B5C56",
  primaryLight: "#E6F4F1",
  accentColor: "#F59E0B",
  textColor: "#1F2937",
  textMuted: "#6B7280",
  backgroundColor: "#F9FAFB",
  borderColor: "#E5E7EB",
  whiteColor: "#FFFFFF",
  footerColor: "#6B7280",
  url: "https://smartmartghana.com",
  supportEmail: "support@smartmartghana.com",
};

function baseTemplate(content: string, preview: string = "SmartMart Ghana"): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${preview}">
  <title>${preview}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.backgroundColor};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.textColor};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.backgroundColor};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${BRAND.whiteColor};border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND.primaryColor};padding:28px 40px;text-align:center;">
              <h1 style="margin:0;color:${BRAND.whiteColor};font-size:24px;font-weight:700;letter-spacing:-0.3px;">${BRAND.name}</h1>
              <p style="margin:6px 0 0;color:${BRAND.primaryLight};font-size:13px;">Ghana's Smart Marketplace</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px 40px 20px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;border-top:1px solid ${BRAND.borderColor};background-color:${BRAND.backgroundColor};">
              <p style="margin:0 0 8px;color:${BRAND.footerColor};font-size:13px;text-align:center;">
                <a href="${BRAND.url}" style="color:${BRAND.primaryColor};text-decoration:none;font-weight:600;">${BRAND.url}</a>
              </p>
              <p style="margin:0 0 4px;color:${BRAND.footerColor};font-size:12px;text-align:center;">
                Questions? Contact us at <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.primaryColor};text-decoration:none;">${BRAND.supportEmail}</a>
              </p>
              <p style="margin:8px 0 0;color:${BRAND.footerColor};font-size:11px;text-align:center;">
                &copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.<br>
                Accra, Ghana &middot; This email was sent to you by ${BRAND.name}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background-color:${BRAND.primaryColor};color:${BRAND.whiteColor};padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">${text}</a>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${BRAND.borderColor};margin:24px 0;">`;
}

function infoBox(label: string, value: string): string {
  return `<tr><td style="padding:8px 0;color:${BRAND.textMuted};font-size:14px;width:50%;vertical-align:top;">${label}</td><td style="padding:8px 0;color:${BRAND.textColor};font-size:14px;font-weight:600;vertical-align:top;">${value}</td></tr>`;
}

// ============================================================================
// Template Definitions
// ============================================================================

type TemplateData = Record<string, unknown>;

const templates: Record<string, (data: TemplateData) => string> = {
  welcome: (data) => {
    const name = String(data.name || "there");
    return baseTemplate(`
      <h2 style="margin:0 0 16px;color:${BRAND.textColor};font-size:22px;">Welcome to ${BRAND.name}, ${name}! 🎉</h2>
      <p style="margin:0 0 16px;color:${BRAND.textColor};font-size:15px;line-height:1.6;">
        We're thrilled to have you join Ghana's smartest marketplace. At ${BRAND.name}, you can shop from
        thousands of verified vendors across the country, enjoy secure payments, and get your orders
        delivered right to your doorstep.
      </p>
      <p style="margin:0 0 28px;color:${BRAND.textColor};font-size:15px;line-height:1.6;">
        Here's what you can do to get started:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;color:${BRAND.primaryColor};font-size:14px;">✓ &nbsp; Browse products from verified vendors</td></tr>
        <tr><td style="padding:6px 0;color:${BRAND.primaryColor};font-size:14px;">✓ &nbsp; Add items to your cart and wishlist</td></tr>
        <tr><td style="padding:6px 0;color:${BRAND.primaryColor};font-size:14px;">✓ &nbsp; Pay securely with Mobile Money or card</td></tr>
        <tr><td style="padding:6px 0;color:${BRAND.primaryColor};font-size:14px;">✓ &nbsp; Track your orders in real time</td></tr>
        <tr><td style="padding:6px 0;color:${BRAND.primaryColor};font-size:14px;">✓ &nbsp; Earn loyalty points on every purchase</td></tr>
      </table>
      <div style="margin:28px 0 8px;text-align:center;">
        ${button("Start Shopping", `${BRAND.url}/shop`)}
      </div>
      <p style="margin:24px 0 0;color:${BRAND.textMuted};font-size:13px;line-height:1.5;">
        If you have any questions, our support team is always here to help. Happy shopping!
      </p>
    `, `Welcome to ${BRAND.name}`);
  },

  email_verification: (data) => {
    const name = String(data.name || "there");
    const code = String(data.code || "");
    const link = String(data.verification_url || `${BRAND.url}/verify-email?code=${code}`);
    return baseTemplate(`
      <h2 style="margin:0 0 16px;color:${BRAND.textColor};font-size:22px;">Verify Your Email Address</h2>
      <p style="margin:0 0 16px;color:${BRAND.textColor};font-size:15px;line-height:1.6;">
        Hi ${name}, thanks for signing up! Please verify your email address to activate your account
        and start shopping on ${BRAND.name}.
      </p>
      <div style="background-color:${BRAND.primaryLight};border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
        <p style="margin:0 0 8px;color:${BRAND.textMuted};font-size:13px;text-transform:uppercase;letter-spacing:1px;">Your verification code</p>
        <p style="margin:0;font-size:32px;font-weight:700;color:${BRAND.primaryColor};letter-spacing:4px;">${code}</p>
      </div>
      <p style="margin:0 0 28px;color:${BRAND.textColor};font-size:15px;line-height:1.6;">
        Or click the button below to verify your email:
      </p>
      <div style="text-align:center;margin-bottom:8px;">
        ${button("Verify Email", link)}
      </div>
      <p style="margin:24px 0 0;color:${BRAND.textMuted};font-size:13px;line-height:1.5;">
        This verification code expires in 24 hours. If you didn't create an account, you can safely
        ignore this email.
      </p>
    `, "Verify your email");
  },

  password_reset: (data) => {
    const name = String(data.name || "there");
    const link = String(data.reset_url || `${BRAND.url}/reset-password`);
    return baseTemplate(`
      <h2 style="margin:0 0 16px;color:${BRAND.textColor};font-size:22px;">Reset Your Password</h2>
      <p style="margin:0 0 16px;color:${BRAND.textColor};font-size:15px;line-height:1.6;">
        Hi ${name}, we received a request to reset the password for your ${BRAND.name} account.
        Click the button below to set a new password:
      </p>
      <div style="text-align:center;margin:28px 0 8px;">
        ${button("Reset Password", link)}
      </div>
      ${divider()}
      <p style="margin:0;color:${BRAND.textMuted};font-size:13px;line-height:1.5;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${link}" style="color:${BRAND.primaryColor};word-break:break-all;">${link}</a>
      </p>
      <p style="margin:24px 0 0;color:${BRAND.textMuted};font-size:13px;line-height:1.5;">
        This password reset link expires in 1 hour. If you didn't request a password reset, please
        ignore this email or contact support if you have concerns.
      </p>
    `, "Reset your password");
  },

  order_confirmation: (data) => {
    const orderNumber = String(data.order_number || data.orderNumber || "");
    const items = (data.items as Array<{ name: string; quantity: number; price: number }>) || [];
    const total = Number(data.total || 0);
    const currency = String(data.currency || "GHS");
    const itemsHtml = items.map((item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${BRAND.borderColor};color:${BRAND.textColor};font-size:14px;">${item.name}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${BRAND.borderColor};color:${BRAND.textColor};font-size:14px;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${BRAND.borderColor};color:${BRAND.textColor};font-size:14px;text-align:right;font-weight:600;">${currency} ${item.price.toFixed(2)}</td>
      </tr>`).join("");
    return baseTemplate(`
      <h2 style="margin:0 0 8px;color:${BRAND.textColor};font-size:22px;">Order Confirmed! ✅</h2>
      <p style="margin:0 0 24px;color:${BRAND.textMuted};font-size:14px;">Order #${orderNumber}</p>
      <p style="margin:0 0 20px;color:${BRAND.textColor};font-size:15px;line-height:1.6;">
        Thank you for your purchase! Your order has been confirmed and is being processed.
        We'll send you another email when your items ship.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.borderColor};border-radius:8px;overflow:hidden;">
        <tr style="background-color:${BRAND.backgroundColor};">
          <td style="padding:12px 16px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:${BRAND.textMuted};font-weight:600;">Product</td>
          <td style="padding:12px 16px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:${BRAND.textMuted};font-weight:600;text-align:center;">Qty</td>
          <td style="padding:12px 16px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:${BRAND.textMuted};font-weight:600;text-align:right;">Price</td>
        </tr>
        ${itemsHtml}
        <tr>
          <td colspan="2" style="padding:14px 16px;color:${BRAND.textColor};font-size:15px;font-weight:700;text-align:right;">Total:</td>
          <td style="padding:14px 16px;color:${BRAND.primaryColor};font-size:18px;font-weight:700;text-align:right;">${currency} ${total.toFixed(2)}</td>
        </tr>
      </table>
      <div style="margin:28px 0 8px;text-align:center;">
        ${button("Track Your Order", `${BRAND.url}/orders/${orderNumber}`)}
      </div>
      <p style="margin:24px 0 0;color:${BRAND.textMuted};font-size:13px;line-height:1.5;">
        You can always check your order status from your account dashboard.
      </p>
    `, `Order #${orderNumber} confirmed`);
  },

  order_shipped: (data) => {
    const orderNumber = String(data.order_number || data.orderNumber || "");
    const trackingNumber = String(data.tracking_number || data.trackingNumber || "");
    const carrier = String(data.carrier || "");
    const link = String(data.tracking_url || `${BRAND.url}/orders/${orderNumber}`);
    return baseTemplate(`
      <h2 style="margin:0 0 16px;color:${BRAND.textColor};font-size:22px;">Your Order Has Shipped! 📦</h2>
      <p style="margin:0 0 24px;color:${BRAND.textMuted};font-size:14px;">Order #${orderNumber}</p>
      <p style="margin:0 0 20px;color:${BRAND.textColor};font-size:15px;line-height:1.6;">
        Great news! Your order is on its way. Here are your shipping details:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.primaryLight};border-radius:8px;margin:0 0 24px;">
        <tr><td style="padding:16px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${infoBox("Tracking Number", trackingNumber || "N/A")}
            ${carrier ? infoBox("Carrier", carrier) : ""}
          </table>
        </td></tr>
      </table>
      <div style="text-align:center;margin:28px 0 8px;">
        ${button("Track Your Package", link)}
      </div>
      <p style="margin:24px 0 0;color:${BRAND.textMuted};font-size:13px;line-height:1.5;">
        Estimated delivery time depends on your location within Ghana. You'll receive a notification
        when your package is delivered.
      </p>
    `, `Order #${orderNumber} shipped`);
  },

  order_delivered: (data) => {
    const orderNumber = String(data.order_number || data.orderNumber || "");
    const link = String(data.review_url || `${BRAND.url}/orders/${orderNumber}`);
    return baseTemplate(`
      <h2 style="margin:0 0 16px;color:${BRAND.textColor};font-size:22px;">Order Delivered! 🎉</h2>
      <p style="margin:0 0 24px;color:${BRAND.textMuted};font-size:14px;">Order #${orderNumber}</p>
      <p style="margin:0 0 20px;color:${BRAND.textColor};font-size:15px;line-height:1.6;">
        Your order has been successfully delivered. We hope you love your purchase! If you have any
        issues with your items, please contact the vendor or our support team within 7 days.
      </p>
      <p style="margin:0 0 28px;color:${BRAND.textColor};font-size:15px;line-height:1.6;">
        We'd love to hear your feedback. Please take a moment to review your purchase:
      </p>
      <div style="text-align:center;margin:28px 0 8px;">
        ${button("Leave a Review", link)}
      </div>
      <p style="margin:24px 0 0;color:${BRAND.textMuted};font-size:13px;line-height:1.5;">
        Reviews help other shoppers make informed decisions and support our vendors.
        Thank you for shopping with ${BRAND.name}!
      </p>
    `, `Order #${orderNumber} delivered`);
  },

  refund_notification: (data) => {
    const orderNumber = String(data.order_number || data.orderNumber || "");
    const amount = Number(data.amount || 0);
    const currency = String(data.currency || "GHS");
    const reason = String(data.reason || "Refund processed");
    return baseTemplate(`
      <h2 style="margin:0 0 16px;color:${BRAND.textColor};font-size:22px;">Refund Processed 💰</h2>
      <p style="margin:0 0 24px;color:${BRAND.textMuted};font-size:14px;">Order #${orderNumber}</p>
      <p style="margin:0 0 20px;color:${BRAND.textColor};font-size:15px;line-height:1.6;">
        A refund has been processed for your order. Here are the details:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.primaryLight};border-radius:8px;margin:0 0 24px;">
        <tr><td style="padding:16px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${infoBox("Refund Amount", `${currency} ${amount.toFixed(2)}`)}
            ${infoBox("Order Number", `#${orderNumber}`)}
            ${infoBox("Reason", reason)}
          </table>
        </td></tr>
      </table>
      <p style="margin:0 0 8px;color:${BRAND.textColor};font-size:15px;line-height:1.6;">
        Your refund will appear in your original payment method within 5-10 business days,
        depending on your bank or mobile money provider.
      </p>
      <p style="margin:0;color:${BRAND.textMuted};font-size:13px;line-height:1.5;">
        If you have any questions about your refund, please contact our support team.
      </p>
    `, `Refund for order #${orderNumber}`);
  },

  vendor_approval: (data) => {
    const name = String(data.name || "there");
    const storeName = String(data.store_name || data.storeName || "");
    return baseTemplate(`
      <h2 style="margin:0 0 16px;color:${BRAND.textColor};font-size:22px;">Vendor Application Approved! 🏪</h2>
      <p style="margin:0 0 20px;color:${BRAND.textColor};font-size:15px;line-height:1.6;">
        Congratulations, ${name}! Your vendor application has been approved. Your store
        ${storeName ? `<strong style="color:${BRAND.primaryColor};">${storeName}</strong>` : ""}
        is now live on ${BRAND.name}.
      </p>
      <p style="margin:0 0 20px;color:${BRAND.textColor};font-size:15px;line-height:1.6;">
        You can now start listing products, managing inventory, and receiving orders. Here's what
        you can do next:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;color:${BRAND.primaryColor};font-size:14px;">✓ &nbsp; Set up your store profile and logo</td></tr>
        <tr><td style="padding:6px 0;color:${BRAND.primaryColor};font-size:14px;">✓ &nbsp; Add your first products</td></tr>
        <tr><td style="padding:6px 0;color:${BRAND.primaryColor};font-size:14px;">✓ &nbsp; Configure shipping options</td></tr>
        <tr><td style="padding:6px 0;color:${BRAND.primaryColor};font-size:14px;">✓ &nbsp; Set up payout details</td></tr>
      </table>
      <div style="margin:28px 0 8px;text-align:center;">
        ${button("Access Vendor Dashboard", `${BRAND.url}/vendor/dashboard`)}
      </div>
      <p style="margin:24px 0 0;color:${BRAND.textMuted};font-size:13px;line-height:1.5;">
        Welcome aboard! We're excited to partner with you. Check our vendor guide for tips on
        growing your business on ${BRAND.name}.
      </p>
    `, "Vendor application approved");
  },

  vendor_rejection: (data) => {
    const name = String(data.name || "there");
    const reason = String(data.reason || "Your application did not meet our current requirements.");
    return baseTemplate(`
      <h2 style="margin:0 0 16px;color:${BRAND.textColor};font-size:22px;">Vendor Application Update</h2>
      <p style="margin:0 0 20px;color:${BRAND.textColor};font-size:15px;line-height:1.6;">
        Hi ${name}, thank you for your interest in becoming a vendor on ${BRAND.name}.
      </p>
      <p style="margin:0 0 20px;color:${BRAND.textColor};font-size:15px;line-height:1.6;">
        After reviewing your application, we're unable to approve it at this time. Here's why:
      </p>
      <div style="background-color:#FEF3C7;border-left:4px solid ${BRAND.accentColor};border-radius:4px;padding:16px 20px;margin:0 0 24px;">
        <p style="margin:0;color:${BRAND.textColor};font-size:14px;line-height:1.6;">${reason}</p>
      </div>
      <p style="margin:0 0 20px;color:${BRAND.textColor};font-size:15px;line-height:1.6;">
        You're welcome to reapply after addressing the above. If you believe this decision was made
        in error, or if you need clarification, please contact our support team.
      </p>
      <p style="margin:0;color:${BRAND.textMuted};font-size:13px;line-height:1.5;">
        We appreciate your understanding and wish you the best.
      </p>
    `, "Vendor application update");
  },
};

// ============================================================================
// Resend API Integration
// ============================================================================

interface EmailPayload {
  to: string;
  template: string;
  data?: TemplateData;
}

async function sendWithResend(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = getEnv("EMAIL_API_KEY");
  const fromEmail = getEnv("EMAIL_FROM") || `noreply@${BRAND.url.replace("https://", "")}`;

  if (!apiKey) {
    return { success: false, error: "EMAIL_API_KEY is not configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${BRAND.name} <${fromEmail}>`,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { success: false, error: `Resend API error: ${err}` };
  }

  return { success: true };
}

const subjectMap: Record<string, string> = {
  welcome: `Welcome to ${BRAND.name}!`,
  email_verification: "Verify Your Email Address",
  password_reset: "Reset Your Password",
  order_confirmation: "Your Order is Confirmed",
  order_shipped: "Your Order Has Shipped",
  order_delivered: "Your Order Has Been Delivered",
  refund_notification: "Refund Processed",
  vendor_approval: "Vendor Application Approved!",
  vendor_rejection: "Vendor Application Update",
};

// ============================================================================
// Edge Function Handler
// ============================================================================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload: EmailPayload = await req.json();
    const { to, template, data } = payload;

    if (!to || !template) {
      return new Response(JSON.stringify({ error: "Missing required fields: 'to' and 'template' are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const templateFn = templates[template];
    if (!templateFn) {
      const available = Object.keys(templates).join(", ");
      return new Response(JSON.stringify({ error: `Unknown template '${template}'. Available: ${available}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = templateFn(data || {});
    const subject = subjectMap[template] || `${BRAND.name} Notification`;

    const result = await sendWithResend(to, subject, html);

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: `Email '${template}' sent to ${to}` }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
