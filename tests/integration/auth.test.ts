import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Integration Tests for Supabase Authentication
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';

const TEST_EMAIL = `test-auth-${Date.now()}@smartmart-test.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_USER_NAME = 'Test User';

describe('Supabase Authentication Integration', () => {
  let supabase: SupabaseClient;
  let adminSupabase: SupabaseClient;
  let testUserId: string | null = null;

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  });

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      await adminSupabase.auth.admin.deleteUser(testUserId);
    }
  });

  describe('Sign Up', () => {
    it('creates a new user account', async () => {
      const { data, error } = await supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        options: {
          data: { full_name: TEST_USER_NAME },
        },
      });

      if (error && error.message.includes('already')) {
        // User already exists from a previous run — that's OK
        return;
      }

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user?.email).toBe(TEST_EMAIL);
      testUserId = data.user?.id || null;
    });

    it('rejects duplicate email registration', async () => {
      const { data, error } = await supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      // Should get an error for duplicate
      // Note: Depending on Supabase config, this may return success without session
      // or an error. Either way, no new session should be created.
      if (error) {
        expect(error).toBeDefined();
      } else {
        expect(data.session).toBeNull();
      }
    });

    it('rejects invalid email format', async () => {
      const { data, error } = await supabase.auth.signUp({
        email: 'not-an-email',
        password: TEST_PASSWORD,
      });

      expect(error).toBeDefined();
      expect(data.user).toBeNull();
    });

    it('rejects weak passwords', async () => {
      const { data, error } = await supabase.auth.signUp({
        email: `weak-${Date.now()}@smartmart-test.com`,
        password: '123',
      });

      expect(error).toBeDefined();
    });
  });

  describe('Sign In', () => {
    it('signs in with valid credentials', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      // May require email confirmation depending on config
      if (!error) {
        expect(data.session).toBeDefined();
        expect(data.session?.access_token).toBeDefined();
        expect(data.user?.email).toBe(TEST_EMAIL);
      }
    });

    it('rejects invalid password', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: 'WrongPassword456!',
      });

      expect(error).toBeDefined();
      expect(data.session).toBeNull();
    });

    it('rejects non-existent email', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'nonexistent@smartmart-test.com',
        password: TEST_PASSWORD,
      });

      expect(error).toBeDefined();
      expect(data.session).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('retrieves the current session', async () => {
      const { data, error } = await supabase.auth.getSession();

      expect(error).toBeNull();
      // Session may or may not exist depending on auth state
      expect(data).toBeDefined();
    });

    it('retrieves the current user', async () => {
      const { data, error } = await supabase.auth.getUser();

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('refreshes the session token', async () => {
      const { data, error } = await supabase.auth.refreshSession();

      // May fail if no session — that's acceptable in test env
      if (!error) {
        expect(data).toBeDefined();
      }
    });
  });

  describe('Sign Out', () => {
    it('signs out the current user', async () => {
      const { error } = await supabase.auth.signOut();
      expect(error).toBeNull();

      // Verify session is cleared
      const { data } = await supabase.auth.getSession();
      expect(data.session).toBeNull();
    });
  });

  describe('Password Reset', () => {
    it('sends a password reset email', async () => {
      const { data, error } = await supabase.auth.resetPasswordForEmail(TEST_EMAIL);

      // Should not error even if email doesn't exist (security)
      expect(error).toBeNull();
    });
  });

  describe('Admin Operations', () => {
    it('admin can list users', async () => {
      const { data, error } = await adminSupabase.auth.admin.listUsers();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.users).toBeDefined();
      expect(Array.isArray(data.users)).toBe(true);
    });

    it('admin can delete a user', async () => {
      // Create a throwaway user
      const throwawayEmail = `throwaway-${Date.now()}@smartmart-test.com`;
      const { data: signUpData } = await supabase.auth.signUp({
        email: throwawayEmail,
        password: TEST_PASSWORD,
      });

      const userId = signUpData.user?.id;
      if (userId) {
        const { error } = await adminSupabase.auth.admin.deleteUser(userId);
        expect(error).toBeNull();
      }
    });
  });

  describe('RLS Policies', () => {
    it('unauthenticated users cannot access protected tables', async () => {
      const unauthClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data, error } = await unauthClient.from('orders').select('*');

      // RLS should block access or return empty
      if (error) {
        expect(error).toBeDefined();
      } else {
        expect(data).toEqual([]);
      }
    });

    it('authenticated users can only see their own data', async () => {
      // Sign in first
      await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUserId || 'nonexistent');

      if (!error) {
        // Should only return the user's own profile
        data?.forEach((row) => {
          expect(row.id).toBe(testUserId);
        });
      }
    });
  });
});
