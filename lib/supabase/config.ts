// Supabase is optional at build time: without these env vars the app runs as
// the design preview on labeled sample data (e.g. a Vercel deploy before the
// env vars are added). With them, it's the real, signed-in app.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

/** Private storage bucket for audio; objects live under {user_id}/{recording_id}.{ext} */
export const AUDIO_BUCKET = "recordings";
