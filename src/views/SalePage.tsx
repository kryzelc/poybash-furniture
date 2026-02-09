'use client';

import { useProductViewModel } from '@/viewmodels';
import { ProductCard } from '../components/ProductCard';
import { Badge } from '../components/ui/badge';
import { Tag } from 'lucide-react';

interface SalePageProps {
  onProductClick: (productId: number) => void;
}

export function SalePage({ onProductClick }: SalePageProps) {
  // Use ViewModel to get sale products
  const { products: allProducts, handleProductClick } = useProductViewModel({
    filters: { featured: false }, // Get all products for sale simulation
    autoLoad: true,
  });

  // Simulate sale items - in a real app, products would have a sale flag
  // For now, we'll show a subset of products as "on sale"
  const saleProducts = allProducts
    .filter(p => [1, 3, 5, 8, 11].includes(p.id))
    .map(p => ({
      ...p,
      originalPrice: p.price,
      salePrice: p.price * 0.8, // 20% off
      discount: 20
    }));

  const handleClick = onProductClick || handleProductClick;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/30 border-b">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Tag className="h-10 w-10 text-primary" />
              <h1>Sale</h1>
            </div>
            <p className="text-muted-foreground mb-6">
              Limited time offers on selected furniture pieces. Save up to 20% on our premium 
              chairs and tables. Don't miss out on these exclusive deals!
            </p>
            <div className="flex flex-wrap gap-4">
              <Badge variant="default" className="px-4 py-2">
                Up to 20% Off
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                Limited Stock
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {saleProducts.map((product) => (
            <div key={product.id} className="relative">
              <Badge 
                variant="destructive" 
                className="absolute top-4 right-4 z-10"
              >
                -{product.discount}%
              </Badge>
              <div onClick={() => handleClick(product.id)}>
                <ProductCard
                  name={product.name}
                  price={product.salePrice}
                  imageUrl={product.imageUrl}
                  category={product.subCategory}
                  onClick={() => handleClick(product.id)}
                />
                <div className="mt-2 px-4">
                  <p className="text-muted-foreground line-through">
                    ₱{product.originalPrice.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {saleProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No sale items available at the moment. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
