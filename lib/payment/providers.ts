// @ts-nocheck
import type { PaymentGateway } from '@/lib/types';

export interface PaymentRequest {
  amount: number;
  currency: string;
  email: string;
  reference: string;
  callback_url: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResponse {
  success: boolean;
  authorization_url?: string;
  reference: string;
  gateway_response?: Record<string, unknown>;
  error?: string;
}

export interface PaymentVerification {
  success: boolean;
  status: string;
  amount: number;
  currency: string;
  reference: string;
  gateway_response?: Record<string, unknown>;
  error?: string;
}

export interface PaymentProvider {
  name: PaymentGateway;
  initializePayment(request: PaymentRequest): Promise<PaymentResponse>;
  verifyPayment(reference: string): Promise<PaymentVerification>;
  refundPayment(reference: string, amount?: number): Promise<PaymentResponse>;
}

function getEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

// ===== Hubtel =====
class HubtelProvider implements PaymentProvider {
  name: PaymentGateway = 'hubtel';
  private get clientCode() { return getEnv('HUBTEL_CLIENT_CODE') || ''; }
  private get secret() { return getEnv('HUBTEL_SECRET') || ''; }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const auth = Buffer.from(`${this.clientCode}:${this.secret}`).toString('base64');
      const res = await fetch('https://payproxyapi.hubtel.com/v1.0.0/InitiateAction', {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: request.amount,
          title: 'SmartMart Ghana Payment',
          description: `Payment for ${request.reference}`,
          callbackUrl: request.callback_url,
          returnUrl: request.callback_url,
          cancellationUrl: request.callback_url,
          clientReference: request.reference,
          ...request.metadata,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, reference: request.reference, error: data?.message || 'Hubtel init failed' };
      }
      return {
        success: true,
        authorization_url: data?.checkoutUrl || data?.data?.checkoutUrl,
        reference: request.reference,
        gateway_response: data,
      };
    } catch (err) {
      return { success: false, reference: request.reference, error: (err as Error).message };
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    try {
      const auth = Buffer.from(`${this.clientCode}:${this.secret}`).toString('base64');
      const res = await fetch(`https://payproxyapi.hubtel.com/v1.0.0/TransactionStatus/${reference}`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, status: 'unknown', amount: 0, currency: 'GHS', reference, error: data?.message };
      }
      const status = data?.status === 'Success' ? 'success' : data?.status === 'Pending' ? 'pending' : 'failed';
      return {
        success: status === 'success',
        status,
        amount: data?.amount || 0,
        currency: data?.currency || 'GHS',
        reference,
        gateway_response: data,
      };
    } catch (err) {
      return { success: false, status: 'unknown', amount: 0, currency: 'GHS', reference, error: (err as Error).message };
    }
  }

  async refundPayment(reference: string, _amount?: number): Promise<PaymentResponse> {
    return { success: false, reference, error: 'Hubtel refunds not implemented in this build' };
  }
}

// ===== Paystack =====
class PaystackProvider implements PaymentProvider {
  name: PaymentGateway = 'paystack';
  private get secret() { return getEnv('PAYSTACK_SECRET_KEY') || ''; }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const res = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: request.email,
          amount: Math.round(request.amount * 100),
          currency: request.currency,
          reference: request.reference,
          callback_url: request.callback_url,
          metadata: request.metadata,
        }),
      });
      const data = await res.json();
      if (!data?.status) {
        return { success: false, reference: request.reference, error: data?.message || 'Paystack init failed' };
      }
      return {
        success: true,
        authorization_url: data?.data?.authorization_url,
        reference: request.reference,
        gateway_response: data,
      };
    } catch (err) {
      return { success: false, reference: request.reference, error: (err as Error).message };
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    try {
      const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${this.secret}` },
      });
      const data = await res.json();
      if (!data?.status) {
        return { success: false, status: 'unknown', amount: 0, currency: 'GHS', reference, error: data?.message };
      }
      const status = data?.data?.status === 'success' ? 'success' : data?.data?.status || 'failed';
      return {
        success: status === 'success',
        status,
        amount: (data?.data?.amount || 0) / 100,
        currency: data?.data?.currency || 'GHS',
        reference,
        gateway_response: data,
      };
    } catch (err) {
      return { success: false, status: 'unknown', amount: 0, currency: 'GHS', reference, error: (err as Error).message };
    }
  }

  async refundPayment(reference: string, amount?: number): Promise<PaymentResponse> {
    try {
      const res = await fetch('https://api.paystack.co/refund', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: reference, amount: amount ? Math.round(amount * 100) : undefined }),
      });
      const data = await res.json();
      return { success: !!data?.status, reference, gateway_response: data, error: data?.message };
    } catch (err) {
      return { success: false, reference, error: (err as Error).message };
    }
  }
}

// ===== Flutterwave =====
class FlutterwaveProvider implements PaymentProvider {
  name: PaymentGateway = 'flutterwave';
  private get secret() { return getEnv('FLUTTERWAVE_SECRET_KEY') || ''; }
  private get publicKey() { return getEnv('FLUTTERWAVE_PUBLIC_KEY') || ''; }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const res = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tx_ref: request.reference,
          amount: request.amount,
          currency: request.currency,
          redirect_url: request.callback_url,
          customer: { email: request.email },
          payment_options: 'card,mobilemoneyghana',
          customizations: { title: 'SmartMart Ghana' },
          meta: request.metadata,
        }),
      });
      const data = await res.json();
      if (data?.status !== 'success') {
        return { success: false, reference: request.reference, error: data?.message || 'Flutterwave init failed' };
      }
      return {
        success: true,
        authorization_url: data?.data?.link,
        reference: request.reference,
        gateway_response: data,
      };
    } catch (err) {
      return { success: false, reference: request.reference, error: (err as Error).message };
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    try {
      const res = await fetch(`https://api.flutterwave.com/v3/transactions/${reference}/verify`, {
        headers: { Authorization: `Bearer ${this.secret}` },
      });
      const data = await res.json();
      if (data?.status !== 'success') {
        return { success: false, status: 'unknown', amount: 0, currency: 'GHS', reference, error: data?.message };
      }
      const status = data?.data?.status === 'successful' ? 'success' : data?.data?.status || 'failed';
      return {
        success: status === 'success',
        status,
        amount: data?.data?.amount || 0,
        currency: data?.data?.currency || 'GHS',
        reference,
        gateway_response: data,
      };
    } catch (err) {
      return { success: false, status: 'unknown', amount: 0, currency: 'GHS', reference, error: (err as Error).message };
    }
  }

  async refundPayment(reference: string, amount?: number): Promise<PaymentResponse> {
    try {
      const res = await fetch(`https://api.flutterwave.com/v3/transactions/${reference}/refund`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      return { success: data?.status === 'success', reference, gateway_response: data, error: data?.message };
    } catch (err) {
      return { success: false, reference, error: (err as Error).message };
    }
  }
}

