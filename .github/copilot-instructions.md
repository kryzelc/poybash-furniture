# PoyBash Furniture - AI Copilot Instructions

Essential knowledge for AI agents contributing to this Next.js + Supabase e-commerce platform.

## 🏗️ Architecture Overview

**Tech Stack:** Next.js 15, React 18, Supabase (PostgreSQL + Auth), TailwindCSS + Radix UI

**Data Flow:**

1. User authentication via Supabase Auth (email/password)
2. Frontend reads user role from `AuthContext` (sourced from `users.role` enum)
3. Components check permissions via `hasPermission()` in `/src/lib/permissions.ts`
4. Database access protected by PostgreSQL Row-Level Security (RLS) policies
5. All data mutations logged via `addAuditLog()` for immutable audit trail
6. Inventory changes flow through dedicated library (`/src/lib/inventory.ts`)

**Key Directories:**

- `/src/app/` - Next.js app router (customer & admin routes)
- `/src/components/` - Reusable UI components (Radix-based)
- `/src/contexts/` - React context: `AuthContext`, `CartContext`
- `/src/lib/` - Business logic: permissions, audit logging, inventory, coupons, products
- `/src/views/` - Page-level view components
- `/supabase/migrations/` - SQL schema (08 ordered migration scripts)

## 👥 Role-Based Access Control (RBAC)

**5 Roles** (hierarchical, defined in `/src/lib/permissions.ts`):

| Role                | Key Permissions                                                                       | Use Case                 |
| ------------------- | ------------------------------------------------------------------------------------- | ------------------------ |
| **Customer**        | View own orders, browse products, place orders, request refunds                       | Self-service shopping    |
| **Sales Staff**     | View all orders, create manual orders, process refunds, create customer accounts      | Customer service & POS   |
| **Inventory Clerk** | Manage warehouse stock (transfer, add, reduce), create manual orders, process refunds | Warehouse operations     |
| **Admin**           | Edit/add products, manage categories, manage coupons, update order status             | Full operational control |
| **Owner**           | Create admin accounts, export reports, access audit logs                              | Business owner only      |

**Critical Pattern:** Use `hasPermission(permission, userRole)` before any action. Never trust client-side checks alone—RLS policies enforce server-side.

## 🔐 Security & Audit Logging

**Every data change must be logged** via `/src/lib/auditLog.ts`:

- Use `useAuditLog()` hook for standardized logging
- Actions tracked: `account_created`, `product_modified`, `order_status_updated`, `refund_approved`, etc.
- Audit logs stored in `audit_logs` table (owner-only view, immutable INSERT-only)
- Example: When staff approves refund → log `"refund_approved"` with `performedBy`, `targetEntity`, `changes`

**RLS Policies** enforce data isolation:

- Customers see only own orders
- Staff see all orders but cannot modify product data
- Admins manage content; owners see everything

## 📦 Inventory Management

**Two Warehouses:** Lorenzo & Oroquieta (tracked in migration scripts)

**Stock Flow:**

1. When order placed → `reserveStock()` decrements available inventory
2. When order completed → `deductStock()` deducts from actual stock
3. When order cancelled → `restoreStock()` restores inventory
4. Clerks transfer stock via `transferStock(productId, fromWarehouse, toWarehouse, quantity)`

**Location:** `/src/lib/inventory.ts` contains all operations. Pattern: Always specify `warehouse` parameter.

## 🛒 Order & Payment System

**Order Statuses:** `pending` → `processing` → `ready-for-pickup` → `completed` (or `refund-requested` → `refunded`)

**Payment Methods:** Cash, GCash (screenshot), Bank Transfer (slip)

- Staff verify proofs before order completion
- Reservation system: partial payment (e.g., 30%) holds inventory

**Manual Orders:** Sales/Clerk can create orders for walk-ins or social media sales

- Set `is_manual_order: true`, `created_by: staffUserId`
- Delivery options: store-pickup, customer-arranged, staff-delivery

## 💳 Coupon System

**Location:** `/src/lib/coupons.ts`

**Pattern:**

- Admins create coupons with code, discount %, validity dates
- Customers apply via code at checkout
- Use `validateCoupon()` to check: code exists, active, not expired, not used
- On order apply: `applyCoupon()` deducts amount; track `coupon_id` on order
- On refund: `returnCoupon()` restores usage

## 📝 Database & Migrations

**Migration Scripts** (run in order via Supabase SQL Editor):

1. `01_create_types.sql` - Enums (roles, order statuses, payment methods)
2. `02_create_tables.sql` - Schema (users, products, orders, inventory_batches, etc.)
3. `03_create_indexes.sql` - Performance (email, order_number, created_at)
4. `04_create_functions.sql` - Helper functions (FIFO batch selection)
5. `05_enable_rls.sql` - Enable row security
6. `06_create_rls_policies.sql` - Access control rules
7. `07_seed_users.sql` - Test accounts (customer@, sales@, clerk@, admin@, owner@)
8. `08_seed_data.sql` - Sample products

**Key Tables:**

