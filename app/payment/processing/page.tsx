// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/navbar';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { PAYMENT_GATEWAYS } from '@/lib/constants';

function ProcessingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get('order') ?? '';
  const method = searchParams.get('method') ?? '';
  const reference = searchParams.get('reference') ?? '';
  const gateway = searchParams.get('gateway') ?? 'hubtel';
  const [status, setStatus] = useState<'processing' | 'verifying' | 'redirecting'>('processing');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!reference) {
      const timer = setTimeout(() => {
        const success = Math.random() > 0.1;
        if (success) {
          router.push(`/payment/success?order=${orderNumber}`);
        } else {
          router.push(`/payment/failure?order=${orderNumber}`);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }

    let cancelled = false;
    const verify = async (attempt: number) => {
      if (cancelled) return;
      setStatus('verifying');

      try {
        // Look up payment by reference and check status
        const res = await fetch(`/api/payments?order_id=${encodeURIComponent(reference)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();

        if (cancelled) return;

        const payments = data.payments ?? [];
        const payment = payments.find((p: any) => p.reference === reference);

        if (payment?.status === 'success' || payment?.status === 'completed') {
          router.push(`/payment/success?order=${orderNumber}&reference=${reference}`);
        } else if (payment?.status === 'failed') {
          router.push(`/payment/failure?order=${orderNumber}&reference=${reference}`);
        } else if (attempt < 5) {
          setAttempts(attempt + 1);
          setTimeout(() => verify(attempt + 1), 3000);
        } else {
          // After max retries, assume pending and redirect to success for COD, failure otherwise
          if (method === 'cash_on_delivery') {
            router.push(`/payment/success?order=${orderNumber}`);
          } else {
            router.push(`/payment/failure?order=${orderNumber}&reference=${reference}`);
          }
        }
      } catch {
        if (!cancelled && attempt < 5) {
          setAttempts(attempt + 1);
          setTimeout(() => verify(attempt + 1), 3000);
        } else if (!cancelled) {
          router.push(`/payment/failure?order=${orderNumber}`);
        }
      }
    };

    const timer = setTimeout(() => verify(0), 2000);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [router, orderNumber, reference, gateway]);

  const gatewayLabel = PAYMENT_GATEWAYS.find((g) => g.id === gateway)?.label ?? gateway;

  return (
    <>
      <Navbar />
      <main className="container-page flex min-h-[70vh] items-center justify-center py-12">
        <div className="text-center max-w-md">
          {status === 'processing' && <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />}
          {status === 'verifying' && <AlertCircle className="mx-auto h-16 w-16 text-amber-500 animate-pulse" />}
          {status === 'redirecting' && <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />}

          <h1 className="mt-6 font-display text-2xl font-bold">
            {status === 'processing' && 'Processing Payment...'}
            {status === 'verifying' && 'Verifying Payment...'}
            {status === 'redirecting' && 'Payment Confirmed!'}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {status === 'processing' && `Please wait while we process your ${method.replace('_', ' ')} payment via ${gatewayLabel}.`}
            {status === 'verifying' && `We are confirming your payment with ${gatewayLabel}. Do not close this page.`}
            {status === 'redirecting' && 'Redirecting you to the confirmation page...'}
          </p>

          {orderNumber && <p className="mt-2 text-xs text-muted-foreground">Order: {orderNumber}</p>}
          {reference && <p className="mt-1 text-xs text-muted-foreground">Reference: {reference}</p>}
          {attempts > 0 && (
            <p className="mt-3 text-xs text-amber-600 flex items-center justify-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Retrying verification (attempt {attempts}/5)...
            </p>
          )}

          <div className="mt-6 rounded-lg bg-muted p-4 text-left text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Payment Security</p>
            <p className="mt-1">Your payment is processed securely through {gatewayLabel}. We never store your card details.</p>
          </div>
        </div>
      </main>
    </>
  );
}

export default function PaymentProcessingPage() {
  return (
    <Suspense fallback={<div className="container-page py-24 text-center">Loading...</div>}>
      <ProcessingContent />
    </Suspense>
  );
}
