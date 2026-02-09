'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { InvoiceReceipt } from '../components/InvoiceReceipt';
import { CheckCircle, Package, Store, Truck, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface OrderConfirmationPageProps {
  orderId: string;
  onNavigate: (page: string) => void;
}

export function OrderConfirmationPage({ orderId, onNavigate }: OrderConfirmationPageProps) {
  const { getMyOrders } = useAuth();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    // Find the order by ID
    const loadOrder = async () => {
      const orders = await getMyOrders();
      const foundOrder = orders.find(o => o.id === orderId);
      setOrder(foundOrder);
    };
    loadOrder();
  }, [orderId, getMyOrders]);

  if (!order) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <div>
              <h1>Order Placed!</h1>
              <p className="text-muted-foreground mt-2">
                Thank you for your purchase. Your order number is:
              </p>
              <p className="text-primary mt-2">{orderId}</p>
              <p className="text-muted-foreground mt-4">
                Please log in to view your order details and invoice.
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => onNavigate('login')}>
                Log In
              </Button>
              <Button size="lg" variant="outline" onClick={() => onNavigate('home')}>
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <div className="text-center space-y-6 mb-12">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <div>
            <h1>Order Confirmed!</h1>
            <p className="text-muted-foreground mt-2">
              Thank you for your purchase. Your order has been received and is awaiting confirmation.
            </p>
          </div>
        </div>

        {/* Order Timeline */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h3 className="mb-6">What's Next?</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4>Order Pending</h4>
                  <p className="text-muted-foreground">
                    Your order is awaiting admin confirmation. Once confirmed, we'll start preparing your items.
                  </p>
                </div>
              </div>

              {order.deliveryMethod === 'store-pickup' ? (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4>Ready for Pickup</h4>
                    <p className="text-muted-foreground">
                      We'll notify you when your order is ready for pickup at our store.
                      Pickup person: {order.pickupDetails?.pickupPerson}
                    </p>
                    <p className="text-muted-foreground mt-2">
                      <strong>Store Location:</strong> PoyBash Furniture, 1226 A. Lorenzo St., Tondo, Manila
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4>Ready for Your Delivery Service</h4>
                    <p className="text-muted-foreground">
                      We'll notify you when your order is ready for pickup by your delivery service.
                      {order.pickupDetails?.deliveryService && (
                        <> Service: {order.pickupDetails.deliveryService}</>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pickup QR Code */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <QrCode className="w-6 h-6 text-primary" />
                <h3 className="text-xl">Pickup QR Code</h3>
              </div>

              <div className="flex justify-center">
                <div className="p-6 bg-white rounded-lg border-2 border-primary/20 inline-block">
                  <QRCodeSVG
                    value={`POYBASH-ORDER-${order.id}`}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-muted-foreground">Pickup Code:</span>{' '}
                  <span className="font-mono text-lg">{order.id}</span>
                </p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Show this QR code when picking up your order at our store.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice */}
        <div className="mb-8">
          <InvoiceReceipt order={order} />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={() => onNavigate('home')}>
            Continue Shopping
          </Button>
          <Button size="lg" variant="outline" onClick={() => onNavigate('account')}>
            View My Orders
          </Button>
        </div>

        {/* Support Message */}
        <div className="text-center mt-12 p-6 bg-secondary/30 rounded-lg">
          <p className="text-muted-foreground">
            Questions about your order? Contact us on Facebook at{' '}
            <a href="https://bit.ly/poybash" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Poybash Furniture
            </a>
            {' '}or call{' '}
            <a href="tel:+639325490596" className="text-primary hover:underline">
              +63 932 549 0596
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}