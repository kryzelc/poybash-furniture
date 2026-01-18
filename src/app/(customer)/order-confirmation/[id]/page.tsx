'use client';

import { OrderConfirmationPage as OrderConfirmationPageContent } from '@/views/OrderConfirmationPage';
import { useRouter, useParams } from 'next/navigation';

export default function OrderConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
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
