# Supabase Migration Checklist

Use this checklist to track your migration progress.

## ✅ Pre-Setup

- [ ] Supabase account created
- [ ] New project created in Supabase
- [ ] Project URL and anon key copied
- [ ] `.env.local` file created with credentials
- [ ] Dependencies installed (`npm install`)

## ✅ Database Migration

Run these SQL scripts in Supabase SQL Editor **in order**:

- [ ] `01_create_types.sql` - Custom enums
- [ ] `02_create_tables.sql` - All tables
- [ ] `03_create_indexes.sql` - Performance indexes
- [ ] `04_create_functions.sql` - Helper functions
- [ ] `05_enable_rls.sql` - Enable RLS
- [ ] `06_create_rls_policies.sql` - Security policies
- [ ] `07_seed_users.sql` - Test user data
- [ ] `08_seed_data.sql` - Sample products

## ✅ Authentication Setup

- [ ] Email provider enabled (Authentication → Providers)
- [ ] Site URL configured (`http://localhost:3000`)
- [ ] Redirect URLs added
- [ ] Email confirmation disabled (for testing)

## ✅ Create Test Users

In Authentication → Users, create:

- [ ] `customer@poybash.com` (password: `customer123`)
- [ ] `sales@poybash.com` (password: `sales123`)
- [ ] `clerk@poybash.com` (password: `clerk123`)
- [ ] `admin@poybash.com` (password: `admin123`)
- [ ] `owner@poybash.com` (password: `owner123`)

After creating each user:

- [ ] Set Auto Confirm = YES
- [ ] Update role in `users` table via SQL

## ✅ Verification

- [ ] Dev server starts (`npm run dev`)
- [ ] Can login with test accounts
- [ ] Products visible on homepage
- [ ] Can view admin dashboard (staff+)
- [ ] RLS policies working (users see appropriate data)

## ✅ Testing by Role

### Customer
- [ ] Can browse products
- [ ] Can add to cart
- [ ] Can place order
- [ ] Can view own orders only
- [ ] Cannot access admin dashboard

### Sales Staff
- [ ] Can view all orders
- [ ] Can create manual orders
- [ ] Can verify payments
- [ ] Can process refunds
- [ ] Cannot edit products

### Inventory Clerk
- [ ] Can manage warehouse stock
- [ ] Can view inventory levels
- [ ] Can update order status
- [ ] Cannot edit products

### Admin
- [ ] Can add/edit products
- [ ] Can manage categories
- [ ] Can create coupons
- [ ] Can create staff accounts
- [ ] Cannot view audit logs

### Owner
- [ ] Has all admin permissions
- [ ] Can view audit logs
- [ ] Can create admin accounts
- [ ] Can export reports

## ✅ Production Preparation

- [ ] Re-enable email confirmation
- [ ] Update `.env.production` with production Supabase URL
- [ ] Set up custom domain (optional)
- [ ] Enable database backups
- [ ] Review and tighten RLS policies
- [ ] Set up monitoring
- [ ] Enable 2FA for admin accounts
- [ ] Remove or secure test accounts

## 📝 Notes

Use this space to track any issues or customizations:

```
[Add your notes here]
```
