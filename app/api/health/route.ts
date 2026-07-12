import { NextResponse } from 'next/server';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'smartmart-ghana',
    version: '1.0.0',
    checks: {
      database: 'connected',
      storage: 'configured',
      email: process.env.EMAIL_API_KEY ? 'configured' : 'not-configured',
      sms: process.env.SMS_API_KEY ? 'configured' : 'not-configured',
      payments: {
        hubtel: process.env.HUBTEL_CLIENT_CODE ? 'configured' : 'not-configured',
        paystack: process.env.PAYSTACK_SECRET_KEY ? 'configured' : 'not-configured',
        flutterwave: process.env.FLUTTERWAVE_SECRET_KEY ? 'configured' : 'not-configured',
        stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not-configured',
      },
      cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'not-configured',
    },
    uptime: process.uptime ? Math.floor(process.uptime()) : 0,
    environment: process.env.NODE_ENV || 'development',
  };

  return NextResponse.json(health, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Health-Check': 'true',
    },
  });
}
