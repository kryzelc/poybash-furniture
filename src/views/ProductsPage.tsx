'use client';

import { useProductListViewModel } from '@/viewmodels/useProductListViewModel';
import { ProductCard } from '../components/ProductCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { Button } from '../components/ui/button';
import { Filter, X } from 'lucide-react';

interface ProductsPageProps {
  category?: 'chairs' | 'tables';
  onProductClick: (id: number) => void;
}

export function ProductsPage({ category, onProductClick }: ProductsPageProps) {
  // ViewModel handles all business logic
  const {
    products: filteredProducts,
    allProducts: availableProducts,
    isLoading,
    sortBy,
    setSortBy,
    selectedCategories,
    selectedSubCategories,
    selectedMaterials,
    selectedColors,
    priceRange,
    setPriceRange,
    inStockOnly,
    setInStockOnly,
    showFilters,
    toggleFiltersVisibility,
    hasActiveFilters,
    taxonomies,
    maxPrice,
    toggleCategory,
    toggleSubCategory,
    toggleMaterial,
    toggleColor,
    clearFilters,
    getDisplayPrice,
    hasVariations,
    handleProductClick: vmHandleProductClick,
  } = useProductListViewModel(category);

  // Use provided onProductClick or ViewModel's
  const handleClick = onProductClick || vmHandleProductClick;

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
              onClick={toggleFiltersVisibility}
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
              {taxonomies.categories.length > 1 && (
                <div className="space-y-2 pb-3 border-b">
                  <h4 className="text-xs uppercase tracking-wide text-muted-foreground">Product Type</h4>
                  <div className="space-y-1.5">
                    {taxonomies.categories.map((cat) => (
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
              {taxonomies.subCategories.length > 0 && (
                <div className="space-y-2 pb-3 border-b">
                  <h4 className="text-xs uppercase tracking-wide text-muted-foreground">Category</h4>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {taxonomies.subCategories.map((subCat) => (
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
              {taxonomies.materials.length > 1 && (
                <div className="space-y-2 pb-3 border-b">
                  <h4 className="text-xs uppercase tracking-wide text-muted-foreground">Material</h4>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {taxonomies.materials.map((material) => (
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
              {taxonomies.colors.length > 1 && (
                <div className="space-y-2 pb-3 border-b">
                  <h4 className="text-xs uppercase tracking-wide text-muted-foreground">Color</h4>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {taxonomies.colors.map((color) => (
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
                  onValueChange={(value) => setPriceRange(value as [number, number])}
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
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
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
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    name={product.name}
                    price={getDisplayPrice(product)}
                    imageUrl={product.imageUrl}
                    category={product.subCategory}
                    onClick={() => handleClick(product.id)}
                    hasSizeOptions={hasVariations(product)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
