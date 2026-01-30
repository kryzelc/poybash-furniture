"use client";

import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent } from "../components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  MapPin,
  Phone,
  Facebook,
  Package,
  Truck,
  RefreshCw,
  HelpCircle,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { validateName, validatePhoneNumber } from "../lib/validation";

export function HelpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: "" }));

    let processedValue = value;

    if (name === "name") {
      processedValue = value.replace(/[^A-Za-zÀ-ÿ\s'-]/g, "");
    } else if (name === "phone") {
      processedValue = value.replace(/[^0-9\s+-]/g, "");
    }

    setFormData({
      ...formData,
      [name]: processedValue,
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameVal = validateName(formData.name);
    if (!nameVal.valid) newErrors.name = nameVal.error || "";

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.subject.trim()) newErrors.subject = "Subject is required";
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Form validation errors are shown inline
      return;
    }

    toast.success("Message sent successfully", {
      description: "We'll get back to you within 24 hours.",
    });
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Visit Us",
      details: ["PoyBash Furniture", "1226 A. Lorenzo St.", "Tondo, Manila"],
    },
    {
      icon: Phone,
      title: "Call Us",
      details: ["+63 932 549 0596", "Mon-Sat: 9AM - 6PM PHT"],
    },
    {
      icon: Facebook,
      title: "Follow Us",
      details: ["https://bit.ly/poybash"],
      isLink: true,
    },
    {
      icon: Clock,
      title: "Business Hours",
      details: ["Monday - Saturday: 9AM - 6PM", "Sunday: Closed"],
    },
  ];

  const faqItems = [
    {
      category: "Orders & Payment",
      questions: [
        {
          question: "What payment methods do you accept?",
          answer:
            "We accept Cash on Pickup, GCash, and Bank Transfers. For GCash and Bank transfers, you'll need to upload proof of payment during checkout. Payment instructions and account details will be provided during the checkout process.",
        },
        {
          question: "How can I track my order?",
          answer:
            'Create an account to track your order status in real-time. You\'ll receive email updates, and you can view detailed order information in your account dashboard under "My Orders".',
        },
        {
          question: "Can I cancel or modify my order?",
          answer:
            'You can cancel or modify your order before it\'s marked as "Processing". Contact us immediately through Facebook or our contact form if you need to make changes. Once an order is processing, cancellation may not be possible.',
        },
      ],
    },
    {
      category: "Shipping & Pickup",
      questions: [
        {
          question: "How long does pickup take?",
          answer:
            "Store pickup orders are typically ready within 1-2 business days. We'll notify you when your order is ready for pickup at either our Lorenzo or Oroquieta warehouse.",
        },
        {
          question: "How can I arrange delivery or place bulk orders?",
          answer:
            "The website is for pickup orders only. For delivery arrangements or bulk orders, please contact us through our Facebook page at Poybash Furniture (https://bit.ly/poybash). Our team will assist you with delivery options and special pricing for bulk orders.",
        },
        {
          question: "Can I walk in to your store?",
          answer:
            "Yes! We welcome walk-in customers at our Lorenzo and Oroquieta warehouse locations. Our team of 15 staff members is ready to assist you with on-hand products and same-day transactions.",
        },
      ],
    },
    {
      category: "Returns & Refunds",
      questions: [
        {
          question: "What is your return/refund policy?",
          answer:
            'For website orders: You can request a refund through your account\'s order history within 7 days after your order is marked as "Completed". You must provide photos showing the damage or defect when submitting your refund request. For Facebook orders: Contact our customer service team through Facebook to discuss your concern. For general returns (non-damage), contact us through Facebook regardless of how you ordered.',
        },
        {
          question: "What if my product is damaged or defective?",
          answer:
            "For website orders: Request a refund through your order history within 7 days of order completion. Provide clear photos of the damage or defect. For Facebook orders: Contact us through our Facebook page with photos and your order details. We'll work with you to find the best solution (replacement, repair, or refund) based on your specific situation.",
        },
      ],
    },
    {
      category: "Products & Services",
      questions: [
        {
          question: "Where do you get your furniture?",
          answer:
            "We source our furniture from trusted suppliers who meet our quality standards. We don't manufacture furniture ourselves, but carefully select each piece to ensure it meets our customers' needs.",
        },
        {
          question: "Do you offer bulk orders?",
          answer:
            "Yes! We handle approximately 5,000-8,000 items in stock and sales per month. For bulk orders or special pricing, please contact us through our Facebook page at https://bit.ly/poybash.",
        },
      ],
    },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .input-beige {
            background-color: #F3F0EB;
            border-color: transparent;
        }
        .input-beige:focus {
            background-color: white;
            border-color: #6B4E3D;
            outline: none;
            box-shadow: 0 0 0 1px #6B4E3D;
        }
      `}</style>

      <div className="min-h-screen bg-[#FDFBF7] py-16 sm:py-20 lg:py-24">
        <div className="container max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-16">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#6B4E3D] mb-4">
              Help Center
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Find answers to common questions, learn about our policies, or get
              in touch with our team.
            </p>
          </div>

          <Tabs defaultValue="contact" className="space-y-12">
            {/* Tabs Navigation */}
            <TabsList className="flex flex-wrap justify-center w-full h-auto bg-transparent gap-4 sm:gap-8 p-0 mb-8">
              <TabsTrigger
                value="contact"
                className="rounded-full px-6 py-3 text-base font-medium data-[state=active]:bg-[#6B4E3D] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-[#6B4E3D] hover:bg-[#6B4E3D]/10 transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Contact Us
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="shipping"
                className="rounded-full px-6 py-3 text-base font-medium data-[state=active]:bg-[#6B4E3D] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-[#6B4E3D] hover:bg-[#6B4E3D]/10 transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Shipping Info
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="returns"
                className="rounded-full px-6 py-3 text-base font-medium data-[state=active]:bg-[#6B4E3D] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-[#6B4E3D] hover:bg-[#6B4E3D]/10 transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Returns
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="faq"
                className="rounded-full px-6 py-3 text-base font-medium data-[state=active]:bg-[#6B4E3D] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-white data-[state=inactive]:text-[#6B4E3D] hover:bg-[#6B4E3D]/10 transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  FAQ
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Contact Tab Content */}
            <TabsContent value="contact" className="focus-visible:outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Contact Form - Left Column */}
                <div className="lg:col-span-2">
                  <Card className="border-none shadow-sm bg-white overflow-hidden h-full">
                    <CardContent className="p-8 sm:p-10">
                      <h2 className="text-xl sm:text-2xl font-semibold text-[#6B4E3D] mb-8">
                        Send us a Message
                      </h2>

                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label
                              htmlFor="name"
                              className="text-sm font-medium text-[#6B4E3D]"
                            >
                              Full Name *
                            </Label>
                            <Input
                              id="name"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="Juan Dela Cruz"
                              className="input-beige h-12"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="email"
                              className="text-sm font-medium text-[#6B4E3D]"
                            >
                              Email Address *
                            </Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="juan@example.com"
                              className="input-beige h-12"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label
                              htmlFor="phone"
                              className="text-sm font-medium text-[#6B4E3D]"
                            >
                              Phone (Optional)
                            </Label>
                            <Input
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="+63 XXX XXX XXXX"
                              className="input-beige h-12"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="subject"
                              className="text-sm font-medium text-[#6B4E3D]"
                            >
                              Subject *
                            </Label>
                            <Input
                              id="subject"
                              name="subject"
                              value={formData.subject}
                              onChange={handleInputChange}
                              placeholder="Product Inquiry"
                              className="input-beige h-12"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="message"
                            className="text-sm font-medium text-[#6B4E3D]"
                          >
                            Message *
                          </Label>
                          <Textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleInputChange}
                            placeholder="Tell us how we can help you..."
                            className="input-beige min-h-[160px] resize-none p-4"
                          />
                        </div>

                        <Button className="w-full bg-[#6B4E3D] hover:bg-[#5a4133] text-white h-12 text-lg font-medium transition-all duration-300">
                          Send Message
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                {/* Info Cards - Right Column */}
                <div className="space-y-6">
                  {contactInfo.map((info, idx) => (
                    <Card
                      key={idx}
                      className="border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-shadow duration-300"
                    >
                      <CardContent className="p-6 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#F3F0EB] flex items-center justify-center flex-shrink-0 text-[#6B4E3D]">
                          <info.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">
                            {info.title}
                          </h3>
                          {info.details.map((detail, dIdx) => (
                            <p
                              key={dIdx}
                              className="text-sm text-muted-foreground break-all"
                            >
                              {info.isLink && dIdx === 0 ? (
                                <a
                                  href={detail}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-[#6B4E3D] hover:underline transition-colors"
                                >
                                  {detail}
                                </a>
                              ) : (
                                detail
                              )}
                            </p>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Shipping Tab */}
            <TabsContent
              value="shipping"
              className="focus-visible:outline-none"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#FDFBF7] flex items-center justify-center mb-6 text-[#6B4E3D]">
                      <Package className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-[#6B4E3D] mb-2">
                      Store Pickup
                    </h3>
                    <p className="text-[#6B4E3D] font-medium text-sm mb-4">
                      Free & Fast
                    </p>
                    <p className="text-muted-foreground mb-6">
                      Pick up your order at our showroom. This option is free
                      and typically ready within 1-2 business days.
                    </p>

                    <div className="bg-[#FDFBF7] p-5 rounded-xl space-y-4">
                      <div>
                        <p className="font-semibold flex items-center gap-2 text-sm text-[#6B4E3D] mb-1">
                          <MapPin className="w-4 h-4 text-[#6B4E3D]" /> Store
                          Location:
                        </p>
                        <p className="text-sm text-muted-foreground pl-6">
                          PoyBash Furniture
                          <br />
                          1226 A. Lorenzo St.
                          <br />
                          Tondo, Manila
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold flex items-center gap-2 text-sm text-[#6B4E3D] mb-1">
                          <Clock className="w-4 h-4 text-[#6B4E3D]" /> Hours:
                        </p>
                        <p className="text-sm text-muted-foreground pl-6">
                          Monday-Saturday, 9AM-6PM
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#FDFBF7] flex items-center justify-center mb-6 text-[#6B4E3D]">
                      <Truck className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-[#6B4E3D] mb-2">
                      Customer-Arranged Delivery
                    </h3>
                    <p className="text-[#6B4E3D] font-medium text-sm mb-4">
                      You have full control
                    </p>
                    <p className="text-muted-foreground mb-6">
                      Arrange your own delivery service for maximum flexibility.
                      Once your order is ready, we'll provide the pickup
                      address.
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="p-3 border rounded-lg text-center hover:border-[#6B4E3D] transition-colors cursor-default">
                        <span className="text-2xl block mb-1">🚗</span>
                        <span className="text-xs font-medium">Lalamove</span>
                      </div>
                      <div className="p-3 border rounded-lg text-center hover:border-[#6B4E3D] transition-colors cursor-default">
                        <span className="text-2xl block mb-1">🏍️</span>
                        <span className="text-xs font-medium">
                          Grab Express
                        </span>
                      </div>
                      <div className="p-3 border rounded-lg text-center hover:border-[#6B4E3D] transition-colors cursor-default">
                        <span className="text-2xl block mb-1">📦</span>
                        <span className="text-xs font-medium">LBC</span>
                      </div>
                      <div className="p-3 border rounded-lg text-center hover:border-[#6B4E3D] transition-colors cursor-default">
                        <span className="text-2xl block mb-1">✨</span>
                        <span className="text-xs font-medium">Any Courier</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-amber-50 text-amber-900 rounded-xl text-sm border border-amber-200">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <p>
                        We'll notify you when your items are ready for pickup by
                        your courier.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="returns" className="focus-visible:outline-none">
              <Card className="border-none shadow-sm bg-white p-8 sm:p-10">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-[#6B4E3D] mb-4">
                      Returns & Refunds
                    </h2>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      We want you to be completely satisfied with your purchase.
                      If you encounter any issues with your order, please review
                      our policy below or contact our support team.
                    </p>

                    <div className="space-y-6">
                      <div className="flex gap-4 p-4 rounded-xl bg-[#FDFBF7]">
                        <CheckCircle className="w-6 h-6 text-[#6B4E3D] flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-semibold text-[#6B4E3D] mb-1">
                            7-Day Return Policy
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            For website orders, you can request a refund through
                            your account order history within 7 days after your
                            order is marked as "Completed".
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 p-4 rounded-xl bg-[#FDFBF7]">
                        <AlertCircle className="w-6 h-6 text-[#6B4E3D] flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-semibold text-[#6B4E3D] mb-1">
                            Damaged or Defective Items
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            If your item arrives damaged, please take clear
                            photos of the defect and submit them along with your
                            refund request. For Facebook orders, please message
                            us directly with photos.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 p-4 rounded-xl bg-[#FDFBF7]">
                        <RefreshCw className="w-6 h-6 text-[#6B4E3D] flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-semibold text-[#6B4E3D] mb-1">
                            Resolution Options
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Depending on the situation, we may offer a
                            replacement part, a full replacement unit, repair
                            services, or a full refund.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-80 bg-[#FDFBF7] p-6 rounded-2xl flex-shrink-0">
                    <h3 className="font-bold text-[#6B4E3D] mb-4">
                      Quick Steps
                    </h3>
                    <ol className="space-y-4 relative border-l-2 border-[#6B4E3D]/20 ml-3">
                      <li className="pl-6 relative">
                        <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#6B4E3D]"></span>
                        <p className="font-medium text-sm text-[#6B4E3D]">
                          Log In
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Go to your account dashboard
                        </p>
                      </li>
                      <li className="pl-6 relative">
                        <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#6B4E3D]"></span>
                        <p className="font-medium text-sm text-[#6B4E3D]">
                          Select Order
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Find the order in "My Orders"
                        </p>
                      </li>
                      <li className="pl-6 relative">
                        <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#6B4E3D]"></span>
                        <p className="font-medium text-sm text-[#6B4E3D]">
                          Request Refund
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Click "Request Refund" and upload 3-5 photos
                        </p>
                      </li>
                      <li className="pl-6 relative">
                        <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#6B4E3D]"></span>
                        <p className="font-medium text-sm text-[#6B4E3D]">
                          Admin Review
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Our team reviews your request and evidence
                        </p>
                      </li>
                      <li className="pl-6 relative">
                        <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#6B4E3D]"></span>
                        <p className="font-medium text-sm text-[#6B4E3D]">
                          Get Resolution
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Receive refund or replacement within 5-7 days
                        </p>
                      </li>
                    </ol>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="faq" className="focus-visible:outline-none">
              <div className="space-y-6 max-w-3xl mx-auto">
                {faqItems.map((category, idx) => (
                  <Card
                    key={idx}
                    className="border-none shadow-sm bg-white overflow-hidden"
                  >
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold text-[#6B4E3D] mb-4 flex items-center gap-2">
                        <HelpCircle className="w-5 h-5" />
                        {category.category}
                      </h3>
                      <Accordion type="single" collapsible className="w-full">
                        {category.questions.map((q, qIdx) => (
                          <AccordionItem
                            key={qIdx}
                            value={`item-${idx}-${qIdx}`}
                            className="border-b-0"
                          >
                            <AccordionTrigger className="hover:text-[#6B4E3D] text-left text-base">
                              {q.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                              {q.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