// ===== Stripe =====
class StripeProvider implements PaymentProvider {
  name: PaymentGateway = 'stripe';
  private get secret() { return getEnv('STRIPE_SECRET_KEY') || ''; }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secret}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'mode': 'payment',
          'customer_email': request.email,
          'success_url': `${request.callback_url}?status=success&reference=${request.reference}`,
          'cancel_url': `${request.callback_url}?status=cancel&reference=${request.reference}`,
          'client_reference_id': request.reference,
          'line_items[0][price_data][currency]': request.currency.toLowerCase(),
          'line_items[0][price_data][product_data][name]': `SmartMart Order ${request.reference}`,
          'line_items[0][price_data][unit_amount]': String(Math.round(request.amount * 100)),
          'line_items[0][quantity]': '1',
        }),
      });
      const data = await res.json();
      if (!data?.id) {
        return { success: false, reference: request.reference, error: data?.error?.message || 'Stripe init failed' };
      }
      return {
        success: true,
        authorization_url: data?.url,
        reference: request.reference,
        gateway_response: data,
      };
    } catch (err) {
      return { success: false, reference: request.reference, error: (err as Error).message };
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    try {
      const sessionsRes = await fetch(
        `https://api.stripe.com/v1/checkout/sessions?limit=100`,
        { headers: { Authorization: `Bearer ${this.secret}` } },
      );
      const sessionsData = await sessionsRes.json();
      const session = sessionsData?.data?.find((s: { client_reference_id?: string }) => s.client_reference_id === reference);
      if (!session) {
        return { success: false, status: 'unknown', amount: 0, currency: 'GHS', reference, error: 'Session not found' };
      }
      const status = session.payment_status === 'paid' ? 'success' : session.payment_status || 'failed';
      return {
        success: status === 'success',
        status,
        amount: (session.amount_total || 0) / 100,
        currency: (session.currency || 'GHS').toUpperCase(),
        reference,
        gateway_response: session,
      };
    } catch (err) {
      return { success: false, status: 'unknown', amount: 0, currency: 'GHS', reference, error: (err as Error).message };
    }
  }

  async refundPayment(reference: string, _amount?: number): Promise<PaymentResponse> {
    try {
      const sessionsRes = await fetch(
        `https://api.stripe.com/v1/checkout/sessions?limit=100`,
        { headers: { Authorization: `Bearer ${this.secret}` } },
      );
      const sessionsData = await sessionsRes.json();
      const session = sessionsData?.data?.find((s: { client_reference_id?: string }) => s.client_reference_id === reference);
      if (!session?.payment_intent) {
        return { success: false, reference, error: 'Payment intent not found' };
      }
      const res = await fetch('https://api.stripe.com/v1/refunds', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.secret}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'payment_intent': session.payment_intent }),
      });
      const data = await res.json();
      return { success: !!data?.id, reference, gateway_response: data, error: data?.error?.message };
    } catch (err) {
      return { success: false, reference, error: (err as Error).message };
    }
  }
}

// ===== Cash on Delivery =====
class CashOnDeliveryProvider implements PaymentProvider {
  name: PaymentGateway = 'cash_on_delivery';

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    return {
      success: true,
      reference: request.reference,
      gateway_response: { method: 'cash_on_delivery', message: 'Pay on delivery' },
    };
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    return {
      success: true,
      status: 'pending',
      amount: 0,
      currency: 'GHS',
      reference,
      gateway_response: { method: 'cash_on_delivery' },
    };
  }

  async refundPayment(reference: string): Promise<PaymentResponse> {
    return { success: false, reference, error: 'COD refunds handled manually' };
  }
}

const providers: Record<PaymentGateway, PaymentProvider> = {
  hubtel: new HubtelProvider(),
  paystack: new PaystackProvider(),
  flutterwave: new FlutterwaveProvider(),
  stripe: new StripeProvider(),
  cash_on_delivery: new CashOnDeliveryProvider(),
};

export function getPaymentProvider(gateway: PaymentGateway): PaymentProvider {
  return providers[gateway];
}

export function generatePaymentReference(prefix = 'SMP'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
