// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

const startTime = Date.now();

export async function GET(request: NextRequest) {
  try {
    const checks: Record<string, string> = {
      database: 'unknown',
      storage: 'unknown',
      email: 'unknown',
      sms: 'unknown',
      payments: 'unknown',
      cloudinary: 'unknown',
    };

    // Check database connectivity
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { error } = await supabase.from('profiles').select('id').limit(1);
        checks.database = error ? 'degraded' : 'healthy';
      } else {
        checks.database = 'not_configured';
      }
    } catch {
      checks.database = 'unhealthy';
    }

    // Check storage
    checks.storage = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'healthy' : 'not_configured';

    // Check email
    checks.email = process.env.SMTP_HOST || process.env.RESEND_API_KEY ? 'healthy' : 'not_configured';

    // Check sms
    checks.sms = process.env.TWILIO_ACCOUNT_SID ? 'healthy' : 'not_configured';

    // Check payments
    checks.payments =
      process.env.PAYSTACK_SECRET_KEY ||
      process.env.FLUTTERWAVE_SECRET_KEY ||
      process.env.STRIPE_SECRET_KEY
        ? 'healthy'
        : 'not_configured';

    // Check cloudinary
    checks.cloudinary = process.env.CLOUDINARY_URL ? 'healthy' : 'not_configured';

    const allHealthy = Object.values(checks).every((s) => s === 'healthy' || s === 'not_configured');

    return NextResponse.json(
      {
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        service: 'marketplace-api',
        version: '1.0.0',
        checks,
        uptime: Math.floor((Date.now() - startTime) / 1000),
        environment: process.env.NODE_ENV || 'development',
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'marketplace-api',
        version: '1.0.0',
        error: 'Health check failed',
        uptime: Math.floor((Date.now() - startTime) / 1000),
        environment: process.env.NODE_ENV || 'development',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
