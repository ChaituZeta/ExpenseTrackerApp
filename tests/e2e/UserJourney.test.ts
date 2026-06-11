import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../../backend/src/api/index.ts";
import { getSupabaseClient } from "../../backend/src/repositories/SupabaseClient.ts";
import { getMockSupabaseInstance } from "../mocks/supabase.ts";

vi.mock("../../backend/src/repositories/SupabaseClient.ts", () => ({
  getSupabaseClient: vi.fn(),
}));

describe("E2E User Journey Flow", () => {
  let mockSupabase: any;
  const validUserUuid = "123e4567-e89b-12d3-a456-426614174000";

  beforeEach(() => {
    vi.clearAllMocks();
    const mockData = getMockSupabaseInstance();
    mockSupabase = mockData.mockClient;
    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase);
  });

  it("completes a full transaction and budget logging journey", async () => {
    // 1. REGISTER
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: validUserUuid, email: "user999@example.com" } },
      error: null
    });
    mockSupabase.from().single.mockResolvedValue({
      data: { id: validUserUuid, name: "Guest User" },
      error: null
    });
    mockSupabase.from().upsert.mockResolvedValue({ error: null });

    const regRes = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "user999@example.com",
        password: "securepassword",
        name: "Guest User"
      })
    });
    expect([200, 201]).toContain(regRes.status);

    // 2. LOGIN
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: validUserUuid, email: "user999@example.com", user_metadata: { name: "Guest User" } },
        session: { access_token: "user999-session-token" }
      },
      error: null
    });
    mockSupabase.from().maybeSingle.mockResolvedValue({
      data: { id: validUserUuid, name: "Guest User", role: "user" },
      error: null
    });

    const loginRes = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "user999@example.com",
        password: "securepassword"
      })
    });
    expect(loginRes.status).toBe(200);
    const loginData = await loginRes.json();
    const token = loginData.session.access_token;
    expect(token).toBe("user999-session-token");

    // 3. CREATE CATEGORY
    mockSupabase.from().single.mockResolvedValue({
      data: { id: 300, name: "Coffee", type: "expense" },
      error: null
    });

    const catRes = await app.request("/api/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        user_id: validUserUuid,
        name: "Coffee",
        type: "expense"
      })
    });
    expect([200, 201]).toContain(catRes.status);
    const catData = await catRes.json();
    expect(catData.name).toBe("Coffee");

    // 4. CREATE TRANSACTION
    mockSupabase.from().single.mockResolvedValue({
      data: { id: 400, amount: 150, type: "expense", category_id: 300, date: "2026-06-09" },
      error: null
    });

    const txRes = await app.request("/api/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        user_id: validUserUuid,
        amount: 150,
        type: "expense",
        category_id: 300,
        date: "2026-06-09"
      })
    });
    expect(txRes.status).toBe(210);
    const txData = await txRes.json();
    expect(txData.amount).toBe(150);

    // 5. UPSERT BUDGET
    mockSupabase.from().upsert.mockReturnValue(mockSupabase.from());
    mockSupabase.from().select = vi.fn().mockResolvedValue({
      data: [{ id: 500, amount: 5000, category_id: 300, month: "2026-06" }],
      error: null
    });

    const budgetRes = await app.request("/api/budgets/upsert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        user_id: validUserUuid,
        category_id: 300,
        amount: 5000,
        month: "2026-06"
      })
    });
    expect(budgetRes.status).toBe(200);
    const budgetData = await budgetRes.json();
    expect(budgetData[0].amount).toBe(5000);
  });
});
