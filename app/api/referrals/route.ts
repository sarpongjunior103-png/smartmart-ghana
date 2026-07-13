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

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Get user's referral code
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // Get referrals made by this user
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select(
        `id, referred_email, status, reward_points, created_at,
         referred_id,
         profiles:referred_id(id, full_name, email)`
      )
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    if (referralsError) throw referralsError;

    // Get stats
    const totalReferrals = referrals?.length || 0;
    const completedReferrals = referrals?.filter((r: any) => r.status === 'completed').length || 0;
    const totalEarned = referrals?.reduce((sum: number, r: any) => sum + (r.reward_points || 0), 0) || 0;

    return NextResponse.json(
      {
        referral_code: profile?.referral_code,
        referrals,
        stats: {
          total_referrals: totalReferrals,
          completed_referrals: completedReferrals,
          total_earned: totalEarned,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Referrals GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referrals', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const body = await request.json();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { referred_email, referral_code } = body;

    if (!referred_email && !referral_code) {
      return NextResponse.json(
        { error: 'referred_email or referral_code is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    let referrerId = user.id;

    // If using a referral code, find the referrer
    if (referral_code) {
      const { data: referrer, error: referrerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', referral_code)
        .single();

      if (referrerError || !referrer) {
        return NextResponse.json(
          { error: 'Invalid referral code' },
          { status: 400, headers: corsHeaders }
        );
      }
      referrerId = referrer.id;
    }

    // Check if referral already exists
    const { data: existing } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrerId)
      .or(`referred_email.eq.${referred_email}`)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Referral already exists' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data: referral, error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_email,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ referral }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Referrals POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create referral', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
