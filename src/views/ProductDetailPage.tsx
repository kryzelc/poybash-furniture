"use client";

import { useProductDetailViewModel } from "@/viewmodels/useProductDetailViewModel";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { ProductCard } from "../components/ProductCard";
import { getVariantStock, findVariant, products as staticProducts } from "../lib/products";
import {
  Minus,
  Plus,
  Check,
  ShoppingCart,
  Warehouse,
  MessageCircle,
  MapPin,
} from "lucide-react";
import Link from "next/link";

interface ProductDetailPageProps {
  productId: number;
}

export function ProductDetailPage({ productId }: ProductDetailPageProps) {
  // ViewModel handles all business logic
  const {
    product,
    isLoading,
    error,
    isMounted,
    selectedVariant,
    selectedSize,
    selectedColor,
    quantity,
    sizes,
    colors,
    currentPrice,
    availableStock,
    inStock,
    handleSizeChange,
    handleColorChange,
    handleQuantityChange,
    incrementQuantity,
    decrementQuantity,
    handleAddToCart,
    handleBack,
  } = useProductDetailViewModel(productId);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  // Error or not found state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2>Product not found</h2>
          <Button onClick={handleBack}>
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const isOutOfStock = !inStock;

  // Related products
  const relatedProducts = staticProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  // Color hex mapping - based on actual furniture tones
  const colorHexMap: Record<string, string> = {
    // New color names
    "Warm Sand": "#F0D29E",
    "Warm Taupe": "#9B8B7E",
    Terracotta: "#CA6F48",
    "Chestnut Brown": "#9B715A",
    "Deep Espresso": "#3A3022",
    "Brick Brown": "#9D6347",
    "Slate Green": "#4A5952",
    "Antique Olive": "#C7BA59",
    "Clay Rose": "#AE7971",
    "Cloud White": "#E2E0DE",
    "Linen Beige": "#DAD0C6",
    "Pebble Gray": "#BEBBBD",
    "Storm Gray": "#61636F",
    Black: "#1a1a1a",
    // Old color names mapped to new colors
    Beige: "#F0D29E",
    "Dark Brown": "#3A3022",
    Walnut: "#9D6347",
    "Natural Wood": "#F0D29E",
    White: "#E2E0DE",
    Grey: "#BEBBBD",
    Gray: "#BEBBBD",
    Brown: "#9B715A",
    Green: "#4A5952",
    Pink: "#AE7971",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <span>/</span>
            <Link
              href={`/products?category=${product.category}`}
              className="hover:text-foreground capitalize"
            >
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product Detail */}
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-secondary">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Product Header */}
            <div>
              {/* Category Badge - Enhanced visibility */}
              <Badge className="badge-text mb-3">
                {product.subCategory}
              </Badge>
              
              {/* Product Title - Primary focus */}
              <h1 className="product-title text-balance mb-4">{product.name}</h1>
              
              {/* Price - High visibility */}
              <p className="price-large text-primary number-display">
                ₱{currentPrice.toFixed(2)}
              </p>
            </div>

            <Separator />

            {/* Description Section */}
            <div>
              <h4 className="card-title">Description</h4>
              <div className="description-text">
                <p>{product.description}</p>
              </div>
            </div>

            <Separator />

            {/* Variant Selection - Only render on client to avoid hydration mismatch */}
            {isMounted && product.variants && product.variants.length > 0 && (
              <>
                {/* Size Selection - Only show if product has size variations */}
                {sizes.length > 0 && (
                  <div>
                    <h4 className="label-text mb-3">Size</h4>
                    <div className="flex flex-wrap gap-3">
                      {sizes.map((size) => {
                        // Check if this size has any stock in any color
                        const hasStock = product.variants?.some(
                          (v) =>
                            v.size === size &&
                            v.active &&
                            getVariantStock(v) > 0,
                        );

                        return (
                          <button
                            key={size}
                            onClick={() => {
                              if (hasStock) {
                                handleSizeChange(size);
                              }
                            }}
                            disabled={!hasStock}
                            aria-label={`Select size ${size}${!hasStock ? ' (Out of stock)' : ''}`}
                            className={`px-5 py-3 rounded-lg border-2 transition-all cta-text-small ${selectedSize === size
                              ? "border-primary bg-primary/5 font-bold"
                              : hasStock
                                ? "border-border hover:border-primary/50 hover:bg-primary/5"
                                : "border-border opacity-50 cursor-not-allowed"
                              }`}
                          >
                            {size}
                            {!hasStock && (
                              <span className="meta-text ml-1">(Out)</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Color Selection */}
                {colors.length > 0 && (
                  <div>
                    <h4 className="label-text mb-3">Color</h4>
                    <div className="flex flex-wrap gap-3">
                      {colors.map((color) => {
                        // Check if this color is available for the selected size
                        const variant = findVariant(
                          product,
                          selectedSize,
                          color,
                        );
                        const isAvailable =
                          variant &&
                          variant.active &&
                          getVariantStock(variant) > 0;

                        return (
                          <button
                            key={color}
                            onClick={() => {
                              if (isAvailable) {
                                handleColorChange(color);
                              }
                            }}
                            disabled={!isAvailable}
                            aria-label={`Select ${color} color${!isAvailable ? ' (Out of stock)' : ''}`}
                            className={`relative w-12 h-12 rounded-full border-2 transition-all ${selectedColor === color
                              ? "border-primary ring-2 ring-primary/20"
                              : isAvailable
                                ? "border-border hover:border-primary/50"
                                : "border-border opacity-50 cursor-not-allowed"
                              }`}
                            title={`${color}${!isAvailable ? " (Out of Stock)" : ""}`}
                          >
                            <div
                              className="absolute inset-1 rounded-full"
                              style={{
                                backgroundColor:
                                  colorHexMap[color] || "#cccccc",
                              }}
                            ></div>
                            {selectedColor === color && (
                              <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md z-10" />
                            )}
                            {!isAvailable && (
                              <div className="absolute inset-0 rounded-full bg-white/60 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-gray-700">
                                  OUT
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Quantity Selector */}
            <div>
              <h4 className="label-text mb-3">Quantity</h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="h-8 w-8"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value)) {
                      handleQuantityChange(value);
                    } else if (e.target.value === '') {
                      // Allow empty field while typing
                      handleQuantityChange(1);
                    }
                  }}
                  onBlur={(e) => {
                    // Ensure valid quantity on blur
                    const value = parseInt(e.target.value);
                    if (isNaN(value) || value < 1) {
                      handleQuantityChange(1);
                    } else if (value > availableStock) {
                      handleQuantityChange(availableStock);
                    }
                  }}
                  min="1"
                  max={availableStock}
                  className="number-display font-semibold w-16 text-center border border-input rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                  style={{ fontSize: '16px' }}
                  disabled={isOutOfStock}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={incrementQuantity}
                  disabled={quantity >= availableStock}
                  className="h-8 w-8"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {availableStock > 0 && (
                <p className="meta-text mt-3">
                  {availableStock} {availableStock === 1 ? "item" : "items"} available
                </p>
              )}
            </div>

            {/* Add to Cart CTA - Primary Action */}
            <div className="space-y-4 pt-2">
              <Button
                size="lg"
                className="w-full gap-3 h-14 cta-text"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                <ShoppingCart className="h-5 w-5" />
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </Button>
              {!isOutOfStock && (
                <div className="flex items-center gap-2 justify-center status-text text-green-700">
                  <Check className="h-5 w-5" />
                  In Stock - Available for Pickup
                </div>
              )}
            </div>

            <Separator />

            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Warehouse className="h-5 w-5" />
                <span>Two warehouses in Lorenzo and Oroquieta</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
                <span>Contact us via Facebook for bulk orders</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <span>Store pickup and walk-in available</span>
              </div>
            </div>

            <Separator />

            {/* Specifications */}
            <div>
              <h4 className="mb-4 font-medium">Specifications</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm">Material</p>
                  <p>{product.material}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Category</p>
                  <p className="capitalize">{product.category}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Width</p>
                  <p>{product.dimensions.width} cm</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Height</p>
                  <p>{product.dimensions.height} cm</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Depth</p>
                  <p>{product.dimensions.depth} cm</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
              {relatedProducts.map((relatedProduct) => {
                // Get the minimum price for products with variants
                const getDisplayPrice = () => {
                  if (relatedProduct.variants && relatedProduct.variants.length > 0) {
                    const activeVariants = relatedProduct.variants.filter((v) => v.active);
                    if (activeVariants.length > 0) {
                      return Math.min(...activeVariants.map((v) => v.price));
                    }
                  }
                  return relatedProduct.price;
                };

                // Check if product has size variations (not just color variations)
                const hasSizeVariations = () => {
                  if (relatedProduct.variants && relatedProduct.variants.length > 0) {
                    const activeVariants = relatedProduct.variants.filter((v) => v.active);
                    const uniqueSizes = new Set(
                      activeVariants.map((v) => v.size).filter((size) => size !== null)
                    );
                    return uniqueSizes.size > 1;
                  }
                  return false;
                };

                return (
                  <ProductCard
                    key={relatedProduct.id}
                    name={relatedProduct.name}
                    price={getDisplayPrice()}
                    imageUrl={relatedProduct.imageUrl}
                    category={relatedProduct.subCategory}
                    onClick={() => {
                      window.location.href = `/products/${relatedProduct.id}`;
                    }}
                    hasSizeOptions={hasSizeVariations()}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
