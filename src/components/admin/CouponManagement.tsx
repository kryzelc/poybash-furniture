'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Pencil, Trash2, Tag, Copy, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CustomDatePicker } from './CustomDatePicker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  getCoupons,
  addCoupon,
  updateCoupon,
  deleteCoupon,
  Coupon,
} from '../../lib/coupons';

export function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>(getCoupons());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [couponToToggle, setCouponToToggle] = useState<{ id: string; code: string; isActive: boolean } | null>(null);
  const [couponForm, setCouponForm] = useState<Partial<Coupon>>({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minPurchase: 0,
    maxDiscount: undefined,
    expiryDate: '',
    usageLimit: 100,
    usedCount: 0,
    isActive: true,
  });

  const refreshCoupons = () => {
    setCoupons(getCoupons());
  };

  const handleOpenDialog = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setCouponForm(coupon);
    } else {
      setEditingCoupon(null);
      setCouponForm({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        minPurchase: 0,
        maxDiscount: undefined,
        expiryDate: '',
        usageLimit: 100,
        usedCount: 0,
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCoupon(null);
    setCouponForm({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      minPurchase: 0,
      maxDiscount: undefined,
      expiryDate: '',
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
    });
  };

  const handleSave = () => {
    // Validation
    if (!couponForm.code || !couponForm.description || !couponForm.expiryDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (couponForm.discountValue! <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    if (couponForm.discountType === 'percentage' && couponForm.discountValue! > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }

    if (couponForm.minPurchase! < 0) {
      toast.error('Minimum purchase cannot be negative');
      return;
    }

    if (couponForm.usageLimit! <= 0) {
      toast.error('Usage limit must be at least 1');
      return;
    }

    try {
      if (editingCoupon) {
        // Update existing coupon
        updateCoupon(editingCoupon.id, couponForm);
        toast.success('Coupon updated successfully');
      } else {
        // Add new coupon
        addCoupon(couponForm as Omit<Coupon, 'id' | 'createdAt'>);
        toast.success('Coupon created successfully');
      }
      refreshCoupons();
      handleCloseDialog();
    } catch (error) {
      toast.error('Failed to save coupon');
    }
  };

  const handleToggleActive = (id: string, code: string, currentStatus: boolean) => {
    setCouponToToggle({ id, code, isActive: currentStatus });
    setShowStatusDialog(true);
  };

  const confirmToggleActive = () => {
    if (!couponToToggle) return;
    
    const { id, isActive } = couponToToggle;
    
    updateCoupon(id, { isActive: !isActive });
    toast.success(`Coupon ${isActive ? 'deactivated' : 'activated'} successfully`);
    refreshCoupons();
    
    setShowStatusDialog(false);
    setCouponToToggle(null);
    refreshCoupons();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Coupon code copied to clipboard');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const filteredCoupons = coupons.filter((coupon) => {
    if (statusFilter === 'active') return coupon.isActive && !isExpired(coupon.expiryDate);
    if (statusFilter === 'inactive') return !coupon.isActive || isExpired(coupon.expiryDate);
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Coupon Management</h2>
          <p className="text-muted-foreground">Create and manage discount coupons for customers</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              {editingCoupon ? 'Save Changes' : 'Create Coupon'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
              <DialogDescription>
                {editingCoupon ? 'Update coupon details and settings' : 'Set up a new discount coupon for customers'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Coupon Code *</Label>
                  <Input
                    id="code"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                    placeholder="SAVE20"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountType">Discount Type *</Label>
                  <Select
                    value={couponForm.discountType}
                    onValueChange={(value: 'percentage' | 'fixed') => setCouponForm({ ...couponForm, discountType: value })}
                  >
                    <SelectTrigger id="discountType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₱)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  placeholder="Get 20% off on all items"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    {couponForm.discountType === 'percentage' ? 'Discount (%) *' : 'Discount Amount (₱) *'}
                  </Label>
                  <Input
                    id="discountValue"
                    value={couponForm.discountValue || ''}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: parseFloat(e.target.value) || 0 })}
                    placeholder={couponForm.discountType === 'percentage' ? '20' : '500'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minPurchase">Minimum Purchase (₱) *</Label>
                  <Input
                    id="minPurchase"
                    value={couponForm.minPurchase || ''}
                    onChange={(e) => setCouponForm({ ...couponForm, minPurchase: parseFloat(e.target.value) || 0 })}
                    placeholder="1000"
                  />
                </div>
              </div>

              {couponForm.discountType === 'percentage' && (
                <div className="space-y-2">
                  <Label htmlFor="maxDiscount">Maximum Discount (₱) (Optional)</Label>
                  <Input
                    id="maxDiscount"
                    value={couponForm.maxDiscount || ''}
                    onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="500"
                  />
                  <p className="text-xs text-muted-foreground">Leave empty for no limit</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {couponForm.expiryDate ? (
                          <span>
                            {new Date(couponForm.expiryDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Select expiry date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CustomDatePicker
                        value={couponForm.expiryDate ? new Date(couponForm.expiryDate) : undefined}
                        onChange={(date) => {
                          if (date) {
                            setCouponForm({ ...couponForm, expiryDate: date.toISOString().split('T')[0] });
                          }
                        }}
                        onApply={() => {
                          // Close the popover when Apply is clicked
                          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                        }}
                        onCancel={() => {
                          // Close the popover when Cancel is clicked
                          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                        }}
                        minDate={new Date()} // Set minimum date to today
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usageLimit">Usage Limit *</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    min="1"
                    value={couponForm.usageLimit}
                    onChange={(e) => setCouponForm({ ...couponForm, usageLimit: parseInt(e.target.value) || 1 })}
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isActive"
                  checked={couponForm.isActive}
                  onCheckedChange={(checked) => setCouponForm({ ...couponForm, isActive: checked as boolean })}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active (customers can use this coupon)
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Coupons ({coupons.length})</CardTitle>
              <CardDescription>Manage discount coupons and track their usage</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('inactive')}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCoupons.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">{coupons.length === 0 ? 'No coupons created yet' : 'No coupons found'}</p>
              {coupons.length === 0 && (
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                  Create First Coupon
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[1060px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Code</TableHead>
                    <TableHead className="text-center w-[200px]">Description</TableHead>
                    <TableHead className="text-center w-[120px]">Discount</TableHead>
                    <TableHead className="text-center w-[120px]">Min. Purchase</TableHead>
                    <TableHead className="text-center w-[120px]">Usage</TableHead>
                    <TableHead className="text-center w-[110px]">Expiry</TableHead>
                    <TableHead className="text-center w-[100px]">Status</TableHead>
                    <TableHead className="text-center w-[110px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoupons.map((coupon) => {
                    const expired = isExpired(coupon.expiryDate);
                    const usageFull = coupon.usedCount >= coupon.usageLimit;

                    return (
                      <TableRow key={coupon.id}>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1.5">
                            <code className="px-1.5 py-0.5 bg-secondary rounded text-xs">{coupon.code}</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => handleCopyCode(coupon.code)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <div className="text-sm truncate max-w-[190px] mx-auto">{coupon.description}</div>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <div className="text-sm">
                            {coupon.discountType === 'percentage'
                              ? `${coupon.discountValue}%`
                              : `₱${coupon.discountValue.toLocaleString('en-PH')}`}
                          </div>
                          {coupon.maxDiscount && coupon.discountType === 'percentage' && (
                            <div className="text-[11px] text-muted-foreground">Max ₱{coupon.maxDiscount.toLocaleString('en-PH')}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-2 text-sm">₱{coupon.minPurchase.toLocaleString('en-PH')}</TableCell>
                        <TableCell className="text-center py-2">
                          <div className="text-sm">{coupon.usedCount} / {coupon.usageLimit}</div>
                          <div className="w-full bg-secondary rounded-full h-1.5 mt-1 max-w-[80px] mx-auto">
                            <div
                              className="bg-primary rounded-full h-1.5"
                              style={{ width: `${(coupon.usedCount / coupon.usageLimit) * 100}%` }}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <div className={`text-sm ${expired ? 'text-red-600' : ''}`}>{formatDate(coupon.expiryDate)}</div>
                          {expired && <div className="text-xs text-red-600">Expired</div>}
                        </TableCell>
                        <TableCell className="text-center py-2">
                          {expired ? (
                            <Badge variant="destructive" className="text-xs">Expired</Badge>
                          ) : usageFull ? (
                            <Badge variant="secondary" className="text-xs">Full</Badge>
                          ) : coupon.isActive ? (
                            <Badge className="bg-accent-foreground text-accent text-xs">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(coupon)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={!coupon.isActive ? "outline" : "ghost"}
                              size="sm"
                              onClick={() => handleToggleActive(coupon.id, coupon.code, coupon.isActive)}
                              disabled={expired || usageFull}
                            >
                              {!coupon.isActive ? 'Reactivate' : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Toggle Confirmation Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {couponToToggle?.isActive ? 'Deactivate Coupon' : 'Reactivate Coupon'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {couponToToggle?.isActive 
                ? `Are you sure you want to deactivate "${couponToToggle.code}"? Customers will not be able to use this coupon until it is reactivated.`
                : `Are you sure you want to reactivate "${couponToToggle?.code}"? Customers will be able to use this coupon again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleActive}>
              {couponToToggle?.isActive ? 'Deactivate' : 'Reactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}