- `users` - email, role, active, email_verified_at
- `products` - name, price, category_id, image_url, featured, active
- `orders` - user_id, items (JSONB), status, payment_method, created_by
- `warehouse_stock` - product_id, warehouse, quantity, reserved
- `audit_logs` - immutable transaction log (INSERT only)
- `coupons` - code, discount_type, discount_value, valid_from/until

## 🔧 Developer Workflows

**Environment Setup:**

```bash
npm install
# Create .env.local with NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev  # http://localhost:3000
```

**Build & Lint:**

```bash
npm run build  # Compile & type-check
npm run lint   # ESLint (Next.js rules)
```

**Test Accounts:** (via `/MIGRATION_CHECKLIST.md`)

- customer@poybash.com / customer123
- sales@poybash.com / sales123
- clerk@poybash.com / clerk123
- admin@poybash.com / admin123
- owner@poybash.com / owner123

## 🎨 UI Patterns & Component Library

**UI Framework:** Shadcn/ui (built on Radix) + TailwindCSS

- Components in `/src/components/ui/` (alert, button, dialog, form, input, etc.)
- Admin components in `/src/components/admin/` (OrderCRUD, AccountManagement, InventoryTracking)
- Always use Radix dialog/popover for modals (not custom)
- Toast notifications via `sonner` (`Toaster` in root layout, `toast()` in components)

**Form Handling:** React Hook Form

- Example: `/src/views/LoginPage.tsx` shows auth form pattern
- Use `useForm()` + `<form onSubmit={handleSubmit(onSubmit)}>`
- Validate via `resolver: zodResolver(schema)` if using Zod

**Styling Convention:** TailwindCSS utility classes

- No inline styles; use `clsx()` for conditional classes
- Dark mode support via `suppressHydrationWarning` in root html

## 📊 Data Fetching & Real-time

**Supabase Client:** `/src/utils/supabase/client.ts`

- Direct `.from('table').select()` for queries
- `.on('*')` for real-time subscriptions (optional)
- Handle RLS errors gracefully (user lacks permission)

**Pattern for Pages:**

- Use server components where possible (Next.js 15 default)
- Client components (`'use client'`) only for interactivity (forms, dialogs, real-time)
- Fetch in server components; pass data as props

## 🚨 Common Pitfalls & Rules

1. **Never skip audit logs** - Every material data change must call `addAuditLog()`
2. **Always check permissions** - Client checks are UX; RLS is security
3. **Specify warehouse in inventory operations** - `reserveStock(productId, warehouse, qty)`
4. **Soft deletes only** - Set `active: false`, never DELETE rows (audit trail)
5. **Variant tracking** - Orders have both new (`variantId`) and legacy (`color`/`size`) fields for backward compatibility
6. **Email verification** - `users.email_verified_at` field enforces verified status
7. **Refund window** - 7-day limit enforced via CHECK constraint on `order_items.refund_requested_at`

## 🎯 Senior Software Engineering Standards

### Type Safety & Code Quality

- **Strict TypeScript** - Enable `strict: true` in tsconfig (non-negotiable for production)
- **No `any` types** - Always define proper interfaces/types, use generics when needed
- **Exhaustive checks** - Use discriminated unions for `status` fields; TypeScript should error on missing cases
- **Prop validation** - Interface all component props; validate at boundaries (API responses, form inputs)
- **Error boundaries** - Wrap error-prone sections in React error boundaries; graceful fallback UIs

### Input Validation & Sanitization

- **Validate at entry points** - All form submissions, API calls, file uploads must be validated
- **Sanitize before storage** - Escape HTML in user inputs to prevent XSS (use DOMPurify if rendering user content)
- **Validate file uploads** - Check size (< 5MB), MIME type, virus scan before storing in Supabase
- **Email/phone validation** - Use regex patterns or libraries; normalize before storage
- **SQL injection prevention** - Use parameterized queries (Supabase client handles this; never build SQL strings)
- **Rate limiting** - Implement rate limiting on sensitive endpoints (auth, payments, refunds)

### Error Handling & Resilience

- **Try-catch all async operations** - Never leave unhandled promise rejections
- **Specific error messages** - Log errors with context (user, action, state) for debugging; expose safe messages to users
- **Retry logic** - For transient failures (network, timeouts), implement exponential backoff
- **Graceful degradation** - If a feature fails, degrade gracefully rather than crashing (e.g., real-time not available → fallback to polling)
- **No sensitive data in logs** - Never log passwords, payment data, tokens, or personally identifiable information

### Transaction Safety & Data Integrity

- **Transactions for multi-step operations** - Use Supabase transactions (or implement idempotency keys) for order creation, refunds
- **Idempotency keys** - For payment operations and manual orders, use unique keys to prevent double-processing
- **Check constraints in DB** - Enforce business rules at database level (e.g., 7-day refund window, price > 0)
- **Concurrency handling** - For inventory operations, use `warehouse_stock.reserved` column + transactions to prevent overselling
- **Version control for data** - Use `updated_at` timestamps; detect concurrent modifications before committing

### Security Best Practices

