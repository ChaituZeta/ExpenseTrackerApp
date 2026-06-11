import { getSupabaseClient } from "./SupabaseClient.ts";

export class LogRepository {
  async create(log: { user_id: string; user_name: string; action: string; details: string }) {
    const supabase = getSupabaseClient();
    return await supabase.from("activity_logs").insert([log]);
  }

  async getUserLogs(userId: string) {
    const supabase = getSupabaseClient();
    return await supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
  }

  async getAdminLogs() {
    const supabase = getSupabaseClient(true);
    return await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
  }
}
