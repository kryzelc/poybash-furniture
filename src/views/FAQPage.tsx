'use client';

import { HelpCircle, Search } from 'lucide-react';
import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = {
    ordering: [
      {
        question: 'How do I place an order?',
        answer: 'Browse our products, add items to your cart, and proceed to checkout. You\'ll need to create an account or log in to complete your purchase. Follow the checkout process to provide shipping information and payment details.'
      },
      {
        question: 'Can I modify or cancel my order?',
        answer: 'You can modify or cancel your order within 24 hours of placing it by contacting our customer service team. Once your order has been processed and shipped, modifications are no longer possible.'
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept GCash, bank transfers, and cash on pickup. All online payments are processed securely through our payment partners.'
      },
      {
        question: 'Do you offer installment plans?',
        answer: 'Currently, we don\'t offer installment plans directly. However, if you\'re paying with a credit card that offers installment options, you may be able to convert your purchase through your bank.'
      }
    ],
    shipping: [
      {
        question: 'How long does shipping take?',
        answer: 'Standard delivery takes 5-7 business days within Metro Manila and 7-14 business days for provincial areas. Store pickup orders are ready in 1-2 business days.'
      },
      {
        question: 'Do you ship nationwide?',
        answer: 'Yes, we ship to all major cities and provinces across the Philippines. Delivery times and costs vary by location.'
      },
      {
        question: 'Is free shipping available?',
        answer: 'Yes! We offer free standard shipping on orders over ₱5,000 within Metro Manila and select areas. The free shipping discount is automatically applied at checkout.'
      },
      {
        question: 'Can I track my order?',
        answer: 'Yes, once your order ships, you\'ll receive a tracking number via email. You can also track your order by logging into your account and viewing your order history.'
      },
      {
        question: 'What if I\'m not home when the delivery arrives?',
        answer: 'Our delivery partner will contact you beforehand to schedule a convenient delivery time. If you miss the delivery, they\'ll attempt redelivery or you can arrange to pick up your order from the nearest hub.'
      }
    ],
    products: [
      {
        question: 'Are your products assembled?',
        answer: 'Most of our furniture requires minimal assembly. Each item comes with clear instructions and all necessary hardware. If you need assembly assistance, we can recommend professional assembly services for an additional fee.'
      },
      {
        question: 'What materials are your products made from?',
        answer: 'We use premium materials including solid wood (oak, walnut, teak), engineered wood, metal, and high-quality upholstery fabrics. Specific materials are listed in each product description.'
      },
      {
        question: 'Do your products come with a warranty?',
        answer: 'Yes, all our furniture comes with a 1-year warranty against manufacturing defects. This covers structural issues and material defects but doesn\'t cover normal wear and tear or damage from misuse.'
      },
      {
        question: 'Can I see the furniture in person before buying?',
        answer: 'Yes! You\'re welcome to visit our showrooms at our Lorenzo and Oroquieta warehouses. Please contact us to schedule a visit and ensure the items you want to see are on display.'
      },
      {
        question: 'Do you offer custom furniture?',
        answer: 'We occasionally accept custom orders for specific modifications to existing designs. Contact our customer service team with your requirements, and we\'ll let you know if we can accommodate your request.'
      }
    ],
    returns: [
      {
        question: 'What is your return policy?',
        answer: 'We offer a 30-day return policy on most items. Products must be unused, in original packaging, and in resalable condition. Custom orders and sale items may not be eligible for return.'
      },
      {
        question: 'How do I return an item?',
        answer: 'Log into your account, go to your order history, and select "Request Refund" for the item you want to return. Provide the reason for return and follow the instructions. Our team will review and approve eligible returns within 1-2 business days.'
      },
      {
        question: 'Who pays for return shipping?',
        answer: 'Return shipping is free for defective, damaged, or incorrect items. For other returns (change of mind, etc.), the customer is responsible for return shipping costs, which typically range from ₱300-₱800 depending on location.'
      },
      {
        question: 'How long does it take to get a refund?',
        answer: 'Once we receive and inspect your returned item (3-5 business days), we\'ll process your refund within 7-10 business days to your original payment method.'
      },
      {
        question: 'Can I exchange an item instead of returning it?',
        answer: 'Yes! When submitting your return request, indicate that you\'d like an exchange and specify the replacement item. We\'ll ship the new item once we receive and inspect the returned product.'
      }
    ],
    account: [
      {
        question: 'Do I need an account to place an order?',
        answer: 'Yes, you need to create an account to place an order. This allows you to track orders, save addresses, and access your order history for easy reordering or returns.'
      },
      {
        question: 'How do I reset my password?',
        answer: 'Click "Forgot Password" on the login page and enter your email address. You\'ll receive instructions to reset your password. If you don\'t receive the email, check your spam folder or contact support.'
      },
      {
        question: 'Can I save multiple shipping addresses?',
        answer: 'Yes, you can save multiple shipping addresses in your account settings. This makes it easy to ship to different locations, such as home and office.'
      },
      {
        question: 'How do I update my account information?',
        answer: 'Log into your account and go to your profile settings. You can update your name, email, phone number, and saved addresses at any time.'
      }
    ]
  };

  const filterFAQs = (category: keyof typeof faqs) => {
    if (!searchQuery) return faqs[category];
    return faqs[category].filter(faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-secondary/30 border-b">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-4">Frequently Asked Questions</h1>
            <p className="text-muted-foreground mb-8">
              Find answers to common questions about ordering, shipping, returns, and more.
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="ordering" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-8">
              <TabsTrigger value="ordering">Ordering</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="returns">Returns</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>

            <TabsContent value="ordering" className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                {filterFAQs('ordering').map((faq, index) => (
                  <AccordionItem key={index} value={`ordering-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              {filterFAQs('ordering').length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No results found for "{searchQuery}"
                </p>
              )}
            </TabsContent>

            <TabsContent value="shipping" className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                {filterFAQs('shipping').map((faq, index) => (
                  <AccordionItem key={index} value={`shipping-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              {filterFAQs('shipping').length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No results found for "{searchQuery}"
                </p>
              )}
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                {filterFAQs('products').map((faq, index) => (
                  <AccordionItem key={index} value={`products-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              {filterFAQs('products').length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No results found for "{searchQuery}"
                </p>
              )}
            </TabsContent>

            <TabsContent value="returns" className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                {filterFAQs('returns').map((faq, index) => (
                  <AccordionItem key={index} value={`returns-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              {filterFAQs('returns').length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No results found for "{searchQuery}"
                </p>
              )}
            </TabsContent>

            <TabsContent value="account" className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                {filterFAQs('account').map((faq, index) => (
                  <AccordionItem key={index} value={`account-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              {filterFAQs('account').length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No results found for "{searchQuery}"
                </p>
              )}
            </TabsContent>
          </Tabs>

          {/* Contact Section */}
          <div className="mt-16 bg-primary/5 rounded-lg p-8 text-center space-y-4">
            <h3>Still Have Questions?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Can't find the answer you're looking for? Our customer service team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-muted-foreground">
              <div>
                <strong>Email:</strong> support@poybash.com
              </div>
              <div className="hidden sm:block">•</div>
              <div>
                <strong>Phone:</strong> (02) 8123-4567
              </div>
              <div className="hidden sm:block">•</div>
              <div>
                <strong>Hours:</strong> Mon-Fri, 9AM-6PM
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
