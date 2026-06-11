import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.ts";

export function getSupabaseClient(isAdminAction = false) {
  const url = env.SUPABASE_URL;
  const anon = env.SUPABASE_ANON_KEY;
  const service = env.SUPABASE_SERVICE_ROLE_KEY;

  if (isAdminAction && service) {
    return createClient(url, service, {
      auth: { persistSession: false }
    });
  }

  return createClient(url, anon, {
    auth: { persistSession: false }
  });
}
