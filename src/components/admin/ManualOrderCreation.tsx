// @ts-nocheck
// TODO: Fix type errors for optional warehouseStock property
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { PhoneInput } from "../PhoneInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import {
  Trash2,
  Save,
  Search,
  Upload,
  Printer,
  UserPlus,
  X,
  Tag,
  Eye,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getProducts,
  updateWarehouseStock,
  updateVariantStock,
  getVariantStock,
  type ProductVariant,
  type Product,
} from "../../lib/products";
import type { Order, OrderItem } from "@/models/Order";
import type { User } from "@/models/User";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import {
  validateName,
  validatePhoneNumber,
  validateAddress,
  validateCity,
  validatePostalCode,
  formatPhoneNumber,
  sanitizeInput,
} from "../../lib/validation";
import {
  getCoupons,
  validateCoupon,
  calculateDiscount,
} from "../../lib/coupons";
import type { Coupon } from "../../lib/coupons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { InvoiceReceipt } from "../InvoiceReceipt";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";

interface ManualOrderCreationProps {
  onCreateOrder: (
    order: Omit<Order, "id" | "userId" | "createdAt" | "updatedAt" | "status">,
    customerUserId?: string,
  ) => void;
}

export function ManualOrderCreation({
  onCreateOrder,
}: ManualOrderCreationProps) {
  // FIXED: Make products reactive to localStorage changes
  const [products, setProducts] = useState<Product[]>(() =>
    getProducts().filter((p) => p.active !== false),
  );

  // Reload products whenever localStorage changes (after stock updates)
  const reloadProducts = () => {
    setProducts(getProducts().filter((p) => p.active !== false));
  };

  //Load customers from localStorage
  const [customers, setCustomers] = useState<User[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("users");
    if (!stored) return [];
    const users = JSON.parse(stored);
    return users.filter((u: User) => u.role === "customer");
  });

  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    barangay: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Philippines",
  });
  const [deliveryMethod, setDeliveryMethod] = useState<
    "store-pickup" | "customer-arranged" | "staff-delivery"
  >("store-pickup");
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [pickupDetails, setPickupDetails] = useState({
    pickupPerson: "",
    pickupPhone: "",
    deliveryService: "",
  });
  const [billingAddress, setBillingAddress] = useState({
    firstName: "",
    lastName: "",
    address: "",
    barangay: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Philippines",
  });
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "gcash" | "bank-transfer"
  >("cash");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [paymentRecipient, setPaymentRecipient] = useState<string>("");
  const [paymentRecipientName, setPaymentRecipientName] = useState<string>("");
  const [paymentProof, setPaymentProof] = useState<string>("");
  const [isReservation, setIsReservation] = useState(false);
  const [reservationPercentage, setReservationPercentage] =
    useState<number>(30);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | "chairs" | "tables"
  >("all");
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");

  // FIXED: Reload products when component mounts and when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      reloadProducts();
    };

    // Listen for custom storage events (when stock is updated)
    window.addEventListener("storage", handleStorageChange);

    // Also listen for a custom event we'll dispatch when stock changes
    window.addEventListener("stockUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("stockUpdated", handleStorageChange);
    };
  }, []);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    if (productSearch) {
      const query = productSearch.toLowerCase().trim();
      const words = query.split(/\s+/);

      filtered = filtered.filter((p) => {
        const nameLower = p.name.toLowerCase();
        const subCategoryLower = p.subCategory.toLowerCase();
        const materialLower = p.material.toLowerCase();

        // Check if all search words appear in name, subcategory, or material
        return words.every(
          (word) =>
            nameLower.includes(word) ||
            subCategoryLower.includes(word) ||
            materialLower.includes(word),
        );
      });
    }

    return filtered;
  }, [products, categoryFilter, productSearch]);

  const handleAddProduct = (productId?: number) => {
    const product = productId
      ? products.find((p) => p.id === productId)
      : filteredProducts[0];

    if (!product) {
      toast.error("No products available");
      return;
    }

    let productPrice = product.price;
    let defaultWarehouse: "Lorenzo" | "Oroquieta" = "Lorenzo";
    let selectedVariant: ProductVariant | null = null;
    let selectedSize: string | undefined;
    let selectedColor: string = "Default";

    // NEW: Use variant system if available
    if (product.variants && product.variants.length > 0) {
      const activeVariants = product.variants.filter(
        (v) => v.active && getVariantStock(v) > 0,
      );

      if (activeVariants.length === 0) {
        toast.error("No variants available with stock");
        return;
      }

      // Use first available variant
      selectedVariant = activeVariants[0];
      productPrice = selectedVariant.price;
      selectedSize = selectedVariant.size || undefined;
      selectedColor = selectedVariant.color;

      // Determine warehouse with more stock for this variant
      const lorenzoStock = selectedVariant.warehouseStock.find(
        (w) => w.warehouse === "Lorenzo",
      );
      const oroquietaStock = selectedVariant.warehouseStock.find(
        (w) => w.warehouse === "Oroquieta",
      );
      const lorenzoAvailable =
        (lorenzoStock?.quantity || 0) - (lorenzoStock?.reserved || 0);
      const oroquietaAvailable =
        (oroquietaStock?.quantity || 0) - (oroquietaStock?.reserved || 0);
      defaultWarehouse =
        lorenzoAvailable >= oroquietaAvailable ? "Lorenzo" : "Oroquieta";
    }
    // LEGACY: Old system support
    else {
      let defaultSizeOption =
        product.sizeOptions && product.sizeOptions.length > 0
          ? product.sizeOptions[0]
          : null;

      if (defaultSizeOption) {
        productPrice = defaultSizeOption.price;
        selectedSize = defaultSizeOption.label;
      }

      const lorenzoStock = defaultSizeOption
        ? defaultSizeOption.warehouseStock.find(
            (w) => w.warehouse === "Lorenzo",
          )
        : product.warehouseStock?.find((w) => w.warehouse === "Lorenzo");
      const oroquietaStock = defaultSizeOption
        ? defaultSizeOption.warehouseStock.find(
            (w) => w.warehouse === "Oroquieta",
          )
        : product.warehouseStock?.find((w) => w.warehouse === "Oroquieta");
      const lorenzoAvailable =
        (lorenzoStock?.quantity || 0) - (lorenzoStock?.reserved || 0);
      const oroquietaAvailable =
        (oroquietaStock?.quantity || 0) - (oroquietaStock?.reserved || 0);
      defaultWarehouse =
        lorenzoAvailable >= oroquietaAvailable ? "Lorenzo" : "Oroquieta";

      // Legacy products without variants should display a generic color
      selectedColor = "Default";
    }

    const newItem: OrderItem = {
      productId: product.id,
      name: product.name,
      price: productPrice,
      quantity: 1,
      color: selectedColor,
      size: selectedSize,
      imageUrl: product.imageUrl,
      warehouseSource: defaultWarehouse,
      variantId: selectedVariant?.id, // NEW: Include variant ID
    };

    setOrderItems([...orderItems, newItem]);
    setIsSearchDialogOpen(false);
    setProductSearch("");
  };

  const handleRemoveProduct = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (
    index: number,
    field: keyof OrderItem,
    value: any,
  ) => {
    const updatedItems = [...orderItems];
    const currentItem = updatedItems[index];
    updatedItems[index] = { ...currentItem, [field]: value };

    const product = products.find((p) => p.id === currentItem.productId);
    if (!product) return;

    // NEW: If size or color is being updated, find matching variant and update price
    if (field === "size" || field === "color") {
      if (product.variants && product.variants.length > 0) {
        const size = field === "size" ? value : currentItem.size || null;
        const color = field === "color" ? value : currentItem.color;

        const matchingVariant = product.variants.find(
          (v) => v.size === size && v.color === color && v.active,
        );

        if (matchingVariant) {
          updatedItems[index].price = matchingVariant.price;
          updatedItems[index].variantId = matchingVariant.id;

          // Update warehouse to the one with more stock for this variant
          const lorenzoStock = matchingVariant.warehouseStock.find(
            (w) => w.warehouse === "Lorenzo",
          );
          const oroquietaStock = matchingVariant.warehouseStock.find(
            (w) => w.warehouse === "Oroquieta",
          );
          const lorenzoAvailable =
            (lorenzoStock?.quantity || 0) - (lorenzoStock?.reserved || 0);
          const oroquietaAvailable =
            (oroquietaStock?.quantity || 0) - (oroquietaStock?.reserved || 0);

          // Only auto-switch warehouse if current selection has no stock
          const currentWarehouse = currentItem.warehouseSource || "Lorenzo";
          const currentStock =
            currentWarehouse === "Lorenzo"
              ? lorenzoAvailable
              : oroquietaAvailable;

          if (currentStock <= 0) {
            updatedItems[index].warehouseSource =
              lorenzoAvailable > oroquietaAvailable ? "Lorenzo" : "Oroquieta";
          }
        } else {
          toast.error("Selected size/color combination not available");
          return;
        }
      }
      // LEGACY: Old system support
      else if (field === "size" && product.sizeOptions) {
        const selectedSize = product.sizeOptions.find((s) => s.label === value);
        if (selectedSize) {
          updatedItems[index].price = selectedSize.price;
        }
      }
    }

    setOrderItems(updatedItems);
  };

  const handleProductChange = (index: number, productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    let productPrice = product.price;
    let defaultWarehouse: "Lorenzo" | "Oroquieta" = "Lorenzo";
    let selectedVariant: ProductVariant | null = null;
    let selectedSize: string | undefined;
    let selectedColor: string = "Default";

    // NEW: Use variant system if available
    if (product.variants && product.variants.length > 0) {
      const activeVariants = product.variants.filter(
        (v) => v.active && getVariantStock(v) > 0,
      );

      if (activeVariants.length === 0) {
        toast.error("No variants available with stock for this product");
        return;
      }

      // Use first available variant
      selectedVariant = activeVariants[0];
      productPrice = selectedVariant.price;
      selectedSize = selectedVariant.size || undefined;
      selectedColor = selectedVariant.color;

      // Determine warehouse with more stock for this variant
      const lorenzoStock = selectedVariant.warehouseStock.find(
        (w) => w.warehouse === "Lorenzo",
      );
      const oroquietaStock = selectedVariant.warehouseStock.find(
        (w) => w.warehouse === "Oroquieta",
      );
      const lorenzoAvailable =
        (lorenzoStock?.quantity || 0) - (lorenzoStock?.reserved || 0);
      const oroquietaAvailable =
        (oroquietaStock?.quantity || 0) - (oroquietaStock?.reserved || 0);
      defaultWarehouse =
        lorenzoAvailable >= oroquietaAvailable ? "Lorenzo" : "Oroquieta";
    }
    // LEGACY: Old system support
    else {
      let defaultSizeOption =
        product.sizeOptions && product.sizeOptions.length > 0
          ? product.sizeOptions[0]
          : null;

      if (defaultSizeOption) {
        productPrice = defaultSizeOption.price;
        selectedSize = defaultSizeOption.label;
      }

      const lorenzoStock = defaultSizeOption
        ? defaultSizeOption.warehouseStock.find(
            (w) => w.warehouse === "Lorenzo",
          )
        : product.warehouseStock?.find((w) => w.warehouse === "Lorenzo");
      const oroquietaStock = defaultSizeOption
        ? defaultSizeOption.warehouseStock.find(
            (w) => w.warehouse === "Oroquieta",
          )
        : product.warehouseStock?.find((w) => w.warehouse === "Oroquieta");
      const lorenzoAvailable =
        (lorenzoStock?.quantity || 0) - (lorenzoStock?.reserved || 0);
      const oroquietaAvailable =
        (oroquietaStock?.quantity || 0) - (oroquietaStock?.reserved || 0);
      defaultWarehouse =
        lorenzoAvailable >= oroquietaAvailable ? "Lorenzo" : "Oroquieta";

      selectedColor = "Default";
    }

    const updatedItems = [...orderItems];
    updatedItems[index] = {
      ...updatedItems[index],
      productId: product.id,
      name: product.name,
      price: productPrice,
      color: selectedColor,
      size: selectedSize,
      imageUrl: product.imageUrl,
      warehouseSource: defaultWarehouse,
      variantId: selectedVariant?.id,
    };
    setOrderItems(updatedItems);
  };

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
      setErrors((prev) => ({ ...prev, paymentProof: "" }));
      toast.success("Payment proof uploaded successfully");
    };
    reader.readAsDataURL(file);
  };

  const calculateTotal = () => {
    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const couponDiscount = appliedCoupon
      ? calculateDiscount(appliedCoupon, subtotal)
      : 0;
    const afterDiscount = subtotal - couponDiscount;
    const total =
      afterDiscount + (deliveryMethod === "staff-delivery" ? deliveryFee : 0);
    return { subtotal, couponDiscount, total };
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    const { subtotal } = calculateTotal();
    const result = validateCoupon(couponCode.trim(), subtotal);

    if (result.valid && result.coupon) {
      setAppliedCoupon(result.coupon);
      setCouponError("");
      toast.success("Coupon applied successfully! 🎉", {
        description: `${result.coupon.description}`,
      });
    } else {
      setCouponError(result.error || "Invalid coupon");
      setAppliedCoupon(null);
      toast.error("Coupon not valid", {
        description: result.error,
      });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    toast.info("Coupon removed");
  };

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm) return customers;
    const search = customerSearchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.firstName.toLowerCase().includes(search) ||
        c.lastName.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        (c.phone && c.phone.toLowerCase().includes(search)),
    );
  }, [customers, customerSearchTerm]);

  // Handle customer selection
  const handleSelectCustomer = (customer: User) => {
    setSelectedCustomer(customer);

    // Find the default address or use the first address
    const defaultAddress =
      customer.addresses?.find((addr) => addr.isDefault) ||
      customer.addresses?.[0];

    setCustomerInfo({
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone || defaultAddress?.phone || "",
      address: defaultAddress?.address || "",
      barangay: defaultAddress?.barangay || "",
      city: defaultAddress?.city || "",
      state: defaultAddress?.state || "",
      zipCode: defaultAddress?.zipCode || "",
      country: defaultAddress?.country || "Philippines",
    });

    // Also update billing address if same address is checked
    if (useSameAddress) {
      setBillingAddress({
        firstName: customer.firstName,
        lastName: customer.lastName,
        address: defaultAddress?.address || "",
        barangay: defaultAddress?.barangay || "",
        city: defaultAddress?.city || "",
        state: defaultAddress?.state || "",
        zipCode: defaultAddress?.zipCode || "",
        country: defaultAddress?.country || "Philippines",
      });
    }

    // Clear all validation errors when customer is selected
    setErrors({});

    toast.success(
      `Customer ${customer.firstName} ${customer.lastName} selected`,
    );
  };

  // Handle clearing selected customer
  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerInfo({
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      barangay: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Philippines",
    });

    if (useSameAddress) {
      setBillingAddress({
        firstName: "",
        lastName: "",
        address: "",
        barangay: "",
        city: "",
        state: "",
        zipCode: "",
        country: "Philippines",
      });
    }

    toast.info("Customer cleared");
  };

  const handleCustomerInfoChange = (field: string, value: string) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));

    let processedValue = value;

    if (field === "firstName" || field === "lastName") {
      processedValue = value.replace(/[^A-Za-zÀ-ÿ\s'-]/g, "");
    } else if (field === "city" || field === "state") {
      processedValue = value.replace(/[^A-Za-zÀ-ÿ\s.-]/g, "");
    } else if (field === "zipCode") {
      processedValue = value.replace(/[^0-9]/g, "").slice(0, 4);
    } else if (field === "address") {
      processedValue = value.replace(/[^A-Za-z0-9\s.,#'-]/g, "");
    } else if (field === "phone") {
      processedValue = value.replace(/[^0-9\s+-]/g, "");
    }

    setCustomerInfo({ ...customerInfo, [field]: processedValue });

    // Sync with billing address if same address is checked
    if (useSameAddress) {
      setBillingAddress({ ...billingAddress, [field]: processedValue });
    }
  };

  const handleBillingAddressChange = (field: string, value: string) => {
    setErrors((prev) => ({
      ...prev,
      [`billing${field.charAt(0).toUpperCase() + field.slice(1)}`]: "",
    }));

    let processedValue = value;

    if (field === "firstName" || field === "lastName") {
      processedValue = value.replace(/[^A-Za-zÀ-ÿ\s'-]/g, "");
    } else if (field === "city" || field === "state") {
      processedValue = value.replace(/[^A-Za-zÀ-ÿ\s.-]/g, "");
    } else if (field === "zipCode") {
      processedValue = value.replace(/[^0-9]/g, "").slice(0, 4);
    } else if (field === "address") {
      processedValue = value.replace(/[^A-Za-z0-9\s.,#'-]/g, "");
    }

    setBillingAddress({ ...billingAddress, [field]: processedValue });
  };

  const handlePickupDetailsChange = (field: string, value: string) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));

    let processedValue = value;

    if (field === "pickupPerson") {
      processedValue = value.replace(/[^A-Za-zÀ-ÿ\s'-]/g, "");
    } else if (field === "pickupPhone") {
      processedValue = value.replace(/[^0-9\s+-]/g, "");
    }

    setPickupDetails({ ...pickupDetails, [field]: processedValue });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (orderItems.length === 0) {
      toast.error("Please add at least one product");
      return false;
    }

    // Validate stock availability
    for (const item of orderItems) {
      const product = products.find((p) => p.id === item.productId);
      if (product && item.warehouseSource) {
        const warehouse = product.warehouseStock.find(
          (w) => w.warehouse === item.warehouseSource,
        );
        if (warehouse) {
          const available = warehouse.quantity - warehouse.reserved;
          if (item.quantity > available) {
            toast.error(
              `Insufficient stock for ${item.name} in ${item.warehouseSource} warehouse. Available: ${available}`,
            );
            return false;
          }
        }
      }
    }

    const firstNameVal = validateName(customerInfo.firstName);
    if (!firstNameVal.valid) newErrors.firstName = firstNameVal.error || "";

    const lastNameVal = validateName(customerInfo.lastName);
    if (!lastNameVal.valid) newErrors.lastName = lastNameVal.error || "";

    const addressVal = validateAddress(customerInfo.address);
    if (!addressVal.valid) newErrors.address = addressVal.error || "";

    const barangayVal = validateCity(customerInfo.barangay);
    if (!barangayVal.valid) newErrors.barangay = barangayVal.error || "";

    const cityVal = validateCity(customerInfo.city);
    if (!cityVal.valid) newErrors.city = cityVal.error || "";

    const stateVal = validateCity(customerInfo.state);
    if (!stateVal.valid) newErrors.state = stateVal.error || "";

    const zipVal = validatePostalCode(customerInfo.zipCode);
    if (!zipVal.valid) newErrors.zipCode = zipVal.error || "";

    const phoneVal = validatePhoneNumber(customerInfo.phone);
    if (!phoneVal.valid) newErrors.phone = phoneVal.error || "";

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
      newErrors.deliveryService = "Please specify delivery service";
    }

    // Validate billing address if not using same address and delivery method is staff-delivery
    if (deliveryMethod === "staff-delivery" && !useSameAddress) {
      const billingFirstNameVal = validateName(billingAddress.firstName);
      if (!billingFirstNameVal.valid)
        newErrors.billingFirstName = billingFirstNameVal.error || "";

      const billingLastNameVal = validateName(billingAddress.lastName);
      if (!billingLastNameVal.valid)
        newErrors.billingLastName = billingLastNameVal.error || "";

      const billingAddressVal = validateAddress(billingAddress.address);
      if (!billingAddressVal.valid)
        newErrors.billingAddress = billingAddressVal.error || "";

      const billingBarangayVal = validateCity(billingAddress.barangay);
      if (!billingBarangayVal.valid)
        newErrors.billingBarangay = billingBarangayVal.error || "";

      const billingCityVal = validateCity(billingAddress.city);
      if (!billingCityVal.valid)
        newErrors.billingCity = billingCityVal.error || "";

      const billingStateVal = validateCity(billingAddress.state);
      if (!billingStateVal.valid)
        newErrors.billingState = billingStateVal.error || "";

      const billingZipVal = validatePostalCode(billingAddress.zipCode);
      if (!billingZipVal.valid)
        newErrors.billingZipCode = billingZipVal.error || "";
    }

    // FIXED: Payment proof is ALWAYS required for manual orders (all payment methods)
    if (!paymentProof) {
      newErrors.paymentProof =
        "Payment proof screenshot is required for all manual orders (Max 5MB)";
    }

    // Additional validation for digital payment methods
    if (paymentMethod === "gcash" || paymentMethod === "bank-transfer") {
      if (!paymentReference.trim()) {
        newErrors.paymentReference = "Payment reference number is required";
      }
      if (!paymentRecipient.trim()) {
        newErrors.paymentRecipient =
          paymentMethod === "gcash"
            ? "GCash number is required"
            : "Bank account number is required";
      }
      if (!paymentRecipientName.trim()) {
        newErrors.paymentRecipientName = "Account holder name is required";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the errors in the form");
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const { subtotal, couponDiscount, total } = calculateTotal();

    const finalBillingAddress = useSameAddress
      ? {
          firstName: sanitizeInput(customerInfo.firstName),
          lastName: sanitizeInput(customerInfo.lastName),
          address: sanitizeInput(customerInfo.address),
          barangay: sanitizeInput(customerInfo.barangay),
          city: sanitizeInput(customerInfo.city),
          state: sanitizeInput(customerInfo.state),
          zipCode: customerInfo.zipCode,
          country: customerInfo.country,
        }
      : {
          firstName: sanitizeInput(billingAddress.firstName),
          lastName: sanitizeInput(billingAddress.lastName),
          address: sanitizeInput(billingAddress.address),
          barangay: sanitizeInput(billingAddress.barangay),
          city: sanitizeInput(billingAddress.city),
          state: sanitizeInput(billingAddress.state),
          zipCode: billingAddress.zipCode,
          country: billingAddress.country,
        };

    const reservationFee = isReservation
      ? total * (reservationPercentage / 100)
      : undefined;

    const order: Omit<
      Order,
      "id" | "userId" | "createdAt" | "updatedAt" | "status"
    > = {
      items: orderItems,
      subtotal,
      couponCode: appliedCoupon?.code,
      couponDiscount: couponDiscount > 0 ? couponDiscount : undefined,
      deliveryFee:
        deliveryMethod === "staff-delivery" ? deliveryFee : undefined,
      reservationFee,
      reservationPercentage: isReservation ? reservationPercentage : undefined,
      total,
      deliveryMethod,
      deliveryStatus:
        deliveryMethod === "staff-delivery" ? "preparing" : undefined,
      pickupDetails: {
        pickupPerson: sanitizeInput(pickupDetails.pickupPerson),
        pickupPhone: formatPhoneNumber(pickupDetails.pickupPhone),
        deliveryService: pickupDetails.deliveryService
          ? sanitizeInput(pickupDetails.deliveryService)
          : undefined,
      },
      shippingAddress: {
        firstName: sanitizeInput(customerInfo.firstName),
        lastName: sanitizeInput(customerInfo.lastName),
        address: sanitizeInput(customerInfo.address),
        barangay: sanitizeInput(customerInfo.barangay),
        city: sanitizeInput(customerInfo.city),
        state: sanitizeInput(customerInfo.state),
        zipCode: customerInfo.zipCode,
        country: customerInfo.country,
        phone: formatPhoneNumber(customerInfo.phone), // Added customer phone
      },
      billingAddress:
        deliveryMethod === "staff-delivery" ? finalBillingAddress : undefined,
      paymentMethod,
      paymentReference: paymentReference || undefined,
      paymentRecipient: paymentRecipient || undefined,
      paymentRecipientName: paymentRecipientName || undefined,
      paymentProof: paymentProof || undefined,
    };

    onCreateOrder(order, selectedCustomer?.id);

    // FIXED: Reload products after order creation to reflect stock changes
    setTimeout(() => {
      reloadProducts();
    }, 100);

    // If this is a reservation, update inventory reserved quantities based on selected warehouse
    if (isReservation) {
      orderItems.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (product && item.warehouseSource) {
          // NEW: Handle variant-based stock reservation
          if (item.variantId && product.variants) {
            const variant = product.variants.find(
              (v) => v.id === item.variantId,
            );
            if (variant) {
              const warehouse = variant.warehouseStock.find(
                (ws) => ws.warehouse === item.warehouseSource,
              );
              if (warehouse) {
                const availableToReserve =
                  warehouse.quantity - warehouse.reserved;
                if (item.quantity <= availableToReserve) {
                  updateVariantStock(
                    product.id,
                    item.variantId,
                    item.warehouseSource,
                    warehouse.quantity,
                    warehouse.reserved + item.quantity,
                  );
                } else {
                  toast.error(
                    `Insufficient stock in ${item.warehouseSource} warehouse for ${product.name} (${variant.size || ""} ${variant.color})`,
                  );
                }
              }
            }
          }
          // LEGACY: Old system support
          else {
            const warehouse = product.warehouseStock?.find(
              (ws) => ws.warehouse === item.warehouseSource,
            );
            if (warehouse) {
              const availableToReserve =
                warehouse.quantity - warehouse.reserved;
              if (item.quantity <= availableToReserve) {
                updateWarehouseStock(
                  product.id,
                  item.warehouseSource,
                  warehouse.quantity,
                  warehouse.reserved + item.quantity,
                  item.size,
                );
              } else {
                toast.error(
                  `Insufficient stock in ${item.warehouseSource} warehouse for ${product.name}`,
                );
              }
            }
          }
        }
      });
    }

    // Generate order ID for invoice (will be replaced by actual ID in parent)
    const orderId = "ORD-" + Date.now();
    setCreatedOrderId(orderId);

    // Reset form
    setOrderItems([]);
    setSelectedCustomer(null);
    setCustomerSearchTerm("");
    setCustomerInfo({
      firstName: "",
      lastName: "",
      phone: "", // Added phone field
      address: "",
      barangay: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Philippines",
    });
    setPickupDetails({
      pickupPerson: "",
      pickupPhone: "",
      deliveryService: "",
    });
    setBillingAddress({
      firstName: "",
      lastName: "",
      address: "",
      barangay: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Philippines",
    });
    setUseSameAddress(true);
    setDeliveryFee(0);
    setDeliveryMethod("store-pickup");
    setPaymentReference("");
    setPaymentRecipient("");
    setPaymentRecipientName("");
    setPaymentProof("");
    setNotes("");
    setIsReservation(false);
    setReservationPercentage(30);
    setCouponCode("");
    setAppliedCoupon(null);
    setCouponError("");

    // Don't show toast here - it's handled by the parent component

    // Show option to print invoice
    setShowInvoice(true);
  };

  const handlePrintInvoice = () => {
    if (createdOrderId) {
      window.print();
    }
  };

  const { subtotal, couponDiscount, total } = calculateTotal();

  return (
    <div className="space-y-6">
      {/* Order Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Order Items</Label>
          <Button onClick={() => setIsSearchDialogOpen(true)} size="sm">
            Search & Add Product
          </Button>
        </div>

        {orderItems.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
            No products added. Click "Search & Add Product" to start building
            the order.
          </div>
        ) : (
          <div className="space-y-4">
            {orderItems.map((item, index) => {
              const product = products.find((p) => p.id === item.productId);

              // NEW: Get stock from specific variant if available
              let lorenzoStock, oroquietaStock;
              if (item.variantId && product?.variants) {
                const variant = product.variants.find(
                  (v) => v.id === item.variantId,
                );
                if (variant) {
                  lorenzoStock = variant.warehouseStock.find(
                    (w) => w.warehouse === "Lorenzo",
                  );
                  oroquietaStock = variant.warehouseStock.find(
                    (w) => w.warehouse === "Oroquieta",
                  );
                }
              } else {
                // LEGACY: Fall back to product-level stock
                lorenzoStock = product?.warehouseStock.find(
                  (w) => w.warehouse === "Lorenzo",
                );
                oroquietaStock = product?.warehouseStock.find(
                  (w) => w.warehouse === "Oroquieta",
                );
              }

              return (
                <div
                  key={index}
                  className="flex gap-4 p-4 border rounded-lg text-sm"
                >
                  <div className="w-20 h-20 rounded overflow-hidden bg-secondary flex-shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`product-${index}`} className="text-xs">
                          Product
                        </Label>
                        <Select
                          value={item.productId.toString()}
                          onValueChange={(value) =>
                            handleProductChange(index, parseInt(value))
                          }
                        >
                          <SelectTrigger
                            id={`product-${index}`}
                            className="text-sm h-9"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id.toString()}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label
                          htmlFor={`warehouse-${index}`}
                          className="text-xs"
                        >
                          Warehouse
                        </Label>
                        <Select
                          value={item.warehouseSource || "Lorenzo"}
                          onValueChange={(value) =>
                            handleUpdateItem(index, "warehouseSource", value)
                          }
                        >
                          <SelectTrigger
                            id={`warehouse-${index}`}
                            className="text-sm h-9"
                          >
                            <SelectValue>
                              {item.warehouseSource || "Lorenzo"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Lorenzo">
                              Lorenzo (
                              {(lorenzoStock?.quantity || 0) -
                                (lorenzoStock?.reserved || 0)}{" "}
                              available)
                            </SelectItem>
                            <SelectItem value="Oroquieta">
                              Oroquieta (
                              {(oroquietaStock?.quantity || 0) -
                                (oroquietaStock?.reserved || 0)}{" "}
                              available)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Row 2: Size/Color or Color only */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* NEW: Variant-based selectors */}
                      {product?.variants && product.variants.length > 0 ? (
                        <>
                          {/* Size selector - only show if product has size variations */}
                          {product.variants.some((v) => v.size !== null) ? (
                            <div>
                              <Label
                                htmlFor={`size-${index}`}
                                className="text-xs"
                              >
                                Size
                              </Label>
                              <Select
                                value={item.size || ""}
                                onValueChange={(value) =>
                                  handleUpdateItem(index, "size", value)
                                }
                              >
                                <SelectTrigger
                                  id={`size-${index}`}
                                  className="text-sm h-9"
                                >
                                  <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from(
                                    new Set(
                                      product.variants
                                        .filter(
                                          (v) => v.active && v.size !== null,
                                        )
                                        .map((v) => v.size),
                                    ),
                                  ).map((size) => (
                                    <SelectItem key={size!} value={size!}>
                                      {size}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div></div>
                          )}
                          {/* Color selector */}
                          <div>
                            <Label
                              htmlFor={`color-${index}`}
                              className="text-xs"
                            >
                              Color
                            </Label>
                            <Select
                              value={item.color}
                              onValueChange={(value) =>
                                handleUpdateItem(index, "color", value)
                              }
                            >
                              <SelectTrigger
                                id={`color-${index}`}
                                className="text-sm h-9"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from(
                                  new Set(
                                    product.variants
                                      .filter((v) => v.active)
                                      .map((v) => v.color),
                                  ),
                                ).map((color) => (
                                  <SelectItem key={color} value={color}>
                                    {color}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* LEGACY: Old system */}
                          {product?.sizeOptions &&
                          product.sizeOptions.length > 0 ? (
                            <div>
                              <Label
                                htmlFor={`size-${index}`}
                                className="text-xs"
                              >
                                Size
                              </Label>
                              <Select
                                value={
                                  item.size || product.sizeOptions[0].label
                                }
                                onValueChange={(value) =>
                                  handleUpdateItem(index, "size", value)
                                }
                              >
                                <SelectTrigger
                                  id={`size-${index}`}
                                  className="text-sm h-9"
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {product.sizeOptions.map((size) => (
                                    <SelectItem
                                      key={size.label}
                                      value={size.label}
                                    >
                                      {size.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div></div>
                          )}
                          <div>
                            <Label className="text-xs">Color</Label>
                            <div className="text-sm h-9 px-3 py-2 border rounded-md bg-muted">
                              {item.color || "Default"}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Row 3: Quantity and Price */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor={`quantity-${index}`}
                          className="text-xs"
                        >
                          Quantity
                        </Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(
                              index,
                              "quantity",
                              parseInt(e.target.value) || 1,
                            )
                          }
                          className="text-sm h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unit Price</Label>
                        <div className="text-sm h-9 px-3 py-2 border rounded-md bg-muted font-medium">
                          ₱{item.price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between min-w-[100px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveProduct(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">
                        Total
                      </p>
                      <p className="font-medium">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Information */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Customer Information</Label>
          {selectedCustomer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCustomer}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Customer
            </Button>
          )}
        </div>

        {/* Customer Selector */}
        {!selectedCustomer ? (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Select an existing customer or create a new one
                  </p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers by name, email, or phone..."
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {customerSearchTerm && filteredCustomers.length > 0 && (
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-3 hover:bg-secondary cursor-pointer border-b last:border-b-0 transition-colors"
                        onClick={() => {
                          handleSelectCustomer(customer);
                          setCustomerSearchTerm("");
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">
                              {customer.firstName} {customer.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {customer.email}
                            </p>
                            {customer.phone && (
                              <p className="text-sm text-muted-foreground">
                                {customer.phone}
                              </p>
                            )}
                            {customer.address && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {customer.address}, {customer.city}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">Select</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {customerSearchTerm && filteredCustomers.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No customers found. Fill in the form below to create a new
                    order.
                  </div>
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
                    <Badge variant="default" className="bg-accent-foreground text-accent">
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
                  {selectedCustomer.address && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedCustomer.address}, {selectedCustomer.city},{" "}
                      {selectedCustomer.state} {selectedCustomer.zipCode}
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

        {/* Customer Information Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" className="mb-1.5 block">
              First Name *
            </Label>
            <Input
              id="firstName"
              value={customerInfo.firstName}
              onChange={(e) =>
                handleCustomerInfoChange("firstName", e.target.value)
              }
              className={errors.firstName ? "border-red-500" : ""}
              placeholder="Juan"
              disabled={!!selectedCustomer}
            />
            {errors.firstName && (
              <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
            )}
          </div>
          <div>
            <Label htmlFor="lastName" className="mb-1.5 block">
              Last Name *
            </Label>
            <Input
              id="lastName"
              value={customerInfo.lastName}
              onChange={(e) =>
                handleCustomerInfoChange("lastName", e.target.value)
              }
              className={errors.lastName ? "border-red-500" : ""}
              placeholder="Dela Cruz"
              disabled={!!selectedCustomer}
            />
            {errors.lastName && (
              <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>
        <div>
          <Label htmlFor="address" className="mb-1.5 block">
            Street Address *
          </Label>
          <Input
            id="address"
            value={customerInfo.address}
            onChange={(e) =>
              handleCustomerInfoChange("address", e.target.value)
            }
            className={errors.address ? "border-red-500" : ""}
            placeholder="123 Main Street"
            disabled={!!selectedCustomer}
          />
          {errors.address && (
            <p className="text-xs text-red-500 mt-1">{errors.address}</p>
          )}
        </div>
        <div>
          <Label htmlFor="barangay" className="mb-1.5 block">
            Barangay *
          </Label>
          <Input
            id="barangay"
            value={customerInfo.barangay}
            onChange={(e) =>
              handleCustomerInfoChange("barangay", e.target.value)
            }
            className={errors.barangay ? "border-red-500" : ""}
            placeholder="Barangay Name"
            disabled={!!selectedCustomer}
          />
          {errors.barangay && (
            <p className="text-xs text-red-500 mt-1">{errors.barangay}</p>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city" className="mb-1.5 block">
              City *
            </Label>
            <Input
              id="city"
              value={customerInfo.city}
              onChange={(e) => handleCustomerInfoChange("city", e.target.value)}
              className={errors.city ? "border-red-500" : ""}
              placeholder="Manila"
              disabled={!!selectedCustomer}
            />
            {errors.city && (
              <p className="text-xs text-red-500 mt-1">{errors.city}</p>
            )}
          </div>
          <div>
            <Label htmlFor="state" className="mb-1.5 block">
              Province *
            </Label>
            <Input
              id="state"
              value={customerInfo.state}
              onChange={(e) =>
                handleCustomerInfoChange("state", e.target.value)
              }
              className={errors.state ? "border-red-500" : ""}
              placeholder="Metro Manila"
              disabled={!!selectedCustomer}
            />
            {errors.state && (
              <p className="text-xs text-red-500 mt-1">{errors.state}</p>
            )}
          </div>
          <div>
            <Label htmlFor="zipCode" className="mb-1.5 block">
              Postal Code *
            </Label>
            <Input
              id="zipCode"
              value={customerInfo.zipCode}
              onChange={(e) =>
                handleCustomerInfoChange("zipCode", e.target.value)
              }
              className={errors.zipCode ? "border-red-500" : ""}
              placeholder="1000"
              maxLength={4}
              disabled={!!selectedCustomer}
            />
            {errors.zipCode && (
              <p className="text-xs text-red-500 mt-1">{errors.zipCode}</p>
            )}
          </div>
        </div>
        <PhoneInput
          id="phone"
          label="Phone Number"
          value={customerInfo.phone}
          onChange={(value) => handleCustomerInfoChange("phone", value)}
          error={errors.phone}
          required
          placeholder="932 549 0596"
        />
      </div>

      {/* Delivery Method */}
      <div className="space-y-4">
        <Label className="mb-1.5 block">Delivery Method</Label>
        <Select
          value={deliveryMethod}
          onValueChange={(value: any) => setDeliveryMethod(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="store-pickup">Store Pickup</SelectItem>
            <SelectItem value="customer-arranged">
              Customer Arranged Delivery
            </SelectItem>
            <SelectItem value="staff-delivery">
              Staff Delivery (Facebook Order)
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {deliveryMethod === "staff-delivery" &&
            "For Facebook inquiries with staff-arranged delivery"}
        </p>
      </div>

      {/* Delivery Fee - Only for staff delivery */}
      {deliveryMethod === "staff-delivery" && (
        <div className="space-y-2">
          <Label htmlFor="deliveryFee" className="mb-1.5 block">
            Delivery Fee (₱) *
          </Label>
          <Input
            id="deliveryFee"
            value={deliveryFee || ""}
            onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
          <p className="text-sm text-muted-foreground">
            Enter the negotiated delivery fee for this order
          </p>
        </div>
      )}

      {/* Pickup/Contact Details */}
      <div className="space-y-4">
        <Label>Pickup/Contact Details</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pickupPerson" className="mb-1.5 block">
              Contact Person *
            </Label>
            <Input
              id="pickupPerson"
              value={pickupDetails.pickupPerson}
              onChange={(e) =>
                handlePickupDetailsChange("pickupPerson", e.target.value)
              }
              className={errors.pickupPerson ? "border-red-500" : ""}
              placeholder="Juan Dela Cruz"
            />
            {errors.pickupPerson && (
              <p className="text-xs text-red-500 mt-1">{errors.pickupPerson}</p>
            )}
          </div>
          <PhoneInput
            id="pickupPhone"
            label="Contact Phone"
            value={pickupDetails.pickupPhone}
            onChange={(value) =>
              handlePickupDetailsChange("pickupPhone", value)
            }
            error={errors.pickupPhone}
            required
            placeholder="932 549 0596"
          />
        </div>
        {deliveryMethod === "customer-arranged" && (
          <div>
            <Label htmlFor="deliveryService" className="mb-1.5 block">
              Delivery Service *
            </Label>
            <Input
              id="deliveryService"
              value={pickupDetails.deliveryService}
              onChange={(e) =>
                handlePickupDetailsChange("deliveryService", e.target.value)
              }
              className={errors.deliveryService ? "border-red-500" : ""}
              placeholder="e.g., Lalamove, Grab Express"
            />
            {errors.deliveryService && (
              <p className="text-xs text-red-500 mt-1">
                {errors.deliveryService}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Billing Address - Only for staff delivery */}
      {deliveryMethod === "staff-delivery" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Billing Address</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id="useSameAddress"
                checked={useSameAddress}
                onCheckedChange={(checked) => {
                  setUseSameAddress(checked as boolean);
                  if (checked) {
                    setBillingAddress({
                      firstName: customerInfo.firstName,
                      lastName: customerInfo.lastName,
                      address: customerInfo.address,
                      barangay: customerInfo.barangay,
                      city: customerInfo.city,
                      state: customerInfo.state,
                      zipCode: customerInfo.zipCode,
                      country: customerInfo.country,
                    });
                  }
                }}
              />
              <Label htmlFor="useSameAddress" className="cursor-pointer">
                Same as shipping address
              </Label>
            </div>
          </div>

          {!useSameAddress && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billingFirstName" className="mb-1.5 block">
                    First Name *
                  </Label>
                  <Input
                    id="billingFirstName"
                    value={billingAddress.firstName}
                    onChange={(e) =>
                      handleBillingAddressChange("firstName", e.target.value)
                    }
                    className={errors.billingFirstName ? "border-red-500" : ""}
                    placeholder="Juan"
                  />
                  {errors.billingFirstName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.billingFirstName}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="billingLastName" className="mb-1.5 block">
                    Last Name *
                  </Label>
                  <Input
                    id="billingLastName"
                    value={billingAddress.lastName}
                    onChange={(e) =>
                      handleBillingAddressChange("lastName", e.target.value)
                    }
                    className={errors.billingLastName ? "border-red-500" : ""}
                    placeholder="Dela Cruz"
                  />
                  {errors.billingLastName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.billingLastName}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="billingAddress" className="mb-1.5 block">
                  Street Address *
                </Label>
                <Input
                  id="billingAddress"
                  value={billingAddress.address}
                  onChange={(e) =>
                    handleBillingAddressChange("address", e.target.value)
                  }
                  className={errors.billingAddress ? "border-red-500" : ""}
                  placeholder="123 Main Street"
                />
                {errors.billingAddress && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.billingAddress}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="billingBarangay" className="mb-1.5 block">
                  Barangay *
                </Label>
                <Input
                  id="billingBarangay"
                  value={billingAddress.barangay}
                  onChange={(e) =>
                    handleBillingAddressChange("barangay", e.target.value)
                  }
                  className={errors.billingBarangay ? "border-red-500" : ""}
                  placeholder="Barangay Name"
                />
                {errors.billingBarangay && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.billingBarangay}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="billingCity" className="mb-1.5 block">
                    City *
                  </Label>
                  <Input
                    id="billingCity"
                    value={billingAddress.city}
                    onChange={(e) =>
                      handleBillingAddressChange("city", e.target.value)
                    }
                    className={errors.billingCity ? "border-red-500" : ""}
                    placeholder="Manila"
                  />
                  {errors.billingCity && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.billingCity}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="billingState" className="mb-1.5 block">
                    Province *
                  </Label>
                  <Input
                    id="billingState"
                    value={billingAddress.state}
                    onChange={(e) =>
                      handleBillingAddressChange("state", e.target.value)
                    }
                    className={errors.billingState ? "border-red-500" : ""}
                    placeholder="Metro Manila"
                  />
                  {errors.billingState && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.billingState}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="billingZipCode" className="mb-1.5 block">
                    Postal Code *
                  </Label>
                  <Input
                    id="billingZipCode"
                    value={billingAddress.zipCode}
                    onChange={(e) =>
                      handleBillingAddressChange("zipCode", e.target.value)
                    }
                    className={errors.billingZipCode ? "border-red-500" : ""}
                    placeholder="1000"
                    maxLength={4}
                  />
                  {errors.billingZipCode && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.billingZipCode}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Payment Method */}
      <div className="space-y-4">
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
            <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
          </SelectContent>
        </Select>

        {/* Payment Details for Digital Payments */}
        {(paymentMethod === "gcash" || paymentMethod === "bank-transfer") && (
          <div className="space-y-4">
            {/* Recipient Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentRecipient" className="mb-1.5 block">
                  {paymentMethod === "gcash"
                    ? "GCash Number (Paid To) *"
                    : "Bank Account Number (Paid To) *"}
                </Label>
                <Input
                  id="paymentRecipient"
                  value={paymentRecipient}
                  onChange={(e) => {
                    setErrors((prev) => ({ ...prev, paymentRecipient: "" }));
                    setPaymentRecipient(
                      e.target.value.replace(/[^0-9\s-]/g, ""),
                    );
                  }}
                  className={errors.paymentRecipient ? "border-red-500" : ""}
                  placeholder={
                    paymentMethod === "gcash"
                      ? "e.g., 09171234567"
                      : "e.g., 1234567890"
                  }
                />
                {errors.paymentRecipient && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.paymentRecipient}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {paymentMethod === "gcash"
                    ? "Customer sent payment to this GCash number"
                    : "Customer sent payment to this bank account"}
                </p>
              </div>

              <div>
                <Label htmlFor="paymentRecipientName" className="mb-1.5 block">
                  Account Holder Name *
                </Label>
                <Input
                  id="paymentRecipientName"
                  value={paymentRecipientName}
                  onChange={(e) => {
                    setErrors((prev) => ({
                      ...prev,
                      paymentRecipientName: "",
                    }));
                    setPaymentRecipientName(e.target.value);
                  }}
                  className={
                    errors.paymentRecipientName ? "border-red-500" : ""
                  }
                  placeholder="e.g., Juan Dela Cruz"
                />
                {errors.paymentRecipientName && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.paymentRecipientName}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Name of the {paymentMethod === "gcash" ? "GCash" : "bank"}{" "}
                  account holder
                </p>
              </div>
            </div>

            {/* Payment Reference Number */}
            <div>
              <Label htmlFor="paymentReference" className="mb-1.5 block">
                {paymentMethod === "gcash"
                  ? "Transaction Reference Number *"
                  : "Bank Reference Number *"}
              </Label>
              <Input
                id="paymentReference"
                value={paymentReference}
                onChange={(e) => {
                  setErrors((prev) => ({ ...prev, paymentReference: "" }));
                  setPaymentReference(
                    e.target.value.replace(/[^0-9\s-]/g, "").slice(0, 13),
                  );
                }}
                className={errors.paymentReference ? "border-red-500" : ""}
                placeholder={
                  paymentMethod === "gcash"
                    ? "e.g., 1234567890123"
                    : "e.g., 1234567890"
                }
                maxLength={13}
              />
              {errors.paymentReference && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.paymentReference}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {paymentMethod === "gcash"
                  ? "The 13-digit reference number from the GCash receipt"
                  : "The reference number from the bank transfer confirmation"}
              </p>
            </div>

            {/* Payment Proof Upload */}
            <div>
              <Label htmlFor="paymentProof" className="mb-1.5 block">
                Payment Proof * (Required for verification)
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
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
                  className={`flex-1 justify-start gap-2 ${errors.paymentProof ? "border-red-500" : ""}`}
                >
                  <Upload className="h-4 w-4" />
                  {paymentProof ? "Change Image" : "Upload Image"}
                </Button>
                {paymentProof && (
                  <>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-7xl">
                        <DialogHeader>
                          <DialogTitle>Payment Proof</DialogTitle>
                          <DialogDescription>
                            Preview of uploaded payment confirmation
                          </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[70vh] overflow-auto">
                          <img
                            src={paymentProof}
                            alt="Payment proof full size"
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
              {errors.paymentProof && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.paymentProof}
                </p>
              )}
              {paymentProof && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Image uploaded successfully
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reservation Option */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Order Type</Label>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isReservation"
              checked={isReservation}
              onCheckedChange={(checked) =>
                setIsReservation(checked as boolean)
              }
            />
            <Label htmlFor="isReservation" className="cursor-pointer">
              This is a Reservation
            </Label>
          </div>
        </div>

        {isReservation && (
          <div className="p-4 bg-secondary rounded-lg space-y-3">
            <p className="text-sm text-muted-foreground">
              Create a reservation order where the customer pays a partial
              amount upfront to reserve the items. The remaining balance will be
              due when they pick up or receive their order. Stock will be
              reserved from the selected warehouse.
            </p>
            <div className="space-y-2">
              <Label htmlFor="reservationPercentage" className="mb-1.5 block">
                Reservation Fee Percentage (%)
              </Label>
              <Input
                id="reservationPercentage"
                type="text"
                inputMode="numeric"
                value={reservationPercentage}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  if (value === "") {
                    setReservationPercentage(0); // Allow empty for typing
                  } else {
                    const numValue = Math.min(100, parseInt(value));
                    setReservationPercentage(numValue); // No min constraint while typing
                  }
                }}
                onBlur={(e) => {
                  // On blur, ensure minimum of 30%
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  if (value === "" || parseInt(value) < 30) {
                    setReservationPercentage(30);
                  }
                }}
                placeholder="30"
                min="30"
                max="100"
                className="bg-background border-primary"
              />
              <p className="text-xs text-muted-foreground">
                Customer will pay {reservationPercentage || 30}% (₱
                {(total * ((reservationPercentage || 30) / 100)).toFixed(2)})
                now, and ₱
                {(total * (1 - (reservationPercentage || 30) / 100)).toFixed(2)}{" "}
                upon pickup/delivery. Minimum 30%.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="mb-1.5 block">
          Order Notes (Optional)
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any special instructions or notes about this order..."
          rows={3}
        />
      </div>

      {/* Coupon Section */}
      <div className="space-y-3 p-4 border rounded-lg bg-secondary/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <Label>Apply Coupon Code</Label>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                View Available Coupons
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Available Coupons</DialogTitle>
                <DialogDescription>
                  Browse active coupons that can be applied to this order
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {getCoupons()
                  .filter(
                    (c) =>
                      c.isActive &&
                      new Date(c.expiryDate) > new Date() &&
                      c.usedCount < c.usageLimit,
                  )
                  .map((coupon) => (
                    <div
                      key={coupon.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="default">{coupon.code}</Badge>
                            {coupon.discountType === "percentage" ? (
                              <Badge variant="secondary">
                                {coupon.discountValue}% OFF
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                ₱{coupon.discountValue} OFF
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mt-2">{coupon.description}</p>
                          <div className="text-xs text-muted-foreground mt-2 space-y-1">
                            <p>
                              • Min. purchase: ₱{coupon.minPurchase.toFixed(2)}
                            </p>
                            {coupon.maxDiscount && (
                              <p>
                                • Max. discount: ₱
                                {coupon.maxDiscount.toFixed(2)}
                              </p>
                            )}
                            <p>
                              • Valid until:{" "}
                              {new Date(coupon.expiryDate).toLocaleDateString()}
                            </p>
                            <p>
                              • Uses remaining:{" "}
                              {coupon.usageLimit - coupon.usedCount}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCouponCode(coupon.code);
                            handleApplyCoupon();
                          }}
                          disabled={orderItems.length === 0}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  ))}
                {getCoupons().filter(
                  (c) =>
                    c.isActive &&
                    new Date(c.expiryDate) > new Date() &&
                    c.usedCount < c.usageLimit,
                ).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No active coupons available
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {!appliedCoupon ? (
          <div className="flex gap-2">
            <Input
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setCouponError("");
              }}
              className={couponError ? "border-red-500" : ""}
            />
            <Button
              onClick={handleApplyCoupon}
              variant="outline"
              disabled={!couponCode.trim() || orderItems.length === 0}
            >
              Apply
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-accent/20 border border-accent rounded">
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">
                {appliedCoupon.code}
              </p>
              <p className="text-sm text-green-600 dark:text-green-500">
                {appliedCoupon.description}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRemoveCoupon}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {couponError && <p className="text-xs text-red-500">{couponError}</p>}

        {orderItems.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Add products to apply a coupon
          </p>
        )}
      </div>

      {/* Order Summary */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal:</span>
          <span>₱{subtotal.toFixed(2)}</span>
        </div>
        {appliedCoupon && (
          <div className="flex justify-between text-green-600">
            <span>Coupon Discount ({appliedCoupon.code}):</span>
            <span>-₱{calculateTotal().couponDiscount.toFixed(2)}</span>
          </div>
        )}
        {deliveryMethod === "staff-delivery" && deliveryFee > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery Fee:</span>
            <span>₱{deliveryFee.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-2">
          <span>Total:</span>
          <span className="text-primary">₱{total.toFixed(2)}</span>
        </div>
        {isReservation && (
          <>
            <div className="flex justify-between text-orange-600 border-t pt-2">
              <span>Reservation Fee ({reservationPercentage || 30}%):</span>
              <span>
                ₱{(total * ((reservationPercentage || 30) / 100)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Balance Due on Pickup:</span>
              <span>
                ₱
                {(total * (1 - (reservationPercentage || 30) / 100)).toFixed(2)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Submit Button */}
      <Button onClick={handleSubmit} className="w-full" size="lg">
        <Save className="h-4 w-4 mr-2" />
        Create Order
      </Button>

      {/* Invoice Print Option */}
      {showInvoice && (
        <div className="border-t pt-4">
          <Button
            onClick={handlePrintInvoice}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
        </div>
      )}

      {/* Product Search Dialog */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Search Products</DialogTitle>
            <DialogDescription>
              Search and add products to the order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, category, or material..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <Select
                value={categoryFilter}
                onValueChange={(value: any) => setCategoryFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="chairs">Chairs</SelectItem>
                  <SelectItem value="tables">Tables</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Product Grid */}
            <div className="overflow-y-auto max-h-[50vh]">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No products found matching your search
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="border rounded-lg p-4 hover:bg-secondary hover:border-primary cursor-pointer transition-colors"
                      onClick={() => handleAddProduct(product.id)}
                    >
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded overflow-hidden bg-secondary flex-shrink-0">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="truncate">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {product.subCategory}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {product.material}
                          </p>
                          <p className="text-primary mt-1">
                            ₱{product.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
