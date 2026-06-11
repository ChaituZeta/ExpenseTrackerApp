import { describe, it, expect, vi, beforeEach } from "vitest";
import { BudgetService } from "../../backend/src/services/BudgetService.ts";
import { getSupabaseClient } from "../../backend/src/repositories/SupabaseClient.ts";
import { getMockSupabaseInstance } from "../mocks/supabase.ts";

vi.mock("../../backend/src/repositories/SupabaseClient.ts", () => ({
  getSupabaseClient: vi.fn(),
}));

describe("BudgetService Unit Tests", () => {
  let mockSupabase: any;
  let service: BudgetService;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockData = getMockSupabaseInstance();
    mockSupabase = mockData.mockClient;
    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase);
    service = new BudgetService();
  });

  it("should retrieve budgets by a given month correctly", async () => {
    mockSupabase.from().then = (onfulfilled: any) => {
      return Promise.resolve({
        data: [{ id: 1, category_id: 1, amount: 15000, month: "2026-06" }],
        error: null
      }).then(onfulfilled);
    };

    const budgets = await service.getByMonth("uuid", "2026-06");
    expect(budgets.length).toBe(1);
    expect(budgets[0].amount).toBe(15000);
  });

  it("should upsert budgets correctly", async () => {
    mockSupabase.from().upsert.mockReturnValue(mockSupabase.from());
    mockSupabase.from().select = vi.fn().mockResolvedValue({
      data: [{ id: 1, category_id: 2, amount: 8000, month: "2026-06" }],
      error: null
    });

    const result = await service.upsert({
      category_id: 2,
      amount: 8000,
      month: "2026-06"
    });

    expect(result.length).toBe(1);
    expect(result[0].amount).toBe(8000);
  });

  it("should fail validation for empty or negative budget amounts", async () => {
    await expect(service.upsert({
      category_id: 2,
      amount: -1,
      month: "2026-06"
    })).rejects.toThrow("Budget amount must be greater than zero");
  });
});
