'use client';

import { Truck, Package, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export function ShippingInfoPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-secondary/30 border-b">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-4">Shipping Information</h1>
            <p className="text-muted-foreground">
              We deliver quality furniture to your doorstep across the Philippines. 
              Learn about our shipping options, delivery times, and policies.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Shipping Options */}
          <div className="space-y-6">
            <h2>Shipping Options</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Standard Delivery</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Our standard shipping option for most furniture items.
                  </p>
                  <div className="space-y-2">
                    <p><strong>Delivery Time:</strong> 5-7 business days</p>
                    <p><strong>Cost:</strong> ₱500 - ₱1,500 (varies by location)</p>
                    <p><strong>Coverage:</strong> Metro Manila and major cities</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Store Pickup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Pick up your order from our warehouses for free.
                  </p>
                  <div className="space-y-2">
                    <p><strong>Ready For Pickup:</strong> 1-2 business days</p>
                    <p><strong>Cost:</strong> Free</p>
                    <p><strong>Locations:</strong> Lorenzo or Oroquieta warehouse</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Free Shipping */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="mb-2">Free Shipping on Orders Over ₱5,000</h3>
                  <p className="text-muted-foreground">
                    Enjoy complimentary standard shipping on all orders above ₱5,000 within 
                    Metro Manila and select areas. Free shipping applies automatically at checkout.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Process */}
          <div className="space-y-6">
            <h2>Delivery Process</h2>
            <div className="space-y-4">
              <div className="flex gap-4 p-6 rounded-lg border bg-card">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="mb-2">Order Confirmation</h4>
                  <p className="text-muted-foreground">
                    Once your order is placed, you'll receive a confirmation email with your 
                    order details and estimated delivery date.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6 rounded-lg border bg-card">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="mb-2">Order Processing</h4>
                  <p className="text-muted-foreground">
                    Our team carefully prepares and packages your furniture to ensure it 
                    arrives in perfect condition.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6 rounded-lg border bg-card">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="mb-2">Shipping Notification</h4>
                  <p className="text-muted-foreground">
                    You'll receive a shipping notification with tracking information once 
                    your order is dispatched.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6 rounded-lg border bg-card">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  4
                </div>
                <div>
                  <h4 className="mb-2">Delivery</h4>
                  <p className="text-muted-foreground">
                    Our delivery partner will contact you to schedule a convenient delivery 
                    time. Someone must be present to receive the order.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Service Areas */}
          <div className="space-y-6">
            <h2>Service Areas</h2>
            <div className="bg-secondary/30 rounded-lg p-6 space-y-4">
              <div>
                <h4 className="mb-2">Metro Manila</h4>
                <p className="text-muted-foreground">
                  5-7 business days delivery. Free shipping on orders over ₱5,000.
                </p>
              </div>
              <div>
                <h4 className="mb-2">Luzon (Outside Metro Manila)</h4>
                <p className="text-muted-foreground">
                  7-10 business days delivery. Shipping fees vary by location.
                </p>
              </div>
              <div>
                <h4 className="mb-2">Visayas & Mindanao</h4>
                <p className="text-muted-foreground">
                  10-14 business days delivery. Shipping fees vary by location.
                </p>
              </div>
              <div>
                <h4 className="mb-2">Remote Areas</h4>
                <p className="text-muted-foreground">
                  Delivery times and fees vary. Please contact us for specific information.
                </p>
              </div>
            </div>
          </div>

          {/* Important Information */}
          <div className="space-y-6">
            <h2>Important Information</h2>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <CardTitle>Processing Time</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Orders are processed Monday through Friday, excluding holidays. Orders 
                    placed on weekends will be processed on the next business day.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Delivery Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Someone must be present to receive the delivery</li>
                    <li>Please inspect items upon delivery for any damage</li>
                    <li>Keep all packaging materials until you're satisfied with the product</li>
                    <li>Large items may be delivered curbside; white-glove service available for additional fee</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tracking Your Order</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    You can track your order status by logging into your account or using the 
                    tracking number provided in your shipping confirmation email.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-primary/5 rounded-lg p-8 text-center space-y-4">
            <h3>Have Questions About Shipping?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our customer service team is here to help. Contact us at <strong>shipping@poybash.com</strong> or 
              call us at <strong>(02) 8123-4567</strong> for shipping inquiries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
