import { getSupabaseClient } from "./SupabaseClient.ts";

export class TransactionRepository {
  async getAll(userId: string) {
    const supabase = getSupabaseClient();
    return await supabase
      .from("transactions")
      .select("*, categories(*)")
      .eq("user_id", userId)
      .order("date", { ascending: false });
  }

  async getById(id: string | number) {
    const supabase = getSupabaseClient();
    return await supabase
      .from("transactions")
      .select("*, categories(*)")
      .eq("id", id)
      .maybeSingle();
  }

  async create(data: { user_id: string; category_id?: number | null; amount: number; type: string; description?: string; date: string }) {
    const supabase = getSupabaseClient();
    return await supabase.from("transactions").insert([data]).select().single();
  }

  async update(id: string | number, data: Partial<{ category_id?: number | null; amount: number; type: string; description?: string; date: string }>) {
    const supabase = getSupabaseClient();
    return await supabase.from("transactions").update(data).eq("id", id).select().single();
  }

  async delete(id: string | number) {
    const supabase = getSupabaseClient();
    return await supabase.from("transactions").delete().eq("id", id);
  }

  async getAdminAll() {
    // Matches the existing admin transactions retrieval logic exactly
    const supabase = getSupabaseClient(true);
    return await supabase
      .from("transactions")
      .select("*, category:categories(*)")
      .order("date", { ascending: false });
  }
}
