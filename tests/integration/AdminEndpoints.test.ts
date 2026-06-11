import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../../backend/src/api/index.ts";
import { getSupabaseClient } from "../../backend/src/repositories/SupabaseClient.ts";
import { getMockSupabaseInstance } from "../mocks/supabase.ts";

vi.mock("../../backend/src/repositories/SupabaseClient.ts", () => ({
  getSupabaseClient: vi.fn(),
}));

describe("Admin Endpoints Integration Tests", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockData = getMockSupabaseInstance();
    mockSupabase = mockData.mockClient;
    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase);
  });

  it("GET /api/admin/logs - should reject unauthorized requests", async () => {
    // If auth token is missing or invalid
    const res = await app.request("/api/admin/logs", {
      method: "GET"
    });

    expect([401, 403, 500]).toContain(res.status);
  });

  it("GET /api/admin/logs - should work when provided a valid administrator authorization token", async () => {
    // Mock user being verified as admin
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "admin-abc", email: "cbogineni@gmail.com" } },
      error: null
    });

    mockSupabase.from().maybeSingle.mockResolvedValue({
      data: { id: "admin-abc", role: "admin" },
      error: null
    });

    mockSupabase.from().then = (onfulfilled: any) => {
      return Promise.resolve({
        data: [{ id: 1, action: "Admin Action", details: "Signed in" }],
        error: null
      }).then(onfulfilled);
    };

    const res = await app.request("/api/admin/logs", {
      method: "GET",
      headers: { "Authorization": "Bearer mock-admin-token" }
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(1);
    expect(body[0].action).toBe("Admin Action");
  });
});
