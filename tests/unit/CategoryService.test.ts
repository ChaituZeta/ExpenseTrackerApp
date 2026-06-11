import { describe, it, expect, vi, beforeEach } from "vitest";
import { CategoryService } from "../../backend/src/services/CategoryService.ts";
import { getSupabaseClient } from "../../backend/src/repositories/SupabaseClient.ts";
import { getMockSupabaseInstance } from "../mocks/supabase.ts";

vi.mock("../../backend/src/repositories/SupabaseClient.ts", () => ({
  getSupabaseClient: vi.fn(),
}));

describe("CategoryService Unit Tests", () => {
  let mockSupabase: any;
  let service: CategoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockData = getMockSupabaseInstance();
    mockSupabase = mockData.mockClient;
    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase);
    service = new CategoryService();
  });

  it("should retrieve categories correctly sorted for a user", async () => {
    mockSupabase.from().then = (onfulfilled: any) => {
      return Promise.resolve({
        data: [{ id: 1, name: "Entertainment", type: "expense" }],
        error: null
      }).then(onfulfilled);
    };

    const categories = await service.getAll("test-user");
    expect(categories.length).toBe(1);
    expect(categories[0].name).toBe("Entertainment");
  });

  it("should create a category successfully with valid non-empty fields", async () => {
    mockSupabase.from().single.mockResolvedValue({
      data: { id: 5, name: "Utilities", type: "expense" },
      error: null
    });

    const result = await service.create({
      user_id: "test-user",
      name: "Utilities",
      type: "expense"
    });

    expect(result.id).toBe(5);
    expect(result.name).toBe("Utilities");
  });

  it("should reject category creation with empty name", async () => {
    await expect(service.create({
      user_id: "test-user",
      name: " ",
      type: "expense"
    })).rejects.toThrow("Category name is required");
  });
});
