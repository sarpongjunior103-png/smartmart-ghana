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

    // Get user's loyalty account
    const { data: loyalty, error: loyaltyError } = await supabase
      .from('loyalty_accounts')
      .select('id, points_balance, total_earned, total_redeemed, tier, created_at')
      .eq('user_id', user.id)
      .single();

    if (loyaltyError) throw loyaltyError;

    // Get loyalty transactions
    const { data: transactions, error: txError } = await supabase
      .from('loyalty_transactions')
      .select('id, type, points, description, reference_type, reference_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (txError) throw txError;

    return NextResponse.json(
      { loyalty, transactions },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Loyalty GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty data', details: error instanceof Error ? error.message : 'Unknown error' },
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

    const { points_to_redeem, description } = body;

    if (!points_to_redeem || points_to_redeem <= 0) {
      return NextResponse.json(
        { error: 'points_to_redeem must be a positive number' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get user's loyalty account
    const { data: loyalty, error: loyaltyError } = await supabase
      .from('loyalty_accounts')
      .select('id, points_balance')
      .eq('user_id', user.id)
      .single();

    if (loyaltyError || !loyalty) {
      return NextResponse.json({ error: 'Loyalty account not found' }, { status: 404, headers: corsHeaders });
    }

    if (loyalty.points_balance < points_to_redeem) {
      return NextResponse.json(
        { error: 'Insufficient points balance' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update loyalty account balance
    const { error: updateError } = await supabase
      .from('loyalty_accounts')
      .update({
        points_balance: loyalty.points_balance - points_to_redeem,
        total_redeemed: supabase.rpc('increment', { x: points_to_redeem }),
      })
      .eq('id', loyalty.id);

    if (updateError) throw updateError;

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('loyalty_transactions')
      .insert({
        user_id: user.id,
        type: 'redeem',
        points: points_to_redeem,
        description: description || 'Points redeemed',
      })
      .select()
      .single();

    if (txError) throw txError;

    return NextResponse.json({ transaction, new_balance: loyalty.points_balance - points_to_redeem }, { headers: corsHeaders });
  } catch (error) {
    console.error('Loyalty POST error:', error);
    return NextResponse.json(
      { error: 'Failed to redeem points', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
