// Supabase client - ONLY used for image URLs
// Authentication and database operations use localStorage

// Export only the URL for image fetching
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ktcadsqclaszdyymftvf.supabase.co";

// Supabase client is NOT initialized - using localStorage for all backend operations
// Images are fetched directly from Supabase Storage using public URLs
export const supabase = null; // Disabled - using localStorage
