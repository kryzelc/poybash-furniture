// Supabase Storage URL for image fetching
// This is the ONLY Supabase connection that remains in the application
export const SUPABASE_URL =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://ktcadsqclaszdyymftvf.supabase.co";

// Helper function to get image URL from Supabase Storage
export const getStorageImageUrl = (path: string): string => {
    return `${SUPABASE_URL}/storage/v1/object/public/${path}`;
};

// Common image paths
export const IMAGE_PATHS = {
    logo: "assets/logos/poybash-logo.png",
    aboutPage: "assets/web/about.png",
} as const;
