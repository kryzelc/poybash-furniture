import { getProducts, type Product, type WarehouseStock } from './products';

// Get total available stock across all warehouses for a product (considering reservations)
export const getTotalAvailableStock = (
  productId: number,
  variantId?: string
): number => {
  const products = getProducts();
  const product = products.find(p => p.id === productId);
  if (!product) return 0;

  let total = 0;

  if (variantId && product.variants) {
    const variant = product.variants.find(v => v.id === variantId);
    if (variant?.warehouseStock) {
      total = variant.warehouseStock.reduce((sum, ws) => {
        return sum + (ws.quantity - ws.reserved);
      }, 0);
    }
  } else if (product.warehouseStock) {
    total = product.warehouseStock.reduce((sum, ws) => {
      return sum + (ws.quantity - ws.reserved);
    }, 0);
  }

  return total;
};

// Automatically allocate warehouse sources for items based on availability
export const allocateWarehouseSources = (items: Array<{
  productId: number;
  variantId?: string;
  quantity: number;
}>): {
  success: boolean;
  allocatedItems: Array<{
    productId: number;
    variantId?: string;
    quantity: number;
    warehouseSource: 'Lorenzo' | 'Oroquieta';
  }>;
  errors: string[];
} => {
  const products = getProducts();
  const allocatedItems: Array<{
    productId: number;
    variantId?: string;
    quantity: number;
    warehouseSource: 'Lorenzo' | 'Oroquieta';
  }> = [];
  const errors: string[] = [];

  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      errors.push(`Product ID ${item.productId} not found`);
      continue;
    }

    let remainingQty = item.quantity;
    const productName = product.name;

    // Get warehouse stocks based on product type
    let warehouseStocks: Array<{ warehouse: 'Lorenzo' | 'Oroquieta'; quantity: number; reserved: number }> = [];
    
    if (item.variantId && product.variants) {
      const variant = product.variants.find(v => v.id === item.variantId);
      if (variant?.warehouseStock) {
        warehouseStocks = variant.warehouseStock;
      }
    } else if (product.warehouseStock) {
      warehouseStocks = product.warehouseStock;
    }

    if (warehouseStocks.length === 0) {
      errors.push(`No warehouse stock data for ${productName}`);
      continue;
    }

    // Sort warehouses by available stock (highest first)
    const sortedWarehouses = [...warehouseStocks]
      .map(ws => ({
        ...ws,
        available: ws.quantity - ws.reserved
      }))
      .filter(ws => ws.available > 0)
      .sort((a, b) => b.available - a.available);

    // Allocate from warehouses with most stock first
    for (const warehouse of sortedWarehouses) {
      if (remainingQty <= 0) break;

      const qtyToAllocate = Math.min(remainingQty, warehouse.available);
      
      allocatedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: qtyToAllocate,
        warehouseSource: warehouse.warehouse,
      });

      remainingQty -= qtyToAllocate;
    }

    // Check if we couldn't fulfill the full quantity
    if (remainingQty > 0) {
      const totalAvailable = getTotalAvailableStock(item.productId, item.variantId);
      errors.push(
        `Insufficient stock for ${productName}. Requested: ${item.quantity}, Available: ${totalAvailable}`
      );
    }
  }

  return {
    success: errors.length === 0,
    allocatedItems,
    errors,
  };
};

// Validate if items can be fulfilled with current stock
export const validateStockAvailability = (items: Array<{
  productId: number;
  variantId?: string;
  quantity: number;
}>): { success: boolean; errors: string[] } => {
  const products = getProducts();
  const errors: string[] = [];

  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      errors.push(`Product ID ${item.productId} not found`);
      continue;
    }

    const available = getTotalAvailableStock(item.productId, item.variantId);
    
    if (available < item.quantity) {
      const variantText = item.variantId ? ` (${item.variantId})` : '';
      errors.push(
        `Insufficient stock for ${product.name}${variantText}. Requested: ${item.quantity}, Available: ${available}`
      );
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
};

