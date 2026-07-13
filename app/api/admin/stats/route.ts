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

export async function GET(request: NextRequest) {
  try {
    // Use service role client for admin stats
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Server not properly configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // First verify the requesting user is an admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can access dashboard stats' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Fetch all stats in parallel
    const [
      { count: totalUsers },
      { count: totalVendors },
      { count: totalProducts },
      { count: totalOrders },
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('vendors').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
    ]);

    // Calculate total revenue
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total')
      .in('status', ['completed', 'delivered']);

    const totalRevenue = (revenueData || []).reduce((sum: number, order: any) => sum + (order.total || 0), 0);

    // Get recent orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select(
        `id, order_number, status, total, created_at,
         profiles(id, full_name, email)`
      )
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent activity logs
    const { data: recentActivity } = await supabase
      .from('activity_logs')
      .select('id, user_id, action, description, created_at, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent vendors
    const { data: recentVendors } = await supabase
      .from('vendors')
      .select('id, business_name, is_verified, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    // Order status breakdown
    const { data: orderStats } = await supabase
      .from('orders')
      .select('status')
      .order('created_at', { ascending: false });

    const statusBreakdown: Record<string, number> = {};
    (orderStats || []).forEach((order: any) => {
      statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
    });

    return NextResponse.json(
      {
        stats: {
          total_users: totalUsers || 0,
          total_vendors: totalVendors || 0,
          total_products: totalProducts || 0,
          total_orders: totalOrders || 0,
          total_revenue: totalRevenue,
        },
        recent_orders: recentOrders || [],
        recent_activity: recentActivity || [],
        recent_vendors: recentVendors || [],
        order_status_breakdown: statusBreakdown,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Admin stats GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
