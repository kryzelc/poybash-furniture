// @ts-nocheck
// TODO: Fix type errors for Order interface
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { AlertTriangle, DollarSign, Receipt, Shield, CreditCard, Wallet, Banknote, Upload } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { toast } from 'sonner';
import type { Order } from '../../contexts/AuthContext';

interface ManualRefundDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProcessRefund: (refundData: {
    refundMethod: 'gcash' | 'bank' | 'cash';
    refundAmount: number;
    refundReason: string;
    refundProof?: string;
    adminNotes?: string;
    itemsRefunded?: number[];
  }) => void;
}

export function ManualRefundDialog({
  order,
  open,
  onOpenChange,
  onProcessRefund,
}: ManualRefundDialogProps) {
  const [refundMethod, setRefundMethod] = useState<'gcash' | 'bank' | 'cash'>('cash');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundProof, setRefundProof] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isFullRefund, setIsFullRefund] = useState(true);

  // Auto-populate refund method based on original payment method
  useEffect(() => {
    if (order && open) {
      const paymentMethod = order.paymentMethod.toLowerCase();
      if (paymentMethod.includes('gcash')) {
        setRefundMethod('gcash');
      } else if (paymentMethod.includes('bank')) {
        setRefundMethod('bank');
      } else {
        setRefundMethod('cash');
      }
      // Set initial refund amount to order total
      setRefundAmount(order.total.toString());
    }
  }, [order, open]);

  if (!order) return null;

  // Get payment method display details
  const getPaymentMethodIcon = () => {
    const method = order.paymentMethod.toLowerCase();
    if (method.includes('gcash')) return <Wallet className="h-4 w-4" />;
    if (method.includes('bank')) return <CreditCard className="h-4 w-4" />;
    return <Banknote className="h-4 w-4" />;
  };

  const getPaymentMethodBadge = () => {
    const method = order.paymentMethod.toLowerCase();
    if (method.includes('gcash')) return 'default';
    if (method.includes('bank')) return 'secondary';
    return 'outline';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setRefundProof(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleItem = (productId: number) => {
    if (selectedItems.includes(productId)) {
      setSelectedItems(selectedItems.filter(id => id !== productId));
    } else {
      setSelectedItems([...selectedItems, productId]);
    }
  };

  const calculateSelectedTotal = () => {
    if (isFullRefund) return order.total;
    
    return order.items
      .filter(item => selectedItems.includes(item.productId))
      .reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSubmit = () => {
    // Validation
    if (!refundAmount || parseFloat(refundAmount) <= 0) {
      toast.error('Please enter a valid refund amount');
      return;
    }

    if (parseFloat(refundAmount) > order.total) {
      toast.error('Refund amount cannot exceed order total');
      return;
    }

    if (!refundReason.trim()) {
      toast.error('Please provide a reason for the refund');
      return;
    }

    if (!refundProof) {
      toast.error('Please upload proof of refund (receipt/screenshot)');
      return;
    }

    if (!isFullRefund && selectedItems.length === 0) {
      toast.error('Please select items to refund or choose full order refund');
      return;
    }

    // Process refund
    onProcessRefund({
      refundMethod,
      refundAmount: parseFloat(refundAmount),
      refundReason,
      refundProof,
      adminNotes: adminNotes.trim() || undefined,
      itemsRefunded: isFullRefund ? [] : selectedItems,
    });

    // Reset form
    setRefundMethod('cash');
    setRefundAmount('');
    setRefundReason('');
    setRefundProof('');
    setAdminNotes('');
    setSelectedItems([]);
    setIsFullRefund(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Process Manual Refund
          </DialogTitle>
          <DialogDescription>
            Record refund for manual orders, cash transactions, or cancelled orders
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Security Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Notice:</strong> This action is logged and tracked. All refund transactions require proof and will be audited.
              Ensure all information is accurate before processing.
            </AlertDescription>
          </Alert>

          {/* Order & Payment Information */}
          <div className="space-y-4">
            <div className="p-4 bg-secondary/30 rounded-lg space-y-3">
              <h4 className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Order Information
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs">Order ID</span>
                  <span className="font-mono">{order.id}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs">Order Total</span>
                  <span className="text-primary">₱{order.total.toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs">Order Status</span>
                  <Badge variant="outline" className="w-fit">{order.status}</Badge>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs">Order Date</span>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Customer Payment Details */}
            <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg space-y-3">
              <h4 className="flex items-center gap-2 text-primary">
                {getPaymentMethodIcon()}
                Customer's Original Payment Details
              </h4>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <Badge variant={getPaymentMethodBadge() as any} className="flex items-center gap-1">
                    {getPaymentMethodIcon()}
                    {order.paymentMethod}
                  </Badge>
                </div>
                
                {order.paymentReference && (
                  <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <span className="text-muted-foreground">Reference Number:</span>
                    <span className="font-mono">{order.paymentReference}</span>
                  </div>
                )}
                
                {order.paymentProof && (
                  <div className="space-y-2">
                    <span className="text-muted-foreground text-xs">Customer's Payment Proof:</span>
                    <div className="p-2 bg-background rounded-lg border">
                      <ImageWithFallback
                        src={order.paymentProof}
                        alt="Customer payment proof"
                        className="max-h-32 mx-auto rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(order.paymentProof, '_blank')}
                      />
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        Click to view full size
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Refund Recommendation:</strong> {order.orderSource === 'Online' && order.paymentMethod === 'Cash' 
                    ? 'Since this was an online order paid with Cash, please refund via GCash or Bank Transfer for customer convenience.'
                    : `Please refund using the same method the customer used for payment (${order.paymentMethod}) to ensure smooth processing.`}
                </AlertDescription>
              </Alert>
            </div>
          </div>

          <Separator />

          {/* Refund Type Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="fullRefund"
                checked={isFullRefund}
                onCheckedChange={(checked) => {
                  setIsFullRefund(checked as boolean);
                  if (checked) {
                    setSelectedItems([]);
                    setRefundAmount(order.total.toString());
                  }
                }}
              />
              <Label htmlFor="fullRefund" className="cursor-pointer">
                Full Order Refund (₱{order.total.toFixed(2)})
              </Label>
            </div>

            {!isFullRefund && (
              <div className="space-y-3">
                <Label>Select Items to Refund:</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {order.items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3 p-2 hover:bg-secondary/50 rounded">
                      <Checkbox
                        checked={selectedItems.includes(item.productId)}
                        onCheckedChange={() => handleToggleItem(item.productId)}
                      />
                      <div className="flex-1 flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-secondary overflow-hidden flex-shrink-0">
                          <ImageWithFallback
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.color} × {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm text-primary">₱{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedItems.length > 0 && (
                  <div className="p-3 bg-primary/10 rounded text-sm">
                    <strong>Selected Items Total: ₱{calculateSelectedTotal().toFixed(2)}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Refund Method */}
          <div className="space-y-2">
            <Label>Refund Method *</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant={refundMethod === 'cash' ? 'default' : 'outline'}
                onClick={() => setRefundMethod('cash')}
                className="h-auto py-4 flex flex-col gap-1"
              >
                <DollarSign className="h-5 w-5" />
                <span>Cash</span>
                <span className="text-xs text-muted-foreground">In-person</span>
              </Button>
              <Button
                type="button"
                variant={refundMethod === 'gcash' ? 'default' : 'outline'}
                onClick={() => setRefundMethod('gcash')}
                className="h-auto py-4 flex flex-col gap-1"
              >
                <Receipt className="h-5 w-5" />
                <span>GCash</span>
                <span className="text-xs text-muted-foreground">Mobile</span>
              </Button>
              <Button
                type="button"
                variant={refundMethod === 'bank' ? 'default' : 'outline'}
                onClick={() => setRefundMethod('bank')}
                className="h-auto py-4 flex flex-col gap-1"
              >
                <Receipt className="h-5 w-5" />
                <span>Bank</span>
                <span className="text-xs text-muted-foreground">Transfer</span>
              </Button>
            </div>
          </div>

          {/* Refund Amount */}
          <div className="space-y-2">
            <Label htmlFor="refundAmount">Refund Amount (₱) *</Label>
            <Input
              id="refundAmount"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="0.00"
              disabled={isFullRefund}
            />
            <p className="text-xs text-muted-foreground">
              Maximum refundable amount: ₱{order.total.toFixed(2)}
            </p>
          </div>

          {/* Refund Reason */}
          <div className="space-y-2">
            <Label htmlFor="refundReason">Refund Reason *</Label>
            <Textarea
              id="refundReason"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Enter the reason for this refund (e.g., customer dissatisfaction, damaged goods, order cancellation, etc.)"
              rows={3}
            />
          </div>

          {/* Refund Proof */}
          <div className="space-y-2">
            <Label htmlFor="refundProof">Refund Proof (Receipt/Screenshot) *</Label>
            <p className="text-xs text-muted-foreground">
              Upload proof of the refund transaction (GCash screenshot, bank receipt, signed document, etc.)
            </p>
            <div className="relative">
              <input
                id="refundProof"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('refundProof')?.click()}
                className="w-full justify-start gap-2"
              >
                <Upload className="h-4 w-4" />
                {refundProof ? 'Change Image' : 'Upload Image'}
              </Button>
            </div>
            {refundProof && (
              <div className="mt-2 p-3 border rounded-lg bg-secondary/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Uploaded proof:</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRefundProof('')}
                    className="h-auto py-1 px-2"
                  >
                    Remove
                  </Button>
                </div>
                <ImageWithFallback
                  src={refundProof}
                  alt="Refund proof"
                  className="max-h-48 mx-auto rounded border"
                />
              </div>
            )}
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="adminNotes">Internal Admin Notes (Optional)</Label>
            <Textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add any internal notes about this refund (not visible to customer)"
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setRefundMethod('cash');
                setRefundAmount('');
                setRefundReason('');
                setRefundProof('');
                setAdminNotes('');
                setSelectedItems([]);
                setIsFullRefund(true);
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Process Refund
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}