// Reserve stock when order is placed (increment reserved count)
export const reserveStock = (items: Array<{
  productId: number;
  variantId?: string;
  quantity: number;
  warehouseSource: 'Lorenzo' | 'Oroquieta';
}>): { success: boolean; errors: string[] } => {
  const products = getProducts();
  const errors: string[] = [];
  const updatedProducts: Product[] = [];

  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      errors.push(`Product ID ${item.productId} not found`);
      continue;
    }

    let updated = false;

    // Handle variant-based products
    if (item.variantId && product.variants) {
      const variantIndex = product.variants.findIndex(v => v.id === item.variantId);
      if (variantIndex !== -1) {
        const warehouseIndex = product.variants[variantIndex].warehouseStock.findIndex(
          ws => ws.warehouse === item.warehouseSource
        );
        if (warehouseIndex !== -1) {
          const stock = product.variants[variantIndex].warehouseStock[warehouseIndex];
          const available = stock.quantity - stock.reserved;
          
          if (available >= item.quantity) {
            // Clone the product and update
            const updatedProduct = JSON.parse(JSON.stringify(product));
            updatedProduct.variants[variantIndex].warehouseStock[warehouseIndex].reserved += item.quantity;
            updatedProducts.push(updatedProduct);
            updated = true;
          } else {
            errors.push(`Insufficient stock for ${product.name} (${item.variantId}) at ${item.warehouseSource}`);
          }
        }
      }
    } 
    // Handle regular products with warehouse stock
    else if (product.warehouseStock) {
      const warehouseIndex = product.warehouseStock.findIndex(
        ws => ws.warehouse === item.warehouseSource
      );
      if (warehouseIndex !== -1) {
        const stock = product.warehouseStock[warehouseIndex];
        const available = stock.quantity - stock.reserved;
        
        if (available >= item.quantity) {
          // Clone the product and update
          const updatedProduct = JSON.parse(JSON.stringify(product));
          updatedProduct.warehouseStock[warehouseIndex].reserved += item.quantity;
          updatedProducts.push(updatedProduct);
          updated = true;
        } else {
          errors.push(`Insufficient stock for ${product.name} at ${item.warehouseSource}`);
        }
      }
    }

    if (!updated && errors.length === 0) {
      errors.push(`Could not reserve stock for ${product.name}`);
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Save updated products to localStorage
  if (typeof window !== 'undefined') {
    const allProducts = getProducts();
    const finalProducts = allProducts.map(p => {
      const updated = updatedProducts.find(up => up.id === p.id);
      return updated || p;
    });
    localStorage.setItem('products', JSON.stringify(finalProducts));
    
    // Dispatch custom event to notify components of stock changes
    window.dispatchEvent(new CustomEvent('stockUpdated'));
  }

  return { success: true, errors: [] };
};

// Unreserve stock when order is cancelled (decrement reserved count)
export const unreserveStock = (items: Array<{
  productId: number;
  variantId?: string;
  quantity: number;
  warehouseSource: 'Lorenzo' | 'Oroquieta';
}>): void => {
  const products = getProducts();
  const updatedProducts: Product[] = [];

  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) continue;

    // Handle variant-based products
    if (item.variantId && product.variants) {
      const variantIndex = product.variants.findIndex(v => v.id === item.variantId);
      if (variantIndex !== -1) {
        const warehouseIndex = product.variants[variantIndex].warehouseStock.findIndex(
          ws => ws.warehouse === item.warehouseSource
        );
        if (warehouseIndex !== -1) {
          const updatedProduct = JSON.parse(JSON.stringify(product));
          const currentReserved = updatedProduct.variants[variantIndex].warehouseStock[warehouseIndex].reserved;
          updatedProduct.variants[variantIndex].warehouseStock[warehouseIndex].reserved = 
            Math.max(0, currentReserved - item.quantity);
          updatedProducts.push(updatedProduct);
        }
      }
    } 
    // Handle regular products with warehouse stock
    else if (product.warehouseStock) {
      const warehouseIndex = product.warehouseStock.findIndex(
        ws => ws.warehouse === item.warehouseSource
      );
      if (warehouseIndex !== -1) {
        const updatedProduct = JSON.parse(JSON.stringify(product));
        const currentReserved = updatedProduct.warehouseStock[warehouseIndex].reserved;
        updatedProduct.warehouseStock[warehouseIndex].reserved = 
          Math.max(0, currentReserved - item.quantity);
        updatedProducts.push(updatedProduct);
      }
    }
  }

  // Save updated products to localStorage
  if (typeof window !== 'undefined') {
    const allProducts = getProducts();
    const finalProducts = allProducts.map(p => {
      const updated = updatedProducts.find(up => up.id === p.id);
      return updated || p;
    });
    localStorage.setItem('products', JSON.stringify(finalProducts));
    
    // Dispatch custom event to notify components of stock changes
    window.dispatchEvent(new CustomEvent('stockUpdated'));
  }
};

