"use client";

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { PhoneInput } from "../components/PhoneInput";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { toast } from "sonner";
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ktcadsqclaszdyymftvf.supabase.co";
const poybashLogo = `${SUPABASE_URL}/storage/v1/object/public/assets/logos/poybash-logo.png`;
// Removed Supabase import - using localStorage auth only
import {
  validateName,
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  validatePasswordMatch,
  formatPhoneNumber,
  sanitizeInput,
} from "../lib/validation";

interface RegisterPageProps {
  onNavigate: (page: string, id?: number | string, email?: string) => void;
}

export function RegisterPage({ onNavigate }: RegisterPageProps) {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Clear error for this field
    setErrors((prev) => ({ ...prev, [name]: "" }));

    // Apply specific formatting/filtering
    let processedValue = value;

    if (name === "firstName" || name === "lastName") {
      // Only allow letters, spaces, hyphens, and apostrophes
      processedValue = value.replace(/[^A-Za-zÀ-ÿ\s'-]/g, "");
    }

    setFormData({
      ...formData,
      [name]: processedValue,
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate first name
    const firstNameValidation = validateName(formData.firstName);
    if (!firstNameValidation.valid) {
      newErrors.firstName = firstNameValidation.error || "";
    }

    // Validate last name
    const lastNameValidation = validateName(formData.lastName);
    if (!lastNameValidation.valid) {
      newErrors.lastName = lastNameValidation.error || "";
    }

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error || "";
    }

    // Validate phone (optional but must be valid if provided)
    if (formData.phone.trim()) {
      const phoneValidation = validatePhoneNumber(formData.phone);
      if (!phoneValidation.valid) {
        newErrors.phone = phoneValidation.error || "";
      }
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.error || "";
    }

    // Validate password match
    const passwordMatchValidation = validatePasswordMatch(
      formData.password,
      formData.confirmPassword,
    );
    if (!passwordMatchValidation.valid) {
      newErrors.confirmPassword = passwordMatchValidation.error || "";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Form validation errors are shown inline
      return;
    }

    setIsLoading(true);

    try {
      // Register user
      const registrationResult = await signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        firstName: sanitizeInput(formData.firstName),
        lastName: sanitizeInput(formData.lastName),
        phone: formData.phone ? formatPhoneNumber(formData.phone) : "",
      });

      setIsLoading(false);

      if (!registrationResult.success) {
        toast.error("Account creation failed", {
          description:
            registrationResult.error || "An unexpected error occurred.",
        });
        return;
      }

      toast.success("Account created successfully!", {
        description: "You can now sign in to your account.",
      });

      // Navigate to login page
      onNavigate("login");
    } catch (error) {
      setIsLoading(false);
      toast.error("Account creation failed", {
        description: "An unexpected error occurred. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card className="bg-white">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img
                  src={poybashLogo}
                  alt="PoyBash Furniture"
                  className="w-16 h-16"
                />
              </div>
              <CardTitle>Create Account</CardTitle>
              <CardDescription>Join PoyBash Furniture today</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                      <p className="text-xs text-red-500">{errors.firstName}</p>
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
                      <p className="text-xs text-red-500">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="juan.delacruz@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? "border-red-500" : ""}
                    required
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <PhoneInput
                    id="phone"
                    label="Phone"
                    value={formData.phone}
                    onChange={(value) => {
                      setErrors((prev) => ({ ...prev, phone: "" }));
                      setFormData({ ...formData, phone: value });
                    }}
                    error={errors.phone}
                    placeholder="932 549 0596"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={errors.password ? "border-red-500" : ""}
                    required
                  />
                  {errors.password && (
                    <p className="text-xs text-red-500">{errors.password}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    At least 8 characters with letters and numbers
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={errors.confirmPassword ? "border-red-500" : ""}
                    required
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-2 text-muted-foreground">
                      Already have an account?
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => onNavigate("login")}
                >
                  Log In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