- **Principle of least privilege** - Users should only access data/actions required for their role; RLS enforces this
- **Secure payment handling** - Never store raw card data; verify payment proofs before marking orders complete
- **Session management** - Supabase Auth handles JWTs; validate `email_verified_at` before allowing sensitive actions
- **HTTPS only** - In production, enforce HTTPS; set secure cookies (httpOnly, sameSite)
- **Environment secrets** - Never commit API keys, passwords, or private keys; use `.env.local` and Supabase secrets
- **Regular security audits** - Review RLS policies, audit logs, and access patterns quarterly
- **CSRF protection** - Next.js handles CSRF by default; verify origin on sensitive requests

### Performance & Optimization

- **Database indexes** - Verify migration `03_create_indexes.sql` is applied; index all frequently queried columns (email, order_number, created_at)
- **Query optimization** - Use `.select('col1, col2')` to fetch only needed fields, not `SELECT *`
- **Pagination** - For lists, implement `.range(0, 50)` to avoid loading massive datasets
- **Caching strategy** - Cache product list (rarely changes); invalidate cache on updates; use Next.js `revalidateTag()`
- **Image optimization** - Use Next.js `<Image>` component with proper dimensions; lazy load product images
- **Bundle size** - Regularly audit dependencies; prefer lighter alternatives (e.g., date-fns over moment)
- **Lazy loading** - Code-split heavy components (PDF generation, charts) with dynamic imports

### Testing & Verification

- **Manual testing checklist** - Before deployments, test all role-based flows (customer, staff, clerk, admin, owner)
- **Edge cases** - Test boundary conditions: empty carts, expired coupons, 0 inventory, refund window closed
- **Multi-warehouse scenarios** - Test stock transfers, insufficient inventory, warehouse-specific restrictions
- **Concurrent operations** - Manually test simultaneous orders against same inventory to catch race conditions
- **Payment scenarios** - Test all payment methods (cash, GCash, bank transfer); verify proof upload & verification
- **Error scenarios** - Test network failures, Supabase downtime, invalid inputs; verify error messages are user-friendly

### Deployment & Production Readiness

- **Environment parity** - `.env.local` for dev mirrors production Supabase keys (different projects, same schema)
- **Database migration checklist** - All 8 migrations must run in order; verify on staging before production
- **Health checks** - Monitor Supabase connection, RLS policy effectiveness, audit log integrity
- **Rollback plan** - Database migrations are immutable; plan schema changes carefully (backwards-compatible approach)
- **Monitoring & alerts** - Track slow queries (> 1s), failed RLS checks, spike in audit logs (unusual activity)
- **Secrets rotation** - Supabase API keys should be rotated quarterly; update `.env` and redeploy
- **Backup strategy** - Supabase backups are automatic; test restore process quarterly

### Code Review Mindset

- **Self-review before pushing** - Check for hardcoded values, console.log statements, commented code
- **Security review** - Before any PR with auth/payment/data changes, verify RLS, permissions, audit logging
- **Performance review** - Check for N+1 queries, unoptimized loops, unnecessary re-renders
- **Testing coverage** - Manual test all modified flows; document test steps in PR description
- **Documentation** - Update this file if adding new patterns; comment non-obvious business logic

## � Rate Limiting Implementation Guide (Production Priority)

Rate limiting is **critical but not yet implemented**. Add before production deployment.

### Critical Endpoints Requiring Rate Limiting

**Auth Endpoints (Prevent brute force):**

- `POST /auth/login` - Max 5 attempts per 15 minutes per IP
- `POST /auth/register` - Max 3 attempts per hour per IP
- `POST /auth/forgot-password` - Max 3 requests per hour per email
- `POST /auth/verify-email` - Max 10 attempts per hour per email

**Payment & Sensitive Operations (Prevent fraud):**

- `POST /orders` - Max 3 orders per hour per user (suspicious beyond this)
- `POST /refunds` - Max 1 refund per 10 seconds per user (prevent accidental duplicates)
- `POST /coupons/validate` - Max 10 attempts per minute per user
- `PUT /orders/:id/status` - Max 20 updates per minute per admin (prevent automation attacks)

**API Endpoints (Prevent DoS):**

- `GET /products` - Max 100 requests per minute per IP (or paginated queries)
- `GET /orders` - Max 60 requests per minute per user
- Search/filter endpoints - Max 30 requests per minute per user

### Implementation Approaches for Next.js

**Option 1: Vercel Edge Middleware (Recommended for Vercel)**

```typescript
// middleware.ts - applies to all routes
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 requests per 15 minutes
});

export async function middleware(request: NextRequest) {
  const ip = request.ip || "127.0.0.1";
  const { success, remaining, resetTime } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded", resetTime },
      { status: 429 },
    );
  }

  return NextResponse.next({
    request: {
      headers: request.headers.set(
        "X-RateLimit-Remaining",
        remaining.toString(),
      ),
    },
  });
}

export const config = {
  matcher: ["/api/:path*", "/auth/:path*"],
};
```

**Option 2: Hono Middleware (for Supabase Edge Functions)**

```typescript
// src/supabase/functions/server/index.tsx
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";

const app = new Hono();

// TODO: Implement rate limiting via Upstash Redis or similar
// Add middleware before sensitive routes
// app.use("/api/auth/*", rateLimitMiddleware);
// app.use("/api/orders/*", rateLimitMiddleware);

export default app;
```

