"use client";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ktcadsqclaszdyymftvf.supabase.co";
const poybashLogo = `${SUPABASE_URL}/storage/v1/object/public/assets/logos/poybash-logo.png`;
import { AlertCircle } from "lucide-react";

interface ResetPasswordPageProps {
  onNavigate: (page: string) => void;
}

export function ResetPasswordPage({ onNavigate }: ResetPasswordPageProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
              <CardTitle>Password Reset Not Available</CardTitle>
              <CardDescription>
                This feature is not available in demo mode
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Password reset functionality requires email service integration,
                which is not available in localStorage demo mode.
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Please use one of the pre-configured demo accounts or contact an
                administrator for assistance.
              </p>
              <Button className="w-full" onClick={() => onNavigate("login")}>
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
