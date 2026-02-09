/**
 * Product List ViewModel
 * 
 * Manages product listing, filtering, sorting, and search.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/models';
import { productService } from '@/services';
import { products as staticProducts, getVariantStock } from '../lib/products';
import { getSubCategories, getMaterials, getColors } from '../lib/taxonomies';

export type SortOption = 'all' | 'newest' | 'price-low' | 'price-high' | 'name';

export interface ProductFilters {
  categories: string[];
  subCategories: string[];
  materials: string[];
  colors: string[];
  priceRange: [number, number];
  inStockOnly: boolean;
}

export function useProductListViewModel(initialCategory?: 'chairs' | 'tables') {
  const router = useRouter();
  
  // State - Add timestamp fields for Product model compatibility
  const [products, setProducts] = useState<Product[]>(
    staticProducts.filter(p => p.active).map(p => ({
      ...p,
      variants: p.variants || [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }))
  );
  const [sortBy, setSortBy] = useState<SortOption>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Update categories when prop changes
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategories([initialCategory]);
    } else {
      setSelectedCategories([]);
    }
  }, [initialCategory]);

  // Calculate max price from available products
  const maxPrice = useMemo(() => {
    return Math.max(...products.map(p => p.price), 5000);
  }, [products]);

  // Get taxonomy data
  const taxonomies = useMemo(() => ({
    categories: ['chairs', 'tables'],
    subCategories: getSubCategories(false).map(sc => sc.name),
    materials: getMaterials(false).map(m => m.name),
    colors: getColors(false).map(c => c.name),
  }), []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

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

    // Filter by color (check variants)
    if (selectedColors.length > 0) {
      filtered = filtered.filter(p => {
        if (p.variants && p.variants.length > 0) {
          return p.variants.some(v => v.active && selectedColors.includes(v.color));
        }
        return false;
      });
    }

    // Filter by price
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Filter by stock
    if (inStockOnly) {
      filtered = filtered.filter(p => {
        if (p.variants && p.variants.length > 0) {
          return p.variants.some(v => v.active && getVariantStock(v) > 0);
        }
        if (p.warehouseStock) {
          const totalStock = p.warehouseStock.reduce(
            (sum, stock) => sum + (stock.quantity - stock.reserved), 
            0
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
  }, [
    products,
    selectedCategories,
    selectedSubCategories,
    selectedMaterials,
    selectedColors,
    priceRange,
    inStockOnly,
    sortBy
  ]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => 
    selectedCategories.length > 0 ||
    selectedSubCategories.length > 0 ||
    selectedMaterials.length > 0 ||
    selectedColors.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < maxPrice ||
    inStockOnly,
    [selectedCategories, selectedSubCategories, selectedMaterials, selectedColors, priceRange, maxPrice, inStockOnly]
  );

  // Actions
  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  }, []);

  const toggleSubCategory = useCallback((subCategory: string) => {
    setSelectedSubCategories(prev =>
      prev.includes(subCategory) ? prev.filter(c => c !== subCategory) : [...prev, subCategory]
    );
  }, []);

  const toggleMaterial = useCallback((material: string) => {
    setSelectedMaterials(prev =>
      prev.includes(material) ? prev.filter(m => m !== material) : [...prev, material]
    );
  }, []);

  const toggleColor = useCallback((color: string) => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedSubCategories([]);
    setSelectedMaterials([]);
    setSelectedColors([]);
    setPriceRange([0, maxPrice]);
    setInStockOnly(false);
  }, [maxPrice]);

  const handleProductClick = useCallback((productId: number) => {
    router.push(`/products/${productId}`);
  }, [router]);

  const toggleFiltersVisibility = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  // Get display price for product (considering variants)
  const getDisplayPrice = useCallback((product: Product): number => {
    if (product.variants && product.variants.length > 0) {
      const activeVariants = product.variants.filter(v => v.active);
      if (activeVariants.length > 0) {
        return Math.min(...activeVariants.map(v => v.price));
      }
    }
    if (product.sizeOptions && product.sizeOptions.length > 0) {
      return Math.min(...product.sizeOptions.map(s => s.price));
    }
    return product.price;
  }, []);

  // Check if product has variations
  const hasVariations = useCallback((product: Product): boolean => {
    if (product.variants && product.variants.length > 1) {
      return true;
    }
    if (product.sizeOptions && product.sizeOptions.length > 0) {
      return true;
    }
    return false;
  }, []);

  return {
    // State
    products: filteredProducts,
    allProducts: products,
    isLoading,
    sortBy,
    selectedCategories,
    selectedSubCategories,
    selectedMaterials,
    selectedColors,
    priceRange,
    inStockOnly,
    showFilters,
    hasActiveFilters,
    
    // Taxonomy data
    taxonomies,
    maxPrice,
    
    // Actions
    setSortBy,
    toggleCategory,
    toggleSubCategory,
    toggleMaterial,
    toggleColor,
    setPriceRange,
    setInStockOnly,
    clearFilters,
    handleProductClick,
    toggleFiltersVisibility,
    
    // Helpers
    getDisplayPrice,
    hasVariations,
  };
}
