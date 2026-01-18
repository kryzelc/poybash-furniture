'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
const poybashLogo = "/images/d5402509ea28f1255409df1863e03ad909a38d15.png";
import { supabase } from '../utils/supabase/client';

interface LoginPageProps {
  onNavigate: (page: string, id?: number | string, email?: string) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { login, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check Supabase Auth first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Try local auth as fallback
        const success = await login(email, password);
        setIsLoading(false);

        if (success) {
          toast.success('Welcome back! 🎉', {
            description: 'You have successfully logged in.',
            duration: 4000,
          });
          if (isAdmin()) {
            onNavigate('admin');
          } else {
            onNavigate('account');
          }
        } else {
          toast.error('Login failed', {
            description: 'Invalid email or password. Please try again.',
            duration: 4000,
          });
        }
        return;
      }

      // Check if email is verified
      if (data.user && !data.user.email_confirmed_at) {
        setIsLoading(false);
        toast.error('Email not verified', {
          description: 'Please verify your email before logging in.',
          duration: 5000,
        });
        onNavigate('verify-email', undefined, email);
        return;
      }

      // Login successful with Supabase - also update local storage
      const success = await login(email, password);
      setIsLoading(false);

      if (success || data.user) {
        toast.success('Welcome back! 🎉', {
          description: 'You have successfully logged in.',
          duration: 4000,
        });
        if (isAdmin()) {
          onNavigate('admin');
        } else {
          onNavigate('account');
        }
      }
    } catch (error) {
      setIsLoading(false);
      toast.error('Login failed', {
        description: 'An unexpected error occurred. Please try again.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <ImageWithFallback src={poybashLogo} alt="PoyBash Furniture" className="w-16 h-16" />
              </div>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>
                Log in to your PoyBash Furniture account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => onNavigate('forgot-password')}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Log In'}
                </Button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-2 text-muted-foreground">
                      Don't have an account?
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => onNavigate('register')}
                >
                  Create Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
