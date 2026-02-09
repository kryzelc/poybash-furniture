// @ts-nocheck
// TODO: Fix type errors for Order interface
'use client';

import { useState, useMemo } from 'react';
import { hasPermission, type Role } from '../../lib/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Search, Package, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, Receipt, Shield, QrCode, Eye, Filter } from 'lucide-react';
import { toast } from 'sonner';
import type { Order } from '@/models';
import { products as staticProducts } from '../../lib/products'; // Using static data for reference
import { ManualRefundDialog } from './ManualRefundDialog';
import { Separator } from '../ui/separator';
import { QRCodeSVG } from 'qrcode.react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { InvoiceReceipt } from '../InvoiceReceipt';

interface OrderManagementProps {
  orders: any[]; // TODO: Use Order type from models
  onUpdateOrderStatus: (orderId: string, status: any) => void;
  onCancelOrder: (orderId: string, canceledBy: 'customer' | 'admin') => void;
  onProcessRefund: (orderId: string, refundData: {
    refundMethod: 'gcash' | 'bank' | 'cash';
    refundAmount: number;
    refundReason: string;
    refundProof?: string;
    adminNotes?: string;
    itemsRefunded?: number[];
  }) => void;
  initialFilter?: string;
}

export function OrderManagement({ orders = [], onUpdateOrderStatus, onCancelOrder, onProcessRefund, initialFilter = 'all' }: OrderManagementProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>(initialFilter);
  const [manualOrderLookup, setManualOrderLookup] = useState('');
  const [showFilterPopover, setShowFilterPopover] = useState(false);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, order) => sum + order.total, 0);
    
    const pendingOrders = orders.filter(o => o.status === 'pending' && !o.isReservation).length;
    const processingOrders = orders.filter(o => o.status === 'processing' && !o.isReservation).length;
    const readyOrders = orders.filter(o => o.status === 'ready-for-pickup').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const customerCancelledOrders = orders.filter(o => o.status === 'cancelled' && o.canceledBy === 'customer').length;
    const adminCancelledOrders = orders.filter(o => o.status === 'cancelled' && o.canceledBy === 'admin').length;
    const refundRequests = orders.filter(o => 
      o.status === 'refund-requested' || o.items.some(item => item.refundRequested && item.refundStatus === 'pending')
    ).length;
    const completedRefunds = orders.filter(o => o.refundDetails || o.status === 'refunded').length;
    const reservedOrders = orders.filter(o => 
      (o.isReservation || o.status === 'reserved') && 
      !['cancelled', 'refunded', 'completed'].includes(o.status)
    ).length;

    return {
      totalRevenue,
      totalOrders: orders.length,
      pendingOrders,
      processingOrders,
      readyOrders,
      completedOrders,
      customerCancelledOrders,
      adminCancelledOrders,
      refundRequests,
      completedRefunds,
      reservedOrders,
    };
  }, [orders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === 'all') return orders;
    if (orderStatusFilter === 'refund-requests') {
      return orders.filter(order => 
        (order.status === 'refund-requested' || order.items.some(item => item.refundRequested && item.refundStatus === 'pending')) &&
        !order.refundDetails // Exclude already processed refunds
      );
    }
    if (orderStatusFilter === 'completed-refunds') {
      return orders.filter(order => order.refundDetails || order.status === 'refunded');
    }
    if (orderStatusFilter === 'customer-cancelled') {
      return orders.filter(order => order.status === 'cancelled' && order.canceledBy === 'customer');
    }
    if (orderStatusFilter === 'admin-cancelled') {
      return orders.filter(order => order.status === 'cancelled' && order.canceledBy === 'admin');
    }
    if (orderStatusFilter === 'reserved') {
      return orders.filter(order => 
        (order.isReservation || order.status === 'reserved') && 
        !['cancelled', 'refunded', 'completed'].includes(order.status)
      );
    }
    return orders.filter(order => order.status === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  const getStatusBadge = (status: Order['status'], isReservation?: boolean) => {
    // Only show "Reserved" badge if this is a reservation order AND status is still pending/reserved
    // Once it moves to processing or beyond, show the actual status badge
    if (isReservation && ['pending', 'reserved'].includes(status)) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 w-fit text-purple-500">
          <Clock className="h-3 w-3" />
          RESERVED
        </Badge>
      );
    }

    const variants: Record<Order['status'], { variant: string; icon: any; color: string }> = {
      'pending': { variant: 'secondary', icon: Clock, color: 'text-orange-500' },
      'reserved': { variant: 'secondary', icon: Clock, color: 'text-purple-500' },
      'processing': { variant: 'default', icon: Package, color: 'text-blue-500' },
      'ready-for-pickup': { variant: 'default', icon: CheckCircle, color: 'text-green-500' },
      'completed': { variant: 'default', icon: CheckCircle, color: 'text-green-700' },
      'cancelled': { variant: 'destructive', icon: XCircle, color: 'text-red-500' },
      'refund-requested': { variant: 'secondary', icon: AlertCircle, color: 'text-purple-500' },
      'refunded': { variant: 'secondary', icon: AlertCircle, color: 'text-purple-700' },
    };

    const { icon: Icon, color } = variants[status] || variants['pending'];
    
    return (
      <Badge variant="outline" className={`flex items-center gap-1 w-fit ${color}`}>
        <Icon className="h-3 w-3" />
        {status.replace('-', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Manual Order Lookup */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Order Lookup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualOrderLookup}
              onChange={(e) => setManualOrderLookup(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const order = orders.find(o => o.id === manualOrderLookup.trim());
                  if (order) {
                    setSelectedOrder(order);
                    setManualOrderLookup('');
                  } else {
                    toast.error(`No order found with ID: ${manualOrderLookup}`);
                  }
                }
              }}
              placeholder="Enter Order ID (e.g., ORD-123456)"
              className="flex-1 px-3 py-2 border border-primary/20 rounded-md bg-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
            <Button onClick={() => {
              const order = orders.find(o => o.id === manualOrderLookup.trim());
              if (order) {
                setSelectedOrder(order);
                setManualOrderLookup('');
              } else {
                toast.error(`No order found with ID: ${manualOrderLookup}`);
              }
            }}
            className="px-3 h-auto py-2"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for Manual Lookup Order */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              View and manage order details
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <OrderDetailsView 
              order={selectedOrder} 
              onUpdateStatus={(status) => {
                if (status === 'cancelled') {
                  onCancelOrder(selectedOrder.id, 'admin');
                } else {
                  onUpdateOrderStatus(selectedOrder.id, status);
                }
                // Add delay before closing dialog to allow Figma design capture
                setTimeout(() => {
                  setSelectedOrder(null);
                }, 2000);
              }}
              onCancelOrder={onCancelOrder}
              onProcessRefund={onProcessRefund}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-primary">{stats.totalOrders}</div>
            <p className="text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-primary">{stats.pendingOrders}</div>
            <p className="text-muted-foreground">Needs review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Processing</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-primary">{stats.processingOrders}</div>
            <p className="text-muted-foreground">Being prepared</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Ready</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-primary">{stats.readyOrders}</div>
            <p className="text-muted-foreground">For pickup</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Refunds</CardTitle>
            <AlertCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-primary">{stats.refundRequests}</div>
            <p className="text-muted-foreground">Pending review</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>Manage and track customer orders</CardDescription>
            </div>
            <Popover open={showFilterPopover} onOpenChange={setShowFilterPopover}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-between">
                  {orderStatusFilter === 'all' && `All Orders (${orders.length})`}
                  {orderStatusFilter === 'pending' && `Pending (${stats.pendingOrders})`}
                  {orderStatusFilter === 'reserved' && `Reserved (${stats.reservedOrders})`}
                  {orderStatusFilter === 'processing' && `Processing (${stats.processingOrders})`}
                  {orderStatusFilter === 'ready-for-pickup' && `Ready for Pickup (${stats.readyOrders})`}
                  {orderStatusFilter === 'completed' && `Completed (${stats.completedOrders})`}
                  {orderStatusFilter === 'cancelled' && 'Cancelled (All)'}
                  {orderStatusFilter === 'customer-cancelled' && `Customer Cancelled (${stats.customerCancelledOrders})`}
                  {orderStatusFilter === 'admin-cancelled' && `Admin Cancelled (${stats.adminCancelledOrders})`}
                  {orderStatusFilter === 'refund-requests' && `Refund Requests (${stats.refundRequests})`}
                  {orderStatusFilter === 'completed-refunds' && `Completed Refunds (${stats.completedRefunds})`}
                  <Filter className="h-4 w-4 ml-2 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="end">
                <div className="space-y-1">
                  {/* Header */}
                  <div className="p-3 border-b">
                    <p className="text-sm font-medium">Filter Orders</p>
                  </div>
                  
                  {/* Filter Options */}
                  <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
                    <Button
                      variant={orderStatusFilter === 'all' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => {
                        setOrderStatusFilter('all');
                        setShowFilterPopover(false);
                      }}
                    >
                      All Orders ({orders.length})
                    </Button>
                    <Button
                      variant={orderStatusFilter === 'pending' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => {
                        setOrderStatusFilter('pending');
                        setShowFilterPopover(false);
                      }}
                    >
                      Pending ({stats.pendingOrders})
                    </Button>
                    <Button
                      variant={orderStatusFilter === 'reserved' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => {
                        setOrderStatusFilter('reserved');
                        setShowFilterPopover(false);
                      }}
                    >
                      Reserved ({stats.reservedOrders})
                    </Button>
                    <Button
                      variant={orderStatusFilter === 'processing' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => {
                        setOrderStatusFilter('processing');
                        setShowFilterPopover(false);
                      }}
                    >
                      Processing ({stats.processingOrders})
                    </Button>
                    <Button
                      variant={orderStatusFilter === 'ready-for-pickup' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => {
                        setOrderStatusFilter('ready-for-pickup');
                        setShowFilterPopover(false);
                      }}
                    >
                      Ready for Pickup ({stats.readyOrders})
                    </Button>
                    <Button
                      variant={orderStatusFilter === 'completed' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => {
                        setOrderStatusFilter('completed');
                        setShowFilterPopover(false);
                      }}
                    >
                      Completed ({stats.completedOrders})
                    </Button>
                    <Button
                      variant={orderStatusFilter === 'cancelled' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => {
                        setOrderStatusFilter('cancelled');
                        setShowFilterPopover(false);
                      }}
                    >
                      Cancelled (All)
                    </Button>
                    <Button
                      variant={orderStatusFilter === 'customer-cancelled' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => {
                        setOrderStatusFilter('customer-cancelled');
                        setShowFilterPopover(false);
                      }}
                    >
                      Customer Cancelled ({stats.customerCancelledOrders})
                    </Button>
                    <Button
                      variant={orderStatusFilter === 'admin-cancelled' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => {
                        setOrderStatusFilter('admin-cancelled');
                        setShowFilterPopover(false);
                      }}
                    >
                      Admin Cancelled ({stats.adminCancelledOrders})
                    </Button>
                    <Button
                      variant={orderStatusFilter === 'refund-requests' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => {
                        setOrderStatusFilter('refund-requests');
                        setShowFilterPopover(false);
                      }}
                    >
                      Refund Requests ({stats.refundRequests})
                    </Button>
                    <Button
                      variant={orderStatusFilter === 'completed-refunds' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => {
                        setOrderStatusFilter('completed-refunds');
                        setShowFilterPopover(false);
                      }}
                    >
                      Completed Refunds ({stats.completedRefunds})
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Order ID</TableHead>
                <TableHead className="text-center w-[110px]">Date</TableHead>
                <TableHead className="text-center w-[140px]">Customer</TableHead>
                <TableHead className="text-center w-[80px]">Items</TableHead>
                <TableHead className="text-center w-[120px]">Total</TableHead>
                <TableHead className="text-center w-[100px]">Payment</TableHead>
                <TableHead className="text-center w-[120px]">Fulfillment</TableHead>
                <TableHead className="text-center w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="py-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="font-mono text-sm hover:underline cursor-pointer text-left">
                            {order.id}
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Order #{order.id}</DialogTitle>
                            <DialogDescription>
                              Order placed on {new Date(order.createdAt).toLocaleString()}
                            </DialogDescription>
                          </DialogHeader>
                          <OrderDetailsView 
                            order={order} 
                            onUpdateStatus={(status) => {
                              if (status === 'cancelled') {
                                onCancelOrder(order.id, 'admin');
                              } else {
                                onUpdateOrderStatus(order.id, status);
                              }
                            }}
                            onCancelOrder={onCancelOrder}
                            onProcessRefund={onProcessRefund}
                          />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <div className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <div className="text-sm">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</div>
                      <div className="text-muted-foreground text-xs">
                        {order.shippingAddress.city}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-2 text-sm">{order.items.length}</TableCell>
                    <TableCell className="text-center py-2">
                      {order.isReservation && order.reservationFee ? (
                        <div>
                          <div className="text-primary text-sm">₱{order.reservationFee.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.reservationPercentage}% paid
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm">₱{order.total.toFixed(2)}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center py-2 text-sm">
                      {order.paymentMethod === 'cash' ? 'Cash' : order.paymentMethod === 'gcash' ? 'GCash' : 'Bank'}
                      {order.isReservation && <div className="text-xs text-muted-foreground">Partial</div>}
                    </TableCell>
                    <TableCell className="text-center py-2 text-sm">
                      {order.deliveryMethod === 'store-pickup' 
                        ? 'Store Pickup' 
                        : order.deliveryMethod === 'staff-delivery' 
                        ? 'Staff Delivery' 
                        : 'Customer Arranged'}
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <div className="space-y-1 flex flex-col items-center">
                        {/* Show refund-requested status if order has pending refund requests */}
                        {(order.status === 'refund-requested' || order.items.some(item => item.refundRequested && item.refundStatus === 'pending')) && !order.refundDetails ? (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit text-purple-500">
                            <AlertCircle className="h-3 w-3" />
                            REFUND REQUESTED
                          </Badge>
                        ) : order.refundDetails || order.status === 'refunded' ? (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit text-purple-700">
                            <CheckCircle className="h-3 w-3" />
                            REFUNDED
                          </Badge>
                        ) : (
                          getStatusBadge(order.status, order.isReservation)
                        )}
                        {order.status === 'cancelled' && order.canceledBy && (
                          <Badge variant="outline" className="text-xs">
                            By: {order.canceledBy}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Order Details View Component
function OrderDetailsView({ 
  order, 
  onUpdateStatus,
  onCancelOrder,
  onProcessRefund
}: { 
  order: Order; 
  onUpdateStatus: (status: Order['status']) => void;
  onCancelOrder: (orderId: string, canceledBy: 'customer' | 'admin') => void;
  onProcessRefund: (orderId: string, refundData: {
    refundMethod: 'gcash' | 'bank' | 'cash';
    refundAmount: number;
    refundReason: string;
    refundProof?: string;
    adminNotes?: string;
    itemsRefunded?: number[];
  }) => void;
}) {
  const [newStatus, setNewStatus] = useState(
    order.refundDetails 
      ? 'refunded' 
      : (order.isReservation && ['pending', 'reserved'].includes(order.status))
        ? 'reserved'
        : order.status
  );
  const [deliveryStatus, setDeliveryStatus] = useState<'preparing' | 'out-for-delivery' | 'delivered'>(
    order.deliveryStatus || 'preparing'
  );
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  
  // Get user from localStorage to determine role and permissions
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (user?.role || 'customer') as Role;
  
  // Permission checks using RBAC system
  const canProcessRefunds = hasPermission(userRole, 'process:refunds');
  const canUpdateOrderStatus = hasPermission(userRole, 'update:order-status');
  const isAdminOrOwner = userRole === 'admin' || userRole === 'owner';
  
  // Get products to fetch correct images
  const products = getProducts();
  
  // Helper function to get product image
  const getProductImage = (productId: number, fallbackUrl: string) => {
    const product = products.find(p => p.id === productId);
    return product?.imageUrl || fallbackUrl;
  };

  // State Machine: Get available status transitions - FORWARD-ONLY for ALL users
  const getAvailableStatuses = () => {
    const currentStatus = order.status;
    
    // Absolutely locked states - CANNOT be changed through dropdown
    if (currentStatus === 'completed' || currentStatus === 'refunded') {
      return [{ value: currentStatus, label: getStatusLabel(currentStatus), disabled: true }];
    }
    
    let availableStatuses: Array<{ value: Order['status']; label: string; disabled?: boolean }> = [];
    
    // Forward-only progression for ALL users (no going back)
    switch (currentStatus) {
      case 'pending':
        // Regular order starting point
        availableStatuses = [
          { value: 'pending', label: 'Pending - Order received' },
          { value: 'processing', label: 'Processing - Order being prepared' },
          { value: 'cancelled', label: 'Cancelled - Order cancelled' },
        ];
        break;
      case 'reserved':
        // Reservation order starting point
        availableStatuses = [
          { value: 'reserved', label: 'Reserved - Partial payment received' },
          { value: 'processing', label: 'Processing - Order being prepared' },
          { value: 'cancelled', label: 'Cancelled - Order cancelled' },
        ];
        break;
      case 'processing':
        // Can move forward to ready-for-pickup or cancel
        availableStatuses = [
          { value: 'processing', label: 'Processing - Order being prepared' },
          { value: 'ready-for-pickup', label: 'Ready for Pickup - Order ready' },
          { value: 'cancelled', label: 'Cancelled - Order cancelled' },
        ];
        break;
      case 'ready-for-pickup':
        // Can complete or cancel
        availableStatuses = [
          { value: 'ready-for-pickup', label: 'Ready for Pickup - Order ready' },
          { value: 'completed', label: 'Completed - Order completed & paid in full' },
          { value: 'cancelled', label: 'Cancelled - Order cancelled' },
        ];
        break;
      case 'refund-requested':
        // Refund requested - locked until admin processes
        availableStatuses = [
          { value: 'refund-requested', label: 'Refund Requested - Awaiting admin review', disabled: true },
        ];
        break;
      case 'cancelled':
        // Cancelled orders are locked
        availableStatuses = [
          { value: 'cancelled', label: 'Cancelled - Order cancelled', disabled: true },
        ];
        break;
    }
    
    return availableStatuses;
  };

  const getStatusLabel = (status: Order['status']) => {
    const labels: Record<Order['status'], string> = {
      'pending': 'Pending - Order received',
      'reserved': 'Reserved - Partial payment received',
      'processing': 'Processing - Order being prepared',
      'ready-for-pickup': 'Ready for Pickup - Order ready',
      'completed': 'Completed - LOCKED (use Refund Management)',
      'cancelled': 'Cancelled - Order cancelled',
      'refund-requested': 'Refund Requested - Awaiting admin review',
      'refunded': 'Refunded - LOCKED',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-4">
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
        <>
      {/* Compact QR Code Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Pickup QR Code</CardTitle>
            </div>
            <Badge className={getStatusColor(order.refundDetails ? 'refunded' : (order.isReservation && ['pending', 'reserved'].includes(order.status)) ? 'reserved' : order.status)}>
              {order.refundDetails ? 'REFUNDED' : (order.isReservation && ['pending', 'reserved'].includes(order.status)) ? 'RESERVED' : order.status.replace('-', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-center gap-6">
            <div className="p-2 bg-white rounded border">
              <QRCodeSVG 
                value={`POYBASH-ORDER-${order.id}`}
                size={100}
                level="H"
                includeMargin={false}
              />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-xs text-muted-foreground">Order ID</p>
              <p className="font-mono text-sm">{order.id}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Customer presents this QR for pickup verification
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact Customer & Order Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order Information</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {/* Reservation Badge - Only show for active reservation orders */}
          {order.isReservation && !['cancelled', 'refunded', 'completed'].includes(order.status) && (
            <div className="mb-4 p-3 bg-secondary/30 border border-secondary rounded-lg">
              <div className="flex items-center gap-2 text-secondary-foreground">
                <Clock className="h-4 w-4" />
                <span className="font-medium">This is a reservation order</span>
              </div>
              <p className="text-xs text-purple-600 mt-1">
                Customer has paid {order.reservationPercentage}% reservation fee. Balance due upon completion.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Customer</p>
              <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
              <p className="text-xs text-muted-foreground">{order.userEmail}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Customer Phone</p>
              <p>{order.shippingAddress.phone || order.pickupDetails?.pickupPhone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Order Date</p>
              <p>{new Date(order.createdAt).toLocaleDateString()}</p>
              <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Order ID</p>
              <p className="font-mono text-xs">{order.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Delivery Method</p>
              <p>{order.deliveryMethod === 'store-pickup' ? 'Store Pickup' : order.deliveryMethod === 'staff-delivery' ? 'Staff Delivery' : 'Customer Arranged'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payment Method</p>
              <p>{order.paymentMethod === 'cash' ? 'Cash' : order.paymentMethod === 'gcash' ? 'GCash' : 'Bank Transfer'}</p>
            </div>
            {order.deliveryMethod !== 'store-pickup' && (
              <>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Shipping Address</p>
                  <p>{order.shippingAddress.streetAddress || order.shippingAddress.address}, {order.shippingAddress.barangay}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.province || order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                </div>
              </>
            )}
            {order.pickupDetails && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Pickup Person</p>
                  <p>{order.pickupDetails.pickupPerson}</p>
                </div>
                {order.pickupDetails.pickupPhone && order.pickupDetails.pickupPhone !== order.shippingAddress.phone && (
                  <div>
                    <p className="text-xs text-muted-foreground">Pickup Person Phone</p>
                    <p>{order.pickupDetails.pickupPhone}</p>
                  </div>
                )}
                {order.pickupDetails.deliveryService && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Delivery Service</p>
                    <p>{order.pickupDetails.deliveryService}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Verification & Transaction Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Payment Verification & Transaction Details</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {order.paymentMethod === 'cash' 
              ? 'Cash payment - No verification details required' 
              : order.paymentMethod === 'gcash' 
                ? 'GCash payment details and proof' 
                : 'Bank Transfer payment details and proof'}
          </p>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-3">
            {/* Payment Method */}
            <div className="p-3 bg-secondary/20 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Payment Method</p>
              <p className="font-medium">{order.paymentMethod === 'cash' ? 'Cash' : order.paymentMethod === 'gcash' ? 'GCash' : 'Bank Transfer'}</p>
            </div>

            {/* Recipient Information (Paid To) - For GCash/Bank Transfer */}
            {(order.paymentRecipient || order.paymentRecipientName) && (
              <div className="p-3 bg-secondary/20 rounded-lg">
                <div className={order.paymentRecipient && order.paymentRecipientName ? "grid grid-cols-2 gap-4" : ""}>
                  {order.paymentRecipient && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {order.paymentMethod === 'gcash' ? 'GCash Number (Paid To)' : 'Bank Account No. (Paid To)'}
                      </p>
                      <p className="font-mono text-sm">{order.paymentRecipient}</p>
                    </div>
                  )}
                  {order.paymentRecipientName && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Account Holder Name (Paid To)</p>
                      <p className="text-sm">{order.paymentRecipientName}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sender Information (Account Name & No.) */}
            {(order.paymentName || order.paymentPhone) && (
              <div className="p-3 bg-secondary/20 rounded-lg">
                <div className={order.paymentName && order.paymentPhone ? "grid grid-cols-2 gap-4" : ""}>
                  {order.paymentName && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Account Name</p>
                      <p className="text-sm">{order.paymentName}</p>
                    </div>
                  )}
                  {order.paymentPhone && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Account No.</p>
                      <p className="font-mono text-sm">{order.paymentPhone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Reference Number */}
            {order.paymentReference && (
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Payment Reference Number</p>
                <p className="font-mono text-sm">{order.paymentReference}</p>
              </div>
            )}

            {/* Transaction Details - Including Bank Name for Bank Transfers */}
            {order.transactionDetails && (
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Transaction Details {order.paymentMethod === 'bank-transfer' && '(Include Bank Name)'}
                </p>
                <p className="text-sm whitespace-pre-wrap">{order.transactionDetails}</p>
              </div>
            )}

            {/* Payment Proof */}
            {order.paymentProof && (
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Payment Proof Screenshot</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Eye className="h-4 w-4" />
                      Click to View Full Size Image
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-7xl">
                    <DialogHeader>
                      <DialogTitle>Payment Proof - Order #{order.id}</DialogTitle>
                      <DialogDescription>
                        {order.paymentMethod === 'gcash' ? 'GCash' : order.paymentMethod === 'bank-transfer' ? 'Bank Transfer' : 'Payment'} confirmation screenshot
                      </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[70vh] overflow-auto">
                      <img
                        src={order.paymentProof}
                        alt="Payment proof full size"
                        className="w-full h-auto"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Empty State - Only for Cash or when no data */}
            {order.paymentMethod === 'cash' && !order.paymentReference && !order.paymentProof && !order.paymentRecipient && !order.paymentName && !order.paymentPhone && !order.transactionDetails && (
              <div className="text-center py-4 p-3 bg-secondary/20 rounded-lg">
                <p className="text-xs text-muted-foreground">Cash payment - No verification details required</p>
              </div>
            )}
            {order.paymentMethod !== 'cash' && !order.paymentReference && !order.paymentProof && !order.paymentRecipient && !order.paymentName && !order.paymentPhone && !order.transactionDetails && (
              <div className="text-center py-4 p-3 border border-primary/30 bg-primary/10 rounded-lg">
                <p className="text-xs text-primary">⚠️ No payment verification information provided</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>₱{order.subtotal.toFixed(2)}</span>
            </div>
            {order.couponCode && order.couponDiscount && order.couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({order.couponCode}):</span>
                <span>-₱{order.couponDiscount.toFixed(2)}</span>
              </div>
            )}
            {order.deliveryFee !== undefined && order.deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee:</span>
                <span>₱{order.deliveryFee.toFixed(2)}</span>
              </div>
            )}
            {order.reservationFee && order.reservationFee > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reservation Fee Paid:</span>
                  <span className="text-primary">₱{order.reservationFee.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground">({order.reservationPercentage}% of total)</p>
              </>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Total:</span>
              <span className="text-primary">₱{order.total.toFixed(2)}</span>
            </div>
            {order.reservationFee && order.reservationFee > 0 && !['cancelled', 'refunded', 'completed'].includes(order.status) && (
              <div className="flex justify-between text-orange-600 font-medium">
                <span>Balance Due:</span>
                <span>₱{(order.total - order.reservationFee).toFixed(2)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compact Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.items.map((item, index) => (
            <div key={`item-${item.productId}-${item.variantId || item.color}-${index}`} className="flex gap-4 p-3 border rounded-lg">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                <img
                  src={getProductImage(item.productId, item.imageUrl)}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4>{item.name}</h4>
                <p className="text-muted-foreground">{item.color}{item.size ? ` • ${item.size}` : ''}</p>
                <p className="text-muted-foreground">Qty: {item.quantity}</p>
                <p className="text-primary">₱{(item.price * item.quantity).toFixed(2)}</p>
                {item.refundRequested && (
                  <Badge variant="secondary" className="mt-2">
                    Refund Requested: {item.refundStatus}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Refund Request Information - Show pending refund requests */}
      {order.items.some(item => item.refundRequested && item.refundStatus === 'pending') && !order.refundDetails && (
        <Card className="border-secondary bg-secondary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-purple-900">Pending Refund Requests</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.filter(item => item.refundRequested && item.refundStatus === 'pending').map((item, index) => (
                <div key={`refund-${item.productId}-${item.variantId || item.color}-${index}`} className="p-4 bg-white border border-purple-200 rounded-lg">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded overflow-hidden bg-secondary flex-shrink-0">
                      <img
                        src={getProductImage(item.productId, item.imageUrl)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">{item.color}{item.size ? ` • ${item.size}` : ''} • Qty: {item.quantity}</p>
                      <p className="text-sm text-primary mt-1">₱{(item.price * item.quantity).toFixed(2)}</p>
                      {item.refundReason && (
                        <div className="mt-2 p-2 bg-secondary/20 rounded border border-secondary">
                          <p className="text-xs text-muted-foreground mb-0.5">Refund Reason:</p>
                          <p className="text-sm">{item.refundReason}</p>
                        </div>
                      )}
                      {item.refundProof && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1.5">Customer's Evidence/Proof:</p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                                <Eye className="h-3 w-3" />
                                View Customer's Refund Proof
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-7xl">
                              <DialogHeader>
                                <DialogTitle>Customer Refund Evidence - {item.name}</DialogTitle>
                                <DialogDescription>
                                  Proof submitted by customer for refund request
                                </DialogDescription>
                              </DialogHeader>
                              <div className="max-h-[70vh] overflow-auto">
                                <img
                                  src={item.refundProof}
                                  alt="Customer refund proof"
                                  className="w-full h-auto"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                      <Badge className="mt-2 bg-secondary/40 text-secondary-foreground border-secondary">
                        Status: {item.refundStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-3">
                  {canProcessRefunds
                    ? 'Review the refund request(s) and evidence provided by the customer, then process the refund below.' 
                    : 'Refund request submitted. Awaiting approval.'}
                </p>
                {canProcessRefunds && (
                  <Button 
                    variant="default" 
                    onClick={() => setShowRefundDialog(true)}
                    className="w-full"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Process Refund Request
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refund Information */}
      {(order.status === 'completed' || order.status === 'cancelled') && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Refund Management</CardTitle>
              </div>
              {!order.refundDetails && order.status !== 'refunded' && canProcessRefunds && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowRefundDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Receipt className="h-4 w-4" />
                  Process Refund
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {order.refundDetails ? (
              <div className="space-y-4">
                <div className="p-4 bg-secondary/30 border border-secondary rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-secondary/50 text-secondary-foreground">Refund Processed</Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(order.refundDetails.processedAt).toLocaleString()}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Refund Amount</p>
                      <p className="text-primary">₱{order.refundDetails.refundAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Refund Method</p>
                      <p className="capitalize">{order.refundDetails.refundMethod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Processed By</p>
                      <p>{order.refundDetails.processedByName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p>
                        {!order.refundDetails.itemsRefunded || order.refundDetails.itemsRefunded.length === 0 
                          ? 'Full Order Refund' 
                          : `Partial (${order.refundDetails.itemsRefunded.length} items)`
                        }
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Refund Reason</p>
                    <p className="text-sm">{order.refundDetails.refundReason}</p>
                  </div>
                  
                  {order.refundDetails.adminNotes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Admin Notes (Internal)</p>
                        <p className="text-sm italic">{order.refundDetails.adminNotes}</p>
                      </div>
                    </>
                  )}
                  
                  {order.refundDetails.refundProof && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Refund Proof</p>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full justify-start gap-2">
                              <Eye className="h-4 w-4" />
                              Click to View Refund Receipt/Proof
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-7xl">
                            <DialogHeader>
                              <DialogTitle>Refund Proof - Order #{order.id}</DialogTitle>
                              <DialogDescription>
                                Refund processed on {new Date(order.refundDetails.processedAt).toLocaleString()}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="max-h-[70vh] overflow-auto">
                              <img
                                src={order.refundDetails.refundProof}
                                alt="Refund proof full size"
                                className="w-full h-auto"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No refund processed for this order</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual Refund Dialog */}
      <ManualRefundDialog
        order={order}
        open={showRefundDialog}
        onOpenChange={setShowRefundDialog}
        onProcessRefund={(refundData) => {
          onProcessRefund(order.id, refundData);
          toast.success('Refund processed successfully', {
            description: 'Refund has been recorded with full audit trail.',
          });
        }}
      />

      {/* Status Update - Only for users with update permissions */}
      {canUpdateOrderStatus && (
      <Card>
        <CardHeader>
          <CardTitle>Update Order Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orderStatus">
              Current Status: {order.refundDetails ? 'REFUNDED' : (order.isReservation && ['pending', 'reserved'].includes(order.status)) ? 'RESERVED' : order.status.replace('-', ' ').toUpperCase()}
            </Label>
            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as Order['status'])}>
              <SelectTrigger id="orderStatus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getAvailableStatuses().map(status => (
                  <SelectItem key={status.value} value={status.value} disabled={status.disabled}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Delivery Status Update - Only for staff-delivery orders */}
          {order.deliveryMethod === 'staff-delivery' && (
            <div className="space-y-2">
              <Label htmlFor="deliveryStatus">
                Delivery Status: {deliveryStatus ? deliveryStatus.replace('-', ' ').toUpperCase() : 'N/A'}
              </Label>
              <Select value={deliveryStatus} onValueChange={(value: any) => setDeliveryStatus(value)}>
                <SelectTrigger id="deliveryStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preparing">📦 Preparing - Order is being prepared</SelectItem>
                  <SelectItem value="out-for-delivery">🚚 Out for Delivery - Order is on the way</SelectItem>
                  <SelectItem value="delivered">✅ Delivered - Order has been delivered</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Update delivery tracking status for this Facebook order
              </p>
            </div>
          )}

          <Button 
            className="w-full" 
            onClick={() => {
              // First update the order status through proper channels
              onUpdateStatus(newStatus);
              
              // IMPORTANT: Don't directly modify localStorage here as it causes race conditions
              // The delivery status update should go through the proper update mechanism
              // For now, delivery status is separate and handled by the parent component
            }}
            disabled={newStatus === order.status && (!order.deliveryMethod || order.deliveryMethod !== 'staff-delivery' || deliveryStatus === order.deliveryStatus)}
          >
            Update Order Status
          </Button>
        </CardContent>
      </Card>
      )}
        </>
      )}
      
      {/* Footer Spacing */}
      <div className="h-24" />
    </div>
  );
}

// Helper function to get status color
function getStatusColor(status: Order['status']) {
  const colors: Record<Order['status'], string> = {
    'pending': 'bg-primary/15 text-primary',
    'reserved': 'bg-secondary/50 text-secondary-foreground',
    'processing': 'bg-muted/40 text-muted-foreground',
    'ready-for-pickup': 'bg-accent/30 text-accent-foreground',
    'completed': 'bg-accent/40 text-accent-foreground',
    'cancelled': 'bg-destructive/20 text-destructive',
    'refund-requested': 'bg-secondary/50 text-secondary-foreground',
    'refunded': 'bg-muted/50 text-muted-foreground',
  };

  return colors[status] || 'bg-muted/30 text-muted-foreground';
}