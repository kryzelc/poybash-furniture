# PoyBash Furniture - Architecture Documentation

## 🏗️ MVVM Architecture Overview

This project follows the **Model-View-ViewModel (MVVM)** architectural pattern for clean separation of concerns and maintainability.

---

## 📁 Project Structure

```
src/
├── models/              ✅ MODEL Layer
│   ├── Cart.ts          - Shopping cart domain entity
│   ├── Coupon.ts        - Coupon/discount domain entity  
│   ├── Inventory.ts     - Stock/warehouse domain entity
│   ├── Order.ts         - Order domain entity
│   ├── Product.ts       - Product domain entity
│   ├── User.ts          - User/account domain entity
│   └── index.ts         - Barrel exports
│
├── views/               ✅ VIEW Layer
│   ├── HomePage.tsx           - Landing page
│   ├── ProductsPage.tsx       - Product catalog
│   ├── ProductDetailPage.tsx  - Single product view
│   ├── CheckoutPage.tsx       - Checkout flow
│   ├── AccountPage.tsx        - User account management
│   ├── AdminDashboardPage.tsx - Admin panel
│   └── (25+ other views)
│
├── viewmodels/          ✅ VIEWMODEL Layer
│   ├── useAuthViewModel.ts          - Authentication logic
│   ├── useCartViewModel.ts          - Shopping cart logic
│   ├── useCheckoutViewModel.ts      - Checkout flow logic
│   ├── useProductViewModel.ts       - Product operations
│   ├── useProductListViewModel.ts   - Product listing logic
│   ├── useProductDetailViewModel.ts - Product detail logic
│   └── index.ts                     - Barrel exports
│
├── services/            ✅ INFRASTRUCTURE Layer (Data Access)
│   ├── authService.ts         - Authentication API
│   ├── productService.ts      - Product data access
│   ├── orderService.ts        - Order data access
│   ├── couponService.ts       - Coupon data access
│   ├── inventoryService.ts    - Inventory data access
│   ├── userService.ts         - User data access
│   ├── storageService.ts      - File storage URLs
│   ├── realtimeService.ts     - Real-time subscriptions (future)
│   ├── supabaseClient.ts      - Supabase connection
│   └── index.ts               - Barrel exports
│
├── lib/                 ✅ DOMAIN LOGIC Layer
│   ├── products.ts      - Product business logic + mock data
│   ├── coupons.ts       - Coupon validation logic + mock data
│   ├── inventory.ts     - Stock calculations + mock data
│   ├── auditLog.ts      - Audit trail logic + localStorage
│   ├── taxonomies.ts    - Category/material management
│   ├── permissions.ts   - Role-based access control (RBAC)
│   ├── productUtils.ts  - Product helper functions
│   ├── validation.ts    - Input validation helpers
│   └── utils.ts         - General utility functions
│
├── components/          ✅ REUSABLE UI COMPONENTS
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ProductCard.tsx
│   ├── CartDrawer.tsx
│   ├── admin/              - Admin-specific components
│   │   ├── ProductManagement.tsx
│   │   ├── OrderManagement.tsx
│   │   ├── AccountManagement.tsx
│   │   ├── SalesDashboard.tsx
│   │   └── (12+ more)
│   └── ui/                 - Shadcn UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── (50+ more)
│
├── contexts/            ✅ STATE MANAGEMENT
│   ├── AuthContext.tsx  - Global auth state
│   └── CartContext.tsx  - Global cart state
│
├── hooks/               ✅ CUSTOM HOOKS
│   └── useAuditLog.ts   - Audit logging hook
│
├── types/               ✅ TYPESCRIPT DEFINITIONS
│   └── global.d.ts      - Global type definitions
│
└── app/                 ✅ NEXT.JS APP ROUTER
    ├── (customer)/      - Customer-facing routes
    ├── admin/           - Admin-only routes
    ├── layout.tsx       - Root layout
    └── providers.tsx    - Context providers
```

---

## 🔄 MVVM Data Flow

### Read Flow (Display Data)
```
View → ViewModel → Service/Lib → Model → Service/Lib → ViewModel → View
  │         │          │           │          │            │         │
  │         │          │           │          │            │         └─ UI updates
  │         │          │           │          │            └─ Transform data
  │         │          │           │          └─ Return data
  │         │          │           └─ Domain entity
  │         │          └─ Fetch from localStorage/API
  │         └─ Business logic
  └─ User action/page load
```

