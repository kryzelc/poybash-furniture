'use client';

import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Card, CardContent } from '../components/ui/card';
import { Award, Users, Package, Warehouse, CheckCircle, Clock, Shield } from 'lucide-react';

export function AboutPage() {
  const values = [
    {
      icon: Award,
      title: 'Quality Products',
      description: 'Premium furniture from trusted suppliers, ensuring every piece meets our high standards.',
    },
    {
      icon: Users,
      title: 'Customer First',
      description: 'Your satisfaction is our priority with 15 dedicated staff members ready to serve you.',
    },
    {
      icon: Package,
      title: 'Wide Selection',
      description: 'Extensive range of chairs and tables with 5,000-8,000 items in stock monthly.',
    },
    {
      icon: Warehouse,
      title: 'Strategic Locations',
      description: 'Two warehouses in Lorenzo and Oroquieta for efficient service and availability.',
    },
  ];

  const services = [
    {
      icon: CheckCircle,
      title: 'Nationwide Delivery',
      description: 'Contact us through Facebook for delivery arrangements and bulk orders throughout the Philippines.',
    },
    {
      icon: Clock,
      title: 'Flexible Payment',
      description: 'Choose from cash-on-delivery, GCash, or bank transfer for your convenience.',
    },
    {
      icon: Shield,
      title: 'Walk-in & Pick-up',
      description: 'Visit our locations for immediate product viewing and same-day transactions.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[500px] lg:h-[600px] overflow-hidden bg-[#5D4037]">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1687180498602-5a1046defaa4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXJuaXR1cmUlMjBzaG93cm9vbXxlbnwxfHx8fDE3NjIxNDkzOTd8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="About PoyBash Furniture"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#5D4037]/50 via-[#5D4037]/70 to-[#5D4037]" />
        <div className="absolute inset-0 flex items-center">
          <div className="container max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-16">
            <div className="max-w-3xl">
              <h1 className="text-[#FDFBF7] mb-6">About PoyBash Furniture</h1>
              <p className="text-xl lg:text-2xl text-[#D7CCC8] leading-relaxed">
                Your trusted provider of quality chairs and tables since 2020. 
                Serving homes and businesses with excellence across the Philippines.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="container max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-16 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl overflow-hidden shadow-xl h-[400px] lg:h-[500px]">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1729825128048-1dfac0ecb164?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b29kZW4lMjBmdXJuaXR1cmUlMjBkaXNwbGF5fGVufDF8fHx8MTc2MjQzMzI3MXww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Quality Furniture"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="inline-block px-4 py-2 bg-[#5D4037]/10 rounded-full mb-4">
              <span className="text-[#5D4037]">Our Story</span>
            </div>
            <h2 className="mb-6 text-[#5D4037]">Building Quality Since 2020</h2>
            <div className="space-y-6 text-[#795548] text-lg leading-relaxed">
              <p>
                Established in 2020, PoyBash Furniture has grown from a small online venture 
                into a locally recognized provider of high-quality home and office furniture. 
                We specialize exclusively in chairs and tables, offering the perfect pieces 
                for your space.
              </p>
              <p>
                With two strategically located warehouses in Lorenzo and Oroquieta, we manage 
                approximately 5,000 to 8,000 items in stock and sales per month, catering to 
                both residents and small businesses across the Philippines.
              </p>
              <p>
                We source our furniture from trusted suppliers who share our commitment to 
                quality. Every piece is carefully selected to ensure it meets our high 
                standards and provides lasting value to our customers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-[#EFEBE9] py-16 lg:py-24">
        <div className="container max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-16">
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-block px-4 py-2 bg-[#5D4037]/10 rounded-full mb-4">
              <span className="text-[#5D4037]">What Sets Us Apart</span>
            </div>
            <h2 className="text-[#5D4037] mb-4">Our Core Values</h2>
            <p className="text-[#795548] text-lg max-w-2xl mx-auto">
              Comprehensive services designed to meet your furniture needs with excellence
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
                  <CardContent className="pt-8 pb-8">
                    <div className="w-16 h-16 rounded-2xl bg-[#5D4037] flex items-center justify-center mb-6">
                      <Icon className="h-8 w-8 text-[#FDFBF7]" />
                    </div>
                    <h3 className="mb-3 text-[#5D4037]">{value.title}</h3>
                    <p className="text-[#795548] leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="container max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-16 py-16 lg:py-24">
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-block px-4 py-2 bg-[#5D4037]/10 rounded-full mb-4">
            <span className="text-[#5D4037]">How We Serve You</span>
          </div>
          <h2 className="text-[#5D4037] mb-4">Our Services</h2>
          <p className="text-[#795548] text-lg max-w-2xl mx-auto">
            Flexible options to make your shopping experience convenient and hassle-free
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card key={index} className="border-2 border-[#D7CCC8] hover:border-[#5D4037] transition-colors duration-300 bg-white">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#5D4037]/10 flex items-center justify-center mb-6 mx-auto">
                    <Icon className="h-8 w-8 text-[#5D4037]" />
                  </div>
                  <h3 className="mb-3 text-[#5D4037]">{service.title}</h3>
                  <p className="text-[#795548] leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-[#5D4037] py-16 lg:py-20">
        <div className="container max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="text-center">
              <div className="text-5xl lg:text-6xl text-[#FDFBF7] mb-3">2020</div>
              <p className="text-[#D7CCC8] text-lg">Established</p>
            </div>
            <div className="text-center">
              <div className="text-5xl lg:text-6xl text-[#FDFBF7] mb-3">5K-8K</div>
              <p className="text-[#D7CCC8] text-lg">Monthly Stock/Sales</p>
            </div>
            <div className="text-center">
              <div className="text-5xl lg:text-6xl text-[#FDFBF7] mb-3">2</div>
              <p className="text-[#D7CCC8] text-lg">Warehouse Locations</p>
            </div>
            <div className="text-center">
              <div className="text-5xl lg:text-6xl text-[#FDFBF7] mb-3">15</div>
              <p className="text-[#D7CCC8] text-lg">Dedicated Staff</p>
            </div>
          </div>
        </div>
      </div>

      {/* Commitment Section */}
      <div className="bg-gradient-to-br from-[#EFEBE9] to-[#D7CCC8] py-16 lg:py-24">
        <div className="container max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-[#5D4037] flex items-center justify-center mb-8 mx-auto">
              <Shield className="h-10 w-10 text-[#FDFBF7]" />
            </div>
            <h2 className="text-[#5D4037] mb-6">Quality & Satisfaction Guaranteed</h2>
            <p className="text-[#795548] text-lg lg:text-xl leading-relaxed mb-8">
              We stand behind every piece we sell. For damaged or defective items, 
              you can request a refund through your order history within one week of receiving your order. 
              Your satisfaction is our commitment.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-full">
                <CheckCircle className="h-5 w-5 text-[#5D4037]" />
                <span className="text-[#5D4037]">Quality Assured</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-full">
                <CheckCircle className="h-5 w-5 text-[#5D4037]" />
                <span className="text-[#5D4037]">7-Day Refund Policy</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-full">
                <CheckCircle className="h-5 w-5 text-[#5D4037]" />
                <span className="text-[#5D4037]">Trusted Since 2020</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}