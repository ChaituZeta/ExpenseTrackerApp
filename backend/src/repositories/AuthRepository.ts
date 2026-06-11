import { getSupabaseClient } from "./SupabaseClient.ts";

export class AuthRepository {
  async signInWithPassword(email: string, password: string) {
    const supabase = getSupabaseClient();
    return await supabase.auth.signInWithPassword({ email, password });
  }

  async getUserByToken(token: string) {
    const supabase = getSupabaseClient();
    return await supabase.auth.getUser(token);
  }

  async signUp(email: string, password: string, name: string, phone?: string) {
    const supabase = getSupabaseClient();
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, currency: "₹" }
      }
    });
  }

  async getProfile(userId: string) {
    const supabase = getSupabaseClient();
    return await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  }

  async deleteProfile(id: string) {
    const supabase = getSupabaseClient(true);
    return await supabase.from("profiles").delete().eq("id", id);
  }

  async updateProfile(id: string, data: any) {
    const supabase = getSupabaseClient(true);
    return await supabase.from("profiles").update(data).eq("id", id);
  }

  async upsertProfile(profile: { id: string; email: string; name: string; phone?: string; role: string; currency?: string }) {
    const supabase = getSupabaseClient(true);
    return await supabase.from("profiles").upsert(profile);
  }

  async upsertOTP(email: string, otp: string, expiresAt: string) {
    const supabase = getSupabaseClient(true);
    return await supabase.from("otps").upsert({ email, otp, expires_at: expiresAt }, { onConflict: "email" });
  }

  async getValidOTP(email: string, otp: string) {
    const supabase = getSupabaseClient(true);
    return await supabase
      .from("otps")
      .select("*")
      .eq("email", email)
      .eq("otp", otp)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
  }

  async deleteOTP(email: string) {
    const supabase = getSupabaseClient(true);
    return await supabase.from("otps").delete().eq("email", email);
  }

  async listAuthUsers() {
    const supabase = getSupabaseClient(true);
    return await supabase.auth.admin.listUsers();
  }

  async createAuthUser(email: string, password: string, name: string) {
    const supabase = getSupabaseClient(true);
    return await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });
  }

  async updateAuthUserPassword(userId: string, password: string) {
    const supabase = getSupabaseClient(true);
    return await supabase.auth.admin.updateUserById(userId, { password });
  }
}