### Write Flow (Save Data)
```
View → ViewModel → Service/Lib → localStorage/API
  │         │          │
  │         │          └─ Persist data
  │         └─ Validate & transform
  └─ User action (submit form, etc.)
```

---

## 🎭 Role-Based Access Control (RBAC)

### ✅ **Is Your MVVM Architecture Catered for Role-Based Accounts?**

**YES! Your architecture is perfectly designed for RBAC.** Here's how:

### 1. **Permission System** (`lib/permissions.ts`)
```typescript
export type Role = 'customer' | 'staff' | 'inventory-clerk' | 'admin' | 'owner';

// Each role has specific permissions
- Customer: Shopping & account management
- Staff: Sales operations & refunds
- Inventory Clerk: Stock management & fulfillment
- Admin: Full operational management
- Owner: Complete system access
```

### 2. **User Model** (`models/User.ts`)
```typescript
interface User {
  id: string;
  email: string;
  role: Role;  // ✅ Role is part of user entity
  ...
}
```

### 3. **AuthContext** (`contexts/AuthContext.tsx`)
```typescript
// Provides current user + role globally
const { user } = useAuth();
// user.role → 'customer' | 'staff' | 'admin' | etc.
```

### 4. **Permission Checks in ViewModels**
```typescript
// ViewModels enforce business logic based on roles
const canEdit = hasPermission(user.role, 'edit:products');
```

### 5. **Protected Routes**
```typescript
// Routes are protected based on roles
app/admin/ → Requires admin/owner role
app/(customer)/ → Public or customer role
```

### 6. **UI Component Visibility**
```typescript
// Components show/hide based on permissions
{hasPermission(user.role, 'create:products') && (
  <Button>Add Product</Button>
)}
```

---

## ✅ MVVM Role Support - Checklist

| Layer | Role Support | How It Works |
|-------|--------------|--------------|
| **Models** | ✅ Yes | User model includes `role` field |
| **Views** | ✅ Yes | Show/hide components based on permissions |
| **ViewModels** | ✅ Yes | Enforce business rules per role |
| **Services** | ✅ Yes | Data access respects role permissions |
| **Lib** | ✅ Yes | `permissions.ts` defines all role rules |
| **Contexts** | ✅ Yes | AuthContext provides current user role |
| **Routes** | ✅ Yes | App router protects admin routes |

---

## 🎯 Role-Specific Features

### Customer Role
- **Can:**
  - Browse products
  - Add to cart
  - Place orders
  - View own orders
  - Manage account
  - Cancel own orders (before processing)

- **Cannot:**
  - Access admin panel
  - View other users' data
  - Manage inventory
  - Process refunds

### Staff Role
- **Can:**
  - All customer capabilities
  - Access admin panel
  - View all orders
  - Create manual orders (for walk-ins)
  - Update order status
  - Process refunds ✅
  - View customer details
  - Create customer accounts

- **Cannot:**
  - Manage inventory
  - Create/edit products
  - Create staff/admin accounts
  - Access system settings

### Inventory Clerk Role
- **Can:**
  - Access admin panel
  - View products
  - Manage inventory levels ✅
  - Update warehouse stock ✅
  - Transfer stock between warehouses
  - Fulfill orders
  - View orders

- **Cannot:**
  - Process refunds
  - Create/edit products
  - Create accounts
  - View financial reports

### Admin Role
- **Can:**
  - All staff capabilities
  - All inventory clerk capabilities
  - Create/edit/delete products ✅
  - Manage inventory
  - Create coupons
  - View revenue & analytics
  - Export reports
  - Create customer/staff/clerk accounts
  - Manage system settings

- **Cannot:**
  - Create other admin accounts
  - (Only owner can create admins)

### Owner Role
- **Can:**
  - Everything! ✅
  - Create admin accounts
  - Full system access
  - Strategic oversight

---

## 🔐 Demo Accounts

Use these credentials to test different roles:

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| **Owner** | owner@poybash.com | Owner@2024 | Full system access |
| **Admin** | admin@poybash.com | Admin@2024 | Operational management |
| **Staff** | staff@poybash.com | Staff@2024 | Sales & customer service |
| **Clerk** | clerk@poybash.com | Clerk@2024 | Warehouse operations |
| **Customer** | customer@poybash.com | Customer@2024 | Shopping experience |

**To create these accounts:**
1. Open `seed-demo-accounts.html` in your browser
2. Click "Create Demo Accounts"
3. Go to `/login` and test each role

---

