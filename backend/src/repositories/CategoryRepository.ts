import { getSupabaseClient } from "./SupabaseClient.ts";

export class CategoryRepository {
  async getAll(userId: string) {
    const supabase = getSupabaseClient();
    return await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });
  }

  async getById(id: string | number) {
    const supabase = getSupabaseClient();
    return await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();
  }

  async create(data: { user_id: string; name: string; type: string; icon?: string; color?: string }) {
    const supabase = getSupabaseClient();
    return await supabase.from("categories").insert([data]).select().single();
  }

  async update(id: string | number, data: Partial<{ name: string; type: string; icon?: string; color?: string }>) {
    const supabase = getSupabaseClient();
    return await supabase.from("categories").update(data).eq("id", id).select().single();
  }

  async delete(id: string | number) {
    const supabase = getSupabaseClient();
    return await supabase.from("categories").delete().eq("id", id);
  }
}
