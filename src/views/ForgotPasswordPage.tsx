"use client";

import { useState } from "react";
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
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ktcadsqclaszdyymftvf.supabase.co";
const poybashLogo = `${SUPABASE_URL}/storage/v1/object/public/assets/logos/poybash-logo.png`;
// Removed Supabase import - password reset not available in localStorage mode
import { ArrowLeft, Mail } from "lucide-react";

interface ForgotPasswordPageProps {
  onNavigate: (page: string) => void;
}

export function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate sending email for demo purposes
    setTimeout(() => {
      setEmailSent(true);
      toast.info("Demo Mode", {
        description: "Password reset is not available in demo mode. Please contact an administrator to reset your password.",
        duration: 5000,
      });
      setIsLoading(false);
    }, 1000);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle>Password Reset Not Available</CardTitle>
                <CardDescription>
                  This feature requires email service (demo mode)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-muted-foreground">
                  Password reset functionality is not available in localStorage demo mode.
                  In a production environment, this would send a reset link to {email}.
                </p>
                <p className="text-center text-sm text-muted-foreground">
                  For demo purposes, you can use any of the pre-configured accounts or contact an administrator.
                </p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setEmailSent(false)}
                  >
                    Didn't receive the email? Try again
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => onNavigate("login")}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </div>
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
          <Card className="bg-white">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img
                  src={poybashLogo}
                  alt="PoyBash Furniture"
                  className="w-16 h-16"
                />
              </div>
              <CardTitle>Forgot Password?</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your
                password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="juan.delacruz@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => onNavigate("login")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
