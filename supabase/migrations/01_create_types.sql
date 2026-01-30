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
CREATE TYPE refund_status AS ENUM ('requested', 'under_review', 'approved', 'rejected', 'processed');

-- Refund methods
CREATE TYPE refund_method AS ENUM ('gcash', 'bank', 'cash');

-- Audit action types
CREATE TYPE audit_action AS ENUM (
    'CREATE',
    'UPDATE', 
    'DELETE',
    'LOGIN',
    'LOGOUT',
    'VERIFY_PAYMENT',
    'APPROVE_REFUND',
    'REJECT_REFUND',
    'CANCEL_ORDER',
    'COMPLETE_ORDER',
    'STOCK_ADJUSTMENT',
    'ROLE_CHANGE',
    'ACCOUNT_DISABLE',
    'ACCOUNT_ENABLE'
);

-- Notification types
CREATE TYPE notification_type AS ENUM (
    -- Account notifications
    'account_created',
    'account_modified', 
    'role_changed', 
    'account_status',
    'password_changed',
    
    -- Order notifications
    'order_placed',
    'order_confirmed',
    'order_processing',
    'order_ready',
    'order_completed',
    'order_cancelled',
    'payment_verified',
    'payment_rejected',
    
    -- Refund notifications
    'refund_requested',
    'refund_approved',
    'refund_rejected',
    'refund_processed',
    
    -- Inventory notifications
    'low_stock_alert',
    'out_of_stock_alert',
    'stock_replenished',
    
    -- System notifications
    'system_announcement',
    'maintenance_alert',
    'promotion_alert',
    
    -- General toast notifications
    'success',
    'error',
    'warning',
    'info'
);
