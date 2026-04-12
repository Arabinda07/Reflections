import { createClient } from "@supabase/supabase-js";

// PASTE YOUR SUPABASE URL AND PUBLIC KEY HERE
const SUPABASE_URL = "https://keordfflghzaicfqsqio.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_UjYXWQ7PZe6kO1m8HUVdSA_8GeD3KNj";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
