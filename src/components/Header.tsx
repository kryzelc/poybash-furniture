"use client";

import { ShoppingCart, Search, Menu, User, X } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";
import { SearchDialog } from "./SearchDialog";
import { useState, useEffect } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { SUPABASE_URL } from "../services/storageService";

const poybashLogo = `${SUPABASE_URL}/storage/v1/object/public/assets/logos/poybash-logo.png`;

interface HeaderProps {
  onCartOpen: () => void;
}

export function Header({ onCartOpen }: HeaderProps) {
  const { getCartCount } = useCart();
  const { isAuthenticated, canAccessAdmin, signOut } = useAuth();
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Only update cart count on client-side to prevent hydration mismatch
  useEffect(() => {
    setCartCount(getCartCount());
  }, [getCartCount]);

  const handleProductClick = (productId: number) => {
    router.push(`/products/${productId}`);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    signOut();
    router.push("/");
  };

  return (
    <>
      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onProductClick={handleProductClick}
      />
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-16">
          <div className="flex h-14 sm:h-16 md:h-18 lg:h-20 items-center justify-between relative">
            {/* Left: Logo + Brand Name */}
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink min-w-0">
              {/* Mobile: Hamburger Menu */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 flex-shrink-0"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>

              <Link
                href="/"
                className="flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 group min-w-0 flex-shrink"
              >
                <img
                  src={poybashLogo}
                  alt="PoyBash Furniture"
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 transition-transform duration-200 group-hover:scale-105 flex-shrink-0"
                />
                <span className="text-base sm:text-sm md:text-base lg:text-xl font-semibold tracking-tight text-primary">
                  <span className="hidden sm:inline">PoyBash Furniture</span>
                  <span className="sm:hidden">PoyBash</span>
                </span>
              </Link>
            </div>

            {/* Center: Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
              <Link
                href="/products"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Shop
              </Link>
              <Link
                href="/about"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                About
              </Link>
              <Link
                href="/help"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Help
              </Link>
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              {/* Search */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-11 lg:w-11"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              {/* Account */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-11 lg:w-11"
                  >
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!isAuthenticated() ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/login">Login</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/register">Sign Up</Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/account">My Account</Link>
                      </DropdownMenuItem>
                      {canAccessAdmin() && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/admin">Admin Dashboard</Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        Logout
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-11 lg:w-11"
                onClick={onCartOpen}
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] sm:text-xs font-medium">
                    {cartCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Mobile/Tablet Menu Sheet */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetContent
              side="left"
              className="w-full sm:max-w-md flex flex-col p-0 h-full overflow-hidden lg:hidden"
              aria-describedby="mobile-menu-description"
            >
              <SheetHeader className="px-6 pt-6 pb-4 space-y-2 flex-shrink-0">
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription id="mobile-menu-description">
                  Navigate through PoyBash
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 min-h-0">
                <nav className="space-y-2 pb-4 pt-2">
                  {/* Shop */}
                  <Link
                    href="/products"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-left px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    Shop
                  </Link>

                  {/* About */}
                  <Link
                    href="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-left px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    About
                  </Link>

                  {/* Help */}
                  <Link
                    href="/help"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-left px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    Help
                  </Link>

                  {/* My Account / Login */}
                  {!isAuthenticated() ? (
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-left px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      Login
                    </Link>
                  ) : (
                    <Link
                      href="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-left px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      My Account
                    </Link>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
}
