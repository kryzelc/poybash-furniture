"use client";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Mail } from "lucide-react";

interface VerifyEmailPageProps {
  email: string;
  onNavigate: (page: string) => void;
}

export function VerifyEmailPage({ email, onNavigate }: VerifyEmailPageProps) {
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
              <CardTitle>Email Verification Not Required</CardTitle>
              <CardDescription>
                This feature is not available in demo mode
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-secondary/30 rounded-lg space-y-2">
                <p className="text-center">
                  Email verification is not required for localStorage demo mode.
                  Your account for {email} is ready to use.
                </p>
                <p className="text-center text-muted-foreground">
                  In a production environment, you would receive a verification email.
                </p>
              </div>

              <Button
                className="w-full"
                onClick={() => onNavigate("login")}
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
