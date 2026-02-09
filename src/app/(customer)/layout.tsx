'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { canAccessAdmin } = useAuth();
  const router = useRouter();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Redirect admin users to admin dashboard
    if (canAccessAdmin()) {
      router.push('/admin');
    } else {
      setIsChecking(false);
    }
  }, [canAccessAdmin, router]);

  // Show nothing while checking auth
  if (isChecking && canAccessAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onCartOpen={() => setIsCartOpen(true)}
      />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <CartDrawer 
        open={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
      />
    </div>
  );
}
