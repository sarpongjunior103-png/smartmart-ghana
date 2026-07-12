import { GET } from "../../app/api/health/route";

// Mock the dependencies that the health check route uses
jest.mock("../../lib/supabase", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { count: 1 }, error: null })),
        })),
      })),
    })),
  })),
}));

describe("Health Check API", () => {
  describe("GET /api/health", () => {
    it("should return 200 status on successful health check", async () => {
      const response = await GET();
      expect(response.status).toBe(200);
    });

    it("should return JSON content type", async () => {
      const response = await GET();
      const contentType = response.headers.get("content-type");
      expect(contentType).toContain("application/json");
    });

    it("should return status 'healthy' in response body", async () => {
      const response = await GET();
      const body = await response.json();
      expect(body.status).toBe("healthy");
    });

    it("should include a timestamp in the response", async () => {
      const response = await GET();
      const body = await response.json();
      expect(body.timestamp).toBeDefined();
      expect(new Date(body.timestamp).getTime()).not.toBeNaN();
    });

    it("should include service name in the response", async () => {
      const response = await GET();
      const body = await response.json();
      expect(body.service).toBeDefined();
      expect(typeof body.service).toBe("string");
    });

    it("should include version in the response", async () => {
      const response = await GET();
      const body = await response.json();
      expect(body.version).toBeDefined();
    });

    it("should include database connectivity status", async () => {
      const response = await GET();
      const body = await response.json();
      expect(body.database).toBeDefined();
      expect(body.database.status).toBeDefined();
    });

    it("should return 503 status when database is unhealthy", async () => {
      // Override the mock for this test to simulate DB failure
      const { createClient } = require("../../lib/supabase");
      createClient.mockReturnValueOnce({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn(() =>
                Promise.resolve({ data: null, error: { message: "Connection refused" } })
              ),
            })),
          })),
        })),
      });

      const response = await GET();
      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body.status).toBe("unhealthy");
    });
  });
});