**Option 3: Application-Level Middleware (Fallback)**

```typescript
// lib/rateLimit.ts
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const current = requestCounts.get(key) || {
    count: 0,
    resetTime: now + windowMs,
  };

  if (now > current.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: current.resetTime,
    };
  }

  if (current.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
    };
  }

  current.count += 1;
  requestCounts.set(key, current);
  return {
    allowed: true,
    remaining: maxRequests - current.count,
    resetTime: current.resetTime,
  };
}
```

### Implementation Checklist

- [ ] Add `@upstash/ratelimit` and `@upstash/redis` packages (if using Upstash)
- [ ] Create rate limiting middleware for auth endpoints
- [ ] Create rate limiting middleware for payment endpoints
- [ ] Add rate limit headers to all API responses (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`)
- [ ] Log rate limit violations to audit trail
- [ ] Test with load testing tools (wrk, Apache Bench)
- [ ] Monitor rate limit metrics in production
- [ ] Set alerts for suspicious patterns (>50% limit hits in 1 hour)

## 🔍 Security Implementation TODO List (Analyze & Fix)

Based on codebase analysis, prioritize these security improvements for production:

### HIGH PRIORITY (Do Before Production)

**1. Remove Console Logs Exposing Data**

- **Issue**: `/src/lib/taxonomyMigration.ts` and other files contain `console.warn/log` that might expose error details in production
- **Action**: Replace all `console.*` with structured logging to secure logging service
- **Files**: `taxonomyMigration.ts`, `taxonomies.ts`, `AuthContext.tsx` (line 349)
- **Code**:

  ```typescript
  // ❌ BAD - Logs to browser console (visible to users)
  console.warn("Failed to add category:", error);

  // ✅ GOOD - Log to secure service
  await addAuditLog({
    actionType: "error_occurred",
    performedBy: { id: "system", email: "system", role: "system" },
    targetEntity: { type: "category", id: categoryId, name: categoryName },
    metadata: { errorMessage: sanitizeError(error.message) },
  });
  ```

**2. Add XSS Protection with DOMPurify**

- **Issue**: User inputs (product descriptions, order notes, coupon codes) could be stored with HTML/JS
- **Action**: Install `dompurify` and sanitize all user inputs before storing
- **Installation**: `npm install dompurify && npm install --save-dev @types/dompurify`
- **Files Needing Updates**:
  - `/src/lib/validation.ts` - Add sanitization function
  - `/src/views/CheckoutPage.tsx` - Sanitize order notes
  - `/src/views/AdminDashboardPage.tsx` - Sanitize product descriptions
  - `/src/components/admin/ManualOrderCreation.tsx` - Sanitize customer notes
- **Code**:

  ```typescript
  // lib/sanitization.ts
  import DOMPurify from "dompurify";

  export const sanitizeHtml = (dirty: string): string => {
    return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  };

  export const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, "").slice(0, 1000); // Max 1000 chars
  };
  ```

**3. Implement Error Boundary for All Views**

- **Issue**: No Error Boundary components wrapping views; unhandled errors crash app without graceful fallback
- **Action**: Create global Error Boundary and wrap all pages
- **Files Needing Updates**:
  - Create `/src/components/ErrorBoundary.tsx`
  - Wrap layout.tsx content with ErrorBoundary
  - All view components should be wrapped individually for fine-grained control
- **Code**:

  ```typescript
  // components/ErrorBoundary.tsx
  'use client';

  import React, { ReactNode } from 'react';
  import { Alert, AlertDescription } from './ui/alert';

  interface Props { children: ReactNode; fallback?: ReactNode; }
  interface State { hasError: boolean; error?: Error; }

  export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error) {
      addAuditLog({
        actionType: 'error_occurred',
        performedBy: { id: 'system', email: 'system', role: 'system' },
        targetEntity: { type: 'component', id: 'unknown', name: 'ErrorBoundary' },
        metadata: { errorMessage: sanitizeError(error.message), stack: 'hidden' },
      });
    }

    render() {
      if (this.state.hasError) {
        return this.props.fallback || (
          <Alert variant="destructive">
            <AlertDescription>
              Something went wrong. Please refresh the page or contact support.
            </AlertDescription>
          </Alert>
        );
      }

      return this.props.children;
    }
  }
  ```

**4. Validate/Sanitize All Supabase Responses**

- **Issue**: Data from Supabase (especially JSONB `items` field in orders) not validated before use
- **Action**: Create response validators for all tables
- **Files**: Create `/src/lib/responseValidation.ts`
- **Code**:

  ```typescript
  // lib/responseValidation.ts
  import { z } from "zod";

  export const OrderItemSchema = z.object({
    productId: z.number(),
    name: z.string().min(1).max(500),
    price: z.number().positive(),
    quantity: z.number().positive(),
    variantId: z.string().optional(),
    color: z.string().max(100).optional(),
    imageUrl: z.string().url(),
  });

  export const validateOrderItems = (items: unknown) => {
    return z.array(OrderItemSchema).safeParse(items);
  };
  ```

**5. Enforce HTTPS Redirect in Production**

- **Issue**: No middleware forcing HTTPS in production
- **Action**: Add middleware to redirect HTTP → HTTPS
- **File**: Update or create `middleware.ts`
- **Code**:

  ```typescript
  // middleware.ts
  import { NextRequest, NextResponse } from "next/server";

  export function middleware(request: NextRequest) {
    if (
      process.env.NODE_ENV === "production" &&
      request.nextUrl.protocol === "http:"
    ) {
      return NextResponse.redirect(
        `https://${request.nextUrl.host}${request.nextUrl.pathname}`,
        301,
      );
    }
    return NextResponse.next();
  }
  ```

**6. Implement CORS Whitelist (Restrict to Known Domains)**

- **Issue**: `/src/supabase/functions/server/index.tsx` has `origin: "*"` allowing any domain
- **Action**: Replace with explicit domain whitelist
- **File**: `src/supabase/functions/server/index.tsx`
- **Code**:

  ```typescript
  const allowedOrigins = [
    "https://poybash-furniture.com",
    "https://www.poybash-furniture.com",
    "https://admin.poybash-furniture.com",
  ];

  app.use(
    "/*",
    cors({
      origin: (origin) => (allowedOrigins.includes(origin) ? origin : false),
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
    }),
  );
  ```

**7. Add Request Timeout & Payload Size Limits**

- **Issue**: No explicit timeout or size limits on API requests
- **Action**: Configure in `next.config.ts` and create middleware
- **File**: Update `next.config.ts` and middleware
- **Code**:

  ```typescript
  // next.config.ts
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb', // Already set, verify it's not too high
      timeout: 60, // 60 seconds
    },
  },

  // middleware.ts - Add request timeout
  const REQUEST_TIMEOUT = 30000; // 30 seconds

  const withTimeout = (promise: Promise<any>, ms: number) => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), ms)
      ),
    ]);
  };
  ```

### MEDIUM PRIORITY (Do Within 1 Sprint)

**8. Implement Duplicate Order Detection**

- **Issue**: No check for duplicate orders in short timeframe (could be payment retry abuse)
- **Action**: Check if user created identical order within last 5 minutes
- **File**: `/src/lib/validation.ts` or new `/src/lib/duplicateDetection.ts`
- **Code**:

  ```typescript
  export const checkForDuplicateOrder = (
    userId: string,
    items: OrderItem[],
    orders: Order[],
  ): { isDuplicate: boolean; message?: string } => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentOrders = orders.filter(
      (o) => o.userId === userId && new Date(o.createdAt) > fiveMinutesAgo,
    );

    for (const recent of recentOrders) {
      if (
        JSON.stringify(recent.items.map((i) => [i.productId, i.quantity])) ===
        JSON.stringify(items.map((i) => [i.productId, i.quantity]))
      ) {
        return {
          isDuplicate: true,
          message:
            "Duplicate order detected. Please wait before placing the same order again.",
        };
      }
    }
    return { isDuplicate: false };
  };
  ```

**9. Add HTTPS-Only Secure Cookies**

- **Issue**: Supabase Auth sessions not explicitly marked HttpOnly/Secure
- **Action**: Configure Supabase client with secure options
- **File**: `/src/utils/supabase/client.ts`
- **Code**:

  ```typescript
  export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage:
          typeof window !== "undefined" ? window.localStorage : undefined,
        flowType: "pkce", // More secure than implicit flow
      },
      global: {
        headers: {
          "X-Client-Info": `supabase-js/${VERSION}`,
        },
      },
    },
  );

  // Verify cookies are HttpOnly in production
  // Set in Supabase dashboard: Auth → Security → HTTP Only Cookies: ON
  ```

**10. Validate Request Origins on Sensitive Actions**

- **Issue**: No CSRF token validation on state-changing operations from Supabase RLS
- **Action**: Add request header validation
- **File**: Create `/src/lib/csrfProtection.ts`
- **Code**:

  ```typescript
  export const validateRequestOrigin = (request: NextRequest): boolean => {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.nextUrl.host;

    const allowedHosts = [
      "poybash-furniture.com",
      "www.poybash-furniture.com",
      "localhost:3000",
    ];

    const originHost = new URL(origin || "").hostname;
    const refererHost = new URL(referer || "").hostname;

    return (
      allowedHosts.includes(originHost) &&
      allowedHosts.includes(refererHost) &&
      allowedHosts.includes(host)
    );
  };
  ```

**11. Implement Audit Log Archival (Owner-Only)**

- **Issue**: Audit logs stored in browser localStorage grow indefinitely (performance risk)
- **Action**: Archive old logs to Supabase monthly, compress in-app logs
- **File**: `/src/lib/auditLog.ts` - Add archival function
- **Code**:

  ```typescript
  export const archiveOldAuditLogs = async (retentionDays: number = 90) => {
    const cutoffDate = new Date(
      Date.now() - retentionDays * 24 * 60 * 60 * 1000,
    );
    const logs = getAuditLogs();

    const logsToArchive = logs.filter(
      (log) => new Date(log.timestamp) < cutoffDate,
    );

    if (logsToArchive.length > 0) {
      try {
        // Archive to Supabase (owner only can view)
        await supabase.from("audit_logs_archive").insert(logsToArchive);

        // Remove from localStorage
        const remainingLogs = logs.filter(
          (log) => new Date(log.timestamp) >= cutoffDate,
        );
        localStorage.setItem("auditLogs", JSON.stringify(remainingLogs));
      } catch (error) {
        console.error("Failed to archive audit logs:", error);
      }
    }
  };
  ```

**12. Add CSP (Content Security Policy) Headers**

- **Issue**: No CSP headers protecting against XSS/script injection
- **Action**: Configure CSP in `next.config.ts` or middleware
- **File**: `middleware.ts`
- **Code**:

  ```typescript
  export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.supabase.co; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' *.supabase.co; " +
        "frame-ancestors 'none';",
    );

    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return response;
  }
  ```

### LOW PRIORITY (Nice-to-Have)

**13. Implement Request Signing for Sensitive Operations**

- Use HMAC signatures for refund/payment verification endpoints
- Implement webhook signature verification if using external payment providers

**14. Add IP Whitelisting for Admin Panel (Optional)**

- Restrict admin dashboard to known office IPs in production
- Use Supabase's database policies or middleware

**15. Monitor for Suspicious Activity Patterns**

- Expand `/src/lib/auditLog.ts` `detectSuspiciousActivities()` function
- Add alerts for: rapid inventory changes, bulk refunds, multiple failed logins, unusual payment methods

## 🗄️ Database Concurrency & Race Condition Prevention

Critical patterns for preventing data corruption when multiple users interact with inventory, orders, and payments simultaneously.

### Transaction Isolation & Locking Strategies

**Supabase/PostgreSQL Transaction Levels:**

```sql
-- Use SERIALIZABLE for critical inventory operations
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- Your inventory updates here
COMMIT;

