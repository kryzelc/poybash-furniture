'use client';

import { OrderConfirmationPage as OrderConfirmationPageContent } from '@/views/OrderConfirmationPage';
import { useRouter, useParams } from 'next/navigation';
import { useMemo } from 'react';

export default function OrderConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  
  // Safely extract the id parameter
  const orderId = useMemo(() => {
    const id = params?.id;
    return typeof id === 'string' ? id : '';
  }, [params]);
  
  const handleNavigate = (page: string) => {
    if (page === 'home') {
      router.push('/');
    } else if (page === 'products') {
      router.push('/products');
    } else if (page === 'account') {
      router.push('/account');
    } else {
      router.push(`/${page}`);
    }
  };

  return <OrderConfirmationPageContent orderId={orderId} onNavigate={handleNavigate} />;
}
