'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { toast } from 'sonner';
import type { Order } from '../../contexts/AuthContext';
import type { Product as ProductType } from '../../lib/products';
import { getPriceRangeText } from '../../lib/productUtils';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  TrendingUp, 
  Eye,
  Package
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesDashboardProps {
  orders: Order[];
  products: ProductType[];
  onViewOrder: (order: Order) => void;
  onQuickFilter: (tab: string, filter: string) => void;
}

export function SalesDashboard({ orders, products, onViewOrder, onQuickFilter }: SalesDashboardProps) {
  // Calculate sales-specific statistics
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const processingOrders = orders.filter(o => o.status === 'processing').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const refundRequests = orders.filter(o => 
      o.items.some(item => item.refundRequested && item.refundStatus === 'pending')
    ).length;

    // Get total customers
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const customers = users.filter((u: any) => u.role === 'customer');
    
    // Get new customers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newCustomers = customers.filter((c: any) => 
      c.createdAt && new Date(c.createdAt) >= thirtyDaysAgo
    ).length;

    // Calculate daily data for last 7 days
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= date && orderDate < nextDate;
      });
      
      const dayPending = dayOrders.filter(o => o.status === 'pending').length;
      const dayCompleted = dayOrders.filter(o => o.status === 'completed').length;
      const dayTotal = dayOrders.length;
      
      dailyData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        totalOrders: dayTotal,
        pendingOrders: dayPending,
        completedOrders: dayCompleted,
      });
    }
    
    // Calculate top selling products by quantity
    const productSales: Record<number, { product: ProductType; quantity: number }> = {};
    orders.filter(o => o.status === 'completed').forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          if (!productSales[item.productId]) {
            productSales[item.productId] = { product, quantity: 0 };
          }
          productSales[item.productId].quantity += item.quantity;
        }
      });
    });
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Get recent orders (last 10)
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      refundRequests,
      totalCustomers: customers.length,
      newCustomers,
      dailyData,
      topProducts,
      recentOrders,
    };
  }, [orders, products]);

  const getStatusBadge = (status: Order['status']) => {
    const variants: Record<Order['status'], { variant: any; icon: any; color: string }> = {
      'pending': { variant: 'secondary', icon: Clock, color: 'text-[#d2691e]' },
      'processing': { variant: 'default', icon: Package, color: 'text-[#8b4513]' },
      'ready-for-pickup': { variant: 'default', icon: CheckCircle, color: 'text-[#cd853f]' },
      'completed': { variant: 'default', icon: CheckCircle, color: 'text-[#8b4513]' },
      'cancelled': { variant: 'destructive', icon: AlertCircle, color: 'text-destructive' },
      'refund-requested': { variant: 'secondary', icon: AlertCircle, color: 'text-[#d2691e]' },
      'refunded': { variant: 'secondary', icon: AlertCircle, color: 'text-muted-foreground' },
      'reserved': { variant: 'default', icon: Clock, color: 'text-[#cd853f]' },
    };

    const { variant, icon: Icon } = variants[status];
    
    return (
      <Badge variant={variant as any} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status.replace('-', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Metric Cards with Mini Charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Orders Card */}
        <Card 
          className="bg-gradient-to-br from-[#8b4513]/20 to-[#8b4513]/5 border-[#8b4513]/30 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onQuickFilter('orders', 'all')}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-muted-foreground text-sm mb-1">TOTAL ORDERS</p>
                <p className="text-3xl">{stats.totalOrders}</p>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </div>
              <div className="p-3 bg-[#8b4513]/20 rounded-full">
                <ShoppingCart className="h-6 w-6 text-[#8b4513]" />
              </div>
            </div>
            <div className="h-16 w-full min-h-[64px]">
              <ResponsiveContainer width="100%" height={64} minWidth={0}>
                <LineChart data={stats.dailyData}>
                  <Line type="monotone" dataKey="totalOrders" stroke="#8b4513" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pending Orders Card */}
        <Card 
          className="bg-gradient-to-br from-[#d2691e]/20 to-[#d2691e]/5 border-[#d2691e]/30 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onQuickFilter('orders', 'pending')}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-muted-foreground text-sm mb-1">PENDING ORDERS</p>
                <p className="text-3xl">{stats.pendingOrders}</p>
                <p className="text-xs text-muted-foreground mt-1">Awaiting processing</p>
              </div>
              <div className="p-3 bg-[#d2691e]/20 rounded-full">
                <Clock className="h-6 w-6 text-[#d2691e]" />
              </div>
            </div>
            <div className="h-16 w-full min-h-[64px]">
              <ResponsiveContainer width="100%" height={64} minWidth={0}>
                <LineChart data={stats.dailyData}>
                  <Line type="monotone" dataKey="pendingOrders" stroke="#d2691e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Completed Orders Card */}
        <Card 
          className="bg-gradient-to-br from-[#cd853f]/20 to-[#cd853f]/5 border-[#cd853f]/30 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onQuickFilter('orders', 'completed')}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-muted-foreground text-sm mb-1">COMPLETED ORDERS</p>
                <p className="text-3xl">{stats.completedOrders}</p>
                <p className="text-xs text-muted-foreground mt-1">Successfully fulfilled</p>
              </div>
              <div className="p-3 bg-[#cd853f]/20 rounded-full">
                <CheckCircle className="h-6 w-6 text-[#cd853f]" />
              </div>
            </div>
            <div className="h-16 w-full min-h-[64px]">
              <ResponsiveContainer width="100%" height={64} minWidth={0}>
                <LineChart data={stats.dailyData}>
                  <Line type="monotone" dataKey="completedOrders" stroke="#cd853f" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Refund Requests Card */}
        <Card 
          className="bg-gradient-to-br from-[#deb887]/20 to-[#deb887]/5 border-[#deb887]/30 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onQuickFilter('orders', 'refund-requested')}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-muted-foreground text-sm mb-1">REFUND REQUESTS</p>
                <p className="text-3xl">{stats.refundRequests}</p>
                <p className="text-xs text-muted-foreground mt-1">Pending approval</p>
              </div>
              <div className="p-3 bg-[#deb887]/20 rounded-full">
                <AlertCircle className="h-6 w-6 text-[#deb887]" />
              </div>
            </div>
            <div className="h-16 w-full min-h-[64px]">
              <ResponsiveContainer width="100%" height={64} minWidth={0}>
                <LineChart data={stats.dailyData}>
                  <Line type="monotone" dataKey="pendingOrders" stroke="#deb887" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Order Activity</CardTitle>
            <CardDescription>Order trends over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 min-h-[320px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                <BarChart data={stats.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="totalOrders" fill="#8b4513" radius={[4, 4, 0, 0]} name="Total Orders" />
                  <Bar dataKey="completedOrders" fill="#cd853f" radius={[4, 4, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Most Popular Products</CardTitle>
            <CardDescription>Best selling furniture by units sold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topProducts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No sales data available</p>
              ) : (
                stats.topProducts.map((item, index) => (
                  <div key={item.product.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                      <img
                        src={item.product.images[0] || ''}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.product.category} • ₱{item.product.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#8b4513]">{item.quantity}</p>
                      <p className="text-xs text-muted-foreground">units sold</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Stats & Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Stats</CardTitle>
            <CardDescription>Customer base overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#8b4513]/20 rounded-full">
                  <Users className="h-5 w-5 text-[#8b4513]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                  <p className="text-2xl">{stats.totalCustomers}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#cd853f]/20 rounded-full">
                  <TrendingUp className="h-5 w-5 text-[#cd853f]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New (30 days)</p>
                  <p className="text-2xl">{stats.newCustomers}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No orders yet</p>
              ) : (
                stats.recentOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer"
                    onClick={() => onViewOrder(order)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-secondary rounded-lg">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm">Order #{order.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.shippingAddress.firstName} {order.shippingAddress.lastName} • {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center min-w-[120px] shrink-0 px-4">
                      <p className="text-sm whitespace-nowrap">₱{order.total.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center justify-end flex-1">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">ORDER STATUS</p>
                        {getStatusBadge(order.refundDetails ? 'refunded' : order.status)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}