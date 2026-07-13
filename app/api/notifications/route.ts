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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const unreadOnly = searchParams.get('unread') === 'true';

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const offset = (page - 1) * limit;

    let query = supabase
      .from('notifications')
      .select('id, type, title, message, data, is_read, created_at', { count: 'exact' })
      .eq('user_id', user.id);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json(
      {
        notifications: data,
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
    console.error('Notifications GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const body = await request.json();

    const { user_id, type, title, message, data: notificationData } = body;

    if (!user_id || !type || !title) {
      return NextResponse.json(
        { error: 'user_id, type, and title are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        message,
        data: notificationData,
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ notification: data }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Notifications POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create notification', details: error instanceof Error ? error.message : 'Unknown error' },
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

    const { notification_id, mark_all } = body;

    if (mark_all) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      return NextResponse.json({ message: 'All notifications marked as read' }, { headers: corsHeaders });
    }

    if (!notification_id) {
      return NextResponse.json(
        { error: 'notification_id is required (or set mark_all to true)' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ notification: data }, { headers: corsHeaders });
  } catch (error) {
    console.error('Notifications PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Notification deleted' }, { headers: corsHeaders });
  } catch (error) {
    console.error('Notifications DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
