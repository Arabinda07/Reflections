import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase environment variables. " +
    "Copy .env.example to .env and fill in your project credentials."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: "pkce",
    // Disabled: AuthCallback.tsx and the native listener each call
    // exchangeCodeForSession() manually. Keeping this true causes a
    // double-consumption race that destroys the PKCE code verifier
    // before the manual call can use it.
    detectSessionInUrl: false,
  },
});
