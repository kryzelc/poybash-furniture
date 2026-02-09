"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type { User as UserType } from "@/models/User";
import {
  validateName,
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  formatPhoneNumber,
  sanitizeInput,
} from "../../lib/validation";
import { useAuth } from "../../contexts/AuthContext";
import {
  getCreatableRoles,
  getRoleName,
  getRoleDescription,
} from "../../lib/permissions";
import { useAuditLog } from "../../hooks/useAuditLog";
import { addUserNotification, canChangeEmail } from "../../lib/auditLog";
import {
  getAllUsers,
  updateUserRole,
  toggleUserActive,
  updateUserInfo,
  createUser,
  checkEmailExists,
} from "../../services/userService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { PhoneInput } from "../PhoneInput";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  UserPlus,
  Edit,
  Trash2,
  Search,
  Shield,
  Lock,
  Mail,
  Phone,
  User,
  EyeOff,
  AlertCircle,
  Calendar,
  Crown,
  ShoppingCart,
  Package,
  Edit2,
  Users,
  Filter,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export function AccountManagement() {
  const { user: currentUser } = useAuth();
  const isOwner = currentUser?.role === "owner";
  const { logAccountAction } = useAuditLog();

  const [users, setUsers] = useState<(UserType & { password?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<
    (UserType & { password?: string }) | null
  >(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "all" | "customer" | "staff" | "inventory-clerk" | "admin" | "owner"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("active");

  // Popover open states
  const [showRoleFilterPopover, setShowRoleFilterPopover] = useState(false);
  const [showStatusFilterPopover, setShowStatusFilterPopover] = useState(false);

  // Load users from Supabase on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const fetchedUsers = await getAllUsers();
    setUsers(fetchedUsers);
    setLoading(false);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const ownerUsers = users.filter((u) => u.role === "owner").length;
    const adminUsers = users.filter((u) => u.role === "admin").length;
    const customerUsers = users.filter((u) => u.role === "customer").length;
    const staffUsers = users.filter((u) => u.role === "staff").length;
    const clerkUsers = users.filter((u) => u.role === "inventory-clerk").length;

    return {
      totalUsers,
      ownerUsers,
      adminUsers,
      customerUsers,
      staffUsers,
      clerkUsers,
    };
  }, [users]);

  // Filter users
  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((u) =>
        statusFilter === "active" ? u.active !== false : u.active === false,
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(term) ||
          u.firstName.toLowerCase().includes(term) ||
          u.lastName.toLowerCase().includes(term),
      );
    }

    return filtered;
  }, [users, roleFilter, statusFilter, searchTerm]);

  const handleUpdateRole = async (
    userId: string,
    newRole: "customer" | "staff" | "inventory-clerk" | "admin" | "owner",
  ) => {
    if (!isOwner) {
      toast.error("Access denied! 🚫", {
        description: "Only owners can change user roles",
        duration: 3000,
      });
      return;
    }

    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const oldRole = user.role;

    const success = await updateUserRole(userId, newRole);

    if (!success) {
      toast.error("Failed to update role", {
        description: "There was an error updating the user role",
        duration: 3000,
      });
      return;
    }

    // Reload users
    await loadUsers();

    // Add audit log
    if (currentUser) {
      logAccountAction("role_changed", user.id, user.email, [
        {
          field: "role",
          oldValue: oldRole,
          newValue: newRole,
        },
      ]);

      // Notify affected user
      addUserNotification({
        userId: user.id,
        type: "role_changed",
        message: `Your account role was changed from ${oldRole} to ${newRole}`,
        details: `Changed by ${currentUser.email} on ${new Date().toLocaleString()}`,
      });
    }

    toast.success("User role updated successfully! ✅", {
      description: `${user?.email} is now a ${newRole}`,
      duration: 3000,
    });
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    if (!isOwner) {
      toast.error("Access denied! 🚫", {
        description: "Only owners can deactivate/reactivate users",
        duration: 3000,
      });
      return;
    }

    const action = currentStatus ? "deactivate" : "reactivate";
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    if (confirm(`Are you sure you want to ${action} ${user?.email}?`)) {
      const success = await toggleUserActive(userId, !currentStatus);

      if (!success) {
        toast.error("Failed to update status", {
          description: "There was an error updating the user status",
          duration: 3000,
        });
        return;
      }

      // Reload users
      await loadUsers();

      // Add audit log
      logAccountAction(
        currentStatus ? "account_deactivated" : "account_reactivated",
        user.id,
        user.email,
        [
          {
            field: "active",
            oldValue: String(currentStatus),
            newValue: String(!currentStatus),
          },
        ],
      );

      // Notify affected user
      addUserNotification({
        userId: user.id,
        type: "account_status",
        message: `Your account has been ${action}d`,
        details: `${action.charAt(0).toUpperCase() + action.slice(1)}d by ${currentUser?.email} on ${new Date().toLocaleString()}`,
      });

      toast.success(`User ${action}d successfully! ✅`, {
        description: `${user?.email} has been ${action}d`,
        duration: 3000,
      });
    }
  };

  const handleUpdateUserInfo = async (
    userId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
    },
  ) => {
    if (!isOwner) {
      toast.error("Access denied! 🚫", {
        description: "Only owners can edit user information",
        duration: 3000,
      });
      return;
    }

    // Validate inputs
    if (updates.firstName && !validateName(updates.firstName)) {
      toast.error("Invalid first name", {
        description: "Please enter a valid first name",
        duration: 3000,
      });
      return;
    }

    if (updates.lastName && !validateName(updates.lastName)) {
      toast.error("Invalid last name", {
        description: "Please enter a valid last name",
        duration: 3000,
      });
      return;
    }

    if (updates.email && !validateEmail(updates.email)) {
      toast.error("Invalid email address", {
        description: "Please enter a valid email address",
        duration: 3000,
      });
      return;
    }

    if (updates.phone && !validatePhoneNumber(updates.phone)) {
      toast.error("Invalid phone number", {
        description: "Please enter a valid phone number",
        duration: 3000,
      });
      return;
    }

    // Check if email is already taken by another user
    if (updates.email) {
      const emailExists = await checkEmailExists(updates.email, userId);
      if (emailExists) {
        toast.error("Email already exists", {
          description: "This email is already registered",
          duration: 3000,
        });
        return;
      }
    }

    const user = users.find((u) => u.id === userId);

    const success = await updateUserInfo(userId, updates);

    if (!success) {
      toast.error("Failed to update user", {
        description: "There was an error updating the user information",
        duration: 3000,
      });
      return;
    }

    // Reload users
    await loadUsers();

    // Log the action - only log fields that actually changed
    const changes = [];
    if (updates.firstName && updates.firstName !== user?.firstName)
      changes.push({
        field: "firstName",
        oldValue: user?.firstName || "",
        newValue: updates.firstName,
      });
    if (updates.lastName && updates.lastName !== user?.lastName)
      changes.push({
        field: "lastName",
        oldValue: user?.lastName || "",
        newValue: updates.lastName,
      });
    if (updates.email && updates.email !== user?.email)
      changes.push({
        field: "email",
        oldValue: user?.email || "",
        newValue: updates.email,
      });
    if (updates.phone && updates.phone !== user?.phone)
      changes.push({
        field: "phone",
        oldValue: user?.phone || "",
        newValue: updates.phone,
      });

    logAccountAction("account_modified", userId, user?.email || "", changes);

    toast.success("User information updated successfully! ✅", {
      description: `${user?.email}'s information has been updated`,
      duration: 3000,
    });
  };

  const handleAddUser = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: "customer" | "admin" | "owner";
    // Address fields for customer accounts
    address?: string;
    barangay?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    addresses?: any[];
  }) => {
    if (!isOwner && userData.role !== "customer") {
      toast.error("Access denied! 🚫", {
        description: "Only owners can create admin or owner accounts",
        duration: 3000,
      });
      return;
    }

    // Check if email already exists
    const emailExists = await checkEmailExists(userData.email);
    if (emailExists) {
      toast.error("User already exists! ⚠️", {
        description: "A user with this email already exists",
        duration: 3000,
      });
      return;
    }

    const userId = await createUser({
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone || "",
      role: userData.role,
    });

    if (!userId) {
      toast.error("Failed to create user", {
        description: "There was an error creating the user",
        duration: 3000,
      });
      return;
    }

    // Reload users
    await loadUsers();

    // Log the action
    logAccountAction("account_created", userId, userData.email, [
      { field: "role", oldValue: "", newValue: userData.role },
      { field: "firstName", oldValue: "", newValue: userData.firstName },
      { field: "lastName", oldValue: "", newValue: userData.lastName },
    ]);

    toast.success("User created successfully! 🎉", {
      description: `${userData.firstName} ${userData.lastName} has been added`,
      duration: 3000,
    });
    setIsAddDialogOpen(false);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-primary">{stats.totalUsers}</div>
            <p className="text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Customers</CardTitle>
            <User className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-primary">{stats.customerUsers}</div>
            <p className="text-muted-foreground">Customer accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Admins</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-primary">{stats.adminUsers}</div>
            <p className="text-muted-foreground">Admin accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Owners</CardTitle>
            <Crown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-primary">{stats.ownerUsers}</div>
            <p className="text-muted-foreground">Owner accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* User Management Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Account Management</CardTitle>
              <CardDescription>
                {isOwner
                  ? "Manage user accounts and permissions"
                  : "View user accounts (contact owner to modify)"}
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="default">
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    {isOwner
                      ? "Create a new user account with any role"
                      : "Create customer, sales staff, or inventory clerk accounts"}
                  </DialogDescription>
                </DialogHeader>
                <AddUserForm
                  onSubmit={handleAddUser}
                  onCancel={() => setIsAddDialogOpen(false)}
                  currentUserRole={currentUser?.role || "admin"}
                />
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Popover
              open={showRoleFilterPopover}
              onOpenChange={setShowRoleFilterPopover}
            >
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-between">
                  <span>
                    {roleFilter === "all" && `All Users (${users.length})`}
                    {roleFilter === "customer" &&
                      `Customers (${stats.customerUsers})`}
                    {roleFilter === "staff" &&
                      `Sales Staff (${stats.staffUsers})`}
                    {roleFilter === "inventory-clerk" &&
                      `Inventory Clerks (${stats.clerkUsers})`}
                    {roleFilter === "admin" && `Admins (${stats.adminUsers})`}
                    {roleFilter === "owner" && `Owners (${stats.ownerUsers})`}
                  </span>
                  <Filter className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[286px] p-2" align="end">
                <div className="space-y-1">
                  <Button
                    variant={roleFilter === "all" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setRoleFilter("all");
                      setShowRoleFilterPopover(false);
                    }}
                  >
                    All Users ({users.length})
                  </Button>
                  <Button
                    variant={roleFilter === "customer" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setRoleFilter("customer");
                      setShowRoleFilterPopover(false);
                    }}
                  >
                    Customers ({stats.customerUsers})
                  </Button>
                  <Button
                    variant={roleFilter === "staff" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setRoleFilter("staff");
                      setShowRoleFilterPopover(false);
                    }}
                  >
                    Sales Staff ({stats.staffUsers})
                  </Button>
                  <Button
                    variant={
                      roleFilter === "inventory-clerk" ? "secondary" : "ghost"
                    }
                    className="w-full justify-start"
                    onClick={() => {
                      setRoleFilter("inventory-clerk");
                      setShowRoleFilterPopover(false);
                    }}
                  >
                    Inventory Clerks ({stats.clerkUsers})
                  </Button>
                  <Button
                    variant={roleFilter === "admin" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setRoleFilter("admin");
                      setShowRoleFilterPopover(false);
                    }}
                  >
                    Admins ({stats.adminUsers})
                  </Button>
                  <Button
                    variant={roleFilter === "owner" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setRoleFilter("owner");
                      setShowRoleFilterPopover(false);
                    }}
                  >
                    Owners ({stats.ownerUsers})
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Popover
              open={showStatusFilterPopover}
              onOpenChange={setShowStatusFilterPopover}
            >
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-between">
                  <span>
                    {statusFilter === "all" && "All Statuses"}
                    {statusFilter === "active" && "Active Only"}
                    {statusFilter === "inactive" && "Inactive Only"}
                  </span>
                  <Filter className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[257px] p-2" align="end">
                <div className="space-y-1">
                  <Button
                    variant={statusFilter === "all" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setStatusFilter("all");
                      setShowStatusFilterPopover(false);
                    }}
                  >
                    All Statuses
                  </Button>
                  <Button
                    variant={statusFilter === "active" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setStatusFilter("active");
                      setShowStatusFilterPopover(false);
                    }}
                  >
                    Active Only
                  </Button>
                  <Button
                    variant={
                      statusFilter === "inactive" ? "secondary" : "ghost"
                    }
                    className="w-full justify-start"
                    onClick={() => {
                      setStatusFilter("inactive");
                      setShowStatusFilterPopover(false);
                    }}
                  >
                    Inactive Only
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[840px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[240px]">User</TableHead>
                <TableHead className="text-center w-[140px]">Contact</TableHead>
                <TableHead className="text-center w-[120px]">Role</TableHead>
                <TableHead className="text-center w-[120px]">Joined</TableHead>
                <TableHead className="text-center w-[100px]">
                  Addresses
                </TableHead>
                <TableHead className="text-center w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="py-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            className="text-left hover:underline cursor-pointer"
                            onClick={() => setSelectedUser(user)}
                          >
                            <div className="text-sm">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-muted-foreground text-xs truncate max-w-[220px]">
                              {user.email}
                            </div>
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>User Details</DialogTitle>
                            <DialogDescription>
                              View and manage user information and permissions
                            </DialogDescription>
                          </DialogHeader>
                          {selectedUser && (
                            <UserDetailsView
                              user={selectedUser}
                              onUpdateRole={handleUpdateRole}
                              onUpdateUserInfo={handleUpdateUserInfo}
                              isOwner={isOwner}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <div className="text-sm text-muted-foreground">
                        {user.phone || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <div className="flex gap-1.5 justify-center">
                        <Badge
                          className="text-xs"
                          variant={
                            user.role === "owner"
                              ? "default"
                              : user.role === "admin" ||
                                  user.role === "staff" ||
                                  user.role === "inventory-clerk"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {user.role === "owner" ? (
                            <>
                              <Crown className="h-3 w-3 mr-1" /> Owner
                            </>
                          ) : user.role === "admin" ? (
                            <>
                              <Shield className="h-3 w-3 mr-1" /> Admin
                            </>
                          ) : user.role === "staff" ? (
                            <>
                              <ShoppingCart className="h-3 w-3 mr-1" /> Sales
                              Staff
                            </>
                          ) : user.role === "inventory-clerk" ? (
                            <>
                              <Package className="h-3 w-3 mr-1" /> Inventory
                              Clerk
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3 mr-1" /> Customer
                            </>
                          )}
                        </Badge>
                        {user.active === false && (
                          <Badge variant="destructive" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <div className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-2 text-sm">
                      {user.addresses?.length || 0}
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <div className="flex gap-2 justify-center">
                        {isOwner && user.email !== "owner@poybash.com" && (
                          <Button
                            variant={
                              user.active === false ? "outline" : "ghost"
                            }
                            size="sm"
                            onClick={() =>
                              handleToggleActive(user.id, user.active !== false)
                            }
                          >
                            {user.active === false ? (
                              "Reactivate"
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// User Details View Component
function UserDetailsView({
  user,
  onUpdateRole,
  onUpdateUserInfo,
  isOwner,
}: {
  user: UserType;
  onUpdateRole: (
    userId: string,
    role: "customer" | "staff" | "inventory-clerk" | "admin" | "owner",
  ) => void;
  onUpdateUserInfo: (
    userId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
    },
  ) => void;
  isOwner: boolean;
}) {
  const { user: currentUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editedInfo, setEditedInfo] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || "",
  });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [verificationPassword, setVerificationPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleSaveWithVerification = () => {
    // Show password verification dialog
    setShowPasswordDialog(true);
    setVerificationPassword("");
    setPasswordError("");
  };

  const handleVerifyAndSave = () => {
    // Verify password
    if (!verificationPassword) {
      setPasswordError("Password is required");
      return;
    }

    // Check if entered password matches current user's password
    const storedUsers = localStorage.getItem("users");
    if (storedUsers) {
      const users = JSON.parse(storedUsers);
      const adminUser = users.find((u: any) => u.id === currentUser?.id);

      if (!adminUser || adminUser.password !== verificationPassword) {
        setPasswordError("Incorrect password. Please try again.");
        return;
      }
    }

    // Password verified, proceed with update
    onUpdateUserInfo(user.id, editedInfo);
    setIsEditingInfo(false);
    setShowPasswordDialog(false);
    setVerificationPassword("");
    setPasswordError("");
  };

  const getRolePermissions = (
    role: "customer" | "staff" | "inventory-clerk" | "admin" | "owner",
  ) => {
    switch (role) {
      case "owner":
        return [
          "✓ All Admin permissions",
          "✓ Delete/deactivate products",
          "✓ Delete/deactivate user accounts",
          "✓ Change user roles",
          "✓ Create any type of account",
          "✓ Access sales reports",
          "✓ View and export audit trail",
          "✓ Clear audit logs",
          "✓ Process refunds",
          "✓ Full system control",
        ];
      case "admin":
        return [
          "✓ View products, orders, customers",
          "✓ Update order statuses",
          "✓ Manage inventory levels",
          "✓ Create manual orders",
          "✓ Process refunds (approve & complete)",
          "✓ View full customer information",
          "✓ Create Staff & Inventory Clerk accounts",
          "✓ Create customer accounts",
          "✗ Cannot delete products or users",
          "✗ Cannot change user roles",
          "✗ Cannot create Admin or Owner accounts",
          "✗ No access to sales reports",
        ];
      case "staff":
        return [
          "✓ View products (read-only catalog)",
          "✓ View and filter product categories (read-only)",
          "✓ View orders",
          "✓ Update order statuses",
          "✓ Create manual orders",
          "✓ Create customer accounts (for new customers)",
          "✓ View full customer information",
          "✓ Request refunds (requires Admin approval)",
          "✗ Cannot process refunds directly",
          "✗ No inventory management access",
          "✗ Cannot add/edit/delete products",
          "✗ Cannot add/edit/delete categories",
          "✗ Cannot create staff accounts",
          "✗ No coupon access",
          "✗ No access to sales reports",
        ];
      case "inventory-clerk":
        return [
          "✓ View products",
          "✓ Manage inventory and stock levels",
          "✓ Add/edit product listings",
          "✓ View orders (inventory tracking & fulfillment)",
          "✓ Update order statuses (during fulfillment)",
          "✓ Create manual orders (walk-in/phone orders)",
          "✓ Create customer accounts (for walk-in/phone orders)",
          "✓ View shipping addresses (order-specific only)",
          "✗ Cannot view full customer account details",
          "✗ Cannot process or request refunds",
          "✗ Cannot create staff accounts",
          "✗ No coupon access",
          "✗ No access to sales reports",
        ];
      case "customer":
        return [
          "✓ Browse product catalog",
          "✓ Add items to cart",
          "✓ Place orders",
          "✓ View own order history",
          "✓ Manage own profile and addresses",
          "✓ Request refunds/returns",
        ];
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Verification Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Your Identity</DialogTitle>
            <DialogDescription>
              For security purposes, please enter your password to confirm these
              changes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verifyPassword">Your Password</Label>
              <Input
                id="verifyPassword"
                type="password"
                value={verificationPassword}
                onChange={(e) => {
                  setVerificationPassword(e.target.value);
                  setPasswordError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleVerifyAndSave();
                  }
                }}
                placeholder="Enter your password"
                className={passwordError ? "border-red-500" : ""}
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-red-500">{passwordError}</p>
              )}
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Security Notice:</strong> This verification ensures that
                only authorized users can modify account information, protecting
                against unauthorized access.
              </p>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleVerifyAndSave}>
                Verify & Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordDialog(false);
                  setVerificationPassword("");
                  setPasswordError("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Basic Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Basic Information</CardTitle>
          {isOwner && user.email !== "owner@poybash.com" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isEditingInfo) {
                  // Cancel editing
                  setIsEditingInfo(false);
                  setEditedInfo({
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone || "",
                  });
                } else {
                  setIsEditingInfo(true);
                }
              }}
            >
              {isEditingInfo ? (
                "Cancel"
              ) : (
                <>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {!isEditingInfo ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">First Name</p>
                  <p>{user.firstName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Name</p>
                  <p>{user.lastName}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Email Address</p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone Number</p>
                <p>{user.phone || "Not provided"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Account Created</p>
                <p>{new Date(user.createdAt).toLocaleString()}</p>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={editedInfo.firstName}
                    onChange={(e) =>
                      setEditedInfo({
                        ...editedInfo,
                        firstName: e.target.value,
                      })
                    }
                    placeholder="First Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={editedInfo.lastName}
                    onChange={(e) =>
                      setEditedInfo({
                        ...editedInfo,
                        lastName: e.target.value,
                      })
                    }
                    placeholder="Last Name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email Address</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editedInfo.email}
                  onChange={(e) =>
                    setEditedInfo({
                      ...editedInfo,
                      email: e.target.value,
                    })
                  }
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone Number</Label>
                <Input
                  id="editPhone"
                  type="tel"
                  value={editedInfo.phone}
                  onChange={(e) =>
                    setEditedInfo({
                      ...editedInfo,
                      phone: e.target.value,
                    })
                  }
                  placeholder="+63 XXX XXX XXXX"
                />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Account Created</p>
                <p className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  {new Date(user.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-muted/20 border border-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  🔒 <strong>Security:</strong> You'll be asked to verify your
                  password before these changes are saved.
                </p>
              </div>
              <Button className="w-full" onClick={handleSaveWithVerification}>
                Save Changes
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Role Management */}
      <Card>
        <CardHeader>
          <CardTitle>Role & Permissions</CardTitle>
          <CardDescription>
            {isOwner
              ? "Manage user role and access permissions"
              : "View user role and permissions (owner access required to modify)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userRole">User Role</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  disabled={!isOwner}
                >
                  <span className="flex items-center gap-2">
                    {selectedRole === "customer" && (
                      <>
                        <User className="h-4 w-4" />
                        <span>Customer</span>
                      </>
                    )}
                    {selectedRole === "staff" && (
                      <>
                        <ShoppingCart className="h-4 w-4" />
                        <span>Sales Staff</span>
                      </>
                    )}
                    {selectedRole === "inventory-clerk" && (
                      <>
                        <Package className="h-4 w-4" />
                        <span>Inventory Clerk</span>
                      </>
                    )}
                    {selectedRole === "admin" && (
                      <>
                        <Shield className="h-4 w-4" />
                        <span>Admin</span>
                      </>
                    )}
                    {selectedRole === "owner" && (
                      <>
                        <Crown className="h-4 w-4" />
                        <span>Owner</span>
                      </>
                    )}
                  </span>
                  <Filter className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-2" align="start">
                <div className="space-y-1">
                  <Button
                    variant={
                      selectedRole === "customer" ? "secondary" : "ghost"
                    }
                    className="w-full justify-start"
                    onClick={() => setSelectedRole("customer")}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Customer
                  </Button>
                  <Button
                    variant={selectedRole === "staff" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedRole("staff")}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Sales Staff
                  </Button>
                  <Button
                    variant={
                      selectedRole === "inventory-clerk" ? "secondary" : "ghost"
                    }
                    className="w-full justify-start"
                    onClick={() => setSelectedRole("inventory-clerk")}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Inventory Clerk
                  </Button>
                  <Button
                    variant={selectedRole === "admin" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedRole("admin")}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                  <Button
                    variant={selectedRole === "owner" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedRole("owner")}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Owner
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {isOwner && user.email !== "owner@poybash.com" && (
            <Button
              className="w-full"
              onClick={() => onUpdateRole(user.id, selectedRole)}
              disabled={selectedRole === user.role}
            >
              Update Role
            </Button>
          )}

          {!isOwner && (
            <p className="text-sm text-muted-foreground text-center p-2 bg-secondary rounded">
              Only owners can change user roles
            </p>
          )}

          {user.email === "owner@poybash.com" && (
            <p className="text-sm text-muted-foreground text-center p-2 bg-secondary rounded">
              Demo owner account role cannot be changed
            </p>
          )}

          {/* Permissions Display */}
          <div className="mt-4 p-4 bg-secondary rounded-lg">
            <p className="font-medium mb-2">
              {selectedRole === user.role
                ? "Current Permissions:"
                : "Permissions if changed to " + selectedRole + ":"}
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {getRolePermissions(selectedRole).map((permission, index) => (
                <li key={index}>{permission}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Saved Addresses */}
      {user.addresses && user.addresses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Addresses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.addresses.map((address) => (
              <div key={address.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p>{address.label}</p>
                  {address.isDefault && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {address.firstName} {address.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {address.address}
                </p>
                <p className="text-sm text-muted-foreground">
                  {address.barangay && `${address.barangay}, `}
                  {address.city}, {address.state} {address.zipCode}
                </p>
                <p className="text-sm text-muted-foreground">{address.phone}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Add User Form Component
function AddUserForm({
  onSubmit,
  onCancel,
  currentUserRole,
}: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  currentUserRole: string;
}) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "customer" as
      | "customer"
      | "staff"
      | "inventory-clerk"
      | "admin"
      | "owner",
    // Address fields for customer accounts
    address: "",
    barangay: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));

    let processedValue = value;

    if (field === "firstName" || field === "lastName") {
      processedValue = value.replace(/[^A-Za-zÀ-ÿ\s'-]/g, "");
    } else if (field === "phone") {
      processedValue = value.replace(/[^0-9\s+-]/g, "");
    }

    setFormData({ ...formData, [field]: processedValue });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const firstNameVal = validateName(formData.firstName);
    if (!firstNameVal.valid) newErrors.firstName = firstNameVal.error || "";

    const lastNameVal = validateName(formData.lastName);
    if (!lastNameVal.valid) newErrors.lastName = lastNameVal.error || "";

    const emailVal = validateEmail(formData.email);
    if (!emailVal.valid) newErrors.email = emailVal.error || "";

    // Phone is required for customer accounts
    if (formData.role === "customer") {
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required for customers";
      } else {
        const phoneVal = validatePhoneNumber(formData.phone);
        if (!phoneVal.valid) newErrors.phone = phoneVal.error || "";
      }

      // Address fields are required for customer accounts
      if (!formData.address.trim()) {
        newErrors.address = "Street address is required";
      }
      if (!formData.barangay.trim()) {
        newErrors.barangay = "Barangay is required";
      }
      if (!formData.city.trim()) {
        newErrors.city = "City is required";
      }
      if (!formData.state.trim()) {
        newErrors.state = "Province/State is required";
      }
      if (!formData.zipCode.trim()) {
        newErrors.zipCode = "Zip code is required";
      }
    } else if (formData.phone.trim()) {
      const phoneVal = validatePhoneNumber(formData.phone);
      if (!phoneVal.valid) newErrors.phone = phoneVal.error || "";
    }

    const passwordVal = validatePassword(formData.password);
    if (!passwordVal.valid) newErrors.password = passwordVal.error || "";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    const submissionData = {
      ...formData,
      firstName: sanitizeInput(formData.firstName),
      lastName: sanitizeInput(formData.lastName),
      email: sanitizeInput(formData.email),
      phone: formData.phone ? formatPhoneNumber(formData.phone) : "",
      // Include address if it's a customer and address is provided
      ...(formData.role === "customer" && formData.address
        ? {
            addresses: [
              {
                id: "default-" + Date.now(),
                label: "Default Address",
                firstName: sanitizeInput(formData.firstName),
                lastName: sanitizeInput(formData.lastName),
                address: sanitizeInput(formData.address),
                barangay: sanitizeInput(formData.barangay),
                city: sanitizeInput(formData.city),
                state: sanitizeInput(formData.state),
                zipCode: sanitizeInput(formData.zipCode),
                country: "Philippines",
                phone: formData.phone ? formatPhoneNumber(formData.phone) : "",
                isDefault: true,
              },
            ],
          }
        : {}),
    };

    onSubmit(submissionData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-h-[70vh] overflow-y-auto px-1"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            className={errors.firstName ? "border-red-500" : ""}
            placeholder="Juan"
            required
          />
          {errors.firstName && (
            <p className="text-xs text-red-500">{errors.firstName}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            className={errors.lastName ? "border-red-500" : ""}
            placeholder="Dela Cruz"
            required
          />
          {errors.lastName && (
            <p className="text-xs text-red-500">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          className={errors.email ? "border-red-500" : ""}
          placeholder="juan.delacruz@example.com"
          required
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => handleInputChange("password", e.target.value)}
          className={errors.password ? "border-red-500" : ""}
          placeholder="••••••••"
          required
        />
        {errors.password && (
          <p className="text-xs text-red-500">{errors.password}</p>
        )}
        <p className="text-xs text-muted-foreground">
          At least 8 characters with letters and numbers
        </p>
      </div>

      <PhoneInput
        id="editPhone"
        label={`Phone Number ${formData.role === "customer" ? "*" : ""}`}
        value={formData.phone}
        onChange={(value) => {
          setFormData({ ...formData, phone: value });
          if (value) {
            const validation = validatePhoneNumber(value);
            if (!validation.valid) {
              setErrors({ ...errors, phone: validation.error || "" });
            } else {
              const newErrors = { ...errors };
              delete newErrors.phone;
              setErrors(newErrors);
            }
          }
        }}
        error={errors.phone}
        required={formData.role === "customer"}
        placeholder="932 549 0596"
      />

      <div className="space-y-2">
        <Label htmlFor="role">User Role *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              disabled={currentUserRole !== "owner"}
            >
              <span>{getRoleName(formData.role)}</span>
              <Filter className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-2"
            align="start"
          >
            <div className="space-y-1">
              <Button
                variant={formData.role === "customer" ? "secondary" : "ghost"}
                className="w-full justify-start flex-col items-start h-auto py-2"
                onClick={() => setFormData({ ...formData, role: "customer" })}
              >
                <p>{getRoleName("customer")}</p>
                <p className="text-xs text-muted-foreground">
                  {getRoleDescription("customer")}
                </p>
              </Button>
              {(currentUserRole === "owner" ||
                currentUserRole === "admin" ||
                currentUserRole === "staff" ||
                currentUserRole === "inventory-clerk") && (
                <>
                  <Button
                    variant={formData.role === "staff" ? "secondary" : "ghost"}
                    className="w-full justify-start flex-col items-start h-auto py-2"
                    onClick={() => setFormData({ ...formData, role: "staff" })}
                  >
                    <p>{getRoleName("staff")}</p>
                    <p className="text-xs text-muted-foreground">
                      {getRoleDescription("staff")}
                    </p>
                  </Button>
                  <Button
                    variant={
                      formData.role === "inventory-clerk"
                        ? "secondary"
                        : "ghost"
                    }
                    className="w-full justify-start flex-col items-start h-auto py-2"
                    onClick={() =>
                      setFormData({ ...formData, role: "inventory-clerk" })
                    }
                  >
                    <p>{getRoleName("inventory-clerk")}</p>
                    <p className="text-xs text-muted-foreground">
                      {getRoleDescription("inventory-clerk")}
                    </p>
                  </Button>
                </>
              )}
              {currentUserRole === "owner" && (
                <>
                  <Button
                    variant={formData.role === "admin" ? "secondary" : "ghost"}
                    className="w-full justify-start flex-col items-start h-auto py-2"
                    onClick={() => setFormData({ ...formData, role: "admin" })}
                  >
                    <p>{getRoleName("admin")}</p>
                    <p className="text-xs text-muted-foreground">
                      {getRoleDescription("admin")}
                    </p>
                  </Button>
                  <Button
                    variant={formData.role === "owner" ? "secondary" : "ghost"}
                    className="w-full justify-start flex-col items-start h-auto py-2"
                    onClick={() => setFormData({ ...formData, role: "owner" })}
                  >
                    <p>{getRoleName("owner")}</p>
                    <p className="text-xs text-muted-foreground">
                      {getRoleDescription("owner")}
                    </p>
                  </Button>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
        {currentUserRole === "admin" && (
          <p className="text-xs text-muted-foreground">
            Admins can create customer, sales staff, and inventory clerk
            accounts
          </p>
        )}
        {(currentUserRole === "staff" ||
          currentUserRole === "inventory-clerk") && (
          <p className="text-xs text-muted-foreground">
            You can only create customer accounts
          </p>
        )}
        {currentUserRole !== "owner" &&
          currentUserRole !== "admin" &&
          currentUserRole !== "staff" &&
          currentUserRole !== "inventory-clerk" && (
            <p className="text-xs text-muted-foreground">
              Only admins and owners can create accounts
            </p>
          )}
      </div>

      {/* Address Section - Only for Customer Accounts */}
      {formData.role === "customer" && (
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium">Billing/Shipping Address *</h4>
            <p className="text-xs text-muted-foreground">
              (Required for security & order fulfillment)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className={errors.address ? "border-red-500" : ""}
              placeholder="123 Main Street"
              required
            />
            {errors.address && (
              <p className="text-xs text-red-500">{errors.address}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="barangay">Barangay *</Label>
            <Input
              id="barangay"
              value={formData.barangay}
              onChange={(e) =>
                setFormData({ ...formData, barangay: e.target.value })
              }
              className={errors.barangay ? "border-red-500" : ""}
              placeholder="Barangay Name"
              required
            />
            {errors.barangay && (
              <p className="text-xs text-red-500">{errors.barangay}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City/Municipality *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className={errors.city ? "border-red-500" : ""}
                placeholder="Cagayan de Oro"
                required
              />
              {errors.city && (
                <p className="text-xs text-red-500">{errors.city}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Province/State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                className={errors.state ? "border-red-500" : ""}
                placeholder="Misamis Oriental"
                required
              />
              {errors.state && (
                <p className="text-xs text-red-500">{errors.state}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">Zip/Postal Code *</Label>
            <Input
              id="zipCode"
              value={formData.zipCode}
              onChange={(e) =>
                setFormData({ ...formData, zipCode: e.target.value })
              }
              className={errors.zipCode ? "border-red-500" : ""}
              placeholder="9000"
              required
            />
            {errors.zipCode && (
              <p className="text-xs text-red-500">{errors.zipCode}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          Create User
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
