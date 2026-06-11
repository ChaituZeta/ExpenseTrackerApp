import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../../backend/src/api/index.ts";
import { getSupabaseClient } from "../../backend/src/repositories/SupabaseClient.ts";
import { getMockSupabaseInstance } from "../mocks/supabase.ts";

vi.mock("../../backend/src/repositories/SupabaseClient.ts", () => ({
  getSupabaseClient: vi.fn(),
}));

describe("Budget Endpoints Integration Tests", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockData = getMockSupabaseInstance();
    mockSupabase = mockData.mockClient;
    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase);
  });

  it("GET /api/users/:userId/budgets - should retrieve budgets correctly", async () => {
    mockSupabase.from().then = (onfulfilled: any) => {
      return Promise.resolve({
        data: [{ id: 1, amount: 20000, category_id: 1, month: "2026-06" }],
        error: null
      }).then(onfulfilled);
    };

    const res = await app.request("/api/users/user-123/budgets", {
      method: "GET"
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(1);
    expect(body[0].amount).toBe(20000);
  });

  it("POST /api/budgets/upsert - should upsert budget values on duplicate targets", async () => {
    mockSupabase.from().upsert.mockReturnValue(mockSupabase.from());
    mockSupabase.from().select = vi.fn().mockResolvedValue({
      data: [{ id: 15, amount: 12000, category_id: 2, month: "2026-06" }],
      error: null
    });

    const res = await app.request("/api/budgets/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: "user-123",
        category_id: 2,
        amount: 12000,
        month: "2026-06"
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(1);
    expect(body[0].amount).toBe(12000);
  });
});