// Deduct stock when order is completed (decrement both quantity and reserved)
export const deductStock = (items: Array<{
  productId: number;
  variantId?: string;
  quantity: number;
  warehouseSource: 'Lorenzo' | 'Oroquieta';
}>): void => {
  const products = getProducts();
  const updatedProducts: Product[] = [];

  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) continue;

    // Handle variant-based products
    if (item.variantId && product.variants) {
      const variantIndex = product.variants.findIndex(v => v.id === item.variantId);
      if (variantIndex !== -1) {
        const warehouseIndex = product.variants[variantIndex].warehouseStock.findIndex(
          ws => ws.warehouse === item.warehouseSource
        );
        if (warehouseIndex !== -1) {
          const updatedProduct = JSON.parse(JSON.stringify(product));
          const stock = updatedProduct.variants[variantIndex].warehouseStock[warehouseIndex];
          stock.quantity = Math.max(0, stock.quantity - item.quantity);
          stock.reserved = Math.max(0, stock.reserved - item.quantity);
          updatedProducts.push(updatedProduct);
        }
      }
    } 
    // Handle regular products with warehouse stock
    else if (product.warehouseStock) {
      const warehouseIndex = product.warehouseStock.findIndex(
        ws => ws.warehouse === item.warehouseSource
      );
      if (warehouseIndex !== -1) {
        const updatedProduct = JSON.parse(JSON.stringify(product));
        const stock = updatedProduct.warehouseStock[warehouseIndex];
        stock.quantity = Math.max(0, stock.quantity - item.quantity);
        stock.reserved = Math.max(0, stock.reserved - item.quantity);
        updatedProducts.push(updatedProduct);
      }
    }
  }

  // Save updated products to localStorage
  if (typeof window !== 'undefined') {
    const allProducts = getProducts();
    const finalProducts = allProducts.map(p => {
      const updated = updatedProducts.find(up => up.id === p.id);
      return updated || p;
    });
    localStorage.setItem('products', JSON.stringify(finalProducts));
    
    // Dispatch custom event to notify components of stock changes
    window.dispatchEvent(new CustomEvent('stockUpdated'));
  }
};

// Add stock back when order is refunded (increment quantity)
export const restoreStock = (items: Array<{
  productId: number;
  variantId?: string;
  quantity: number;
  warehouseSource: 'Lorenzo' | 'Oroquieta';
}>): void => {
  const products = getProducts();
  const updatedProducts: Product[] = [];

  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) continue;

    // Handle variant-based products
    if (item.variantId && product.variants) {
      const variantIndex = product.variants.findIndex(v => v.id === item.variantId);
      if (variantIndex !== -1) {
        const warehouseIndex = product.variants[variantIndex].warehouseStock.findIndex(
          ws => ws.warehouse === item.warehouseSource
        );
        if (warehouseIndex !== -1) {
          const updatedProduct = JSON.parse(JSON.stringify(product));
          updatedProduct.variants[variantIndex].warehouseStock[warehouseIndex].quantity += item.quantity;
          updatedProducts.push(updatedProduct);
        }
      }
    } 
    // Handle regular products with warehouse stock
    else if (product.warehouseStock) {
      const warehouseIndex = product.warehouseStock.findIndex(
        ws => ws.warehouse === item.warehouseSource
      );
      if (warehouseIndex !== -1) {
        const updatedProduct = JSON.parse(JSON.stringify(product));
        updatedProduct.warehouseStock[warehouseIndex].quantity += item.quantity;
        updatedProducts.push(updatedProduct);
      }
    }
  }

  // Save updated products to localStorage
  if (typeof window !== 'undefined') {
    const allProducts = getProducts();
    const finalProducts = allProducts.map(p => {
      const updated = updatedProducts.find(up => up.id === p.id);
      return updated || p;
    });
    localStorage.setItem('products', JSON.stringify(finalProducts));
    
    // Dispatch custom event to notify components of stock changes
    window.dispatchEvent(new CustomEvent('stockUpdated'));
  }
};
