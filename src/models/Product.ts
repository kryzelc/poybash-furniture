/**
 * Product Domain Models
 *
 * Pure data structures with no business logic.
 * These represent the Product domain entities.
 */

import { InventoryBatch, WarehouseStock } from "./Inventory";

export type ProductCategory = "chairs" | "tables";

export interface ProductDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface ProductVariant {
  id: string;
  size: string | null;
  color: string;
  sku?: string;
  price: number;
  dimensions: ProductDimensions;
  warehouseStock: WarehouseStock[];
  active: boolean;
}

// Legacy type for backward compatibility
export interface SizeOption {
  label: string;
  price: number;
  dimensions: ProductDimensions;
  warehouseStock: WarehouseStock[];
}

export interface Product {
  id: number;
  name: string;
  price: number; // Base/display price
  description: string;
  category: ProductCategory;
  subCategory: string;
  imageUrl: string;
  images: string[];
  material: string;
  dimensions: ProductDimensions;
  variants: ProductVariant[];
  inStock: boolean;
  featured: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  
  // DEPRECATED - Kept for backward compatibility during migration
  sizeOptions?: SizeOption[]; // Legacy size system for tables
  warehouseStock?: WarehouseStock[]; // Legacy stock system
  colors?: string[]; // Legacy color array
}

/**
 * Type guard to check if a product has variants
 */
export function hasVariants(product: Product): boolean {
  return product.variants && product.variants.length > 0;
}

/**
 * Get the price range for a product with variants
 */
export function getPriceRange(product: Product): { min: number; max: number } {
  if (!hasVariants(product)) {
    return { min: product.price, max: product.price };
  }

  const prices = product.variants.filter((v) => v.active).map((v) => v.price);

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

/**
 * Check if any variant is in stock
 */
export function isProductInStock(product: Product): boolean {
  if (!hasVariants(product)) {
    return product.inStock;
  }

  return product.variants.some((variant) =>
    variant.warehouseStock.some((stock) => stock.quantity - stock.reserved > 0),
  );
}
