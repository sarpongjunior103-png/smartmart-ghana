// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Package, Home, FileText } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') ?? '';

  return (
    <>
      <Navbar />
      <main className="container-page flex min-h-[70vh] items-center justify-center py-12">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="font-display text-2xl font-bold">Payment Successful!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your order has been confirmed. A confirmation email has been sent to your inbox.
            </p>
            {orderNumber && (
              <div className="mt-4 rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Order Number</p>
                <p className="font-display font-bold text-lg">{orderNumber}</p>
              </div>
            )}
            <div className="mt-6 space-y-2">
              <Button className="w-full" asChild>
                <Link href={`/orders/track?order=${orderNumber}`}>
                  <Package className="mr-2 h-4 w-4" /> Track Order
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/orders">View Order History</Link>
              </Button>
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/"><Home className="mr-2 h-4 w-4" /> Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="container-page py-24 text-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
