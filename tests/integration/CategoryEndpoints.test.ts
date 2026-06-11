import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../../backend/src/api/index.ts";
import { getSupabaseClient } from "../../backend/src/repositories/SupabaseClient.ts";
import { getMockSupabaseInstance } from "../mocks/supabase.ts";

vi.mock("../../backend/src/repositories/SupabaseClient.ts", () => ({
  getSupabaseClient: vi.fn(),
}));

describe("Category Endpoints Integration Tests", () => {
  let mockSupabase: any;
  const validUserUuid = "123e4567-e89b-12d3-a456-426614174000";

  beforeEach(() => {
    vi.clearAllMocks();
    const mockData = getMockSupabaseInstance();
    mockSupabase = mockData.mockClient;
    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase);
  });

  it("GET /api/users/:userId/categories - should return list of categories", async () => {
    mockSupabase.from().then = (onfulfilled: any) => {
      return Promise.resolve({
        data: [{ id: 1, name: "Travel", type: "expense" }],
        error: null
      }).then(onfulfilled);
    };

    const res = await app.request(`/api/users/${validUserUuid}/categories`, {
      method: "GET"
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(1);
    expect(body[0].name).toBe("Travel");
  });

  it("POST /api/categories - should create a new category", async () => {
    mockSupabase.from().single.mockResolvedValue({
      data: { id: 102, name: "Groceries", type: "expense" },
      error: null
    });

    const res = await app.request("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: validUserUuid,
        name: "Groceries",
        type: "expense"
      })
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe(102);
  });
});
