import { SUPABASE_ENABLED } from "@/lib/supabase/config";

// Design preview = no Supabase configured: the UI runs on the labeled sample
// day and changes stay in local state. With Supabase, everything is real.
export const DESIGN_PREVIEW = !SUPABASE_ENABLED;
