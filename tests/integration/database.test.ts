import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

describe("Database Connectivity Integration", () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables");
    }
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  });

  describe("platform_settings table", () => {
    it("should connect to platform_settings table", async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should return at least one row from platform_settings", async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .limit(1);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should have expected columns in platform_settings", async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("id, category, key, value")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe("products table", () => {
    it("should connect to products table", async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should return an array from products query", async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should have expected columns in products", async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, status, vendor_id")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should filter products by status", async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, status")
        .eq("status", "active")
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe("categories table", () => {
    it("should connect to categories table", async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should return an array from categories query", async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should have expected columns in categories", async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, parent_id")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should support hierarchical category queries", async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, parent_id")
        .is("parent_id", null)
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe("profiles table", () => {
    it("should connect to profiles table", async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should return an array from profiles query", async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should have expected columns in profiles", async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role")
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should filter profiles by role", async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, role")
        .eq("role", "customer")
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe("cross-table relationships", () => {
    it("should join products with categories", async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          category:categories(id, name)
        `)
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should join products with vendor profiles", async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          vendor:profiles(id, full_name)
        `)
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });
});
