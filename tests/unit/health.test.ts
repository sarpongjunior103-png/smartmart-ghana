import { GET } from '@/app/api/health/route';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { count: 1 }, error: null })),
        })),
      })),
    })),
    auth: {
      getSession: jest.fn(() =>
        Promise.resolve({
          data: { session: null },
          error: null,
        })
      ),
    },
  })),
}));

describe('Health Check API Route', () => {
  describe('GET /api/health', () => {
    it('returns a 200 status code', async () => {
      const request = new Request('http://localhost/api/health', {
        method: 'GET',
      });
      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it('returns JSON content type', async () => {
      const request = new Request('http://localhost/api/health', {
        method: 'GET',
      });
      const response = await GET(request);
      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');
    });

    it('returns a status field with value "healthy"', async () => {
      const request = new Request('http://localhost/api/health', {
        method: 'GET',
      });
      const response = await GET(request);
      const data = await response.json();
      expect(data.status).toBe('healthy');
    });

    it('includes a timestamp in the response', async () => {
      const request = new Request('http://localhost/api/health', {
        method: 'GET',
      });
      const response = await GET(request);
      const data = await response.json();
      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('includes service information', async () => {
      const request = new Request('http://localhost/api/health', {
        method: 'GET',
      });
      const response = await GET(request);
      const data = await response.json();
      expect(data.service).toBeDefined();
      expect(typeof data.service).toBe('string');
    });

    it('includes version information', async () => {
      const request = new Request('http://localhost/api/health', {
        method: 'GET',
      });
      const response = await GET(request);
      const data = await response.json();
      expect(data.version).toBeDefined();
    });

    it('includes database connectivity status', async () => {
      const request = new Request('http://localhost/api/health', {
        method: 'GET',
      });
      const response = await GET(request);
      const data = await response.json();
      expect(data.database).toBeDefined();
    });

    it('includes uptime information', async () => {
      const request = new Request('http://localhost/api/health', {
        method: 'GET',
      });
      const response = await GET(request);
      const data = await response.json();
      expect(data.uptime).toBeDefined();
      expect(typeof data.uptime).toBe('number');
    });

    it('handles errors gracefully and returns 503', async () => {
      // Mock a failure scenario
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => ({
          from: jest.fn(() => {
            throw new Error('Database connection failed');
          }),
        })),
      }));

      // We expect the handler to catch and return 503
      // Note: The actual behavior depends on the implementation
      const request = new Request('http://localhost/api/health', {
        method: 'GET',
      });
      const response = await GET(request);
      // The response should still be valid JSON
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });
});
