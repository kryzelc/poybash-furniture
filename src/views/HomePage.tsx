"use client";

import { Hero } from "../components/Hero";
import { FeaturedProducts } from "../components/FeaturedProducts";
import { useProductViewModel } from "@/viewmodels/useProductViewModel";
import { getStorageUrl } from "@/services/supabaseClient";

export function HomePage() {
  // ViewModel handles all business logic
  const { 
    products: featuredProducts, 
    isLoading, 
    error,
    handleProductClick 
  } = useProductViewModel({ 
    filters: { featured: true },
    autoLoad: true 
  });

  // Get hero image URL
  const heroImageUrl = getStorageUrl("assets", "web/hero-image.jpg");

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Oops!</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Main UI (pure presentation)
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
