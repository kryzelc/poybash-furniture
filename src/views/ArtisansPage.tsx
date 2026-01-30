"use client";
import { Hammer, Heart, Award } from "lucide-react";

export function ArtisansPage() {
  const artisans = [
    {
      name: "Ricardo Santos",
      role: "Master Carpenter",
      experience: "25 years",
      specialty: "Traditional joinery and wood finishing",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    },
    {
      name: "Maria Cruz",
      role: "Upholstery Specialist",
      experience: "18 years",
      specialty: "Fabric selection and chair upholstery",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    },
    {
      name: "Jose Reyes",
      role: "Design Lead",
      experience: "15 years",
      specialty: "Modern furniture design and prototyping",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    },
    {
      name: "Ana Dela Cruz",
      role: "Quality Control Manager",
      experience: "20 years",
      specialty: "Craftsmanship standards and finishing",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-secondary/30 border-b">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Hammer className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-4">Our Artisans</h1>
            <p className="text-muted-foreground">
              Meet the skilled craftspeople who bring our furniture to life.
              Their expertise, dedication, and passion for excellence are the
              heart of PoyBash Furniture.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Craftsmanship Story */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-secondary">
              <img
                src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
                alt="Artisan at work"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-6">
              <h2>The Art of Furniture Making</h2>
              <p className="text-muted-foreground leading-relaxed">
                Each piece of PoyBash furniture is crafted by skilled artisans
                who have dedicated years to mastering their craft. Our team
                combines traditional woodworking techniques passed down through
                generations with modern design sensibilities.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                From selecting the perfect wood grain to applying the final
                finish, every step is executed with precision and care. Our
                artisans don't just build furniture—they create heirlooms that
                will be treasured for years to come.
              </p>
            </div>
          </div>

          {/* What Sets Us Apart */}
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="mb-4">What Sets Our Artisans Apart</h2>
              <p className="text-muted-foreground">
                Our craftspeople bring unique skills and unwavering dedication
                to every project.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4 p-6 rounded-lg border bg-card">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3>Expertise</h3>
                <p className="text-muted-foreground">
                  Average of 18+ years experience in furniture craftsmanship
                </p>
              </div>

              <div className="text-center space-y-4 p-6 rounded-lg border bg-card">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3>Passion</h3>
                <p className="text-muted-foreground">
                  Genuine love for the craft drives exceptional attention to
                  detail
                </p>
              </div>

              <div className="text-center space-y-4 p-6 rounded-lg border bg-card">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Hammer className="h-6 w-6 text-primary" />
                </div>
                <h3>Skill</h3>
                <p className="text-muted-foreground">
                  Continuous training in both traditional and modern techniques
                </p>
              </div>
            </div>
          </div>

          {/* Featured Artisans */}
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="mb-4">Featured Artisans</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Meet some of the talented individuals who make PoyBash Furniture
                exceptional.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {artisans.map((artisan) => (
                <div
                  key={artisan.name}
                  className="flex gap-6 p-6 rounded-lg border bg-card"
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                    <img
                      src={artisan.image}
                      alt={artisan.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3>{artisan.name}</h3>
                    <p className="text-primary">{artisan.role}</p>
                    <p className="text-muted-foreground">
                      <strong>Experience:</strong> {artisan.experience}
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Specialty:</strong> {artisan.specialty}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="bg-secondary/30 rounded-lg p-12 text-center max-w-3xl mx-auto">
            <blockquote className="space-y-4">
              <p className="text-muted-foreground italic leading-relaxed">
                "Every piece we create carries a part of us. When customers
                bring our furniture into their homes, they're not just getting a
                chair or table—they're getting craftsmanship, care, and a
                commitment to quality that you can feel in every detail."
              </p>
              <footer className="pt-4 border-t">
                <p>
                  <strong>Ricardo Santos</strong>
                </p>
                <p className="text-muted-foreground">
                  Master Carpenter, PoyBash Furniture
                </p>
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}
