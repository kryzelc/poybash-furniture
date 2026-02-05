"use client";
import Link from "next/link";
import { Facebook, Phone } from "lucide-react";

import { SUPABASE_URL } from "../utils/imageUrls";

const poybashLogo = `${SUPABASE_URL}/storage/v1/object/public/assets/logos/poybash-logo.png`;

export function Footer() {
  return (
    <footer className="bg-[#5D4037] text-[#FDFBF7] mt-auto">
      <div className="container max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-16 py-6 sm:py-8 md:py-10 lg:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-6 sm:gap-8 lg:gap-12 mb-4 sm:mb-6">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <img
                src={poybashLogo}
                alt="PoyBash Furniture"
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0"
              />
              <span className="text-base sm:text-lg font-semibold tracking-tight whitespace-nowrap">
                PoyBash Furniture
              </span>
            </div>
            <p className="text-[#D7CCC8] text-xs sm:text-sm mb-3 sm:mb-4 max-w-xs">
              Quality chairs and tables for modern living spaces.
            </p>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="https://bit.ly/poybash"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 sm:gap-2 text-[#D7CCC8] hover:text-[#FDFBF7] transition-colors text-xs sm:text-sm"
                aria-label="Visit our Facebook page"
              >
                <Facebook className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">Facebook</span>
              </Link>
              <Link
                href="tel:+639325490596"
                className="flex items-center gap-1.5 sm:gap-2 text-[#D7CCC8] hover:text-[#FDFBF7] transition-colors text-xs sm:text-sm"
                aria-label="Call us"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">Call Us</span>
              </Link>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="mb-2 sm:mb-3 font-semibold text-sm sm:text-base">
              Shop
            </h4>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link
                  href="/products"
                  className="text-[#D7CCC8] hover:text-[#FDFBF7] transition-colors text-xs sm:text-sm"
                >
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="mb-2 sm:mb-3 font-semibold text-sm sm:text-base">
              Company
            </h4>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-[#D7CCC8] hover:text-[#FDFBF7] transition-colors text-xs sm:text-sm"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-[#D7CCC8] hover:text-[#FDFBF7] transition-colors text-xs sm:text-sm"
                >
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h4 className="mb-2 sm:mb-3 font-semibold text-sm sm:text-base">
              Account
            </h4>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link
                  href="/account"
                  className="text-[#D7CCC8] hover:text-[#FDFBF7] transition-colors text-xs sm:text-sm"
                >
                  My Account
                </Link>
              </li>
              <li>
                <Link
                  href="/account"
                  className="text-[#D7CCC8] hover:text-[#FDFBF7] transition-colors text-xs sm:text-sm"
                >
                  My Orders
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-3 sm:pt-4 border-t border-[#795548]/30">
          <p className="text-[#D7CCC8] text-[10px] sm:text-xs md:text-sm text-center sm:text-left">
            © 2025 PoyBash Furniture. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
