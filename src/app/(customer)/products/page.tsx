'use client';

import { useState, useMemo } from 'react';
import { products } from '@/lib/products';
import { ProductCard } from '@/components/ProductCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Filter, X, Search, LayoutGrid, Package, Armchair, RectangleHorizontal } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [mainCategory, setMainCategory] = useState<string>('all');
  const [subCategory, setSubCategory] = useState<string>('all');
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [sortBy, setSortBy] = useState<string>('default');
  const [showFilters, setShowFilters] = useState(false);

  // Filter options
  const mainCategories = [
    { value: 'all', label: 'All', icon: <Package className="h-6 w-6" /> },
    { value: 'chairs', label: 'Chairs', icon: <Armchair className="h-6 w-6" /> },
    { value: 'tables', label: 'Tables', icon: <RectangleHorizontal className="h-6 w-6" /> },
  ];
  
  const subCategories = {
    chairs: ['Dining Chairs', 'Bar Stools', 'Stools & Benches'],
    tables: ['Dining Tables', 'Bar Tables'],
  };

  const materials = [
    'Solid Wood',
    'Solid Wood & Fabric',
    'Solid Wood & Woven Cane',
  ];

  const colors = [
    { name: 'Warm Sand', hex: '#F0D29E' },
    { name: 'Terracotta', hex: '#CA6F48' },
    { name: 'Chestnut Brown', hex: '#9B715A' },
    { name: 'Deep Espresso', hex: '#3A3022' },
    { name: 'Brick Brown', hex: '#9D6347' },
    { name: 'Slate Green', hex: '#4A5952' },
    { name: 'Antique Olive', hex: '#C7BA59' },
    { name: 'Clay Rose', hex: '#AE7971' },
    { name: 'Cloud White', hex: '#E2E0DE' },
    { name: 'Linen Beige', hex: '#DAD0C6' },
    { name: 'Pebble Gray', hex: '#BEBBBD' },
    { name: 'Storm Gray', hex: '#61636F' },
    { name: 'Black', hex: '#1a1a1a' },
  ];

  const sortOptions = [
    { value: 'default', label: 'Recommended' },
    { value: 'featured', label: 'Featured' },
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name-az', label: 'Name: A to Z' },
  ];

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(p => p.active !== false);

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (mainCategory !== 'all') {
      filtered = filtered.filter(p => p.category === mainCategory);
    }

    if (subCategory !== 'all') {
      filtered = filtered.filter(p => p.subCategory === subCategory);
    }

    if (materialFilter !== 'all') {
      filtered = filtered.filter(p => p.material === materialFilter);
    }

    if (colorFilter !== 'all') {
      filtered = filtered.filter(p => {
        if (p.variants && p.variants.length > 0) {
          return p.variants.some(v => v.color?.toLowerCase() === colorFilter.toLowerCase());
        }
        return false;
      });
    }

    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    switch (sortBy) {
      case 'featured':
        // Show only featured products (same as landing page)
        filtered = [...filtered].filter(p => p.featured);
        break;
      case 'newest':
        filtered = [...filtered].sort((a, b) => b.id - a.id);
        break;
      case 'price-low':
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case 'name-az':
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // Recommended: Show featured products first, then others
        filtered = [...filtered].sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return 0;
        });
        break;
    }

    return filtered;
  }, [searchTerm, mainCategory, subCategory, materialFilter, colorFilter, priceRange, sortBy]);

  const handleProductClick = (productId: number) => {
    router.push(`/products/${productId}`);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setMainCategory('all');
    setSubCategory('all');
    setMaterialFilter('all');
    setColorFilter('all');
    setPriceRange([0, 50000]);
    setSortBy('default');
  };

  const activeFiltersCount = [
    mainCategory !== 'all',
    subCategory !== 'all',
    materialFilter !== 'all',
    colorFilter !== 'all',
    priceRange[0] !== 0 || priceRange[1] !== 50000,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/20 to-background">

      <div className="container max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-16 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Sheet */}
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetContent side="left" className="w-[85vw] sm:w-[400px] p-0">
              <SheetHeader className="border-b px-4 py-4">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-lg font-bold flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                  </SheetTitle>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-8 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear all
                    </Button>
                  )}
                </div>
              </SheetHeader>
              
              <div className="overflow-y-auto h-[calc(100vh-80px)] px-4 py-4 space-y-6">
                {/* Category Filter */}
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3 block">Category</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {mainCategories.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => { setMainCategory(cat.value); setSubCategory('all'); }}
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border-2 transition-all ${
                          mainCategory === cat.value
                            ? 'border-primary bg-primary/5 shadow-sm text-primary'
                            : 'border-border hover:border-primary/50 hover:bg-accent/50 text-muted-foreground'
                        }`}
                      >
                        <div className="h-5 w-5">{cat.icon}</div>
                        <span className="text-[10px] font-medium text-center leading-tight">{cat.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Sub-categories */}
                  {mainCategory !== 'all' && subCategories[mainCategory as keyof typeof subCategories] && (
                    <div className="mt-3 space-y-1.5">
                      <button
                        onClick={() => setSubCategory('all')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                          subCategory === 'all'
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-accent'
                        }`}
                      >
                        All {mainCategory}
                      </button>
                      {subCategories[mainCategory as keyof typeof subCategories].map((sub) => (
                        <button
                          key={sub}
                          onClick={() => setSubCategory(sub)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                            subCategory === sub
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'hover:bg-accent'
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Material Filter */}
                <div className="border-t pt-4">
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3 block">Material</Label>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => setMaterialFilter('all')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                        materialFilter === 'all'
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-accent'
                      }`}
                    >
                      All Materials
                    </button>
                    {materials.map((material) => (
                      <button
                        key={material}
                        onClick={() => setMaterialFilter(material)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                          materialFilter === material
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-accent'
                        }`}
                      >
                        {material}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Filter */}
                <div className="border-t pt-4">
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3 block">Color</Label>
                  <div className="grid grid-cols-6 gap-2">
                    <button
                      onClick={() => setColorFilter('all')}
                      className={`relative aspect-square rounded-full border-2 transition-all ${
                        colorFilter === 'all'
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                      title="All Colors"
                    >
                      <div className="absolute inset-1 rounded-full bg-gradient-to-br from-red-200 via-blue-200 to-green-200"></div>
                    </button>
                    {colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setColorFilter(color.name)}
                        className={`relative aspect-square rounded-full border-2 transition-all ${
                          colorFilter === color.name
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                        title={color.name}
                      >
                        <div 
                          className="absolute inset-1 rounded-full"
                          style={{ backgroundColor: color.hex }}
                        ></div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div className="border-t pt-4">
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3 block">
                    Price Range
                  </Label>
                  <Slider
                    min={0}
                    max={50000}
                    step={500}
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    className="w-full mb-3"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary">
                      ₱{priceRange[0].toLocaleString('en-PH')}
                    </span>
                    <span className="text-xs text-muted-foreground">-</span>
                    <span className="text-xs font-medium text-primary">
                      ₱{priceRange[1].toLocaleString('en-PH')}
                    </span>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-80">
            <div className="bg-white rounded-2xl shadow-sm border p-6 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
              <div className="space-y-6">
                {/* Category Filter */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Category</Label>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        <X className="h-4 w-4" />
                        <span className="font-medium">Clear all</span>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {mainCategories.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => { setMainCategory(cat.value); setSubCategory('all'); }}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                          mainCategory === cat.value
                            ? 'border-primary bg-primary/5 shadow-sm text-primary'
                            : 'border-border hover:border-primary/50 hover:bg-accent/50 text-muted-foreground'
                        }`}
                      >
                        {cat.icon}
                        <span className="text-xs font-medium text-center">{cat.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Sub-categories */}
                  {mainCategory !== 'all' && subCategories[mainCategory as keyof typeof subCategories] && (
                    <div className="mt-4 space-y-2">
                      <button
                        onClick={() => setSubCategory('all')}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                          subCategory === 'all'
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-accent'
                        }`}
                      >
                        All {mainCategory}
                      </button>
                      {subCategories[mainCategory as keyof typeof subCategories].map((sub) => (
                        <button
                          key={sub}
                          onClick={() => setSubCategory(sub)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                            subCategory === sub
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'hover:bg-accent'
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Material Filter */}
                <div className="border-t pt-6">
                  <Label className="text-sm font-semibold mb-4 block uppercase tracking-wide text-muted-foreground">Material</Label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setMaterialFilter('all')}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                        materialFilter === 'all'
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-accent'
                      }`}
                    >
                      All Materials
                    </button>
                    {materials.map((material) => (
                      <button
                        key={material}
                        onClick={() => setMaterialFilter(material)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                          materialFilter === material
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-accent'
                        }`}
                      >
                        {material}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Filter */}
                <div className="border-t pt-6">
                  <Label className="text-sm font-semibold mb-4 block uppercase tracking-wide text-muted-foreground">Color</Label>
                  <div className="grid grid-cols-5 gap-2">
                    <button
                      onClick={() => setColorFilter('all')}
                      className={`relative aspect-square rounded-full border-2 transition-all ${
                        colorFilter === 'all'
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                      title="All Colors"
                    >
                      <div className="absolute inset-1 rounded-full bg-gradient-to-br from-red-200 via-blue-200 to-green-200"></div>
                    </button>
                    {colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setColorFilter(color.name)}
                        className={`relative aspect-square rounded-full border-2 transition-all ${
                          colorFilter === color.name
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                        title={color.name}
                      >
                        <div 
                          className="absolute inset-1 rounded-full"
                          style={{ backgroundColor: color.hex }}
                        ></div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div className="border-t pt-6">
                  <Label className="text-sm font-semibold mb-4 block uppercase tracking-wide text-muted-foreground">
                    Price Range
                  </Label>
                  <Slider
                    min={0}
                    max={50000}
                    step={500}
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    className="w-full mb-3"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary">
                      ₱{priceRange[0].toLocaleString('en-PH')}
                    </span>
                    <span className="text-sm text-muted-foreground">-</span>
                    <span className="text-sm font-medium text-primary">
                      ₱{priceRange[1].toLocaleString('en-PH')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="lg:hidden flex-1 sm:flex-initial" 
                  onClick={() => setShowFilters(true)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  <span className="font-medium text-foreground">{filteredAndSortedProducts.length}</span> {filteredAndSortedProducts.length === 1 ? 'product' : 'products'}
                </span>
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredAndSortedProducts.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border shadow-sm">
                <div className="max-w-md mx-auto px-4">
                  <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="h-12 w-12 text-primary/40" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">No products found</h3>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    We couldn't find any furniture matching your search. Try adjusting your filters or browse our full collection.
                  </p>
                  <Button size="lg" onClick={clearAllFilters}>
                    View All Products
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {filteredAndSortedProducts.map(product => {
                  // Check if product has size variations
                  const hasSizeVariations = () => {
                    if (product.variants && product.variants.length > 0) {
                      const activeVariants = product.variants.filter((v) => v.active);
                      const uniqueSizes = new Set(
                        activeVariants.map((v) => v.size).filter((size) => size !== null)
                      );
                      return uniqueSizes.size > 1;
                    }
                    return false;
                  };

                  return (
                    <ProductCard
                      key={product.id}
                      name={product.name}
                      price={product.price}
                      imageUrl={product.imageUrl}
                      category={product.category}
                      onClick={() => handleProductClick(product.id)}
                      hasSizeOptions={hasSizeVariations()}
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

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-secondary/20 to-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading our collection...</p>
        </div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
