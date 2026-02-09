/**
 * Inventory Service
 *
 * Handles all inventory-related operations.
 */

import { supabase } from "./supabaseClient";
import {
  WarehouseStock,
  StockAllocation,
  StockValidationResult,
  AllocationResult,
  calculateAvailableStock,
  calculateTotalAvailable,
  getBestWarehouse,
} from "@/models/Inventory";
import { Product } from "@/models/Product";

class InventoryService {
  /**
   * Get total available stock for a product/variant
   */
  getTotalAvailableStock(product: Product, variantId?: string): number {
    let warehouseStocks: WarehouseStock[] = [];

    if (variantId && product.variants) {
      const variant = product.variants.find((v) => v.id === variantId);
      if (variant?.warehouseStock) {
        warehouseStocks = variant.warehouseStock;
      }
    }

    return calculateTotalAvailable(warehouseStocks);
  }

  /**
   * Validate stock availability for cart items
   */
  validateStockAvailability(
    items: Array<{
      product: Product;
      variantId?: string;
      quantity: number;
    }>,
  ): { available: boolean; errors: StockValidationResult[] } {
    const errors: StockValidationResult[] = [];

    for (const item of items) {
      const availableStock = this.getTotalAvailableStock(
        item.product,
        item.variantId,
      );

      if (availableStock < item.quantity) {
        errors.push({
          available: false,
          productId: item.product.id,
          variantId: item.variantId,
          requestedQuantity: item.quantity,
          availableQuantity: availableStock,
          error: `Only ${availableStock} units available for ${item.product.name}`,
        });
      }
    }

    return {
      available: errors.length === 0,
      errors,
    };
  }

  /**
   * Allocate warehouse sources for order items
   */
  allocateWarehouseSources(
    items: Array<{
      product: Product;
      variantId?: string;
      quantity: number;
    }>,
  ): AllocationResult {
    const allocatedItems: StockAllocation[] = [];
    const errors: string[] = [];

    for (const item of items) {
      let remainingQty = item.quantity;
      const productName = item.product.name;

      // Get warehouse stocks
      let warehouseStocks: WarehouseStock[] = [];

      if (item.variantId && item.product.variants) {
        const variant = item.product.variants.find(
          (v) => v.id === item.variantId,
        );
        if (variant?.warehouseStock) {
          warehouseStocks = variant.warehouseStock;
        }
      }

      if (warehouseStocks.length === 0) {
        errors.push(`No warehouse stock data for ${productName}`);
        continue;
      }

      // Sort warehouses by available stock (highest first)
      const sortedWarehouses = [...warehouseStocks]
        .map((ws) => ({
          ...ws,
          available: calculateAvailableStock(ws),
        }))
        .filter((ws) => ws.available > 0)
        .sort((a, b) => b.available - a.available);

      // Allocate from warehouses with most stock first
      for (const warehouse of sortedWarehouses) {
        if (remainingQty <= 0) break;

        const qtyToAllocate = Math.min(remainingQty, warehouse.available);

        allocatedItems.push({
          productId: item.product.id,
          variantId: item.variantId,
          quantity: qtyToAllocate,
          warehouseSource: warehouse.warehouse,
        });

        remainingQty -= qtyToAllocate;
      }

      if (remainingQty > 0) {
        errors.push(
          `Insufficient stock for ${productName}. Short by ${remainingQty} units.`,
        );
      }
    }

    return {
      success: errors.length === 0,
      allocatedItems,
      errors,
    };
  }

  /**
   * Reserve stock for an order (called before order placement)
   */
  async reserveStock(
    variantId: string,
    warehouseId: string,
    quantity: number,
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("reserve_stock", {
        p_variant_id: variantId,
        p_warehouse_id: warehouseId,
        p_quantity: quantity,
      });

      if (error) {
        console.error("Error reserving stock:", error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error("Error reserving stock:", error);
      return false;
    }
  }

  /**
   * Release reserved stock (called when order is cancelled)
   */
  async releaseStock(
    variantId: string,
    warehouseId: string,
    quantity: number,
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc("release_stock", {
        p_variant_id: variantId,
        p_warehouse_id: warehouseId,
        p_quantity: quantity,
      });

      if (error) {
        console.error("Error releasing stock:", error);
      }
    } catch (error) {
      console.error("Error releasing stock:", error);
    }
  }

  /**
   * Confirm stock sale (called when order is completed)
   */
  async confirmStockSale(
    variantId: string,
    warehouseId: string,
    quantity: number,
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc("confirm_stock_sale", {
        p_variant_id: variantId,
        p_warehouse_id: warehouseId,
        p_quantity: quantity,
      });

      if (error) {
        console.error("Error confirming stock sale:", error);
        throw new Error("Failed to confirm stock sale");
      }
    } catch (error) {
      console.error("Error confirming stock sale:", error);
      throw error;
    }
  }

  /**
   * Update warehouse stock (Admin/Clerk only)
   */
  async updateWarehouseStock(
    variantId: string,
    warehouseId: string,
    quantity: number,
  ): Promise<void> {
    const { error } = await supabase
      .from("warehouse_stock")
      .update({
        quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("variant_id", variantId)
      .eq("warehouse_id", warehouseId);

    if (error) {
      throw new Error(`Failed to update warehouse stock: ${error.message}`);
    }
  }
}

// Export singleton instance
export const inventoryService = new InventoryService();
