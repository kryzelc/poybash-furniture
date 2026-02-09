/**
 * Inventory Domain Models
 * 
 * Pure data structures for inventory management.
 */

export type WarehouseName = 'Lorenzo' | 'Oroquieta';

export interface WarehouseStock {
  warehouse: WarehouseName;
  quantity: number;
  reserved: number;
  batches?: InventoryBatch[];
}

export interface InventoryBatch {
  batchId: string;
  receivedAt: string; // ISO timestamp
  quantity: number;
  reserved: number;
  available: number;
  notes?: string;
}

export interface StockAllocation {
  productId: number;
  variantId?: string;
  quantity: number;
  warehouseSource: WarehouseName;
}

export interface StockValidationResult {
  available: boolean;
  productId: number;
  variantId?: string;
  requestedQuantity: number;
  availableQuantity: number;
  error?: string;
}

export interface AllocationResult {
  success: boolean;
  allocatedItems: StockAllocation[];
  errors: string[];
}

/**
 * Calculate available stock (quantity - reserved)
 */
export function calculateAvailableStock(stock: WarehouseStock): number {
  return stock.quantity - stock.reserved;
}

/**
 * Calculate total available stock across warehouses
 */
export function calculateTotalAvailable(stocks: WarehouseStock[]): number {
  return stocks.reduce((sum, stock) => sum + calculateAvailableStock(stock), 0);
}

/**
 * Check if stock is available
 */
export function isStockAvailable(
  stocks: WarehouseStock[],
  requestedQuantity: number
): boolean {
  return calculateTotalAvailable(stocks) >= requestedQuantity;
}

/**
 * Get warehouse with most available stock
 */
export function getBestWarehouse(
  stocks: WarehouseStock[]
): WarehouseStock | undefined {
  return stocks
    .filter(stock => calculateAvailableStock(stock) > 0)
    .sort((a, b) => calculateAvailableStock(b) - calculateAvailableStock(a))[0];
}
