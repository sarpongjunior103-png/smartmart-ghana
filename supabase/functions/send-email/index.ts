// ============================================================================
// Send Email Edge Function
// Powered by Resend API — 9 branded HTML templates
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Contact info
const CONTACT_PHONE = "+233 55 162 1261";
const CONTACT_PHONE_RAW = "+233551621261";
const CONTACT_EMAIL = "smrtmart304@gmail.com";

// ============================================================================
// Helpers
// ============================================================================

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

function getEnv(name: string, fallback = ""): string {
  return Deno.env.get(name) || fallback;
}

// ============================================================================
// Branded Email Footer
// ============================================================================

function emailFooter(): string {
  return `
    <tr>
      <td style="padding: 32px 40px; background-color: #1a1a2e; border-radius: 0 0 8px 8px;">
        <p style="margin: 0 0 12px 0; color: #ffffff; font-size: 14px; font-weight: 600; font-family: Arial, sans-serif;">
          SmartMart
        </p>
        <p style="margin: 0 0 8px 0; color: #a0a0b8; font-size: 13px; font-family: Arial, sans-serif;">
          Need help? Contact our support team:
        </p>
        <p style="margin: 0 0 4px 0; color: #a0a0b8; font-size: 13px; font-family: Arial, sans-serif;">
          📞 Phone: <a href="tel:${CONTACT_PHONE_RAW}" style="color: #4f9eff; text-decoration: none;">${CONTACT_PHONE}</a>
        </p>
        <p style="margin: 0 0 16px 0; color: #a0a0b8; font-size: 13px; font-family: Arial, sans-serif;">
          ✉️ Email: <a href="mailto:${CONTACT_EMAIL}" style="color: #4f9eff; text-decoration: none;">${CONTACT_EMAIL}</a>
        </p>
        <p style="margin: 0; padding-top: 16px; border-top: 1px solid #2a2a4e; color: #6a6a8a; font-size: 12px; font-family: Arial, sans-serif;">
          © ${new Date().getFullYear()} SmartMart. All rights reserved.<br/>
          You received this email because you have an account with SmartMart.
        </p>
      </td>
    </tr>
  `;
}

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmartMart Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;">
          <!-- Logo Header -->
          <tr>
            <td style="padding: 32px 40px; background-color: #4f46e5; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; font-family: Arial, sans-serif; letter-spacing: 0.5px;">
                🛒 SmartMart
              </h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          ${emailFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================================================
// Email Templates
// ============================================================================

interface EmailTemplate {
  subject: string;
  html: string;
}

function welcomeTemplate(data: { name: string }): EmailTemplate {
  return {
    subject: "Welcome to SmartMart! 🎉",
    html: emailWrapper(`
      <h2 style="margin: 0 0 16px 0; color: #1a1a2e; font-size: 22px; font-family: Arial, sans-serif;">Welcome, ${data.name}!</h2>
      <p style="margin: 0 0 16px 0; color: #4a4a6a; font-size: 15px; line-height: 1.6; font-family: Arial, sans-serif;">
        We're thrilled to have you join SmartMart — your one-stop marketplace for everything you need.
        Discover great deals, shop from trusted vendors, and enjoy fast delivery right to your doorstep.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://smartmart.com/shop" style="display: inline-block; padding: 14px 36px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; font-family: Arial, sans-serif;">
          Start Shopping
        </a>
      </div>
      <p style="margin: 0; color: #4a4a6a; font-size: 15px; line-height: 1.6; font-family: Arial, sans-serif;">
        If you have any questions, our support team is always here to help. Just reach out using the contact details below.
      </p>
    `),
  };
}

function emailVerificationTemplate(data: { name: string; verificationUrl: string }): EmailTemplate {
  return {
    subject: "Verify Your Email Address",
    html: emailWrapper(`
      <h2 style="margin: 0 0 16px 0; color: #1a1a2e; font-size: 22px; font-family: Arial, sans-serif;">Hi ${data.name},</h2>
      <p style="margin: 0 0 16px 0; color: #4a4a6a; font-size: 15px; line-height: 1.6; font-family: Arial, sans-serif;">
        Please verify your email address to complete your SmartMart account setup. Click the button below to confirm:
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.verificationUrl}" style="display: inline-block; padding: 14px 36px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; font-family: Arial, sans-serif;">
          Verify Email
        </a>
      </div>
      <p style="margin: 0 0 8px 0; color: #6a6a8a; font-size: 13px; line-height: 1.6; font-family: Arial, sans-serif;">
        Or copy and paste this link into your browser:
      </p>
      <p style="margin: 0; color: #4f46e5; font-size: 13px; word-break: break-all; font-family: Arial, sans-serif;">
        ${data.verificationUrl}
      </p>
      <p style="margin: 24px 0 0 0; color: #6a6a8a; font-size: 13px; font-family: Arial, sans-serif;">
        This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
      </p>
    `),
  };
}

function passwordResetTemplate(data: { name: string; resetUrl: string }): EmailTemplate {
  return {
    subject: "Reset Your Password",
    html: emailWrapper(`
      <h2 style="margin: 0 0 16px 0; color: #1a1a2e; font-size: 22px; font-family: Arial, sans-serif;">Hi ${data.name},</h2>
      <p style="margin: 0 0 16px 0; color: #4a4a6a; font-size: 15px; line-height: 1.6; font-family: Arial, sans-serif;">
        We received a request to reset your SmartMart password. Click the button below to choose a new password:
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.resetUrl}" style="display: inline-block; padding: 14px 36px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; font-family: Arial, sans-serif;">
          Reset Password
        </a>
      </div>
      <p style="margin: 0 0 8px 0; color: #6a6a8a; font-size: 13px; line-height: 1.6; font-family: Arial, sans-serif;">
        Or copy and paste this link into your browser:
      </p>
      <p style="margin: 0; color: #4f46e5; font-size: 13px; word-break: break-all; font-family: Arial, sans-serif;">
        ${data.resetUrl}
      </p>
      <p style="margin: 24px 0 0 0; color: #6a6a8a; font-size: 13px; font-family: Arial, sans-serif;">
        This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't be changed.
      </p>
    `),
  };
}

function orderConfirmationTemplate(data: {
  name: string;
  orderId: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  currency: string;
  shippingAddress: string;
}): EmailTemplate {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #4a4a6a; font-size: 14px; font-family: Arial, sans-serif;">${item.name}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #4a4a6a; font-size: 14px; text-align: center; font-family: Arial, sans-serif;">${item.quantity}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #4a4a6a; font-size: 14px; text-align: right; font-family: Arial, sans-serif;">${data.currency} ${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  return {
    subject: `Order Confirmed — #${data.orderId}`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 16px 0; color: #1a1a2e; font-size: 22px; font-family: Arial, sans-serif;">Order Confirmed! ✅</h2>
      <p style="margin: 0 0 8px 0; color: #4a4a6a; font-size: 15px; font-family: Arial, sans-serif;">Hi ${data.name},</p>
      <p style="margin: 0 0 24px 0; color: #4a4a6a; font-size: 15px; line-height: 1.6; font-family: Arial, sans-serif;">
        Thank you for your order! Your order <strong>#${data.orderId}</strong> has been confirmed and is being processed.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
        <thead>
          <tr style="background-color: #f8f8fc;">
            <th style="padding: 12px; text-align: left; color: #1a1a2e; font-size: 13px; font-family: Arial, sans-serif;">Item</th>
            <th style="padding: 12px; text-align: center; color: #1a1a2e; font-size: 13px; font-family: Arial, sans-serif;">Qty</th>
            <th style="padding: 12px; text-align: right; color: #1a1a2e; font-size: 13px; font-family: Arial, sans-serif;">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 16px 0 0 0; text-align: right; color: #1a1a2e; font-size: 15px; font-weight: 700; font-family: Arial, sans-serif;">Total:</td>
            <td style="padding: 16px 0 0 0; text-align: right; color: #4f46e5; font-size: 15px; font-weight: 700; font-family: Arial, sans-serif;">${data.currency} ${data.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      <p style="margin: 0 0 8px 0; color: #4a4a6a; font-size: 14px; font-family: Arial, sans-serif;"><strong>Shipping Address:</strong></p>
      <p style="margin: 0 0 24px 0; color: #4a4a6a; font-size: 14px; line-height: 1.6; font-family: Arial, sans-serif;">${data.shippingAddress}</p>
      <p style="margin: 0; color: #4a4a6a; font-size: 14px; font-family: Arial, sans-serif;">
        We'll send you another email when your order ships. Track your order anytime in your account dashboard.
      </p>
    `),
  };
}

function orderShippedTemplate(data: {
  name: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
}): EmailTemplate {
  return {
    subject: `Your Order #${data.orderId} Has Shipped! 📦`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 16px 0; color: #1a1a2e; font-size: 22px; font-family: Arial, sans-serif;">Your Order is on the Way! 🚚</h2>
      <p style="margin: 0 0 16px 0; color: #4a4a6a; font-size: 15px; font-family: Arial, sans-serif;">Hi ${data.name},</p>
      <p style="margin: 0 0 24px 0; color: #4a4a6a; font-size: 15px; line-height: 1.6; font-family: Arial, sans-serif;">
        Great news! Your order <strong>#${data.orderId}</strong> has been shipped and is on its way to you.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background-color: #f8f8fc; border-radius: 6px;">
        <tr>
          <td style="padding: 16px 20px;">
            <p style="margin: 0 0 4px 0; color: #6a6a8a; font-size: 12px; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.5px;">Tracking Number</p>
            <p style="margin: 0; color: #1a1a2e; font-size: 16px; font-weight: 600; font-family: Arial, sans-serif;">${data.trackingNumber}</p>
          </td>
          <td style="padding: 16px 20px;">
            <p style="margin: 0 0 4px 0; color: #6a6a8a; font-size: 12px; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.5px;">Carrier</p>
            <p style="margin: 0; color: #1a1a2e; font-size: 16px; font-weight: 600; font-family: Arial, sans-serif;">${data.carrier}</p>
          </td>
        </tr>
      </table>
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://smartmart.com/orders/${data.orderId}" style="display: inline-block; padding: 14px 36px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; font-family: Arial, sans-serif;">
          Track Your Order
        </a>
      </div>
      <p style="margin: 0; color: #4a4a6a; font-size: 14px; font-family: Arial, sans-serif;">
        Estimated delivery: 2-5 business days. If you have any questions, contact our support team.
      </p>
    `),
  };
}

function orderDeliveredTemplate(data: { name: string; orderId: string }): EmailTemplate {
  return {
    subject: `Order #${data.orderId} Delivered! 🎉`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 16px 0; color: #1a1a2e; font-size: 22px; font-family: Arial, sans-serif;">Delivered! 🎉</h2>
      <p style="margin: 0 0 16px 0; color: #4a4a6a; font-size: 15px; font-family: Arial, sans-serif;">Hi ${data.name},</p>
      <p style="margin: 0 0 24px 0; color: #4a4a6a; font-size: 15px; line-height: 1.6; font-family: Arial, sans-serif;">
        Your order <strong>#${data.orderId}</strong> has been delivered. We hope you love your purchase!
      </p>
      <p style="margin: 0 0 24px 0; color: #4a4a6a; font-size: 15px; line-height: 1.6; font-family: Arial, sans-serif;">
        If you're happy with your order, please consider leaving a review — it helps other shoppers and supports our vendors.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://smartmart.com/orders/${data.orderId}/review" style="display: inline-block; padding: 14px 36px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; font-family: Arial, sans-serif;">
          Leave a Review
        </a>
      </div>
      <p style="margin: 0; color: #4a4a6a; font-size: 14px; font-family: Arial, sans-serif;">
        If there's any issue with your order, please contact our support team within 7 days for assistance.
      </p>
    `),
  };
}

function refundNotificationTemplate(data: {
  name: string;
  orderId: string;
  refundAmount: number;
  currency: string;
  reason: string;
}): EmailTemplate {
  return {
    subject: `Refund Processed — Order #${data.orderId}`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 16px 0; color: #1a1a2e; font-size: 22px; font-family: Arial, sans-serif;">Refund Processed 💰</h2>
      <p style="margin: 0 0 16px 0; color: #4a4a6a; font-size: 15px; font-family: Arial, sans-serif;">Hi ${data.name},</p>
      <p style="margin: 0 0 24px 0; color: #4a4a6a; font-size: 15px; line-height: 1.6; font-family: Arial, sans-serif;">
        A refund of <strong>${data.currency} ${data.refundAmount.toFixed(2)}</strong> has been processed for your order <strong>#${data.orderId}</strong>.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background-color: #f8f8fc; border-radius: 6px;">
        <tr>
          <td style="padding: 16px 20px;">
            <p style="margin: 0 0 4px 0; color: #6a6a8a; font-size: 12px; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.5px;">Refund Amount</p>
            <p style="margin: 0; color: #1a1a2e; font-size: 16px; font-weight: 600; font-family: Arial, sans-serif;">${data.currency} ${data.refundAmount.toFixed(2)}</p>
          </td>
          <td style="padding: 16px 20px;">
            <p style="margin: 0 0 4px 0; color: #6a6a8a; font-size: 12px; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.5px;">Reason</p>
            <p style="margin: 0; color: #1a1a2e; font-size: 16px; font-weight: 600; font-family: Arial, sans-serif;">${data.reason}</p>
          </td>
        </tr>
      </table>
      <p style="margin: 0; color: #4a4a6a; font-size: 14px; line-height: 1.6; font-family: Arial, sans-serif;">
        The refund will appear in your account within 5-10 business days, depending on your bank or payment provider.
      </p>
    `),
  };
}

function vendorApprovalTemplate(data: { name: string; storeName: string }): EmailTemplate {
  return {
    subject: "Your Vendor Application Has Been Approved! ✅",
    html: emailWrapper(`
      <h2 style="margin: 0 0 16px 0; color: #1a1a2e; font-size: 22px; font-family: Arial, sans-serif;">Welcome Aboard, ${data.name}! 🎉</h2>
      <p style="margin: 0 0 16px 0; color: #4a4a6a; font-size: 15px; line-height: 1.6; font-family: Arial, sans-serif;">
        Congratulations! Your vendor application for <strong>${data.storeName}</strong> has been approved.
        You can now start listing products and selling on SmartMart.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://smartmart.com/vendor/dashboard" style="display: inline-block; padding: 14px 36px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; font-family: Arial, sans-serif;">
          Go to Vendor Dashboard
        </a>
      </div>
      <p style="margin: 0 0 16px 0; color: #4a4a6a; font-size: 15px; line-height: 1.6; font-family: Arial, sans-serif;">
        Here's what you can do next:
      </p>
      <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #4a4a6a; font-size: 15px; line-height: 1.8; font-family: Arial, sans-serif;">
        <li>Set up your store profile and branding</li>
        <li>Add your first products</li>
        <li>Configure shipping and payout settings</li>
        <li>Start receiving orders from customers</li>
      </ul>
      <p style="margin: 0; color: #4a4a6a; font-size: 14px; font-family: Arial, sans-serif;">
        If you need any help getting started, our support team is just a message away.
      </p>
    `),
  };
}

function vendorRejectionTemplate(data: { name: string; reason: string }): EmailTemplate {
  return {
    subject: "Update on Your Vendor Application",
    html: emailWrapper(`
      <h2 style="margin: 0 0 16px 0; color: #1a1a2e; font-size: 22px; font-family: Arial, sans-serif;">Hi ${data.name},</h2>
      <p style="margin: 0 0 16px 0; color: #4a4a6a; font-size: 15px; line-height: 1.6; font-family: Arial, sans-serif;">
        Thank you for your interest in becoming a vendor on SmartMart. After reviewing your application,
        we're unable to approve it at this time.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background-color: #fff5f5; border-radius: 6px; border-left: 4px solid #ef4444;">
        <tr>
          <td style="padding: 16px 20px;">
            <p style="margin: 0 0 4px 0; color: #6a6a8a; font-size: 12px; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.5px;">Reason</p>
            <p style="margin: 0; color: #1a1a2e; font-size: 15px; font-family: Arial, sans-serif;">${data.reason}</p>
          </td>
        </tr>
      </table>
      <p style="margin: 0 0 16px 0; color: #4a4a6a; font-size: 15px; line-height: 1.6; font-family: Arial, sans-serif;">
        You're welcome to reapply after addressing the issues mentioned above. We're here to help you succeed.
      </p>
      <p style="margin: 0; color: #4a4a6a; font-size: 14px; font-family: Arial, sans-serif;">
        If you believe this decision was made in error, or if you'd like guidance on how to improve your application,
        please contact our support team using the details below.
      </p>
    `),
  };
}

// ============================================================================
// Template Registry
// ============================================================================

const TEMPLATES: Record<string, (data: any) => EmailTemplate> = {
  welcome: welcomeTemplate,
  email_verification: emailVerificationTemplate,
  password_reset: passwordResetTemplate,
  order_confirmation: orderConfirmationTemplate,
  order_shipped: orderShippedTemplate,
  order_delivered: orderDeliveredTemplate,
  refund_notification: refundNotificationTemplate,
  vendor_approval: vendorApprovalTemplate,
  vendor_rejection: vendorRejectionTemplate,
};

// ============================================================================
// Resend API Integration
// ============================================================================

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
  env: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = env.RESEND_API_KEY;
  const emailFrom = env.EMAIL_FROM || CONTACT_EMAIL;

  if (!resendApiKey) {
    return { success: false, error: "Missing RESEND_API_KEY environment variable" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `SmartMart <${emailFrom}>`,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return { success: false, error: `Resend API error (${response.status}): ${errorBody}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
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
      RESEND_API_KEY: Deno.env.get("RESEND_API_KEY") || "",
      EMAIL_FROM: Deno.env.get("EMAIL_FROM") || CONTACT_EMAIL,
    };

    const body = await req.json();

    const { to, template, data } = body;

    if (!to || !template) {
      return jsonResponse({ error: "Missing required fields: 'to' and 'template' are required" }, 400);
    }

    const templateFn = TEMPLATES[template];
    if (!templateFn) {
      return jsonResponse({
        error: `Unknown template: '${template}'. Available templates: ${Object.keys(TEMPLATES).join(", ")}`,
      }, 400);
    }

    const { subject, html } = templateFn(data || {});
    const result = await sendViaResend(to, subject, html, env);

    if (!result.success) {
      return jsonResponse({ error: result.error }, 500);
    }

    return jsonResponse({
      success: true,
      message: "Email sent successfully",
      template,
      to,
    });
  } catch (error) {
    console.error("send-email error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
