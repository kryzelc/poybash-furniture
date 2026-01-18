'use client';

import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Award, Heart, Users } from 'lucide-react';

export function OurStoryPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-secondary/30 border-b">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="mb-4">Our Story</h1>
            <p className="text-muted-foreground">
              From humble beginnings to becoming a trusted name in Filipino furniture craftsmanship.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Origin Story */}
          <div className="space-y-6">
            <h2>Where It All Began</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  PoyBash Furniture was founded in 2010 with a simple mission: to create beautiful, 
                  sustainable furniture that brings warmth and elegance to Filipino homes. What started 
                  as a small workshop in Lorenzo has grown into a respected furniture manufacturer 
                  with two warehouses serving customers nationwide.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Our founders, inspired by traditional Filipino craftsmanship and modern Scandinavian 
                  design, set out to bridge the gap between timeless quality and contemporary aesthetics. 
                  Every piece we create tells a story of dedication, skill, and passion for excellence.
                </p>
              </div>
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-secondary">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1633613286991-611fe299c4be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
                  alt="Furniture workshop"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="space-y-8">
            <h2>Our Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4 p-6 rounded-lg border bg-card">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3>Quality First</h3>
                <p className="text-muted-foreground">
                  We never compromise on materials or craftsmanship. Each piece undergoes rigorous 
                  quality checks before reaching your home.
                </p>
              </div>

              <div className="space-y-4 p-6 rounded-lg border bg-card">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3>Sustainable</h3>
                <p className="text-muted-foreground">
                  We source responsibly and prioritize eco-friendly materials and processes in 
                  everything we create.
                </p>
              </div>

              <div className="space-y-4 p-6 rounded-lg border bg-card">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3>Customer-Centric</h3>
                <p className="text-muted-foreground">
                  Your satisfaction drives us. We're committed to providing exceptional service 
                  and furniture that exceeds expectations.
                </p>
              </div>
            </div>
          </div>

          {/* Today */}
          <div className="space-y-6">
            <h2>PoyBash Today</h2>
            <p className="text-muted-foreground leading-relaxed">
              Today, we operate from two modern facilities in Lorenzo and Oroquieta, employing 
              over 50 skilled artisans and staff members. Our product line has expanded to include 
              a wide range of chairs and tables, each designed with the same attention to detail 
              and commitment to quality that defined our early days.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We're proud to serve thousands of satisfied customers across the Philippines, bringing 
              beautiful, functional furniture to homes, offices, and commercial spaces. As we look 
              to the future, we remain committed to our founding principles while embracing innovation 
              and sustainable practices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
