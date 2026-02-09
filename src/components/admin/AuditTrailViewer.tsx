// @ts-nocheck
// TODO: Fix type errors in AuditTrailViewer
'use client';

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Activity,
  Download,
  Search,
  Filter,
  Calendar as CalendarIcon,
  User,
  Package,
  ShoppingCart,
  Shield,
  Crown,
  FileText,
  Trash2,
  AlertTriangle,
  MonitorSmartphone,
  MapPin,
  Clock,
  TrendingUp,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  List,
  GitBranch,
  Warehouse,
} from "lucide-react";
import {
  getAuditLogs,
  getAuditLogStats,
  searchAuditLogs,
  getAuditLogsByRole,
  getAuditLogsByActionType,
  getAuditLogsByDateRange,
  exportAuditLogsToCSV,
  exportFilteredAuditLogsToCSV,
  clearAuditLogs,
  getActionTypeDisplayName,
  getEntityTypeDisplayName,
  isCriticalAction,
  detectSuspiciousActivities,
  getRelatedActions,
  getUserActivitySummary,
  type AuditLogEntry,
  type AuditActionType,
  type SuspiciousActivity,
  type UserActivitySummary,
} from "../../lib/auditLog";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { motion, AnimatePresence } from "motion/react";
import { CustomDateRangePicker } from "./CustomDateRangePicker";

// Helper function for date formatting
const formatDate = (date: Date, formatStr: string) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  
  if (formatStr === "MMM dd, yyyy") {
    return `${month} ${day}, ${year}`;
  }
  return date.toLocaleDateString();
};

