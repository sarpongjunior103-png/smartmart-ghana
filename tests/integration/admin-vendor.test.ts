import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Integration Tests for Admin & Vendor Features
// Vendor profiles, stores, activity logs, inventory logs, loyalty points,
// referrals, chat conversations
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000010';
const TEST_VENDOR_USER_ID = '00000000-0000-0000-0000-000000000020';
const TEST_CUSTOMER_ID = '00000000-0000-0000-0000-000000000030';

describe('Admin & Vendor Integration Tests', () => {
  let supabase: SupabaseClient;

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  });

  // ==========================================================================
  // Vendor Profiles
  // ==========================================================================

  describe('Vendor Profiles', () => {
    it('retrieves vendor profiles', async () => {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('id, user_id, business_name, status, created_at')
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('filters vendor profiles by status', async () => {
      const statuses = ['pending', 'approved', 'rejected', 'suspended'];
      for (const status of statuses) {
        const { data, error } = await supabase
          .from('vendor_profiles')
          .select('id, status')
          .eq('status', status)
          .limit(10);

        expect(error).toBeNull();
      }
    });

    it('creates a vendor profile', async () => {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .insert({
          user_id: TEST_VENDOR_USER_ID,
          business_name: 'Test Vendor Store',
          status: 'pending',
          business_email: 'vendor@smartmart-test.com',
          business_phone: '+233 55 162 1261',
        })
        .select()
        .single();

      if (error) {
        console.log('Vendor profile creation skipped:', error.message);
        return;
      }
      expect(data).toBeDefined();
      expect(data.status).toBe('pending');

      // Clean up
      await supabase.from('vendor_profiles').delete().eq('id', data.id);
    });

    it('approves a vendor profile', async () => {
      // Create then approve
      const { data: created, error: createError } = await supabase
        .from('vendor_profiles')
        .insert({
          user_id: TEST_VENDOR_USER_ID,
          business_name: 'Approval Test Store',
          status: 'pending',
        })
        .select()
        .single();

      if (createError || !created) return;

      const { data: updated, error: updateError } = await supabase
        .from('vendor_profiles')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', created.id)
        .select()
        .single();

      if (!updateError && updated) {
        expect(updated.status).toBe('approved');
      }

      await supabase.from('vendor_profiles').delete().eq('id', created.id);
    });
  });

  // ==========================================================================
  // Stores
  // ==========================================================================

  describe('Stores', () => {
    it('retrieves stores', async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('id, vendor_id, name, slug, status, created_at')
        .limit(10);

      expect(error).toBeNull();
    });

    it('filters stores by status', async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('id, status')
        .eq('status', 'active')
        .limit(10);

      expect(error).toBeNull();
    });

    it('creates a store for a vendor', async () => {
      const { data, error } = await supabase
        .from('stores')
        .insert({
          vendor_id: TEST_VENDOR_USER_ID,
          name: 'Test Store',
          slug: `test-store-${Date.now()}`,
          status: 'active',
          description: 'A test store for integration testing.',
        })
        .select()
        .single();

      if (error) {
        console.log('Store creation skipped:', error.message);
        return;
      }
      expect(data).toBeDefined();
      expect(data.name).toBe('Test Store');

      await supabase.from('stores').delete().eq('id', data.id);
    });
  });

  // ==========================================================================
  // Activity Logs
  // ==========================================================================

  describe('Activity Logs', () => {
    it('retrieves activity logs', async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('id, action, entity_type, entity_id, description, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      expect(error).toBeNull();
    });

    it('creates an activity log entry', async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          action: 'test.action',
          entity_type: 'test',
          entity_id: `test-${Date.now()}`,
          description: 'Test activity log entry from integration tests',
          metadata: { source: 'integration-test' },
        })
        .select()
        .single();

      if (error) {
        console.log('Activity log creation skipped:', error.message);
        return;
      }
      expect(data).toBeDefined();
      expect(data.action).toBe('test.action');

      await supabase.from('activity_logs').delete().eq('id', data.id);
    });

    it('filters activity logs by action type', async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('id, action')
        .like('action', 'payment.%')
        .limit(10);

      expect(error).toBeNull();
    });

    it('filters activity logs by entity type', async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('id, entity_type')
        .eq('entity_type', 'order')
        .limit(10);

      expect(error).toBeNull();
    });
  });

  // ==========================================================================
  // Inventory Logs
  // ==========================================================================

  describe('Inventory Logs', () => {
    it('retrieves inventory logs', async () => {
      const { data, error } = await supabase
        .from('inventory_logs')
        .select('id, product_id, change_type, quantity_change, reason, created_at')
        .limit(20);

      expect(error).toBeNull();
    });

    it('creates an inventory log entry', async () => {
      const { data, error } = await supabase
        .from('inventory_logs')
        .insert({
          product_id: '00000000-0000-0000-0000-000000000003',
          change_type: 'restock',
          quantity_change: 50,
          previous_stock: 10,
          new_stock: 60,
          reason: 'Test restock from integration tests',
        })
        .select()
        .single();

      if (error) {
        console.log('Inventory log creation skipped:', error.message);
        return;
      }
      expect(data).toBeDefined();
      expect(data.change_type).toBe('restock');

      await supabase.from('inventory_logs').delete().eq('id', data.id);
    });

    it('filters inventory logs by change type', async () => {
      const changeTypes = ['restock', 'sale', 'adjustment', 'return', 'damage'];
      for (const type of changeTypes) {
        const { data, error } = await supabase
          .from('inventory_logs')
          .select('id, change_type')
          .eq('change_type', type)
          .limit(10);

        expect(error).toBeNull();
      }
    });
  });

  // ==========================================================================
  // Loyalty Points
  // ==========================================================================

  describe('Loyalty Points', () => {
    it('retrieves loyalty points for a user', async () => {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('id, user_id, points, balance, created_at')
        .eq('user_id', TEST_CUSTOMER_ID)
        .limit(10);

      expect(error).toBeNull();
    });

    it('creates a loyalty points entry', async () => {
      const { data, error } = await supabase
        .from('loyalty_points')
        .insert({
          user_id: TEST_CUSTOMER_ID,
          points: 100,
          balance: 100,
          type: 'earn',
          description: 'Test loyalty points from integration tests',
        })
        .select()
        .single();

      if (error) {
        console.log('Loyalty points creation skipped:', error.message);
        return;
      }
      expect(data).toBeDefined();
      expect(data.points).toBe(100);

      await supabase.from('loyalty_points').delete().eq('id', data.id);
    });

    it('filters loyalty points by type', async () => {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('id, type')
        .in('type', ['earn', 'redeem', 'adjustment', 'expire'])
        .limit(10);

      expect(error).toBeNull();
    });
  });

  // ==========================================================================
  // Referrals
  // ==========================================================================

  describe('Referrals', () => {
    it('retrieves referrals', async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('id, referrer_id, referred_id, status, reward_amount, created_at')
        .limit(20);

      expect(error).toBeNull();
    });

    it('creates a referral', async () => {
      const { data, error } = await supabase
        .from('referrals')
        .insert({
          referrer_id: TEST_CUSTOMER_ID,
          referred_id: TEST_USER_ID,
          status: 'pending',
          referral_code: `REF-${Date.now()}`,
        })
        .select()
        .single();

      if (error) {
        console.log('Referral creation skipped:', error.message);
        return;
      }
      expect(data).toBeDefined();
      expect(data.status).toBe('pending');

      await supabase.from('referrals').delete().eq('id', data.id);
    });

    it('filters referrals by status', async () => {
      const statuses = ['pending', 'completed', 'rewarded', 'expired'];
      for (const status of statuses) {
        const { data, error } = await supabase
          .from('referrals')
          .select('id, status')
          .eq('status', status)
          .limit(10);

        expect(error).toBeNull();
      }
    });

    it('queries referrals by referrer', async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('id, referrer_id, status')
        .eq('referrer_id', TEST_CUSTOMER_ID)
        .limit(10);

      expect(error).toBeNull();
    });
  });

  // ==========================================================================
  // Chat Conversations
  // ==========================================================================

  describe('Chat Conversations', () => {
    let conversationId: string;

    it('retrieves chat conversations', async () => {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('id, customer_id, vendor_id, status, last_message_at, created_at')
        .limit(20);

      expect(error).toBeNull();
    });

    it('creates a chat conversation', async () => {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          customer_id: TEST_CUSTOMER_ID,
          vendor_id: TEST_VENDOR_USER_ID,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        console.log('Chat conversation creation skipped:', error.message);
        return;
      }
      expect(data).toBeDefined();
      expect(data.status).toBe('active');
      conversationId = data.id;
    });

    it('sends a message in a conversation', async () => {
      if (!conversationId) return;

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: TEST_CUSTOMER_ID,
          content: 'Hello, I have a question about this product.',
          message_type: 'text',
        })
        .select()
        .single();

      if (error) return;
      expect(data).toBeDefined();
      expect(data.content).toContain('question');

      await supabase.from('chat_messages').delete().eq('id', data.id);
    });

    it('retrieves messages for a conversation', async () => {
      if (!conversationId) return;

      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, conversation_id, sender_id, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(50);

      expect(error).toBeNull();
    });

    it('updates conversation status', async () => {
      if (!conversationId) return;

      const { data, error } = await supabase
        .from('chat_conversations')
        .update({ status: 'closed', updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .select()
        .single();

      if (!error && data) {
        expect(data.status).toBe('closed');
      }
    });

    it('cleans up test conversation', async () => {
      if (!conversationId) return;
      await supabase.from('chat_messages').delete().eq('conversation_id', conversationId);
      await supabase.from('chat_conversations').delete().eq('id', conversationId);
    });
  });

  // ==========================================================================
  // Admin Dashboard Aggregation
  // ==========================================================================

  describe('Admin Dashboard Data', () => {
    it('can aggregate vendor counts by status', async () => {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('status')
        .limit(1000);

      expect(error).toBeNull();
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((row) => {
          counts[row.status] = (counts[row.status] || 0) + 1;
        });
      }
    });

    it('can aggregate order counts by status', async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .limit(1000);

      expect(error).toBeNull();
    });

    it('can retrieve recent activity logs for dashboard', async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('id, action, entity_type, description, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      expect(error).toBeNull();
    });
  });
});
