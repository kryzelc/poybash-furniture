// Use centralized storage service instead of duplicating
import { getStorageImageUrl } from '../services/storageService';

const getStorageUrl = (
  folder: "chairs" | "tables",
  fileName: string,
): string => {
  return getStorageImageUrl(`assets/${folder}/${fileName}`);
};

// Product image paths (from Supabase storage bucket)
const shelliChair = getStorageUrl("chairs", "shelli-chair.png");
const sashaChair = getStorageUrl("chairs", "sasha-chair.png");
const shaylaChair = getStorageUrl("chairs", "shayla-chair.png");
const sherleeChair = getStorageUrl("chairs", "sherlee-chair.png");
const samiraChair = getStorageUrl("chairs", "samira-chair.png");
const samiChair = getStorageUrl("chairs", "sami-chair.png");
const sadeChair = getStorageUrl("chairs", "sade-chair.png");
const sadahChair = getStorageUrl("chairs", "sadah-chair.png");
const sedraChair = getStorageUrl("chairs", "sedra-chair.png");
const sarahChair = getStorageUrl("chairs", "sarah-chair.png");
const sageChair = getStorageUrl("chairs", "sage-chair.png");
const secoyaChair = getStorageUrl("chairs", "secoya-chair.png");
const sammyChair = getStorageUrl("chairs", "sammy-chair.png");
const sarinaChair = getStorageUrl("chairs", "sarina-chair.png");
const sallyStool = getStorageUrl("chairs", "sally-chair.png");
const sebBench = getStorageUrl("chairs", "seb-bench-chair.png");
const scarletHighChair = getStorageUrl("chairs", "scarlet-high-chair.png");
const scarlaHighChair = getStorageUrl("chairs", "scarla-high-chair.png");
const scottHighChair = getStorageUrl("chairs", "scott-high-chair.png");
const stellaSquareTable = getStorageUrl("tables", "stella-square-table.png");
const stellaRoundTable = getStorageUrl("tables", "stella-round-table.png");
const stellaRectangularTable = getStorageUrl(
  "tables",
  "stella-rectangular-table.png",
);
const serahHighTable = getStorageUrl("tables", "serah-high-table.png");
const senoHighTable = getStorageUrl("tables", "seno-high-table.png");
const senaHighTable = getStorageUrl("tables", "sena-high-table.png");

export interface WarehouseStock {
  warehouse: "Lorenzo" | "Oroquieta";
  quantity: number;
  reserved: number; // Stock reserved for pending orders
  batches?: InventoryBatch[]; // FIFO batch tracking
}

// Batch tracking for FIFO inventory management
export interface InventoryBatch {
  batchId: string; // Unique batch identifier (e.g., "BATCH-20241209-001")
  receivedAt: string; // ISO timestamp when batch was received
  quantity: number; // Total quantity in this batch
  reserved: number; // Quantity reserved from this batch
  available: number; // Computed: quantity - reserved
  notes?: string; // Optional notes about the batch (supplier, PO number, etc.)
}

export interface SizeOption {
  label: string;
  price: number; // Price for this specific size
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  warehouseStock: WarehouseStock[]; // Stock tracked per size per warehouse
}

// New Variant System - Industry Standard
export interface ProductVariant {
  id: string; // e.g., "one-size-beige", "small-walnut", "large-white"
  size: string | null; // null = one-size product (e.g., chairs with only color variations)
  color: string;
  sku?: string; // Optional SKU for inventory tracking
  price: number; // Price can vary by variant (e.g., premium finishes cost more)
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  warehouseStock: WarehouseStock[]; // Stock tracked per variant per warehouse
  active: boolean; // Can disable specific variants without deleting
}

export interface Product {
  id: number;
  name: string;
  price: number; // Base price (for display, actual price comes from variants)
  description: string;
  category: "chairs" | "tables";
  subCategory: string;
  imageUrl: string; // Main image
  images: string[]; // All product images
  material: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };

  // NEW VARIANT SYSTEM
  variants?: ProductVariant[]; // All size-color combinations with individual stock

  // DEPRECATED - Kept for backward compatibility and migration
  sizeOptions?: SizeOption[]; // Available size options for tables (with per-size stock)
  warehouseStock?: WarehouseStock[]; // For products without size options (chairs)
  colors?: string[]; // Old color array without stock tracking

  inStock: boolean;
  featured: boolean;
  active: boolean; // For soft delete
}

