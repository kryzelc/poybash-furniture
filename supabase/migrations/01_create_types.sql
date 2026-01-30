-- ============================================
-- Script 1: Create Custom Types (Enums)
-- ============================================
-- Run this first to create all custom enum types
-- These types are used across multiple tables

-- User roles
CREATE TYPE user_role AS ENUM ('customer', 'staff', 'inventory-clerk', 'admin', 'owner');

-- Order statuses
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled', 'refunded');

-- Payment methods
CREATE TYPE payment_method AS ENUM ('cash', 'gcash', 'bank');

-- Payment status
CREATE TYPE payment_status AS ENUM ('pending', 'verified', 'rejected');

-- Fulfillment types
CREATE TYPE fulfillment_type AS ENUM ('pickup', 'delivery');

-- Discount types
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

-- Refund status
CREATE TYPE refund_status AS ENUM ('pending', 'approved', 'rejected');

-- Refund methods
CREATE TYPE refund_method AS ENUM ('gcash', 'bank', 'cash');

-- Notification types
CREATE TYPE notification_type AS ENUM ('account_modified', 'role_changed', 'account_status', 'order_update', 'refund_update');