## 📊 Architecture Benefits for Role-Based System

### ✅ Separation of Concerns
- **Models** define what data exists (including roles)
- **ViewModels** enforce what users can do (based on permissions)
- **Views** show what users can see (conditional rendering)
- **Services** control what data is accessible

### ✅ Easy to Extend
- Add new role: Update `lib/permissions.ts`
- Add new permission: Add to permission list
- Add role-specific feature: Check permission in ViewModel

### ✅ Testable
- Unit test ViewModels with different roles
- Integration test permission checks
- E2E test role-based flows

### ✅ Maintainable
- All permission logic centralized in one place
- Clear separation of responsibilities
- Easy to audit who can do what

---

## 🔄 Current Data Strategy

### Frontend Development Phase (NOW)
```
Models → ViewModels → Lib (localStorage) → Views
```
- **Purpose:** Prototype UI/UX without backend
- **Data:** Mock data in `lib/` files
- **Storage:** localStorage for temporary persistence

### Backend Integration Phase (LATER)
```
Models → ViewModels → Services (Supabase) → Views
```
- **Purpose:** Production-ready with real database
- **Data:** Real data from Supabase
- **Storage:** PostgreSQL with RLS (Row Level Security)

### Migration Strategy
See `MIGRATION_GUIDE.md` for step-by-step instructions on migrating each feature from localStorage to Supabase.

---

## 🎨 Design Patterns Used

### 1. **MVVM Pattern**
- Separation of UI, logic, and data
- Testable business logic
- Reactive data binding (React hooks)

### 2. **Repository Pattern** (Services Layer)
- Abstract data access
- Easy to swap data sources
- Centralized data operations

### 3. **Singleton Pattern** (Services)
```typescript
export const productService = new ProductService();
```
- One instance per service
- Shared state management

### 4. **Strategy Pattern** (Permissions)
```typescript
const permissions = rolePermissions[user.role];
```
- Different behavior per role
- Easy to add new roles

### 5. **Observer Pattern** (Contexts)
```typescript
<AuthContext.Provider value={{user, login, logout}}>
```
- Global state management
- Components react to state changes

---

## 🔍 Code Organization Principles

### ✅ Single Responsibility
- Each file has one clear purpose
- Models = data structure
- ViewModels = business logic
- Services = data access

### ✅ Dependency Inversion
```
Views → ViewModels → Services
  ↓        ↓           ↓
Never ← Models ← Models
```
- High-level modules don't depend on low-level
- Both depend on abstractions (interfaces)

### ✅ Don't Repeat Yourself (DRY)
- Shared logic in `lib/utils.ts`
- Reusable components in `components/`
- Common hooks in `hooks/`

### ✅ Keep It Simple (KISS)
- No over-engineering
- Clear naming conventions
- Pragmatic solutions

---

## 📝 File Naming Conventions

- **Models:** PascalCase - `User.ts`, `Product.ts`
- **Views:** PascalCase - `HomePage.tsx`, `ProductsPage.tsx`
- **ViewModels:** camelCase with prefix - `useProductViewModel.ts`
- **Services:** camelCase with suffix - `productService.ts`
- **Components:** PascalCase - `Header.tsx`, `ProductCard.tsx`
- **Lib:** camelCase - `permissions.ts`, `validation.ts`
- **Hooks:** camelCase with prefix - `useAuditLog.ts`

---

## 🚀 Next Steps

1. **Frontend Polish**
   - Improve UI/UX
   - Add animations
   - Optimize performance
   - Test role-based flows

2. **Backend Integration**
   - Follow `MIGRATION_GUIDE.md`
   - Migrate features incrementally
   - One role at a time for testing

3. **Testing**
   - Unit tests for ViewModels
   - Integration tests for Services
   - E2E tests for critical flows
   - Role-based permission tests

4. **Documentation**
   - API documentation
   - Component documentation
   - Deployment guide

---

## 📚 Resources

- **MVVM Pattern:** [Microsoft Documentation](https://docs.microsoft.com/en-us/xamarin/xamarin-forms/enterprise-application-patterns/mvvm)
- **React Hooks:** [Official React Docs](https://react.dev/reference/react)
- **Role-Based Access Control:** [OWASP Guidelines](https://owasp.org/www-community/Access_Control)
- **Next.js:** [Next.js Documentation](https://nextjs.org/docs)

---

**Last Updated:** 2026-02-09  
**Architecture Version:** 1.0.0  
**Author:** Kryzel Cassandra Cruz
