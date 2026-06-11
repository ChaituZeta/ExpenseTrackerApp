import { describe, it, expect, vi, beforeEach } from "vitest";
import { TransactionService } from "../../backend/src/services/TransactionService.ts";
import { getSupabaseClient } from "../../backend/src/repositories/SupabaseClient.ts";
import { getMockSupabaseInstance } from "../mocks/supabase.ts";

vi.mock("../../backend/src/repositories/SupabaseClient.ts", () => ({
  getSupabaseClient: vi.fn(),
}));

describe("TransactionService Unit Tests", () => {
  let mockSupabase: any;
  let service: TransactionService;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockData = getMockSupabaseInstance();
    mockSupabase = mockData.mockClient;
    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase);
    service = new TransactionService();
  });

  it("should successfully retrieve all transactions for a user", async () => {
    mockSupabase.from().then = (onfulfilled: any) => {
      return Promise.resolve({
        data: [{ id: 1, amount: 250, type: "expense", description: "Food" }],
        error: null
      }).then(onfulfilled);
    };

    const txs = await service.getAll("test-user");
    expect(txs.length).toBe(1);
    expect(txs[0].amount).toBe(250);
  });

  it("should successfully create a valid transaction", async () => {
    mockSupabase.from().single.mockResolvedValue({
      data: { id: 10, amount: 500, type: "income", description: "Salary", date: "2026-06-09" },
      error: null
    });

    const result = await service.create({
      user_id: "test-user",
      amount: 500,
      type: "income",
      description: "Salary",
      date: "2026-06-09"
    });

    expect(result.id).toBe(10);
    expect(result.amount).toBe(500);
  });

  it("should reject creation when the transaction amount is negative or zero", async () => {
    await expect(service.create({
      user_id: "test-user",
      amount: -10,
      type: "expense",
      date: "2026-06-09"
    })).rejects.toThrow("Transaction amount must be greater than zero");
  });

  it("should delete a transaction successfully", async () => {
    mockSupabase.from().delete.mockReturnValue(mockSupabase.from());
    mockSupabase.from().eq.mockResolvedValue({ error: null });

    const result = await service.delete(10);
    expect(result.success).toBe(true);
  });
});
