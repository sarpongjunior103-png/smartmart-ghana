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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    let query = supabase
      .from('support_tickets')
      .select(
        `id, subject, description, status, priority, created_at, updated_at,
         ticket_messages(id, content, created_at, sender_id)`,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json(
      {
        tickets: data,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Support tickets GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support tickets', details: error instanceof Error ? error.message : 'Unknown error' },
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

    const { subject, description, priority } = body;

    if (!subject || !description) {
      return NextResponse.json(
        { error: 'subject and description are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const ticketNumber = `TKT-${Date.now()}`;

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        ticket_number: ticketNumber,
        subject,
        description,
        status: 'open',
        priority: priority || 'medium',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ticket }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Support tickets POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    // Check if admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update ticket status' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { ticket_id, status, priority } = body;

    if (!ticket_id) {
      return NextResponse.json(
        { error: 'ticket_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (priority) updates.priority = priority;

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', ticket_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ticket }, { headers: corsHeaders });
  } catch (error) {
    console.error('Support tickets PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update support ticket', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
