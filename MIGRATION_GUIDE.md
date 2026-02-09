# Backend Migration Guide

## 🎯 Overview

This guide helps you migrate from **localStorage (mock data)** to **Supabase (real backend)** incrementally, one feature at a time.

**Current Status:** ✅ Frontend working with localStorage  
**Goal:** 🚀 Gradually connect each feature to Supabase backend

---

## 📋 Migration Priority Order

Migrate in this order to minimize risk and maximize learning:

1. **Products** (Start here - foundational, low risk)
2. **Authentication** (Critical for user security)
3. **Orders** (Core business functionality)
4. **Coupons** (Marketing features)
5. **Inventory** (Warehouse management)
6. **Audit Logs** (Compliance & tracking)
7. **Taxonomies** (Configuration)

---

## 🏗️ Current Architecture

### Frontend (localStorage)
```
/lib/
├── products.ts       → Mock data + localStorage CRUD
├── coupons.ts        → Mock data + localStorage CRUD
├── inventory.ts      → localStorage operations
├── auditLog.ts       → localStorage operations
└── taxonomies.ts     → localStorage operations

/services/
├── productService.ts     → Ready but uses lib/products
├── couponService.ts      → Ready but uses Supabase (not wired)
├── orderService.ts       → Ready
├── inventoryService.ts   → Ready
└── (others to be created)
```

### After Migration (Supabase)
```
/lib/
├── products.ts       → Type definitions + business logic ONLY
├── coupons.ts        → Validation logic ONLY
├── inventory.ts      → Calculations ONLY
└── (pure domain logic)

/services/
├── productService.ts     → Real Supabase queries
├── couponService.ts      → Real Supabase queries
├── orderService.ts       → Real Supabase queries
└── (all data access through services)
```

---

## 📦 Migration Template (Use for Each Feature)

### Phase 1: Prepare Service Layer

1. **Enhance service file** (e.g., `services/productService.ts`)
   ```typescript
   // Add localStorage fallback during transition
   class ProductService {
     private useBackend = false; // Feature flag
     
     async getProducts() {
       if (this.useBackend) {
         return this.getFromSupabase();
       }
       return this.getFromLocalStorage();
     }
   }
   ```

2. **Test service in isolation**
   - Verify localStorage mode works
   - Verify Supabase mode works (once connected)

### Phase 2: Update Imports

3. **Find all imports** of the lib file
   ```bash
   # Example for products
   grep -r "from.*lib/products" src/
   ```

4. **Update imports one file at a time**
   ```typescript
   // Before
   import { getProducts } from '../lib/products';
   
   // After
   import { productService } from '../services/productService';
   const products = await productService.getProducts();
   ```

5. **Test each file change** before moving to next

### Phase 3: Enable Backend

6. **Flip feature flag** when ready
   ```typescript
   private useBackend = true; // Now using Supabase!
   ```

7. **Monitor for issues**
   - Check browser console
   - Test all CRUD operations
   - Verify data integrity

8. **Remove localStorage code** once stable
   - Clean up old localStorage functions from `/lib/`
   - Keep only business logic

---

## 🎯 Feature-Specific Migration Plans

### 1. Products Migration

**Complexity:** ⭐⭐⭐ Medium  
**Time Estimate:** 4-6 hours  
**Risk:** Low (foundational feature)

#### Files to Update:
```
/lib/products.ts
  Keep: Type definitions, helper functions (getTotalStock, etc.)
  Remove: getProducts(), addProduct(), updateProduct(), deleteProduct()
  
/services/productService.ts
  Add: localStorage fallback mode
  Enhance: All CRUD operations with real Supabase
  
Files importing from lib/products:
  ✓ src/viewmodels/useProductListViewModel.ts
  ✓ src/viewmodels/useProductDetailViewModel.ts
  ✓ src/views/AdminDashboardPage.tsx
  ✓ src/components/admin/ProductManagement.tsx
  ✓ (Find others with grep)
```

