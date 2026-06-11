import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../../backend/src/api/index.ts";
import { getSupabaseClient } from "../../backend/src/repositories/SupabaseClient.ts";
import { getMockSupabaseInstance } from "../mocks/supabase.ts";

vi.mock("../../backend/src/repositories/SupabaseClient.ts", () => ({
  getSupabaseClient: vi.fn(),
}));

describe("Health Check Endpoint Integration Tests", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockData = getMockSupabaseInstance();
    mockSupabase = mockData.mockClient;
    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase);
  });

  it("GET /api/health - should return healthy response when database can select profiles", async () => {
    mockSupabase.from().select = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: [{ id: "test" }], error: null }),
    });

    const res = await app.request("/api/health", {
      method: "GET",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("healthy");
    expect(body.database).toBe("connected");
    expect(body.version).toBe("2.1.0");
  });

  it("GET /api/health - should return unhealthy status when database throws errors", async () => {
    mockSupabase.from().select = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: null, error: { message: "Database connection failed" } }),
    });

    const res = await app.request("/api/health", {
      method: "GET",
    });

    expect(res.status).toBe(200); // Route itself returns status check with unhealthy fields
    const body = await res.json();
    expect(body.status).toBe("unhealthy");
    expect(body.database).toBe("disconnected");
  });
});
