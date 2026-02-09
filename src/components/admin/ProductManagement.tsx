// @ts-nocheck
// TODO: Fix type errors for Product interface
"use client";

import React, { useState, useMemo } from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import {
  Edit,
  Trash2,
  Package,
  AlertCircle,
  Upload,
  X,
  Check,
  Settings2,
  Copy,
  Settings,
  Plus,
  Tags,
  Palette,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import type { Product, ProductVariant } from "@/models";
import type { SizeOption } from "../../lib/products"; // TODO: Move to models
import {
  getPriceRangeText,
  hasSizeOptions as checkHasSizeOptions,
} from "../../lib/productUtils";
import {
  generateVariantId,
  getProductSizes,
  getProductColors,
  getVariantStock,
} from "../../lib/products";
import {
  getSubCategoriesByMainCategory,
  getMaterials,
  getColors,
  getTaxonomies,
  addSubCategory,
  updateSubCategory,
  deleteSubCategory,
  addMaterial,
  updateMaterial,
  deleteMaterial,
  addColor,
  updateColor,
  deleteColor,
  type SubCategory,
  type Material,
  type Color,
} from "../../lib/taxonomies";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useAuditLog } from "../../hooks/useAuditLog";
import { AttributesManager } from "./AttributesManager";

interface ProductManagementProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, "id">) => void;
  onUpdateProduct: (id: number, product: Partial<Product>) => void;
  onDeleteProduct: (id: number) => void;
  initialFilter?: string;
  readOnly?: boolean; // For roles that can only view products
}

