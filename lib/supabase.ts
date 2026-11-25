import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Without keys the app runs in local mode (pins in localStorage, no sign-in).
export const supabaseEnabled = Boolean(url && key);

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (!supabaseEnabled) throw new Error("Supabase is not configured");
  if (!client) client = createClient(url!, key!, { auth: { flowType: "pkce", detectSessionInUrl: true } });
  return client;
}
