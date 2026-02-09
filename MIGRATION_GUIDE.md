# Backend Migration & Architecture Guide

## 🎯 Overview

This comprehensive guide covers:
1. **Architecture Documentation** - MVVM pattern and role-based access
2. **Backend Migration** - Step-by-step Supabase integration
3. **Security Requirements** - Critical fixes needed for production

**Current Status:** ✅ Frontend working with localStorage  
**Goal:** 🚀 Gradually connect to Supabase backend with production-grade security

---

# 🏗️ PART 1: MVVM ARCHITECTURE

## Project Structure

```
src/
├── models/              ✅ MODEL Layer
│   ├── Cart.ts, Product.ts, Order.ts, User.ts
│   └── Domain entities with business rules
│
├── views/               ✅ VIEW Layer  
│   ├── HomePage.tsx, ProductsPage.tsx, CheckoutPage.tsx
│   └── UI presentation components
│
├── viewmodels/          ✅ VIEWMODEL Layer
│   ├── useAuthViewModel.ts, useCartViewModel.ts
│   └── Business logic and state management
│
├── services/            ✅ INFRASTRUCTURE Layer
│   ├── authService.ts, productService.ts, orderService.ts
│   └── Data access (localStorage → Supabase)
│
├── lib/                 ✅ DOMAIN LOGIC Layer
│   ├── products.ts, coupons.ts, validation.ts
│   └── Business logic + mock data (to be migrated)
```

## MVVM Data Flow

```
View → ViewModel → Service → Database → Service → ViewModel → View
 │         │          │                    │          │         │
 │         │          └─ Data access       │          │         └─ UI updates
 │         └─ Business logic               └─ Return data
 └─ User interaction
```

## Role-Based Access Control (RBAC)

### Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **Customer** | Browse, shop, manage own orders |
| **Staff** | + Sales operations, refunds, manual orders |
| **Inventory Clerk** | + Stock management, fulfillment |
| **Admin** | + Product management, coupons, reports |
| **Owner** | Full system access |

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@poybash.com | Owner@2024 |
| Admin | admin@poybash.com | Admin@2024 |
| Staff | staff@poybash.com | Staff@2024 |
| Clerk | clerk@poybash.com | Clerk@2024 |
| Customer | customer@poybash.com | Customer@2024 |

**Create accounts:** Open `/seed-accounts` page

---

# 🚀 PART 2: BACKEND MIGRATION

## Migration Priority Order

1. **Products** (Start here - foundational, low risk)
2. **Authentication** (Critical for security)
3. **Orders** (Core business functionality)
4. **Coupons** (Marketing features)
5. **Inventory** (Warehouse management)
6. **Audit Logs** (Compliance)
7. **Taxonomies** (Configuration)

## Current vs Target Architecture

### Before (localStorage)
```
/lib/products.ts → Mock data + CRUD operations
/services/productService.ts → Unused
```

### After (Supabase)
```
/lib/products.ts → Type definitions + helpers ONLY
/services/productService.ts → Real Supabase queries
```

## Migration Template

### Phase 1: Prepare Service Layer

```typescript
// services/productService.ts
class ProductService {
  private useBackend = process.env.NEXT_PUBLIC_USE_BACKEND === 'true';
  
  async getProducts() {
    if (this.useBackend) {
      return this.getFromSupabase();
    }
    return this.getFromLocalStorage(); // Fallback
  }
}
```

### Phase 2: Update Imports

```typescript
// Before
import { getProducts } from '../lib/products';

// After
import { productService } from '../services/productService';
const products = await productService.getProducts();
```

### Phase 3: Enable Backend

```bash
# .env.local
NEXT_PUBLIC_USE_BACKEND_PRODUCTS=true
```

## Feature-Specific Migration Plans

### 1. Products Migration
- **Complexity:** ⭐⭐⭐ Medium
- **Time:** 4-6 hours
- **Files:** `lib/products.ts`, `services/productService.ts`, all ViewModels
- **Steps:** Enhance service → Update imports → Test → Enable backend

