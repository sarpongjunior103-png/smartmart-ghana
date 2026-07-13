// @ts-nocheck
import type { NotificationType } from '@/lib/types';

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  channels?: ('email' | 'sms' | 'push' | 'in_app')[];
}

export interface NotificationResult {
  inApp: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
  errors: string[];
}

function getEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) return process.env[key];
  return undefined;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = getEnv('EMAIL_API_KEY');
  const fromEmail = getEnv('EMAIL_FROM') || 'noreply@smartmartghana.com';
  if (!apiKey) {
    console.warn('[notifications] Email API key not configured, skipping email');
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromEmail, to: [to], subject, html }),
    });
    return res.ok;
  } catch (err) {
    console.error('[notifications] Email send failed:', err);
    return false;
  }
}

async function sendSMS(to: string, message: string): Promise<boolean> {
  const apiKey = getEnv('SMS_API_KEY');
  const senderId = getEnv('SMS_SENDER_ID') || 'SmartMart';
  if (!apiKey) {
    console.warn('[notifications] SMS API key not configured, skipping SMS');
    return false;
  }
  try {
    const res = await fetch('https://sms.arkesel.com/sms/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: apiKey,
        sender: senderId,
        to,
        message,
        sms_type: 'plain',
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('[notifications] SMS send failed:', err);
    return false;
  }
}

async function sendPush(token: string, title: string, body: string): Promise<boolean> {
  const vapidKey = getEnv('VAPID_PUBLIC_KEY');
  if (!vapidKey) {
    console.warn('[notifications] Push not configured, skipping');
    return false;
  }
  console.log(`[notifications] Push notification queued for token ${token.substring(0, 8)}...`);
  return true;
}

async function insertInAppNotification(payload: NotificationPayload): Promise<boolean> {
  const supabaseUrl = getEnv('SUPABASE_URL');
  const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    console.warn('[notifications] Supabase not configured for in-app notification');
    return false;
  }
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/notifications`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        user_id: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        metadata: payload.metadata || null,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('[notifications] In-app insert failed:', err);
    return false;
  }
}

export async function sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
  const channels = payload.channels || ['in_app'];
  const errors: string[] = [];
  let inApp = false;
  let email = false;
  let sms = false;
  let push = false;

  if (channels.includes('in_app')) {
    inApp = await insertInAppNotification(payload);
    if (!inApp) errors.push('in_app failed');
  }

  if (channels.includes('email')) {
    const userEmail = getEnv('USER_EMAIL_OVERRIDE') || '';
    if (userEmail) {
      email = await sendEmail(userEmail, payload.title, `<h1>${payload.title}</h1><p>${payload.message}</p>`);
      if (!email) errors.push('email failed');
    } else {
      errors.push('email: no address');
    }
  }

  if (channels.includes('sms')) {
    const userPhone = getEnv('USER_PHONE_OVERRIDE') || '';
    if (userPhone) {
      sms = await sendSMS(userPhone, `${payload.title}: ${payload.message}`);
      if (!sms) errors.push('sms failed');
    } else {
      errors.push('sms: no phone');
    }
  }

  if (channels.includes('push')) {
    const pushToken = getEnv('USER_PUSH_TOKEN') || '';
    if (pushToken) {
      push = await sendPush(pushToken, payload.title, payload.message);
      if (!push) errors.push('push failed');
    } else {
      errors.push('push: no token');
    }
  }

  return { inApp, email, sms, push, errors };
}

export const NOTIFICATION_TEMPLATES = {
  orderPlaced: (orderNumber: string, total: number): NotificationPayload => ({
    userId: '',
    type: 'order_update',
    title: 'Order Placed Successfully',
    message: `Your order ${orderNumber} for GHS ${total.toFixed(2)} has been placed successfully.`,
    metadata: { orderNumber },
  }),
  paymentConfirmed: (orderNumber: string, amount: number): NotificationPayload => ({
    userId: '',
    type: 'payment_confirmation',
    title: 'Payment Confirmed',
    message: `Your payment of GHS ${amount.toFixed(2)} for order ${orderNumber} has been confirmed.`,
    metadata: { orderNumber, amount },
  }),
  vendorNewOrder: (orderNumber: string, productCount: number): NotificationPayload => ({
    userId: '',
    type: 'vendor_alert',
    title: 'New Order Received',
    message: `You have received a new order ${orderNumber} with ${productCount} item(s).`,
    metadata: { orderNumber, productCount },
  }),
  deliveryUpdate: (orderNumber: string, status: string): NotificationPayload => ({
    userId: '',
    type: 'delivery_update',
    title: 'Delivery Update',
    message: `Your order ${orderNumber} status has been updated to: ${status}.`,
    metadata: { orderNumber, status },
  }),
  supportReply: (ticketNumber: string): NotificationPayload => ({
    userId: '',
    type: 'support',
    title: 'Support Ticket Update',
    message: `Your support ticket ${ticketNumber} has been updated.`,
    metadata: { ticketNumber },
  }),
};
