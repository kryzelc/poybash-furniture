'use client';

import { Hero } from '../components/Hero';
import { FeaturedProducts } from '../components/FeaturedProducts';
import { products } from '../lib/products';
import { useRouter } from 'next/navigation';

export function HomePage() {
  const router = useRouter();
  const featuredProducts = products.filter(p => p.featured && p.active);

  const handleProductClick = (productId: number) => {
    router.push(`/products/${productId}`);
  };

  return (
    <>
      <Hero imageUrl="https://images.unsplash.com/photo-1759803557159-f48be1dcb43d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b29kZW4lMjBmdXJuaXR1cmUlMjBuYXR1cmFsJTIwbGlnaHR8ZW58MXx8fHwxNzYyMzMwOTQ4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" />
      <FeaturedProducts products={featuredProducts} onProductClick={handleProductClick} />
    </>
  );
}
