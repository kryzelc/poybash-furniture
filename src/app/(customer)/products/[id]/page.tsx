'use client';

import { ProductDetailPage } from '@/views/ProductDetailPage';
import { useParams } from 'next/navigation';

export default function Page() {
  const params = useParams();
  const productId = parseInt(params.id as string);
  
  return <ProductDetailPage productId={productId} />;
}
