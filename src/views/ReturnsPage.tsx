'use client';

import { RotateCcw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

export function ReturnsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-secondary/30 border-b">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <RotateCcw className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-4">Returns & Refunds</h1>
            <p className="text-muted-foreground">
              Your satisfaction is our priority. Learn about our return policy and how to 
              initiate a return if you're not completely happy with your purchase.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Return Policy */}
          <div className="space-y-6">
            <h2>Our Return Policy</h2>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                We offer a <strong>30-day return policy</strong> on all furniture items. 
                If you're not satisfied with your purchase, you can return it within 30 days 
                of delivery for a full refund or exchange.
              </AlertDescription>
            </Alert>
          </div>

          {/* Eligible vs Non-Eligible */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle>Eligible for Return</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Unused items in original packaging</li>
                  <li>• Items with manufacturing defects</li>
                  <li>• Damaged during shipping</li>
                  <li>• Wrong item received</li>
                  <li>• Items different from description</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <CardTitle>Not Eligible for Return</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Items used or assembled</li>
                  <li>• Items without original packaging</li>
                  <li>• Custom or made-to-order items</li>
                  <li>• Clearance or sale items</li>
                  <li>• Items returned after 30 days</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Return Process */}
          <div className="space-y-6">
            <h2>How to Return an Item</h2>
            <div className="space-y-4">
              <div className="flex gap-4 p-6 rounded-lg border bg-card">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="mb-2">Initiate Return Request</h4>
                  <p className="text-muted-foreground">
                    Log into your account and go to your order history. Select the item you 
                    wish to return and click "Request Refund". Provide the reason for return 
                    and upload photos if the item is damaged or defective.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6 rounded-lg border bg-card">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="mb-2">Await Approval</h4>
                  <p className="text-muted-foreground">
                    Our team will review your request within 24-48 hours. You'll receive an 
                    email with instructions once your return is approved.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6 rounded-lg border bg-card">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="mb-2">Prepare for Pickup</h4>
                  <p className="text-muted-foreground">
                    Pack the item in its original packaging with all accessories and 
                    documentation. Our logistics partner will schedule a pickup at your 
                    convenience (free for defective items, shipping fee applies for other returns).
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6 rounded-lg border bg-card">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="mb-2">Inspection & Refund</h4>
                  <p className="text-muted-foreground">
                    Once we receive and inspect the item (typically 3-5 business days), 
                    we'll process your refund. Refunds are issued to the original payment 
                    method within 7-10 business days.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Return Shipping */}
          <div className="space-y-6">
            <h2>Return Shipping Costs</h2>
            <div className="bg-secondary/30 rounded-lg p-6 space-y-4">
              <div>
                <h4 className="mb-2">Free Return Shipping</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Defective or damaged items</li>
                  <li>Wrong item received</li>
                  <li>Items not as described</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2">Customer Pays Return Shipping</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Change of mind</li>
                  <li>Ordered wrong item</li>
                  <li>Color/size preference</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  Return shipping cost: ₱300 - ₱800 (depending on location and item size)
                </p>
              </div>
            </div>
          </div>

          {/* Exchanges */}
          <Card>
            <CardHeader>
              <CardTitle>Exchanges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We're happy to exchange items for a different color, size, or model within 
                the 30-day return period. To request an exchange:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Follow the return process above and indicate you want an exchange</li>
                <li>Specify which item you'd like to receive instead</li>
                <li>We'll ship the new item once the original is received and inspected</li>
              </ol>
              <Alert>
                <AlertDescription>
                  If there's a price difference, we'll refund or charge the difference accordingly.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Damaged Items */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Received a Damaged Item?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We take great care in packaging, but sometimes damage occurs during shipping. 
                If your item arrives damaged:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Take photos of the damage and packaging immediately</li>
                <li>Contact us within 48 hours at <strong>support@poybash.com</strong></li>
                <li>Keep all packaging materials for inspection</li>
                <li>We'll arrange a free replacement or full refund</li>
              </ol>
            </CardContent>
          </Card>

          {/* Refund Timeline */}
          <div className="space-y-6">
            <h2>Refund Timeline</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center space-y-2">
                  <div className="text-primary mb-2">1-2 Days</div>
                  <p className="text-muted-foreground">
                    Return request review
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center space-y-2">
                  <div className="text-primary mb-2">3-5 Days</div>
                  <p className="text-muted-foreground">
                    Item pickup and inspection
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center space-y-2">
                  <div className="text-primary mb-2">7-10 Days</div>
                  <p className="text-muted-foreground">
                    Refund processing
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-primary/5 rounded-lg p-8 text-center space-y-4">
            <h3>Need Help with a Return?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our customer service team is here to assist you. Contact us at{' '}
              <strong>returns@poybash.com</strong> or call <strong>(02) 8123-4567</strong> for 
              return inquiries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
