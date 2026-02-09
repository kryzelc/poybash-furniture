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
    if (!product) {
      toast.error('Product Not Found', {
        description: 'We couldn\'t find this product. Please refresh the page or return to the products page to try again.',
      });
      return;
    }

    // Check if product is active
    if (!product.active) {
      toast.error('Product Unavailable', {
        description: 'This product is no longer available for purchase. It may have been discontinued or temporarily removed from our catalog.',
      });
      return;
    }

    // Check if variant is selected
    if (!selectedVariant) {
      toast.error('Selection Required', {
        description: `Please select ${sizes.length > 0 ? 'a size and ' : ''}a color before adding to cart. All options must be chosen to continue.`,
      });
      return;
    }

    // Check if variant is active
    if (!selectedVariant.active) {
      toast.error('Option Unavailable', {
        description: `The ${selectedSize ? `${selectedSize} size in ` : ''}${selectedColor} color is no longer available. Please choose a different combination.`,
      });
      return;
    }

    // Check stock availability
    if (availableStock === 0) {
      toast.error('Out of Stock', {
        description: `Sorry, the ${selectedSize ? `${selectedSize} ` : ''}${product.name} in ${selectedColor} is currently out of stock. Please check back later or choose a different option.`,
      });
      return;
    }

    // Validate quantity against stock
    if (quantity > availableStock) {
      toast.error('Insufficient Stock', {
        description: `Only ${availableStock} ${availableStock === 1 ? 'unit' : 'units'} available. Please reduce your quantity to ${availableStock} or less.`,
      });
      return;
    }

    // Validate quantity is positive
    if (quantity <= 0) {
      toast.error('Invalid Quantity', {
        description: 'Please select at least 1 item to add to your cart.',
      });
      return;
    }

    // Validate quantity doesn't exceed reasonable limit
    if (quantity > 100) {
      toast.error('Quantity Limit Exceeded', {
        description: 'Maximum 100 items per order. For bulk orders exceeding this limit, please contact us via Facebook Messenger.',
      });
      return;
    }

    // All validation passed, add to cart
    try {
      const result = addToCart(
        product,
        selectedColor,
        quantity,
        selectedSize || undefined,
        selectedVariant.id
      );

      // Check if add to cart was successful
      if (!result.success) {
        toast.error('Cannot Add to Cart', {
          description: result.error || 'Unable to add item to cart.',
        });
        return;
      }

      const itemDescription = `${selectedSize ? `${selectedSize}, ` : ''}${selectedColor}`;
      const priceInfo = `₱${(selectedVariant.price * quantity).toFixed(2)}`;

      toast.success('Added to Cart Successfully! 🛒', {
        description: `${quantity} × ${product.name} (${itemDescription}) - ${priceInfo}. View your cart to proceed to checkout.`,
      });
    } catch (error) {
      toast.error('Unable to Add to Cart', {
        description: 'An unexpected error occurred. Please try again or refresh the page.',
      });
    }
  }, [product, selectedVariant, selectedColor, quantity, selectedSize, availableStock, sizes.length, addToCart]);

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
