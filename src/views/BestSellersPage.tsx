'use client';

import { useProductViewModel } from '@/viewmodels';
import { ProductCard } from '../components/ProductCard';
import { Badge } from '../components/ui/badge';

interface BestSellersPageProps {
  onProductClick: (productId: number) => void;
}

export function BestSellersPage({ onProductClick }: BestSellersPageProps) {
  // Use ViewModel to get featured products (best sellers)
  const { products: bestSellers, handleProductClick } = useProductViewModel({
    filters: { featured: true },
    autoLoad: true,
  });

  const handleClick = onProductClick || handleProductClick;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-secondary/30 border-b">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <h1>Best Sellers</h1>
              <Badge variant="secondary">Customer Favorites</Badge>
            </div>
            <p className="text-muted-foreground">
              Our most popular furniture pieces, loved by customers across the Philippines. 
              These award-winning designs combine exceptional quality with timeless style.
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {bestSellers.map((product) => {
            // Check if product has size variations
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
              <div key={product.id} className="relative">
                <Badge 
                  variant="default" 
                  className="absolute top-4 right-4 z-10 bg-primary text-primary-foreground"
                >
                  Best Seller
                </Badge>
                <ProductCard
                  name={product.name}
                  price={product.price}
                  imageUrl={product.imageUrl}
                  category={product.subCategory}
                  onClick={() => handleClick(product.id)}
                  hasSizeOptions={hasSizeVariations()}
                />
              </div>
            );
          })}
        </div>

        {bestSellers.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No best sellers available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
