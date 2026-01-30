"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useCart } from "../contexts/CartContext";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Minus, Plus, X, Tag, ChevronDown, ChevronUp } from "lucide-react";
import { Separator } from "./ui/separator";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { getCoupons, validateCoupon, calculateDiscount } from "../lib/coupons";
import { products, getVariantById, getVariantStock } from "../lib/products";
import { Checkbox } from "./ui/checkbox";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const {
    items,
    updateQuantity,
    removeFromCart,
    removeLine,
    appliedCoupon,
    setAppliedCoupon,
  } = useCart();
  const router = useRouter();
  const [couponCode, setCouponCode] = useState("");
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Initialize all items as selected when cart opens or items change
  useEffect(() => {
    if (open && items.length > 0) {
      const allItemKeys = items.map((item) => item.lineKey);
      const currentSelectedKeys = Array.from(selectedItems);

      // Only update if the item keys have actually changed
      const keysChanged =
        allItemKeys.length !== currentSelectedKeys.length ||
        !allItemKeys.every((key) => selectedItems.has(key));

      if (keysChanged) {
        setSelectedItems(new Set(allItemKeys));
      }
    } else if (items.length === 0) {
      setSelectedItems(new Set());
    }
  }, [open, items]);

  // Get available coupons that meet the minimum purchase requirement
  const availableCoupons = getCoupons().filter(
    (coupon) =>
      coupon.isActive &&
      new Date(coupon.expiryDate) > new Date() &&
      coupon.usedCount < coupon.usageLimit,
  );

  // Calculate total for selected items only
  const subtotal = items.reduce((total, item) => {
    const itemKey = item.lineKey;
    if (selectedItems.has(itemKey)) {
      return total + item.price * item.quantity;
    }
    return total;
  }, 0);

  const discount = appliedCoupon
    ? calculateDiscount(appliedCoupon, subtotal)
    : 0;
  const total = subtotal - discount;

  // Helper functions for selection
  const toggleItemSelection = (itemKey: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey);
      } else {
        newSet.add(itemKey);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      const allItemKeys = items.map((item) => item.lineKey);
      setSelectedItems(new Set(allItemKeys));
    }
  };

  // Filter applicable coupons based on current subtotal
  const applicableCoupons = availableCoupons.filter(
    (coupon) => subtotal >= coupon.minPurchase,
  );
  // Helper function to get available stock for a cart item
  const getItemAvailableStock = (item: (typeof items)[0]): number => {
    const product = products.find((p) => p.id === item.id);
    if (!product) return 0;

    // New variant system
    if (item.selectedVariantId && product.variants) {
      const variant = getVariantById(product, item.selectedVariantId);
      if (variant) {
        return getVariantStock(variant);
      }
    }

    // Legacy: Size options system (for tables)
    if (product.sizeOptions && item.selectedSize) {
      const sizeOption = product.sizeOptions.find(
        (s) => s.label === item.selectedSize,
      );
      if (sizeOption) {
        return sizeOption.warehouseStock.reduce(
          (sum, ws) => sum + (ws.quantity - ws.reserved),
          0,
        );
      }
    }

    // Legacy: Warehouse stock for products without size (chairs)
    if (product.warehouseStock) {
      return product.warehouseStock.reduce(
        (sum, ws) => sum + (ws.quantity - ws.reserved),
        0,
      );
    }

    return 0;
  };
  const handleApplyCoupon = () => {
    // Input validation
    if (!couponCode.trim()) {
      toast.error("Enter coupon code");
      return;
    }

    // Sanitize input (prevent XSS)
    const sanitizedCode = couponCode
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

    if (sanitizedCode.length === 0) {
      toast.error("Invalid coupon format");
      return;
    }

    setIsCouponLoading(true);

    // Simulate API delay for better UX
    setTimeout(() => {
      const validation = validateCoupon(sanitizedCode, subtotal);

      if (validation.valid && validation.coupon) {
        setAppliedCoupon(validation.coupon);
        setCouponCode("");
        toast.success("Coupon applied");
      } else {
        toast.error("Invalid coupon");
      }
      setIsCouponLoading(false);
    }, 300);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast.info("Coupon removed");
  };

  const handleApplySuggestedCoupon = (code: string) => {
    setCouponCode(code);
    setShowAvailableCoupons(false);
    // Auto-apply after short delay
    setTimeout(() => {
      handleApplyCoupon();
    }, 100);
  };

  const handleCheckout = () => {
    // Validate cart is not empty
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    // Validate all items have valid quantities
    const hasInvalidQuantity = items.some((item) => item.quantity <= 0);
    if (hasInvalidQuantity) {
      toast.error("Invalid quantity");
      return;
    }

    // Validate total amount is reasonable (prevent manipulation)
    if (subtotal <= 0 || total < 0) {
      toast.error("Invalid total");
      return;
    }

    // Validate discount doesn't exceed subtotal
    if (discount > subtotal) {
      toast.error("Invalid discount");
      setAppliedCoupon(null);
      return;
    }

    // Check for potential stock issues (basic validation)
    const hasHighQuantity = items.some((item) => item.quantity > 100);
    if (hasHighQuantity) {
      toast.error("Quantity limit exceeded");
      return;
    }

    // Re-validate coupon if applied
    if (appliedCoupon) {
      const validation = validateCoupon(appliedCoupon.code, subtotal);
      if (!validation.valid) {
        toast.error("Coupon expired");
        setAppliedCoupon(null);
        return;
      }
    }

    onClose();
    router.push("/checkout");
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        className="w-full sm:max-w-md flex flex-col p-0 h-full overflow-hidden"
        aria-describedby="cart-description"
      >
        <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 space-y-0.5 flex-shrink-0">
          <SheetTitle className="text-base sm:text-lg">
            Shopping Cart
          </SheetTitle>
          <SheetDescription id="cart-description">
            Review your items and proceed to checkout
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Your cart is empty</p>
              <Button onClick={onClose}>Continue Shopping</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 min-h-0">
              {/* Select All Section */}
              <div className="sticky top-0 bg-background z-10 py-1.5 border-b">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={
                      selectedItems.size === items.length && items.length > 0
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Select All
                  </label>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-2.5 pb-4 pt-3 sm:pt-4">
                {items.map((item) => {
                  const itemKey = item.lineKey;
                  const isSelected = selectedItems.has(itemKey);

                  return (
                    <div
                      key={itemKey}
                      className={`flex gap-2 p-2 sm:p-2.5 rounded-lg border transition-colors ${
                        isSelected ? "bg-white" : "bg-muted/30"
                      }`}
                    >
                      {/* Checkbox for item selection */}
                      <div className="flex items-start pt-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleItemSelection(itemKey)}
                        />
                      </div>

                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between gap-1">
                          <div className="flex-1 min-w-0">
                            <h4 className="line-clamp-2 leading-tight text-xs sm:text-sm">
                              {item.name}
                            </h4>
                            <p className="text-muted-foreground text-[10px] sm:text-xs mt-0.5">
                              <span className="text-[10px] sm:text-xs">
                                Color:
                              </span>{" "}
                              <span className="text-[10px] sm:text-xs">
                                {item.selectedColor}
                              </span>
                              {item.selectedSize && (
                                <>
                                  <br />
                                  <span className="text-[10px] sm:text-xs">
                                    Size:
                                  </span>{" "}
                                  <span className="text-[10px] sm:text-xs">
                                    {item.selectedSize}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              try {
                                removeLine(item.lineKey);
                                toast.success("Removed");

                                // Update selected items to remove the deleted item
                                setSelectedItems((prev) => {
                                  const newSet = new Set(prev);
                                  newSet.delete(item.lineKey);
                                  return newSet;
                                });
                              } catch (error) {
                                toast.error("Removal failed");
                              }
                            }}
                          >
                            <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                if (item.quantity <= 1) {
                                  toast.error("Use X to remove item");
                                  return;
                                }
                                updateQuantity(
                                  item.id,
                                  item.selectedColor,
                                  item.quantity - 1,
                                  item.selectedSize,
                                  item.selectedVariantId,
                                );
                              }}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-2.5 w-2.5" />
                            </Button>
                            <span className="w-8 text-center text-xs">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                const availableStock =
                                  getItemAvailableStock(item);

                                if (item.quantity >= availableStock) {
                                  toast.error(
                                    `Only ${availableStock} in stock`,
                                  );
                                  return;
                                }

                                if (item.quantity >= 100) {
                                  toast.error("Max 100 items");
                                  return;
                                }

                                updateQuantity(
                                  item.id,
                                  item.selectedColor,
                                  item.quantity + 1,
                                  item.selectedSize,
                                  item.selectedVariantId,
                                );
                              }}
                              disabled={
                                item.quantity >= 100 ||
                                item.quantity >= getItemAvailableStock(item)
                              }
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                          <p className="text-primary whitespace-nowrap text-xs sm:text-sm font-medium">
                            ₱
                            {(item.price * item.quantity).toLocaleString(
                              "en-PH",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t bg-background px-4 sm:px-6 py-3 flex-shrink-0 space-y-3">
              {/* Coupon Section */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    disabled={!!appliedCoupon || isCouponLoading}
                    maxLength={20}
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
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.928l3-2.647z"
                          />
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

                {/* Applied Coupon Badge */}
                {appliedCoupon && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                    <Tag className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-600 dark:text-green-400 flex-1">
                      {appliedCoupon.code} - {appliedCoupon.description}
                    </p>
                  </div>
                )}

                {/* Available Coupons Section */}
                {!appliedCoupon && applicableCoupons.length > 0 && (
                  <div className="border rounded-lg">
                    <button
                      onClick={() =>
                        setShowAvailableCoupons(!showAvailableCoupons)
                      }
                      className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {applicableCoupons.length} Available Coupon
                          {applicableCoupons.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      {showAvailableCoupons ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {showAvailableCoupons && (
                      <div className="border-t max-h-48 overflow-y-auto">
                        {applicableCoupons.map((coupon) => (
                          <div
                            key={coupon.id}
                            className="p-3 border-b last:border-b-0 hover:bg-accent/30 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-primary">
                                  {coupon.code}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {coupon.description}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Min. purchase: ₱
                                  {coupon.minPurchase.toLocaleString("en-PH")}
                                  {coupon.maxDiscount &&
                                    ` • Max discount: ₱${coupon.maxDiscount.toLocaleString("en-PH")}`}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleApplySuggestedCoupon(coupon.code)
                                }
                                className="text-xs"
                              >
                                Apply
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Pricing Summary */}
              {appliedCoupon && discount > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <p className="text-green-600 dark:text-green-400">
                      Discount
                    </p>
                    <p className="text-green-600 dark:text-green-400">
                      -₱
                      {discount.toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              )}

              {appliedCoupon && discount > 0 && <Separator />}

              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Total</p>
                <p className="text-base sm:text-lg font-semibold text-primary">
                  ₱
                  {total.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <Button className="w-full" onClick={handleCheckout}>
                Proceed to Checkout
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
