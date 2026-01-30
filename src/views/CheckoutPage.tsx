// @ts-nocheck
// TODO: Fix CartItem type mismatches
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import {
  Store,
  Truck,
  MapPin,
  Plus,
  Tag,
  X,
  Loader2,
  Upload,
} from "lucide-react";
import {
  validateCoupon,
  calculateDiscount,
  useCoupon,
  Coupon,
} from "../lib/coupons";
import {
  validateStockAvailability,
  allocateWarehouseSources,
} from "../lib/inventory";
import {
  validateName,
  validateEmail,
  validatePhoneNumber,
  validateAddress,
  validateCity,
  validatePostalCode,
  validateGCashNumber,
  validateGCashReference,
  validateBankAccount,
  formatPhoneNumber,
  sanitizeInput,
} from "../lib/validation";

export function CheckoutPage() {
  const router = useRouter();
  const { items, getCartTotal, clearCart, appliedCoupon, setAppliedCoupon } =
    useCart();
  const { isAuthenticated, placeOrder, user } = useAuth();

  // Prevent duplicate toast notifications
  const hasShownToast = useRef(false);

  // Redirect guests to login
  useEffect(() => {
    if (!isAuthenticated() && !hasShownToast.current) {
      hasShownToast.current = true;
      toast.info("Sign in required", {
        description: "Please sign in to complete your order.",
      });
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const defaultAddress = user?.addresses.find((addr) => addr.isDefault);
  const [selectedAddressId, setSelectedAddressId] = useState(
    defaultAddress?.id || "",
  );

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: "",
    barangay: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Philippines",
  });

  const [deliveryMethod, setDeliveryMethod] = useState<
    "store-pickup" | "customer-arranged"
  >("store-pickup");
  const [pickupDetails, setPickupDetails] = useState({
    pickupPerson: "",
    pickupPhone: "",
    deliveryService: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDetails, setPaymentDetails] = useState({
    gcashNumber: "",
    gcashReference: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    bankReference: "",
  });
  const [paymentProof, setPaymentProof] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [isCouponLoading, setIsCouponLoading] = useState(false);

  const subtotal = getCartTotal();
  const discount = appliedCoupon
    ? calculateDiscount(appliedCoupon, subtotal)
    : 0;
  const total = subtotal - discount;

  // Auto-fill billing address when default address is available on mount
  useEffect(() => {
    if (defaultAddress && user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        address: defaultAddress.address,
        barangay: defaultAddress.barangay,
        city: defaultAddress.city,
        state: defaultAddress.state,
        zipCode: defaultAddress.zipCode,
        country: defaultAddress.country,
      });
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: "" }));

    let processedValue = value;

    // Apply specific filtering based on field
    if (name === "firstName" || name === "lastName") {
      processedValue = value.replace(/[^A-Za-zÀ-ÿ\s'-]/g, "");
    } else if (name === "phone") {
      processedValue = value.replace(/[^0-9\s+-]/g, "");
      processedValue = processedValue.slice(0, 16); // +63 9XX XXX XXXX format (16 chars with spaces)
    } else if (name === "city" || name === "state") {
      processedValue = value.replace(/[^A-Za-zÀ-ÿ\s.-]/g, "");
    } else if (name === "zipCode") {
      processedValue = value.replace(/[^0-9]/g, "").slice(0, 4);
    } else if (name === "address") {
      processedValue = value.replace(/[^A-Za-z0-9\s.,#'-]/g, "");
    }

    setFormData({
      ...formData,
      [name]: processedValue,
    });
  };

  const handlePickupDetailsChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: "" }));

    let processedValue = value;

    if (name === "pickupPerson") {
      processedValue = value.replace(/[^A-Za-zÀ-ÿ\s'-]/g, "");
    } else if (name === "pickupPhone") {
      processedValue = value.replace(/[^0-9\s+-]/g, "");
      processedValue = processedValue.slice(0, 16); // +63 9XX XXX XXXX format (16 chars with spaces)
    }

    setPickupDetails({
      ...pickupDetails,
      [name]: processedValue,
    });
  };

  const handlePaymentDetailsChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: "" }));

    let processedValue = value;

    if (name === "gcashNumber") {
      // Allow +, numbers, spaces, and dashes for GCash number
      processedValue = value.replace(/[^0-9\s+-]/g, "");
      processedValue = processedValue.slice(0, 16); // +63 9XX XXX XXXX format (16 chars with spaces)
    } else if (name === "gcashReference") {
      // Only numbers, spaces, and dashes for reference number
      processedValue = value.replace(/[^0-9\s-]/g, "");
      processedValue = processedValue.slice(0, 13);
    } else if (name === "accountNumber") {
      processedValue = value.replace(/[^0-9]/g, "").slice(0, 4);
    } else if (name === "accountName") {
      processedValue = value.replace(/[^A-Za-zÀ-ÿ\s'-]/g, "");
    }

    setPaymentDetails({
      ...paymentDetails,
      [name]: processedValue,
    });
  };

  const handlePaymentProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Please upload a file smaller than 5MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProof(reader.result as string);
        setErrors((prev) => ({ ...prev, paymentProof: "" }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error("Coupon code required", {
        description: "Please enter a coupon code to apply.",
      });
      return;
    }

    setIsCouponLoading(true);
    const validation = validateCoupon(couponCode, subtotal);

    setTimeout(() => {
      if (validation.valid && validation.coupon) {
        setAppliedCoupon(validation.coupon);
        toast.success("Coupon applied successfully", {
          description: `₱${validation.coupon.discountValue} discount applied to your order.`,
        });
      } else {
        toast.error("Invalid coupon code", {
          description: "This coupon is expired, invalid, or already used.",
        });
      }
      setIsCouponLoading(false);
    }, 300);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.info("Coupon removed");
  };

  const handleAddressSelect = (addressId: string) => {
    if (addressId === "new") {
      setSelectedAddressId("new");
      // Navigate to Account page Addresses tab
      router.push("/account");
    } else {
      const address = user?.addresses.find((addr) => addr.id === addressId);
      if (address) {
        setSelectedAddressId(addressId);
        // Autofill all billing address fields
        setFormData({
          ...formData,
          firstName: address.firstName,
          lastName: address.lastName,
          phone: address.phone,
          address: address.address,
          barangay: address.barangay,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          country: address.country,
        });
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate contact information
    const firstNameVal = validateName(formData.firstName);
    if (!firstNameVal.valid) newErrors.firstName = firstNameVal.error || "";

    const lastNameVal = validateName(formData.lastName);
    if (!lastNameVal.valid) newErrors.lastName = lastNameVal.error || "";

    const emailVal = validateEmail(formData.email);
    if (!emailVal.valid) newErrors.email = emailVal.error || "";

    const phoneVal = validatePhoneNumber(formData.phone);
    if (!phoneVal.valid) newErrors.phone = phoneVal.error || "";

    // Validate pickup details
    const pickupPersonVal = validateName(pickupDetails.pickupPerson);
    if (!pickupPersonVal.valid)
      newErrors.pickupPerson = pickupPersonVal.error || "";

    const pickupPhoneVal = validatePhoneNumber(pickupDetails.pickupPhone);
    if (!pickupPhoneVal.valid)
      newErrors.pickupPhone = pickupPhoneVal.error || "";

    if (
      deliveryMethod === "customer-arranged" &&
      !pickupDetails.deliveryService.trim()
    ) {
      newErrors.deliveryService = "Please specify your delivery service";
    }

    // Validate billing address
    const addressVal = validateAddress(formData.address);
    if (!addressVal.valid) newErrors.address = addressVal.error || "";

    const barangayVal = validateCity(formData.barangay);
    if (!barangayVal.valid) newErrors.barangay = barangayVal.error || "";

    const cityVal = validateCity(formData.city);
    if (!cityVal.valid) newErrors.city = cityVal.error || "";

    const stateVal = validateCity(formData.state);
    if (!stateVal.valid) newErrors.state = stateVal.error || "";

    const zipVal = validatePostalCode(formData.zipCode);
    if (!zipVal.valid) newErrors.zipCode = zipVal.error || "";

    // Validate payment details
    if (paymentMethod === "gcash") {
      const gcashNumVal = validateGCashNumber(paymentDetails.gcashNumber);
      if (!gcashNumVal.valid) newErrors.gcashNumber = gcashNumVal.error || "";

      const gcashRefVal = validateGCashReference(paymentDetails.gcashReference);
      if (!gcashRefVal.valid)
        newErrors.gcashReference = gcashRefVal.error || "";

      if (!paymentProof) {
        newErrors.paymentProof =
          "Proof of payment screenshot is required for GCash payments";
      }
    }

    if (paymentMethod === "bank-transfer") {
      if (!paymentDetails.bankName.trim()) {
        newErrors.bankName = "Bank name is required";
      }

      const accountNameVal = validateName(paymentDetails.accountName);
      if (!accountNameVal.valid)
        newErrors.accountName = accountNameVal.error || "";

      const accountNumVal = validateBankAccount(paymentDetails.accountNumber);
      if (!accountNumVal.valid)
        newErrors.accountNumber = accountNumVal.error || "";

      if (!paymentDetails.bankReference.trim()) {
        newErrors.bankReference = "Bank reference number is required";
      }

      if (!paymentProof) {
        newErrors.paymentProof =
          "Proof of payment screenshot is required for Bank Transfer";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return; // Prevent double submission

    if (!isFormValid()) {
      return;
    }

    setIsLoading(true);

    try {
      // Validate stock availability
      const stockValidation = validateStockAvailability(
        items.map((item) => ({
          productId: item.id,
          variantId: item.selectedVariantId,
          quantity: item.quantity,
        })),
      );

      if (!stockValidation.success) {
        toast.error("Item out of stock", {
          description: "One or more items in your cart are no longer available.",
        });
        return;
      }

      // Allocate warehouse sources for items
      const allocation = allocateWarehouseSources(
        items.map((item) => ({
          productId: item.id,
          variantId: item.selectedVariantId,
          quantity: item.quantity,
        })),
      );

      if (!allocation.success) {
        toast.error("Order processing failed", {
          description: "Unable to process your order. Please try again.",
        });
        return;
      }

      // If user is not logged in, suggest creating an account
      if (!isAuthenticated()) {
        toast.info("Order placed successfully", {
          description: "Create an account to easily track your order status.",
        });
      }

      let orderId: string;

      if (isAuthenticated()) {
        // Map cart items to order items with warehouse sources
        const orderItems = items.map((item) => {
          // Find all allocations for this item
          const itemAllocations = allocation.allocatedItems.filter(
            (a) => a.productId === item.id && a.variantId === item.variantId,
          );

          // If multiple warehouses, use the first one (they'll be split in allocation)
          // For now, we'll combine them with preference to the warehouse with most stock
          const primaryAllocation = itemAllocations.sort(
            (a, b) => b.quantity - a.quantity,
          )[0];

          return {
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            color: item.selectedColor,
            size: item.selectedSize,
            imageUrl: item.imageUrl,
            variantId: item.selectedVariantId,
            warehouseSource: primaryAllocation?.warehouseSource, // Add warehouse source
          };
        });

        // Place order through auth context (will be saved)
        orderId = placeOrder({
          items: orderItems,
          subtotal,
          couponCode: appliedCoupon?.code,
          couponDiscount: discount,
          couponId: appliedCoupon?.id,
          total,
          deliveryMethod,
          pickupDetails: {
            pickupPerson: sanitizeInput(pickupDetails.pickupPerson),
            pickupPhone: formatPhoneNumber(pickupDetails.pickupPhone),
            deliveryService:
              deliveryMethod === "customer-arranged"
                ? sanitizeInput(pickupDetails.deliveryService)
                : undefined,
          },
          shippingAddress: {
            firstName: sanitizeInput(formData.firstName),
            lastName: sanitizeInput(formData.lastName),
            address: sanitizeInput(formData.address),
            barangay: sanitizeInput(formData.barangay),
            city: sanitizeInput(formData.city),
            state: sanitizeInput(formData.state),
            zipCode: formData.zipCode,
            country: formData.country,
            phone: formatPhoneNumber(formData.phone),
          },
          paymentMethod,
          paymentReference:
            paymentMethod === "gcash"
              ? paymentDetails.gcashReference
              : paymentMethod === "bank-transfer"
                ? paymentDetails.bankReference
                : undefined,
          paymentProof,
        });

        // Use coupon after successful order
        if (appliedCoupon) {
          useCoupon(appliedCoupon.id);
        }
      } else {
        // Guest checkout - just generate order ID
        orderId = "ORD-" + Date.now();
      }

      clearCart();
      setAppliedCoupon(null); // Clear coupon after order placement
      router.push(`/order-confirmation/${orderId}`);
    } catch (error) {
      toast.error("Order failed", {
        description: "We couldn't process your order. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2>Your cart is empty</h2>
          <Button onClick={() => router.push("/products")}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 lg:py-12">
      <div className="container max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-16">
        <h1 className="mb-8 lg:mb-12">Checkout</h1>

        {/* Guest Checkout Notice */}
        {!isAuthenticated() && (
          <Card className="mb-6 lg:mb-8 bg-secondary/30">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex-1">
                  <h4 className="mb-2">Checkout as Guest or Log In</h4>
                  <p className="text-muted-foreground">
                    Create an account to track your order and enjoy faster
                    checkouts in the future.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/login")}
                  >
                    Log In
                  </Button>
                  <Button onClick={() => router.push("/register")}>
                    Sign Up
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={errors.firstName ? "border-red-500" : ""}
                        placeholder="Juan"
                        required
                      />
                      {errors.firstName && (
                        <p className="text-xs text-red-500">
                          {errors.firstName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={errors.lastName ? "border-red-500" : ""}
                        placeholder="Dela Cruz"
                        required
                      />
                      {errors.lastName && (
                        <p className="text-xs text-red-500">
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={errors.email ? "border-red-500" : ""}
                      placeholder="juan.delacruz@example.com"
                      required
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={errors.phone ? "border-red-500" : ""}
                      placeholder="+63 932 549 0596"
                      required
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-500">{errors.phone}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Fulfillment Method</CardTitle>
                  <CardDescription>
                    Choose how you want to receive your order
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup
                    value={deliveryMethod}
                    onValueChange={(value) => setDeliveryMethod(value as any)}
                    name="deliveryMethod"
                  >
                    <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-secondary/50">
                      <RadioGroupItem value="store-pickup" id="store-pickup" />
                      <Label
                        htmlFor="store-pickup"
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <Store className="h-5 w-5 text-primary mt-1" />
                          <div>
                            <p>Store Pickup</p>
                            <p className="text-muted-foreground">
                              Pick up your order at our store location
                            </p>
                          </div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-secondary/50">
                      <RadioGroupItem
                        value="customer-arranged"
                        id="customer-arranged"
                      />
                      <Label
                        htmlFor="customer-arranged"
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <Truck className="h-5 w-5 text-primary mt-1" />
                          <div>
                            <p>Customer Arranged Delivery</p>
                            <p className="text-muted-foreground">
                              Arrange your own delivery service (Lalamove, Grab,
                              etc.)
                            </p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Pickup Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Pickup/Delivery Information</CardTitle>
                  <CardDescription>
                    {deliveryMethod === "store-pickup"
                      ? "Who will be picking up the order?"
                      : "Provide details for your delivery service"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pickupPerson">
                      {deliveryMethod === "store-pickup"
                        ? "Person Picking Up *"
                        : "Recipient Name *"}
                    </Label>
                    <Input
                      id="pickupPerson"
                      name="pickupPerson"
                      value={pickupDetails.pickupPerson}
                      onChange={handlePickupDetailsChange}
                      className={errors.pickupPerson ? "border-red-500" : ""}
                      placeholder="Full name"
                      required
                    />
                    {errors.pickupPerson && (
                      <p className="text-xs text-red-500">
                        {errors.pickupPerson}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pickupPhone">Contact Number *</Label>
                    <Input
                      id="pickupPhone"
                      name="pickupPhone"
                      type="tel"
                      value={pickupDetails.pickupPhone}
                      onChange={handlePickupDetailsChange}
                      className={errors.pickupPhone ? "border-red-500" : ""}
                      placeholder="+63 XXX XXX XXXX"
                      required
                    />
                    {errors.pickupPhone && (
                      <p className="text-xs text-red-500">
                        {errors.pickupPhone}
                      </p>
                    )}
                  </div>
                  {deliveryMethod === "customer-arranged" && (
                    <div className="space-y-2">
                      <Label htmlFor="deliveryService">
                        Delivery Service *
                      </Label>
                      <Input
                        id="deliveryService"
                        name="deliveryService"
                        value={pickupDetails.deliveryService}
                        onChange={handlePickupDetailsChange}
                        className={
                          errors.deliveryService ? "border-red-500" : ""
                        }
                        placeholder="e.g., Lalamove, Grab Express, etc."
                        required
                      />
                      {errors.deliveryService && (
                        <p className="text-xs text-red-500">
                          {errors.deliveryService}
                        </p>
                      )}
                    </div>
                  )}

                  {deliveryMethod === "store-pickup" && (
                    <div className="p-4 bg-secondary/30 rounded-lg">
                      <p className="mb-2">Store Location:</p>
                      <p className="text-muted-foreground">
                        PoyBash Furniture
                        <br />
                        1226 A. Lorenzo St.
                        <br />
                        Tondo, Manila
                        <br />
                        Open: Mon-Sat, 9AM-6PM
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Billing Address */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Billing Address</CardTitle>
                    {isAuthenticated() && user && user.addresses.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/account")}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Manage Addresses
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isAuthenticated() && user && user.addresses.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="savedAddress">Select Saved Address</Label>
                      <Select
                        value={selectedAddressId}
                        onValueChange={handleAddressSelect}
                      >
                        <SelectTrigger id="savedAddress">
                          <SelectValue placeholder="Choose an address" />
                        </SelectTrigger>
                        <SelectContent>
                          {user.addresses.map((addr) => (
                            <SelectItem key={addr.id} value={addr.id}>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>
                                  {addr.label} - {addr.address}, {addr.city}
                                  {addr.isDefault && " (Default)"}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                          <SelectItem value="new">
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              <span>Enter new address</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={errors.address ? "border-red-500" : ""}
                      placeholder="123 Main Street"
                      required
                    />
                    {errors.address && (
                      <p className="text-xs text-red-500">{errors.address}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="barangay">Barangay *</Label>
                      <Input
                        id="barangay"
                        name="barangay"
                        value={formData.barangay}
                        onChange={handleInputChange}
                        className={errors.barangay ? "border-red-500" : ""}
                        placeholder="Barangay Name"
                        required
                      />
                      {errors.barangay && (
                        <p className="text-xs text-red-500">
                          {errors.barangay}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={errors.city ? "border-red-500" : ""}
                        placeholder="Manila"
                        required
                      />
                      {errors.city && (
                        <p className="text-xs text-red-500">{errors.city}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state">Province *</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className={errors.state ? "border-red-500" : ""}
                        placeholder="Metro Manila"
                        required
                      />
                      {errors.state && (
                        <p className="text-xs text-red-500">{errors.state}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Postal Code *</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className={errors.zipCode ? "border-red-500" : ""}
                        placeholder="1000"
                        maxLength={4}
                        required
                      />
                      {errors.zipCode && (
                        <p className="text-xs text-red-500">{errors.zipCode}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      disabled
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    name="paymentMethod"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="cursor-pointer">
                        Cash on Pickup
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gcash" id="gcash" />
                      <Label htmlFor="gcash" className="cursor-pointer">
                        GCash
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="bank-transfer"
                        id="bank-transfer"
                      />
                      <Label htmlFor="bank-transfer" className="cursor-pointer">
                        Bank Transfer
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* GCash Payment Details */}
                  {paymentMethod === "gcash" && (
                    <div className="mt-4 p-4 border rounded-lg space-y-4 bg-secondary/20">
                      <h4>GCash Payment Details</h4>
                      <p className="text-muted-foreground">
                        Please send payment to:{" "}
                        <strong>+63 932 549 0596</strong> (PoyBash Furniture)
                      </p>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="gcashNumber">
                            Your GCash Number *
                          </Label>
                          <Input
                            id="gcashNumber"
                            name="gcashNumber"
                            value={paymentDetails.gcashNumber}
                            onChange={handlePaymentDetailsChange}
                            className={
                              errors.gcashNumber ? "border-red-500" : ""
                            }
                            placeholder="+63 XXX XXX XXXX"
                            required={paymentMethod === "gcash"}
                          />
                          {errors.gcashNumber && (
                            <p className="text-xs text-red-500">
                              {errors.gcashNumber}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gcashReference">
                            GCash Reference Number *
                          </Label>
                          <Input
                            id="gcashReference"
                            name="gcashReference"
                            value={paymentDetails.gcashReference}
                            onChange={handlePaymentDetailsChange}
                            className={
                              errors.gcashReference ? "border-red-500" : ""
                            }
                            placeholder="13-digit reference number"
                            required={paymentMethod === "gcash"}
                          />
                          {errors.gcashReference && (
                            <p className="text-xs text-red-500">
                              {errors.gcashReference}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Please provide the 13-digit reference number from
                            your GCash transaction
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paymentProof">
                            Proof of Payment Screenshot *
                          </Label>
                          <p className="text-muted-foreground text-xs mb-2">
                            Upload a screenshot of your GCash transaction (max
                            5MB)
                          </p>
                          <input
                            id="paymentProof"
                            type="file"
                            accept="image/*"
                            onChange={handlePaymentProofUpload}
                            className="hidden"
                            required={paymentMethod === "gcash"}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              document.getElementById("paymentProof")?.click()
                            }
                            className={`w-full justify-start gap-2 ${errors.paymentProof ? "border-red-500" : ""}`}
                          >
                            <Upload className="h-4 w-4" />
                            {paymentProof ? "Change Image" : "Upload Image"}
                          </Button>
                          {errors.paymentProof && (
                            <p className="text-xs text-red-500">
                              {errors.paymentProof}
                            </p>
                          )}
                          {paymentProof && (
                            <div className="mt-2 p-3 border rounded-lg bg-secondary/30 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Uploaded proof:
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setPaymentProof("")}
                                  className="h-auto py-1 px-2"
                                >
                                  Remove
                                </Button>
                              </div>
                              <img
                                src={paymentProof}
                                alt="Payment proof"
                                className="max-h-40 mx-auto rounded"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bank Transfer Payment Details */}
                  {paymentMethod === "bank-transfer" && (
                    <div className="mt-4 p-4 border rounded-lg space-y-4 bg-secondary/20">
                      <h4>Bank Transfer Details</h4>
                      <p className="text-muted-foreground">
                        Transfer to: <strong>BDO - 1234567890</strong> (PoyBash
                        Furniture Inc.)
                      </p>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="bankName">Your Bank Name *</Label>
                          <Input
                            id="bankName"
                            name="bankName"
                            value={paymentDetails.bankName}
                            onChange={handlePaymentDetailsChange}
                            className={errors.bankName ? "border-red-500" : ""}
                            placeholder="e.g., BDO, BPI, Metrobank"
                            required={paymentMethod === "bank-transfer"}
                          />
                          {errors.bankName && (
                            <p className="text-xs text-red-500">
                              {errors.bankName}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accountName">Account Name *</Label>
                          <Input
                            id="accountName"
                            name="accountName"
                            value={paymentDetails.accountName}
                            onChange={handlePaymentDetailsChange}
                            className={
                              errors.accountName ? "border-red-500" : ""
                            }
                            placeholder="Account holder name"
                            required={paymentMethod === "bank-transfer"}
                          />
                          {errors.accountName && (
                            <p className="text-xs text-red-500">
                              {errors.accountName}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accountNumber">
                            Account Number (last 4 digits) *
                          </Label>
                          <Input
                            id="accountNumber"
                            name="accountNumber"
                            value={paymentDetails.accountNumber}
                            onChange={handlePaymentDetailsChange}
                            className={
                              errors.accountNumber ? "border-red-500" : ""
                            }
                            placeholder="XXXX"
                            maxLength={4}
                            required={paymentMethod === "bank-transfer"}
                          />
                          {errors.accountNumber && (
                            <p className="text-xs text-red-500">
                              {errors.accountNumber}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bankReference">
                            Bank Reference Number *
                          </Label>
                          <Input
                            id="bankReference"
                            name="bankReference"
                            value={paymentDetails.bankReference}
                            onChange={handlePaymentDetailsChange}
                            className={
                              errors.bankReference ? "border-red-500" : ""
                            }
                            placeholder="Transaction reference number"
                            required={paymentMethod === "bank-transfer"}
                          />
                          {errors.bankReference && (
                            <p className="text-xs text-red-500">
                              {errors.bankReference}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            You can find this in your bank's transaction
                            confirmation
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paymentProofBank">
                            Proof of Payment Screenshot *
                          </Label>
                          <p className="text-muted-foreground text-xs mb-2">
                            Upload a screenshot of your bank transfer
                            transaction (max 5MB)
                          </p>
                          <input
                            id="paymentProofBank"
                            type="file"
                            accept="image/*"
                            onChange={handlePaymentProofUpload}
                            className="hidden"
                            required={paymentMethod === "bank-transfer"}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              document
                                .getElementById("paymentProofBank")
                                ?.click()
                            }
                            className={`w-full justify-start gap-2 ${errors.paymentProof ? "border-red-500" : ""}`}
                          >
                            <Upload className="h-4 w-4" />
                            {paymentProof ? "Change Image" : "Upload Image"}
                          </Button>
                          {errors.paymentProof && (
                            <p className="text-xs text-red-500">
                              {errors.paymentProof}
                            </p>
                          )}
                          {paymentProof && (
                            <div className="mt-2 p-3 border rounded-lg bg-secondary/30 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Uploaded proof:
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setPaymentProof("")}
                                  className="h-auto py-1 px-2"
                                >
                                  Remove
                                </Button>
                              </div>
                              <img
                                src={paymentProof}
                                alt="Payment proof"
                                className="max-h-40 mx-auto rounded"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {items.map((item) => (
                      <div
                        key={`${item.id}-${item.selectedColor}`}
                        className="flex gap-3"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{item.name}</p>
                          <p className="text-muted-foreground">
                            {item.selectedColor}
                            {item.selectedSize
                              ? ` • ${item.selectedSize}`
                              : ""}{" "}
                            × {item.quantity}
                          </p>
                          <p className="text-primary">
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
                    ))}
                  </div>

                  <Separator />

                  {/* Coupon Input */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        name="couponCode"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) =>
                          setCouponCode(e.target.value.toUpperCase())
                        }
                        disabled={!!appliedCoupon}
                        className="flex-1"
                      />
                      {!appliedCoupon ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={isCouponLoading || !couponCode.trim()}
                          className="gap-2"
                        >
                          {isCouponLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Tag className="h-4 w-4" />
                          )}
                          Apply
                        </Button>
                      ) : (
                        <Button
                          type="button"
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
                          {appliedCoupon.code} applied:{" "}
                          {appliedCoupon.description}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Subtotal</p>
                      <p>
                        ₱
                        {subtotal.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    {appliedCoupon && discount > 0 && (
                      <div className="flex justify-between">
                        <p className="text-green-600 dark:text-green-400">
                          Discount ({appliedCoupon.code})
                        </p>
                        <p className="text-green-600 dark:text-green-400">
                          -₱
                          {discount.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between">
                    <p>Total</p>
                    <p className="text-primary">
                      ₱
                      {total.toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing Order...
                      </>
                    ) : (
                      "Place Order"
                    )}
                  </Button>

                  <p className="text-muted-foreground text-center">
                    By placing your order, you agree to our terms and
                    conditions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
