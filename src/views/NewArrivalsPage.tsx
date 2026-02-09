'use client';

import { useProductViewModel } from '@/viewmodels';
import { ProductCard } from '../components/ProductCard';

interface NewArrivalsPageProps {
  onProductClick: (productId: number) => void;
}

export function NewArrivalsPage({ onProductClick }: NewArrivalsPageProps) {
  // Use ViewModel to get products, sorted by newest (highest IDs)
  const { products: allProducts, handleProductClick } = useProductViewModel({
    filters: { featured: false },
    autoLoad: true,
  });

  // Get the latest 6 products (highest IDs)
  const newArrivals = [...allProducts]
    .sort((a, b) => b.id - a.id)
    .slice(0, 6);

  const handleClick = onProductClick || handleProductClick;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-secondary/30 border-b">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="max-w-3xl">
            <h1 className="mb-4">New Arrivals</h1>
            <p className="text-muted-foreground">
              Discover our latest collection of handcrafted chairs and tables. 
              Each piece represents the perfect blend of modern design and timeless craftsmanship.
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {newArrivals.map((product) => {
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
              <ProductCard
                key={product.id}
                name={product.name}
                price={product.price}
                imageUrl={product.imageUrl}
                category={product.subCategory}
                onClick={() => handleClick(product.id)}
                hasSizeOptions={hasSizeVariations()}
              />
            );
          })}
        </div>

        {newArrivals.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No new arrivals at the moment. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
