"use client";

import { Card, CardContent } from "../components/ui/card";

import { SUPABASE_URL } from "../services/storageService";

const aboutImage = `${SUPABASE_URL}/storage/v1/object/public/assets/web/about.png`;

import {
  Award,
  Users,
  Package,
  Warehouse,
  CheckCircle,
  Truck,
  CreditCard,
  Store,
  Shield,
  Sparkles,
} from "lucide-react";
export function AboutPage() {
  const values = [
    {
      icon: Award,
      title: "Quality Products",
      description:
        "Premium furniture from trusted suppliers, ensuring every piece meets our high standards.",
    },
    {
      icon: Users,
      title: "Customer First",
      description:
        "Your satisfaction is our priority with 15 dedicated staff members ready to serve you.",
    },
    {
      icon: Package,
      title: "Wide Selection",
      description:
        "Extensive range of chairs and tables with 5,000-8,000 items in stock monthly.",
    },
    {
      icon: Warehouse,
      title: "Strategic Locations",
      description:
        "Two warehouses in Lorenzo and Oroquieta for efficient service and availability.",
    },
  ];

  const services = [
    {
      icon: Truck,
      title: "Nationwide Delivery",
      description:
        "Contact us through Facebook for delivery arrangements and bulk orders throughout the Philippines.",
    },
    {
      icon: CreditCard,
      title: "Flexible Payment",
      description:
        "Choose from cash-on-delivery, GCash, or bank transfer for your convenience.",
    },
    {
      icon: Store,
      title: "Walk-in & Pick-up",
      description:
        "Visit our locations for immediate product viewing and same-day transactions.",
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

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-fade-in-left {
          animation: fadeInLeft 0.8s ease-out forwards;
        }

        .animate-fade-in-right {
          animation: fadeInRight 0.8s ease-out forwards;
        }

        .animate-scale-in {
          animation: scaleIn 0.7s ease-out forwards;
        }

        .stagger-1 {
          animation-delay: 0.15s;
        }

        .stagger-2 {
          animation-delay: 0.3s;
          }

        .stagger-3 {
          animation-delay: 0.45s;
        }

        .stagger-4 {
          animation-delay: 0.6s;
        }

        .badge-pill {
          display: inline-block;
          padding: 0.5rem 1.25rem;
          background: linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05));
          color: hsl(var(--primary));
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.025em;
          border: 1px solid hsl(var(--primary) / 0.2);
          box-shadow: 0 2px 8px hsl(var(--primary) / 0.1);
        }

        .shimmer-effect {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 3s infinite;
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>

      {/* Our Story Section */}
      <section className="py-20 sm:py-24 lg:py-32 bg-background relative overflow-hidden">
        <div className="container max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Image */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-[#6B4E3D]/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[400px] sm:h-[450px] lg:h-[550px] border border-[#6B4E3D]/10">
                <img
                  src={aboutImage}
                  alt="Quality Furniture Display"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                  Building Quality Since 2020
                </h2>
              </div>

              <div className="space-y-5 text-muted-foreground text-base sm:text-lg leading-relaxed">
                <p>
                  Established in{" "}
                  <span className="text-primary font-semibold">2020</span>,
                  PoyBash Furniture has grown from a small online venture into a
                  locally recognized provider of high-quality home and office
                  furniture. We specialize exclusively in chairs and tables,
                  offering the perfect pieces for your space.
                </p>
                <p>
                  With{" "}
                  <span className="text-primary font-semibold">
                    two strategically located warehouses
                  </span>{" "}
                  in Lorenzo and Oroquieta, we manage approximately 5,000 to
                  8,000 items in stock and sales per month, catering to both
                  residents and small businesses across the Philippines.
                </p>
                <p>
                  We source our furniture from trusted suppliers who share our
                  commitment to quality. Every piece is carefully selected to
                  ensure it meets our high standards and provides lasting value
                  to our customers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-20 sm:py-24 lg:py-32 bg-background relative">
        <div className="container max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-16">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Our Core Values
            </h2>
            <p className="text-muted-foreground text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
              Comprehensive services designed to meet your furniture needs with
              excellence and dedication
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {values.map((value, idx) => (
              <Card
                key={idx}
                className="group border border-[#6B4E3D]/10 bg-background/50 backdrop-blur-sm shadow-lg hover:shadow-2xl hover:border-[#6B4E3D]/30 transition-all duration-500 relative"
              >
                <CardContent className="flex flex-col items-center gap-5 p-8 lg:p-10 text-center h-full relative z-10">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#6B4E3D] text-white shadow-lg">
                    <value.icon className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3 text-foreground">
                      {value.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 sm:py-24 lg:py-32 bg-background relative overflow-hidden">
        <div className="container max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-16 relative z-10">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Our Services
            </h2>
            <p className="text-muted-foreground text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
              Flexible options to make your shopping experience convenient and
              hassle-free
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 max-w-6xl mx-auto">
            {services.map((service, idx) => (
              <Card
                key={idx}
                className="group border border-[#6B4E3D]/10 bg-background/50 backdrop-blur-sm shadow-lg hover:shadow-2xl hover:border-[#6B4E3D]/30 transition-all duration-500 relative"
              >
                <CardContent className="flex flex-col items-center gap-5 p-8 lg:p-10 text-center h-full relative z-10">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#6B4E3D] text-white shadow-lg">
                    <service.icon className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3 text-foreground">
                      {service.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Guarantee Section */}
      <section className="py-20 sm:py-24 lg:py-32 bg-background relative overflow-hidden">
        <div className="container max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-16 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-[#6B4E3D] text-white mb-8 shadow-2xl">
              <Shield className="w-12 h-12" />
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Quality & Satisfaction Guaranteed
            </h2>

            <p className="text-muted-foreground text-lg sm:text-xl leading-relaxed mb-10 max-w-3xl mx-auto">
              We stand behind every piece we sell. For damaged or defective
              items, you can request a refund through your order history within
              one week of receiving your order. Your satisfaction is our
              commitment.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-lg border border-[#6B4E3D]/20 hover:shadow-xl hover:scale-105 transition-all duration-500">
                <CheckCircle className="w-5 h-5 text-[#6B4E3D]" />
                <span className="text-sm font-semibold">Quality Assured</span>
              </div>
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-lg border border-[#6B4E3D]/20 hover:shadow-xl hover:scale-105 transition-all duration-500">
                <CheckCircle className="w-5 h-5 text-[#6B4E3D]" />
                <span className="text-sm font-semibold">
                  7-Day Refund Policy
                </span>
              </div>
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-lg border border-[#6B4E3D]/20 hover:shadow-xl hover:scale-105 transition-all duration-500">
                <CheckCircle className="w-5 h-5 text-[#6B4E3D]" />
                <span className="text-sm font-semibold">
                  Trusted Since 2020
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
