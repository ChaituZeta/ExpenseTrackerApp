import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../../backend/src/api/index.ts";
import { getSupabaseClient } from "../../backend/src/repositories/SupabaseClient.ts";
import { getMockSupabaseInstance } from "../mocks/supabase.ts";

vi.mock("../../backend/src/repositories/SupabaseClient.ts", () => ({
  getSupabaseClient: vi.fn(),
}));

describe("Auth Endpoints Integration Tests", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockData = getMockSupabaseInstance();
    mockSupabase = mockData.mockClient;
    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase);
  });

  it("POST /api/auth/login - should log in user successfully and return access token", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: "user-abc", email: "user@example.com", user_metadata: { name: "Test User" } },
        session: { access_token: "mock-access-token" }
      },
      error: null
    });

    mockSupabase.from().maybeSingle.mockResolvedValue({
      data: { id: "user-abc", name: "Test User", role: "user" },
      error: null
    });

    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "user@example.com",
        password: "password123"
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe("user@example.com");
    expect(body.session.access_token).toBe("mock-access-token");
  });

  it("POST /api/auth/login - should fail with 400 for empty or invalid parameters", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "invalid-email-format",
        password: ""
      })
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid email format");
  });

  it("POST /api/auth/register - should register user successfully", async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: "user-new", email: "new@example.com" } },
      error: null
    });

    mockSupabase.from().single.mockResolvedValue({
      data: { id: "user-new", name: "New Register" },
      error: null
    });

    // Mock profiles upsert during registration
    mockSupabase.from().upsert.mockResolvedValue({ error: null });

    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "new@example.com",
        password: "password123",
        name: "New Register"
      })
    });

    expect([200, 201]).toContain(res.status);
  });
});
