"use client";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface HeroProps {
  imageUrl: string;
}

export function Hero({ imageUrl }: HeroProps) {
  return (
    <section className="relative h-[500px] sm:h-[600px] lg:h-[650px] xl:h-[700px] overflow-hidden bg-secondary">
      <div className="absolute inset-0">
        <img
          src={imageUrl}
          alt="Hero background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20" />
      </div>

      <div className="container max-w-[1920px] relative mx-auto px-4 sm:px-6 lg:px-16 h-full">
        <div className="flex items-center h-full">
          <div className="max-w-xl sm:max-w-2xl space-y-5 sm:space-y-6 lg:space-y-7">
            <h1 className="text-white tracking-tight text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
              Heritage Collection
            </h1>

            <p className="text-white/90 text-base sm:text-lg lg:text-xl max-w-lg leading-relaxed">
              Discover our Heritage Collection featuring expertly crafted solid
              wood furniture. Timeless pieces that blend traditional
              craftsmanship with modern living.
            </p>

            <div className="pt-2">
              <Button
                size="lg"
                variant="outline"
                className="px-10 py-6 text-base font-semibold bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:text-white shadow-lg hover:shadow-xl transition-all"
                asChild
              >
                <Link href="/products">Shop Collection</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
