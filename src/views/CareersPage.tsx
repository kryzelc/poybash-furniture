'use client';

import { Briefcase, Heart, TrendingUp, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export function CareersPage() {
  const benefits = [
    {
      icon: Heart,
      title: 'Health & Wellness',
      description: 'Comprehensive health insurance for you and your family, plus wellness programs.'
    },
    {
      icon: TrendingUp,
      title: 'Career Growth',
      description: 'Training programs, skill development, and clear paths for advancement.'
    },
    {
      icon: Users,
      title: 'Team Culture',
      description: 'Collaborative environment where your ideas and contributions matter.'
    },
    {
      icon: Briefcase,
      title: 'Work-Life Balance',
      description: 'Flexible schedules, paid time off, and family-friendly policies.'
    }
  ];

  const openPositions = [
    {
      title: 'Senior Carpenter',
      location: 'Lorenzo Warehouse',
      type: 'Full-time',
      department: 'Production',
      description: 'Seeking experienced carpenter with expertise in furniture construction and traditional joinery techniques.'
    },
    {
      title: 'Furniture Designer',
      location: 'Lorenzo Office',
      type: 'Full-time',
      department: 'Design',
      description: 'Creative designer needed to develop new furniture lines combining modern aesthetics with functional design.'
    },
    {
      title: 'Quality Control Inspector',
      location: 'Oroquieta Warehouse',
      type: 'Full-time',
      department: 'Quality Assurance',
      description: 'Detail-oriented professional to ensure all furniture meets our high-quality standards.'
    },
    {
      title: 'Customer Service Representative',
      location: 'Remote',
      type: 'Full-time',
      department: 'Customer Support',
      description: 'Help customers with inquiries, orders, and provide exceptional service experience.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-secondary/30 border-b">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-4">Careers at PoyBash</h1>
            <p className="text-muted-foreground mb-6">
              Join our team of passionate craftspeople and professionals. Build your career 
              while helping us create beautiful, sustainable furniture.
            </p>
            <Button size="lg" onClick={() => {
              const positions = document.getElementById('open-positions');
              positions?.scrollIntoView({ behavior: 'smooth' });
            }}>
              View Open Positions
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Why Join Us */}
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="mb-4">Why Join PoyBash?</h2>
              <p className="text-muted-foreground">
                We're more than just a furniture company—we're a family committed to excellence, 
                sustainability, and supporting each other's growth.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit) => (
                <Card key={benefit.title}>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Our Culture */}
          <div className="bg-secondary/30 rounded-lg p-12">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-center">Our Culture</h2>
              <p className="text-muted-foreground leading-relaxed">
                At PoyBash, we believe that great furniture starts with great people. Our culture 
                is built on respect, collaboration, and a shared passion for craftsmanship. We 
                celebrate diversity, encourage innovation, and support each team member's 
                professional development.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Whether you're a skilled artisan, a creative designer, or a customer service 
                professional, you'll find a welcoming environment where your contributions are 
                valued and your career can flourish.
              </p>
            </div>
          </div>

          {/* Open Positions */}
          <div className="space-y-8" id="open-positions">
            <div className="text-center">
              <h2 className="mb-4">Open Positions</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explore current opportunities to join our team.
              </p>
            </div>

            <div className="space-y-6">
              {openPositions.map((position) => (
                <Card key={position.title} className="hover:border-primary transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3>{position.title}</h3>
                          <Badge variant="secondary">{position.type}</Badge>
                        </div>
                        <p className="text-muted-foreground">
                          {position.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-muted-foreground">
                          <span>📍 {position.location}</span>
                          <span>• {position.department}</span>
                        </div>
                      </div>
                      <Button>Apply Now</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {openPositions.length === 0 && (
              <div className="text-center py-12 bg-secondary/30 rounded-lg">
                <p className="text-muted-foreground">
                  No open positions at the moment. Check back soon or send us your resume 
                  at careers@poybash.com to be considered for future opportunities.
                </p>
              </div>
            )}
          </div>

          {/* Application Process */}
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="mb-4">Application Process</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our hiring process is designed to be transparent and respectful of your time.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center space-y-3 p-6 rounded-lg border bg-card">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto">
                  1
                </div>
                <h4>Apply</h4>
                <p className="text-muted-foreground">
                  Submit your application and resume
                </p>
              </div>

              <div className="text-center space-y-3 p-6 rounded-lg border bg-card">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto">
                  2
                </div>
                <h4>Review</h4>
                <p className="text-muted-foreground">
                  We'll review your qualifications
                </p>
              </div>

              <div className="text-center space-y-3 p-6 rounded-lg border bg-card">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto">
                  3
                </div>
                <h4>Interview</h4>
                <p className="text-muted-foreground">
                  Meet the team and discuss the role
                </p>
              </div>

              <div className="text-center space-y-3 p-6 rounded-lg border bg-card">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto">
                  4
                </div>
                <h4>Offer</h4>
                <p className="text-muted-foreground">
                  Receive and accept your offer
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="text-center bg-primary/5 rounded-lg p-12 space-y-4">
            <h3>Don't See the Right Position?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're always looking for talented individuals to join our team. Send your resume 
              to <strong>careers@poybash.com</strong> and tell us how you can contribute to PoyBash Furniture.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
