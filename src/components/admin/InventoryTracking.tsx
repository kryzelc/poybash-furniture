// @ts-nocheck
// TODO: Fix type errors for optional warehouseStock property
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Package, AlertTriangle, TrendingUp, Warehouse, Pencil, Clock, Calendar, History } from 'lucide-react';
import { toast } from 'sonner';
import { 
  getProducts, 
  updateWarehouseStock, 
  updateVariantStock,
  type Product, 
  type WarehouseStock,
  type ProductVariant,
  type InventoryBatch,
  getTotalStock,
  getVariantStock 
} from '../../lib/products';
import { useAuth } from '../../contexts/AuthContext';
import { addAuditLog } from '../../lib/auditLog';

interface InventoryTrackingProps {
  products?: Product[]; // Accept products from parent
  onRefresh?: () => void; // Callback to refresh parent's products
}

export function InventoryTracking({ products: externalProducts, onRefresh }: InventoryTrackingProps = {}) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>(() => externalProducts || getProducts());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [warehouseFilter, setWarehouseFilter] = useState<'all' | 'Lorenzo' | 'Oroquieta'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'chairs' | 'tables'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sync with external products when they change
  useEffect(() => {
    if (externalProducts) {
      setProducts(externalProducts);
    }
  }, [externalProducts]);

  // Refresh products from localStorage
  const refreshProducts = () => {
    const updatedProducts = getProducts();
    setProducts(updatedProducts);
    // Also trigger parent refresh if callback provided
    if (onRefresh) {
      onRefresh();
    }
  };

  // Helper function to calculate total available stock
  const getTotalAvailableStock = (product: Product): number => {
    return getTotalStock(product); // Use the centralized helper function
  };

  // Calculate statistics
  const stats = useMemo(() => {
    let lorenzoStock = 0;
    let oroquietaStock = 0;

    products.forEach(p => {
      // NEW: Use variant system if available
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach(variant => {
          if (!variant.active) return;
          const lorenzo = variant.warehouseStock.find(w => w.warehouse === 'Lorenzo');
          const oroquieta = variant.warehouseStock.find(w => w.warehouse === 'Oroquieta');
          lorenzoStock += lorenzo ? lorenzo.quantity : 0;
          oroquietaStock += oroquieta ? oroquieta.quantity : 0;
        });
      }
      // LEGACY: Old system support
      else if (p.sizeOptions) {
        p.sizeOptions.forEach(sizeOption => {
          const lorenzo = sizeOption.warehouseStock.find(w => w.warehouse === 'Lorenzo');
          const oroquieta = sizeOption.warehouseStock.find(w => w.warehouse === 'Oroquieta');
          lorenzoStock += lorenzo ? lorenzo.quantity : 0;
          oroquietaStock += oroquieta ? oroquieta.quantity : 0;
        });
      } else if (p.warehouseStock) {
        const lorenzo = p.warehouseStock.find(w => w.warehouse === 'Lorenzo');
        const oroquieta = p.warehouseStock.find(w => w.warehouse === 'Oroquieta');
        lorenzoStock += lorenzo ? lorenzo.quantity : 0;
        oroquietaStock += oroquieta ? oroquieta.quantity : 0;
      }
    });

    const totalStock = lorenzoStock + oroquietaStock;

    const lowStockItems = products.filter(p => {
      const totalAvailable = getTotalAvailableStock(p);
      return totalAvailable > 0 && totalAvailable <= 10;
    }).length;

    const outOfStockItems = products.filter(p => {
      const totalAvailable = getTotalAvailableStock(p);
      return totalAvailable === 0;
    }).length;

    return {
      totalStock,
      lorenzoStock,
      oroquietaStock,
      lowStockItems,
      outOfStockItems,
    };
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    if (searchTerm) {
      const query = searchTerm.toLowerCase().trim();
      const words = query.split(/\s+/);
      
      filtered = filtered.filter(p => {
        const nameLower = p.name.toLowerCase();
        const subCategoryLower = p.subCategory.toLowerCase();
        const materialLower = p.material.toLowerCase();
        
        // Check if all search words appear in name, subcategory, or material
        return words.every(word => 
          nameLower.includes(word) || 
          subCategoryLower.includes(word) ||
          materialLower.includes(word)
        );
      });
    }

    if (warehouseFilter !== 'all') {
      // Filter to show only products that have stock in selected warehouse
      filtered = filtered.filter(p => {
        const warehouse = p.warehouseStock?.find(w => w.warehouse === warehouseFilter);
        return warehouse && warehouse.quantity > 0;
      });
    }

    return filtered;
  }, [products, categoryFilter, searchTerm, warehouseFilter]);

  const getStockStatus = (product: Product) => {
    const totalAvailable = getTotalAvailableStock(product);
    
    if (totalAvailable === 0) {
      return { status: 'Out of Stock', variant: 'destructive' as const, color: 'text-red-500' };
    } else if (totalAvailable <= 10) {
      return { status: 'Low Stock', variant: 'secondary' as const, color: 'text-orange-500' };
    }
    return { status: 'In Stock', variant: 'default' as const, color: 'text-green-500' };
  };

  const handleUpdateStock = (
    productId: number, 
    warehouse: 'Lorenzo' | 'Oroquieta', 
    quantity: number, 
    reserved: number
  ) => {
    const product = products.find(p => p.id === productId);
    updateWarehouseStock(productId, warehouse, quantity, reserved);
    refreshProducts();
    toast.success(`Stock updated for ${warehouse} warehouse`);
    
    // Add audit log
    if (user && product) {
      addAuditLog({
        actionType: 'inventory_updated',
        performedBy: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: `${user.firstName} ${user.lastName}`,
        },
        targetEntity: {
          type: 'inventory',
          id: productId.toString(),
          name: product.name,
        },
        changes: [{
          field: 'quantity',
          oldValue: 'N/A',
          newValue: quantity.toString(),
        }],
        metadata: {
          warehouse: warehouse.toLowerCase() as 'lorenzo' | 'oroquieta',
          notes: `Updated stock to ${quantity} units (${reserved} reserved)`,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-primary">{stats.totalStock}</div>
            <p className="text-muted-foreground">Units across warehouses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Lorenzo</CardTitle>
            <Warehouse className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-primary">{stats.lorenzoStock}</div>
            <p className="text-muted-foreground">Units in Lorenzo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Oroquieta</CardTitle>
            <Warehouse className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-primary">{stats.oroquietaStock}</div>
            <p className="text-muted-foreground">Units in Oroquieta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-primary">{stats.lowStockItems}</div>
            <p className="text-muted-foreground">Products ≤ 10 units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-primary">{stats.outOfStockItems}</div>
            <p className="text-muted-foreground">Products unavailable</p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>Track and manage stock across warehouses (size variants shown separately)</CardDescription>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={warehouseFilter} onValueChange={(value) => setWarehouseFilter(value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                <SelectItem value="Lorenzo">Lorenzo</SelectItem>
                <SelectItem value="Oroquieta">Oroquieta</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="chairs">Chairs</SelectItem>
                <SelectItem value="tables">Tables</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[1060px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Product</TableHead>
                <TableHead className="text-center w-[140px]">Size/Variant</TableHead>
                <TableHead className="text-center w-[100px]">Category</TableHead>
                <TableHead className="text-center w-[110px]">Lorenzo Stock</TableHead>
                <TableHead className="text-center w-[110px]">Oroquieta Stock</TableHead>
                <TableHead className="text-center w-[100px]">Total Available</TableHead>
                <TableHead className="text-center w-[90px]">Reserved</TableHead>
                <TableHead className="text-center w-[110px]">Status</TableHead>
                <TableHead className="text-center w-[130px]">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Last Updated
                  </div>
                </TableHead>
                <TableHead className="text-center w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.flatMap((product) => {
                  // NEW: If product has variants, create a row for each variant
                  if (product.variants && product.variants.length > 0) {
                    return product.variants
                      .filter(v => v.active) // Only show active variants
                      .map((variant, variantIndex) => {
                        const lorenzo = variant.warehouseStock.find(w => w.warehouse === 'Lorenzo');
                        const oroquieta = variant.warehouseStock.find(w => w.warehouse === 'Oroquieta');
                        const totalAvailable = getVariantStock(variant);
                        const totalReserved = variant.warehouseStock.reduce((sum, ws) => sum + ws.reserved, 0);
                        
                        const stockStatus = totalAvailable === 0 
                          ? { status: 'Out of Stock', variant: 'destructive' as const, color: 'text-red-500' }
                          : totalAvailable <= 5
                          ? { status: 'Low Stock', variant: 'secondary' as const, color: 'text-orange-500' }
                          : { status: 'In Stock', variant: 'default' as const, color: 'text-green-500' };

                        return (
                          <TableRow key={`${product.id}-${variant.id}`}>
                            <TableCell className="py-2">
                              <div>
                                <div className="text-sm truncate">{product.name}</div>
                                <div className="text-muted-foreground text-xs">ID: {product.id}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-2">
                              <div className="space-y-0.5 flex flex-col items-center">
                                {variant.size && <Badge variant="outline" className="text-xs">{variant.size}</Badge>}
                                <span className="text-xs">{variant.color}</span>
                                <div className="text-[11px] text-muted-foreground">₱{variant.price.toFixed(2)}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-2">
                              <Badge variant="outline" className="text-xs">{product.category}</Badge>
                            </TableCell>
                            <TableCell className="text-center py-2">
                              <div>
                                <div className="text-sm">{lorenzo?.quantity || 0}</div>
                                <div className="text-muted-foreground text-xs">
                                  {lorenzo?.reserved || 0} rsv
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-2">
                              <div>
                                <div className="text-sm">{oroquieta?.quantity || 0}</div>
                                <div className="text-muted-foreground text-xs">
                                  {oroquieta?.reserved || 0} rsv
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-2">
                              <span className={`${stockStatus.color} text-sm`}>{totalAvailable}</span>
                            </TableCell>
                            <TableCell className="text-center py-2">
                              <div className="flex justify-center">
                                {totalReserved > 0 && (
                                  <Badge variant="secondary" className="text-xs">{totalReserved}</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-2">
                              <Badge variant={stockStatus.variant} className="text-xs">{stockStatus.status}</Badge>
                            </TableCell>
                            <TableCell className="text-center py-2">
                              <BatchHistoryDialog 
                                warehouseStock={variant.warehouseStock}
                                productName={product.name}
                                variantInfo={`${variant.size || 'One Size'} / ${variant.color}`}
                              />
                            </TableCell>
                            <TableCell className="text-center py-2">
                              <VariantStockEditDialog
                                product={product}
                                variant={variant}
                                onUpdate={(warehouse, quantity, reserved) => {
                                  updateVariantStock(product.id, variant.id, warehouse, quantity, reserved);
                                  refreshProducts();
                                  toast.success(`Stock updated for ${variant.size || 'One Size'} - ${variant.color}`);
                                  
                                  // Add audit log
                                  if (user) {
                                    addAuditLog({
                                      actionType: 'inventory_updated',
                                      performedBy: {
                                        id: user.id,
                                        email: user.email,
                                        role: user.role,
                                        name: `${user.firstName} ${user.lastName}`,
                                      },
                                      targetEntity: {
                                        type: 'inventory',
                                        id: `${product.id}-${variant.id}`,
                                        name: `${product.name} - ${variant.size || 'One Size'} / ${variant.color}`,
                                      },
                                      changes: [{
                                        field: 'quantity',
                                        oldValue: 'N/A',
                                        newValue: quantity.toString(),
                                      }],
                                      metadata: {
                                        warehouse: warehouse.toLowerCase() as 'lorenzo' | 'oroquieta',
                                        notes: `Updated variant stock to ${quantity} units (${reserved} reserved)`,
                                      },
                                    });
                                  }
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      });
                  }
                  // LEGACY: Old system support - If product has size options
                  else if (product.sizeOptions && product.sizeOptions.length > 0) {
                    return product.sizeOptions.map((sizeOption, sizeIndex) => {
                      const lorenzo = sizeOption.warehouseStock.find(w => w.warehouse === 'Lorenzo');
                      const oroquieta = sizeOption.warehouseStock.find(w => w.warehouse === 'Oroquieta');
                      const totalAvailable = sizeOption.warehouseStock.reduce((sum, ws) => sum + (ws.quantity - ws.reserved), 0);
                      const totalReserved = sizeOption.warehouseStock.reduce((sum, ws) => sum + ws.reserved, 0);
                      
                      const stockStatus = totalAvailable === 0 
                        ? { status: 'Out of Stock', variant: 'destructive' as const, color: 'text-red-500' }
                        : totalAvailable <= 5
                        ? { status: 'Low Stock', variant: 'secondary' as const, color: 'text-orange-500' }
                        : { status: 'In Stock', variant: 'default' as const, color: 'text-green-500' };

                      return (
                        <TableRow key={`${product.id}-${sizeIndex}`}>
                          <TableCell className="py-2">
                            <div>
                              <div className="text-sm truncate">{product.name}</div>
                              <div className="text-muted-foreground text-xs">ID: {product.id}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-2">
                            <Badge variant="outline" className="text-xs">{sizeOption.label}cm</Badge>
                            <div className="text-[11px] text-muted-foreground mt-0.5">₱{sizeOption.price.toFixed(2)}</div>
                          </TableCell>
                          <TableCell className="text-center py-2">
                            <Badge variant="outline" className="text-xs">{product.category}</Badge>
                          </TableCell>
                          <TableCell className="text-center py-2">
                            <div>
                              <div className="text-sm">{lorenzo?.quantity || 0}</div>
                              <div className="text-muted-foreground text-xs">
                                {lorenzo?.reserved || 0} rsv
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-2">
                            <div>
                              <div className="text-sm">{oroquieta?.quantity || 0}</div>
                              <div className="text-muted-foreground text-xs">
                                {oroquieta?.reserved || 0} rsv
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-2">
                            <span className={`${stockStatus.color} text-sm`}>{totalAvailable}</span>
                          </TableCell>
                          <TableCell className="text-center py-2">
                            <div className="flex justify-center">
                              {totalReserved > 0 && (
                                <Badge variant="secondary" className="text-xs">{totalReserved}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-2">
                            <Badge variant={stockStatus.variant} className="text-xs">{stockStatus.status}</Badge>
                          </TableCell>
                          <TableCell className="text-center py-2">
                            <BatchHistoryDialog 
                              warehouseStock={sizeOption.warehouseStock}
                              productName={product.name}
                              variantInfo={`${sizeOption.label}cm`}
                            />
                          </TableCell>
                          <TableCell className="text-center py-2">
                            <Dialog 
                              open={isEditDialogOpen && selectedProduct?.id === product.id} 
                              onOpenChange={(open) => {
                                setIsEditDialogOpen(open);
                                if (!open) setSelectedProduct(null);
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Update Inventory</DialogTitle>
                                  <DialogDescription>
                                    Update stock quantities for {product.name}
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedProduct && (
                                  <SizeBasedInventoryForm
                                    product={selectedProduct}
                                    onUpdate={() => {
                                      refreshProducts();
                                      setIsEditDialogOpen(false);
                                    }}
                                    onCancel={() => setIsEditDialogOpen(false)}
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      );
                    });
                  } else {
                    // Product without size options - single row
                    const lorenzo = product.warehouseStock?.find(w => w.warehouse === 'Lorenzo');
                    const oroquieta = product.warehouseStock?.find(w => w.warehouse === 'Oroquieta');
                    const totalAvailable = getTotalAvailableStock(product);
                    const totalReserved = product.warehouseStock?.reduce((sum, ws) => sum + ws.reserved, 0) || 0;
                    const stockStatus = getStockStatus(product);

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="py-2">
                          <div>
                            <div className="text-sm truncate">{product.name}</div>
                            <div className="text-muted-foreground text-xs">ID: {product.id}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <div className="space-y-0.5 flex flex-col items-center">
                            <Badge variant="outline" className="text-xs">
                              {product.dimensions.width}x{product.dimensions.depth}cm
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              H: {product.dimensions.height}cm
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <Badge variant="outline" className="text-xs">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <div>
                            <div className="text-sm">{lorenzo?.quantity || 0}</div>
                            <div className="text-muted-foreground text-xs">
                              {lorenzo?.reserved || 0} rsv
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <div>
                            <div className="text-sm">{oroquieta?.quantity || 0}</div>
                            <div className="text-muted-foreground text-xs">
                              {oroquieta?.reserved || 0} rsv
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <span className={`${stockStatus.color} text-sm`}>{totalAvailable}</span>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          {totalReserved > 0 && (
                            <Badge variant="secondary" className="text-xs">{totalReserved}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <Badge variant={stockStatus.variant} className="text-xs">{stockStatus.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          {product.warehouseStock && (
                            <BatchHistoryDialog 
                              warehouseStock={product.warehouseStock}
                              productName={product.name}
                              variantInfo={`${product.dimensions.width}x${product.dimensions.depth}cm`}
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <Dialog 
                            open={isEditDialogOpen && selectedProduct?.id === product.id} 
                            onOpenChange={(open) => {
                              setIsEditDialogOpen(open);
                              if (!open) setSelectedProduct(null);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Inventory</DialogTitle>
                                <DialogDescription>
                                  Update stock quantities for {product.name}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedProduct && (
                                <InventoryUpdateForm
                                  product={selectedProduct}
                                  onUpdate={(warehouse, quantity, reserved) => {
                                    handleUpdateStock(selectedProduct.id, warehouse, quantity, reserved);
                                    setIsEditDialogOpen(false);
                                  }}
                                  onCancel={() => setIsEditDialogOpen(false)}
                                />
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  }
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Batch History Dialog - Shows all batches with FIFO information
function BatchHistoryDialog({
  warehouseStock,
  productName,
  variantInfo,
}: {
  warehouseStock: WarehouseStock[];
  productName: string;
  variantInfo?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Collect all batches from all warehouses and sort by date (oldest first for FIFO)
  const allBatches = useMemo(() => {
    const batches: (InventoryBatch & { warehouse: 'Lorenzo' | 'Oroquieta' })[] = [];
    
    warehouseStock.forEach(ws => {
      if (ws.batches && ws.batches.length > 0) {
        ws.batches.forEach(batch => {
          batches.push({
            ...batch,
            warehouse: ws.warehouse,
          });
        });
      }
    });
    
    // Sort by receivedAt (oldest first - FIFO order)
    return batches.sort((a, b) => 
      new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
    );
  }, [warehouseStock]);

  const formatFullDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const batchInfo = getMostRecentBatchInfo(warehouseStock);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-auto p-0 text-xs hover:bg-transparent"
        >
          <div className="space-y-0.5 cursor-pointer hover:opacity-70 transition-opacity">
            {batchInfo ? (
              <>
                <div className="text-muted-foreground">
                  {formatTimestamp(batchInfo.timestamp)}
                </div>
                <div className="font-mono text-[10px] text-primary">
                  {batchInfo.batchId}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">Not set</div>
            )}
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Batch History - FIFO Tracking
          </DialogTitle>
          <DialogDescription>
            {productName} {variantInfo && `- ${variantInfo}`}
          </DialogDescription>
        </DialogHeader>

        {allBatches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No batch history available</p>
            <p className="text-sm mt-1">Batches will be created when inventory is updated</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-muted/20 border border-muted rounded-lg p-2.5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-900">
                  <strong>FIFO Order:</strong> Batches are sorted from oldest to newest. 
                  The oldest batch (first in list) should be sold/used first.
                </div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="w-[40px]">#</TableHead>
                      <TableHead>Batch ID</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Received Date</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-center">Rsv</TableHead>
                      <TableHead className="text-center">Avl</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allBatches.map((batch, index) => {
                      const isOldest = index === 0;
                      const isNewest = index === allBatches.length - 1;
                      
                      return (
                        <TableRow 
                          key={`${batch.warehouse}-${batch.batchId}`}
                          className={isOldest ? 'bg-muted/20' : ''}
                        >
                          <TableCell className="text-center py-2">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-xs">{index + 1}</span>
                              {isOldest && (
                                <Badge className="text-[8px] px-1 py-0 h-4 bg-muted-foreground text-background">OLD</Badge>
                              )}
                              {isNewest && (
                                <Badge className="text-[8px] px-1 py-0 h-4 bg-accent-foreground text-accent">NEW</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <span className="font-mono text-xs">{batch.batchId}</span>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1">
                              <Warehouse className={`h-3 w-3 ${batch.warehouse === 'Lorenzo' ? 'text-blue-500' : 'text-green-500'}`} />
                              <span className="text-xs">{batch.warehouse}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <span className="text-xs">{formatFullDate(batch.receivedAt)}</span>
                          </TableCell>
                          <TableCell className="text-center py-2">
                            <Badge variant="outline" className="text-xs">{batch.quantity}</Badge>
                          </TableCell>
                          <TableCell className="text-center py-2">
                            <Badge variant="secondary" className="text-xs">{batch.reserved}</Badge>
                          </TableCell>
                          <TableCell className="text-center py-2">
                            <Badge 
                              variant={batch.available === 0 ? 'destructive' : 'default'}
                              className={`text-xs ${batch.available > 0 ? 'bg-accent-foreground text-accent' : ''}`}
                            >
                              {batch.available}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            <span className="text-xs text-muted-foreground italic">
                              {batch.notes || 'No notes'}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="border rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Total Batches</div>
                <div className="text-xl font-semibold mt-1">{allBatches.length}</div>
              </div>
              <div className="border rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Total Quantity</div>
                <div className="text-xl font-semibold mt-1">
                  {allBatches.reduce((sum, b) => sum + b.quantity, 0)}
                </div>
              </div>
              <div className="border rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Total Available</div>
                <div className="text-xl font-semibold text-green-600 mt-1">
                  {allBatches.reduce((sum, b) => sum + b.available, 0)}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Helper function to format timestamp for FIFO display (used by BatchHistoryDialog)
const formatTimestamp = (timestamp?: string): string => {
  if (!timestamp) return 'Not set';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Show relative time for recent updates
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}w ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months}mo ago`;
  }
  
  // Show actual date for older entries
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Helper function to get most recent batch info from warehouse stock (used by BatchHistoryDialog)
const getMostRecentBatchInfo = (warehouseStock: any[]): { timestamp: string; batchId: string } | null => {
  let mostRecent: { timestamp: string; batchId: string } | null = null;
  let mostRecentTime = 0;
  
  warehouseStock.forEach(ws => {
    // Check batches first
    if (ws.batches && ws.batches.length > 0) {
      // Sort batches by receivedAt descending (most recent first)
      const sortedBatches = [...ws.batches].sort((a, b) => 
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
      );
      
      const latestBatch = sortedBatches[0];
      const batchTime = new Date(latestBatch.receivedAt).getTime();
      
      if (batchTime > mostRecentTime) {
        mostRecentTime = batchTime;
        mostRecent = {
          timestamp: latestBatch.receivedAt,
          batchId: latestBatch.batchId,
        };
      }
    }
    // Fall back to lastUpdated or receivedAt for legacy stock
    else if (ws.lastUpdated || ws.receivedAt) {
      const timestamp = ws.lastUpdated || ws.receivedAt;
      const time = new Date(timestamp).getTime();
      
      if (time > mostRecentTime) {
        mostRecentTime = time;
        mostRecent = {
          timestamp,
          batchId: 'Legacy',
        };
      }
    }
  });
  
  return mostRecent;
};

// NEW: Variant Stock Edit Dialog Component
function VariantStockEditDialog({
  product,
  variant,
  onUpdate,
}: {
  product: Product;
  variant: ProductVariant;
  onUpdate: (warehouse: 'Lorenzo' | 'Oroquieta', quantity: number, reserved: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const lorenzo = variant.warehouseStock.find(w => w.warehouse === 'Lorenzo');
  const oroquieta = variant.warehouseStock.find(w => w.warehouse === 'Oroquieta');

  const [selectedWarehouse, setSelectedWarehouse] = useState<'Lorenzo' | 'Oroquieta'>('Lorenzo');
  const [quantity, setQuantity] = useState(lorenzo?.quantity || 0);
  const [reserved, setReserved] = useState(lorenzo?.reserved || 0);

  // Update form values when warehouse changes
  const handleWarehouseChange = (warehouse: 'Lorenzo' | 'Oroquieta') => {
    setSelectedWarehouse(warehouse);
    const warehouseData = variant.warehouseStock.find(w => w.warehouse === warehouse);
    setQuantity(warehouseData?.quantity || 0);
    setReserved(warehouseData?.reserved || 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity < reserved) {
      toast.error('Total quantity cannot be less than reserved quantity');
      return;
    }
    onUpdate(selectedWarehouse, quantity, reserved);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Variant Stock</DialogTitle>
          <DialogDescription>
            Update stock for {product.name} - {variant.size || 'One Size'} / {variant.color}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="variant-warehouse">Warehouse</Label>
            <Select value={selectedWarehouse} onValueChange={handleWarehouseChange}>
              <SelectTrigger id="variant-warehouse">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lorenzo">
                  <div className="flex items-center gap-2">
                    <Warehouse className="h-4 w-4 text-blue-500" />
                    Lorenzo Warehouse
                  </div>
                </SelectItem>
                <SelectItem value="Oroquieta">
                  <div className="flex items-center gap-2">
                    <Warehouse className="h-4 w-4 text-green-500" />
                    Oroquieta Warehouse
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="variant-quantity">Total Quantity</Label>
            <Input
              id="variant-quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              required
            />
            <p className="text-sm text-muted-foreground">
              Total units available in warehouse
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="variant-reserved">Reserved Quantity</Label>
            <Input
              id="variant-reserved"
              type="number"
              min="0"
              max={quantity}
              value={reserved}
              onChange={(e) => setReserved(parseInt(e.target.value) || 0)}
              required
            />
            <p className="text-sm text-muted-foreground">
              Units reserved for pending orders
            </p>
          </div>

          <div className="p-3 bg-secondary rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available for Sale:</span>
              <span className="font-semibold">{quantity - reserved} units</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Update Stock</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// LEGACY: Inventory Update Form Component
function InventoryUpdateForm({
  product,
  onUpdate,
  onCancel,
}: {
  product: Product;
  onUpdate: (warehouse: 'Lorenzo' | 'Oroquieta', quantity: number, reserved: number) => void;
  onCancel: () => void;
}) {
  const lorenzo = product.warehouseStock.find(w => w.warehouse === 'Lorenzo');
  const oroquieta = product.warehouseStock.find(w => w.warehouse === 'Oroquieta');

  const [selectedWarehouse, setSelectedWarehouse] = useState<'Lorenzo' | 'Oroquieta'>('Lorenzo');
  const [quantity, setQuantity] = useState(lorenzo?.quantity || 0);
  const [reserved, setReserved] = useState(lorenzo?.reserved || 0);

  // Update form values when warehouse changes
  const handleWarehouseChange = (warehouse: 'Lorenzo' | 'Oroquieta') => {
    setSelectedWarehouse(warehouse);
    const warehouseData = product.warehouseStock.find(w => w.warehouse === warehouse);
    setQuantity(warehouseData?.quantity || 0);
    setReserved(warehouseData?.reserved || 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity < reserved) {
      toast.error('Total quantity cannot be less than reserved quantity');
      return;
    }
    onUpdate(selectedWarehouse, quantity, reserved);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="warehouse">Warehouse</Label>
        <Select value={selectedWarehouse} onValueChange={handleWarehouseChange}>
          <SelectTrigger id="warehouse">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Lorenzo">
              <div className="flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-blue-500" />
                Lorenzo Warehouse
              </div>
            </SelectItem>
            <SelectItem value="Oroquieta">
              <div className="flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-green-500" />
                Oroquieta Warehouse
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Total Quantity</Label>
        <Input
          id="quantity"
          type="number"
          min="0"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
          required
        />
        <p className="text-sm text-muted-foreground">
          Total units available in warehouse
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reserved">Reserved Quantity</Label>
        <Input
          id="reserved"
          type="number"
          min="0"
          max={quantity}
          value={reserved}
          onChange={(e) => setReserved(parseInt(e.target.value) || 0)}
          required
        />
        <p className="text-sm text-muted-foreground">
          Units reserved for pending orders
        </p>
      </div>

      <div className="p-3 bg-secondary rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Available for Sale:</span>
          <span className="font-medium">{quantity - reserved} units</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">Update Stock</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

// Size-Based Inventory Update Form Component (for products with size options)
function SizeBasedInventoryForm({
  product,
  onUpdate,
  onCancel,
}: {
  product: Product;
  onUpdate: () => void;
  onCancel: () => void;
}) {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizeOptions?.[0]?.label || '');
  const [selectedWarehouse, setSelectedWarehouse] = useState<'Lorenzo' | 'Oroquieta'>('Lorenzo');
  const [quantity, setQuantity] = useState(0);
  const [reserved, setReserved] = useState(0);

  // Update form values when size or warehouse changes
  useEffect(() => {
    if (product.sizeOptions) {
      const sizeOption = product.sizeOptions.find(s => s.label === selectedSize);
      if (sizeOption) {
        const warehouseData = sizeOption.warehouseStock.find(w => w.warehouse === selectedWarehouse);
        setQuantity(warehouseData?.quantity || 0);
        setReserved(warehouseData?.reserved || 0);
      }
    }
  }, [selectedSize, selectedWarehouse, product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity < reserved) {
      toast.error('Total quantity cannot be less than reserved quantity');
      return;
    }
    updateWarehouseStock(product.id, selectedWarehouse, quantity, reserved, selectedSize);
    toast.success(`Stock updated for ${product.name} - ${selectedSize} at ${selectedWarehouse} warehouse`);
    onUpdate();
  };

  if (!product.sizeOptions || product.sizeOptions.length === 0) {
    return (
      <InventoryUpdateForm
        product={product}
        onUpdate={(warehouse, quantity, reserved) => {
          updateWarehouseStock(product.id, warehouse, quantity, reserved);
          onUpdate();
        }}
        onCancel={onCancel}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="size">Size</Label>
        <Select value={selectedSize} onValueChange={setSelectedSize}>
          <SelectTrigger id="size">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {product.sizeOptions.map((sizeOption) => (
              <SelectItem key={sizeOption.label} value={sizeOption.label}>
                {sizeOption.label} - ₱{sizeOption.price.toFixed(2)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="warehouse">Warehouse</Label>
        <Select value={selectedWarehouse} onValueChange={(value: 'Lorenzo' | 'Oroquieta') => setSelectedWarehouse(value)}>
          <SelectTrigger id="warehouse">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Lorenzo">
              <div className="flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-blue-500" />
                Lorenzo Warehouse
              </div>
            </SelectItem>
            <SelectItem value="Oroquieta">
              <div className="flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-green-500" />
                Oroquieta Warehouse
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Total Quantity</Label>
        <Input
          id="quantity"
          type="number"
          min="0"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
          required
        />
        <p className="text-sm text-muted-foreground">
          Total units available in warehouse for this size
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reserved">Reserved Quantity</Label>
        <Input
          id="reserved"
          type="number"
          min="0"
          max={quantity}
          value={reserved}
          onChange={(e) => setReserved(parseInt(e.target.value) || 0)}
          required
        />
        <p className="text-sm text-muted-foreground">
          Units reserved for pending orders
        </p>
      </div>

      <div className="p-3 bg-secondary rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Available for Sale:</span>
          <span className="font-medium">{quantity - reserved} units</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">Update Stock</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}