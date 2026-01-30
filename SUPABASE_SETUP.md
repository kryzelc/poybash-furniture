# 🚀 Supabase Backend Setup Guide

This guide will walk you through setting up your Supabase backend from scratch and connecting it to your PoyBash Furniture frontend.

---

## 📋 Prerequisites

Before you begin, make sure you have:

- ✅ A Supabase account (free tier works fine)
- ✅ Node.js 18.17+ installed
- ✅ This project cloned locally
- ✅ Basic understanding of SQL and PostgreSQL

---

## Step 1: Create a Supabase Project

### 1.1 Sign Up / Log In to Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign In"**
3. Sign up with GitHub, Google, or email

### 1.2 Create a New Project

1. Click **"New Project"** from your dashboard
2. Fill in the project details:
   - **Name**: `poybash-furniture` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select the closest region to your users
   - **Pricing Plan**: Free tier is sufficient for development
3. Click **"Create new project"**
4. Wait 2-3 minutes for the project to be provisioned

### 1.3 Get Your API Credentials

1. Once your project is ready, go to **Settings** → **API**
2. You'll need two values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: A long JWT token starting with `eyJ...`
3. Keep this tab open - you'll need these values soon

---

## Step 2: Configure Environment Variables

### 2.1 Create Your Local Environment File

In your project root directory:

```bash
# Copy the example file
cp .env.example .env.local
```

### 2.2 Add Your Supabase Credentials

Open `.env.local` and replace the placeholder values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> [!IMPORTANT]
> Never commit `.env.local` to version control. It's already in `.gitignore`.

---

## Step 3: Set Up the Database Schema

Now we'll create all the tables, types, and constraints defined in your `database_design.md`.

### 3.1 Access the SQL Editor

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **"New query"**

### 3.2 Run the Migration Scripts

You'll run 4 SQL scripts in order. Each script is in the `supabase/migrations/` folder:

#### Script 1: Create Custom Types (Enums)

1. Open `supabase/migrations/01_create_types.sql`
2. Copy the entire contents
3. Paste into the SQL Editor
4. Click **"Run"** (or press Ctrl/Cmd + Enter)
5. Verify: You should see "Success. No rows returned"

#### Script 2: Create Tables and Schema

1. Open `supabase/migrations/02_create_tables.sql`
2. Copy and paste into a new SQL Editor query
3. Click **"Run"**
4. Verify: Check **Database** → **Tables** in the sidebar - you should see all your tables

#### Script 3: Create Indexes and Constraints

1. Open `supabase/migrations/03_create_indexes.sql`
2. Copy and paste into a new SQL Editor query
3. Click **"Run"**
4. Verify: No errors should appear

#### Script 4: Create Helper Functions

1. Open `supabase/migrations/04_create_functions.sql`
2. Copy and paste into a new SQL Editor query
3. Click **"Run"**
4. Verify: Check **Database** → **Functions** - you should see your custom functions

---

## Step 4: Set Up Row-Level Security (RLS)

RLS is **critical** for security - it ensures users can only access data they're authorized to see.

### 4.1 Enable RLS on All Tables

1. Open `supabase/migrations/05_enable_rls.sql`
2. Copy and paste into SQL Editor
3. Click **"Run"**

### 4.2 Create RLS Policies

1. Open `supabase/migrations/06_create_rls_policies.sql`
2. Copy and paste into SQL Editor
3. Click **"Run"**
4. This creates all the role-based access policies

> [!WARNING]
> **DO NOT skip RLS setup!** Without RLS policies, your data will be completely exposed or completely locked down.

---

## Step 5: Seed Test Data

Now let's add the test accounts and sample data.

### 5.1 Create Test User Accounts

1. Open `supabase/migrations/07_seed_users.sql`
2. Copy and paste into SQL Editor
3. Click **"Run"**

