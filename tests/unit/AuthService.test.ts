import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "../../backend/src/services/AuthService.ts";
import { getSupabaseClient } from "../../backend/src/repositories/SupabaseClient.ts";
import { getMockSupabaseInstance } from "../mocks/supabase.ts";

vi.mock("../../backend/src/repositories/SupabaseClient.ts", () => ({
  getSupabaseClient: vi.fn(),
}));

describe("AuthService Unit Tests", () => {
  let mockSupabase: any;
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockData = getMockSupabaseInstance();
    mockSupabase = mockData.mockClient;
    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase);
    service = new AuthService();
  });

  it("should successfully log in a user with a valid profile", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: "test-user-id", email: "test@example.com", user_metadata: { name: "Test User" } },
        session: { access_token: "test-session-token" }
      },
      error: null
    });

    mockSupabase.from().maybeSingle.mockResolvedValue({
      data: { id: "test-user-id", name: "Profile Name", role: "user", currency: "₹" },
      error: null
    });

    const result = await service.login("test@example.com", "password123");

    expect(result.session.access_token).toBe("test-session-token");
    expect(result.user.id).toBe("test-user-id");
    expect(result.user.name).toBe("Profile Name");
    expect(result.user.role).toBe("user");
  });

  it("should throw an error during login when database client returns auth errors", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" }
    });

    await expect(service.login("test@example.com", "wrongpass")).rejects.toThrow("Invalid login credentials");
  });

  it("should register a new user client profile and sync successfully", async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: "new-user-id", email: "new@example.com" } },
      error: null
    });

    mockSupabase.from().single.mockResolvedValue({
      data: { id: "new-user-id", name: "New User" },
      error: null
    });

    mockSupabase.from().upsert.mockResolvedValue({ error: null });

    const result = await service.register("new@example.com", "password123", "New User");
    expect(result.user.id).toBe("new-user-id");
  });

  it("should verify admin status correctly", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "admin-user", email: "cbogineni@gmail.com" } },
      error: null
    });

    mockSupabase.from().maybeSingle.mockResolvedValue({
      data: { id: "admin-user", role: "admin" },
      error: null
    });

    const userObj = await service.verifyAdmin("valid-token");
    expect(userObj.id).toBe("admin-user");
    expect(userObj.email).toBe("cbogineni@gmail.com");
  });
});
