import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Use service role key for integration tests to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseUrl);

describe("Checkout & Payment Integration Tests", () => {
  let testOrderId: string;
  let testPaymentId: string;
  let testTransactionId: string;
  let testShippingId: string;

  describe("orders table", () => {
    it("should connect to orders table", async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should have expected columns in orders", async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_id, total, status, payment_status, shipping_address")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should filter orders by status", async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, status")
        .eq("status", "pending")
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should filter orders by payment_status", async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, payment_status")
        .eq("payment_status", "pending")
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe("payments table", () => {
    it("should connect to payments table", async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should have expected columns in payments", async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, order_id, gateway, gateway_reference, amount, currency, status, gateway_response")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should filter payments by gateway", async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, gateway, status")
        .in("gateway", ["paystack", "stripe", "flutterwave", "hubtel"])
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should filter payments by status", async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, status, amount")
        .eq("status", "success")
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe("transactions table", () => {
    it("should connect to transactions table", async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should have expected columns in transactions", async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, transaction_reference, type, amount, currency, status, user_id")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should filter transactions by type", async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, type, amount")
        .in("type", ["payment", "refund", "payout"])
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should filter transactions by status", async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, status, amount")
        .eq("status", "success")
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe("shipping table", () => {
    it("should connect to shipping table", async () => {
      const { data, error } = await supabase
        .from("shipping")
        .select("*")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should have expected columns in shipping", async () => {
      const { data, error } = await supabase
        .from("shipping")
        .select("id, order_id, carrier, tracking_number, status, shipping_cost")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should filter shipping by status", async () => {
      const { data, error } = await supabase
        .from("shipping")
        .select("id, status, carrier")
        .in("status", ["pending", "shipped", "delivered"])
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe("cross-table relationships", () => {
    it("should join orders with payments", async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          total,
          payments(id, gateway, amount, status)
        `)
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should join orders with transactions", async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          transactions(id, transaction_reference, amount, status)
        `)
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should join orders with shipping", async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          shipping(id, carrier, tracking_number, status)
        `)
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should join payments with transactions via reference", async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          gateway_reference,
          status,
          transactions(id, transaction_reference, status)
        `)
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  afterAll(async () => {
    // IDs would be used for cleanup if test records were created
    void testOrderId;
    void testPaymentId;
    void testTransactionId;
    void testShippingId;
  });
});
