import { createClient } from '@supabase/supabase-js';

// Replaced with your provided placeholder URL and Key
const SUPABASE_URL = "https://wkkvehuckymlrsweyjjf.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_LlU1uakjbI17_gcweZPXrg_tINTOf2J";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