This creates the 5 test accounts:
- `customer@poybash.com` (password: `customer123`)
- `sales@poybash.com` (password: `sales123`)
- `clerk@poybash.com` (password: `clerk123`)
- `admin@poybash.com` (password: `admin123`)
- `owner@poybash.com` (password: `owner123`)

### 5.2 Seed Sample Products and Inventory

1. Open `supabase/migrations/08_seed_data.sql`
2. Copy and paste into SQL Editor
3. Click **"Run"**

This adds:
- Product categories and materials
- Sample furniture products
- Warehouse locations (Lorenzo, Oroquieta)
- Initial inventory stock

---

## Step 6: Configure Supabase Authentication

### 6.1 Enable Email Authentication

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Make sure **Email** is enabled (it should be by default)
3. Scroll down to **Email Templates**
4. Customize the confirmation email if desired

### 6.2 Configure Site URL

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `http://localhost:3000` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:3000/**`
   - Your production URL when you deploy

### 6.3 Disable Email Confirmations (Optional for Testing)

For easier testing, you can disable email confirmation:

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle **"Confirm email"** to OFF
3. Click **"Save"**

> [!CAUTION]
> Re-enable email confirmation before going to production!

---

## Step 7: Test the Connection

### 7.1 Start Your Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 7.2 Test User Login

1. Click the user icon in the top navigation
2. Click **"Login"**
3. Try logging in with: `admin@poybash.com` / `admin123`
4. If successful, you should be redirected and see your user info

### 7.3 Verify Database Connection

Check your Supabase dashboard:

1. Go to **Authentication** → **Users**
2. You should see the logged-in user session
3. Go to **Database** → **Table Editor**
4. Select the `users` table
5. You should see your test users

---

## Step 8: Verify RLS Policies

### 8.1 Test Role-Based Access

1. Log in as different users and verify they see appropriate data:
   - **Customer**: Can only see their own orders
   - **Sales Staff**: Can see all orders but can't edit products
   - **Admin**: Can manage products and orders
   - **Owner**: Has access to audit logs

### 8.2 Check RLS in SQL Editor

Run this query to verify RLS is working:

```sql
-- This should only return data the current user can access
SELECT * FROM orders;
```

---

## 🎉 You're Done!

Your Supabase backend is now fully set up and connected to your frontend!

---

## 📚 Next Steps

### For Development

- [ ] Create more test data (products, orders, etc.)
- [ ] Test all user flows (checkout, refunds, inventory management)
- [ ] Customize email templates in Supabase Auth
- [ ] Set up Storage buckets for product images

### For Production Deployment

- [ ] Update `.env.local` → `.env.production` with production Supabase URL
- [ ] Enable email confirmation in Supabase Auth
- [ ] Set up custom domain for Supabase (optional)
- [ ] Enable database backups (Settings → Database → Backups)
- [ ] Set up monitoring and alerts
- [ ] Review and tighten RLS policies
- [ ] Enable 2FA for admin accounts

---

## 🆘 Troubleshooting

### "Invalid API key" Error

- Double-check your `.env.local` file
- Make sure you're using the **anon public** key, not the service role key
- Restart your dev server after changing environment variables

### "Row Level Security" Errors

- Make sure you ran all RLS migration scripts
- Check that RLS is enabled on all tables
- Verify your user has the correct role in the `users` table

### Authentication Not Working

- Check that email provider is enabled in Supabase
- Verify your Site URL and Redirect URLs are correct
- Check browser console for detailed error messages

### Database Connection Issues

- Verify your Supabase project is active (not paused)
- Check that your Project URL is correct
- Ensure you have internet connection

---

## 📖 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- Your `database_design.md` - Complete ERD and RLS policy reference

---

## 🔐 Security Checklist

Before going to production, ensure:

- [ ] All tables have RLS enabled
- [ ] RLS policies are tested for each user role
- [ ] Email confirmation is enabled
- [ ] Strong passwords are enforced
- [ ] Service role key is never exposed to the client
- [ ] `.env.local` is in `.gitignore`
- [ ] Database backups are configured
- [ ] Audit logging is working correctly