### 2. Authentication Migration
- **Complexity:** ⭐⭐⭐⭐ High
- **Time:** 6-8 hours
- **Risk:** High (security critical)
- **Steps:** Set up Supabase Auth → Implement service → Test flows → Enable

### 3. Orders Migration
- **Complexity:** ⭐⭐⭐⭐ High
- **Time:** 8-10 hours
- **Risk:** High (business critical)
- **Steps:** Test edge function → Enhance service → Update checkout → Monitor

### 4. Coupons Migration
- **Complexity:** ⭐⭐ Easy
- **Time:** 2-3 hours
- **Note:** Service already has Supabase code, just wire it up

### 5. Inventory Migration
- **Complexity:** ⭐⭐⭐ Medium
- **Time:** 4-5 hours
- **Risk:** Medium (stock accuracy critical)

## Testing Checklist (Per Feature)

- [ ] Create operation works
- [ ] Read/List operation works
- [ ] Update operation works
- [ ] Delete operation works
- [ ] Error handling works
- [ ] RLS policies working
- [ ] User can't access other's data
- [ ] Performance acceptable (\<1s queries)

## Rollback Procedures

### Immediate Rollback (\<1 minute)
```bash
# Change env variable
NEXT_PUBLIC_USE_BACKEND_PRODUCTS=false

# Restart dev server
npm run dev
```

---

# 🔒 PART 3: SECURITY REQUIREMENTS FOR PRODUCTION

## ✅ Client-Side Fixes (COMPLETED)

### 1. Coupon Discount Cap ✅
**Fixed:** Prevents negative totals from fixed discounts
```typescript
// src/lib/coupons.ts:122
return Math.min(coupon.discountValue, subtotal);
```

### 2. Cart Size Limit ✅
**Fixed:** Maximum 50 different items in cart
```typescript
// src/viewmodels/useCartViewModel.ts:135
if (!existingItem && items.length >= 50) {
  return { success: false, error: 'Maximum 50 items...' };
}
```

### 3. Session Expiration ✅
**Fixed:** Auto-logout after 24 hours
```typescript
// src/services/authService.ts:54
const expiresAt = new Date();
expiresAt.setHours(expiresAt.getHours() + 24);
```

## 🚨 Backend Fixes Required (TODO)

### 1. Password Hashing (CRITICAL)
**Current Issue:** Weak bitwise hash, easily cracked
**Required Fix:**
```typescript
// Replace in authService.ts
import bcrypt from 'bcrypt';

async hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

async verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```
**Migration:** Users must reset passwords

### 2. Server-Side Price Validation (CRITICAL)
**Current Issue:** Client can manipulate cart prices via localStorage
**Required Fix:**
```typescript
// In Supabase Edge Function: place-order
async function validateOrder(orderData) {
  // Recalculate total from database prices
  const items = await getProductPrices(orderData.items);
  const calculatedTotal = items.reduce((sum, item) => 
    sum + (item.dbPrice * item.quantity), 0
  );
  
  if (Math.abs(calculatedTotal - orderData.total) > 0.01) {
    throw new Error('Price mismatch detected');
  }
}
```

### 3. Atomic Coupon Usage (CRITICAL)
**Current Issue:** Race condition allows unlimited coupon usage
**Required Fix:**
```sql
-- In Supabase
BEGIN;
  SELECT * FROM coupons WHERE id = $1 FOR UPDATE;
  UPDATE coupons 
  SET used_count = used_count + 1 
  WHERE id = $1 AND used_count < usage_limit;
COMMIT;
```

### 4. Inventory Reservation (HIGH)
**Current Issue:** Multiple users can buy last item
**Required Fix:**
```typescript
// Reserve stock during checkout
async function reserveStock(items: CartItem[]) {
  // Use database transaction
  const reserved = await supabase.rpc('reserve_inventory', {
    items: items,
    timeout_minutes: 15
  });
  
  if (!reserved) {
    throw new Error('Insufficient stock');
  }
}
```

