# PoyBash Furniture E-Commerce Platform

A full-featured furniture e-commerce platform built with Next.js, React, and Supabase. This project demonstrates a complete e-commerce system with role-based access control, order management, inventory tracking, and comprehensive admin tools.

---

## 🎯 Project Overview

PoyBash Furniture is designed to handle the complete furniture sales lifecycle—from browsing and checkout to inventory management and customer service. The system supports multiple user roles with different permission levels, enabling efficient operations across sales, warehouse management, and administrative functions.

**Key Features:**

- 🛒 Customer portal with shopping cart and checkout
- 📊 Admin dashboard with sales analytics and inventory tracking
- 👥 Multi-role system with granular permissions
- 📦 Multi-warehouse inventory management
- 🔍 Comprehensive audit logging for all system actions
- 🎟️ Discount coupon system
- 📱 QR code-based order lookup

---

## 🧑‍💼 User Roles & Permissions

The system includes 5 distinct user roles, each with specific capabilities designed for their function:

### 🛒 **Customer** - Shop & Place Orders

**How to access:** Sign up at the registration page or test with the demo account

**What they can do:**

- Browse and search products
- Add items to cart and apply discount codes
- Place orders with multiple payment options (Cash, GCash, Bank Transfer)
- Track order status in real-time
- Request refunds within 7 days of receiving an order
- Update personal information and saved addresses

**What they can't do:**

- Access the admin dashboard
- View other customers' orders

---

### 🛍️ **Sales Staff** - Customer Service & Sales

**Test Credentials:**

- Email: `sales@poybash.com`
- Password: `sales123`

**What they can do:**

- View all products (read-only)
- See all customer orders and search by QR code
- Create manual orders for in-store or social media sales
- Mark orders as reservations for partial payments
- Update order status as it progresses through the workflow
- Verify customer payment proofs (GCash screenshots, bank slips)
- Process refunds and upload proof of refund transactions
- Create new customer accounts for walk-in customers
- View customer history and order details

**Special responsibility:** Can process refunds because they're customer-facing staff who need to handle service quickly. All actions are logged in an immutable audit trail for accountability.

**What they can't do:**

- Add or edit products
- Create staff or admin accounts
- Manage inventory stock levels
- Access audit logs or sales reports
- Manage coupons

---

### 📦 **Inventory Clerk** - Warehouse Operations

**Test Credentials:**

- Email: `clerk@poybash.com`
- Password: `clerk123`

**What they can do:**

- View all product information
- See all orders and search by QR code
- Create manual orders (in-store transactions)
- Update order status
- Verify customer payments and process refunds
- Create customer accounts
- **Manage warehouse inventory:** View stock levels per warehouse, add/reduce stock, transfer between warehouses
- Monitor low stock alerts

**Special responsibility:** Hybrid role combining warehouse duties with customer service. They handle order fulfillment and interact with customers during pickup/delivery, so they need to process refunds and manage accounts just like Sales Staff.

**What they can't do:**

- Add or edit product details
- Create staff or admin accounts
- Access audit logs
- Manage coupons

---

### 🔑 **Admin** - Operations Manager

**Test Credentials:**

- Email: `admin@poybash.com`
- Password: `admin123`

**What they can do:**

- Add, edit, and delete product listings
- Manage product categories
- View and manage all orders with full control
- Move orders backward in status (fix mistakes, reopen cancelled orders)
- Create and manage customer accounts
- Create Sales Staff and Inventory Clerk accounts
- View and update inventory across both warehouses
- Create, edit, and manage discount coupons
- Access the full admin dashboard with metrics and analytics

**Strategic limitations:** Admins don't have access to audit logs or the ability to export sales reports. This is intentional—it keeps the Owner in a position of independent oversight and prevents any single person from hiding their actions.

---

### 👑 **Owner** - Ultimate Authority

**Test Credentials:**

- Email: `owner@poybash.com`
- Password: `owner123`

**What they can do:**

- **Everything** an Admin can do, plus:
- Export sales reports filtered by date range for financial analysis
- Access audit logs to see every system action (who did what, when, and why)
- Create new Admin and Owner accounts
- Modify user roles and permissions
- Clear old audit logs for record maintenance
- Override any decision in the system

