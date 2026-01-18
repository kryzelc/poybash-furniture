'use client';

import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Leaf, Recycle, TreePine, Droplet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export function SustainabilityPage() {
  const initiatives = [
    {
      icon: TreePine,
      title: 'Responsible Sourcing',
      description: 'We source wood from certified sustainable forests and work with suppliers who share our commitment to environmental responsibility.'
    },
    {
      icon: Recycle,
      title: 'Waste Reduction',
      description: 'Our manufacturing process maximizes material usage and recycles wood scraps into smaller products or biofuel.'
    },
    {
      icon: Droplet,
      title: 'Water-Based Finishes',
      description: 'We use eco-friendly, water-based stains and finishes that reduce harmful emissions and are safer for our workers and customers.'
    },
    {
      icon: Leaf,
      title: 'Carbon Neutral Shipping',
      description: 'We partner with logistics providers committed to reducing carbon emissions and offer consolidated shipping options.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-green-50 to-background border-b">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Leaf className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mb-4">Sustainability</h1>
            <p className="text-muted-foreground">
              Building a greener future, one piece of furniture at a time. Our commitment to 
              sustainability guides every decision we make.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Our Commitment */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2>Our Environmental Commitment</h2>
              <p className="text-muted-foreground leading-relaxed">
                At PoyBash Furniture, we believe that creating beautiful furniture shouldn't come 
                at the expense of our planet. That's why sustainability is woven into every aspect 
                of our business, from the materials we choose to how we package and ship our products.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We're continuously working to reduce our environmental footprint and are committed 
                to achieving carbon neutrality by 2030. This isn't just a goal—it's our responsibility 
                to future generations.
              </p>
            </div>
            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-secondary">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
                alt="Sustainable forest"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Initiatives */}
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="mb-4">Our Green Initiatives</h2>
              <p className="text-muted-foreground">
                We've implemented comprehensive sustainability practices across our entire operation.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {initiatives.map((initiative) => (
                <Card key={initiative.title}>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <initiative.icon className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle>{initiative.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {initiative.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Impact Stats */}
          <div className="bg-secondary/30 rounded-lg p-12">
            <div className="text-center mb-12">
              <h2 className="mb-4">Our Impact in 2024</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Measurable progress toward a more sustainable future.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-primary mb-2">85%</div>
                <p className="text-muted-foreground">
                  Of materials from sustainable sources
                </p>
              </div>
              <div className="text-center">
                <div className="text-primary mb-2">12 Tons</div>
                <p className="text-muted-foreground">
                  Wood waste recycled annually
                </p>
              </div>
              <div className="text-center">
                <div className="text-primary mb-2">40%</div>
                <p className="text-muted-foreground">
                  Reduction in water usage since 2020
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h3>Join Us in Making a Difference</h3>
            <p className="text-muted-foreground">
              When you choose PoyBash Furniture, you're not just buying quality furniture—you're 
              supporting sustainable practices and helping build a greener future. Together, we 
              can make a positive impact on our environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