const defaultProducts: Product[] = [
  // DINING CHAIRS (14 items)
  {
    id: 1,
    name: "Shelli Chair",
    price: 950.0,
    description:
      "Elegant solid wood dining chair with armrests. Perfect for extended dining comfort with its supportive armrests and smooth finish. Part of the Heritage Collection.",
    category: "chairs",
    subCategory: "Dining Chairs",
    imageUrl: shelliChair,
    images: [shelliChair],
    material: "Solid Wood",
    dimensions: { width: 55, height: 88, depth: 58 },
    variants: [
      {
        id: "one-size-warm-sand",
        size: null,
        color: "Warm Sand",
        price: 950.0,
        dimensions: { width: 55, height: 88, depth: 58 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 8, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 7, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-deep-espresso",
        size: null,
        color: "Deep Espresso",
        price: 950.0,
        dimensions: { width: 55, height: 88, depth: 58 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 8, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 6, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-terracotta",
        size: null,
        color: "Terracotta",
        price: 950.0,
        dimensions: { width: 55, height: 88, depth: 58 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 7, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 6, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-black",
        size: null,
        color: "Black",
        price: 950.0,
        dimensions: { width: 55, height: 88, depth: 58 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 7, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 6, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: true,
    colors: ["Warm Sand", "Deep Espresso", "Terracotta", "Black"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 30, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 25, reserved: 0 },
    ],
    active: true,
  },
  {
    id: 2,
    name: "Sasha Chair",
    price: 750.0,
    description:
      "Classic solid wood dining chair with clean lines. A timeless design that complements any dining space with its simple yet sophisticated profile. Heritage Collection.",
    category: "chairs",
    subCategory: "Dining Chairs",
    imageUrl: sashaChair,
    images: [sashaChair],
    material: "Solid Wood",
    dimensions: { width: 45, height: 85, depth: 50 },
    variants: [
      {
        id: "one-size-warm-sand",
        size: null,
        color: "Warm Sand",
        price: 750.0,
        dimensions: { width: 45, height: 85, depth: 50 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 14, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 12, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-deep-espresso",
        size: null,
        color: "Deep Espresso",
        price: 750.0,
        dimensions: { width: 45, height: 85, depth: 50 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 13, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 12, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-brick-brown",
        size: null,
        color: "Brick Brown",
        price: 750.0,
        dimensions: { width: 45, height: 85, depth: 50 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 13, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 11, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: true,
    colors: ["Warm Sand", "Deep Espresso", "Brick Brown"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 40, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 35, reserved: 0 },
    ],
    active: true,
  },
  {
    id: 3,
    name: "Shayla Chair",
    price: 850.0,
    description:
      "Solid wood chair with comfortable cushioned seat. Combines the durability of wood construction with the comfort of upholstered seating. Heritage Collection.",
    category: "chairs",
    subCategory: "Dining Chairs",
    imageUrl: shaylaChair,
    images: [shaylaChair],
    material: "Solid Wood & Fabric",
    dimensions: { width: 46, height: 87, depth: 52 },
    variants: [
      {
        id: "one-size-warm-sand",
        size: null,
        color: "Warm Sand",
        price: 850.0,
        dimensions: { width: 46, height: 87, depth: 52 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 14, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 11, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-deep-espresso",
        size: null,
        color: "Deep Espresso",
        price: 850.0,
        dimensions: { width: 46, height: 87, depth: 52 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 14, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 11, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: true,
    colors: ["Warm Sand", "Deep Espresso"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 28, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 22, reserved: 0 },
    ],
    active: true,
  },
  {
    id: 4,
    name: "Sherilee Chair",
    price: 920.0,
    description:
      "Stunning solid wood chair with woven cane back and seat. Features traditional craftsmanship with natural woven details for a breezy, tropical aesthetic. Heritage Collection.",
    category: "chairs",
    subCategory: "Dining Chairs",
    imageUrl: sherleeChair,
    images: [sherleeChair],
    material: "Solid Wood & Woven Cane",
    dimensions: { width: 48, height: 89, depth: 54 },
    variants: [
      {
        id: "one-size-warm-sand",
        size: null,
        color: "Warm Sand",
        price: 920.0,
        dimensions: { width: 48, height: 89, depth: 54 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 8, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 6, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-deep-espresso",
        size: null,
        color: "Deep Espresso",
        price: 920.0,
        dimensions: { width: 48, height: 89, depth: 54 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 7, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 6, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-brick-brown",
        size: null,
        color: "Brick Brown",
        price: 920.0,
        dimensions: { width: 48, height: 89, depth: 54 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 7, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 6, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: true,
    colors: ["Warm Sand", "Deep Espresso", "Brick Brown"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 22, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 18, reserved: 0 },
    ],
    active: true,
  },
  {
    id: 5,
    name: "Samira Chair",
    price: 820.0,
    description:
      "Refined solid wood chair with padded cushioned seat. Offers excellent support and comfort for everyday dining with elegant proportions. Heritage Collection.",
    category: "chairs",
    subCategory: "Dining Chairs",
    imageUrl: samiraChair,
    images: [samiraChair],
    material: "Solid Wood & Fabric",
    dimensions: { width: 47, height: 86, depth: 51 },
    variants: [
      {
        id: "one-size-warm-sand",
        size: null,
        color: "Warm Sand",
        price: 820.0,
        dimensions: { width: 47, height: 86, depth: 51 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 12, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 10, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-deep-espresso",
        size: null,
        color: "Deep Espresso",
        price: 820.0,
        dimensions: { width: 47, height: 86, depth: 51 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 12, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 10, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: false,
    colors: ["Warm Sand", "Deep Espresso"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 26, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 20, reserved: 0 },
    ],
    active: true,
  },
  {
    id: 6,
    name: "Sami Chair",
    price: 680.0,
    description:
      "Pure solid wood construction chair with minimalist design. Showcases the natural beauty of wood grain with its simple, sturdy construction. Heritage Collection.",
    category: "chairs",
    subCategory: "Dining Chairs",
    imageUrl: samiChair,
    images: [samiChair],
    material: "Solid Wood",
    dimensions: { width: 44, height: 84, depth: 49 },
    variants: [
      {
        id: "one-size-warm-sand",
        size: null,
        color: "Warm Sand",
        price: 680.0,
        dimensions: { width: 44, height: 84, depth: 49 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 18, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 15, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-deep-espresso",
        size: null,
        color: "Deep Espresso",
        price: 680.0,
        dimensions: { width: 44, height: 84, depth: 49 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 17, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 15, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: false,
    colors: ["Warm Sand", "Deep Espresso"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 35, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 30, reserved: 0 },
    ],
    active: true,
  },
  {
    id: 7,
    name: "Sade Chair",
    price: 790.0,
    description:
      "Modern solid wood dining chair with cushioned seat. Features contemporary styling with comfortable seating perfect for modern homes. Heritage Collection.",
    category: "chairs",
    subCategory: "Dining Chairs",
    imageUrl: sadeChair,
    images: [sadeChair],
    material: "Solid Wood & Fabric",
    dimensions: { width: 46, height: 88, depth: 52 },
    variants: [
      {
        id: "one-size-warm-sand",
        size: null,
        color: "Warm Sand",
        price: 790.0,
        dimensions: { width: 46, height: 88, depth: 52 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 12, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 10, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-deep-espresso",
        size: null,
        color: "Deep Espresso",
        price: 790.0,
        dimensions: { width: 46, height: 88, depth: 52 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 12, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 9, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: false,
    colors: ["Warm Sand", "Deep Espresso"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 24, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 19, reserved: 0 },
    ],
    active: true,
  },
  {
    id: 8,
    name: "Sadah Chair",
    price: 880.0,
    description:
      "Solid wood chair with fully upholstered cushioned seat. Premium comfort with thick padding for extended dining sessions. Heritage Collection.",
    category: "chairs",
    subCategory: "Dining Chairs",
    imageUrl: sadahChair,
    images: [sadahChair],
    material: "Solid Wood & Fabric",
    dimensions: { width: 48, height: 87, depth: 53 },
    variants: [
      {
        id: "one-size-warm-sand",
        size: null,
        color: "Warm Sand",
        price: 880.0,
        dimensions: { width: 48, height: 87, depth: 53 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 10, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 8, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-deep-espresso",
        size: null,
        color: "Deep Espresso",
        price: 880.0,
        dimensions: { width: 48, height: 87, depth: 53 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 10, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 8, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: false,
    colors: ["Warm Sand", "Deep Espresso"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 20, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 16, reserved: 0 },
    ],
    active: true,
  },
  {
    id: 9,
    name: "Sedra Chair",
    price: 840.0,
    description:
      "Classic solid wood Windsor-style chair with spindle back. Traditional craftsmanship meets timeless design in this elegant dining chair. Heritage Collection.",
    category: "chairs",
    subCategory: "Dining Chairs",
    imageUrl: sedraChair,
    images: [sedraChair],
    material: "Solid Wood",
    dimensions: { width: 46, height: 92, depth: 51 },
    variants: [
      {
        id: "one-size-warm-sand",
        size: null,
        color: "Warm Sand",
        price: 840.0,
        dimensions: { width: 46, height: 92, depth: 51 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 9, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 7, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-deep-espresso",
        size: null,
        color: "Deep Espresso",
        price: 840.0,
        dimensions: { width: 46, height: 92, depth: 51 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 9, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 7, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: false,
    colors: ["Warm Sand", "Deep Espresso"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 18, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 14, reserved: 0 },
    ],
    active: true,
  },
  {
    id: 10,
    name: "Sarah Chair",
    price: 720.0,
    description:
      "Simple solid wood dining chair with soft cushioned seat. Clean, straightforward design that works with any dining table style. Heritage Collection.",
    category: "chairs",
    subCategory: "Dining Chairs",
    imageUrl: sarahChair,
    images: [sarahChair],
    material: "Solid Wood & Fabric",
    dimensions: { width: 45, height: 85, depth: 50 },
    variants: [
      {
        id: "one-size-warm-sand",
        size: null,
        color: "Warm Sand",
        price: 720.0,
        dimensions: { width: 45, height: 85, depth: 50 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 16, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 14, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-deep-espresso",
        size: null,
        color: "Deep Espresso",
        price: 720.0,
        dimensions: { width: 45, height: 85, depth: 50 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 16, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 14, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: false,
    colors: ["Warm Sand", "Deep Espresso"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 32, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 28, reserved: 0 },
    ],
    active: true,
  },
  {
    id: 11,
    name: "Sage Chair",
    price: 810.0,
    description:
      "Solid wood chair with black cushioned seat and distinctive T-shaped back. Modern design with excellent back support. Heritage Collection.",
    category: "chairs",
    subCategory: "Dining Chairs",
    imageUrl: sageChair,
    images: [sageChair],
    material: "Solid Wood & Fabric",
    dimensions: { width: 47, height: 89, depth: 52 },
    variants: [
      {
        id: "one-size-warm-sand",
        size: null,
        color: "Warm Sand",
        price: 810.0,
        dimensions: { width: 47, height: 89, depth: 52 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 11, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 9, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-deep-espresso",
        size: null,
        color: "Deep Espresso",
        price: 810.0,
        dimensions: { width: 47, height: 89, depth: 52 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 10, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 8, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: false,
    colors: ["Warm Sand", "Deep Espresso"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 21, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 17, reserved: 0 },
    ],
    active: true,
  },
  {
    id: 12,
    name: "Secoya Chair",
    price: 950.0,
    description:
      "Premium solid wood chair with armrests and upholstered back and seat. Maximum comfort with full upholstery and supportive armrests. Heritage Collection.",
    category: "chairs",
    subCategory: "Dining Chairs",
    imageUrl: secoyaChair,
    images: [secoyaChair],
    material: "Solid Wood & Fabric",
    dimensions: { width: 56, height: 90, depth: 58 },
    variants: [
      {
        id: "one-size-warm-sand",
        size: null,
        color: "Warm Sand",
        price: 950.0,
        dimensions: { width: 56, height: 90, depth: 58 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 8, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 6, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-deep-espresso",
        size: null,
        color: "Deep Espresso",
        price: 950.0,
        dimensions: { width: 56, height: 90, depth: 58 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 8, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 6, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: false,
    colors: ["Warm Sand", "Deep Espresso"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 16, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 12, reserved: 0 },
    ],
    active: true,
  },
  {
    id: 13,
    name: "Sammy Chair",
    price: 890.0,
    description:
      "Solid wood chair with cushioned back and seat in multiple color options. Versatile design available in various upholstery colors. Heritage Collection.",
    category: "chairs",
    subCategory: "Dining Chairs",
    imageUrl: sammyChair,
    images: [sammyChair],
    material: "Solid Wood & Fabric",
    dimensions: { width: 48, height: 88, depth: 53 },
    variants: [
      {
        id: "one-size-cloud-white",
        size: null,
        color: "Cloud White",
        price: 890.0,
        dimensions: { width: 48, height: 88, depth: 53 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 13, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 10, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-clay-rose",
        size: null,
        color: "Clay Rose",
        price: 890.0,
        dimensions: { width: 48, height: 88, depth: 53 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 12, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 10, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: false,
    colors: ["Cloud White", "Clay Rose"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 25, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 20, reserved: 0 },
    ],
    active: true,
  },
  {
    id: 14,
    name: "Sarina Chair",
    price: 800.0,
    description:
      "Solid wood chair with T-shaped curved back and cushioned seat. Ergonomic curved back design for superior comfort. Heritage Collection.",
    category: "chairs",
    subCategory: "Dining Chairs",
    imageUrl: sarinaChair,
    images: [sarinaChair],
    material: "Solid Wood & Fabric",
    dimensions: { width: 46, height: 87, depth: 51 },
    variants: [
      {
        id: "one-size-warm-sand",
        size: null,
        color: "Warm Sand",
        price: 800.0,
        dimensions: { width: 46, height: 87, depth: 51 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 12, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 10, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-warm-taupe",
        size: null,
        color: "Warm Taupe",
        price: 800.0,
        dimensions: { width: 46, height: 87, depth: 51 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 11, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 9, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: false,
    colors: ["Warm Sand", "Warm Taupe"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 23, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 19, reserved: 0 },
    ],
    active: true,
  },

  // BAR STOOLS / HIGH CHAIRS (3 items)
  {
    id: 15,
    name: "Scarlet High Chair",
    price: 1150.0,
    description:
      "Solid wood bar stool with cushioned seat in multiple color options. Perfect for kitchen islands and bar counters. Heritage Collection.",
    category: "chairs",
    subCategory: "Bar Stools",
    imageUrl: scarletHighChair,
    images: [scarletHighChair],
    material: "Solid Wood & Fabric",
    dimensions: { width: 42, height: 100, depth: 46 },
    variants: [
      {
        id: "one-size-slate-green",
        size: null,
        color: "Slate Green",
        price: 1150.0,
        dimensions: { width: 42, height: 100, depth: 46 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 7, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 5, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-chestnut-brown",
        size: null,
        color: "Chestnut Brown",
        price: 1150.0,
        dimensions: { width: 42, height: 100, depth: 46 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 7, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 5, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-antique-olive",
        size: null,
        color: "Antique Olive",
        price: 1150.0,
        dimensions: { width: 42, height: 100, depth: 46 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 6, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 5, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: true,
    colors: ["Slate Green", "Chestnut Brown", "Antique Olive"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 20, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 15, reserved: 0 },
    ],
    active: true,
  },
  {
    id: 16,
    name: "Scarla High Chair",
    price: 1250.0,
    description:
      "Solid wood bar stool with upholstered back and seat. Premium comfort for elevated seating with full back support. Heritage Collection.",
    category: "chairs",
    subCategory: "Bar Stools",
    imageUrl: scarlaHighChair,
    images: [scarlaHighChair],
    material: "Solid Wood & Fabric",
    dimensions: { width: 44, height: 102, depth: 48 },
    variants: [
      {
        id: "one-size-linen-beige",
        size: null,
        color: "Linen Beige",
        price: 1250.0,
        dimensions: { width: 44, height: 102, depth: 48 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 6, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 5, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-pebble-gray",
        size: null,
        color: "Pebble Gray",
        price: 1250.0,
        dimensions: { width: 44, height: 102, depth: 48 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 6, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 5, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-storm-gray",
        size: null,
        color: "Storm Gray",
        price: 1250.0,
        dimensions: { width: 44, height: 102, depth: 48 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 6, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: true,
    colors: ["Linen Beige", "Pebble Gray", "Storm Gray"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 18, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 14, reserved: 0 },
    ],
    active: true,
  },
  {
    id: 17,
    name: "Scott High Chair",
    price: 950.0,
    description:
      "Classic solid wood bar stool in multiple color finishes. Simple, sturdy design ideal for casual dining areas. Heritage Collection.",
    category: "chairs",
    subCategory: "Bar Stools",
    imageUrl: scottHighChair,
    images: [scottHighChair],
    material: "Solid Wood",
    dimensions: { width: 40, height: 98, depth: 44 },
    variants: [
      {
        id: "one-size-warm-sand",
        size: null,
        color: "Warm Sand",
        price: 950.0,
        dimensions: { width: 40, height: 98, depth: 44 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 11, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 9, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-deep-espresso",
        size: null,
        color: "Deep Espresso",
        price: 950.0,
        dimensions: { width: 40, height: 98, depth: 44 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 11, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 9, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: false,
    colors: ["Warm Sand", "Deep Espresso"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 22, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 18, reserved: 0 },
    ],
    active: true,
  },

  // BENCHES / SMALL FURNITURE (2 items)
  {
    id: 18,
    name: "Sally Stool",
    price: 650.0,
    description:
      "Solid wood stool with drawer storage. Multi-functional piece serves as both seating and side table with hidden storage. Heritage Collection.",
    category: "chairs",
    subCategory: "Stools & Benches",
    imageUrl: sallyStool,
    images: [sallyStool],
    material: "Solid Wood",
    dimensions: { width: 35, height: 45, depth: 35 },
    variants: [
      {
        id: "one-size-natural-wood",
        size: null,
        color: "Natural Wood",
        price: 650.0,
        dimensions: { width: 35, height: 45, depth: 35 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 25, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 20, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: false,
    colors: ["Natural Wood"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 25, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 20, reserved: 0 },
    ],
    active: true,
  },
  {
    id: 19,
    name: "Seb Bench",
    price: 850.0,
    description:
      "Solid wood bench suitable for entryways or as a coffee table. Versatile piece with clean lines and sturdy construction. Heritage Collection.",
    category: "chairs",
    subCategory: "Stools & Benches",
    imageUrl: sebBench,
    images: [sebBench],
    material: "Solid Wood",
    dimensions: { width: 100, height: 45, depth: 35 },
    variants: [
      {
        id: "one-size-natural-wood",
        size: null,
        color: "Natural Wood",
        price: 850.0,
        dimensions: { width: 100, height: 45, depth: 35 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 15, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 12, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: false,
    colors: ["Natural Wood"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 15, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 12, reserved: 0 },
    ],
    active: true,
  },

  // DINING TABLES (3 items)
  {
    id: 20,
    name: "Stella Square Table",
    price: 1250.0, // Base price set to minimum size option price
    description:
      "Solid wood square dining table available in multiple sizes (60cm, 70cm, 80cm, 90cm). Perfect for intimate dining spaces. Heritage Collection.",
    category: "tables",
    subCategory: "Dining Tables",
    imageUrl: stellaSquareTable,
    images: [stellaSquareTable],
    material: "Solid Wood",
    dimensions: { width: 80, height: 75, depth: 80 },
    // NEW: Using variants system for proper inventory tracking per size-color combination
    variants: [
      // 60cm variants
      {
        id: "60cm-warm-sand",
        size: "60cm",
        color: "Warm Sand",
        price: 1250.0,
        dimensions: { width: 60, height: 75, depth: 60 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 3, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 2, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "60cm-deep-espresso",
        size: "60cm",
        color: "Deep Espresso",
        price: 1250.0,
        dimensions: { width: 60, height: 75, depth: 60 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 5, reserved: 0 },
        ],
        active: true,
      },
      // 70cm variants
      {
        id: "70cm-warm-sand",
        size: "70cm",
        color: "Warm Sand",
        price: 1350.0,
        dimensions: { width: 70, height: 75, depth: 70 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 5, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "70cm-deep-espresso",
        size: "70cm",
        color: "Deep Espresso",
        price: 1350.0,
        dimensions: { width: 70, height: 75, depth: 70 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 5, reserved: 0 },
        ],
        active: true,
      },
      // 80cm variants
      {
        id: "80cm-warm-sand",
        size: "80cm",
        color: "Warm Sand",
        price: 1450.0,
        dimensions: { width: 80, height: 75, depth: 80 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 5, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "80cm-deep-espresso",
        size: "80cm",
        color: "Deep Espresso",
        price: 1450.0,
        dimensions: { width: 80, height: 75, depth: 80 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 5, reserved: 0 },
        ],
        active: true,
      },
      // 90cm variants
      {
        id: "90cm-warm-sand",
        size: "90cm",
        color: "Warm Sand",
        price: 1550.0,
        dimensions: { width: 90, height: 75, depth: 90 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 5, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "90cm-deep-espresso",
        size: "90cm",
        color: "Deep Espresso",
        price: 1550.0,
        dimensions: { width: 90, height: 75, depth: 90 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 5, reserved: 0 },
        ],
        active: true,
      },
    ],
    // LEGACY: Keep for backward compatibility during migration
    sizeOptions: [
      {
        label: "60cm",
        price: 1250.0,
        dimensions: { width: 60, height: 75, depth: 60 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 8, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 7, reserved: 0 },
        ],
      },
      {
        label: "70cm",
        price: 1350.0,
        dimensions: { width: 70, height: 75, depth: 70 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 10, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 10, reserved: 0 },
        ],
      },
      {
        label: "80cm",
        price: 1450.0,
        dimensions: { width: 80, height: 75, depth: 80 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 10, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 10, reserved: 0 },
        ],
      },
      {
        label: "90cm",
        price: 1550.0,
        dimensions: { width: 90, height: 75, depth: 90 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 10, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 10, reserved: 0 },
        ],
      },
    ],
    inStock: true,
    featured: true,
    colors: ["Warm Sand", "Deep Espresso"],
    active: true,
  },
  {
    id: 21,
    name: "Stella Round Table",
    price: 1500.0,
    description:
      "Solid wood round dining table available in multiple sizes (60cm, 70cm, 80cm, 90cm). Elegant circular design for cozy gatherings. Heritage Collection.",
    category: "tables",
    subCategory: "Dining Tables",
    imageUrl: stellaRoundTable,
    images: [stellaRoundTable],
    material: "Solid Wood",
    dimensions: { width: 90, height: 75, depth: 90 },
    variants: [
      {
        id: "60cm-warm-sand",
        size: "60cm",
        color: "Warm Sand",
        price: 1500.0,
        dimensions: { width: 60, height: 75, depth: 60 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "60cm-deep-espresso",
        size: "60cm",
        color: "Deep Espresso",
        price: 1500.0,
        dimensions: { width: 60, height: 75, depth: 60 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "70cm-warm-sand",
        size: "70cm",
        color: "Warm Sand",
        price: 1650.0,
        dimensions: { width: 70, height: 75, depth: 70 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "70cm-deep-espresso",
        size: "70cm",
        color: "Deep Espresso",
        price: 1650.0,
        dimensions: { width: 70, height: 75, depth: 70 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "80cm-warm-sand",
        size: "80cm",
        color: "Warm Sand",
        price: 1800.0,
        dimensions: { width: 80, height: 75, depth: 80 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "80cm-deep-espresso",
        size: "80cm",
        color: "Deep Espresso",
        price: 1800.0,
        dimensions: { width: 80, height: 75, depth: 80 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "90cm-warm-sand",
        size: "90cm",
        color: "Warm Sand",
        price: 1950.0,
        dimensions: { width: 90, height: 75, depth: 90 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "90cm-deep-espresso",
        size: "90cm",
        color: "Deep Espresso",
        price: 1950.0,
        dimensions: { width: 90, height: 75, depth: 90 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
    ],
    sizeOptions: [
      {
        label: "60cm",
        price: 1500.0,
        dimensions: { width: 60, height: 75, depth: 60 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 10, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 8, reserved: 0 },
        ],
      },
      {
        label: "70cm",
        price: 1650.0,
        dimensions: { width: 70, height: 75, depth: 70 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 10, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 8, reserved: 0 },
        ],
      },
      {
        label: "80cm",
        price: 1800.0,
        dimensions: { width: 80, height: 75, depth: 80 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 10, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 8, reserved: 0 },
        ],
      },
      {
        label: "90cm",
        price: 1950.0,
        dimensions: { width: 90, height: 75, depth: 90 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 10, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 8, reserved: 0 },
        ],
      },
    ],
    inStock: true,
    featured: false,
    colors: ["Warm Sand", "Deep Espresso"],
    active: true,
  },
  {
    id: 22,
    name: "Stella Rectangular Table",
    price: 1500.0,
    description:
      "Solid wood rectangular dining table available in multiple sizes (120x60, 130x80, 140x80, 150x80, 160x80). Versatile table for family dining. Heritage Collection.",
    category: "tables",
    subCategory: "Dining Tables",
    imageUrl: stellaRectangularTable,
    images: [stellaRectangularTable],
    material: "Solid Wood",
    dimensions: { width: 150, height: 75, depth: 80 },
    variants: [
      {
        id: "120x60-warm-sand",
        size: "120x60",
        color: "Warm Sand",
        price: 1500.0,
        dimensions: { width: 120, height: 75, depth: 60 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "120x60-deep-espresso",
        size: "120x60",
        color: "Deep Espresso",
        price: 1500.0,
        dimensions: { width: 120, height: 75, depth: 60 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "130x80-warm-sand",
        size: "130x80",
        color: "Warm Sand",
        price: 1650.0,
        dimensions: { width: 130, height: 75, depth: 80 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "130x80-deep-espresso",
        size: "130x80",
        color: "Deep Espresso",
        price: 1650.0,
        dimensions: { width: 130, height: 75, depth: 80 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "140x80-warm-sand",
        size: "140x80",
        color: "Warm Sand",
        price: 1800.0,
        dimensions: { width: 140, height: 75, depth: 80 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "140x80-deep-espresso",
        size: "140x80",
        color: "Deep Espresso",
        price: 1800.0,
        dimensions: { width: 140, height: 75, depth: 80 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "150x80-warm-sand",
        size: "150x80",
        color: "Warm Sand",
        price: 1950.0,
        dimensions: { width: 150, height: 75, depth: 80 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "150x80-deep-espresso",
        size: "150x80",
        color: "Deep Espresso",
        price: 1950.0,
        dimensions: { width: 150, height: 75, depth: 80 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "160x80-warm-sand",
        size: "160x80",
        color: "Warm Sand",
        price: 2100.0,
        dimensions: { width: 160, height: 75, depth: 80 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "160x80-deep-espresso",
        size: "160x80",
        color: "Deep Espresso",
        price: 2100.0,
        dimensions: { width: 160, height: 75, depth: 80 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
    ],
    sizeOptions: [
      {
        label: "120x60",
        price: 1500.0,
        dimensions: { width: 120, height: 75, depth: 60 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 10, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 8, reserved: 0 },
        ],
      },
      {
        label: "130x80",
        price: 1650.0,
        dimensions: { width: 130, height: 75, depth: 80 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 10, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 8, reserved: 0 },
        ],
      },
      {
        label: "140x80",
        price: 1800.0,
        dimensions: { width: 140, height: 75, depth: 80 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 10, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 8, reserved: 0 },
        ],
      },
      {
        label: "150x80",
        price: 1950.0,
        dimensions: { width: 150, height: 75, depth: 80 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 10, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 8, reserved: 0 },
        ],
      },
      {
        label: "160x80",
        price: 2100.0,
        dimensions: { width: 160, height: 75, depth: 80 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 10, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 8, reserved: 0 },
        ],
      },
    ],
    inStock: true,
    featured: true,
    colors: ["Warm Sand", "Deep Espresso"],
    active: true,
  },

  // BAR / HIGH TABLES (3 items)
  {
    id: 23,
    name: "Serah High Table",
    price: 1350.0,
    description:
      "Solid wood bar table (120x50x100cm). Perfect height for standing meetings or casual dining with bar stools. Heritage Collection.",
    category: "tables",
    subCategory: "Bar Tables",
    imageUrl: serahHighTable,
    images: [serahHighTable],
    material: "Solid Wood",
    dimensions: { width: 120, height: 100, depth: 50 },
    variants: [
      {
        id: "one-size-warm-sand",
        size: null,
        color: "Warm Sand",
        price: 1350.0,
        dimensions: { width: 120, height: 100, depth: 50 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 4, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 3, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-deep-espresso",
        size: null,
        color: "Deep Espresso",
        price: 1350.0,
        dimensions: { width: 120, height: 100, depth: 50 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 4, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 3, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: false,
    colors: ["Warm Sand", "Deep Espresso"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 8, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 6, reserved: 0 },
    ],
    active: true,
  },
  {
    id: 24,
    name: "Seno High Table",
    price: 1250.0,
    description:
      "Solid wood round bar table with shelf (60x60x103cm). Features additional storage shelf for convenience. Heritage Collection.",
    category: "tables",
    subCategory: "Bar Tables",
    imageUrl: senoHighTable,
    images: [senoHighTable],
    material: "Solid Wood",
    dimensions: { width: 60, height: 103, depth: 60 },
    variants: [
      {
        id: "one-size-warm-sand",
        size: null,
        color: "Warm Sand",
        price: 1250.0,
        dimensions: { width: 60, height: 103, depth: 60 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-deep-espresso",
        size: null,
        color: "Deep Espresso",
        price: 1250.0,
        dimensions: { width: 60, height: 103, depth: 60 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: false,
    colors: ["Warm Sand", "Deep Espresso"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 10, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 8, reserved: 0 },
    ],
    active: true,
  },
  {
    id: 25,
    name: "Sena High Table",
    price: 1200.0,
    description:
      "Solid wood bar table (60x60x103cm). Compact high table perfect for small spaces and casual dining. Heritage Collection.",
    category: "tables",
    subCategory: "Bar Tables",
    imageUrl: senaHighTable,
    images: [senaHighTable],
    material: "Solid Wood",
    dimensions: { width: 60, height: 103, depth: 60 },
    variants: [
      {
        id: "one-size-warm-sand",
        size: null,
        color: "Warm Sand",
        price: 1200.0,
        dimensions: { width: 60, height: 103, depth: 60 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 5, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 4, reserved: 0 },
        ],
        active: true,
      },
      {
        id: "one-size-deep-espresso",
        size: null,
        color: "Deep Espresso",
        price: 1200.0,
        dimensions: { width: 60, height: 103, depth: 60 },
        warehouseStock: [
          { warehouse: "Lorenzo", quantity: 4, reserved: 0 },
          { warehouse: "Oroquieta", quantity: 3, reserved: 0 },
        ],
        active: true,
      },
    ],
    inStock: true,
    featured: false,
    colors: ["Warm Sand", "Deep Espresso"],
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 9, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 7, reserved: 0 },
    ],
    active: true,
  },
];

// Initialize products in localStorage if not exists
if (typeof window !== "undefined") {
  const storedProducts = localStorage.getItem("products");

  // Force reset if the first product doesn't match the new structure (checking for Shelli Chair with figma asset)
  if (storedProducts) {
    try {
      const parsed = JSON.parse(storedProducts);
      // Check if imageUrl contains figma:asset - if not, reset to use the new imported images
      if (
        !parsed[0] ||
        parsed[0].name !== "Shelli Chair" ||
        !String(parsed[0].imageUrl).includes("figma:asset")
      ) {
        // Reset to default products with proper figma:asset imports
        localStorage.setItem("products", JSON.stringify(defaultProducts));
      }
    } catch (e) {
      // If parsing fails, reset to default
      localStorage.setItem("products", JSON.stringify(defaultProducts));
    }
  } else {
    localStorage.setItem("products", JSON.stringify(defaultProducts));
  }
}

// Helper function to generate variant ID
export const generateVariantId = (
  size: string | null,
  color: string,
): string => {
  const sizeSlug = size ? size.toLowerCase().replace(/\s+/g, "-") : "one-size";
  const colorSlug = color.toLowerCase().replace(/\s+/g, "-");
  return `${sizeSlug}-${colorSlug}`;
};

// Migrate old product structure to variant system
const migrateProductToVariants = (product: Product): Product => {
  // If product already has variants, return as is
  if (product.variants && product.variants.length > 0) {
    return product;
  }

  const variants: ProductVariant[] = [];

  // Case 1: Product with sizeOptions (old tables with sizes)
  if (product.sizeOptions && product.sizeOptions.length > 0) {
    const colors =
      product.colors && product.colors.length > 0
        ? product.colors
        : ["Natural"];

    // Create variant for each size-color combination
    product.sizeOptions.forEach((sizeOption) => {
      colors.forEach((color) => {
        const variantId = generateVariantId(sizeOption.label, color);
        // Distribute stock from size option evenly across colors
        const stockPerColor = Math.floor(
          (sizeOption.warehouseStock[0]?.quantity || 0) / colors.length,
        );

        variants.push({
          id: variantId,
          size: sizeOption.label,
          color: color,
          price: sizeOption.price,
          dimensions: sizeOption.dimensions,
          warehouseStock: [
            {
              warehouse: "Lorenzo",
              quantity: Math.floor(stockPerColor / 2),
              reserved: 0,
            },
            {
              warehouse: "Oroquieta",
              quantity: Math.ceil(stockPerColor / 2),
              reserved: 0,
            },
          ],
          active: true,
        });
      });
    });
  }
  // Case 2: Product with only colors (old chairs)
  else if (product.colors && product.colors.length > 0) {
    const totalStock =
      (product.warehouseStock?.[0]?.quantity || 0) +
      (product.warehouseStock?.[1]?.quantity || 0);
    const stockPerColor = Math.floor(totalStock / product.colors.length);

    product.colors.forEach((color) => {
      const variantId = generateVariantId(null, color);

      variants.push({
        id: variantId,
        size: null, // One-size product
        color: color,
        price: product.price,
        dimensions: product.dimensions,
        warehouseStock: [
          {
            warehouse: "Lorenzo",
            quantity: Math.floor(stockPerColor / 2),
            reserved: 0,
          },
          {
            warehouse: "Oroquieta",
            quantity: Math.ceil(stockPerColor / 2),
            reserved: 0,
          },
        ],
        active: true,
      });
    });
  }
  // Case 3: Product with warehouseStock but no colors (create default variant)
  else if (product.warehouseStock && product.warehouseStock.length > 0) {
    variants.push({
      id: generateVariantId(null, "Natural"),
      size: null,
      color: "Natural",
      price: product.price,
      dimensions: product.dimensions,
      warehouseStock: [...product.warehouseStock],
      active: true,
    });
  }
  // Case 4: No stock data at all (create empty default variant)
  else {
    variants.push({
      id: generateVariantId(null, "Natural"),
      size: null,
      color: "Natural",
      price: product.price,
      dimensions: product.dimensions,
      warehouseStock: [
        { warehouse: "Lorenzo", quantity: 0, reserved: 0 },
        { warehouse: "Oroquieta", quantity: 0, reserved: 0 },
      ],
      active: true,
    });
  }

  return {
    ...product,
    variants,
  };
};

// Get products from localStorage or use default
export const getProducts = (): Product[] => {
  if (typeof window === "undefined") return defaultProducts;
  const stored = localStorage.getItem("products");
  if (!stored) return defaultProducts;

  // Parse and migrate old products to new structure
  const products: Product[] = JSON.parse(stored);
  const migratedProducts = products.map((product) => {
    let updatedProduct = { ...product };

    // Add active field if missing (for soft delete)
    if (updatedProduct.active === undefined) {
      updatedProduct.active = true;
    }

    // If product doesn't have warehouseStock, add it
    if (
      !updatedProduct.warehouseStock ||
      updatedProduct.warehouseStock.length === 0
    ) {
      // Distribute stock evenly between warehouses if inStock
      const totalStock = updatedProduct.inStock ? 20 : 0;
      updatedProduct.warehouseStock = [
        {
          warehouse: "Lorenzo" as const,
          quantity: Math.floor(totalStock / 2),
          reserved: 0,
        },
        {
          warehouse: "Oroquieta" as const,
          quantity: Math.ceil(totalStock / 2),
          reserved: 0,
        },
      ];
    }

    // Ensure images array exists
    if (!updatedProduct.images || updatedProduct.images.length === 0) {
      updatedProduct.images = [updatedProduct.imageUrl];
    }

    // MIGRATE TO VARIANT SYSTEM
    updatedProduct = migrateProductToVariants(updatedProduct);

    return updatedProduct;
  });

  // Save migrated products back
  localStorage.setItem("products", JSON.stringify(migratedProducts));
  return migratedProducts;
};

export const products = getProducts();

// Helper function to calculate total available stock
export const getTotalStock = (product: Product): number => {
  // NEW: If product uses variant system
  if (product.variants && product.variants.length > 0) {
    return product.variants.reduce((total, variant) => {
      if (!variant.active) return total;
      return (
        total +
        variant.warehouseStock.reduce(
          (sum, stock) => sum + (stock.quantity - stock.reserved),
          0,
        )
      );
    }, 0);
  }

  // LEGACY: Old system support
  if (product.sizeOptions) {
    // For products with size options, sum all size variants
    return product.sizeOptions.reduce((total, sizeOption) => {
      return (
        total +
        sizeOption.warehouseStock.reduce(
          (sum, stock) => sum + (stock.quantity - stock.reserved),
          0,
        )
      );
    }, 0);
  }
  if (product.warehouseStock) {
    return product.warehouseStock.reduce(
      (sum, stock) => sum + (stock.quantity - stock.reserved),
      0,
    );
  }
  return 0;
};

// Helper function to get stock for specific variant
export const getVariantStock = (variant: ProductVariant): number => {
  return variant.warehouseStock.reduce(
    (sum, stock) => sum + (stock.quantity - stock.reserved),
    0,
  );
};

// Helper function to get stock for specific variant at specific warehouse
export const getVariantWarehouseStock = (
  variant: ProductVariant,
  warehouse: "Lorenzo" | "Oroquieta",
): number => {
  const stock = variant.warehouseStock.find((s) => s.warehouse === warehouse);
  return stock ? stock.quantity - stock.reserved : 0;
};

// Helper function to check if product is in stock
export const isProductInStock = (product: Product): boolean => {
  return getTotalStock(product) > 0;
};

// Helper function to get all unique sizes from variants
export const getProductSizes = (product: Product): string[] => {
  if (!product.variants || product.variants.length === 0) return [];

  const sizes = product.variants
    .filter((v) => v.active && v.size !== null)
    .map((v) => v.size as string);

  return Array.from(new Set(sizes));
};

// Helper function to get all unique colors from variants
export const getProductColors = (product: Product): string[] => {
  if (!product.variants || product.variants.length === 0) return [];

  const colors = product.variants.filter((v) => v.active).map((v) => v.color);

  return Array.from(new Set(colors));
};

// Helper function to find specific variant
export const findVariant = (
  product: Product,
  size: string | null,
  color: string,
): ProductVariant | undefined => {
  if (!product.variants) return undefined;

  return product.variants.find(
    (v) => v.size === size && v.color === color && v.active,
  );
};

// Helper function to get variant by ID
export const getVariantById = (
  product: Product,
  variantId: string,
): ProductVariant | undefined => {
  if (!product.variants) return undefined;
  return product.variants.find((v) => v.id === variantId);
};

// CRUD operations for admin
export const addProduct = (product: Omit<Product, "id">): Product => {
  const currentProducts = getProducts();
  const newId = Math.max(...currentProducts.map((p) => p.id), 0) + 1;
  const newProduct = { ...product, id: newId };
  const updatedProducts = [...currentProducts, newProduct];
  localStorage.setItem("products", JSON.stringify(updatedProducts));
  return newProduct;
};

export const updateProduct = (id: number, updates: Partial<Product>): void => {
  const currentProducts = getProducts();
  const updatedProducts = currentProducts.map((p) =>
    p.id === id ? { ...p, ...updates } : p,
  );
  localStorage.setItem("products", JSON.stringify(updatedProducts));
};

export const deleteProduct = (id: number): void => {
  const currentProducts = getProducts();
  const updatedProducts = currentProducts.filter((p) => p.id !== id);
  localStorage.setItem("products", JSON.stringify(updatedProducts));
};

export const getProductById = (id: number): Product | undefined => {
  return getProducts().find((p) => p.id === id);
};

// VARIANT CRUD OPERATIONS

// Add a new variant to a product
export const addVariant = (
  productId: number,
  variant: Omit<ProductVariant, "id">,
): void => {
  const currentProducts = getProducts();
  const updatedProducts = currentProducts.map((p) => {
    if (p.id === productId) {
      const variantId = generateVariantId(variant.size, variant.color);
      const newVariant: ProductVariant = { ...variant, id: variantId };

      return {
        ...p,
        variants: [...(p.variants || []), newVariant],
      };
    }
    return p;
  });
  localStorage.setItem("products", JSON.stringify(updatedProducts));
};

// Update an existing variant
export const updateVariant = (
  productId: number,
  variantId: string,
  updates: Partial<ProductVariant>,
): void => {
  const currentProducts = getProducts();
  const updatedProducts = currentProducts.map((p) => {
    if (p.id === productId && p.variants) {
      const updatedVariants = p.variants.map((v) =>
        v.id === variantId ? { ...v, ...updates } : v,
      );
      return { ...p, variants: updatedVariants };
    }
    return p;
  });
  localStorage.setItem("products", JSON.stringify(updatedProducts));
};

// Delete a variant (soft delete by setting active to false)
export const deleteVariant = (productId: number, variantId: string): void => {
  const currentProducts = getProducts();
  const updatedProducts = currentProducts.map((p) => {
    if (p.id === productId && p.variants) {
      const updatedVariants = p.variants.map((v) =>
        v.id === variantId ? { ...v, active: false } : v,
      );
      return { ...p, variants: updatedVariants };
    }
    return p;
  });
  localStorage.setItem("products", JSON.stringify(updatedProducts));
};

// Helper function to generate batch ID
const generateBatchId = (): string => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const randomNum = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `BATCH-${dateStr}-${timeStr}-${randomNum}`;
};

// Update warehouse stock for a specific variant
export const updateVariantStock = (
  productId: number,
  variantId: string,
  warehouse: "Lorenzo" | "Oroquieta",
  quantity: number,
  reserved: number = 0,
): void => {
  const currentProducts = getProducts();
  const updatedProducts = currentProducts.map((p) => {
    if (p.id === productId && p.variants) {
      const updatedVariants = p.variants.map((v) => {
        if (v.id === variantId) {
          const updatedWarehouseStock = v.warehouseStock.map((ws) => {
            if (ws.warehouse === warehouse) {
              const oldQuantity = ws.quantity;
              const quantityDiff = quantity - oldQuantity;

              // Initialize batches array if it doesn't exist
              const batches = ws.batches || [];

              // Create a new batch entry if quantity changed
              if (quantityDiff !== 0) {
                const newBatch: InventoryBatch = {
                  batchId: generateBatchId(),
                  receivedAt: new Date().toISOString(),
                  quantity: Math.abs(quantityDiff),
                  reserved: 0,
                  available: Math.abs(quantityDiff),
                  notes:
                    quantityDiff > 0
                      ? `Added ${quantityDiff} units`
                      : `Removed ${Math.abs(quantityDiff)} units`,
                };
                batches.push(newBatch);
              }

              return {
                ...ws,
                quantity,
                reserved,
                batches,
              };
            }
            return ws;
          });
          return { ...v, warehouseStock: updatedWarehouseStock };
        }
        return v;
      });
      return { ...p, variants: updatedVariants };
    }
    return p;
  });
  localStorage.setItem("products", JSON.stringify(updatedProducts));
};

// LEGACY: Update warehouse stock (supports old system)
export const updateWarehouseStock = (
  productId: number,
  warehouse: "Lorenzo" | "Oroquieta",
  quantity: number,
  reserved: number = 0,
  sizeLabel?: string,
): void => {
  const currentProducts = getProducts();
  const updatedProducts = currentProducts.map((p) => {
    if (p.id === productId) {
      if (sizeLabel && p.sizeOptions) {
        // Update stock for a specific size option
        const updatedSizeOptions = p.sizeOptions.map((sizeOption) => {
          if (sizeOption.label === sizeLabel) {
            const updatedWarehouseStock = sizeOption.warehouseStock.map(
              (ws) => {
                if (ws.warehouse === warehouse) {
                  const oldQuantity = ws.quantity;
                  const quantityDiff = quantity - oldQuantity;

                  // Initialize batches array if it doesn't exist
                  const batches = ws.batches || [];

                  // Create a new batch entry if quantity changed
                  if (quantityDiff !== 0) {
                    const newBatch: InventoryBatch = {
                      batchId: generateBatchId(),
                      receivedAt: new Date().toISOString(),
                      quantity: Math.abs(quantityDiff),
                      reserved: 0,
                      available: Math.abs(quantityDiff),
                      notes:
                        quantityDiff > 0
                          ? `Added ${quantityDiff} units`
                          : `Removed ${Math.abs(quantityDiff)} units`,
                    };
                    batches.push(newBatch);
                  }

                  return { ...ws, quantity, reserved, batches };
                }
                return ws;
              },
            );
            return { ...sizeOption, warehouseStock: updatedWarehouseStock };
          }
          return sizeOption;
        });
        return { ...p, sizeOptions: updatedSizeOptions };
      } else if (p.warehouseStock) {
        // Update stock for product without size options
        const updatedWarehouseStock = p.warehouseStock.map((ws) => {
          if (ws.warehouse === warehouse) {
            const oldQuantity = ws.quantity;
            const quantityDiff = quantity - oldQuantity;

            // Initialize batches array if it doesn't exist
            const batches = ws.batches || [];

            // Create a new batch entry if quantity changed
            if (quantityDiff !== 0) {
              const newBatch: InventoryBatch = {
                batchId: generateBatchId(),
                receivedAt: new Date().toISOString(),
                quantity: Math.abs(quantityDiff),
                reserved: 0,
                available: Math.abs(quantityDiff),
                notes:
                  quantityDiff > 0
                    ? `Added ${quantityDiff} units`
                    : `Removed ${Math.abs(quantityDiff)} units`,
              };
              batches.push(newBatch);
            }

            return { ...ws, quantity, reserved, batches };
          }
          return ws;
        });
        return { ...p, warehouseStock: updatedWarehouseStock };
      }
    }
    return p;
  });
  localStorage.setItem("products", JSON.stringify(updatedProducts));
};
