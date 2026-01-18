'use client';

import { useState, useMemo, useEffect } from 'react';
import { Product, products as allProducts, getVariantStock } from '../lib/products';
import { ProductCard } from '../components/ProductCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { Button } from '../components/ui/button';
import { Filter, X } from 'lucide-react';
import { getSubCategories, getMaterials, getColors } from '../lib/taxonomies';

interface ProductsPageProps {
  category?: 'chairs' | 'tables';
  onProductClick: (id: number) => void;
}

export function ProductsPage({ category, onProductClick }: ProductsPageProps) {
  const [sortBy, setSortBy] = useState('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(category ? [category] : []);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Update selected categories when category prop changes
  useEffect(() => {
    if (category) {
      setSelectedCategories([category]);
    } else {
      setSelectedCategories([]);
    }
  }, [category]);

  const filteredProducts = useMemo(() => {
    // Start with all active products
    let filtered = allProducts.filter(p => p.active);

    // Filter by main category
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(p => selectedCategories.includes(p.category));
    }

    // Filter by subcategory
    if (selectedSubCategories.length > 0) {
      filtered = filtered.filter(p => selectedSubCategories.includes(p.subCategory));
    }

    // Filter by material
    if (selectedMaterials.length > 0) {
      filtered = filtered.filter(p => selectedMaterials.includes(p.material));
    }

    // Filter by color - check variants
    if (selectedColors.length > 0) {
      filtered = filtered.filter(p => {
        // Check if product has variants with selected colors
        if (p.variants && p.variants.length > 0) {
          return p.variants.some(v => v.active && selectedColors.includes(v.color));
        }
        // Legacy products without variants won't be filtered by color
        return false;
      });
    }

    // Filter by price
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Filter by stock
    if (inStockOnly) {
      filtered = filtered.filter(p => {
        // Check variant-based products first
        if (p.variants && p.variants.length > 0) {
          return p.variants.some(v => v.active && getVariantStock(v) > 0);
        }
        // Fallback to old system for backward compatibility
        if (p.warehouseStock) {
          const totalStock = p.warehouseStock.reduce((sum, stock) => 
            sum + (stock.quantity - stock.reserved), 0
          );
          return totalStock > 0;
        }
        return false;
      });
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
        filtered.sort((a, b) => b.id - a.id);
        break;
      default:
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return filtered;
  }, [selectedCategories, selectedSubCategories, selectedMaterials, selectedColors, priceRange, inStockOnly, sortBy]);

  // Extract unique values for filters - Use taxonomy system for dynamic filtering
  const availableProducts = allProducts.filter(p => p.active);

  // Get categories from taxonomy - always show chairs and tables
  const categories = useMemo(() => {
    return ['chairs', 'tables'];
  }, []);

  // Get subcategories from taxonomy (only active ones)
  const subCategories = useMemo(() => {
    return getSubCategories(false).map(sc => sc.name);
  }, []);

  // Get materials from taxonomy (only active ones)
  const materials = useMemo(() => {
    return getMaterials(false).map(m => m.name);
  }, []);

  // Get colors from taxonomy (only active ones)
  const colors = useMemo(() => {
    return getColors(false).map(c => c.name);
  }, []);

  const maxPrice = useMemo(() => {
    return Math.max(...availableProducts.map(p => p.price), 5000);
  }, [availableProducts]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleSubCategory = (subCat: string) => {
    setSelectedSubCategories(prev =>
      prev.includes(subCat) ? prev.filter(c => c !== subCat) : [...prev, subCat]
    );
  };

  const toggleMaterial = (material: string) => {
    setSelectedMaterials(prev =>
      prev.includes(material) ? prev.filter(m => m !== material) : [...prev, material]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedSubCategories([]);
    setSelectedMaterials([]);
    setSelectedColors([]);
    setPriceRange([0, maxPrice]);
    setInStockOnly(false);
  };

  const hasActiveFilters = 
    selectedCategories.length > 0 ||
    selectedSubCategories.length > 0 ||
    selectedMaterials.length > 0 ||
    selectedColors.length > 0 ||
    priceRange[0] > 0 || 
    priceRange[1] < maxPrice ||
    inStockOnly;

  const title = category 
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : 'All Products';

  return (
    <div className="min-h-screen bg-background py-6 sm:py-8 lg:py-12">
      <div className="container max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-16">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="mb-2">{title}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-muted-foreground">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="lg:hidden w-full sm:w-auto"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-card rounded-lg border p-4 space-y-4 lg:sticky lg:top-24">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm">
                  <Filter className="h-4 w-4" />
                  Filters
                </h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={clearFilters}>
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* In Stock Only */}
              <div className="flex items-center space-x-2 py-1">
                <Checkbox
                  id="in-stock"
                  checked={inStockOnly}
                  onCheckedChange={(checked) => setInStockOnly(checked as boolean)}
                />
                <Label htmlFor="in-stock" className="cursor-pointer text-sm">
                  In Stock Only
                </Label>
              </div>

              {/* Categories - Always show */}
              {categories.length > 1 && (
                <div className="space-y-2 pb-3 border-b">
                  <h4 className="text-xs uppercase tracking-wide text-muted-foreground">Product Type</h4>
                  <div className="space-y-1.5">
                    {categories.map((cat) => (
                      <div key={cat} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cat-${cat}`}
                          checked={selectedCategories.includes(cat)}
                          onCheckedChange={() => toggleCategory(cat)}
                        />
                        <Label htmlFor={`cat-${cat}`} className="cursor-pointer capitalize text-sm">
                          {cat}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subcategories */}
              {subCategories.length > 0 && (
                <div className="space-y-2 pb-3 border-b">
                  <h4 className="text-xs uppercase tracking-wide text-muted-foreground">Category</h4>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {subCategories.map((subCat) => (
                      <div key={subCat} className="flex items-center space-x-2">
                        <Checkbox
                          id={`sub-${subCat}`}
                          checked={selectedSubCategories.includes(subCat)}
                          onCheckedChange={() => toggleSubCategory(subCat)}
                        />
                        <Label htmlFor={`sub-${subCat}`} className="cursor-pointer text-sm leading-tight">
                          {subCat}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Materials */}
              {materials.length > 1 && (
                <div className="space-y-2 pb-3 border-b">
                  <h4 className="text-xs uppercase tracking-wide text-muted-foreground">Material</h4>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {materials.map((material) => (
                      <div key={material} className="flex items-center space-x-2">
                        <Checkbox
                          id={`mat-${material}`}
                          checked={selectedMaterials.includes(material)}
                          onCheckedChange={() => toggleMaterial(material)}
                        />
                        <Label htmlFor={`mat-${material}`} className="cursor-pointer text-sm leading-tight">
                          {material}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {colors.length > 1 && (
                <div className="space-y-2 pb-3 border-b">
                  <h4 className="text-xs uppercase tracking-wide text-muted-foreground">Color</h4>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {colors.map((color) => (
                      <div key={color} className="flex items-center space-x-2">
                        <Checkbox
                          id={`color-${color}`}
                          checked={selectedColors.includes(color)}
                          onCheckedChange={() => toggleColor(color)}
                        />
                        <Label htmlFor={`color-${color}`} className="cursor-pointer text-sm">
                          {color}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wide text-muted-foreground">Price Range</h4>
                <Slider
                  min={0}
                  max={maxPrice}
                  step={100}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="py-3"
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">₱{priceRange[0].toLocaleString()}</span>
                  <span className="text-muted-foreground">₱{priceRange[1].toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Sort */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
              <p className="text-muted-foreground text-sm sm:text-base">
                Showing {filteredProducts.length} of {availableProducts.length} products
              </p>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px] lg:w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Show All</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name: A to Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 sm:py-16 lg:py-24">
                <p className="text-muted-foreground mb-4">No products found matching your filters.</p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {filteredProducts.map((product) => {
                  // Get the minimum price - NEW: Check variants first, then fallback to old system
                  const getDisplayPrice = () => {
                    // Check variant system first
                    if (product.variants && product.variants.length > 0) {
                      const activeVariants = product.variants.filter(v => v.active);
                      if (activeVariants.length > 0) {
                        return Math.min(...activeVariants.map(v => v.price));
                      }
                    }
                    // Legacy: Fallback to old sizeOptions system
                    if (product.sizeOptions && product.sizeOptions.length > 0) {
                      return Math.min(...product.sizeOptions.map(s => s.price));
                    }
                    return product.price;
                  };

                  // Check if product has multiple price points
                  const hasVariations = () => {
                    if (product.variants && product.variants.length > 1) {
                      return true;
                    }
                    if (product.sizeOptions && product.sizeOptions.length > 0) {
                      return true;
                    }
                    return false;
                  };

                  return (
                    <ProductCard
                      key={product.id}
                      name={product.name}
                      price={getDisplayPrice()}
                      imageUrl={product.imageUrl}
                      category={product.subCategory}
                      onClick={() => onProductClick(product.id)}
                      hasSizeOptions={hasVariations()}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}