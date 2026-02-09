// @ts-nocheck
// TODO: Fix audit log calls to use new AuditLogEntry interface
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Label } from "../components/ui/label";
import { ProductManagement } from "../components/admin/ProductManagement";
import { AccountManagement } from "../components/admin/AccountManagement";
import { InventoryTracking } from "../components/admin/InventoryTracking";
import { OrderManagement } from "../components/admin/OrderManagement";
import { CreateOrderDialog } from "../components/admin/OrderCRUD";
import { AuditTrailViewer } from "../components/admin/AuditTrailViewer";
import { SalesReport } from "../components/admin/SalesReport";
import { ManualOrderCreation } from "../components/admin/ManualOrderCreation";
import { CouponManagement } from "../components/admin/CouponManagement";
import { QRScanner } from "../components/admin/QRScanner";
import { SalesDashboard } from "../components/admin/SalesDashboard";
import { InvoiceReceipt } from "../components/InvoiceReceipt";
import { addAuditLog } from "../lib/auditLog";
import { useAuditLog } from "../hooks/useAuditLog";
import { toast } from "sonner";
import { SUPABASE_URL } from "../services/storageService";

const poybashLogo = `${SUPABASE_URL}/storage/v1/object/public/assets/logos/poybash-logo.png`;
import {
  Package,
  Users,
  Coins,
  ShoppingCart,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  BarChart3,
  FileText,
  Shield,
  Tag,
  LayoutDashboard,
  ArrowUp,
  ArrowDown,
  QrCode,
} from "lucide-react";
import type { Order } from "../contexts/AuthContext";
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "../lib/products";
import type { Product } from "../lib/products";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { hasPermission, getRoleName } from "../lib/permissions";

// Helper function to format currency with K/M suffixes
const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    const millions = amount / 1000000;
    return millions % 1 === 0 ? `₱${millions}M` : `₱${millions.toFixed(1)}M`;
  } else if (amount >= 1000) {
    const thousands = amount / 1000;
    return thousands % 1 === 0 ? `₱${thousands}K` : `₱${thousands.toFixed(1)}K`;
  } else {
    return `₱${amount}`;
  }
};

interface AdminDashboardPageProps {
  onNavigate: (page: string) => void;
}