export function AuditTrailViewer() {
  const { user: currentUser } = useAuth();
  const isOwner = currentUser?.role === "owner";
  const isAdmin = currentUser?.role === "admin";

  const [logs, setLogs] = useState<AuditLogEntry[]>(getAuditLogs());
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [showSuspicious, setShowSuspicious] = useState(false);
  const itemsPerPage = 20;

  // Get statistics
  const stats = useMemo(() => getAuditLogStats(), [logs]);

  // Get suspicious activities
  const suspiciousActivities = useMemo(() => detectSuspiciousActivities(), [logs]);

  // Get user activity summary
  const userActivitySummary = useMemo(() => getUserActivitySummary(), [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    let filtered = logs;

    // Search filter
    if (searchTerm) {
      filtered = searchAuditLogs(searchTerm);
    }

    // Role filter (exclude customer) - Add null checks
    if (roleFilter !== "all") {
      filtered = filtered.filter(log => log.performedBy?.role === roleFilter);
    } else {
      // Always exclude customer role
      filtered = filtered.filter(log => log.performedBy?.role !== "customer");
    }

    // Warehouse filter
    if (warehouseFilter !== "all") {
      filtered = filtered.filter(log => log.metadata?.warehouse === warehouseFilter);
    }

    // Action type filter
    if (actionTypeFilter !== "all") {
      filtered = filtered.filter(log => log.actionType === actionTypeFilter);
    }

    // Entity type filter
    if (entityTypeFilter !== "all") {
      filtered = filtered.filter(log => log.targetEntity?.type === entityTypeFilter);
    }

    // Date range filter
    if (dateRange === "custom" && customDateRange.from && customDateRange.to) {
      const start = new Date(customDateRange.from);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customDateRange.to);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= start && logDate <= end;
      });
    } else if (dateRange !== "all") {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(log => new Date(log.timestamp) >= startDate);
    }

    // Final safety filter - remove any logs with missing critical data
    filtered = filtered.filter(log => 
      log.performedBy && 
      log.performedBy.id && 
      log.performedBy.email && 
      log.performedBy.role &&
      log.targetEntity &&
      log.targetEntity.type &&
      log.targetEntity.id
    );

    return filtered;
  }, [logs, searchTerm, roleFilter, actionTypeFilter, entityTypeFilter, warehouseFilter, dateRange, customDateRange]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportAll = () => {
    const csv = exportAuditLogsToCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-trail-all-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Audit logs exported successfully! 📥", {
      description: "All audit logs have been exported to CSV",
      duration: 3000,
    });
  };

  const handleExportFiltered = () => {
    const csv = exportFilteredAuditLogsToCSV(filteredLogs);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-trail-filtered-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Filtered audit logs exported! 📥", {
      description: `${filteredLogs.length} records exported to CSV`,
      duration: 3000,
    });
  };

  const handleClearLogs = () => {
    if (!isOwner) {
      toast.error("Access denied! 🚫", {
        description: "Only owners can clear audit logs",
        duration: 3000,
      });
      return;
    }

    if (
      confirm(
        "⚠️ WARNING: This will permanently delete ALL audit logs. This action cannot be undone. Are you sure you want to continue?"
      )
    ) {
      clearAuditLogs();
      setLogs([]);
      toast.success("Audit logs cleared", {
        description: "All audit trail records have been deleted",
        duration: 3000,
      });
    }
  };

  const handleRefresh = () => {
    setLogs(getAuditLogs());
    toast.success("Refreshed! ✅", {
      description: "Audit logs have been refreshed",
      duration: 2000,
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-3 w-3" />;
      case "admin":
        return <Shield className="h-3 w-3" />;
      case "staff":
        return <ShoppingCart className="h-3 w-3" />;
      case "inventory-clerk":
        return <Package className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
      case "staff":
      case "inventory-clerk":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getActionTypeBadgeVariant = (actionType: string) => {
    if (actionType.includes("created")) return "default";
    if (actionType.includes("modified") || actionType.includes("updated")) return "secondary";
    if (actionType.includes("deleted") || actionType.includes("cancelled") || actionType.includes("rejected")) return "destructive";
    if (actionType.includes("approved") || actionType.includes("completed") || actionType.includes("activated")) return "default";
    return "outline";
  };

  const getSeverityColor = (severity: "low" | "medium" | "high") => {
    switch (severity) {
      case "high":
        return "text-destructive bg-destructive/10 border-destructive/30";
      case "medium":
        return "text-primary bg-primary/10 border-primary/30";
      case "low":
        return "text-secondary-foreground bg-secondary/20 border-secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Suspicious Activity Alert */}
      {suspiciousActivities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-red-900 mb-1">
                {suspiciousActivities.length} Suspicious {suspiciousActivities.length === 1 ? "Activity" : "Activities"} Detected
              </h4>
              <p className="text-sm text-red-700 mb-3">
                Unusual patterns have been detected in system activity. Review recommended.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={() => setShowSuspicious(!showSuspicious)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showSuspicious ? "Hide" : "View"} Details
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showSuspicious && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-3"
              >
                {suspiciousActivities.map((activity) => (
                  <Card key={activity.id} className={`border-2 ${getSeverityColor(activity.severity)}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            {activity.type.replace("_", " ").toUpperCase()}
                          </Badge>
                          <p className="text-sm">{activity.description}</p>
                        </div>
                        <Badge variant={activity.severity === "high" ? "destructive" : "secondary"}>
                          {activity.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {activity.logs.length} related actions • Detected: {new Date(activity.detectedAt).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* User Activity Summary */}
      <Card className="bg-gradient-to-br from-secondary/30 to-background border-secondary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                User Activity Overview
              </CardTitle>
              <CardDescription>Most active users in the system</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {userActivitySummary.slice(0, 5).map((summary) => (
              <div
                key={summary.userId}
                className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm">{summary.userName || summary.email}</p>
                    <p className="text-xs text-muted-foreground">{summary.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    <span className="font-medium">{summary.totalActions}</span> total actions
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {summary.actionsToday} today • {summary.actionsThisWeek} this week
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-primary">{stats.total}</div>
            <p className="text-muted-foreground">All recorded actions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Today</CardTitle>
            <CalendarIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-primary">{stats.today}</div>
            <p className="text-muted-foreground">Actions today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>This Week</CardTitle>
            <CalendarIcon className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-primary">{stats.thisWeek}</div>
            <p className="text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>This Month</CardTitle>
            <CalendarIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-primary">{stats.thisMonth}</div>
            <p className="text-muted-foreground">Current month</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>
                Complete history of all system changes and actions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="flex gap-1 mr-2">
                <Button
                  size="sm"
                  variant={viewMode === "table" ? "default" : "outline"}
                  onClick={() => setViewMode("table")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "timeline" ? "default" : "outline"}
                  onClick={() => setViewMode("timeline")}
                >
                  <GitBranch className="h-4 w-4" />
                </Button>
              </div>
              <Button size="sm" variant="outline" onClick={handleRefresh}>
                <Activity className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportFiltered}>
                <Download className="h-4 w-4 mr-2" />
                Export Filtered
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportAll}>
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
              {isOwner && (
                <Button size="sm" variant="destructive" onClick={handleClearLogs}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user, entity, order number, SKU, coupon code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={dateRange} onValueChange={(value: any) => {
                  setDateRange(value);
                  if (value !== "custom") {
                    setCustomDateRange({ from: undefined, to: undefined });
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRange === "custom" && (
                <div className="space-y-2">
                  <Label>Select Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateRange.from && customDateRange.to ? (
                          <span>
                            {(() => {
                              const fromYear = customDateRange.from.getFullYear();
                              const toYear = customDateRange.to.getFullYear();
                              const fromMonth = customDateRange.from.getMonth();
                              const toMonth = customDateRange.to.getMonth();
                              
                              // Same month and year: "Jan 15-20, 2024"
                              if (fromYear === toYear && fromMonth === toMonth) {
                                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                return `${months[fromMonth]} ${customDateRange.from.getDate()}-${customDateRange.to.getDate()}, ${fromYear}`;
                              }
                              // Same year: "Jan 15 - Feb 20, 2024"
                              else if (fromYear === toYear) {
                                const fromFormatted = formatDate(customDateRange.from, "MMM dd, yyyy").replace(`, ${fromYear}`, '');
                                const toFormatted = formatDate(customDateRange.to, "MMM dd, yyyy");
                                return `${fromFormatted} - ${toFormatted}`;
                              }
                              // Different years: "Dec 25, 2023 - Jan 5, 2024"
                              else {
                                return `${formatDate(customDateRange.from, "MMM dd, yyyy")} - ${formatDate(customDateRange.to, "MMM dd, yyyy")}`;
                              }
                            })()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CustomDateRangePicker
                        value={customDateRange}
                        onChange={setCustomDateRange}
                        onApply={() => {
                          // Close the popover when Apply is clicked
                          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                        }}
                        onCancel={() => {
                          // Close the popover when Cancel is clicked
                          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <div className="space-y-2">
                <Label>Warehouse</Label>
                <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Warehouses</SelectItem>
                    <SelectItem value="lorenzo">
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-3 w-3" />
                        Lorenzo
                      </div>
                    </SelectItem>
                    <SelectItem value="oroquieta">
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-3 w-3" />
                        Oroquieta
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Sales Staff</SelectItem>
                    <SelectItem value="inventory-clerk">Inventory Clerk</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    <SelectItem value="user">User Accounts</SelectItem>
                    <SelectItem value="product">Products</SelectItem>
                    <SelectItem value="order">Orders</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="coupon">Coupons</SelectItem>
                    <SelectItem value="refund">Refunds</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Action Type</Label>
                <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    
                    {/* Account Management */}
                    <SelectItem value="account_created">Account Created</SelectItem>
                    <SelectItem value="account_modified">Account Modified</SelectItem>
                    <SelectItem value="role_changed">Role Changed</SelectItem>
                    <SelectItem value="account_deactivated">Account Deactivated</SelectItem>
                    <SelectItem value="account_reactivated">Account Reactivated</SelectItem>
                    
                    {/* Product Management */}
                    <SelectItem value="product_created">Product Created</SelectItem>
                    <SelectItem value="product_modified">Product Modified</SelectItem>
                    <SelectItem value="product_deleted">Product Deleted</SelectItem>
                    <SelectItem value="product_reactivated">Product Reactivated</SelectItem>
                    <SelectItem value="product_image_updated">Product Image Updated</SelectItem>
                    
                    {/* Taxonomy Management */}
                    <SelectItem value="taxonomy_created">Taxonomy Created</SelectItem>
                    <SelectItem value="taxonomy_modified">Taxonomy Modified</SelectItem>
                    <SelectItem value="taxonomy_deleted">Taxonomy Deleted</SelectItem>
                    
                    {/* Inventory Management */}
                    <SelectItem value="inventory_updated">Inventory Updated</SelectItem>
                    <SelectItem value="stock_added">Stock Added</SelectItem>
                    <SelectItem value="stock_removed">Stock Removed</SelectItem>
                    <SelectItem value="stock_transferred">Stock Transferred</SelectItem>
                    <SelectItem value="low_stock_alert">Low Stock Alert</SelectItem>
                    
                    {/* Order Management */}
                    <SelectItem value="order_created">Order Created</SelectItem>
                    <SelectItem value="order_status_updated">Order Status Updated</SelectItem>
                    <SelectItem value="order_modified">Order Modified</SelectItem>
                    <SelectItem value="order_cancelled">Order Cancelled</SelectItem>
                    <SelectItem value="manual_order_created">Manual Order Created</SelectItem>
                    
                    {/* Coupon Management */}
                    <SelectItem value="coupon_created">Coupon Created</SelectItem>
                    <SelectItem value="coupon_modified">Coupon Modified</SelectItem>
                    <SelectItem value="coupon_activated">Coupon Activated</SelectItem>
                    <SelectItem value="coupon_deactivated">Coupon Deactivated</SelectItem>
                    <SelectItem value="coupon_deleted">Coupon Deleted</SelectItem>
                    
                    {/* Refund Management */}
                    <SelectItem value="refund_requested">Refund Requested</SelectItem>
                    <SelectItem value="refund_approved">Refund Approved</SelectItem>
                    <SelectItem value="refund_rejected">Refund Rejected</SelectItem>
                    <SelectItem value="refund_completed">Refund Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {paginatedLogs.length} of {filteredLogs.length} records (Page {currentPage} of {totalPages || 1})
              </p>
              {(searchTerm || roleFilter !== "all" || actionTypeFilter !== "all" || entityTypeFilter !== "all" || warehouseFilter !== "all" || dateRange !== "all") && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSearchTerm("");
                    setRoleFilter("all");
                    setActionTypeFilter("all");
                    setEntityTypeFilter("all");
                    setWarehouseFilter("all");
                    setDateRange("all");
                    setCustomStartDate(undefined);
                    setCustomEndDate(undefined);
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Table View */}
          {viewMode === "table" && (
            <>
              <div className="border rounded-lg overflow-x-auto">
                <Table className="min-w-[1120px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center w-[160px]">Timestamp</TableHead>
                      <TableHead className="text-center w-[180px]">Action</TableHead>
                      <TableHead className="text-center w-[180px]">Performed By</TableHead>
                      <TableHead className="text-center w-[200px]">Entity</TableHead>
                      <TableHead className="text-center w-[120px]">Warehouse</TableHead>
                      <TableHead className="text-center w-[160px]">IP / Device</TableHead>
                      <TableHead className="text-center w-[120px]">Changes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No audit logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedLogs.map((log) => (
                        <TableRow 
                          key={log.id}
                          className={isCriticalAction(log.actionType as AuditActionType) ? "bg-destructive/5 hover:bg-destructive/10" : ""}
                        >
                          <TableCell className="text-center w-[160px]">
                            <Dialog>
                              <DialogTrigger asChild>
                                <button 
                                  className="text-sm hover:underline cursor-pointer"
                                  onClick={() => setSelectedLog(log)}
                                >
                                  <div className="flex items-center gap-2 justify-center">
                                    {isCriticalAction(log.actionType as AuditActionType) && (
                                      <AlertCircle className="h-3 w-3 text-red-600 flex-shrink-0" />
                                    )}
                                    <div>
                                      <p className="whitespace-nowrap">{new Date(log.timestamp).toLocaleDateString()}</p>
                                      <p className="text-muted-foreground whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-w-5xl">
                                <DialogHeader>
                                  <DialogTitle>Audit Log Details</DialogTitle>
                                  <DialogDescription>
                                    Complete information about this action
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedLog && <AuditLogDetails log={selectedLog} />}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                          <TableCell className="text-center w-[180px]">
                            <Badge variant={getActionTypeBadgeVariant(log.actionType)} className="whitespace-nowrap">
                              {getActionTypeDisplayName(log.actionType)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center w-[180px]">
                            <div className="text-sm">
                              <p className="truncate">{log.performedBy.name || log.performedBy.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center w-[200px]">
                            <div className="text-sm">
                              <p className="font-medium whitespace-nowrap">{getEntityTypeDisplayName(log.targetEntity.type)}</p>
                              <p className="text-muted-foreground truncate">{log.targetEntity.name}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center w-[120px]">
                            {log.metadata?.warehouse ? (
                              <Badge variant="outline" className="gap-1 whitespace-nowrap">
                                <Warehouse className="h-3 w-3" />
                                {log.metadata.warehouse.toUpperCase()}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center w-[160px]">
                            <div className="text-sm">
                              {log.ipAddress && (
                                <div className="flex items-center gap-1 justify-center">
                                  <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  <p className="font-mono text-xs whitespace-nowrap">{log.ipAddress}</p>
                                </div>
                              )}
                              {log.deviceInfo?.browser && (
                                <div className="flex items-center gap-1 justify-center">
                                  <MonitorSmartphone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  <p className="text-xs text-muted-foreground truncate">{log.deviceInfo.browser}</p>
                                </div>
                              )}
                              {!log.ipAddress && !log.deviceInfo?.browser && (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center w-[120px]">
                            {log.changes && log.changes.length > 0 ? (
                              <div className="text-sm">
                                <p className="text-muted-foreground whitespace-nowrap">
                                  {log.changes.length} field{log.changes.length > 1 ? "s" : ""} changed
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">—</p>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Timeline View */}
          {viewMode === "timeline" && (
            <div className="space-y-4">
              {paginatedLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No audit logs found</p>
              ) : (
                <>
                  <div className="relative">
                    {paginatedLogs.map((log, index) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative pb-8 pl-8"
                      >
                        {/* Timeline line */}
                        {index !== paginatedLogs.length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-border" />
                        )}
                        
                        {/* Timeline dot */}
                        <div className={`absolute left-0 top-2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isCriticalAction(log.actionType as AuditActionType)
                            ? "bg-destructive/10 border-destructive"
                            : "bg-background border-primary"
                        }`}>
                          {isCriticalAction(log.actionType as AuditActionType) ? (
                            <AlertCircle className="h-3 w-3 text-red-600" />
                          ) : (
                            <Clock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>

                        {/* Timeline content */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Card 
                              className={`cursor-pointer hover:shadow-md transition-shadow ${
                                isCriticalAction(log.actionType as AuditActionType) ? "border-destructive/30 bg-destructive/5" : ""
                              }`}
                              onClick={() => setSelectedLog(log)}
                            >
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant={getActionTypeBadgeVariant(log.actionType)}>
                                        {getActionTypeDisplayName(log.actionType)}
                                      </Badge>
                                      {log.metadata?.warehouse && (
                                        <Badge variant="outline" className="gap-1">
                                          <Warehouse className="h-3 w-3" />
                                          {log.metadata.warehouse.toUpperCase()}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm mb-1">
                                      <span className="font-medium">{log.performedBy.name || log.performedBy.email}</span>
                                      {" "}performed action on{" "}
                                      <span className="font-medium">{log.targetEntity.name}</span>
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(log.timestamp).toLocaleString()}
                                      </div>
                                      {log.ipAddress && (
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          {log.ipAddress}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <Badge variant={getRoleBadgeVariant(log.performedBy.role)}>
                                    {getRoleIcon(log.performedBy.role)}
                                    <span className="ml-1">{log.performedBy.role}</span>
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          </DialogTrigger>
                          <DialogContent className="max-w-5xl">
                            <DialogHeader>
                              <DialogTitle>Audit Log Details</DialogTitle>
                              <DialogDescription>
                                Complete information about this action
                              </DialogDescription>
                            </DialogHeader>
                            {selectedLog && <AuditLogDetails log={selectedLog} />}
                          </DialogContent>
                        </Dialog>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination Controls for Timeline */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Audit Log Details Component
function AuditLogDetails({ log }: { log: AuditLogEntry }) {
  const relatedActions = getRelatedActions(log.targetEntity.type, log.targetEntity.id);
  const isCritical = isCriticalAction(log.actionType as AuditActionType);

  return (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
      {/* Critical Action Warning */}
      {isCritical && (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="pt-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Critical Action</p>
              <p className="text-sm text-red-700">This action has been flagged as high-risk and requires special attention.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Log ID</p>
              <p className="font-mono text-xs">{log.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Timestamp</p>
              <p className="text-xs">{new Date(log.timestamp).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Action Type</p>
              <Badge variant="default" className="text-xs">{getActionTypeDisplayName(log.actionType)}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performed By */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Performed By</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">User ID</p>
              <p className="font-mono text-xs">{log.performedBy.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-xs">{log.performedBy.email}</p>
            </div>
            {log.performedBy.name && (
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-xs">{log.performedBy.name}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Target Entity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Target Entity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Entity Type</p>
              <Badge variant="outline" className="text-xs">{getEntityTypeDisplayName(log.targetEntity.type)}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Entity ID</p>
              <p className="font-mono text-xs">{log.targetEntity.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Entity Name</p>
              <p className="text-xs">{log.targetEntity.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IP Address & Device Info */}
      {(log.ipAddress || log.deviceInfo) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Connection Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-4 gap-3">
              {log.ipAddress && (
                <div>
                  <p className="text-xs text-muted-foreground">IP Address</p>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <p className="font-mono text-xs">{log.ipAddress}</p>
                  </div>
                </div>
              )}
              {log.deviceInfo?.browser && (
                <div>
                  <p className="text-xs text-muted-foreground">Browser</p>
                  <p className="text-xs">{log.deviceInfo.browser}</p>
                </div>
              )}
              {log.deviceInfo?.os && (
                <div>
                  <p className="text-xs text-muted-foreground">OS</p>
                  <p className="text-xs">{log.deviceInfo.os}</p>
                </div>
              )}
              {log.deviceInfo?.device && (
                <div>
                  <p className="text-xs text-muted-foreground">Device</p>
                  <p className="text-xs">{log.deviceInfo.device}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Changes */}
      {log.changes && log.changes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Changes Made</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {log.changes.map((change, index) => (
                <div key={index} className="p-2 border rounded-lg">
                  <p className="text-xs font-medium mb-1">{change.field}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Old Value</p>
                      <p className="font-mono text-xs bg-destructive/10 p-1.5 rounded">{change.oldValue}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">New Value</p>
                      <p className="font-mono text-xs bg-accent/20 p-1.5 rounded">{change.newValue}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      {log.metadata && Object.keys(log.metadata).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {log.metadata.warehouse && (
                <div>
                  <p className="text-xs text-muted-foreground">Warehouse</p>
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Warehouse className="h-3 w-3" />
                    {log.metadata.warehouse.toUpperCase()}
                  </Badge>
                </div>
              )}
              {log.metadata.orderNumber && (
                <div>
                  <p className="text-xs text-muted-foreground">Order Number</p>
                  <p className="font-mono text-xs">{log.metadata.orderNumber}</p>
                </div>
              )}
              {log.metadata.productSku && (
                <div>
                  <p className="text-xs text-muted-foreground">Product SKU</p>
                  <p className="font-mono text-xs">{log.metadata.productSku}</p>
                </div>
              )}
              {log.metadata.couponCode && (
                <div>
                  <p className="text-xs text-muted-foreground">Coupon Code</p>
                  <p className="font-mono text-xs">{log.metadata.couponCode}</p>
                </div>
              )}
              {log.metadata.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-xs">{log.metadata.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Actions */}
      {relatedActions.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Related Actions ({relatedActions.length - 1} other)</CardTitle>
            <CardDescription className="text-xs">All actions performed on this {log.targetEntity.type}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {relatedActions
                .filter(a => a.id !== log.id)
                .slice(0, 10)
                .map((relatedLog) => (
                  <div key={relatedLog.id} className="flex items-center justify-between p-1.5 border rounded hover:bg-secondary/30">
                    <div className="flex items-center gap-2">
                      <Badge variant={relatedLog.actionType.includes("deleted") || relatedLog.actionType.includes("cancelled") ? "destructive" : "secondary"} className="text-xs">
                        {getActionTypeDisplayName(relatedLog.actionType)}
                      </Badge>
                      <span className="text-xs">{relatedLog.performedBy.name || relatedLog.performedBy.email}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(relatedLog.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              {relatedActions.length > 11 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  And {relatedActions.length - 11} more actions...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