-- Use READ COMMITTED for most operations (default)
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
-- Your regular database operations
COMMIT;
```

**Row-Level Locking for Inventory:**

```sql
-- Lock specific product stock row for update
SELECT quantity, reserved FROM warehouse_stock
WHERE product_id = $1 AND warehouse = $2
FOR UPDATE NOWAIT;

-- If NOWAIT fails, handle gracefully:
-- "Stock is being updated by another user, please try again"
```

**Optimistic vs Pessimistic Concurrency Control:**

**Optimistic (Recommended for low-conflict scenarios):**

```typescript
// Check stock availability without locking
const currentStock = await supabase
  .from("warehouse_stock")
  .select("quantity, reserved, updated_at")
  .eq("product_id", productId)
  .single();

// Attempt update with version check
const { error } = await supabase
  .from("warehouse_stock")
  .update({
    reserved: currentStock.reserved + orderQuantity,
    updated_at: new Date().toISOString(),
  })
  .eq("product_id", productId)
  .eq("updated_at", currentStock.updated_at); // Version check

if (error?.code === "PGRST116") {
  throw new Error(
    "Stock was modified by another user. Please refresh and try again.",
  );
}
```

**Pessimistic (Use for high-conflict scenarios):**

```typescript
// Lock stock row immediately
const { data: lockedStock } = await supabase.rpc("lock_product_stock", {
  p_product_id: productId,
  p_warehouse: warehouse,
});

