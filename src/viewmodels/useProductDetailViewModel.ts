/**
 * Product Detail ViewModel
 * 
 * Manages product detail page logic including variant selection,
 * quantity management, and add-to-cart functionality.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductVariant } from '@/models';
import { productService } from '@/services';
import { products as staticProducts, findVariant, getProductSizes, getProductColors, getVariantStock } from '../lib/products';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

export function useProductDetailViewModel(productId: number) {
  const router = useRouter();
  const { addToCart } = useCart();
  
  // State
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Variant selection state
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  // Load product
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setIsLoading(true);
        // For now, use static products
        const foundProduct = staticProducts.find(p => p.id === productId);
        
        if (foundProduct) {
          // Add required timestamp fields for Product model compatibility
          setProduct({
            ...foundProduct,
            variants: foundProduct.variants || [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          });
        } else {
          setProduct(null);
          setError('Product not found');
        }
      } catch (err) {
        console.error('Error loading product:', err);
        setError('Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
    setIsMounted(true);
  }, [productId]);

  // Get available sizes and colors
  const sizes = useMemo(
    () => (product ? getProductSizes(product) : []),
    [product]
  );
  
  const colors = useMemo(
    () => (product ? getProductColors(product) : []),
    [product]
  );

  // Initialize variant selection
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const activeVariants = product.variants.filter(v => v.active);
      if (activeVariants.length > 0) {
        const firstVariant = activeVariants[0];
        setSelectedSize(firstVariant.size);
        setSelectedColor(firstVariant.color);
        setSelectedVariant(firstVariant);
      }
    }
  }, [product]);

  // Update selected variant when size or color changes
  useEffect(() => {
    if (product?.variants && selectedColor) {
      const variant = findVariant(product, selectedSize, selectedColor);
      setSelectedVariant(variant || null);
    }
  }, [selectedSize, selectedColor, product]);

  // Get current price
  const currentPrice = useMemo(() => {
    if (selectedVariant) {
      return selectedVariant.price;
    }
    // Fallback to old system
    if (product?.sizeOptions && selectedSize) {
      const sizeOption = product.sizeOptions.find(s => s.label === selectedSize);
      if (sizeOption) return sizeOption.price;
    }
    return product?.price || 0;
  }, [selectedVariant, product, selectedSize]);

  // Get available stock
  const availableStock = useMemo(() => {
    if (selectedVariant) {
      return getVariantStock(selectedVariant);
    }
    // Fallback to old system
    if (product?.sizeOptions && selectedSize) {
      const sizeOption = product.sizeOptions.find(s => s.label === selectedSize);
      if (sizeOption) {
        return sizeOption.warehouseStock.reduce(
          (sum, ws) => sum + (ws.quantity - ws.reserved),
          0
        );
      }
    }
    // Legacy system
    if (product?.warehouseStock) {
      return product.warehouseStock.reduce(
        (sum, ws) => sum + (ws.quantity - ws.reserved),
        0
      );
    }
    return 0;
  }, [selectedVariant, product, selectedSize]);

  // Check if in stock
  const inStock = availableStock > 0;

  // Actions
  const handleSizeChange = useCallback((size: string) => {
    setSelectedSize(size);
  }, []);

  const handleColorChange = useCallback((color: string) => {
    setSelectedColor(color);
  }, []);

  const handleQuantityChange = useCallback((newQuantity: number) => {
    if (newQuantity < 1) {
      setQuantity(1);
    } else if (newQuantity > availableStock) {
      setQuantity(availableStock);
    } else {
      setQuantity(newQuantity);
    }
  }, [availableStock]);

  const incrementQuantity = useCallback(() => {
    handleQuantityChange(quantity + 1);
  }, [quantity, handleQuantityChange]);

  const decrementQuantity = useCallback(() => {
    handleQuantityChange(quantity - 1);
  }, [quantity, handleQuantityChange]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    
    if (!selectedVariant) {
      toast.error('Please select your preferences', {
        description: 'Choose a valid size and color combination to continue.',
      });
      return;
    }

    addToCart(
      product,
      selectedColor,
      quantity,
      selectedSize || undefined,
      selectedVariant.id
    );
    
    toast.success('Added to cart', {
      description: `${quantity} ${product.name} - ${selectedSize ? `${selectedSize}, ` : ''}${selectedColor}`,
    });
  }, [product, selectedVariant, selectedColor, quantity, selectedSize, addToCart]);

  const handleBack = useCallback(() => {
    router.push('/products');
  }, [router]);

  // Helper to check if a size/color combo is available
  const isVariantAvailable = useCallback((size: string | null, color: string): boolean => {
    if (!product?.variants) return false;
    const variant = findVariant(product, size, color);
    return variant ? variant.active && getVariantStock(variant) > 0 : false;
  }, [product]);

  return {
    // State
    product,
    isLoading,
    error,
    isMounted,
    
    // Variant selection
    selectedVariant,
    selectedSize,
    selectedColor,
    quantity,
    
    // Computed
    sizes,
    colors,
    currentPrice,
    availableStock,
    inStock,
    
    // Actions
    handleSizeChange,
    handleColorChange,
    handleQuantityChange,
    incrementQuantity,
    decrementQuantity,
    handleAddToCart,
    handleBack,
    isVariantAvailable,
  };
}