**Why this separation?** The Owner has complete visibility into everything, including all Admin actions. This ensures accountability at the highest level and follows industry best practices for financial and operational compliance.

---

## 📊 Quick Permission Reference

| Feature                  | Customer     | Sales        | Clerk        | Admin         | Owner         |
| ------------------------ | ------------ | ------------ | ------------ | ------------- | ------------- |
| Browse & Search Products | ✅           | ✅           | ✅           | ✅            | ✅            |
| Place Customer Orders    | ✅           | ❌           | ❌           | ❌            | ❌            |
| Create Manual Orders     | ❌           | ✅           | ✅           | ✅            | ✅            |
| Update Order Status      | Cancel only  | Forward only | Forward only | Any direction | Any direction |
| Process Refunds          | Request only | ✅           | ✅           | ✅            | ✅            |
| Add/Edit Products        | ❌           | ❌           | ❌           | ✅            | ✅            |
| Manage Inventory         | ❌           | ❌           | ✅           | ✅            | ✅            |
| Create Customers         | Self only    | ✅           | ✅           | ✅            | ✅            |
| Create Staff Accounts    | ❌           | ❌           | ❌           | ✅            | ✅            |
| Create Admin Accounts    | ❌           | ❌           | ❌           | ❌            | ✅            |
| Manage Coupons           | View only    | View only    | View only    | ✅            | ✅            |
| Export Reports           | ❌           | ❌           | ❌           | ❌            | ✅            |
| Access Audit Logs        | ❌           | ❌           | ❌           | ❌            | ✅            |

---

## 🧪 Testing the System

### Access the Admin Dashboard:

1. Click the user icon in the top navigation
2. Select "Login"
3. Enter credentials for any staff/admin role (see credentials above)
4. Click the user icon again and select "Admin Dashboard"

### Test Payment Methods:

- **Cash on Pickup** — No proof required
- **GCash** — Upload a screenshot (any image works for testing)
- **Bank Transfer** — Upload a bank slip (any image works for testing)

### Test Fulfillment Options:

- **Store Pickup** — Free pickup at physical location
- **Customer-Arranged Delivery** — Customer arranges logistics (Lalamove, Grab, etc.)

### Warehouse Locations:

The system manages inventory across two locations:

- **Lorenzo Warehouse** — Primary distribution center
- **Oroquieta Warehouse** — Secondary distribution center

Stock is tracked separately at each warehouse with real-time availability.

---

## 🔒 Security & Design Philosophy

### Why Certain Permissions Are Restricted?

**Why can't employees see the audit logs?**

- The audit trail records every action in the system, including Admin actions
- If Admins could see their own audit trail, they could potentially hide things
- The Owner needs an independent record that Admins can't access

**Why can't Admin create other Admins?**

- Prevents privilege escalation
- Owner maintains final control over who gets admin access
- Clear chain of command with accountability

**Why do Sales Staff and Clerks process refunds?**

- They're the closest to customers and can resolve issues immediately
- Fast service = happy customers
- All refunds are logged with full audit trail (staff name, timestamp, proof photos)
- Audit logs are immutable—they can't be edited or deleted
- Admin and Owner can review all refunds anytime

### Audit Trail Features:

- ✅ Captures every significant action (who, what, when, why)
- ✅ Immutable records (cannot be edited after creation)
- ✅ Owner-only access ensures independence
- ✅ Enables complete accountability across the organization

### Data Protection:

- ✅ Soft delete (nothing is permanently deleted, only marked inactive)
- ✅ Maintains database integrity and enables data recovery
- ✅ Role-based access enforced at API level (not just the UI)
- ✅ Session management prevents account impersonation
- ✅ Email verification required for new customer accounts

---

## 🚀 Getting Started

### Prerequisites:

- Node.js 18.17 or later
- npm or yarn
- Supabase CLI (optional, for local development)

### Installation:

