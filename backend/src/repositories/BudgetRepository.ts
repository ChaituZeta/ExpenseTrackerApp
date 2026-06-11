import { getSupabaseClient } from "./SupabaseClient.ts";

export class BudgetRepository {
  async getAll(userId: string) {
    const supabase = getSupabaseClient();
    return await supabase
      .from("budgets")
      .select("*, categories(*)")
      .eq("user_id", userId);
  }

  async getByMonth(userId: string, month: string) {
    const supabase = getSupabaseClient();
    return await supabase
      .from("budgets")
      .select("*, categories(*)")
      .eq("user_id", userId)
      .eq("month", month);
  }

  async create(data: { user_id: string; category_id: number; amount: number; month: string }) {
    const supabase = getSupabaseClient();
    return await supabase.from("budgets").insert([data]).select().single();
  }

  async update(id: string | number, data: Partial<{ amount: number }>) {
    const supabase = getSupabaseClient();
    return await supabase.from("budgets").update(data).eq("id", id).select().single();
  }

  async delete(id: string | number) {
    const supabase = getSupabaseClient();
    return await supabase.from("budgets").delete().eq("id", id);
  }

  async upsert(data: any) {
    const supabase = getSupabaseClient();
    return await supabase
      .from("budgets")
      .upsert(data, { onConflict: "user_id,category_id,month" })
      .select();
  }
}
