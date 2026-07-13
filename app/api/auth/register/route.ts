// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const body = await request.json();

    const { email, password, full_name, phone } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          phone,
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create profile record
    if (data.user) {
      const referralCode = `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`.toUpperCase();

      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name,
        phone,
        role: 'customer',
        referral_code: referralCode,
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      // Create loyalty account
      const { error: loyaltyError } = await supabase.from('loyalty_accounts').insert({
        user_id: data.user.id,
        points_balance: 100, // Welcome bonus
        total_earned: 100,
        total_redeemed: 0,
        tier: 'bronze',
      });

      if (loyaltyError) {
        console.error('Loyalty account creation error:', loyaltyError);
      }
    }

    return NextResponse.json(
      {
        user: data.user,
        session: data.session,
        message: data.session
          ? 'Registration successful'
          : 'Registration successful. Please check your email to verify your account.',
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Failed to register', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
