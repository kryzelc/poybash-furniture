"use client";

import { Maximize2 } from "lucide-react";

interface ProductCardProps {
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  onClick?: () => void;
  hasSizeOptions?: boolean;
}

export function ProductCard({
  name,
  price,
  imageUrl,
  category,
  onClick,
  hasSizeOptions,
}: ProductCardProps) {
  return (
    <div
      className="group cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-transparent hover:border-primary/10"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
        />

        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Size options icon */}
        {hasSizeOptions && (
          <div className="absolute top-3 left-3 p-2 bg-primary/90 backdrop-blur-sm text-white rounded-full shadow-md" title="Multiple sizes available">
            <Maximize2 className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5">
        {/* Category Label - Enhanced visibility */}
        <p className="category-label text-muted-foreground mb-2">
          {category}
        </p>
        
        {/* Product Title - Optimized for scanning */}
        <h3 className="product-title-card mb-3 group-hover:text-primary transition-colors">
          {name}
        </h3>
        
        {/* Price - High visibility with proper hierarchy */}
        <div className="flex items-baseline gap-2">
          {hasSizeOptions && (
            <span className="meta-text">
              From
            </span>
          )}
          <p className="price-small number-display text-foreground">
            ₱{price.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