### 5. Rate Limiting (MEDIUM)
**Required Fix:**
```typescript
// Add to Supabase Edge Functions
import { RateLimiter } from '@upstash/ratelimit';

const limiter = new RateLimiter({
  redis: Redis.fromEnv(),
  limiter: Ratelimiter.slidingWindow(5, '1 m'), // 5 requests per minute
});

// In coupon validation endpoint
const { success } = await limiter.limit(userId);
if (!success) {
  return new Response('Too many requests', { status: 429 });
}
```

## Security Implementation Priority

### Immediate (Before Production)
1. ✅ Coupon discount cap (DONE)
2. ✅ Cart size limit (DONE)
3. ✅ Session expiration (DONE)
4. ❌ Server-side price validation (REQUIRED)
5. ❌ Password hashing with bcrypt (REQUIRED)

### Short Term (First Month)
6. ❌ Atomic coupon operations
7. ❌ Inventory reservation system
8. ❌ Rate limiting on sensitive endpoints

### Long Term (Ongoing)
9. ❌ Security audits
10. ❌ Penetration testing
11. ❌ Compliance reviews

## Supabase Row Level Security (RLS)

### Example: Products Table
```sql
-- Customers can only read active products
CREATE POLICY "Customers read active products"
ON products FOR SELECT
TO authenticated
USING (active = true);

-- Only admins can modify products
CREATE POLICY "Admins manage products"
ON products FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'owner')
);
```

### Example: Orders Table
```sql
-- Users can only see their own orders
CREATE POLICY "Users read own orders"
ON orders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Staff can see all orders
CREATE POLICY "Staff read all orders"
ON orders FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('staff', 'admin', 'owner')
);
```

## Security Testing Scenarios

### Test 1: Price Manipulation
```javascript
// Should FAIL in production
const cart = JSON.parse(localStorage.getItem('cart'));
cart[0].price = 0.01;
localStorage.setItem('cart', JSON.stringify(cart));
// Expected: Order rejected with "Price mismatch"
```

### Test 2: Coupon Race Condition
```
1. Open 5 browser tabs
2. Apply same coupon in all tabs simultaneously
3. Expected: Only 1 succeeds, others get "Coupon limit reached"
```

### Test 3: Inventory Overselling
```
1. Product has 1 item in stock
2. Two users add to cart simultaneously
3. Expected: Second user gets "Out of stock" error
```

---

# 📊 MIGRATION PROGRESS TRACKER

| Feature | Status | Client Security | Backend Security |
|---------|--------|----------------|------------------|
| Products | 📝 TODO | N/A | Price validation needed |
| Auth | 📝 TODO | ✅ Session expiry | ❌ bcrypt needed |
| Orders | 📝 TODO | N/A | ❌ Price validation needed |
| Coupons | 📝 TODO | ✅ Discount cap | ❌ Atomic ops needed |
| Inventory | 📝 TODO | ✅ Cart limit | ❌ Reservation needed |
| Audit Logs | 📝 TODO | N/A | N/A |
| Taxonomies | 📝 TODO | N/A | N/A |

---

# 🎓 Best Practices

## Do's ✅
- Migrate one feature at a time
- Keep localStorage as fallback during testing
- Write tests before migrating
- Use feature flags for easy rollback
- Implement RLS policies for all tables
- Validate all inputs server-side
- Use database transactions for critical operations

## Don'ts ❌
- Don't migrate multiple features simultaneously
- Don't trust client-side data (prices, permissions, etc.)
- Don't skip security testing
- Don't remove localStorage code until stable
- Don't forget to hash passwords properly
- Don't allow SQL injection vulnerabilities

---

# 🔗 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js + Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [OWASP Security Guidelines](https://owasp.org/www-community/)
- [bcrypt Documentation](https://www.npmjs.com/package/bcrypt)

---

**Last Updated:** 2026-02-09  
**Version:** 2.0.0 (Consolidated Architecture + Migration + Security)  
**Status:** ✅ Client-side security fixes complete | ⏸️ Backend migration pending
