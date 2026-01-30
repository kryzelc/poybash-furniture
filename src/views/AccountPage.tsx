"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { InvoiceReceipt } from "../components/InvoiceReceipt";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Textarea } from "../components/ui/textarea";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Checkbox } from "../components/ui/checkbox";
import {
  User,
  Package,
  LogOut,
  Settings,
  FileText,
  MapPin,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Key,
  Mail,
  Upload,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../utils/supabase/client";
import { validateEmail } from "../lib/validation";
import { getProducts } from "../lib/products";
import { QRCodeSVG } from "qrcode.react";
import type { Address } from "../contexts/AuthContext";

interface AccountPageProps {
  onNavigate: (page: string) => void;
}

export function AccountPage({ onNavigate }: AccountPageProps) {
  const {
    user,
    logout,
    getOrders,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    requestItemRefund,
    isAdmin,
    changePassword,
    cancelOrder,
  } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showCancelOrderDialog, setShowCancelOrderDialog] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<any>(null);
  const [orderFilter, setOrderFilter] = useState<string>("all");

  // Get products to fetch correct images
  const products = getProducts();

  // Helper function to get product image
  const getProductImage = (productId: number, fallbackUrl: string) => {
    const product = products.find((p) => p.id === productId);
    return product?.imageUrl || fallbackUrl;
  };
  const [showItemRefundDialog, setShowItemRefundDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundAccountInfo, setRefundAccountInfo] = useState({
    refundMethod: "",
    gcashNumber: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
  });
  const [refundProofImages, setRefundProofImages] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showChangePasswordDialog, setShowChangePasswordDialog] =
    useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showChangeEmailDialog, setShowChangeEmailDialog] = useState(false);
  const [emailData, setEmailData] = useState({
    newEmail: "",
    password: "",
  });
  const [emailChangeError, setEmailChangeError] = useState("");
  const [addressForm, setAddressForm] = useState({
    label: "",
    firstName: "",
    lastName: "",
    address: "",
    barangay: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Philippines",
    phone: "",
    isDefault: false,
  });
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  useEffect(() => {
    if (!user) {
      onNavigate("login");
    } else if (isAdmin()) {
      onNavigate("admin");
    }
  }, [user, onNavigate, isAdmin]);

  if (!user || isAdmin()) {
    return null;
  }

  const orders = getOrders();

  // Calculate order statistics
  const orderStats = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    reserved: orders.filter((o) => o.status === "reserved").length,
    processing: orders.filter((o) => o.status === "processing").length,
    ready: orders.filter((o) => o.status === "ready-for-pickup").length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
    refund: orders.filter((o) => o.items.some((item) => item.refundRequested))
      .length,
  };

  // Filter orders based on selected filter
  const filteredOrders =
    orderFilter === "all"
      ? orders
      : orderFilter === "refund"
        ? orders.filter((o) => o.items.some((item) => item.refundRequested))
        : orders.filter((o) => o.status === orderFilter);

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully", {
      description: "You have been securely logged out of your account.",
    });
    onNavigate("home");
  };

  const handleProfileUpdate = () => {
    // In a real app, this would update the user profile
    toast.success("Profile updated successfully", {
      description: "Your account information has been saved.",
    });
    setEditMode(false);
  };

  const handleViewInvoice = (order: any) => {
    setSelectedOrder(order);
    setShowInvoice(true);
  };

  const handleRequestItemRefund = (order: any, item: any) => {
    setSelectedOrder(order);
    setSelectedItem(item);
    setRefundReason("");
    setRefundProofImages([]);
    setRefundAccountInfo({
      refundMethod: order.paymentMethod === "cash" ? "cash" : "",
      gcashNumber: "",
      bankName: "",
      accountName: "",
      accountNumber: "",
    });
    setShowItemRefundDialog(true);
  };

  const handleSubmitItemRefund = () => {
    if (!refundReason.trim()) {
      toast.error("Please provide a reason for the refund");
      return;
    }

    // Validate refund account info if not cash payment
    if (selectedOrder?.paymentMethod !== "cash") {
      if (!refundAccountInfo.refundMethod) {
        toast.error("Please select a refund method");
        return;
      }

      if (
        refundAccountInfo.refundMethod === "gcash" &&
        !refundAccountInfo.gcashNumber
      ) {
        toast.error("Please provide your GCash number");
        return;
      }

      if (
        refundAccountInfo.refundMethod === "bank" &&
        (!refundAccountInfo.bankName ||
          !refundAccountInfo.accountName ||
          !refundAccountInfo.accountNumber)
      ) {
        toast.error("Please provide complete bank account details");
        return;
      }
    }

    if (refundProofImages.length < 3) {
      toast.error(
        "Please upload at least 3 proof images showing the item condition/issue",
      );
      return;
    }

    if (refundProofImages.length > 5) {
      toast.error("Maximum 5 proof images allowed");
      return;
    }

    if (selectedOrder && selectedItem) {
      requestItemRefund(selectedOrder.id, selectedItem.productId, refundReason);
      toast.success("Refund request submitted", {
        description: "We will review your request and get back to you soon.",
      });
      setShowItemRefundDialog(false);
      setRefundReason("");
      setRefundProofImages([]);
      setRefundAccountInfo({
        refundMethod: "",
        gcashNumber: "",
        bankName: "",
        accountName: "",
        accountNumber: "",
      });
      setSelectedOrder(null);
      setSelectedItem(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);

      // Check if adding these files would exceed the limit
      if (refundProofImages.length + fileArray.length > 5) {
        toast.error("Maximum 5 images allowed");
        return;
      }

      // Validate each file
      for (const file of fileArray) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error("Each image size should be less than 5MB");
          return;
        }
      }

      // Convert all files to base64
      const readPromises = fileArray.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readPromises).then((results) => {
        setRefundProofImages((prev) => [...prev, ...results]);
      });
    }

    // Reset input
    e.target.value = "";
  };

  const handleRemoveProofImage = (index: number) => {
    setRefundProofImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      label: "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      address: "",
      barangay: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Philippines",
      phone: user?.phone || "",
      isDefault: user.addresses.length === 0,
    });
    setShowAddressDialog(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm(address);
    setShowAddressDialog(true);
  };

  const handleSaveAddress = () => {
    if (!addressForm.label || !addressForm.address || !addressForm.city) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingAddress) {
      updateAddress(editingAddress.id, addressForm);
      toast.success("Address updated successfully");
    } else {
      addAddress(addressForm);
      toast.success("Address added successfully");
    }

    setShowAddressDialog(false);
  };

  const handleDeleteAddress = (id: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      deleteAddress(id);
      toast.success("Address deleted successfully");
    }
  };

  const handleSetDefaultAddress = (id: string) => {
    setDefaultAddress(id);
    toast.success("Default address updated");
  };

  const handleChangePassword = async () => {
    // Validation
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    // Attempt to change password
    const success = await changePassword(
      passwordData.currentPassword,
      passwordData.newPassword,
    );

    if (success) {
      toast.success("Password changed successfully", {
        description: "Your password has been updated.",
      });
      setShowChangePasswordDialog(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } else {
      toast.error("Failed to change password", {
        description: "Current password is incorrect.",
      });
    }
  };

  const handleChangeEmail = async () => {
    setEmailChangeError("");

    // Validation
    if (!emailData.newEmail || !emailData.password) {
      setEmailChangeError("Please fill in all fields");
      return;
    }

    const emailValidation = validateEmail(emailData.newEmail);
    if (!emailValidation.valid) {
      setEmailChangeError(emailValidation.error || "Invalid email address");
      return;
    }

    if (emailData.newEmail === user?.email) {
      setEmailChangeError("New email must be different from current email");
      return;
    }

    try {
      // First verify the password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: emailData.password,
      });

      if (signInError) {
        setEmailChangeError("Incorrect password. Please try again.");
        return;
      }

      // Update email with Supabase
      const { data, error } = await supabase.auth.updateUser({
        email: emailData.newEmail,
      });

      if (error) {
        setEmailChangeError(error.message || "Failed to update email");
        return;
      }

      toast.success("Verification email sent! 📧", {
        description:
          "Please check your new email inbox and click the verification link to complete the change.",
        duration: 7000,
      });

      setShowChangeEmailDialog(false);
      setEmailData({
        newEmail: "",
        password: "",
      });
    } catch (error) {
      setEmailChangeError("An unexpected error occurred. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-700 hover:bg-green-500/20";
      case "ready-for-pickup":
        return "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20";
      case "processing":
        return "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20";
      case "pending":
        return "bg-orange-500/10 text-orange-700 hover:bg-orange-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-700 hover:bg-red-500/20";
      case "refund-requested":
        return "bg-purple-500/10 text-purple-700 hover:bg-purple-500/20";
      case "refunded":
        return "bg-purple-500/10 text-purple-700 hover:bg-purple-500/20";
      default:
        return "";
    }
  };

  const canRequestItemRefund = (order: any, item: any) => {
    const orderDate = new Date(order.createdAt);
    const daysSinceOrder = Math.floor(
      (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    return (
      order.status === "completed" &&
      daysSinceOrder <= 7 &&
      !item.refundRequested
    );
  };

  const handleCancelOrder = () => {
    if (orderToCancel) {
      cancelOrder(orderToCancel.id, "customer");
      toast.success("Order cancelled successfully");
      setShowCancelOrderDialog(false);
      setOrderToCancel(null);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="mb-2">My Account</h1>
              <p className="text-muted-foreground">
                Manage your profile and view your orders
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </div>

          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList>
              <TabsTrigger value="orders">
                <Package className="h-4 w-4 mr-2" />
                Orders {orders.length > 0 && `(${orders.length})`}
              </TabsTrigger>
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="addresses">
                <MapPin className="h-4 w-4 mr-2" />
                Addresses
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Order History</CardTitle>
                      <CardDescription>
                        View and track your orders
                      </CardDescription>
                    </div>
                    {orders.length > 0 && (
                      <Select
                        value={orderFilter}
                        onValueChange={setOrderFilter}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter orders" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            All Orders ({orderStats.all})
                          </SelectItem>
                          <SelectItem value="pending">
                            Pending ({orderStats.pending})
                          </SelectItem>
                          <SelectItem value="reserved">
                            Reserved ({orderStats.reserved})
                          </SelectItem>
                          <SelectItem value="processing">
                            Processing ({orderStats.processing})
                          </SelectItem>
                          <SelectItem value="ready-for-pickup">
                            Ready ({orderStats.ready})
                          </SelectItem>
                          <SelectItem value="completed">
                            Completed ({orderStats.completed})
                          </SelectItem>
                          <SelectItem value="cancelled">
                            Cancelled ({orderStats.cancelled})
                          </SelectItem>
                          <SelectItem value="refund">
                            Refund ({orderStats.refund})
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No orders yet
                      </p>
                      <Button onClick={() => onNavigate("products")}>
                        Start Shopping
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredOrders.map((order) => (
                        <Card key={order.id}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <p className="text-muted-foreground">
                                  Order {order.id}
                                </p>
                                <p className="text-muted-foreground">
                                  {new Date(
                                    order.createdAt,
                                  ).toLocaleDateString()}
                                </p>
                                <p className="text-muted-foreground">
                                  {order.deliveryMethod === "store-pickup"
                                    ? "Store Pickup"
                                    : "Customer Arranged"}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge className={getStatusColor(order.status)}>
                                  {order.status.replace("-", " ")}
                                </Badge>
                              </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-3">
                              {order.items.map((item: any, index: number) => (
                                <div key={index}>
                                  <div className="flex gap-4">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                                      <img
                                        src={getProductImage(
                                          item.productId,
                                          item.imageUrl,
                                        )}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <p>{item.name}</p>
                                      <p className="text-muted-foreground">
                                        {item.color}
                                        {item.size
                                          ? ` - ${item.size}`
                                          : ""} × {item.quantity}
                                      </p>
                                      {item.refundRequested && (
                                        <Badge
                                          variant="outline"
                                          className="mt-1"
                                        >
                                          Refund {item.refundStatus}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="text-primary">
                                        ₱
                                        {(item.price * item.quantity).toFixed(
                                          2,
                                        )}
                                      </p>
                                      {canRequestItemRefund(order, item) && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="mt-1"
                                          onClick={() =>
                                            handleRequestItemRefund(order, item)
                                          }
                                        >
                                          <AlertCircle className="h-3 w-3 mr-1" />
                                          Request Refund
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  {item.refundRequested &&
                                    item.refundReason && (
                                      <div className="ml-20 mt-2 p-2 bg-secondary/30 rounded text-sm">
                                        <p className="text-muted-foreground">
                                          Refund reason: {item.refundReason}
                                        </p>
                                      </div>
                                    )}
                                </div>
                              ))}
                            </div>

                            <Separator className="my-4" />

                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-muted-foreground">Total</p>
                                <p className="text-primary">
                                  ₱{order.total.toFixed(2)}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewInvoice(order)}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Invoice
                                </Button>
                                {order.status === "pending" && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setOrderToCancel(order);
                                      setShowCancelOrderDialog(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Cancel Order
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>Your personal details</CardDescription>
                    </div>
                    {!editMode ? (
                      <Button onClick={() => setEditMode(true)}>
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setEditMode(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleProfileUpdate}>
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                      <h3>
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-muted-foreground">{user.email}</p>
                      <Badge className="mt-2" variant="secondary">
                        Customer Account
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {editMode ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profileData.firstName}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              firstName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profileData.lastName}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              lastName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          disabled
                          className="bg-secondary/50 cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">
                          Email cannot be changed here. Use the Security section
                          to change your email.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              phone: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-muted-foreground mb-1">Email</p>
                        <p>{user.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Phone</p>
                        <p>{user.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">
                          Member Since
                        </p>
                        <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">
                          Total Orders
                        </p>
                        <p>{orders.length}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Saved Addresses</CardTitle>
                      <CardDescription>
                        Manage your delivery addresses
                      </CardDescription>
                    </div>
                    <Button onClick={handleAddAddress}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Address
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {user.addresses.length === 0 ? (
                    <div className="text-center py-12">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No saved addresses
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {user.addresses.map((address) => (
                        <Card key={address.id}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4>{address.label}</h4>
                                  {address.isDefault && (
                                    <Badge variant="secondary">Default</Badge>
                                  )}
                                </div>
                                <p>
                                  {address.firstName} {address.lastName}
                                </p>
                                <p className="text-muted-foreground">
                                  {address.address}
                                </p>
                                {address.barangay && (
                                  <p className="text-muted-foreground">
                                    Brgy. {address.barangay}
                                  </p>
                                )}
                                <p className="text-muted-foreground">
                                  {address.city}, {address.state}{" "}
                                  {address.zipCode}
                                </p>
                                <p className="text-muted-foreground">
                                  {address.country}
                                </p>
                                <p className="text-muted-foreground">
                                  Phone: {address.phone}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {!address.isDefault && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleSetDefaultAddress(address.id)
                                    }
                                  >
                                    Set Default
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditAddress(address)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteAddress(address.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                      Manage your account preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="mb-2">Change Email Address</h4>
                      <p className="text-muted-foreground mb-2">
                        Update your email address. You'll need to verify the new
                        email.
                      </p>
                      <p className="text-muted-foreground mb-4">
                        Current email:{" "}
                        <span className="text-foreground">{user.email}</span>
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setShowChangeEmailDialog(true)}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Change Email
                      </Button>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="mb-2">Change Password</h4>
                      <p className="text-muted-foreground mb-4">
                        Update your password to keep your account secure
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setShowChangePasswordDialog(true)}
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                    <CardDescription>
                      Irreversible account actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <h4 className="mb-2">Delete Account</h4>
                      <p className="text-muted-foreground mb-4">
                        Permanently delete your account and all associated data
                      </p>
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteAccountDialog(true)}
                      >
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Invoice Dialog */}
      <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
        <DialogContent className="max-w-6xl max-h-[95vh]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Order {selectedOrder?.id}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="overflow-y-auto max-h-[calc(95vh-120px)] space-y-6 invoice-scroll pb-8">
              {/* Pickup Verification QR */}
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-shrink-0">
                      <div className="p-4 bg-white rounded-lg border-2 border-primary/30">
                        <QRCodeSVG
                          value={`POYBASH-ORDER-${selectedOrder.id}`}
                          size={150}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center gap-2 mb-3 justify-center md:justify-start">
                        <QrCode className="w-5 h-5 text-primary" />
                        <h4>Pickup Verification QR</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <span className="font-semibold">Pickup Code:</span>{" "}
                        <span className="font-mono text-lg text-foreground">
                          {selectedOrder.id}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        You will need this QR code for store pickup
                        verification. Show this to our staff when collecting
                        your order.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice */}
              <InvoiceReceipt order={selectedOrder} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Item Refund Request Dialog */}
      <Dialog
        open={showItemRefundDialog}
        onOpenChange={setShowItemRefundDialog}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Item Refund</DialogTitle>
            <DialogDescription>
              Request a refund for {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {selectedItem && (
              <div className="flex gap-4 p-3 bg-secondary/30 rounded-lg">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  <img
                    src={getProductImage(
                      selectedItem.productId,
                      selectedItem.imageUrl,
                    )}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p>{selectedItem.name}</p>
                  <p className="text-muted-foreground">
                    {selectedItem.color} × {selectedItem.quantity}
                  </p>
                  <p className="text-primary">
                    ₱{(selectedItem.price * selectedItem.quantity).toFixed(2)}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Payment Method:{" "}
                    {selectedOrder?.paymentMethod === "cash"
                      ? "Cash on Pickup"
                      : selectedOrder?.paymentMethod === "gcash"
                        ? "GCash"
                        : "Bank Transfer"}
                  </p>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="itemRefundReason">Reason for Refund *</Label>
              <Textarea
                id="itemRefundReason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Please describe why you want to refund this item (e.g., defective, wrong item, damaged, etc.)..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proofImages">
                Upload Proof Images * (3-5 images required)
              </Label>
              <p className="text-muted-foreground text-xs mb-2">
                Please upload 3-5 photos showing the item condition/issue from
                different angles (max 5MB each)
              </p>
              <input
                id="proofImages"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("proofImages")?.click()}
                className="w-full justify-start gap-2"
                disabled={refundProofImages.length >= 5}
              >
                <Upload className="h-4 w-4" />
                {refundProofImages.length === 0
                  ? "Upload Images (3-5 required)"
                  : `Add More Images (${refundProofImages.length}/5)`}
              </Button>

              {refundProofImages.length > 0 && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Uploaded: {refundProofImages.length} image
                      {refundProofImages.length !== 1 ? "s" : ""}
                      {refundProofImages.length < 3 && (
                        <span className="text-destructive ml-2">
                          (Minimum 3 required)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {refundProofImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Refund proof ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => handleRemoveProofImage(index)}
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedOrder?.paymentMethod !== "cash" && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2">Refund Account Information</h4>
                    <p className="text-muted-foreground">
                      Please provide your account details for the refund
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Refund Method *</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        type="button"
                        variant={
                          refundAccountInfo.refundMethod === "gcash"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          setRefundAccountInfo({
                            ...refundAccountInfo,
                            refundMethod: "gcash",
                          })
                        }
                        className="h-auto py-3"
                      >
                        <div>
                          <div>GCash</div>
                          <div className="text-xs text-muted-foreground">
                            Instant refund
                          </div>
                        </div>
                      </Button>
                      <Button
                        type="button"
                        variant={
                          refundAccountInfo.refundMethod === "bank"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          setRefundAccountInfo({
                            ...refundAccountInfo,
                            refundMethod: "bank",
                          })
                        }
                        className="h-auto py-3"
                      >
                        <div>
                          <div>Bank Transfer</div>
                          <div className="text-xs text-muted-foreground">
                            2-3 business days
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>

                  {refundAccountInfo.refundMethod === "gcash" && (
                    <div className="space-y-2">
                      <Label htmlFor="gcashNumber">GCash Mobile Number *</Label>
                      <Input
                        id="gcashNumber"
                        value={refundAccountInfo.gcashNumber}
                        onChange={(e) =>
                          setRefundAccountInfo({
                            ...refundAccountInfo,
                            gcashNumber: e.target.value,
                          })
                        }
                        placeholder="+63 XXX XXX XXXX"
                      />
                    </div>
                  )}

                  {refundAccountInfo.refundMethod === "bank" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name *</Label>
                        <Input
                          id="bankName"
                          value={refundAccountInfo.bankName}
                          onChange={(e) =>
                            setRefundAccountInfo({
                              ...refundAccountInfo,
                              bankName: e.target.value,
                            })
                          }
                          placeholder="e.g., BDO, BPI, Metrobank"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountName">Account Name *</Label>
                        <Input
                          id="accountName"
                          value={refundAccountInfo.accountName}
                          onChange={(e) =>
                            setRefundAccountInfo({
                              ...refundAccountInfo,
                              accountName: e.target.value,
                            })
                          }
                          placeholder="Full name as shown in bank account"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number *</Label>
                        <Input
                          id="accountNumber"
                          value={refundAccountInfo.accountNumber}
                          onChange={(e) =>
                            setRefundAccountInfo({
                              ...refundAccountInfo,
                              accountNumber: e.target.value,
                            })
                          }
                          placeholder="Bank account number"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {selectedOrder?.paymentMethod === "cash" && (
              <div className="p-4 bg-amber-50 text-amber-900 rounded-lg border border-amber-200">
                <p>
                  Since you paid with Cash on Pickup, your refund will be
                  processed as cash pickup at our store.
                </p>
              </div>
            )}

            <div className="p-4 bg-secondary/30 rounded-lg">
              <h4 className="mb-2">Refund Policy</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>
                  • Refund requests are accepted within 7 days of order
                  completion
                </li>
                <li>
                  • Items must be in original condition with tags attached
                </li>
                <li>
                  • Refunds will be processed within 5-7 business days after
                  approval
                </li>
                <li>
                  • 3-5 proof images are REQUIRED to validate the refund request
                </li>
                <li>
                  • Images should clearly show the item condition/issue from
                  different angles
                </li>
              </ul>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowItemRefundDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitItemRefund}>
                Submit Refund Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
            <DialogDescription>
              {editingAddress
                ? "Update your address details"
                : "Add a new delivery address"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addressLabel">Address Label</Label>
              <Input
                id="addressLabel"
                value={addressForm.label}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, label: e.target.value })
                }
                placeholder="e.g., Home, Office, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addrFirstName">First Name</Label>
                <Input
                  id="addrFirstName"
                  value={addressForm.firstName}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      firstName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addrLastName">Last Name</Label>
                <Input
                  id="addrLastName"
                  value={addressForm.lastName}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="addrAddress">Street Address</Label>
              <Input
                id="addrAddress"
                value={addressForm.address}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, address: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addrBarangay">Barangay</Label>
                <Input
                  id="addrBarangay"
                  value={addressForm.barangay}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, barangay: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addrCity">City</Label>
                <Input
                  id="addrCity"
                  value={addressForm.city}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, city: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addrState">Province/State</Label>
                <Input
                  id="addrState"
                  value={addressForm.state}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, state: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addrZip">Postal Code</Label>
                <Input
                  id="addrZip"
                  value={addressForm.zipCode}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, zipCode: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="addrCountry">Country</Label>
              <Input
                id="addrCountry"
                value={addressForm.country}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, country: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addrPhone">Phone Number</Label>
              <Input
                id="addrPhone"
                value={addressForm.phone}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, phone: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="addrDefault"
                checked={addressForm.isDefault}
                onCheckedChange={(checked) =>
                  setAddressForm({
                    ...addressForm,
                    isDefault: checked as boolean,
                  })
                }
              />
              <Label htmlFor="addrDefault" className="cursor-pointer">
                Set as default address
              </Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowAddressDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveAddress}>
                {editingAddress ? "Update Address" : "Add Address"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog
        open={showChangePasswordDialog}
        onOpenChange={setShowChangePasswordDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Update your account password</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                placeholder="Enter new password (min. 6 characters)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="Confirm new password"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowChangePasswordDialog(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleChangePassword}>Change Password</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Email Dialog */}
      <Dialog
        open={showChangeEmailDialog}
        onOpenChange={(open) => {
          setShowChangeEmailDialog(open);
          if (!open) {
            setEmailData({ newEmail: "", password: "" });
            setEmailChangeError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Email Address</DialogTitle>
            <DialogDescription>
              Enter your new email address and current password for security
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {emailChangeError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{emailChangeError}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                A verification email will be sent to your new email address. You
                must click the verification link to complete the change.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="currentEmail">Current Email</Label>
              <Input
                id="currentEmail"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-secondary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email Address *</Label>
              <Input
                id="newEmail"
                type="email"
                value={emailData.newEmail}
                onChange={(e) => {
                  setEmailData({ ...emailData, newEmail: e.target.value });
                  setEmailChangeError("");
                }}
                placeholder="your.new.email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailPassword">Current Password *</Label>
              <Input
                id="emailPassword"
                type="password"
                value={emailData.password}
                onChange={(e) => {
                  setEmailData({ ...emailData, password: e.target.value });
                  setEmailChangeError("");
                }}
                placeholder="Enter your current password"
              />
              <p className="text-xs text-muted-foreground">
                We need your password to verify it's you
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowChangeEmailDialog(false);
                  setEmailData({ newEmail: "", password: "" });
                  setEmailChangeError("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleChangeEmail}>
                Send Verification Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <AlertDialog
        open={showDeleteAccountDialog}
        onOpenChange={setShowDeleteAccountDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Delete Account</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Order Dialog */}
      <AlertDialog
        open={showCancelOrderDialog}
        onOpenChange={setShowCancelOrderDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to cancel this order?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently cancel your
              order and remove it from your order history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelOrder}>
              Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