export function ProductManagement({
  products = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  initialFilter = "all",
  readOnly = false,
}: ProductManagementProps) {
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive" | "featured" | "out-of-stock"
  >(
    initialFilter === "featured"
      ? "featured"
      : initialFilter === "out-of-stock"
        ? "out-of-stock"
        : "active",
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{
    id: number;
    name: string;
    isActive: boolean;
  } | null>(null);

  // Attributes management state
  const [showAttributesDialog, setShowAttributesDialog] = useState(false);
  const [attributeSearchTerm, setAttributeSearchTerm] = useState("");
  const [showInactiveAttributes, setShowInactiveAttributes] = useState(false);
  const [taxonomyRefreshKey, setTaxonomyRefreshKey] = useState(0);
  const { logAction } = useAuditLog();

  // Variant management state
  const [showVariantDialog, setShowVariantDialog] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(
    null,
  );
  const [variantForm, setVariantForm] = useState<Omit<ProductVariant, "id">>({
    size: null,
    color: "",
    price: 0,
    dimensions: { width: 0, height: 0, depth: 0 },
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 0, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 0, reserved: 0 },
    ],
    active: true,
  });

  // Category filter (main categories are fixed: chairs and tables)
  const mainCategories = [
    { id: "chairs", name: "chairs", display: "Chairs" },
    { id: "tables", name: "tables", display: "Tables" },
  ];
  const [showCategoryPopover, setShowCategoryPopover] = useState(false);

  const [showStatusFilterPopover, setShowStatusFilterPopover] = useState(false);

  const [productForm, setProductForm] = useState<Omit<Product, "id">>({
    name: "",
    price: 0,
    description: "",
    category: "chairs",
    subCategory: "",
    imageUrl: "",
    images: [],
    material: "",
    dimensions: { width: 0, height: 0, depth: 0 },
    inStock: true,
    featured: false,
    variants: [], // NEW: Variant system
    // Legacy fields (kept for backward compatibility)
    warehouseStock: [
      { warehouse: "Lorenzo", quantity: 0, reserved: 0 },
      { warehouse: "Oroquieta", quantity: 0, reserved: 0 },
    ],
    sizeOptions: [],
  });

  // Load taxonomies for dropdowns (must be after productForm state declaration)
  // Map category names to their IDs for taxonomy lookup
  const categoryIdMap: Record<string, string> = {
    chairs: "cat-chairs",
    tables: "cat-tables",
  };

  const availableSubCategories = useMemo(() => {
    const categoryId =
      categoryIdMap[productForm.category] || productForm.category;
    return getSubCategoriesByMainCategory(categoryId);
  }, [productForm.category, taxonomyRefreshKey]);

  const availableMaterials = useMemo(
    () => getMaterials(),
    [taxonomyRefreshKey],
  );
  const availableColors = useMemo(() => getColors(), [taxonomyRefreshKey]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      price: 0,
      description: "",
      category: "chairs",
      subCategory: "",
      imageUrl: "",
      images: [],
      material: "",
      dimensions: { width: 0, height: 0, depth: 0 }, // Default dimensions (used only if no size options)
      inStock: true,
      featured: false,
      colors: [],
      warehouseStock: [
        { warehouse: "Lorenzo", quantity: 0, reserved: 0 },
        { warehouse: "Oroquieta", quantity: 0, reserved: 0 },
      ],
      sizeOptions: [],
    });
    setShowProductDialog(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);

    // Migrate size options to new warehouseStock structure if needed
    const migratedSizeOptions = (product.sizeOptions || []).map((size) => {
      // If size already has warehouseStock, use it
      if (size.warehouseStock && Array.isArray(size.warehouseStock)) {
        return size;
      }

      // Otherwise, migrate from old structure (lorenzoStock/oroquietaStock)
      return {
        ...size,
        warehouseStock: [
          {
            warehouse: "Lorenzo",
            quantity: (size as any).lorenzoStock || 0,
            reserved: 0,
          },
          {
            warehouse: "Oroquieta",
            quantity: (size as any).oroquietaStock || 0,
            reserved: 0,
          },
        ],
      };
    });

    setProductForm({
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      subCategory: product.subCategory,
      imageUrl: product.imageUrl,
      images: product.images || [product.imageUrl],
      material: product.material,
      dimensions: product.dimensions,
      inStock: product.inStock,
      featured: product.featured,
      variants: product.variants || [], // Load variants
      // Legacy fields
      warehouseStock: product.warehouseStock || [
        { warehouse: "Lorenzo", quantity: 0, reserved: 0 },
        { warehouse: "Oroquieta", quantity: 0, reserved: 0 },
      ],
      sizeOptions: migratedSizeOptions,
    });
    setShowProductDialog(true);
  };

  // Variant Management Handlers
  const handleAddVariant = () => {
    setEditingVariant(null);
    setVariantForm({
      size: null,
      color: "",
      price: productForm.price || 0,
      dimensions: productForm.dimensions,
      warehouseStock: [
        { warehouse: "Lorenzo", quantity: 0, reserved: 0 },
        { warehouse: "Oroquieta", quantity: 0, reserved: 0 },
      ],
      active: true,
    });
    setShowVariantDialog(true);
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setVariantForm({
      size: variant.size,
      color: variant.color,
      price: variant.price,
      dimensions: variant.dimensions,
      warehouseStock: [...variant.warehouseStock],
      active: variant.active,
      sku: variant.sku,
    });
    setShowVariantDialog(true);
  };

  const handleSaveVariant = () => {
    // Validation
    if (!variantForm.color.trim()) {
      toast.error("Color is required");
      return;
    }

    if (variantForm.price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    if (editingVariant) {
      // Update existing variant
      const updatedVariants = (productForm.variants || []).map((v) =>
        v.id === editingVariant.id
          ? { ...variantForm, id: editingVariant.id }
          : v,
      );
      setProductForm({ ...productForm, variants: updatedVariants });
      toast.success("Variant updated successfully", {
        description: "The product variant has been saved.",
      });
    } else {
      // Add new variant
      const variantId = generateVariantId(variantForm.size, variantForm.color);

      // Check for duplicates
      const isDuplicate = (productForm.variants || []).some(
        (v) => v.id === variantId && v.active,
      );
      if (isDuplicate) {
        toast.error(
          "A variant with this size and color combination already exists",
        );
        return;
      }

      const newVariant: ProductVariant = { ...variantForm, id: variantId };
      setProductForm({
        ...productForm,
        variants: [...(productForm.variants || []), newVariant],
      });
      toast.success("Variant added successfully", {
        description: "The new variant is now available for purchase.",
      });
    }

    setShowVariantDialog(false);
  };

  const handleDeleteVariant = (variantId: string) => {
    const updatedVariants = (productForm.variants || []).map((v) =>
      v.id === variantId ? { ...v, active: false } : v,
    );
    setProductForm({ ...productForm, variants: updatedVariants });
    toast.success("Variant deactivated");
  };

  const handleReactivateVariant = (variantId: string) => {
    const updatedVariants = (productForm.variants || []).map((v) =>
      v.id === variantId ? { ...v, active: true } : v,
    );
    setProductForm({ ...productForm, variants: updatedVariants });
    toast.success("Variant reactivated");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Limit to 5 images
    if (fileArray.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    // Convert files to data URLs
    const promises = fileArray.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (typeof result === "string") {
            resolve(result);
          } else {
            reject(new Error("Failed to read file"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises)
      .then((dataUrls) => {
        setProductForm((prev) => ({
          ...prev,
          images: [...prev.images, ...dataUrls],
          imageUrl: prev.imageUrl || dataUrls[0], // Set first image as main if not set
        }));
        toast.success(`${dataUrls.length} image(s) uploaded`);
      })
      .catch((error) => {
        console.error("Error uploading images:", error);
        toast.error("Failed to upload images");
      });
  };

  const handleRemoveImage = (index: number) => {
    setProductForm((prev) => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: newImages,
        imageUrl: newImages[0] || "", // Update main image if removed
      };
    });
  };

  const handleSaveProduct = () => {
    if (
      !productForm.name ||
      !productForm.price ||
      productForm.images.length === 0
    ) {
      toast.error(
        "Please fill in all required fields and upload at least one image",
      );
      return;
    }

    // Validate taxonomy fields
    if (!productForm.subCategory) {
      toast.error("Please select a sub-category");
      return;
    }

    if (!productForm.material) {
      toast.error("Please select a material");
      return;
    }

    // Validate variants
    if (productForm.variants && productForm.variants.length > 0) {
      const activeVariants = productForm.variants.filter((v) => v.active);
      if (activeVariants.length === 0) {
        toast.error("Product must have at least one active variant");
        return;
      }
    } else {
      toast.error(
        "Please add at least one variant (size/color combination) for this product",
      );
      return;
    }

    // Calculate total stock to update inStock status
    let totalStock = 0;

    // NEW: Use variant system if available
    if (productForm.variants && productForm.variants.length > 0) {
      totalStock = productForm.variants.reduce((total, variant) => {
        if (!variant.active) return total;
        return (
          total +
          variant.warehouseStock.reduce(
            (sum, ws) => sum + (ws.quantity - ws.reserved),
            0,
          )
        );
      }, 0);
    }
    // LEGACY: Old system support
    else if (productForm.sizeOptions && productForm.sizeOptions.length > 0) {
      totalStock = productForm.sizeOptions.reduce((total, sizeOption) => {
        return (
          total +
          sizeOption.warehouseStock.reduce(
            (sum, ws) => sum + (ws.quantity - ws.reserved),
            0,
          )
        );
      }, 0);
    } else if (productForm.warehouseStock) {
      totalStock = productForm.warehouseStock.reduce(
        (sum, ws) => sum + (ws.quantity - ws.reserved),
        0,
      );
    }

    const updatedForm = {
      ...productForm,
      imageUrl: productForm.images[0], // Use first image as main
      inStock: totalStock > 0,
      active: editingProduct ? editingProduct.active : true, // Preserve active status or default to true
    };

    if (editingProduct) {
      onUpdateProduct(editingProduct.id, updatedForm);
      toast.success("Product updated successfully");
    } else {
      onAddProduct(updatedForm);
      toast.success("Product added successfully");
    }

    setShowProductDialog(false);
  };

  const handleToggleActive = (
    id: number,
    name: string,
    currentStatus: boolean,
  ) => {
    setProductToDelete({ id, name, isActive: currentStatus });
    setShowDeleteDialog(true);
  };

  const confirmToggleActive = () => {
    if (!productToDelete) return;

    const { id, isActive } = productToDelete;

    onUpdateProduct(id, { active: !isActive });

    setShowDeleteDialog(false);
    setProductToDelete(null);
  };

  const getTotalStock = (product: Product) => {
    if (!product.warehouseStock) return 0;
    return product.warehouseStock.reduce(
      (sum, ws) => sum + (ws.quantity - ws.reserved),
      0,
    );
  };

  const filteredProducts = products.filter((product) => {
    // Improved search with word-based matching
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const words = query.split(/\s+/);
      const nameLower = product.name.toLowerCase();
      const descLower = product.description.toLowerCase();
      const subCategoryLower = product.subCategory.toLowerCase();

      // Check if all search words appear in name, description, or subcategory
      matchesSearch = words.every(
        (word) =>
          nameLower.includes(word) ||
          descLower.includes(word) ||
          subCategoryLower.includes(word),
      );
    }

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    const totalStock = getTotalStock(product);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && product.active !== false) ||
      (statusFilter === "inactive" && product.active === false) ||
      (statusFilter === "featured" && product.featured) ||
      (statusFilter === "out-of-stock" && totalStock === 0);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const lowStockProducts = products.filter((p) => {
    const stock = getTotalStock(p);
    return stock > 0 && stock <= 10;
  });

  const outOfStockProducts = products.filter((p) => getTotalStock(p) === 0);

  return (
    <div className="space-y-6">
      {/* Stock Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {outOfStockProducts.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="text-red-700">Out of Stock</h4>
                    <p className="text-muted-foreground">
                      {outOfStockProducts.length} product
                      {outOfStockProducts.length > 1 ? "s are" : " is"} out of
                      stock
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {lowStockProducts.length > 0 && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h4 className="text-orange-700">Low Stock Alert</h4>
                    <p className="text-muted-foreground">
                      {lowStockProducts.length} product
                      {lowStockProducts.length > 1 ? "s have" : " has"} low
                      stock (≤10 units)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Catalog</CardTitle>
              <CardDescription>Manage your furniture inventory</CardDescription>
            </div>
            {!readOnly && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAttributesDialog(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Attributes
                </Button>
                <Button onClick={handleAddProduct}>Add Product</Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Category Filter (Simple) */}
            <Popover
              open={showCategoryPopover}
              onOpenChange={setShowCategoryPopover}
            >
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-between">
                  {categoryFilter === "all"
                    ? "All Categories"
                    : mainCategories.find((c) => c.name === categoryFilter)
                        ?.display || categoryFilter}
                  <Settings2 className="h-4 w-4 ml-2 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <div className="space-y-1">
                  {/* Header */}
                  <div className="p-3 border-b">
                    <p className="text-sm font-medium">Filter by Category</p>
                  </div>

                  {/* Category List */}
                  <div className="p-2 space-y-1">
                    <Button
                      variant={categoryFilter === "all" ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setCategoryFilter("all");
                        setShowCategoryPopover(false);
                      }}
                    >
                      All Categories
                    </Button>
                    {mainCategories.map((cat) => (
                      <Button
                        key={cat.id}
                        variant={
                          categoryFilter === cat.name ? "secondary" : "ghost"
                        }
                        className="w-full justify-start"
                        onClick={() => {
                          setCategoryFilter(cat.name);
                          setShowCategoryPopover(false);
                        }}
                      >
                        {cat.display}
                      </Button>
                    ))}
                  </div>

                  {/* Note about managing categories */}
                  {!readOnly && (
                    <div className="p-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        To manage sub-categories (Dining Chairs, Bar Stools,
                        etc.), use <strong>Manage Attributes</strong> button
                        above.
                      </p>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Popover
              open={showStatusFilterPopover}
              onOpenChange={setShowStatusFilterPopover}
            >
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-between">
                  {statusFilter === "all"
                    ? "All Products"
                    : statusFilter.charAt(0).toUpperCase() +
                      statusFilter.slice(1)}
                  <Settings2 className="h-4 w-4 ml-2 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <div className="space-y-1">
                  {/* Header */}
                  <div className="p-3 border-b">
                    <p className="text-sm font-medium">Select Status</p>
                  </div>

                  {/* Status List */}
                  <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
                    <Button
                      variant={statusFilter === "all" ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setStatusFilter("all");
                        setShowStatusFilterPopover(false);
                      }}
                    >
                      All Products
                    </Button>
                    <Button
                      variant={
                        statusFilter === "active" ? "secondary" : "ghost"
                      }
                      className="w-full justify-start"
                      onClick={() => {
                        setStatusFilter("active");
                        setShowStatusFilterPopover(false);
                      }}
                    >
                      Active Only
                    </Button>
                    <Button
                      variant={
                        statusFilter === "inactive" ? "secondary" : "ghost"
                      }
                      className="w-full justify-start"
                      onClick={() => {
                        setStatusFilter("inactive");
                        setShowStatusFilterPopover(false);
                      }}
                    >
                      Inactive Only
                    </Button>
                    <Button
                      variant={
                        statusFilter === "featured" ? "secondary" : "ghost"
                      }
                      className="w-full justify-start"
                      onClick={() => {
                        setStatusFilter("featured");
                        setShowStatusFilterPopover(false);
                      }}
                    >
                      Featured Only
                    </Button>
                    <Button
                      variant={
                        statusFilter === "out-of-stock" ? "secondary" : "ghost"
                      }
                      className="w-full justify-start"
                      onClick={() => {
                        setStatusFilter("out-of-stock");
                        setShowStatusFilterPopover(false);
                      }}
                    >
                      Out of Stock
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">Product</TableHead>
                  <TableHead className="text-center w-[120px]">
                    Category
                  </TableHead>
                  <TableHead className="text-center w-[140px]">Price</TableHead>
                  <TableHead className="text-center w-[100px]">Stock</TableHead>
                  <TableHead className="text-center w-[140px]">
                    Status
                  </TableHead>
                  <TableHead className="text-center w-[120px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const totalStock = getTotalStock(product);
                    const isLowStock = totalStock > 0 && totalStock <= 10;

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded overflow-hidden bg-secondary flex-shrink-0">
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm truncate">{product.name}</p>
                              <p className="text-muted-foreground text-xs">
                                {product.subCategory}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-2 text-sm">
                          {getPriceRangeText(product)}
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <span
                            className={`whitespace-nowrap text-sm ${totalStock === 0 ? "text-red-500" : isLowStock ? "text-orange-500" : ""}`}
                          >
                            {totalStock}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <div className="flex gap-1.5 justify-center flex-wrap">
                            {product.featured && (
                              <Badge variant="secondary" className="text-xs">
                                Featured
                              </Badge>
                            )}
                            {product.active === false && (
                              <Badge variant="destructive" className="text-xs">
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          {!readOnly ? (
                            <div className="flex gap-2 justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={
                                  product.active === false ? "outline" : "ghost"
                                }
                                size="sm"
                                onClick={() =>
                                  handleToggleActive(
                                    product.id,
                                    product.name,
                                    product.active !== false,
                                  )
                                }
                              >
                                {product.active === false ? (
                                  "Reactivate"
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              View only
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Update product details"
                : "Add a new product to your catalog"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Product Images */}
            <div className="space-y-2">
              <Label>Product Images * (Max 5 images)</Label>
              <div className="grid grid-cols-5 gap-4">
                {productForm.images.map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square border rounded-lg overflow-hidden group"
                  >
                    <img
                      src={image}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">
                        Main Image
                      </div>
                    )}
                  </div>
                ))}
                {productForm.images.length < 5 && (
                  <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-secondary/50 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground text-center px-2">
                      Upload Image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                First image will be used as the main product image
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  placeholder="e.g., Modern Wooden Chair"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productPrice">Price (₱) *</Label>
                <Input
                  id="productPrice"
                  value={productForm.price || ""}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productDescription">Description *</Label>
              <Textarea
                id="productDescription"
                value={productForm.description}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    description: e.target.value,
                  })
                }
                placeholder="Detailed product description..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productCategory">Category *</Label>
                <Select
                  value={productForm.category}
                  onValueChange={(value: "chairs" | "tables") =>
                    setProductForm({ ...productForm, category: value })
                  }
                >
                  <SelectTrigger id="productCategory">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chairs">Chairs</SelectItem>
                    <SelectItem value="tables">Tables</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="productSubCategory">Sub-Category *</Label>
                <Select
                  value={productForm.subCategory}
                  onValueChange={(value) =>
                    setProductForm({ ...productForm, subCategory: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubCategories.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No sub-categories available. Add them in the Attributes
                        tab.
                      </div>
                    ) : (
                      availableSubCategories.map((subCat) => (
                        <SelectItem key={subCat.id} value={subCat.name}>
                          {subCat.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {availableSubCategories.length} options available • Manage in
                  Attributes tab
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productMaterial">Material *</Label>
              <Select
                value={productForm.material}
                onValueChange={(value) =>
                  setProductForm({ ...productForm, material: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {availableMaterials.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No materials available. Add them in the Attributes tab.
                    </div>
                  ) : (
                    availableMaterials.map((material) => (
                      <SelectItem key={material.id} value={material.name}>
                        {material.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {availableMaterials.length} options available • Manage in
                Attributes tab
              </p>
            </div>

            {/* NEW: Variant Management System */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Product Variants *</Label>
                  <p className="text-sm text-muted-foreground">
                    Manage size and color combinations with individual stock
                    tracking
                  </p>
                </div>
                {!readOnly && (
                  <Button size="sm" onClick={handleAddVariant} type="button">
                    Add Variant
                  </Button>
                )}
              </div>

              {/* Variants List */}
              {productForm.variants && productForm.variants.length > 0 ? (
                <div className="space-y-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">Size</TableHead>
                        <TableHead className="text-center">Color</TableHead>
                        <TableHead className="text-center">Price</TableHead>
                        <TableHead className="text-center">
                          Lorenzo Stock
                        </TableHead>
                        <TableHead className="text-center">
                          Oroquieta Stock
                        </TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        {!readOnly && (
                          <TableHead className="text-center">Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productForm.variants.map((variant) => {
                        const lorenzoStock = variant.warehouseStock.find(
                          (ws) => ws.warehouse === "Lorenzo",
                        );
                        const oroquietaStock = variant.warehouseStock.find(
                          (ws) => ws.warehouse === "Oroquieta",
                        );
                        const totalStock =
                          (lorenzoStock?.quantity || 0) +
                          (oroquietaStock?.quantity || 0);

                        return (
                          <TableRow
                            key={variant.id}
                            className={!variant.active ? "opacity-50" : ""}
                          >
                            <TableCell className="text-center">
                              {variant.size || "One Size"}
                            </TableCell>
                            <TableCell className="text-center">
                              {variant.color}
                            </TableCell>
                            <TableCell className="text-center">
                              ₱{variant.price.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center">
                              {lorenzoStock?.quantity || 0}
                            </TableCell>
                            <TableCell className="text-center">
                              {oroquietaStock?.quantity || 0}
                            </TableCell>
                            <TableCell
                              className={`text-center ${totalStock === 0 ? "text-red-500" : ""}`}
                            >
                              {totalStock}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  variant.active ? "default" : "secondary"
                                }
                              >
                                {variant.active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            {!readOnly && (
                              <TableCell className="text-center">
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditVariant(variant)}
                                    type="button"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  {variant.active ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteVariant(variant.id)
                                      }
                                      type="button"
                                    >
                                      <Trash2 className="h-3 w-3 text-red-500" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleReactivateVariant(variant.id)
                                      }
                                      type="button"
                                    >
                                      <Check className="h-3 w-3 text-green-500" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-2">
                    No variants added yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Add size and color combinations with individual stock levels
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="inStock"
                  checked={productForm.inStock}
                  onCheckedChange={(checked) =>
                    setProductForm({
                      ...productForm,
                      inStock: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="inStock" className="cursor-pointer">
                  In Stock
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="featured"
                  checked={productForm.featured}
                  onCheckedChange={(checked) =>
                    setProductForm({
                      ...productForm,
                      featured: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="featured" className="cursor-pointer">
                  Featured Product
                </Label>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setShowProductDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveProduct}>
                {editingProduct ? "Update Product" : "Add Product"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Variant Dialog */}
      <Dialog open={showVariantDialog} onOpenChange={setShowVariantDialog}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {editingVariant ? "Edit Variant" : "Add New Variant"}
            </DialogTitle>
            <DialogDescription>
              {editingVariant
                ? "Update variant details"
                : "Add a new size/color combination"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="variantSize">Size (Optional)</Label>
                <Input
                  id="variantSize"
                  value={variantForm.size || ""}
                  onChange={(e) =>
                    setVariantForm({
                      ...variantForm,
                      size: e.target.value || null,
                    })
                  }
                  placeholder="e.g., Small, Large, 120x60cm (leave empty for one-size)"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for products without size variations
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="variantColor">Color *</Label>
                <Select
                  value={variantForm.color}
                  onValueChange={(value) =>
                    setVariantForm({ ...variantForm, color: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColors.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No colors available. Add them in the Attributes tab.
                      </div>
                    ) : (
                      availableColors.map((color) => (
                        <SelectItem key={color.id} value={color.name}>
                          {color.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {availableColors.length} options available • Manage in
                  Attributes tab
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="variantPrice">Price (₱) *</Label>
              <Input
                id="variantPrice"
                type="number"
                min="0"
                step="0.01"
                value={variantForm.price || ""}
                onChange={(e) =>
                  setVariantForm({
                    ...variantForm,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Dimensions (cm)</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="variantWidth">Width</Label>
                  <Input
                    id="variantWidth"
                    type="number"
                    min="0"
                    value={variantForm.dimensions.width || ""}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        dimensions: {
                          ...variantForm.dimensions,
                          width: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variantHeight">Height</Label>
                  <Input
                    id="variantHeight"
                    type="number"
                    min="0"
                    value={variantForm.dimensions.height || ""}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        dimensions: {
                          ...variantForm.dimensions,
                          height: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variantDepth">Depth</Label>
                  <Input
                    id="variantDepth"
                    type="number"
                    min="0"
                    value={variantForm.dimensions.depth || ""}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        dimensions: {
                          ...variantForm.dimensions,
                          depth: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Warehouse Stock</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="variantLorenzoStock">Lorenzo Warehouse</Label>
                  <Input
                    id="variantLorenzoStock"
                    type="number"
                    min="0"
                    value={variantForm.warehouseStock[0].quantity}
                    onChange={(e) => {
                      const newStock = [...variantForm.warehouseStock];
                      newStock[0].quantity = parseInt(e.target.value) || 0;
                      setVariantForm({
                        ...variantForm,
                        warehouseStock: newStock,
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variantOroquietaStock">
                    Oroquieta Warehouse
                  </Label>
                  <Input
                    id="variantOroquietaStock"
                    type="number"
                    min="0"
                    value={variantForm.warehouseStock[1].quantity}
                    onChange={(e) => {
                      const newStock = [...variantForm.warehouseStock];
                      newStock[1].quantity = parseInt(e.target.value) || 0;
                      setVariantForm({
                        ...variantForm,
                        warehouseStock: newStock,
                      });
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setShowVariantDialog(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveVariant} type="button">
                {editingVariant ? "Update Variant" : "Add Variant"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {productToDelete?.isActive ? "deactivate" : "reactivate"} the
              product "{productToDelete?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleActive}>
              {productToDelete?.isActive ? "Deactivate" : "Reactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Attributes Management Dialog */}
      <Dialog
        open={showAttributesDialog}
        onOpenChange={(open) => {
          setShowAttributesDialog(open);
          if (!open) {
            // Refresh taxonomy dropdowns when closing
            setTaxonomyRefreshKey((prev) => prev + 1);
          }
        }}
      >
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-6">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle>Manage Product Attributes</DialogTitle>
            <DialogDescription>
              Centrally manage categories, materials, and colors. Changes
              instantly reflect throughout the application including
              customer-side filters, product forms, and all dropdown selections.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden min-h-0">
            <AttributesManager
              onClose={() => {
                setShowAttributesDialog(false);
                setTaxonomyRefreshKey((prev) => prev + 1);
              }}
              logAction={logAction}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
