// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { XCircle, RotateCcw, Home, HeadphonesIcon } from 'lucide-react';

function FailureContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') ?? '';

  return (
    <>
      <Navbar />
      <main className="container-page flex min-h-[70vh] items-center justify-center py-12">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="font-display text-2xl font-bold">Payment Failed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn&apos;t process your payment. This may be due to insufficient funds, an incorrect number, or a network issue.
            </p>
            {orderNumber && (
              <div className="mt-4 rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Order Number</p>
                <p className="font-display font-bold text-lg">{orderNumber}</p>
              </div>
            )}
            <div className="mt-6 space-y-2">
              <Button className="w-full" asChild>
                <Link href="/checkout">
                  <RotateCcw className="mr-2 h-4 w-4" /> Try Again
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/contact">
                  <HeadphonesIcon className="mr-2 h-4 w-4" /> Contact Support
                </Link>
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

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<div className="container-page py-24 text-center">Loading...</div>}>
      <FailureContent />
    </Suspense>
  );
}