// Perform operations on locked data
await supabase
  .from("warehouse_stock")
  .update({ reserved: lockedStock.reserved + quantity })
  .eq("product_id", productId);
```

### Inventory Reservation Patterns

**Two-Phase Stock Management:**

1. **Reservation Phase** - Lock stock when order is placed
2. **Deduction Phase** - Convert reservation to actual sale when order completes

```sql
-- Phase 1: Reserve stock (when order placed)
UPDATE warehouse_stock
SET reserved = reserved + $3
WHERE product_id = $1 AND warehouse = $2
  AND (quantity - reserved) >= $3;

-- Phase 2: Deduct stock (when order completed)
UPDATE warehouse_stock
SET quantity = quantity - $3, reserved = reserved - $3
WHERE product_id = $1 AND warehouse = $2;

-- Rollback: Release reservation (when order cancelled)
UPDATE warehouse_stock
SET reserved = reserved - $3
WHERE product_id = $1 AND warehouse = $2;
```

**Database Constraints for Data Integrity:**

```sql
-- Prevent negative stock
ALTER TABLE warehouse_stock
ADD CONSTRAINT check_quantity_non_negative
CHECK (quantity >= 0);

-- Prevent over-reservation
ALTER TABLE warehouse_stock
ADD CONSTRAINT check_reservation_valid
CHECK (reserved <= quantity AND reserved >= 0);

-- Prevent negative available stock
ALTER TABLE warehouse_stock
ADD CONSTRAINT check_available_stock
CHECK ((quantity - reserved) >= 0);
```

### PostgreSQL Functions for Atomic Operations

**Stock Reservation Function (Atomic):**

```sql
CREATE OR REPLACE FUNCTION reserve_product_stock(
  p_product_id bigint,
  p_warehouse warehouse_enum,
  p_quantity integer
) RETURNS json AS $$
DECLARE
  available_stock integer;
  result json;
