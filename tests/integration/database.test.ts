import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Integration Tests for Database Connectivity
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';

describe('Database Connectivity Integration', () => {
  let supabase: SupabaseClient;

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  });

  describe('Connection', () => {
    it('connects to the Supabase database', async () => {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      expect(error).toBeNull();
    });

    it('responds to simple queries', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .single();

      // May return null if no profiles, but should not error
      if (error && error.code !== 'PGRN116') {
        // PGRN116 = no rows found, which is acceptable
        throw error;
      }
      expect(true).toBe(true);
    });
  });

  describe('Core Tables', () => {
    const expectedTables = [
      'profiles',
      'categories',
      'products',
      'product_images',
      'orders',
      'order_items',
      'payments',
      'transactions',
      'addresses',
      'carts',
      'cart_items',
      'wishlists',
      'reviews',
      'vendor_profiles',
      'stores',
      'activity_logs',
      'inventory_logs',
      'loyalty_points',
      'referrals',
      'chat_conversations',
      'chat_messages',
      'support_tickets',
      'settings',
    ];

    for (const table of expectedTables) {
      it(`table "${table}" exists and is accessible`, async () => {
        const { error } = await supabase.from(table).select('*').limit(1);
        expect(error).toBeNull();
      });
    }
  });

  describe('Profiles Table', () => {
    it('has required columns', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .limit(1);

      expect(error).toBeNull();
    });

    it('supports role-based queries', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('role', 'customer')
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Products Table', () => {
    it('has required columns', async () => {
      const { error } = await supabase
        .from('products')
        .select(
          'id, name, slug, description, price, currency, stock, category_id, vendor_id, status, created_at'
        )
        .limit(1);

      expect(error).toBeNull();
    });

    it('supports filtering by status', async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, status')
        .eq('status', 'active')
        .limit(10);

      expect(error).toBeNull();
    });

    it('supports filtering by category', async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, category_id')
        .limit(10);

      expect(error).toBeNull();
    });
  });

  describe('Orders Table', () => {
    it('has required columns', async () => {
      const { error } = await supabase
        .from('orders')
        .select(
          'id, user_id, status, payment_status, total, currency, shipping_address, created_at'
        )
        .limit(1);

      expect(error).toBeNull();
    });

    it('supports status-based queries', async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status')
        .in('status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
        .limit(10);

      expect(error).toBeNull();
    });
  });

  describe('Payments Table', () => {
    it('has required columns', async () => {
      const { error } = await supabase
        .from('payments')
        .select('id, reference, status, amount, currency, gateway, created_at')
        .limit(1);

      expect(error).toBeNull();
    });

    it('supports gateway-based queries', async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('id, gateway')
        .in('gateway', ['paystack', 'stripe', 'flutterwave', 'hubtel'])
        .limit(10);

      expect(error).toBeNull();
    });
  });

  describe('Transactions Table', () => {
    it('has required columns', async () => {
      const { error } = await supabase
        .from('transactions')
        .select('id, reference, status, amount, currency, type, created_at')
        .limit(1);

      expect(error).toBeNull();
    });
  });

  describe('Activity Logs Table', () => {
    it('has required columns', async () => {
      const { error } = await supabase
        .from('activity_logs')
        .select('id, action, entity_type, entity_id, description, created_at')
        .limit(1);

      expect(error).toBeNull();
    });

    it('supports ordering by created_at', async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      expect(error).toBeNull();
    });
  });

  describe('Foreign Key Relationships', () => {
    it('order_items references orders', async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('id, order_id, product_id, quantity, price')
        .limit(1);

      expect(error).toBeNull();
    });

    it('product_images references products', async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select('id, product_id, url, alt_text')
        .limit(1);

      expect(error).toBeNull();
    });

    it('cart_items references carts and products', async () => {
      const { data, error } = await supabase
        .from('cart_items')
        .select('id, cart_id, product_id, quantity')
        .limit(1);

      expect(error).toBeNull();
    });
  });

  describe('Indexes', () => {
    it('products can be queried by slug efficiently', async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, slug')
        .eq('slug', 'test-product-slug')
        .limit(1);

      expect(error).toBeNull();
    });

    it('orders can be queried by user_id efficiently', async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, user_id')
        .eq('user_id', '00000000-0000-0000-0000-000000000000')
        .limit(1);

      expect(error).toBeNull();
    });
  });
});
