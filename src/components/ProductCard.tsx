"use client";

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

        {/* Badge for size options */}
        {hasSizeOptions && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-primary/90 backdrop-blur-sm text-white text-xs font-medium rounded-full shadow-md">
            Multiple Sizes
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-0.5">
          {category}
        </p>
        <h3 className="font-medium text-base sm:text-lg line-clamp-2 mb-1 group-hover:text-primary transition-colors leading-snug">
          {name}
        </h3>
        <p className="text-base font-semibold text-foreground">
          {hasSizeOptions && (
            <span className="text-sm font-normal text-muted-foreground">
              From{" "}
            </span>
          )}
          ₱
          {price.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>
    </div>
  );
}
