'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useCart } from '../contexts/CartContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Minus, Plus, X, Tag, Trash2 } from 'lucide-react';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { validateCoupon, calculateDiscount } from '../lib/coupons';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeFromCart, clearCart, appliedCoupon, setAppliedCoupon } = useCart();
  const router = useRouter();
  const [couponCode, setCouponCode] = useState('');
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Generate unique key for each cart item
  const getItemKey = (item: typeof items[0]) => {
    return `${item.id}-${item.selectedColor}-${item.selectedSize || 'no-size'}`;
  };

  // Select all items by default when cart opens or items change
  useEffect(() => {
    if (open && items.length > 0) {
      setSelectedItems(new Set(items.map(getItemKey)));
    }
  }, [open, items]);

  // Calculate total for selected items only
  const getSelectedItemsTotal = () => {
    return items.reduce((total, item) => {
      const itemKey = getItemKey(item);
      if (selectedItems.has(itemKey)) {
        return total + (item.price * item.quantity);
      }
      return total;
    }, 0);
  };

  const subtotal = getSelectedItemsTotal();
  const discount = appliedCoupon ? calculateDiscount(appliedCoupon, subtotal) : 0;
  const total = subtotal - discount;

  const allSelected = items.length > 0 && selectedItems.size === items.length;
  const someSelected = selectedItems.size > 0 && selectedItems.size < items.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(getItemKey)));
    }
  };

  const handleSelectItem = (itemKey: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemKey)) {
      newSelected.delete(itemKey);
    } else {
      newSelected.add(itemKey);
    }
    setSelectedItems(newSelected);
  };

  const handleRemoveSelected = () => {
    if (selectedItems.size === 0) {
      toast.error('No items selected');
      return;
    }

    items.forEach((item) => {
      const itemKey = getItemKey(item);
      if (selectedItems.has(itemKey)) {
        removeFromCart(item.id, item.selectedColor, item.selectedSize);
      }
    });

    setSelectedItems(new Set());
    toast.success(`Removed ${selectedItems.size} item(s) from cart`);
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setIsCouponLoading(true);
    const validation = validateCoupon(couponCode, subtotal);
    
    setTimeout(() => {
      if (validation.valid && validation.coupon) {
        setAppliedCoupon(validation.coupon);
        toast.success('Coupon applied successfully!', {
          description: `You saved ₱${calculateDiscount(validation.coupon, subtotal).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
        });
      } else {
        toast.error('Invalid coupon', {
          description: validation.error,
        });
      }
      setIsCouponLoading(false);
    }, 300);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Coupon removed');
  };

  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      toast.error('Please select at least one item to checkout');
      return;
    }
    onClose();
    router.push('/checkout');
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 h-full overflow-hidden" aria-describedby="cart-description">
        <SheetHeader className="px-6 pt-6 pb-4 space-y-2 flex-shrink-0">
          <SheetTitle>Shopping Cart ({items.length})</SheetTitle>
          <SheetDescription id="cart-description">
            Review your items and proceed to checkout
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Your cart is empty</p>
              <Button onClick={onClose}>Continue Shopping</Button>
            </div>
          </div>
        ) : (
          <>
            {/* Selection Controls */}
            <div className="px-6 py-3 border-b bg-secondary/20 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    className={someSelected ? 'data-[state=checked]:bg-primary' : ''}
                  />
                  <label htmlFor="select-all" className="text-sm cursor-pointer">
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </label>
                </div>
                {selectedItems.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveSelected}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove ({selectedItems.size})
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 min-h-0">
              <div className="space-y-4 pb-4 pt-4">
                {items.map((item) => {
                  const itemKey = getItemKey(item);
                  const isSelected = selectedItems.has(itemKey);
                  
                  return (
                    <div 
                      key={itemKey} 
                      className={`flex gap-3 p-4 rounded-lg border bg-card transition-colors ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectItem(itemKey)}
                        className="mt-1"
                      />
                      <div className="w-20 h-20 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                        <ImageWithFallback
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="line-clamp-2 leading-tight">{item.name}</h4>
                            <p className="text-muted-foreground mt-1">
                              Color: {item.selectedColor}
                              {item.selectedSize && (
                                <>
                                  <br />
                                  Size: {item.selectedSize}
                                </>
                              )}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => removeFromCart(item.id, item.selectedColor, item.selectedSize, item.selectedVariantId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.id, item.selectedColor, item.quantity - 1, item.selectedSize, item.selectedVariantId)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-10 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.id, item.selectedColor, item.quantity + 1, item.selectedSize, item.selectedVariantId)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-primary whitespace-nowrap">₱{(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t bg-background px-6 py-4 space-y-4 flex-shrink-0">
              {/* Coupon Input */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={!!appliedCoupon}
                    className="flex-1"
                  />
                  {!appliedCoupon ? (
                    <Button
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={isCouponLoading || !couponCode.trim()}
                      className="gap-2"
                    >
                      {isCouponLoading ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.928l3-2.647z"></path>
                        </svg>
                      ) : (
                        <Tag className="h-4 w-4" />
                      )}
                      Apply
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleRemoveCoupon}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
                {appliedCoupon && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                    <Tag className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {appliedCoupon.code} applied: {appliedCoupon.description}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <p className="text-muted-foreground">Subtotal</p>
                  <p>₱{subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                {appliedCoupon && discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <p className="text-green-600 dark:text-green-400">Discount ({appliedCoupon.code})</p>
                    <p className="text-green-600 dark:text-green-400">-₱{discount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <p>Total</p>
                <p className="text-primary">₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button className="w-full" size="lg" onClick={handleCheckout}>
                  Proceed to Checkout
                </Button>
                <Button variant="outline" className="w-full" onClick={onClose}>
                  Continue Shopping
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