```bash
# Clone the repository
git clone https://github.com/your-username/poybash-furniture.git
cd poybash-furniture

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials to .env.local

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Build for Production:

```bash
npm run build
npm start
```

---

## 🔌 Backend Integration

### Architecture

The application uses **Supabase** as the backend-as-a-service platform, providing:

- **PostgreSQL Database** - Stores all application data (users, products, orders, inventory)
- **Authentication** - Handles user signup, login, and session management
- **Edge Functions** - Server-side functions for secure operations
- **Storage** - File storage for images and payment proofs
- **Real-time Subscriptions** - Live updates for order status changes

### Edge Functions

The application uses Supabase Edge Functions for secure server-side processing:

#### 1. **place-order**

**Purpose:** Securely process order placement with inventory validation

**Called from:** `AuthContext.placeOrder()`

**What it does:**

- Validates user authentication
- Reserves inventory from warehouses using FIFO allocation
- Applies coupon codes with server-side validation
- Creates order and order items in database
- Calculates totals including delivery fees
- Returns order ID and details

**Endpoint:** `supabase.functions.invoke('place-order')`

#### 2. **validate-coupon**

**Purpose:** Server-side coupon validation with rate limiting

**Called from:** `CheckoutPage.handleApplyCoupon()`

**What it does:**

- Validates coupon code exists and is active
- Checks expiry dates and usage limits
- Verifies minimum purchase requirements
- Calculates discount amount
- Prevents coupon abuse with rate limiting

**Endpoint:** `supabase.functions.invoke('validate-coupon')`

#### 3. **verify-payment**

**Purpose:** Verify payment proof and update order status

**What it does:**

- Validates payment screenshots/references
- Updates order payment status
- Triggers order confirmation workflows

### Database Functions

The application uses PostgreSQL functions for complex operations:

- `create_order_transaction()` - Atomic order creation with inventory reservation
- `apply_coupon()` - Server-side coupon validation and application
- `reserve_stock()` - FIFO warehouse stock reservation
- `generate_order_number()` - Unique order number generation

### Local Development with Supabase

To run Supabase locally (optional):

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase instance
supabase start

# Run database migrations
supabase db push

# Deploy edge functions locally
supabase functions serve
```

The `supabase/config.toml` file is already configured for local development.

### Environment Variables

Required variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 📚 Tech Stack

| Layer                  | Technology                                     |
| ---------------------- | ---------------------------------------------- |
| **Frontend Framework** | Next.js 15 + React 18                          |
| **Language**           | TypeScript                                     |
| **Styling**            | TailwindCSS + Shadcn/UI                        |
| **State Management**   | React Context API + localStorage               |
| **Backend**            | Supabase (PostgreSQL + Auth + Edge Functions)  |
| **Database**           | PostgreSQL 15 with Row-Level Security          |
| **Edge Runtime**       | Deno-based Supabase Edge Functions             |
| **Charts & Analytics** | Recharts                                       |
| **Additional Tools**   | QR Code scanning, PDF generation, Date pickers |

---

## 🔐 Environment Setup

This project uses environment variables to manage sensitive configuration. A template file (`.env.example`) is included showing what variables are needed.

**Important:** Never commit actual `.env.local` files. Each developer should create their own local copy with their own credentials.

---

## 📝 Project Status

This project is currently in development with a fully integrated backend. The Supabase backend handles:

- ✅ User authentication and session management
- ✅ Database operations via PostgreSQL
- ✅ Edge Functions for secure server-side processing
- ✅ Order placement with inventory reservation
- ✅ Coupon validation with rate limiting
- ✅ Real-time order status updates
- ✅ File storage for payment proofs and product images

**Recent Improvements:**

- Migrated order placement to use Edge Functions for better security
- Added server-side coupon validation via Edge Functions
- Configured local development environment with `supabase/config.toml`
- Implemented comprehensive error handling and audit logging

---

## 💡 Key Design Decisions

The system is built around these core principles:

1. **Clear Role Separation** — Each role has specific responsibilities with minimal overlap
2. **Accountability Through Audit Trails** — Every significant action is logged and reviewable
3. **Customer-Facing Empowerment** — Sales and Warehouse staff can handle most customer issues without waiting for admin approval
4. **Owner Oversight** — The Owner maintains independent visibility into all system activities
5. **Soft Deletes** — No permanent data deletion ensures data integrity and recovery options
6. **Multi-Warehouse Support** — Inventory is tracked separately across locations for accurate stock management

---

## ⚠️ Demo Accounts Note

All demo credentials shown above are for **testing purposes only**. They work on the frontend with local storage. For production deployment, you'll need to:

1. Set up a real Supabase instance
2. Create actual user accounts with secure passwords
3. Enable two-factor authentication for staff accounts
4. Use proper password management practices

---
