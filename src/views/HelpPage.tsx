'use client';

import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { MapPin, Phone, Facebook, Clock, Package, Truck, RefreshCw, HelpCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { validateName, validatePhoneNumber } from '../lib/validation';

export function HelpPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: '' }));
    
    let processedValue = value;
    
    if (name === 'name') {
      processedValue = value.replace(/[^A-Za-zÀ-ÿ\s'-]/g, '');
    } else if (name === 'phone') {
      processedValue = value.replace(/[^0-9\s+-]/g, '');
    }
    
    setFormData({
      ...formData,
      [name]: processedValue,
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameVal = validateName(formData.name);
    if (!nameVal.valid) newErrors.name = nameVal.error || '';

    if (formData.phone.trim()) {
      const phoneVal = validatePhoneNumber(formData.phone);
      if (!phoneVal.valid) newErrors.phone = phoneVal.error || '';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    toast.success('Message sent successfully!', {
      description: "We'll get back to you within 24 hours.",
    });
    setFormData({
      name: '',
      phone: '',
      subject: '',
      message: '',
    });
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Visit Us',
      details: ['PoyBash Furniture', '1226 A. Lorenzo St.', 'Tondo, Manila'],
    },
    {
      icon: Phone,
      title: 'Call Us',
      details: ['+63 932 549 0596', 'Mon-Sat: 9AM - 6PM PHT'],
    },
    {
      icon: Facebook,
      title: 'Follow Us',
      details: ['https://www.facebook.com/PoyBashFunShoppe/'],
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: ['Monday - Saturday: 9AM - 6PM', 'Sunday: Closed'],
    },
  ];

  const faqItems = [
    {
      question: 'What is your return/refund policy?',
      answer: 'For website orders: You can request a refund through your account\'s order history within 7 days after your order is marked as "Completed". You must provide photos showing the damage or defect when submitting your refund request. For Facebook orders: Contact our customer service team through Facebook to discuss your concern. For general returns (non-damage), contact us through Facebook regardless of how you ordered.',
    },
    {
      question: 'How can I arrange delivery or place bulk orders?',
      answer: 'The website is for pickup orders only. For delivery arrangements or bulk orders, please contact us through our Facebook page at Poybash Furniture (https://www.facebook.com/PoyBashFunShoppe/). Our team will assist you with delivery options and special pricing for bulk orders.',
    },
    {
      question: 'How can I track my order?',
      answer: 'Create an account to track your order status in real-time. You\'ll receive email updates, and you can view detailed order information in your account dashboard under "My Orders".',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept Cash on Pickup, GCash, and Bank Transfers. For GCash and Bank transfers, you\'ll need to upload proof of payment during checkout. Payment instructions and account details will be provided during the checkout process.',
    },
    {
      question: 'How long does pickup take?',
      answer: 'Store pickup orders are typically ready within 1-2 business days. We\'ll notify you when your order is ready for pickup at either our Lorenzo or Oroquieta warehouse.',
    },
    {
      question: 'Can I cancel or modify my order?',
      answer: 'You can cancel or modify your order before it\'s marked as "Processing". Contact us immediately through Facebook or our contact form if you need to make changes. Once an order is processing, cancellation may not be possible.',
    },
    {
      question: 'Where do you get your furniture?',
      answer: 'We source our furniture from trusted suppliers who meet our quality standards. We don\'t manufacture furniture ourselves, but carefully select each piece to ensure it meets our customers\' needs.',
    },
    {
      question: 'What if my product is damaged or defective?',
      answer: 'For website orders: Request a refund through your order history within 7 days of order completion. Provide clear photos of the damage or defect. For Facebook orders: Contact us through our Facebook page with photos and your order details. We\'ll work with you to find the best solution (replacement, repair, or refund) based on your specific situation.',
    },
    {
      question: 'Do you offer bulk orders?',
      answer: 'Yes! We handle approximately 5,000-8,000 items in stock and sales per month. For bulk orders or special pricing, please contact us through our Facebook page at https://www.facebook.com/PoyBashFunShoppe/.',
    },
    {
      question: 'Can I walk in to your store?',
      answer: 'Yes! We welcome walk-in customers at our Lorenzo and Oroquieta warehouse locations. Our team of 15 staff members is ready to assist you with on-hand products and same-day transactions.',
    },
  ];

  return (
    <div className="min-h-screen bg-background py-8 lg:py-12">
      <div className="container max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-16">
        {/* Header */}
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="mb-3 lg:mb-4">Help Center</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions, learn about our policies, or get in touch with our team.
          </p>
        </div>

        <Tabs defaultValue="contact" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
            <TabsTrigger value="contact" className="gap-2">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Contact Us</span>
              <span className="sm:hidden">Contact</span>
            </TabsTrigger>
            <TabsTrigger value="shipping" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Shipping Info</span>
              <span className="sm:hidden">Shipping</span>
            </TabsTrigger>
            <TabsTrigger value="returns" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Returns
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              FAQ
            </TabsTrigger>
          </TabsList>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Send us a Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={errors.name ? 'border-red-500' : ''}
                            placeholder="Juan Dela Cruz"
                            required
                          />
                          {errors.name && (
                            <p className="text-xs text-red-500">{errors.name}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone (Optional)</Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className={errors.phone ? 'border-red-500' : ''}
                            placeholder="+63 XXX XXX XXXX"
                          />
                          {errors.phone && (
                            <p className="text-xs text-red-500">{errors.phone}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject *</Label>
                          <Input
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleInputChange}
                            className={errors.subject ? 'border-red-500' : ''}
                            placeholder="Product Inquiry"
                            required
                          />
                          {errors.subject && (
                            <p className="text-xs text-red-500">{errors.subject}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          className={errors.message ? 'border-red-500' : ''}
                          placeholder="Tell us how we can help you..."
                          required
                        />
                        {errors.message && (
                          <p className="text-xs text-red-500">{errors.message}</p>
                        )}
                      </div>

                      <Button type="submit" size="lg" className="w-full">
                        Send Message
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                {contactInfo.map((info, index) => {
                  const Icon = info.icon;
                  return (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="mb-2">{info.title}</h4>
                            {info.details.map((detail, idx) => (
                              <p key={idx} className="text-muted-foreground">
                                {detail}
                              </p>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Shipping Tab */}
          <TabsContent value="shipping" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-6 w-6" />
                  Delivery Methods
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="mb-3">Store Pickup (Free)</h4>
                  <p className="text-muted-foreground mb-4">
                    Pick up your order at our showroom. This option is free and typically ready within 1-2 business days.
                  </p>
                  <div className="bg-secondary/30 p-4 rounded-lg">
                    <p className="mb-2">Store Location:</p>
                    <p className="text-muted-foreground">
                      PoyBash Furniture<br />
                      1226 A. Lorenzo St.<br />
                      Tondo, Manila<br />
                      Open: Monday-Saturday, 9AM-6PM
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3">Customer-Arranged Delivery</h4>
                  <p className="text-muted-foreground mb-4">
                    Arrange your own delivery service for maximum flexibility. Popular options include:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Lalamove - On-demand delivery service</li>
                    <li>Grab Express - Quick and reliable delivery</li>
                    <li>LBC - Nationwide logistics</li>
                    <li>Any delivery service of your choice</li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    Once your order is ready, we'll notify you and provide our showroom address for the delivery service to pick up your items.
                  </p>
                </div>

                <div>
                  <h4 className="mb-3">Order Processing Time</h4>
                  <p className="text-muted-foreground">
                    Orders are typically processed within 1-2 business days. Once ready, we'll notify you via email. For store pickup, you can collect your order during our business hours (Mon-Sat, 9AM-6PM). For customer-arranged delivery, your chosen delivery service can pick up the order from our showroom.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Returns Tab */}
          <TabsContent value="returns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-6 w-6" />
                  Return & Refund Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="mb-3">7-Day Refund Request Window</h4>
                  <p className="text-muted-foreground">
                    After your order status changes to "Completed", you have 7 days to request a refund through your account's order history if there are any issues with your purchase. After 7 days, refund requests will no longer be accepted.
                  </p>
                </div>

                <div>
                  <h4 className="mb-3">How to Request a Refund</h4>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Log in to your account and go to "My Orders"</li>
                    <li>Find the completed order and click "Request Refund"</li>
                    <li>Provide clear photos showing the damage or defect</li>
                    <li>Describe the issue and what happened in detail</li>
                    <li>Submit your refund request for review</li>
                    <li>Our team will review your request and respond within 2-3 business days</li>
                  </ol>
                  <p className="text-muted-foreground mt-3">
                    <strong>Important:</strong> Refund requests can only be made within 7 days after your order is marked as "Completed". Make sure to inspect your items carefully upon pickup.
                  </p>
                </div>

                <div>
                  <h4 className="mb-3">Damaged or Defective Items (For Facebook Orders)</h4>
                  <p className="text-muted-foreground mb-3">
                    If you placed your order through our Facebook page and received a damaged or defective product, please contact our customer service team through Facebook to discuss resolution options:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Send us a message on our Facebook page</li>
                    <li>Provide photos of the damage or defect</li>
                    <li>Explain the issue clearly with your order details</li>
                    <li>Our team will work with you to find the best solution</li>
                    <li>Resolution terms vary case-by-case based on the specific situation</li>
                    <li>Options may include replacement, repair, partial refund, or full refund</li>
                  </ul>
                  <p className="text-muted-foreground mt-3">
                    Contact us on Facebook: <a href="https://www.facebook.com/PoyBashFunShoppe/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Poybash Furniture</a>
                  </p>
                  <p className="text-muted-foreground mt-2">
                    <strong>Note:</strong> If you placed your order through our website, please use the refund request feature in your order history instead.
                  </p>
                </div>

                <div>
                  <h4 className="mb-3">Returns Process</h4>
                  <p className="text-muted-foreground mb-3">
                    For general returns (items you wish to return for reasons other than damage/defects), you must coordinate with our customer service team:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Contact our team through our Facebook page</li>
                    <li>Provide your order number and reason for return</li>
                    <li>Items must be in original, unused condition with all packaging</li>
                    <li>Return authorization must be obtained before bringing items back</li>
                    <li>Returns are subject to inspection and approval</li>
                  </ul>
                  <p className="text-muted-foreground mt-3">
                    <strong>Note:</strong> Return terms and conditions will be discussed with our customer service team on a case-by-case basis.
                  </p>
                </div>

                <div>
                  <h4 className="mb-3">Quality Inspection</h4>
                  <p className="text-muted-foreground">
                    We carefully inspect all items before they're released for pickup to ensure quality. However, if you notice any issues after pickup, please document them with photos and contact us within the 7-day window to request a refund through your order history.
                  </p>
                </div>

                <div>
                  <h4 className="mb-3">Non-Returnable Items</h4>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Custom-ordered or specially modified furniture</li>
                    <li>Items showing signs of use or assembly</li>
                    <li>Items with damaged or removed tags/packaging</li>
                    <li>Orders completed more than 7 days ago (refund window expired)</li>
                  </ul>
                  <p className="text-muted-foreground mt-3">
                    Exceptions may be made for damaged or defective items - contact our customer service team for assistance.
                  </p>
                </div>

                <div className="bg-secondary/30 p-4 rounded-lg">
                  <h4 className="mb-2">Need Help?</h4>
                  <p className="text-muted-foreground">
                    For any questions about returns, refunds, or damaged items, please reach out to our customer service team:
                  </p>
                  <ul className="mt-3 space-y-1 text-muted-foreground">
                    <li><strong>Facebook:</strong> <a href="https://www.facebook.com/PoyBashFunShoppe/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Poybash Furniture</a></li>
                    <li><strong>Phone:</strong> +63 932 549 0596</li>
                    <li><strong>Hours:</strong> Monday - Saturday, 9AM - 6PM</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-6 w-6" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger>{item.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}