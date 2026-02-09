"use client";

import { ProductCard } from "./ProductCard";
import { Product } from "@/models";

interface FeaturedProductsProps {
  products: Product[];
  onProductClick: (id: number) => void;
}

export function FeaturedProducts({
  products,
  onProductClick,
}: FeaturedProductsProps) {
  // Take first 8 products for a cleaner look
  const displayProducts = products.slice(0, 8);

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-secondary/30 to-background">
      <div className="container max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-16">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-14 lg:mb-16">
          <h2 className="mb-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Featured Products
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Handpicked pieces that define modern elegance and timeless
            craftsmanship
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
          {displayProducts.map((product) => {
            // Get the minimum price for products with variants
            const getDisplayPrice = () => {
              if (product.variants && product.variants.length > 0) {
                const activeVariants = product.variants.filter((v) => v.active);
                if (activeVariants.length > 0) {
                  return Math.min(...activeVariants.map((v) => v.price));
                }
              }
              return product.price;
            };

            // Check if product has size variations (not just color variations)
            const hasSizeVariations = () => {
              if (product.variants && product.variants.length > 0) {
                const activeVariants = product.variants.filter((v) => v.active);
                const uniqueSizes = new Set(
                  activeVariants.map((v) => v.size).filter((size) => size !== null)
                );
                return uniqueSizes.size > 1;
              }
              return false;
            };

            return (
              <ProductCard
                key={product.id}
                name={product.name}
                price={getDisplayPrice()}
                imageUrl={product.imageUrl}
                category={product.subCategory}
                onClick={() => onProductClick(product.id)}
                hasSizeOptions={hasSizeVariations()}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