BEGIN
  -- Lock the row and get available stock
  SELECT (quantity - reserved) INTO available_stock
  FROM warehouse_stock
  WHERE product_id = p_product_id AND warehouse = p_warehouse
  FOR UPDATE;

  -- Check if sufficient stock available
  IF available_stock < p_quantity THEN
    result := json_build_object(
      'success', false,
      'error', 'Insufficient stock',
      'available', available_stock,
      'requested', p_quantity
    );
    RETURN result;
  END IF;

  -- Reserve the stock
  UPDATE warehouse_stock
  SET reserved = reserved + p_quantity
  WHERE product_id = p_product_id AND warehouse = p_warehouse;

  result := json_build_object(
    'success', true,
    'reserved', p_quantity,
    'remaining_available', available_stock - p_quantity
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

**Order Processing with Conflict Resolution:**

```typescript
// Atomic order creation with inventory reservation
export async function createOrderWithInventoryCheck(
  orderData: CreateOrderData,
) {
  const { data, error } = await supabase.rpc("create_order_atomic", {
    user_id: orderData.userId,
    items: orderData.items,
    payment_method: orderData.paymentMethod,
  });

  if (error?.code === "P0001") {
    // Custom PostgreSQL error
    if (error.message.includes("insufficient_stock")) {
      throw new InsufficientStockError(error.details);
    }
    if (error.message.includes("concurrent_modification")) {
      throw new ConcurrencyError(
        "Another user modified this data. Please refresh and try again.",
      );
    }
  }

  return data;
}
```

### Row-Level Security (RLS) for Concurrent Access

**Time-based RLS Policies:**

```sql
-- Only allow order modifications within 5 minutes of creation
CREATE POLICY order_modification_window ON orders
FOR UPDATE USING (
  auth.uid() = user_id AND
  (created_at + INTERVAL '5 minutes') > NOW()
);

-- Prevent concurrent modifications by different users
CREATE POLICY prevent_concurrent_order_updates ON orders
FOR UPDATE USING (
  auth.uid() = user_id AND
  NOT EXISTS (
    SELECT 1 FROM order_locks
    WHERE order_id = orders.id AND user_id != auth.uid()
  )
);
```

**Staff Override Policies:**

```sql
-- Allow staff to override customer restrictions
CREATE POLICY staff_order_management ON orders
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'owner')
  )
);
```

### Concurrent Testing Scenarios

**Test Case 1: Simultaneous Stock Reservation**

```typescript
// Test: 2 users trying to buy last item simultaneously
describe("Concurrent Stock Reservation", () => {
  it("should handle race condition when 2 users order last item", async () => {
    // Setup: Product with quantity = 1, reserved = 0
    await setupProduct({ id: 1, quantity: 1, reserved: 0 });

    // Act: Both users try to reserve simultaneously
    const promise1 = reserveStock(1, "Lorenzo", 1);
    const promise2 = reserveStock(1, "Lorenzo", 1);

    const results = await Promise.allSettled([promise1, promise2]);

    // Assert: Only one should succeed
    const successes = results.filter((r) => r.status === "fulfilled").length;
    const failures = results.filter((r) => r.status === "rejected").length;

    expect(successes).toBe(1);
    expect(failures).toBe(1);
    expect(failures[0].reason.message).toContain("Insufficient stock");
  });
});
```

**Test Case 2: Order Processing Under Load**

```typescript
// Test: Multiple users placing orders for same products
describe("High Concurrency Order Processing", () => {
  it("should process 10 concurrent orders without stock overselling", async () => {
    // Setup: Product with quantity = 5
    await setupProduct({ id: 1, quantity: 5, reserved: 0 });

    // Act: 10 users each try to order 1 item
    const orderPromises = Array.from({ length: 10 }, (_, i) =>
      createOrder({
        userId: `user-${i}`,
        items: [{ productId: 1, quantity: 1 }],
      }),
    );

    const results = await Promise.allSettled(orderPromises);

    // Assert: Exactly 5 should succeed, 5 should fail
    const successes = results.filter((r) => r.status === "fulfilled").length;
    const failures = results.filter((r) => r.status === "rejected").length;

    expect(successes).toBe(5);
    expect(failures).toBe(5);

    // Verify final stock state
    const finalStock = await getProductStock(1);
    expect(finalStock.reserved).toBe(5);
    expect(finalStock.quantity).toBe(5);
  });
});
```

**Test Case 3: Reservation Timeout Cleanup**

```typescript
// Test: Expired reservations are cleaned up
describe("Reservation Cleanup", () => {
  it("should release expired reservations after timeout", async () => {
    // Setup: Create reservation with 15-minute timeout
    await reserveStock(1, "Lorenzo", 2);

    // Act: Simulate time passage (mock system clock)
    await mockTimeAdvance("16 minutes");
    await runReservationCleanup();

    // Assert: Reservation should be released
    const stock = await getProductStock(1);
    expect(stock.reserved).toBe(0);
  });
});
```

### Monitoring & Alerting for Race Conditions

**Database Metrics to Track:**

- Lock wait times > 100ms
- Transaction retry counts
- Deadlock frequency
- Stock discrepancy occurrences
- Concurrent modification errors

**Audit Log Entries for Concurrency Issues:**

```typescript
// Log when stock conflicts occur
await addAuditLog({
  actionType: "stock_conflict_detected",
  performedBy: systemUser,
  targetEntity: { type: "product", id: productId, name: productName },
  metadata: {
    conflictType: "insufficient_stock",
    requestedQuantity: quantity,
    availableQuantity: available,
    concurrentUsers: conflictingUserIds,
  },
});
```

**PostgreSQL Triggers for Monitoring:**

```sql
-- Trigger to log suspicious stock changes
CREATE OR REPLACE FUNCTION log_stock_anomalies()
RETURNS trigger AS $$
BEGIN
  -- Log if stock drops below zero (should be prevented by constraints)
  IF NEW.quantity < 0 OR NEW.reserved < 0 THEN
    INSERT INTO stock_anomalies (product_id, old_qty, new_qty, detected_at)
    VALUES (NEW.product_id, OLD.quantity, NEW.quantity, NOW());
  END IF;

  -- Log large stock changes (potential bulk operations)
  IF ABS(NEW.quantity - OLD.quantity) > 100 THEN
    INSERT INTO bulk_stock_changes (product_id, change_amount, changed_by, changed_at)
    VALUES (NEW.product_id, NEW.quantity - OLD.quantity, current_user, NOW());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stock_anomaly_detector
  AFTER UPDATE ON warehouse_stock
  FOR EACH ROW
  EXECUTE FUNCTION log_stock_anomalies();
```

## �🔗 Integration Points

- **Supabase Auth** - Manages sessions via JWTs (auto-refreshed)
- **PostgreSQL Functions** - FIFO batch selection logic for inventory (in `04_create_functions.sql`)
- **PDF Export** - Uses `jspdf` + `jspdf-autotable` for invoice generation (`/src/components/InvoiceReceipt.tsx`)
- **QR Codes** - `qrcode.react` for order lookup (staff can scan to view customer history)

## ⚠️ Common Vulnerabilities to Prevent

**Authentication & Authorization:**

- Never trust client-side role checks; always verify `user.role` from `AuthContext` matches JWT claims
- After role/permission changes, force re-login or refresh JWT to prevent stale permissions
- Validate `email_verified_at` for sensitive operations (refunds, account modifications)

**Data Exposure:**

- RLS policies must be tested; run `SELECT * FROM orders` as customer role—should only see own orders
- Never expose internal IDs, warehouse locations, or cost data to customers
- Filter API responses: customers shouldn't see `created_by` for other users' orders

**Injection & XSS:**

- Product descriptions, customer addresses, coupon codes may contain user input—escape before rendering
- Order notes/special requests from customers must be sanitized
- If implementing search, use parameterized queries—never concatenate strings into SQL

**Inventory & Payment Fraud:**

- Check inventory AGAIN during order finalization (not just at cart stage) to prevent overselling
- For GCash/bank transfers, require staff verification before marking order complete
- Implement duplicate order detection: same items + same customer + within 5 minutes = suspicious
- Log all refund approvals with proof URLs and approver details for audit trail

**Session & Token Hijacking:**

- Supabase JWTs are short-lived (1 hour); refresh tokens are longer—validate both
- In production, only set session cookies over HTTPS
- Invalidate sessions on password change or admin deactivation (force re-login)

**Performance & DoS:**

- Pagination on all list endpoints (orders, products, audit logs) to prevent memory exhaustion
- Add request rate limiting to sensitive endpoints (auth, payment verification, coupon validation)
- Monitor for unusual patterns: single user creating 1000 orders, accessing all customers' data

## ✅ Pre-Production Checklist

Before deploying to production:

- [ ] All 8 migrations applied to production Supabase
- [ ] RLS policies tested: each role can access only permitted data
- [ ] Audit logging working: all sensitive actions logged with user, timestamp, changes
- [ ] Inventory system tested: reserve, deduct, restore, transfer flows
- [ ] Payment verification tested: staff can upload and verify proofs
- [ ] Coupon system tested: validation, application, refund restoration
- [ ] Error handling tested: network failures, invalid inputs, concurrent operations
- [ ] Security review: no hardcoded secrets, no console.log of sensitive data
- [ ] Performance tested: page load times < 2s, queries < 500ms
- [ ] Backup tested: can restore from Supabase backup without data loss
- [ ] Monitoring in place: error tracking (Sentry), performance monitoring (Vercel Analytics)
- [ ] DNS, SSL certificate, CDN configured correctly
- [ ] `.env` variables set in Vercel (or deployment platform) secrets
- [ ] Rate limiting enabled on sensitive endpoints
- [ ] CORS policy restricted to known domains only

## 📚 Reference Files for Patterns

- **Auth & Permissions:** `AuthContext.tsx`, `permissions.ts`
- **Order Logic:** `CheckoutPage.tsx`, `OrderManagement.tsx`
- **Inventory:** `inventory.ts`, `InventoryTracking.tsx`
- **Audit Trail:** `auditLog.ts`, `AuditTrailViewer.tsx`
- **Products:** `products.ts`, `ProductCard.tsx`, `ProductsPage.tsx`
- **Database Schema:** `database_design.md`, migration scripts in `/supabase/migrations/`
