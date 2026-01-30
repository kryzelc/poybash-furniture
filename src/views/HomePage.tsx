"use client";

import { Hero } from "../components/Hero";
import { FeaturedProducts } from "../components/FeaturedProducts";
import { products } from "../lib/products";
import { useRouter } from "next/navigation";

// Helper function to get storage URL
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ktcadsqclaszdyymftvf.supabase.co";

const getStorageUrl = (folder: string, fileName: string): string => {
  return `${SUPABASE_URL}/storage/v1/object/public/assets/${folder}/${fileName}`;
};

export function HomePage() {
  const router = useRouter();
  const featuredProducts = products.filter((p) => p.featured && p.active);

  const handleProductClick = (productId: number) => {
    router.push(`/products/${productId}`);
  };

  // Use a hero image from the web folder (protected from modifications)
  // Replace 'hero-image.jpg' with your actual hero image filename in web/ folder
  const heroImageUrl = getStorageUrl("web", "hero-image.jpg");

  return (
    <>
      <Hero imageUrl={heroImageUrl} />
      <FeaturedProducts
        products={featuredProducts}
        onProductClick={handleProductClick}
      />
    </>
  );
}
