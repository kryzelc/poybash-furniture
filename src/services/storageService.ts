/**
 * Storage Service - Supabase Storage Configuration
 * Handles image URLs and storage-related operations
 */

// Supabase Storage URL for image fetching
// This is the ONLY Supabase connection that remains in the application
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ktcadsqclaszdyymftvf.supabase.co";

/**
 * Helper function to get image URL from Supabase Storage
 * @param path - Path to the file in Supabase Storage (e.g., "assets/logos/logo.png")
 * @returns Full URL to the storage object
 */
export const getStorageImageUrl = (path: string): string => {
  return `${SUPABASE_URL}/storage/v1/object/public/${path}`;
};

/**
 * Common image paths used throughout the application
 * Centralized for easy maintenance and updates
 */
export const IMAGE_PATHS = {
  logo: "assets/logos/poybash-logo.png",
  aboutPage: "assets/web/about.png",
} as const;
