"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Card, CardContent } from "../ui/card";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Edit,
  AlertTriangle,
  Save,
  Search,
  X,
  Upload,
  Eye,
  CheckCircle,
  Tag,
  Percent,
} from "lucide-react";
import {
  getProducts,
  type Product,
  type WarehouseStock,
} from "../../lib/products";
import { useAuth } from "../../contexts/AuthContext";
import type { Order, OrderItem } from "@/models/Order";
import type { User } from "@/models/User";
import { addAuditLog } from "../../lib/auditLog";
import {
  getCoupons,
  validateCoupon,
  calculateDiscount,
  useCoupon,
  type Coupon,
} from "../../lib/coupons";
import { createUser, checkEmailExists } from "../../services/userService";
// reserveStock is now handled automatically in placeOrder
// import { reserveStock } from '../../lib/inventory';

// Create Order Dialog
export function CreateOrderDialog({
  onCreateOrder,
}: {
  onCreateOrder: (orderData: any, customUserId: string) => void;
}) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [warehouse, setWarehouse] = useState<"Lorenzo" | "Oroquieta">(
    "Lorenzo",
  );

  // Customer Search
  const [customers, setCustomers] = useState<User[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("users");
    if (!stored) return [];
    const users = JSON.parse(stored);
    return users.filter((u: User) => u.role === "customer");
  });
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");

  // Product Search
  const [productSearchTerm, setProductSearchTerm] = useState("");

  // Customer Information
  const [customerEmail, setCustomerEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [barangay, setBarangay] = useState("");
  const [zipCode, setZipCode] = useState("");

  // Order Details
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gcash" | "bank">(
    "cash",
  );
  const [deliveryMethod, setDeliveryMethod] = useState<
    "store-pickup" | "customer-arranged" | "staff-delivery"
  >("store-pickup");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isReservation, setIsReservation] = useState(false);
  const [reservationPercentage, setReservationPercentage] = useState(30);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentProof, setPaymentProof] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Payment transaction details
  const [paymentName, setPaymentName] = useState("");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [transactionDetails, setTransactionDetails] = useState("");

  // Coupon Management
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [showApplicableCoupons, setShowApplicableCoupons] = useState(false);

  // FIXED: Make products reactive to localStorage changes
  const [products, setProducts] = useState<Product[]>(() => getProducts());

  // Reload products whenever localStorage changes (after stock updates)
  const reloadProducts = () => {
    setProducts(getProducts());
  };

  // Listen for stock updates
  useEffect(() => {
    const handleStockUpdate = () => {
      reloadProducts();
    };

    window.addEventListener("stockUpdated", handleStockUpdate);

    return () => {
      window.removeEventListener("stockUpdated", handleStockUpdate);
    };
  }, []);

  // Reset all form fields to default state
  const resetForm = () => {
    setOrderItems([]);
    setSelectedProductId(null);
    setSelectedVariantId("");
    setQuantity(1);
    setWarehouse("Lorenzo");
    setSelectedCustomer(null);
    setCustomerSearchTerm("");
    setProductSearchTerm("");
    setCustomerEmail("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setAddress("");
    setCity("");
    setProvince("");
    setBarangay("");
    setZipCode("");
    setPaymentMethod("cash");
    setDeliveryMethod("store-pickup");
    setDeliveryFee(0);
    setIsReservation(false);
    setReservationPercentage(30);
    setPaymentReference("");
    setPaymentProof("");
    setPaymentName("");
    setPaymentPhone("");
    setTransactionDetails("");
    setNotes("");
    setCouponCode("");
    setAppliedCoupon(null);
    setShowApplicableCoupons(false);
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm.trim()) return [];
    const term = customerSearchTerm.toLowerCase();
    return customers
      .filter(
        (c) =>
          c.firstName?.toLowerCase().includes(term) ||
          c.lastName?.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term) ||
          c.phone?.includes(term),
      )
      .slice(0, 5); // Limit to 5 results
  }, [customers, customerSearchTerm]);

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!productSearchTerm.trim()) {
      return products.filter((p) => p.active !== false);
    }
    const term = productSearchTerm.toLowerCase();
    return products
      .filter((p) => p.active !== false)
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term),
      );
  }, [products, productSearchTerm]);

  // Handle customer selection
  const handleSelectCustomer = (customer: User) => {
    setSelectedCustomer(customer);
    const defaultAddress =
      customer.addresses?.find((addr) => addr.isDefault) ||
      customer.addresses?.[0];

    setCustomerEmail(customer.email);
    setFirstName(customer.firstName);
    setLastName(customer.lastName);
    setPhone(customer.phone || defaultAddress?.phone || "");
    setAddress(defaultAddress?.address || "");
    setCity(defaultAddress?.city || "");
    setProvince(defaultAddress?.state || "");
    setBarangay(defaultAddress?.barangay || "");
    setZipCode(defaultAddress?.zipCode || "");
    setCustomerSearchTerm("");

    toast.success(
      `Customer ${customer.firstName} ${customer.lastName} selected`,
    );
  };

  // Clear selected customer
  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerEmail("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setAddress("");
    setCity("");
    setProvince("");
    setBarangay("");
    setZipCode("");
    toast.info("Customer cleared");
  };

  // Handle payment proof upload
  const handlePaymentProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentProof(reader.result as string);
      toast.success("Payment proof uploaded successfully");
    };
    reader.readAsDataURL(file);
  };

  // Get available stock for a specific warehouse
  const getAvailableStock = (
    product: Product,
    warehouseName: "Lorenzo" | "Oroquieta",
    variantId?: string,
  ): number => {
    let stockInfo: WarehouseStock | undefined;

    if (variantId && product.variants) {
      const variant = product.variants.find((v) => v.id === variantId);
      if (variant) {
        stockInfo = variant.warehouseStock.find(
          (ws) => ws.warehouse === warehouseName,
        );
      }
    } else if (product.warehouseStock) {
      stockInfo = product.warehouseStock.find(
        (ws) => ws.warehouse === warehouseName,
      );
    }

    if (!stockInfo) return 0;
    return Math.max(0, stockInfo.quantity - stockInfo.reserved);
  };

  // Check if there's enough stock for all items
  const checkStockAvailability = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Group items by product/variant/warehouse to check total quantities
    const groupedItems = new Map<
      string,
      { item: OrderItem; totalQuantity: number }
    >();

    for (const item of orderItems) {
      const key = `${item.productId}-${item.variantId || "none"}-${item.warehouseSource}`;

      if (groupedItems.has(key)) {
        const existing = groupedItems.get(key)!;
        existing.totalQuantity += item.quantity;
      } else {
        groupedItems.set(key, { item, totalQuantity: item.quantity });
      }
    }

    // Check stock for each grouped item
    for (const { item, totalQuantity } of groupedItems.values()) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;

      const availableStock = getAvailableStock(
        product,
        item.warehouseSource!,
        item.variantId,
      );
      if (totalQuantity > availableStock) {
        const variantLabel = item.variantId
          ? ` (${item.size ? item.size + " - " : ""}${item.color})`
          : "";
        errors.push(
          `${product.name}${variantLabel} in ${item.warehouseSource}: Only ${availableStock} available, ${totalQuantity} total requested in order`,
        );
      }
    }

    return { isValid: errors.length === 0, errors };
  };

  const addItemToOrder = () => {
    if (!selectedProductId) {
      toast.error("Please select a product");
      return;
    }

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    // Check if variant is required but not selected
    if (product.variants && product.variants.length > 0 && !selectedVariantId) {
      toast.error("Please select a variant");
      return;
    }

    // Check stock availability including quantities already in the order
    const availableStock = getAvailableStock(
      product,
      warehouse,
      selectedVariantId,
    );

    // Calculate total quantity of this product/variant already in order items (for same warehouse)
    const existingQuantity = orderItems
      .filter(
        (item) =>
          item.productId === selectedProductId &&
          item.variantId === selectedVariantId &&
          item.warehouseSource === warehouse,
      )
      .reduce((sum, item) => sum + item.quantity, 0);

    const totalQuantityNeeded = existingQuantity + quantity;

    if (totalQuantityNeeded > availableStock) {
      toast.error(
        `Insufficient stock. ${availableStock} units available in ${warehouse} warehouse. ` +
          `You already have ${existingQuantity} units in this order. ` +
          `Cannot add ${quantity} more.`,
        { duration: 6000 },
      );
      return;
    }

    if (quantity <= 0) {
      toast.error("Quantity must be at least 1");
      return;
    }

    let price = product.price;
    let variantLabel = "";
    let color = "";
    let size = "";

    // Handle variants
    if (product.variants && product.variants.length > 0 && selectedVariantId) {
      const variant = product.variants.find((v) => v.id === selectedVariantId);
      if (variant) {
        price = variant.price;
        color = variant.color;
        size = variant.size || "";
        variantLabel = `${size ? size + " - " : ""}${color}`;
      }
    } else if (product.colors && product.colors.length > 0) {
      color = product.colors[0];
    }

    const newItem: OrderItem = {
      productId: product.id,
      name: product.name,
      price: price,
      quantity: quantity,
      color: color,
      size: size,
      variantId: selectedVariantId,
      imageUrl: product.imageUrl,
      warehouseSource: warehouse,
    };

    setOrderItems([...orderItems, newItem]);
    setSelectedProductId(null);
    setSelectedVariantId("");
    setQuantity(1);
    toast.success("Item added to order");
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  };

  const calculateCouponDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = calculateSubtotal();
    return calculateDiscount(appliedCoupon, subtotal);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateCouponDiscount();
    return subtotal + deliveryFee - discount;
  };

  const calculateReservationFee = () => {
    return (calculateTotal() * reservationPercentage) / 100;
  };

  const getApplicableCoupons = useMemo(() => {
    if (orderItems.length === 0) return [];

    const subtotal = calculateSubtotal();
    const allCoupons = getCoupons();

    return allCoupons.filter((coupon) => {
      if (!coupon.isActive) return false;
      if (coupon.usedCount >= coupon.usageLimit) return false;

      const expiryDate = new Date(coupon.expiryDate);
      if (expiryDate < new Date()) return false;

      if (subtotal < coupon.minPurchase) return false;

      return true;
    });
  }, [orderItems]);

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    const subtotal = calculateSubtotal();
    const validation = validateCoupon(couponCode, subtotal);

    if (!validation.valid) {
      toast.error(validation.error || "Invalid coupon");
      return;
    }

    setAppliedCoupon(validation.coupon!);
    setCouponCode("");
    toast.success(`Coupon "${validation.coupon!.code}" applied successfully!`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast.info("Coupon removed");
  };

  const handleSelectCoupon = (coupon: Coupon) => {
    setAppliedCoupon(coupon);
    setShowApplicableCoupons(false);
    toast.success(`Coupon "${coupon.code}" applied successfully!`);
  };

  const handleCreateOrder = async () => {
    if (orderItems.length === 0) {
      toast.error("Please add at least one item to the order");
      return;
    }

    if (!firstName || !lastName || !phone || !address || !city) {
      toast.error("Please fill in all required customer information");
      return;
    }

    // Validate stock availability for all items
    const stockCheck = checkStockAvailability();
    if (!stockCheck.isValid) {
      toast.error("Insufficient stock for the following items:", {
        description: stockCheck.errors.join("\n"),
        duration: 6000,
      });
      return;
    }

    // Find or create customer user
    let customerId: string | undefined;

    if (customerEmail) {
      // Check if customer exists
      const emailExists = await checkEmailExists(customerEmail);

      if (!emailExists) {
        // Create new customer account
        const newCustomer = await createUser({
          email: customerEmail,
          password: `temp${Date.now()}`,
          firstName: firstName,
          lastName: lastName,
          phone: phone,
          role: "customer",
        });

        if (newCustomer) {
          customerId = newCustomer;
        } else {
          toast.error("Failed to create customer account");
          return;
        }
      }
    }

    const reservationAmount = isReservation ? calculateReservationFee() : 0;

    const orderData: any = {
      items: orderItems,
      subtotal: calculateSubtotal(),
      deliveryFee: deliveryMethod === "staff-delivery" ? deliveryFee : 0,
      total: calculateTotal(),
      status: "pending",
      isReservation: isReservation,
      reservationFee: isReservation ? reservationAmount : undefined,
      reservationPercentage: isReservation ? reservationPercentage : undefined,
      deliveryMethod: deliveryMethod,
      shippingAddress: {
        firstName: firstName,
        lastName: lastName,
        address: address,
        city: city,
        state: province,
        province: province,
        barangay: barangay,
        zipCode: zipCode,
        country: "Philippines",
        phone: phone,
      },
      paymentMethod: paymentMethod,
      paymentReference: paymentReference,
      paymentProof: paymentProof,
      paymentName: paymentName,
      paymentPhone: paymentPhone,
      transactionDetails: transactionDetails,
      couponCode: appliedCoupon?.code,
      couponDiscount: appliedCoupon ? calculateCouponDiscount() : undefined,
      couponId: appliedCoupon?.id,
      coupon: appliedCoupon
        ? {
            code: appliedCoupon.code,
            discountType: appliedCoupon.discountType,
            discountValue: appliedCoupon.discountValue,
            discountAmount: calculateCouponDiscount(),
          }
        : undefined,
    };

    // Stock reservation now happens automatically in placeOrder (AuthContext)
    onCreateOrder(orderData, customerId || `guest-${Date.now()}`);

    // Mark coupon as used if applied
    if (appliedCoupon) {
      useCoupon(appliedCoupon.id);
    }

    // Add audit log
    if (user) {
      const couponNote = appliedCoupon
        ? ` | Coupon: ${appliedCoupon.code} (-₱${calculateCouponDiscount().toFixed(2)})`
        : "";
      addAuditLog({
        actionType: "manual_order_created",
        performedBy: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: `${user.firstName} ${user.lastName}`,
        },
        targetEntity: {
          type: "order",
          id: "pending",
          name: `Order for ${firstName} ${lastName}`,
        },
        metadata: {
          notes: `Manual order created: ${orderItems.length} items, Total: ₱${calculateTotal().toFixed(2)}${couponNote}${notes ? ` - ${notes}` : ""}`,
        },
      });
    }

    // Close dialog and reset form
    setIsOpen(false);

    toast.success("Order created successfully!");
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Create Manual Order
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Manual Order</DialogTitle>
            <DialogDescription>
              Create a new order manually for walk-in customers or phone orders
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Customer Search */}
            {!selectedCustomer ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Label>Search for existing customer</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, email, or phone..."
                        value={customerSearchTerm}
                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    {filteredCustomers.length > 0 && (
                      <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                        {filteredCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => handleSelectCustomer(customer)}
                            className="w-full p-3 text-left hover:bg-accent transition-colors flex items-start justify-between gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">
                                {customer.firstName} {customer.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {customer.email}
                              </p>
                              {customer.phone && (
                                <p className="text-sm text-muted-foreground">
                                  {customer.phone}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline">Select</Badge>
                          </button>
                        ))}
                      </div>
                    )}
                    {customerSearchTerm && filteredCustomers.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No customers found. Fill in the form below to create a
                        new order.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-accent/20 border-accent">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-accent-foreground text-accent">
                          Selected Customer
                        </Badge>
                      </div>
                      <p className="font-medium">
                        {selectedCustomer.firstName} {selectedCustomer.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedCustomer.email}
                      </p>
                      {selectedCustomer.phone && (
                        <p className="text-sm text-muted-foreground">
                          {selectedCustomer.phone}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearCustomer}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Juan"
                    required
                    disabled={!!selectedCustomer}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Dela Cruz"
                    required
                    disabled={!!selectedCustomer}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email (optional)</Label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="customer@email.com"
                    disabled={!!selectedCustomer}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+63 912 345 6789"
                    required
                    disabled={!!selectedCustomer}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Shipping Address */}
            <div className="space-y-4">
              <h3 className="font-semibold">Shipping Address</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Street Address *</Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Barangay</Label>
                  <Input
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    placeholder="Barangay Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Manila"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Province</Label>
                  <Input
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="Metro Manila"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Zip Code</Label>
                  <Input
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="1000"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Add Items */}
            <div className="space-y-4">
              <h3 className="font-semibold">Order Items</h3>

              {/* Product Search */}
              <div className="space-y-2">
                <Label>Search Products</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by product name or category..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {productSearchTerm && (
                  <p className="text-xs text-muted-foreground">
                    {filteredProducts.length} product
                    {filteredProducts.length !== 1 ? "s" : ""} found
                  </p>
                )}
              </div>

              {/* Item Selection */}
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="space-y-2 col-span-3">
                  <Label>Product</Label>
                  <Select
                    value={selectedProductId?.toString() || ""}
                    onValueChange={(value) => {
                      setSelectedProductId(Number(value));
                      setSelectedVariantId("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProducts.map((product) => (
                        <SelectItem
                          key={product.id}
                          value={product.id.toString()}
                        >
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProductId &&
                  products.find((p) => p.id === selectedProductId)?.variants &&
                  products.find((p) => p.id === selectedProductId)!.variants!
                    .length > 0 && (
                    <div className="space-y-2 col-span-3">
                      <Label>Variant</Label>
                      <Select
                        value={selectedVariantId}
                        onValueChange={setSelectedVariantId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select variant" />
                        </SelectTrigger>
                        <SelectContent>
                          {products
                            .find((p) => p.id === selectedProductId)
                            ?.variants?.filter((v) => v.active)
                            .map((variant) => (
                              <SelectItem key={variant.id} value={variant.id}>
                                {variant.size && `${variant.size} - `}
                                {variant.color}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                <div className="space-y-2 col-span-1">
                  <Label>Qty</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity || ""}
                    onChange={(e) =>
                      setQuantity(
                        e.target.value === "" ? 0 : Number(e.target.value),
                      )
                    }
                    className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Warehouse</Label>
                  <Select
                    value={warehouse}
                    onValueChange={(value: any) => setWarehouse(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lorenzo">Lorenzo</SelectItem>
                      <SelectItem value="Oroquieta">Oroquieta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-3">
                  <Button onClick={addItemToOrder} className="gap-2 w-full">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Stock Availability Indicator */}
              {selectedProductId && (
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {warehouse} Warehouse
                      </Badge>
                      {(() => {
                        const product = products.find(
                          (p) => p.id === selectedProductId,
                        );
                        if (!product) return null;

                        const availableStock = getAvailableStock(
                          product,
                          warehouse,
                          selectedVariantId,
                        );

                        // Calculate quantity already in order for this product/variant/warehouse
                        const alreadyInOrder = orderItems
                          .filter(
                            (item) =>
                              item.productId === selectedProductId &&
                              item.variantId === selectedVariantId &&
                              item.warehouseSource === warehouse,
                          )
                          .reduce((sum, item) => sum + item.quantity, 0);

                        const remainingStock = availableStock - alreadyInOrder;
                        const isLowStock =
                          remainingStock > 0 && remainingStock <= 5;
                        const isOutOfStock = remainingStock <= 0;

                        return (
                          <>
                            <span className="text-sm">
                              Available:
                              <span
                                className={`ml-1 font-semibold ${
                                  isOutOfStock
                                    ? "text-red-600"
                                    : isLowStock
                                      ? "text-yellow-600"
                                      : "text-green-600"
                                }`}
                              >
                                {availableStock} units
                              </span>
                              {alreadyInOrder > 0 && (
                                <span className="text-muted-foreground ml-2">
                                  ({alreadyInOrder} in order,{" "}
                                  {Math.max(0, remainingStock)} remaining)
                                </span>
                              )}
                            </span>
                            {isLowStock && !isOutOfStock && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-secondary/30 text-secondary-foreground border-secondary"
                              >
                                Low Stock
                              </Badge>
                            )}
                            {isOutOfStock && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-destructive/10 text-destructive border-destructive/30"
                              >
                                Out of Stock
                              </Badge>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Items List */}
              {orderItems.length > 0 && (
                <div className="border rounded-lg p-4 space-y-2">
                  {orderItems.map((item, index) => {
                    const product = products.find(
                      (p) => p.id === item.productId,
                    );
                    const availableStock = product
                      ? getAvailableStock(
                          product,
                          item.warehouseSource!,
                          item.variantId,
                        )
                      : 0;

                    // Calculate total quantity of this product/variant in the order (for same warehouse)
                    const totalQuantityInOrder = orderItems
                      .filter(
                        (orderItem) =>
                          orderItem.productId === item.productId &&
                          orderItem.variantId === item.variantId &&
                          orderItem.warehouseSource === item.warehouseSource,
                      )
                      .reduce((sum, orderItem) => sum + orderItem.quantity, 0);

                    const hasStockIssue = totalQuantityInOrder > availableStock;

                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-4 p-2 rounded ${hasStockIssue ? "bg-destructive/10 border border-destructive/30" : "bg-secondary"}`}
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.size && `${item.size} - `}
                            {item.color} • {item.quantity}x ₱
                            {item.price.toFixed(2)}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {item.warehouseSource}
                            </Badge>
                            {hasStockIssue && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-destructive/10 text-destructive border-destructive/30"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Only {availableStock} available (Total in order:{" "}
                                {totalQuantityInOrder})
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="font-semibold">
                          ₱{(item.price * item.quantity).toFixed(2)}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Order Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Order Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value: any) => setPaymentMethod(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="gcash">GCash</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Delivery Method</Label>
                  <Select
                    value={deliveryMethod}
                    onValueChange={(value: any) => setDeliveryMethod(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="store-pickup">Store Pickup</SelectItem>
                      <SelectItem value="staff-delivery">
                        Staff Delivery
                      </SelectItem>
                      <SelectItem value="customer-arranged">
                        Customer Arranged
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {deliveryMethod === "staff-delivery" && (
                  <div className="space-y-2">
                    <Label>Delivery Fee</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(Number(e.target.value))}
                    />
                  </div>
                )}

                {paymentMethod !== "cash" && (
                  <>
                    <div className="space-y-2">
                      <Label>Account Name</Label>
                      <Input
                        value={paymentName}
                        onChange={(e) => setPaymentName(e.target.value)}
                        placeholder="Account holder name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Account No.</Label>
                      <Input
                        value={paymentPhone}
                        onChange={(e) => setPaymentPhone(e.target.value)}
                        placeholder="GCash number or Bank account number"
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label>Payment Reference Number</Label>
                      <Input
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="Transaction reference number"
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label>Transaction Details</Label>
                      <Textarea
                        value={transactionDetails}
                        onChange={(e) => setTransactionDetails(e.target.value)}
                        placeholder="Additional transaction details (e.g., Bank name for bank transfers)"
                        rows={2}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Payment Proof Upload for Digital Payments */}
              {paymentMethod !== "cash" && (
                <div className="space-y-2">
                  <Label>Payment Proof * (Required for verification)</Label>
                  <p className="text-xs text-muted-foreground">
                    Upload screenshot of payment confirmation (Max 5MB)
                  </p>
                  <div className="flex gap-2">
                    <input
                      id="paymentProof"
                      type="file"
                      accept="image/*"
                      onChange={handlePaymentProofUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("paymentProof")?.click()
                      }
                      className="flex-1 justify-start gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {paymentProof ? "Change Image" : "Upload Image"}
                    </Button>
                    {paymentProof && (
                      <>
                        <Dialog>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {}}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Payment Proof</DialogTitle>
                              <DialogDescription>
                                Preview of uploaded payment confirmation
                              </DialogDescription>
                            </DialogHeader>
                            <div className="max-h-[70vh] overflow-auto">
                              <img
                                src={paymentProof}
                                alt="Payment proof"
                                className="w-full h-auto"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setPaymentProof("")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  {paymentProof && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Image uploaded successfully
                    </p>
                  )}
                </div>
              )}

              {/* Reservation Option */}
              <Card
                className={
                  isReservation
                    ? "border-amber-300 bg-amber-50"
                    : "border-border"
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="isReservation"
                          checked={isReservation}
                          onChange={(e) => setIsReservation(e.target.checked)}
                          className="w-5 h-5 rounded border-2 border-amber-600 text-amber-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer"
                        />
                        <div>
                          <Label
                            htmlFor="isReservation"
                            className="cursor-pointer font-medium"
                          >
                            Reservation Order (Partial Payment)
                          </Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Enable partial payment for this order
                          </p>
                        </div>
                      </div>
                    </div>
                    {isReservation && (
                      <Badge
                        variant="outline"
                        className="bg-amber-100 text-amber-800 border-amber-300"
                      >
                        Active
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {isReservation && (
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-2">
                      <Label>Reservation Percentage</Label>
                      <Input
                        type="number"
                        min="1"
                        max="99"
                        value={reservationPercentage || ""}
                        onChange={(e) =>
                          setReservationPercentage(
                            e.target.value === "" ? 0 : Number(e.target.value),
                          )
                        }
                        className="border-amber-300 focus:border-amber-500 focus:ring-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-amber-200">
                      <p className="text-sm">
                        Customer will pay{" "}
                        <span className="font-semibold text-amber-700">
                          ₱{calculateReservationFee().toFixed(2)}
                        </span>{" "}
                        ({reservationPercentage}% of ₱
                        {calculateTotal().toFixed(2)})
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about this order..."
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Coupon Section */}
            {orderItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Apply Coupon
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setShowApplicableCoupons(!showApplicableCoupons)
                    }
                    className="gap-2"
                  >
                    <Percent className="h-3 w-3" />
                    {showApplicableCoupons ? "Hide" : "View"} Available Coupons
                    ({getApplicableCoupons.length})
                  </Button>
                </div>

                {/* Applied Coupon */}
                {appliedCoupon && (
                  <Card className="bg-accent/20 border-accent">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-accent-foreground text-accent">
                              {appliedCoupon.code}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {appliedCoupon.discountType === "percentage"
                                ? `${appliedCoupon.discountValue}% OFF`
                                : `₱${appliedCoupon.discountValue} OFF`}
                            </Badge>
                          </div>
                          <p className="text-sm">{appliedCoupon.description}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            You save: ₱{calculateCouponDiscount().toFixed(2)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveCoupon}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Apply Coupon Input */}
                {!appliedCoupon && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="gap-2"
                    >
                      <Tag className="h-4 w-4" />
                      Apply
                    </Button>
                  </div>
                )}

                {/* Available Coupons List */}
                {!appliedCoupon &&
                  showApplicableCoupons &&
                  getApplicableCoupons.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Available coupons for this order:
                      </p>
                      <div className="grid gap-2">
                        {getApplicableCoupons.map((coupon) => {
                          const discountAmount = calculateDiscount(
                            coupon,
                            calculateSubtotal(),
                          );
                          return (
                            <Card
                              key={coupon.id}
                              className="cursor-pointer hover:border-primary transition-colors"
                              onClick={() => handleSelectCoupon(coupon)}
                            >
                              <CardContent className="p-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge>{coupon.code}</Badge>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {coupon.discountType === "percentage"
                                        ? `${coupon.discountValue}% OFF`
                                        : `₱${coupon.discountValue} OFF`}
                                    </Badge>
                                  </div>
                                  <p className="text-sm">
                                    {coupon.description}
                                  </p>
                                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                                    <span>
                                      Min: ₱
                                      {coupon.minPurchase.toLocaleString(
                                        "en-PH",
                                        { minimumFractionDigits: 2 },
                                      )}
                                    </span>
                                    {coupon.maxDiscount && (
                                      <span>
                                        Max Discount: ₱
                                        {coupon.maxDiscount.toLocaleString(
                                          "en-PH",
                                          { minimumFractionDigits: 2 },
                                        )}
                                      </span>
                                    )}
                                    <span>
                                      Remaining:{" "}
                                      {coupon.usageLimit - coupon.usedCount}/
                                      {coupon.usageLimit}
                                    </span>
                                    <span>
                                      Exp:{" "}
                                      {new Date(
                                        coupon.expiryDate,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm mt-1">
                                    You'll save: ₱{discountAmount.toFixed(2)}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {!appliedCoupon &&
                  showApplicableCoupons &&
                  getApplicableCoupons.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No coupons available for this order. Add more items or
                      check the minimum purchase requirement.
                    </p>
                  )}
              </div>
            )}

            <Separator />

            {/* Order Summary */}
            {orderItems.length > 0 && (
              <div className="p-4 bg-secondary rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₱{calculateSubtotal().toFixed(2)}</span>
                </div>
                {deliveryMethod === "staff-delivery" && deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span>₱{deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount ({appliedCoupon.code}):</span>
                    <span>-₱{calculateCouponDiscount().toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>₱{calculateTotal().toFixed(2)}</span>
                </div>
                {isReservation && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Reservation Fee ({reservationPercentage}%):</span>
                    <span>₱{calculateReservationFee().toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateOrder}
                disabled={orderItems.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Edit Order Dialog
export function EditOrderDialog({
  order,
  onUpdateOrder,
}: {
  order: Order;
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
}) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<OrderItem[]>(order.items);
  const [deliveryFee, setDeliveryFee] = useState(order.deliveryFee || 0);

  // Shipping address
  const [firstName, setFirstName] = useState(
    order.shippingAddress?.firstName || "",
  );
  const [lastName, setLastName] = useState(
    order.shippingAddress?.lastName || "",
  );
  const [phone, setPhone] = useState(order.shippingAddress?.phone || "");
  const [address, setAddress] = useState(order.shippingAddress?.address || "");
  const [city, setCity] = useState(order.shippingAddress?.city || "");
  const [province, setProvince] = useState(order.shippingAddress?.state || "");
  const [barangay, setBarangay] = useState(
    order.shippingAddress?.barangay || "",
  );
  const [zipCode, setZipCode] = useState(order.shippingAddress?.zipCode || "");

  const updateQuantity = (index: number, newQuantity: number) => {
    const newItems = [...items];
    newItems[index].quantity = Math.max(1, newQuantity);
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      toast.error("Order must have at least one item");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + deliveryFee;
  };

  const handleSave = () => {
    const updates: Partial<Order> = {
      items: items,
      subtotal: calculateSubtotal(),
      deliveryFee: deliveryFee,
      total: calculateTotal(),
      shippingAddress: {
        firstName,
        lastName,
        phone,
        address,
        city,
        state: province,
        barangay,
        zipCode,
        country: order.shippingAddress?.country || "Philippines",
      },
      updatedAt: new Date().toISOString(),
    };

    onUpdateOrder(order.id, updates);

    // Add audit log
    if (user) {
      addAuditLog({
        actionType: "order_modified",
        performedBy: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: `${user.firstName} ${user.lastName}`,
        },
        targetEntity: {
          type: "order",
          id: order.id,
          name: order.id,
        },
        metadata: {
          orderNumber: order.id,
          notes: "Order details updated",
        },
      });
    }

    setIsOpen(false);
    toast.success("Order updated successfully");
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Edit className="h-4 w-4" />
        Edit Order
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order #{order.id}</DialogTitle>
            <DialogDescription>
              Modify order details, items, and customer information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Order Items */}
            <div className="space-y-4">
              <h3 className="font-semibold">Order Items</h3>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-secondary rounded-lg"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.size && `${item.size} - `}
                        {item.color}
                      </div>
                      <div className="text-sm">
                        ₱{item.price.toFixed(2)} each
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Qty:</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(index, Number(e.target.value))
                        }
                        className="w-20"
                      />
                    </div>
                    <div className="font-semibold min-w-[100px] text-right">
                      ₱{(item.price * item.quantity).toFixed(2)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Customer & Shipping Info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Customer & Shipping Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Street Address</Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Barangay</Label>
                  <Input
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Province</Label>
                  <Input
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Order Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Order Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {order.fulfillment === "delivery" && (
                  <div className="space-y-2">
                    <Label>Delivery Fee</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-secondary rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₱{calculateSubtotal().toFixed(2)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>₱{deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>₱{calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Delete Order Dialog
export function DeleteOrderDialog({
  order,
  onDeleteOrder,
}: {
  order: Order;
  onDeleteOrder: (orderId: string) => void;
}) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = () => {
    if (confirmText !== order.id) {
      toast.error("Please type the order ID correctly to confirm deletion");
      return;
    }

    onDeleteOrder(order.id);

    // Add audit log
    if (user) {
      addAuditLog({
        actionType: "order_cancelled",
        performedBy: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: `${user.firstName} ${user.lastName}`,
        },
        targetEntity: {
          type: "order",
          id: order.id,
          name: order.id,
        },
        metadata: {
          orderNumber: order.id,
          notes: "Order permanently deleted",
        },
      });
    }

    setIsOpen(false);
    setConfirmText("");
    toast.success("Order deleted successfully");
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Delete Order
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Order
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm">
                You are about to delete order <strong>{order.id}</strong> for{" "}
                <strong>
                  {order.shippingAddress?.firstName || "N/A"}{" "}
                  {order.shippingAddress?.lastName || ""}
                </strong>
                .
              </p>
              <p className="text-sm mt-2">
                Total: <strong>₱{order.total.toFixed(2)}</strong> •{" "}
                {order.items.length} item(s)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Type the order ID to confirm deletion:</Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={order.id}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={confirmText !== order.id}
              >
                Delete Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