#### Migration Steps:
1. Enhance `services/productService.ts` with dual mode
2. Update viewmodels to use productService
3. Test admin product management
4. Test customer product browsing
5. Enable Supabase mode
6. Monitor for issues
7. Clean up localStorage code

#### Rollback Plan:
- Set `useBackend = false` to revert to localStorage
- No data loss (keep both modes working)

---

### 2. Authentication Migration

**Complexity:** ⭐⭐⭐⭐ High  
**Time Estimate:** 6-8 hours  
**Risk:** High (security critical)

#### Files to Update:
```
/services/authService.ts
  Enhance: Supabase Auth integration
  Add: Session management
  Add: Email verification
  
/contexts/AuthContext.tsx
  Update: Use authService instead of localStorage
  
Files using localStorage auth:
  ✓ All pages checking user session
  ✓ Protected routes
  ✓ Admin dashboard
```

#### Migration Steps:
1. Set up Supabase Auth in dashboard
2. Implement authService with Supabase
3. Keep localStorage as fallback during testing
4. Update AuthContext
5. Test login/logout flows
6. Test protected routes
7. Enable email verification
8. Monitor sessions

#### Rollback Plan:
- Keep localStorage auth working in parallel
- Feature flag to switch between modes

---

### 3. Orders Migration

**Complexity:** ⭐⭐⭐⭐ High  
**Time Estimate:** 8-10 hours  
**Risk:** High (business critical)

#### Files to Update:
```
/services/orderService.ts
  Already exists: place-order edge function
  Enhance: Full CRUD operations
  Add: Order status updates
  Add: Payment integration
  
Files using orders:
  ✓ src/viewmodels/useCheckoutViewModel.ts
  ✓ src/components/admin/OrderManagement.tsx
  ✓ src/views/OrderConfirmationPage.tsx
```

#### Migration Steps:
1. Test existing place-order edge function
2. Enhance orderService with all operations
3. Update checkout flow
4. Update admin order management
5. Test order lifecycle (pending → confirmed → shipped)
6. Enable real payment gateway
7. Monitor orders

---

### 4. Coupons Migration

**Complexity:** ⭐⭐ Easy  
**Time Estimate:** 2-3 hours  
**Risk:** Low

#### Files to Update:
```
/lib/coupons.ts
  Keep: Validation logic (calculateDiscount, etc.)
  Remove: getCoupons(), localStorage operations
  
/services/couponService.ts
  Already has Supabase code!
  Add: localStorage fallback
  
Files using coupons:
  ✓ src/viewmodels/useCheckoutViewModel.ts
  ✓ src/components/admin/CouponManagement.tsx
```

#### Migration Steps:
1. Wire up existing couponService
2. Update checkout to use service
3. Update admin coupon management
4. Test coupon validation
5. Test usage tracking

---

### 5. Inventory Migration

**Complexity:** ⭐⭐⭐ Medium  
**Time Estimate:** 4-5 hours  
**Risk:** Medium (stock accuracy critical)

#### Files to Update:
```
/lib/inventory.ts
  Keep: Stock calculations (FIFO logic, etc.)
  Remove: localStorage operations
  
/services/inventoryService.ts
  Already exists!
  Enhance: Warehouse stock management
  
Files using inventory:
  ✓ src/components/admin/InventoryTracking.tsx
  ✓ Order placement (stock reservation)
```

---

### 6. Audit Logs Migration

**Complexity:** ⭐⭐ Easy  
**Time Estimate:** 2-3 hours  
**Risk:** Low

#### Files to Create/Update:
```
/services/auditLogService.ts (CREATE)
  Add: Write logs to Supabase
  Add: Query logs with filters
  
/lib/auditLog.ts
  Keep: Log formatting logic
  Remove: localStorage operations
  
/hooks/useAuditLog.ts
  Update: Use auditLogService
```

---

