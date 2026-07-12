import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Use service role key for integration tests to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseUrl);

describe("Admin & Vendor Integration Tests", () => {
  describe("vendor_profiles table", () => {
    it("should connect to vendor_profiles table", async () => {
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select("*")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should have expected columns in vendor_profiles", async () => {
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select("id, store_name, status, commission_rate, payout_balance")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should filter vendor_profiles by status", async () => {
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select("id, store_name, status")
        .in("status", ["pending", "approved", "suspended"])
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe("stores table", () => {
    it("should connect to stores table", async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should have expected columns in stores", async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, vendor_id, name, slug, description, logo_url, status")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should join stores with vendor_profiles", async () => {
      const { data, error } = await supabase
        .from("stores")
        .select(`
          id,
          name,
          vendor:vendor_profiles(id, store_name, status, commission_rate)
        `)
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe("activity_logs table", () => {
    it("should connect to activity_logs table", async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should have expected columns in activity_logs", async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("id, user_id, action, entity_type, entity_id, details, created_at")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should filter activity_logs by action", async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("id, action, entity_type")
        .like("action", "payment_%")
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should filter activity_logs by entity_type", async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("id, action, entity_type")
        .eq("entity_type", "payment")
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe("inventory_logs table", () => {
    it("should connect to inventory_logs table", async () => {
      const { data, error } = await supabase
        .from("inventory_logs")
        .select("*")
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should have expected columns in inventory_logs", async () => {
      const { data, error } = await supabase
        .from("inventory_logs")
        .select("id, product_id, change_type, quantity_change, previous_stock, new_stock, reason, created_at")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should filter inventory_logs by change_type", async () => {
      const { data, error } = await supabase
        .from("inventory_logs")
        .select("id, change_type, quantity_change")
        .in("change_type", ["restock", "sale", "adjustment", "return"])
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should join inventory_logs with products", async () => {
      const { data, error } = await supabase
        .from("inventory_logs")
        .select(`
          id,
          change_type,
          quantity_change,
          product:products(id, name)
        `)
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe("loyalty_points table", () => {
    it("should connect to loyalty_points table", async () => {
      const { data, error } = await supabase
        .from("loyalty_points")
        .select("*")
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should have expected columns in loyalty_points", async () => {
      const { data, error } = await supabase
        .from("loyalty_points")
        .select("id, user_id, points, points_type, description, created_at")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should filter loyalty_points by points_type", async () => {
      const { data, error } = await supabase
        .from("loyalty_points")
        .select("id, points, points_type")
        .in("points_type", ["earned", "redeemed", "expired", "adjusted"])
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe("referrals table", () => {
    it("should connect to referrals table", async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should have expected columns in referrals", async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("id, referrer_id, referred_id, referral_code, status, reward_amount, created_at")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should filter referrals by status", async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("id, status, reward_amount")
        .in("status", ["pending", "completed", "rewarded"])
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe("chat_conversations table", () => {
    it("should connect to chat_conversations table", async () => {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should have expected columns in chat_conversations", async () => {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("id, customer_id, vendor_id, product_id, status, last_message_at")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should filter chat_conversations by status", async () => {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("id, status")
        .in("status", ["active", "closed", "archived"])
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should join chat_conversations with profiles (customer and vendor)", async () => {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select(`
          id,
          status,
          customer:profiles!chat_conversations_customer_id_fkey(id, full_name),
          vendor:profiles!chat_conversations_vendor_id_fkey(id, full_name)
        `)
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe("cross-table admin views", () => {
    it("should join vendor_profiles with stores and profiles", async () => {
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select(`
          id,
          store_name,
          status,
          commission_rate,
          profile:profiles(id, email, full_name),
          stores(id, name, slug)
        `)
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });
});
