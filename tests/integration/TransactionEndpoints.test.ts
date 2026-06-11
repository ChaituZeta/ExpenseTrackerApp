import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../../backend/src/api/index.ts";
import { getSupabaseClient } from "../../backend/src/repositories/SupabaseClient.ts";
import { getMockSupabaseInstance } from "../mocks/supabase.ts";

vi.mock("../../backend/src/repositories/SupabaseClient.ts", () => ({
  getSupabaseClient: vi.fn(),
}));

describe("Transaction Endpoints Integration Tests", () => {
  let mockSupabase: any;
  const validUserUuid = "123e4567-e89b-12d3-a456-426614174000";

  beforeEach(() => {
    vi.clearAllMocks();
    const mockData = getMockSupabaseInstance();
    mockSupabase = mockData.mockClient;
    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase);
  });

  it("GET /api/users/:userId/transactions - should fetch a list of transactions for a user", async () => {
    mockSupabase.from().then = (onfulfilled: any) => {
      return Promise.resolve({
        data: [
          { id: 1, amount: 120, type: "expense", date: "2026-06-09" }
        ],
        error: null
      }).then(onfulfilled);
    };

    const res = await app.request(`/api/users/${validUserUuid}/transactions`, {
      method: "GET"
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(1);
    expect(body[0].amount).toBe(120);
  });

  it("POST /api/transactions - should create a transaction after validation", async () => {
    mockSupabase.from().single.mockResolvedValue({
      data: { id: 77, amount: 350.5, type: "income", date: "2026-06-09", description: "Freelancing" },
      error: null
    });

    const res = await app.request("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: validUserUuid,
        amount: 350.5,
        type: "income",
        date: "2026-06-09",
        description: "Freelancing"
      })
    });

    expect(res.status).toBe(210); // Check for 210 custom success code
    const body = await res.json();
    expect(body.id).toBe(77);
  });

  it("POST /api/transactions - should protect against zero and negative amounts", async () => {
    const res = await app.request("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: validUserUuid,
        amount: -10,
        type: "expense",
        date: "2026-06-09"
      })
    });

    expect(res.status).toBe(400); // Validation schema failure returns 400
  });
});