### 7. Taxonomies Migration

**Complexity:** ⭐ Very Easy  
**Time Estimate:** 1-2 hours  
**Risk:** Very Low

#### Files to Create/Update:
```
/services/taxonomyService.ts (CREATE)
  Add: CRUD for categories, materials, colors
  
/lib/taxonomies.ts
  Keep: Taxonomy helpers
  Remove: localStorage operations
```

---

## 🚦 Feature Flags Pattern

Use environment variables to control migration:

```typescript
// .env.local
NEXT_PUBLIC_USE_BACKEND_PRODUCTS=true
NEXT_PUBLIC_USE_BACKEND_ORDERS=false
NEXT_PUBLIC_USE_BACKEND_COUPONS=false
```

```typescript
// services/productService.ts
class ProductService {
  private useBackend = 
    process.env.NEXT_PUBLIC_USE_BACKEND_PRODUCTS === 'true';
    
  async getProducts() {
    if (this.useBackend) {
      return this.getFromSupabase();
    }
    return this.getFromLocalStorage();
  }
}
```

**Benefits:**
- ✅ Instant rollback (change env var)
- ✅ Test in production with small % of users
- ✅ No code deployment needed to switch

---

## ✅ Testing Checklist (Per Feature)

Before enabling backend for any feature:

### Functional Testing
- [ ] Create operation works
- [ ] Read/List operation works
- [ ] Update operation works
- [ ] Delete operation works
- [ ] Error handling works
- [ ] Loading states work
- [ ] Empty states work

### Data Integrity
- [ ] No data loss during migration
- [ ] Data format matches expectations
- [ ] Relationships maintained (foreign keys)
- [ ] Timestamps correct

### Performance
- [ ] Page load time acceptable
- [ ] Query response time < 1s
- [ ] No N+1 query issues
- [ ] Proper indexes in place

### Security
- [ ] RLS policies working
- [ ] User can't access other's data
- [ ] Admin-only features protected
- [ ] SQL injection prevented

---

## 🆘 Rollback Procedures

If something goes wrong:

### Immediate Rollback (< 1 minute)
```bash
# Change env variable
NEXT_PUBLIC_USE_BACKEND_PRODUCTS=false

# Restart dev server
npm run dev
```

### Data Recovery
```sql
-- If bad data got into Supabase
-- Restore from backup or localStorage export
```

### Communication
1. Alert team
2. Document issue
3. Fix root cause
4. Re-test before re-enabling

---

## 📊 Migration Progress Tracker

| Feature      | Status | Started | Completed | Notes |
|--------------|--------|---------|-----------|-------|
| Products     | 📝 TODO |         |           |       |
| Auth         | 📝 TODO |         |           |       |
| Orders       | 📝 TODO |         |           |       |
| Coupons      | 📝 TODO |         |           |       |
| Inventory    | 📝 TODO |         |           |       |
| Audit Logs   | 📝 TODO |         |           |       |
| Taxonomies   | 📝 TODO |         |           |       |

Update this as you progress!

---

## 🎓 Best Practices

### Do's ✅
- Migrate one feature at a time
- Keep localStorage as fallback during testing
- Write tests before migrating
- Monitor logs after enabling
- Communicate with users about changes

### Don'ts ❌
- Don't migrate multiple features simultaneously
- Don't remove localStorage code until stable
- Don't skip testing
- Don't assume Supabase queries work like localStorage
- Don't forget RLS policies

---

## 🔗 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js + Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- Edge Functions: `./supabase/functions/`
- Database Schema: `./supabase/migrations/`

---

## 💡 Tips

1. **Start on Friday** - Gives weekend to fix issues
2. **Migrate in staging first** - Test with real data
3. **Use feature flags** - Easy rollback
4. **Keep team informed** - Communication is key
5. **Document everything** - Future you will thank you

---

**Last Updated:** 2026-02-09  
**Next Migration:** Products (recommended start)
