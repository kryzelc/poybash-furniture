/**
 * Philippines-based Form Validation Utilities
 * Comprehensive validation rules for PoyBash Furniture e-commerce platform
 */

// Name validation (no numbers or special symbols except hyphen and apostrophe)
export const validateName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }
  
  if (name.trim().length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  
  const nameRegex = /^[A-Za-zÀ-ÿ\s'-]+$/;
  if (!nameRegex.test(name)) {
    return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  return { valid: true };
};

// Email validation
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email is required' };
  }
  
  const trimmedEmail = email.trim();
  
  // Basic email format check - must have @ and domain
  if (!trimmedEmail.includes('@') || trimmedEmail.split('@').length !== 2) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  
  const [localPart, domain] = trimmedEmail.split('@');
  
  // Local part validation
  if (!localPart || localPart.length === 0) {
    return { valid: false, error: 'Email address format is invalid' };
  }
  
  // Local part shouldn't start or end with special characters
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return { valid: false, error: 'Email address format is invalid' };
  }
  
  // Check for consecutive dots
  if (trimmedEmail.includes('..')) {
    return { valid: false, error: 'Email address format is invalid' };
  }
  
  // Domain validation
  if (!domain || !domain.includes('.')) {
    return { valid: false, error: 'Email must have a valid domain (e.g., @gmail.com)' };
  }
  
  // More comprehensive email regex - allows letters, numbers, dots, underscores, plus, percent, and hyphens
  const emailRegex = /^[a-zA-Z0-9._+%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  
  return { valid: true };
};

// Philippine phone number validation
// Accepts: +63 XXX XXX XXXX, +63XXXXXXXXXX, 09XXXXXXXXX
export const validatePhoneNumber = (phone: string): { valid: boolean; error?: string } => {
  if (!phone || phone.trim().length === 0) {
    return { valid: false, error: 'Phone number is required' };
  }
  
  // Remove all spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');
  
  // Check for Philippine mobile format (+63 9XX XXX XXXX - 9 digits after +639)
  const internationalFormat = /^\+639\d{9}$/;
  // Also accept local format (09XX XXX XXXX - 11 digits total)
  const localFormat = /^09\d{9}$/;
  
  if (!internationalFormat.test(cleaned) && !localFormat.test(cleaned)) {
    return { valid: false, error: 'Phone number must be in +63 9XX XXX XXXX or 09XX XXX XXXX format' };
  }
  
  return { valid: true };
};

// Format phone number for display
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/[\s-]/g, '');
  
  if (cleaned.startsWith('+63')) {
    // +63 XXX XXX XXXX
    return cleaned.replace(/^\+63(\d{3})(\d{3})(\d{4})$/, '+63 $1 $2 $3');
  } else if (cleaned.startsWith('09')) {
    // 09XX XXX XXXX
    return cleaned.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3');
  }
  
  return phone;
};

// Philippine postal code validation (4 digits)
export const validatePostalCode = (code: string): { valid: boolean; error?: string } => {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: 'Postal code is required' };
  }
  
  const postalRegex = /^[0-9]{4}$/;
  if (!postalRegex.test(code)) {
    return { valid: false, error: 'Philippine postal code must be 4 digits' };
  }
  
  return { valid: true };
};

// City/Province validation (letters and spaces only)
export const validateCity = (city: string): { valid: boolean; error?: string } => {
  if (!city || city.trim().length === 0) {
    return { valid: false, error: 'City is required' };
  }
  
  const cityRegex = /^[A-Za-zÀ-ÿ\s.-]+$/;
  if (!cityRegex.test(city)) {
    return { valid: false, error: 'City can only contain letters, spaces, periods, and hyphens' };
  }
  
  return { valid: true };
};

// Address validation (allows letters, numbers, common punctuation)
export const validateAddress = (address: string): { valid: boolean; error?: string } => {
  if (!address || address.trim().length === 0) {
    return { valid: false, error: 'Address is required' };
  }
  
  if (address.trim().length < 5) {
    return { valid: false, error: 'Please enter a complete address' };
  }
  
  // Allow letters, numbers, spaces, and common punctuation
  const addressRegex = /^[A-Za-z0-9\s.,#'-]+$/;
  if (!addressRegex.test(address)) {
    return { valid: false, error: 'Address contains invalid characters' };
  }
  
  return { valid: true };
};

// GCash number validation (+63 format)
export const validateGCashNumber = (number: string): { valid: boolean; error?: string } => {
  if (!number || number.trim().length === 0) {
    return { valid: false, error: 'GCash number is required' };
  }
  
  const cleaned = number.replace(/[\s-]/g, '');
  // Philippine mobile numbers: +63 9XX XXX XXXX (9 digits after +639)
  const gcashRegex = /^\+639\d{9}$/;
  
  if (!gcashRegex.test(cleaned)) {
    return { valid: false, error: 'GCash number must be in +63 format (e.g., +63 9XX XXX XXXX)' };
  }
  
  return { valid: true };
};

// GCash reference number validation (13 digits)
export const validateGCashReference = (reference: string): { valid: boolean; error?: string } => {
  if (!reference || reference.trim().length === 0) {
    return { valid: false, error: 'GCash reference number is required' };
  }
  
  const cleaned = reference.replace(/[\s-]/g, '');
  const referenceRegex = /^[0-9]{13}$/;
  
  if (!referenceRegex.test(cleaned)) {
    return { valid: false, error: 'GCash reference number must be 13 digits' };
  }
  
  return { valid: true };
};

// Bank account number validation (numbers only)
export const validateBankAccount = (account: string): { valid: boolean; error?: string } => {
  if (!account || account.trim().length === 0) {
    return { valid: false, error: 'Account number is required' };
  }
  
  const cleaned = account.replace(/[\s-]/g, '');
  const accountRegex = /^[0-9]+$/;
  
  if (!accountRegex.test(cleaned)) {
    return { valid: false, error: 'Account number must contain only digits' };
  }
  
  if (cleaned.length < 4) {
    return { valid: false, error: 'Account number is too short' };
  }
  
  return { valid: true };
};

// Password validation
export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password || password.length === 0) {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  
  // Check for at least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return { valid: false, error: 'Password must contain both letters and numbers' };
  }
  
  return { valid: true };
};

// Confirm password validation
export const validatePasswordMatch = (password: string, confirmPassword: string): { valid: boolean; error?: string } => {
  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' };
  }
  
  return { valid: true };
};

// Generic number validation
export const validateNumber = (value: string, min?: number, max?: number): { valid: boolean; error?: string } => {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return { valid: false, error: 'Please enter a valid number' };
  }
  
  if (min !== undefined && num < min) {
    return { valid: false, error: `Value must be at least ${min}` };
  }
  
  if (max !== undefined && num > max) {
    return { valid: false, error: `Value must be at most ${max}` };
  }
  
  return { valid: true };
};

// Sanitize input - remove leading/trailing spaces
export const sanitizeInput = (value: string): string => {
  return value.trim();
};

// Format currency for display (Philippine Peso)
export const formatCurrency = (amount: number): string => {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};