'use client';

import { ProductDetailPage } from '@/views/ProductDetailPage';
import { useParams } from 'next/navigation';
import { use, useMemo } from 'react';

export default function Page() {
  const params = useParams();
  
  // Safely extract and parse the id parameter
  const productId = useMemo(() => {
    const id = params?.id;
    if (typeof id === 'string') {
      return parseInt(id, 10);
    }
    return 0;
  }, [params]);
  
  return <ProductDetailPage productId={productId} />;
}
