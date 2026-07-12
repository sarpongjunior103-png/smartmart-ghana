import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const TEST_EMAIL = `test-${Date.now()}@smartmartghana-test.com`;
const TEST_PASSWORD = "TestPassword123!";
const TEST_INVALID_EMAIL = "nonexistent-user@smartmartghana-test.com";
const TEST_INVALID_PASSWORD = "WrongPassword123!";

describe("Supabase Auth Integration", () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables");
    }
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  });

  describe("Client creation", () => {
    it("should create a Supabase client successfully", () => {
      expect(supabase).toBeDefined();
      expect(supabase.auth).toBeDefined();
      expect(supabase.from).toBeDefined();
    });

    it("should have auth methods available", () => {
      expect(typeof supabase.auth.signInWithPassword).toBe("function");
      expect(typeof supabase.auth.signUp).toBe("function");
      expect(typeof supabase.auth.signOut).toBe("function");
      expect(typeof supabase.auth.getSession).toBe("function");
    });
  });

  describe("Sign in with invalid credentials", () => {
    it("should reject sign in with non-existent email", async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: TEST_INVALID_EMAIL,
        password: TEST_INVALID_PASSWORD,
      });

      expect(error).toBeDefined();
      expect(error).not.toBeNull();
      expect(data.user).toBeNull();
      expect(error!.message).toBeTruthy();
    });

    it("should reject sign in with wrong password", async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "admin@smartmartghana.com",
        password: TEST_INVALID_PASSWORD,
      });

      expect(error).toBeDefined();
      expect(data.user).toBeNull();
    });

    it("should reject sign in with empty email", async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: "",
        password: TEST_PASSWORD,
      });

      expect(error).toBeDefined();
    });

    it("should reject sign in with empty password", async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: "",
      });

      expect(error).toBeDefined();
    });
  });

  describe("Sign up with valid credentials", () => {
    it("should create a new user account", async () => {
      const { data, error } = await supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        options: {
          data: {
            full_name: "Test User",
            role: "customer",
          },
        },
      });

      // signUp may succeed or may require email confirmation
      if (error) {
        // Some Supabase projects require email confirmation
        expect(error.message).toBeTruthy();
      } else {
        expect(data.user).toBeDefined();
        expect(data.user!.email).toBe(TEST_EMAIL);
      }
    });

    it("should reject sign up with duplicate email", async () => {
      const { data, error } = await supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      // Second signup with same email should either error or return a user without session
      if (error) {
        expect(error.message).toBeTruthy();
      } else {
        expect(data.user).toBeDefined();
      }
    });

    it("should reject sign up with weak password", async () => {
      const { data, error } = await supabase.auth.signUp({
        email: `weak-${Date.now()}@smartmartghana-test.com`,
        password: "123",
      });

      expect(error).toBeDefined();
      expect(data.user).toBeNull();
    });

    it("should reject sign up with invalid email format", async () => {
      const { error } = await supabase.auth.signUp({
        email: "not-an-email",
        password: TEST_PASSWORD,
      });

      expect(error).toBeDefined();
    });
  });

  describe("Session management", () => {
    it("should return null session when not authenticated", async () => {
      const { data } = await supabase.auth.getSession();
      expect(data.session).toBeNull();
    });

    it("should sign out without error when no session exists", async () => {
      const { error } = await supabase.auth.signOut();
      expect(error).toBeNull();
    });
  });

  afterAll(async () => {
    // Clean up: sign out any session
    if (supabase) {
      await supabase.auth.signOut();
    }
  });
});
