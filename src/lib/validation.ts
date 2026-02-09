/**
 * Product and Cart Validation Utilities
 * 
 * Comprehensive validation for products, variants, stock, and cart operations.
 */

import { Product, ProductVariant } from '@/models/Product';
import { CartItem } from '@/models/Cart';
import { getVariantStock, getVariantById, findVariant } from './products';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate product data structure
 */
export function validateProduct(product: Product): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!product.id || product.id <= 0) {
    errors.push('Product must have a valid ID');
  }
  if (!product.name || product.name.trim().length === 0) {
    errors.push('Product must have a name');
  }
  if (typeof product.price !== 'number' || product.price < 0) {
    errors.push('Product must have a valid price');
  }
  if (!product.category) {
    errors.push('Product must have a category');
  }
  if (!product.imageUrl) {
    errors.push('Product must have an image URL');
  }

  // Variant validation
  if (product.variants && product.variants.length > 0) {
    const activeVariants = product.variants.filter(v => v.active);

    if (activeVariants.length === 0) {
      warnings.push('Product has no active variants');
    }

    // Validate each variant
    activeVariants.forEach((variant, index) => {
      const variantErrors = validateVariant(variant, index);
      errors.push(...variantErrors);
    });

    // Check for duplicate variant IDs
    const variantIds = product.variants.map(v => v.id);
    const duplicates = variantIds.filter((id, index) => variantIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate variant IDs found: ${duplicates.join(', ')}`);
    }
  } else {
    warnings.push('Product has no variants defined');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate variant data structure
 */
function validateVariant(variant: ProductVariant, index: number): string[] {
  const errors: string[] = [];

  if (!variant.id) {
    errors.push(`Variant ${index}: Missing ID`);
  }
  if (!variant.color) {
    errors.push(`Variant ${index}: Missing color`);
  }
  if (typeof variant.price !== 'number' || variant.price < 0) {
    errors.push(`Variant ${index}: Invalid price`);
  }
  if (!variant.warehouseStock || variant.warehouseStock.length === 0) {
    errors.push(`Variant ${index}: Missing warehouse stock data`);
  } else {
    // Validate warehouse stock
    variant.warehouseStock.forEach((ws, wsIndex) => {
      if (!ws.warehouse) {
        errors.push(`Variant ${index}, Warehouse ${wsIndex}: Missing warehouse name`);
      }
      if (typeof ws.quantity !== 'number' || ws.quantity < 0) {
        errors.push(`Variant ${index}, Warehouse ${wsIndex}: Invalid quantity`);
      }
      if (typeof ws.reserved !== 'number' || ws.reserved < 0) {
        errors.push(`Variant ${index}, Warehouse ${wsIndex}: Invalid reserved amount`);
      }
      if (ws.reserved > ws.quantity) {
        errors.push(`Variant ${index}, Warehouse ${wsIndex}: Reserved (${ws.reserved}) exceeds quantity (${ws.quantity})`);
      }
    });
  }

  return errors;
}

/**
 * Validate stock availability for a product variant
 */
export function validateStockAvailability(
  product: Product,
  variantId: string,
  requestedQuantity: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (requestedQuantity <= 0) {
    errors.push('Quantity must be greater than 0');
    return { isValid: false, errors, warnings };
  }

  if (requestedQuantity > 100) {
    errors.push('Quantity exceeds maximum limit of 100');
    return { isValid: false, errors, warnings };
  }

  const variant = getVariantById(product, variantId);

  if (!variant) {
    errors.push('Variant not found');
    return { isValid: false, errors, warnings };
  }

  if (!variant.active) {
    errors.push('Variant is no longer available');
    return { isValid: false, errors, warnings };
  }

  const availableStock = getVariantStock(variant);

  if (availableStock === 0) {
    errors.push('Product is out of stock');
    return { isValid: false, errors, warnings };
  }

  if (requestedQuantity > availableStock) {
    errors.push(`Only ${availableStock} items available in stock`);
    return { isValid: false, errors, warnings };
  }

  // Warning for low stock
  if (availableStock <= 5 && availableStock > 0) {
    warnings.push(`Low stock: Only ${availableStock} items remaining`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate size and color combination exists
 */
export function validateSizeColorCombination(
  product: Product,
  size: string | null,
  color: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!product.variants || product.variants.length === 0) {
    errors.push('Product has no variants');
    return { isValid: false, errors, warnings };
  }

  const variant = findVariant(product, size, color);

  if (!variant) {
    errors.push(`Size "${size || 'one-size'}" and color "${color}" combination not available`);
    return { isValid: false, errors, warnings };
  }

  if (!variant.active) {
    errors.push('Selected variant is no longer available');
    return { isValid: false, errors, warnings };
  }

  const availableStock = getVariantStock(variant);
  if (availableStock === 0) {
    errors.push('Selected variant is out of stock');
    return { isValid: false, errors, warnings };
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate add to cart operation
 */
export function validateAddToCart(
  product: Product,
  color: string,
  quantity: number,
  size?: string,
  variantId?: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic product validation
  if (!product) {
    errors.push('Product is required');
    return { isValid: false, errors, warnings };
  }

  if (!product.active) {
    errors.push('Product is no longer available');
    return { isValid: false, errors, warnings };
  }

  // Color validation
  if (!color || color.trim().length === 0) {
    errors.push('Color selection is required');
  }

  // Quantity validation
  if (!Number.isInteger(quantity) || quantity <= 0) {
    errors.push('Quantity must be a positive integer');
  }

  if (quantity > 100) {
    errors.push('Quantity exceeds maximum limit of 100');
  }

  // Variant validation
  if (!variantId) {
    errors.push('Variant selection is required');
    return { isValid: false, errors, warnings };
  }

  // Stock validation
  const stockValidation = validateStockAvailability(product, variantId, quantity);
  errors.push(...stockValidation.errors);
  warnings.push(...stockValidation.warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate cart item
 */
export function validateCartItem(
  item: CartItem,
  products: Product[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Find product
  const product = products.find(p => p.id === item.productId);

  if (!product) {
    errors.push(`Product ${item.productId} not found`);
    return { isValid: false, errors, warnings };
  }

  if (!product.active) {
    errors.push(`Product "${item.name}" is no longer available`);
    return { isValid: false, errors, warnings };
  }

  // Validate quantity
  if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
    errors.push(`Invalid quantity for "${item.name}"`);
  }

  if (item.quantity > 100) {
    errors.push(`Quantity for "${item.name}" exceeds maximum limit`);
  }

  // Validate variant
  if (!item.variantId) {
    errors.push(`Missing variant information for "${item.name}"`);
    return { isValid: false, errors, warnings };
  }

  const variant = getVariantById(product, item.variantId);

  if (!variant) {
    errors.push(`Variant no longer exists for "${item.name}"`);
    return { isValid: false, errors, warnings };
  }

  if (!variant.active) {
    errors.push(`Selected variant of "${item.name}" is no longer available`);
    return { isValid: false, errors, warnings };
  }

  // Validate stock
  const availableStock = getVariantStock(variant);

  if (availableStock === 0) {
    errors.push(`"${item.name}" is out of stock`);
  } else if (item.quantity > availableStock) {
    errors.push(`Only ${availableStock} of "${item.name}" available`);
  }

  // Validate price hasn't changed significantly
  const priceDifference = Math.abs(item.price - variant.price);
  if (priceDifference > 0.01) {
    warnings.push(`Price for "${item.name}" has changed from ₱${item.price.toFixed(2)} to ₱${variant.price.toFixed(2)}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate entire cart
 */
export function validateCart(
  items: CartItem[],
  products: Product[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (items.length === 0) {
    errors.push('Cart is empty');
    return { isValid: false, errors, warnings };
  }

  // Validate each item
  items.forEach((item, index) => {
    const itemValidation = validateCartItem(item, products);

    // Add item index to errors for clarity
    itemValidation.errors.forEach(error => {
      errors.push(`Item ${index + 1}: ${error}`);
    });

    itemValidation.warnings.forEach(warning => {
      warnings.push(`Item ${index + 1}: ${warning}`);
    });
  });

  // Validate cart totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (subtotal <= 0) {
    errors.push('Invalid cart total');
  }

  if (subtotal > 1000000) {
    warnings.push('Cart total exceeds ₱1,000,000 - please verify order');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate quantity update
 */
export function validateQuantityUpdate(
  currentQuantity: number,
  newQuantity: number,
  availableStock: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Number.isInteger(newQuantity)) {
    errors.push('Quantity must be a whole number');
  }

  if (newQuantity < 0) {
    errors.push('Quantity cannot be negative');
  }

  if (newQuantity === 0) {
    // This is valid but should trigger removal
    warnings.push('Quantity is 0 - item will be removed');
  }

  if (newQuantity > 100) {
    errors.push('Quantity exceeds maximum limit of 100');
  }

  if (newQuantity > availableStock) {
    errors.push(`Only ${availableStock} items available in stock`);
  }

  // Warnings for unusual changes
  const difference = Math.abs(newQuantity - currentQuantity);
  if (difference > 50) {
    warnings.push('Large quantity change detected');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitize and validate user input for product searches
 */
export function sanitizeSearchInput(input: string): string {
  if (!input) return '';

  // Remove any potentially dangerous characters
  return input
    .trim()
    .replace(/[<>\"'`]/g, '') // Remove HTML/script characters
    .substring(0, 100); // Limit length
}

/**
 * Validate coupon code format
 */
export function validateCouponCode(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!code || code.trim().length === 0) {
    errors.push('Coupon code is required');
    return { isValid: false, errors, warnings };
  }

  const sanitized = code.trim().toUpperCase();

  if (sanitized.length < 3) {
    errors.push('Coupon code too short');
  }

  if (sanitized.length > 20) {
    errors.push('Coupon code too long');
  }

  // Check for valid format (alphanumeric only)
  if (!/^[A-Z0-9]+$/.test(sanitized)) {
    errors.push('Coupon code must contain only letters and numbers');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Form Validation Functions
 * Used for checkout, contact forms, and user profile updates
 */

/**
 * Validate name (first name, last name, etc.)
 */
export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Name must be less than 50 characters' };
  }

  // Allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { valid: true };
}

/**
 * Validate email address
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim();

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Email must be less than 100 characters' };
  }

  return { valid: true };
}

/**
 * Validate Philippine phone number
 */
export function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  if (!phone || phone.trim().length === 0) {
    return { valid: false, error: 'Phone number is required' };
  }

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Philippine mobile numbers: 09XX-XXX-XXXX (11 digits starting with 09)
  // or +639XX-XXX-XXXX (12 digits starting with 639)
  if (digits.length === 11 && digits.startsWith('09')) {
    return { valid: true };
  }

  if (digits.length === 12 && digits.startsWith('639')) {
    return { valid: true };
  }

  return {
    valid: false,
    error: 'Please enter a valid Philippine mobile number (e.g., 09XX-XXX-XXXX)'
  };
}

/**
 * Validate address
 */
export function validateAddress(address: string): { valid: boolean; error?: string } {
  if (!address || address.trim().length === 0) {
    return { valid: false, error: 'Address is required' };
  }

  const trimmed = address.trim();

  if (trimmed.length < 10) {
    return { valid: false, error: 'Please provide a complete address (at least 10 characters)' };
  }

  if (trimmed.length > 200) {
    return { valid: false, error: 'Address must be less than 200 characters' };
  }

  return { valid: true };
}

/**
 * Validate city/municipality name
 */
export function validateCity(city: string): { valid: boolean; error?: string } {
  if (!city || city.trim().length === 0) {
    return { valid: false, error: 'City/Municipality is required' };
  }

  const trimmed = city.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: 'City name must be at least 2 characters' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'City name must be less than 50 characters' };
  }

  return { valid: true };
}

/**
 * Validate postal/ZIP code
 */
export function validatePostalCode(zipCode: string): { valid: boolean; error?: string } {
  if (!zipCode || zipCode.trim().length === 0) {
    return { valid: false, error: 'Postal code is required' };
  }

  const trimmed = zipCode.trim();

  // Philippine ZIP codes are 4 digits
  if (!/^\d{4}$/.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid 4-digit postal code' };
  }

  return { valid: true };
}

/**
 * Validate GCash number
 */
export function validateGCashNumber(gcashNumber: string): { valid: boolean; error?: string } {
  // GCash numbers are Philippine mobile numbers
  return validatePhoneNumber(gcashNumber);
}

/**
 * Validate GCash reference number
 */
export function validateGCashReference(reference: string): { valid: boolean; error?: string } {
  if (!reference || reference.trim().length === 0) {
    return { valid: false, error: 'GCash reference number is required' };
  }

  const trimmed = reference.trim();

  if (trimmed.length < 8) {
    return { valid: false, error: 'Please enter a valid reference number (at least 8 characters)' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Reference number must be less than 50 characters' };
  }

  return { valid: true };
}

/**
 * Validate bank account details
 */
export function validateBankAccount(accountNumber: string): { valid: boolean; error?: string } {
  if (!accountNumber || accountNumber.trim().length === 0) {
    return { valid: false, error: 'Bank account number is required' };
  }

  const trimmed = accountNumber.trim();

  // Remove spaces and hyphens
  const digits = trimmed.replace(/[\s-]/g, '');

  if (!/^\d+$/.test(digits)) {
    return { valid: false, error: 'Account number can only contain numbers' };
  }

  if (digits.length < 8 || digits.length > 20) {
    return { valid: false, error: 'Please enter a valid account number (8-20 digits)' };
  }

  return { valid: true };
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Format as 09XX-XXX-XXXX
  if (digits.length === 11 && digits.startsWith('09')) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // Format as +639XX-XXX-XXXX
  if (digits.length === 12 && digits.startsWith('639')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)}-${digits.slice(5, 8)}-${digits.slice(8)}`;
  }

  // Return as-is if format doesn't match
  return phone;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length === 0) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (password.length > 100) {
    return { valid: false, error: 'Password must be less than 100 characters' };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  return { valid: true };
}

/**
 * Validate password confirmation matches
 */
export function validatePasswordMatch(password: string, confirmPassword: string): { valid: boolean; error?: string } {
  if (!confirmPassword || confirmPassword.length === 0) {
    return { valid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' };
  }

  return { valid: true };
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  return input
    .trim()
    .replace(/[<>\"'`]/g, '') // Remove potentially dangerous characters
    .substring(0, 500); // Limit length
}
