// @ts-nocheck
// TODO: Fix type mismatches between AuditTrail component and AuditLogEntry interface
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Trash2, User, Package, ShoppingCart, Warehouse, FileText, Shield, Filter } from 'lucide-react';
import { getAuditLogs, clearAuditLogs, type AuditLogEntry } from '../../lib/auditLog';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

export function AuditTrail() {
  const { user: currentUser } = useAuth();
  const isOwner = currentUser?.role === 'owner';
  
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [, setRefresh] = useState(0);
  const [showEntityFilterPopover, setShowEntityFilterPopover] = useState(false);
  const [showDateFilterPopover, setShowDateFilterPopover] = useState(false);

  const refreshLogs = () => {
    setAuditLogs(getAuditLogs());
    setRefresh(prev => prev + 1);
  };

  // Auto-refresh logs every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const latestLogs = getAuditLogs();
      if (latestLogs.length !== auditLogs.length) {
        setAuditLogs(latestLogs);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [auditLogs.length]);

  const handleClearLogs = () => {
    if (!isOwner) {
      toast.error('Only owners can clear audit logs');
      return;
    }
    
    if (confirm('Are you sure you want to clear all audit logs? This action cannot be undone.')) {
      clearAuditLogs();
      refreshLogs();
      toast.success('Audit logs cleared');
    }
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    let filtered = auditLogs;

    // Entity type filter
    if (entityFilter !== 'all') {
      filtered = filtered.filter(log => log.targetEntity.type === entityFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(log => new Date(log.timestamp) >= filterDate);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.performedBy.email.toLowerCase().includes(term) ||
        (log.performedBy.name || '').toLowerCase().includes(term) ||
        log.actionType.toLowerCase().includes(term) ||
        log.targetEntity.name.toLowerCase().includes(term) ||
        log.targetEntity.id.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [auditLogs, entityFilter, dateFilter, searchTerm]);

  const getEntityIcon = (entityType: AuditLogEntry['targetEntity']['type']) => {
    switch (entityType) {
      case 'product':
        return <Package className="h-4 w-4" />;
      case 'order':
        return <ShoppingCart className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      case 'inventory':
        return <Warehouse className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    if (action.toLowerCase().includes('create') || action.toLowerCase().includes('add')) {
      return 'default';
    }
    if (action.toLowerCase().includes('update') || action.toLowerCase().includes('edit')) {
      return 'secondary';
    }
    if (action.toLowerCase().includes('delete') || action.toLowerCase().includes('deactivate')) {
      return 'destructive';
    }
    return 'outline';
  };

  const getEntityFilterLabel = (filter: string) => {
    switch (filter) {
      case 'all': return 'All Types';
      case 'product': return 'Products';
      case 'order': return 'Orders';
      case 'user': return 'Users';
      case 'inventory': return 'Inventory';
      default: return 'All Types';
    }
  };

  const getDateFilterLabel = (filter: string) => {
    switch (filter) {
      case 'all': return 'All Time';
      case 'today': return 'Today';
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last 30 Days';
      default: return 'All Time';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Audit Trail</CardTitle>
            <CardDescription>Track all changes and actions in the system</CardDescription>
          </div>
          {isOwner && (
            <Button variant="outline" onClick={handleClearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Logs
            </Button>
          )}
        </div>
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <Input
              placeholder="Search by user, action, or entity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Popover open={showEntityFilterPopover} onOpenChange={setShowEntityFilterPopover}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[180px] justify-between">
                {getEntityFilterLabel(entityFilter)}
                <Filter className="h-4 w-4 ml-2 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[286px] p-0" align="start">
              <div className="space-y-1">
                <div className="p-3 border-b">
                  <p className="text-sm font-medium">Filter by Type</p>
                </div>
                <div className="p-2 space-y-1">
                  <Button
                    variant={entityFilter === 'all' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setEntityFilter('all')}
                  >
                    All Types
                  </Button>
                  <Button
                    variant={entityFilter === 'product' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setEntityFilter('product')}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Products
                  </Button>
                  <Button
                    variant={entityFilter === 'order' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setEntityFilter('order')}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Orders
                  </Button>
                  <Button
                    variant={entityFilter === 'user' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setEntityFilter('user')}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Users
                  </Button>
                  <Button
                    variant={entityFilter === 'inventory' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setEntityFilter('inventory')}
                  >
                    <Warehouse className="h-4 w-4 mr-2" />
                    Inventory
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Popover open={showDateFilterPopover} onOpenChange={setShowDateFilterPopover}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[180px] justify-between">
                {getDateFilterLabel(dateFilter)}
                <Filter className="h-4 w-4 ml-2 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[286px] p-0" align="start">
              <div className="space-y-1">
                <div className="p-3 border-b">
                  <p className="text-sm font-medium">Filter by Date</p>
                </div>
                <div className="p-2 space-y-1">
                  <Button
                    variant={dateFilter === 'all' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setDateFilter('all')}
                  >
                    All Time
                  </Button>
                  <Button
                    variant={dateFilter === 'today' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setDateFilter('today')}
                  >
                    Today
                  </Button>
                  <Button
                    variant={dateFilter === 'week' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setDateFilter('week')}
                  >
                    Last 7 Days
                  </Button>
                  <Button
                    variant={dateFilter === 'month' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setDateFilter('month')}
                  >
                    Last 30 Days
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {auditLogs.length} logs
        </div>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Timestamp</TableHead>
                <TableHead className="text-center">User</TableHead>
                <TableHead className="text-center">Action</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-center">Entity ID</TableHead>
                <TableHead className="text-center">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-center">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <div>
                        <p className="text-sm">{log.userName}</p>
                        <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2 justify-center">
                        {getEntityIcon(log.entityType)}
                        <span className="capitalize">{log.entityType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-center">{log.entityId}</TableCell>
                    <TableCell className="text-sm max-w-md truncate text-center">
                      {log.description}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
