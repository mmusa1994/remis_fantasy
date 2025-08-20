import "server-only";
import { createClient } from "@supabase/supabase-js";

// Validate required environment variables
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing env var SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL as fallback)"
  );
}

if (!supabaseServiceKey) {
  throw new Error("Missing env var SUPABASE_SERVICE_ROLE_KEY");
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
