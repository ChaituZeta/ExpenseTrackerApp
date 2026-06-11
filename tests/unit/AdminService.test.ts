import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminService } from "../../backend/src/services/AdminService.ts";
import { getSupabaseClient } from "../../backend/src/repositories/SupabaseClient.ts";
import { getMockSupabaseInstance } from "../mocks/supabase.ts";

vi.mock("../../backend/src/repositories/SupabaseClient.ts", () => ({
  getSupabaseClient: vi.fn(),
}));

describe("AdminService Unit Tests", () => {
  let mockSupabase: any;
  let service: AdminService;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockData = getMockSupabaseInstance();
    mockSupabase = mockData.mockClient;
    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase);
    service = new AdminService();
  });

  it("should successfully retrieve all users", async () => {
    mockSupabase.from().then = (onfulfilled: any) => {
      return Promise.resolve({
        data: [{ id: "u1", name: "User One" }, { id: "u2", name: "User Two" }],
        error: null
      }).then(onfulfilled);
    };

    const users = await service.getUsers();
    expect(users.length).toBe(2);
    expect(users[0].name).toBe("User One");
  });

  it("should update a user's details successfully", async () => {
    mockSupabase.from().update = vi.fn().mockImplementation(() => mockSupabase.from());
    mockSupabase.from().eq = vi.fn().mockResolvedValue({ error: null });

    const result = await service.updateUser("u1", { name: "Updated Name" });
    expect(result.success).toBe(true);
  });

  it("should delete a user successfully", async () => {
    mockSupabase.from().delete = vi.fn().mockImplementation(() => mockSupabase.from());
    mockSupabase.from().eq = vi.fn().mockResolvedValue({ error: null });

    const result = await service.deleteUser("u1");
    expect(result.success).toBe(true);
  });
});
