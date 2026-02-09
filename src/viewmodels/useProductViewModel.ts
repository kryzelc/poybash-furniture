/**
 * Product ViewModel
 * 
 * Manages product-related business logic and state.
 * Used by product listing pages and product detail pages.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/models';
import { productService, ProductFilters } from '@/services/productService';

interface UseProductViewModelOptions {
  filters?: ProductFilters;
  autoLoad?: boolean;
}

export function useProductViewModel(options: UseProductViewModelOptions = {}) {
  const router = useRouter();
  const { filters, autoLoad = true } = options;

  // Use ref to store filters to avoid recreating loadProducts on every render
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load products from API
   */
  const loadProducts = useCallback(async (customFilters?: ProductFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await productService.getProducts(customFilters || filtersRef.current);
      setProducts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load products';
      setError(errorMessage);
      console.error('Error loading products:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load featured products specifically
   */
  const loadFeaturedProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await productService.getFeaturedProducts();
      setProducts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load featured products';
      setError(errorMessage);
      console.error('Error loading featured products:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Search products by query
   */
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      loadProducts();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await productService.searchProducts(query);
      setProducts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Error searching products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [loadProducts]);

  /**
   * Navigate to product detail page
   */
  const handleProductClick = useCallback((productId: number) => {
    router.push(`/products/${productId}`);
  }, [router]);

  /**
   * Filter products by category
   */
  const filterByCategory = useCallback((category: string) => {
    loadProducts({ ...filtersRef.current, category });
  }, [loadProducts]);

  /**
   * Refresh products list
   */
  const refresh = useCallback(() => {
    loadProducts();
  }, [loadProducts]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadProducts();
    }
  }, [autoLoad, loadProducts]);

  return {
    // State
    products,
    isLoading,
    error,
    
    // Actions
    loadProducts,
    loadFeaturedProducts,
    searchProducts,
    handleProductClick,
    filterByCategory,
    refresh,
  };
}
