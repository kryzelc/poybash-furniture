'use client';

import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Mail, RefreshCw } from 'lucide-react';
import { supabase } from '../utils/supabase/client';

interface VerifyEmailPageProps {
  email: string;
  onNavigate: (page: string) => void;
}

export function VerifyEmailPage({ email, onNavigate }: VerifyEmailPageProps) {
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        toast.error('Failed to resend verification email', {
          description: error.message,
          duration: 4000,
        });
      } else {
        toast.success('Verification email sent! 📧', {
          description: 'Please check your inbox.',
          duration: 4000,
        });
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsResending(false);
    }
  };

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
              <CardTitle>Verify Your Email</CardTitle>
              <CardDescription>
                We've sent a verification link to {email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-secondary/30 rounded-lg space-y-2">
                <p className="text-center">
                  Please check your email inbox and click the verification link to activate your account.
                </p>
                <p className="text-center text-muted-foreground">
                  The link will expire in 24 hours.
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResendEmail}
                  disabled={isResending}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
                  {isResending ? 'Sending...' : 'Resend Verification Email'}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => onNavigate('login')}
                >
                  Back to Login
                </Button>
              </div>

              <div className="text-center pt-4 border-t">
                <p className="text-muted-foreground mb-2">
                  Check your spam folder if you don't see the email
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
