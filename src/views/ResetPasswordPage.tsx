"use client";

import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ktcadsqclaszdyymftvf.supabase.co";
const poybashLogo = `${SUPABASE_URL}/storage/v1/object/public/assets/logos/poybash-logo.png`;
import { supabase } from "../utils/supabase/client";
import { CheckCircle } from "lucide-react";
import { validatePassword } from "../lib/validation";

interface ResetPasswordPageProps {
  onNavigate: (page: string) => void;
}

export function ResetPasswordPage({ onNavigate }: ResetPasswordPageProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if user has a valid session from the reset link
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Invalid or expired reset link", {
          description: "Please request a new password reset link.",
        });
        setTimeout(() => onNavigate("forgot-password"), 2000);
      }
    };
    checkSession();
  }, [onNavigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.error || "";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error("Failed to reset password", {
          description: error.message || "Please try again.",
          duration: 4000,
        });
      } else {
        setPasswordReset(true);
        toast.success("Password updated successfully", {
          description: "You can now sign in with your new password.",
        });
        setTimeout(() => onNavigate("login"), 2000);
      }
    } catch (error) {
      toast.error("An unexpected error occurred", {
        description: "Please try again later.",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (passwordReset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <CardTitle>Password Reset Complete</CardTitle>
                <CardDescription>
                  Your password has been successfully reset
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground mb-4">
                  Redirecting you to login...
                </p>
                <Button className="w-full" onClick={() => onNavigate("login")}>
                  Go to Login
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img
                  src={poybashLogo}
                  alt="PoyBash Furniture"
                  className="w-16 h-16"
                />
              </div>
              <CardTitle>Reset Your Password</CardTitle>
              <CardDescription>Enter your new password below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, password: "" }));
                    }}
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
                  <Label htmlFor="confirmPassword">
                    Confirm New Password *
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                    }}
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
                  {isLoading ? "Resetting Password..." : "Reset Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