export function AdminDashboardPage({ onNavigate }: AdminDashboardPageProps) {
  const {
    user,
    canAccessAdmin,
  } = useAuth();
  const { logProductAction } = useAuditLog();
  
  // Helper functions for role checks
  const isOwner = () => user?.role === 'owner';
  const isAdmin = () => user?.role === 'admin' || user?.role === 'owner';

  // Set default tab based on role
  const getDefaultTab = () => {
    if (user?.role === "staff") return "sales-dashboard";
    if (user?.role === "inventory-clerk") return "inventory-dashboard";
    return "overview";
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showManualOrderDialog, setShowManualOrderDialog] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Load products and orders
  useEffect(() => {
    setProducts(getProducts());
    
    // Load orders from localStorage
    const storedOrders = localStorage.getItem('orders');
    if (storedOrders) {
      setOrders(JSON.parse(storedOrders));
    } else {
      setOrders([]);
    }
  }, [activeTab]);

  // Refresh products function - can be called by child components
  const refreshProducts = () => {
    setProducts(getProducts());
  };

  // Redirect if not admin or owner
  if (!canAccessAdmin()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2>Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
          <Button onClick={() => onNavigate("home")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const stats = useMemo(() => {
    // Guard against undefined orders
    if (!orders || !Array.isArray(orders)) {
      return {
        totalRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0,
        refundRequests: 0,
        totalCustomers: 0,
        newCustomers: 0,
        inStockProducts: products.length,
        dailyData: [],
        topProducts: [],
      };
    }
    
    const totalRevenue = orders
      .filter((o) => o.status === "completed")
      .reduce((sum, order) => sum + order.total, 0);

    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const completedOrders = orders.filter(
      (o) => o.status === "completed",
    ).length;
    const refundRequests = orders.filter((o) =>
      o.items.some(
        (item) => item.refundRequested && item.refundStatus === "pending",
      ),
    ).length;

    // Get total customers
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const customers = users.filter((u: any) => u.role === "customer");

    // Get new customers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newCustomers = customers.filter(
      (c: any) => c.createdAt && new Date(c.createdAt) >= thirtyDaysAgo,
    ).length;

    // Calculate daily data for last 7 days
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayOrders = orders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= date && orderDate < nextDate;
      });

      const dayRevenue = dayOrders
        .filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + o.total, 0);

      const dayPending = dayOrders.filter((o) => o.status === "pending").length;
      const dayCompleted = dayOrders.filter(
        (o) => o.status === "completed",
      ).length;

      dailyData.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        revenue: dayRevenue,
        pendingOrders: dayPending,
        completedOrders: dayCompleted,
      });
    }

    // Calculate top selling products
    const productSales: Record<
      number,
      { product: Product; quantity: number; revenue: number }
    > = {};
    orders
      .filter((o) => o.status === "completed")
      .forEach((order) => {
        order.items.forEach((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (product) {
            if (!productSales[item.productId]) {
              productSales[item.productId] = {
                product,
                quantity: 0,
                revenue: 0,
              };
            }
            productSales[item.productId].quantity += item.quantity;
            productSales[item.productId].revenue += item.price * item.quantity;
          }
        });
      });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders: orders.length,
      pendingOrders,
      completedOrders,
      refundRequests,
      totalProducts: products.length,
      totalCustomers: customers.length,
      newCustomers,
      inStockProducts: products.filter((p) => p.inStock).length,
      dailyData,
      topProducts,
    };
  }, [orders, products]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === "all") return orders;
    return orders.filter((order) => order.status === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  const handleUpdateOrderStatus = (
    orderId: string,
    newStatus: Order["status"],
  ) => {
    updateOrderStatus(orderId, newStatus);
    toast.success("Order status updated", {
      description: `Order ${orderId} is now ${newStatus.replace("-", " ")}`,
    });
    setSelectedOrder(null);
  };

  const handleAddProduct = (product: Omit<Product, "id">) => {
    const newProduct = addProduct(product);
    setProducts(getProducts());

    // Log product creation
    logProductAction(
      "product_created",
      newProduct.id.toString(),
      product.name,
      [
        { field: "name", oldValue: "", newValue: product.name },
        { field: "category", oldValue: "", newValue: product.category },
        { field: "price", oldValue: "", newValue: `₱${product.price}` },
      ],
    );

    toast.success("Product added successfully", {
      description: `${product.name} has been added to the catalog`,
    });
  };

  const handleUpdateProduct = (
    id: number,
    productUpdates: Partial<Product>,
  ) => {
    const oldProduct = products.find((p) => p.id === id);
    updateProduct(id, productUpdates);
    setProducts(getProducts());

    // Build changes array for audit log - only log fields that actually changed
    const changes: { field: string; oldValue: string; newValue: string }[] = [];
    if (
      productUpdates.name &&
      oldProduct &&
      productUpdates.name !== oldProduct.name
    ) {
      changes.push({
        field: "name",
        oldValue: oldProduct.name,
        newValue: productUpdates.name,
      });
    }
    if (
      productUpdates.price !== undefined &&
      oldProduct &&
      productUpdates.price !== oldProduct.price
    ) {
      changes.push({
        field: "price",
        oldValue: `₱${oldProduct.price}`,
        newValue: `₱${productUpdates.price}`,
      });
    }
    if (
      productUpdates.category &&
      oldProduct &&
      productUpdates.category !== oldProduct.category
    ) {
      changes.push({
        field: "category",
        oldValue: oldProduct.category,
        newValue: productUpdates.category,
      });
    }
    if (
      productUpdates.active !== undefined &&
      oldProduct &&
      productUpdates.active !== oldProduct.active
    ) {
      changes.push({
        field: "status",
        oldValue: oldProduct.active ? "Active" : "Inactive",
        newValue: productUpdates.active ? "Active" : "Inactive",
      });
    }

    // Determine the action type
    const actionType =
      productUpdates.active !== undefined && !productUpdates.active
        ? "product_deleted" // When deactivating
        : productUpdates.active !== undefined &&
            productUpdates.active &&
            oldProduct &&
            !oldProduct.active
          ? "product_reactivated" // When reactivating
          : "product_modified"; // Regular updates

    // Log product update
    if (oldProduct) {
      logProductAction(actionType, id.toString(), oldProduct.name, changes);
    }

    toast.success("Product updated successfully", {
      description: "Changes have been saved",
    });
  };

  const handleDeleteProduct = (id: number) => {
    const product = products.find((p) => p.id === id);
    deleteProduct(id);
    setProducts(getProducts());

    // Log product deletion
    if (product) {
      logProductAction("product_deleted", id.toString(), product.name, [
        { field: "status", oldValue: "Active", newValue: "Deleted" },
      ]);
    }

    toast.success("Product removed successfully", {
      description: "The product has been removed from the catalog.",
    });
  };

  const [createdOrderForInvoice, setCreatedOrderForInvoice] =
    useState<Order | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  const handleCreateManualOrder = (
    orderData: Omit<
      Order,
      "id" | "userId" | "createdAt" | "updatedAt" | "status"
    >,
    customerUserId?: string,
  ) => {
    const orderId = placeOrder(orderData, customerUserId);

    addAuditLog({
      action: "Create Manual Order",
      entityType: "order",
      entityId: orderId,
      description: `Manual order created for ${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}`,
    });

    // Get the newly created order
    setTimeout(() => {
      const newOrder = orders.find((o) => o.id === orderId);
      if (newOrder) {
        setCreatedOrderForInvoice(newOrder);
        setShowInvoiceDialog(true);
      }
    }, 100);

    toast.success("Order created successfully", {
      description: `Order ${orderId} has been created. You can now download the invoice.`,
      action: {
        label: "View Invoice",
        onClick: () => setShowInvoiceDialog(true),
      },
    });
    setShowManualOrderDialog(false);
  };

  const handleQuickFilter = (tab: string, filter: string) => {
    if (tab === "orders") {
      setOrderStatusFilter(filter);
    } else if (tab === "products") {
      setProductFilter(filter);
    }
    setActiveTab(tab);
  };

  const getStatusBadge = (status: Order["status"]) => {
    const variants: Record<Order["status"], { variant: any; icon: any }> = {
      pending: { variant: "secondary", icon: Clock },
      processing: { variant: "default", icon: Package },
      "ready-for-pickup": { variant: "default", icon: CheckCircle },
      completed: { variant: "default", icon: CheckCircle },
      cancelled: { variant: "destructive", icon: XCircle },
      "refund-requested": { variant: "secondary", icon: AlertCircle },
      refunded: { variant: "secondary", icon: AlertCircle },
      reserved: { variant: "default", icon: Clock },
    };

    const { variant, icon: Icon } = variants[status];

    return (
      <Badge variant={variant as any} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status.replace("-", " ").toUpperCase()}
      </Badge>
    );
  };

  // Helper functions for dynamic dashboard title and greeting
  const getDashboardTitle = (role: string) => {
    switch (role) {
      case "admin":
      case "owner":
        return "Admin Dashboard";
      case "staff":
        return "Sales Dashboard";
      case "inventory-clerk":
        return "Inventory Dashboard";
      default:
        return "Admin Dashboard";
    }
  };

  const getDashboardGreeting = (role: string, firstName: string) => {
    switch (role) {
      case "admin":
      case "owner":
        return `Welcome back, ${firstName}!`;
      case "staff":
        return `Welcome, ${firstName}!`;
      case "inventory-clerk":
        return `Welcome, ${firstName}!`;
      default:
        return `Welcome back, ${firstName}!`;
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 lg:py-12">
      <div className="container max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img
              src={poybashLogo}
              alt="PoyBash Furniture"
              className="w-10 h-10"
            />
            <div>
              <h1>{getDashboardTitle(user?.role || "admin")}</h1>
              <p className="text-muted-foreground">
                {getDashboardGreeting(
                  user?.role || "admin",
                  user?.firstName || "User",
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="px-3 py-1">
              {user?.role ? getRoleName(user.role) : "Admin Account"}
            </Badge>
            <Button
              variant="outline"
              onClick={() => {
                logout();
                onNavigate("login");
              }}
            >
              Logout
            </Button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList
            className="grid w-full"
            style={{
              gridTemplateColumns: `repeat(${
                [
                  // Overview tab only for admin/owner
                  user?.role === "admin" || user?.role === "owner",
                  // Sales Dashboard only for staff
                  user?.role === "staff",
                  // Inventory Dashboard only for inventory-clerk
                  user?.role === "inventory-clerk",
                  hasPermission(user?.role || "customer", "view:products"),
                  hasPermission(user?.role || "customer", "view:orders"),
                  hasPermission(user?.role || "customer", "view:accounts"),
                  hasPermission(user?.role || "customer", "edit:products"),
                  hasPermission(user?.role || "customer", "view:coupons"),
                ].filter(Boolean).length
              }, 1fr)`,
            }}
          >
            {/* Overview tab - Only for Admin & Owner */}
            {(user?.role === "admin" || user?.role === "owner") && (
              <TabsTrigger value="overview">Overview</TabsTrigger>
            )}
            {/* Sales Dashboard - Only for Sales Staff */}
            {user?.role === "staff" && (
              <TabsTrigger value="sales-dashboard">Dashboard</TabsTrigger>
            )}
            {/* Inventory Dashboard - Only for Inventory Clerk */}
            {user?.role === "inventory-clerk" && (
              <TabsTrigger value="inventory-dashboard">Dashboard</TabsTrigger>
            )}
            {hasPermission(user?.role || "customer", "view:products") && (
              <TabsTrigger value="products">Products</TabsTrigger>
            )}
            {hasPermission(user?.role || "customer", "view:orders") && (
              <TabsTrigger value="orders">Orders</TabsTrigger>
            )}
            {hasPermission(user?.role || "customer", "view:accounts") && (
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
            )}
            {hasPermission(user?.role || "customer", "edit:products") && (
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
            )}
            {hasPermission(user?.role || "customer", "view:coupons") && (
              <TabsTrigger value="coupons">Coupons</TabsTrigger>
            )}
          </TabsList>

          {/* Sales Dashboard Tab - For Sales Staff */}
          <TabsContent value="sales-dashboard" className="space-y-6 pb-12">
            <SalesDashboard
              orders={orders}
              products={products}
              onViewOrder={(order) => setSelectedOrder(order)}
              onQuickFilter={handleQuickFilter}
            />
          </TabsContent>

          {/* Inventory Dashboard Tab - For Inventory Clerk (placeholder for now) */}
          <TabsContent value="inventory-dashboard" className="space-y-6 pb-12">
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3>Inventory Dashboard</h3>
              <p className="text-muted-foreground">Coming soon...</p>
            </div>
          </TabsContent>

          {/* Overview Tab - For Admin & Owner */}
          <TabsContent value="overview" className="space-y-6 pb-12">
            {/* Metric Cards with Mini Charts */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Pending Orders Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0 }}
              >
                <Card className="bg-gradient-to-br from-[#d2691e]/20 to-[#d2691e]/5 border-[#d2691e]/30 h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-muted-foreground text-sm mb-1">
                          PENDING ORDERS
                        </p>
                        <p className="text-3xl">{stats.pendingOrders}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Awaiting processing
                        </p>
                      </div>
                      <div className="p-3 bg-[#d2691e]/20 rounded-full">
                        <Clock className="h-6 w-6 text-[#d2691e]" />
                      </div>
                    </div>
                    <div className="h-16 w-full min-h-[64px]">
                      <ResponsiveContainer
                        width="100%"
                        height={64}
                        minWidth={0}
                      >
                        <LineChart data={stats.dailyData}>
                          <Line
                            type="monotone"
                            dataKey="pendingOrders"
                            stroke="#d2691e"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Total Revenue Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="bg-gradient-to-br from-[#8b4513]/20 to-[#8b4513]/5 border-[#8b4513]/30 h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-muted-foreground text-sm mb-1">
                          TOTAL REVENUE
                        </p>
                        <p className="text-3xl">
                          {formatCurrency(stats.totalRevenue)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          From completed orders
                        </p>
                      </div>
                      <div className="p-3 bg-[#8b4513]/20 rounded-full">
                        <Coins className="h-6 w-6 text-[#8b4513]" />
                      </div>
                    </div>
                    <div className="h-16 w-full min-h-[64px]">
                      <ResponsiveContainer
                        width="100%"
                        height={64}
                        minWidth={0}
                      >
                        <LineChart data={stats.dailyData}>
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#8b4513"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Completed Orders Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-gradient-to-br from-[#cd853f]/20 to-[#cd853f]/5 border-[#cd853f]/30 h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-muted-foreground text-sm mb-1">
                          COMPLETED ORDERS
                        </p>
                        <p className="text-3xl">{stats.completedOrders}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Successfully fulfilled
                        </p>
                      </div>
                      <div className="p-3 bg-[#cd853f]/20 rounded-full">
                        <CheckCircle className="h-6 w-6 text-[#cd853f]" />
                      </div>
                    </div>
                    <div className="h-16 w-full min-h-[64px]">
                      <ResponsiveContainer
                        width="100%"
                        height={64}
                        minWidth={0}
                      >
                        <LineChart data={stats.dailyData}>
                          <Line
                            type="monotone"
                            dataKey="completedOrders"
                            stroke="#cd853f"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* New Customers Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-[#deb887]/20 to-[#deb887]/5 border-[#deb887]/30 h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-muted-foreground text-sm mb-1">
                          NEW CUSTOMERS
                        </p>
                        <p className="text-3xl">{stats.newCustomers}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Last 30 days
                        </p>
                      </div>
                      <div className="p-3 bg-[#deb887]/20 rounded-full">
                        <Users className="h-6 w-6 text-[#deb887]" />
                      </div>
                    </div>
                    <div className="h-16 w-full min-h-[64px]">
                      <ResponsiveContainer
                        width="100%"
                        height={64}
                        minWidth={0}
                      >
                        <LineChart data={stats.dailyData}>
                          <Line
                            type="monotone"
                            dataKey="completedOrders"
                            stroke="#deb887"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Summary Chart */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Summary</CardTitle>
                  <CardDescription className="text-xs">
                    Revenue trend over the last 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-64 min-h-[256px]">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      minHeight={256}
                    >
                      <AreaChart data={stats.dailyData}>
                        <defs>
                          <linearGradient
                            id="colorRevenue"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#8b4513"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#8b4513"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="date"
                          stroke="#6b7280"
                          tick={{ fontSize: 11 }}
                          height={40}
                          tickMargin={8}
                          minTickGap={30}
                        />
                        <YAxis
                          stroke="#6b7280"
                          tick={{ fontSize: 11 }}
                          width={50}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number) => `₱${value.toFixed(2)}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#8b4513"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Selling Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Products</CardTitle>
                  <CardDescription>
                    Best performing furniture by revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.topProducts.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No sales data available
                      </p>
                    ) : (
                      stats.topProducts.map((item, index) => (
                        <div
                          key={item.product.id}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors"
                        >
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                            <img
                              src={item.product.images[0] || ""}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate">{item.product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.product.category} • {item.quantity} sold
                            </p>
                          </div>
                          <div className="text-right">
                            <p>₱{item.revenue.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              Sales
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Owner-Only Sections */}
            {isOwner() && (
              <div className="space-y-6 mt-8">
                {/* Sales Report Section */}
                <div className="bg-gradient-to-br from-[#f5deb3]/20 to-[#deb887]/10 p-8 rounded-xl border border-[#deb887]/30">
                  <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                      <h3 className="text-2xl mb-2">Sales Analytics</h3>
                      <p className="text-muted-foreground">
                        Generate comprehensive reports for business insights
                      </p>
                    </div>
                    <SalesReport orders={orders} />
                  </div>
                </div>

                {/* Audit Trail Section */}
                <div className="bg-gradient-to-br from-[#8b4513]/5 to-[#d2691e]/5 p-8 rounded-xl border border-[#8b4513]/20">
                  <div className="max-w-7xl mx-auto">
                    <div className="mb-6">
                      <h3 className="text-2xl mb-2">System Audit Trail</h3>
                      <p className="text-muted-foreground">
                        Monitor all system activities and changes
                      </p>
                    </div>
                    <AuditTrailViewer />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6 pb-12">
            <ProductManagement
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              initialFilter={productFilter}
              readOnly={user?.role === "staff"}
            />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2>Order Management</h2>
                <p className="text-muted-foreground">
                  Manage customer orders and refunds
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowQRScanner(!showQRScanner)}
                  className="gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  {showQRScanner ? "Hide Scanner" : "Scan QR Code"}
                </Button>
                <CreateOrderDialog
                  onCreateOrder={(orderData, customUserId) => {
                    const orderId = placeOrder(orderData, customUserId);
                    toast.success("Order created successfully!");
                  }}
                />
              </div>
            </div>

            {/* QR Scanner */}
            {showQRScanner && (
              <QRScanner
                orders={orders}
                onClose={() => setShowQRScanner(false)}
              />
            )}

            {/* Orders List - Hidden when scanner is active */}
            {!showQRScanner && (
              <OrderManagement
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onCancelOrder={cancelOrder}
                onProcessRefund={processManualRefund}
                initialFilter={orderStatusFilter}
              />
            )}
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            <AccountManagement />
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6 pb-12">
            <InventoryTracking
              products={products}
              onRefresh={refreshProducts}
            />
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-6">
            <CouponManagement />
          </TabsContent>
        </Tabs>

        {/* Order Details Dialog (from Sales Dashboard) */}
        <Dialog
          open={!!selectedOrder}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
        >
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details - #{selectedOrder?.id}</DialogTitle>
              <DialogDescription>
                View and manage order information
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <OrderDetailsDialog
                order={selectedOrder}
                onUpdateStatus={handleUpdateOrderStatus}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Invoice Dialog */}
        <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
          <DialogContent className="max-w-6xl max-h-[95vh]">
            <DialogHeader>
              <DialogTitle>Order Invoice</DialogTitle>
              <DialogDescription>
                Print or download the invoice for this order
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(95vh-120px)] invoice-scroll pb-8">
              {createdOrderForInvoice && (
                <InvoiceReceipt order={createdOrderForInvoice} />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Order Details Dialog Component
function OrderDetailsDialog({
  order,
  onUpdateStatus,
}: {
  order: Order;
  onUpdateStatus: (orderId: string, status: Order["status"]) => void;
}) {
  const { user } = useAuth();
  const [newStatus, setNewStatus] = useState(order.status);
  const [showInvoice, setShowInvoice] = useState(false);

  // Check if user is Admin/Owner
  const isAdminOrOwner = user?.role === "admin" || user?.role === "owner";

  // State Machine: Get available status transitions based on current status and role
  const getAvailableStatuses = () => {
    const currentStatus = order.status;

    // Absolutely locked states - CANNOT be changed through dropdown
    if (currentStatus === "completed" || currentStatus === "refunded") {
      return [
        {
          value: currentStatus,
          label: getStatusLabel(currentStatus),
          disabled: true,
        },
      ];
    }

    let availableStatuses: Array<{
      value: Order["status"];
      label: string;
      disabled?: boolean;
    }> = [];

    if (isAdminOrOwner) {
      // ADMIN/OWNER: Can move forward + one step back + reopen cancelled
      switch (currentStatus) {
        case "pending":
          availableStatuses = [
            { value: "pending", label: "Pending - Order received" },
            { value: "reserved", label: "Reserved - Partial payment received" },
            { value: "processing", label: "Processing - Order being prepared" },
            { value: "cancelled", label: "Cancelled - Order cancelled" },
          ];
          break;
        case "reserved":
          availableStatuses = [
            { value: "pending", label: "Pending - Order received" }, // Can go back (fix error)
            { value: "reserved", label: "Reserved - Partial payment received" },
            { value: "processing", label: "Processing - Order being prepared" },
            { value: "cancelled", label: "Cancelled - Order cancelled" },
          ];
          break;
        case "processing":
          availableStatuses = [
            { value: "pending", label: "Pending - Order received" }, // Can go back
            { value: "reserved", label: "Reserved - Partial payment received" }, // Can go back
            { value: "processing", label: "Processing - Order being prepared" },
            {
              value: "ready-for-pickup",
              label: "Ready for Pickup - Order ready",
            },
            { value: "cancelled", label: "Cancelled - Order cancelled" },
          ];
          break;
        case "ready-for-pickup":
          availableStatuses = [
            { value: "processing", label: "Processing - Order being prepared" }, // Can go back one step
            {
              value: "ready-for-pickup",
              label: "Ready for Pickup - Order ready",
            },
            {
              value: "completed",
              label: "Completed - Order completed & paid in full",
            },
            { value: "cancelled", label: "Cancelled - Order cancelled" },
          ];
          break;
        case "cancelled":
          // Admin can reopen cancelled orders to pending
          availableStatuses = [
            { value: "pending", label: "Pending - Reopen order" },
            { value: "cancelled", label: "Cancelled - Order cancelled" },
          ];
          break;
      }
    } else {
      // STAFF/INVENTORY CLERK: Forward-only progression
      switch (currentStatus) {
        case "pending":
          availableStatuses = [
            { value: "pending", label: "Pending - Order received" },
            { value: "reserved", label: "Reserved - Partial payment received" },
            { value: "processing", label: "Processing - Order being prepared" },
            { value: "cancelled", label: "Cancelled - Order cancelled" },
          ];
          break;
        case "reserved":
          availableStatuses = [
            { value: "reserved", label: "Reserved - Partial payment received" },
            { value: "processing", label: "Processing - Order being prepared" },
            { value: "cancelled", label: "Cancelled - Order cancelled" },
          ];
          break;
        case "processing":
          availableStatuses = [
            { value: "processing", label: "Processing - Order being prepared" },
            {
              value: "ready-for-pickup",
              label: "Ready for Pickup - Order ready",
            },
            { value: "cancelled", label: "Cancelled - Order cancelled" },
          ];
          break;
        case "ready-for-pickup":
          availableStatuses = [
            {
              value: "ready-for-pickup",
              label: "Ready for Pickup - Order ready",
            },
            {
              value: "completed",
              label: "Completed - Order completed & paid in full",
            },
            { value: "cancelled", label: "Cancelled - Order cancelled" },
          ];
          break;
        case "cancelled":
          // Staff cannot reopen cancelled orders
          availableStatuses = [
            {
              value: "cancelled",
              label: "Cancelled - Order cancelled",
              disabled: true,
            },
          ];
          break;
      }
    }

    return availableStatuses;
  };

  const getStatusLabel = (status: Order["status"]) => {
    const labels: Record<Order["status"], string> = {
      pending: "Pending - Order received",
      reserved: "Reserved - Partial payment received",
      processing: "Processing - Order being prepared",
      "ready-for-pickup": "Ready for Pickup - Order ready",
      completed: "Completed - LOCKED (use Refund Management)",
      cancelled: "Cancelled - Order cancelled",
      "refund-requested": "Refund Requested",
      refunded: "Refunded - LOCKED",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Toggle between Order Details and Invoice */}
      <div className="flex gap-2 border-b pb-4">
        <Button
          variant={!showInvoice ? "default" : "outline"}
          onClick={() => setShowInvoice(false)}
          className="flex-1"
        >
          Order Details
        </Button>
        <Button
          variant={showInvoice ? "default" : "outline"}
          onClick={() => setShowInvoice(true)}
          className="flex-1"
        >
          Invoice
        </Button>
      </div>

      {showInvoice ? (
        /* Invoice View */
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <InvoiceReceipt order={order} />
        </div>
      ) : (
        /* Order Details View */
        <div className="space-y-6">
          {/* Order Items */}
          <div className="space-y-4">
            <h4>Order Items</h4>
            {order.items.map((item, index) => (
              <div key={index} className="flex gap-4 p-4 border rounded-lg">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4>{item.name}</h4>
                  <p className="text-muted-foreground">Color: {item.color}</p>
                  <p className="text-muted-foreground">
                    Quantity: {item.quantity}
                  </p>
                  <p className="text-primary">
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </p>

                  {/* Show refund status if any */}
                  {item.refundRequested && (
                    <Badge
                      variant={
                        item.refundStatus === "pending"
                          ? "secondary"
                          : item.refundStatus === "approved"
                            ? "default"
                            : "destructive"
                      }
                      className="flex items-center gap-1 w-fit mt-2"
                    >
                      {item.refundStatus === "pending" && (
                        <Clock className="h-3 w-3" />
                      )}
                      {item.refundStatus === "approved" && (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      {item.refundStatus === "rejected" && (
                        <XCircle className="h-3 w-3" />
                      )}
                      Refund {item.refundStatus}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Customer Information */}
          <div className="space-y-2">
            <h4>Customer Information</h4>
            <div className="p-4 bg-secondary/30 rounded-lg space-y-2">
              <p>
                <strong>Name:</strong> {order.shippingAddress.firstName}{" "}
                {order.shippingAddress.lastName}
              </p>
              <p>
                <strong>Address:</strong> {order.shippingAddress.address},{" "}
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.zipCode}
              </p>
            </div>
          </div>

          {/* Pickup/Delivery Information */}
          <div className="space-y-2">
            <h4>Pickup/Delivery Information</h4>
            <div className="p-4 bg-secondary/30 rounded-lg space-y-2">
              <p>
                <strong>Method:</strong>{" "}
                {order.deliveryMethod === "store-pickup"
                  ? "Store Pickup"
                  : "Customer Arranged Delivery"}
              </p>
              {order.pickupDetails && (
                <>
                  <p>
                    <strong>Contact Person:</strong>{" "}
                    {order.pickupDetails.pickupPerson}
                  </p>
                  <p>
                    <strong>Contact Phone:</strong>{" "}
                    {order.pickupDetails.pickupPhone}
                  </p>
                  {order.pickupDetails.deliveryService && (
                    <p>
                      <strong>Delivery Service:</strong>{" "}
                      {order.pickupDetails.deliveryService}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-2">
            <h4>Payment Information</h4>
            <div className="p-4 bg-secondary/30 rounded-lg space-y-2">
              <p>
                <strong>Method:</strong>{" "}
                {order.paymentMethod === "cash"
                  ? "Cash on Pickup"
                  : order.paymentMethod === "gcash"
                    ? "GCash"
                    : "Bank Transfer"}
              </p>
              {order.paymentReference && (
                <p>
                  <strong>Reference Number:</strong> {order.paymentReference}
                </p>
              )}
              {order.paymentProof && (
                <div>
                  <p>
                    <strong>Payment Proof:</strong>
                  </p>
                  <img
                    src={order.paymentProof}
                    alt="Payment proof"
                    className="mt-2 max-w-xs rounded border"
                  />
                </div>
              )}
              <p>
                <strong>Subtotal:</strong> ₱{order.subtotal.toFixed(2)}
              </p>
              <p>
                <strong>Total:</strong> ₱{order.total.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Order Status Update */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Update Order Status</Label>
              <Select
                value={newStatus}
                onValueChange={(value) =>
                  setNewStatus(value as Order["status"])
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableStatuses().map((status) => (
                    <SelectItem
                      key={status.value}
                      value={status.value}
                      disabled={status.disabled}
                    >
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => onUpdateStatus(order.id, newStatus)}
              disabled={newStatus === order.status}
            >
              Update Status
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
