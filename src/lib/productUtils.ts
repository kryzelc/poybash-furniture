// Utility functions for product price display
import type { Product } from './products';

/**
 * Get the display price for a product
 * NEW: Checks variants first, then falls back to legacy sizeOptions
 * For products with variants/size options, returns the minimum price (starting from)
 * For regular products, returns the base price
 */
export function getDisplayPrice(product: Product): number {
  // NEW: Check variant system first
  if (product.variants && product.variants.length > 0) {
    const activeVariants = product.variants.filter(v => v.active);
    if (activeVariants.length > 0) {
      return Math.min(...activeVariants.map(v => v.price));
    }
  }
  // LEGACY: Fallback to old sizeOptions system
  if (product.sizeOptions && product.sizeOptions.length > 0) {
    return Math.min(...product.sizeOptions.map(s => s.price));
  }
  return product.price;
}

/**
 * Get the maximum price for a product with variants or size options
 * NEW: Checks variants first, then falls back to legacy sizeOptions
 * For products without variations, returns the base price
 */
export function getMaxPrice(product: Product): number {
  // NEW: Check variant system first
  if (product.variants && product.variants.length > 0) {
    const activeVariants = product.variants.filter(v => v.active);
    if (activeVariants.length > 0) {
      return Math.max(...activeVariants.map(v => v.price));
    }
  }
  // LEGACY: Fallback to old sizeOptions system
  if (product.sizeOptions && product.sizeOptions.length > 0) {
    return Math.max(...product.sizeOptions.map(s => s.price));
  }
  return product.price;
}

/**
 * Format price for display with proper currency symbol
 */
export function formatPrice(price: number): string {
  return `₱${price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Get price range text for products with variants or size options
 * NEW: Checks variants first, then falls back to legacy sizeOptions
 * Returns "₱X" showing the minimum price consistently
 */
export function getPriceRangeText(product: Product): string {
  // NEW: Check variant system first
  if (product.variants && product.variants.length > 0) {
    const activeVariants = product.variants.filter(v => v.active);
    if (activeVariants.length > 0) {
      const minPrice = Math.min(...activeVariants.map(v => v.price));
      return formatPrice(minPrice);
    }
  }
  // LEGACY: Fallback to old sizeOptions system
  if (product.sizeOptions && product.sizeOptions.length > 0) {
    const minPrice = getDisplayPrice(product);
    return formatPrice(minPrice);
  }
  return formatPrice(product.price);
}

/**
 * Check if product has variations (variants or size options)
 * NEW: Checks both variant system and legacy sizeOptions
 */
export function hasSizeOptions(product: Product): boolean {
  // Check new variant system
  if (product.variants && product.variants.length > 0) {
    return true;
  }
  // Check legacy sizeOptions system
  return !!(product.sizeOptions && product.sizeOptions.length > 0);
}

/**
 * Check if product has multiple price points
 * NEW: Determines if "From" prefix should be shown
 */
export function hasMultiplePrices(product: Product): boolean {
  // Check variant system
  if (product.variants && product.variants.length > 0) {
    const activeVariants = product.variants.filter(v => v.active);
    if (activeVariants.length > 1) {
      const prices = activeVariants.map(v => v.price);
      return Math.min(...prices) !== Math.max(...prices);
    }
  }
  // Check legacy sizeOptions system
  if (product.sizeOptions && product.sizeOptions.length > 0) {
    const prices = product.sizeOptions.map(s => s.price);
    return Math.min(...prices) !== Math.max(...prices);
  }
  return false;
}