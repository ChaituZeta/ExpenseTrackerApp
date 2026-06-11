import { getSupabaseClient } from "./SupabaseClient.ts";

export class AdminRepository {
  async getAllProfiles() {
    const supabase = getSupabaseClient(true);
    return await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
  }
}
