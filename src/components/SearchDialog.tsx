"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { products } from "../lib/products";
import { Search } from "lucide-react";

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  onProductClick: (productId: number) => void;
}

export function SearchDialog({
  open,
  onClose,
  onProductClick,
}: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase().trim();

    // Helper function to check if words match
    const matchesWords = (text: string, searchTerm: string): boolean => {
      const textLower = text.toLowerCase();
      const words = searchTerm.split(/\s+/);

      // Check if all search words appear in the text
      return words.every((word) => textLower.includes(word));
    };

    // Score products based on match quality
    const scoredProducts = products
      .map((product) => {
        let score = 0;
        const nameLower = product.name.toLowerCase();
        const descLower = product.description.toLowerCase();
        const categoryLower = product.category.toLowerCase();
        const subCategoryLower = product.subCategory.toLowerCase();
        const materialLower = product.material.toLowerCase();

        // Exact matches get highest priority
        if (nameLower === query) score += 100;
        if (subCategoryLower === query) score += 90;
        if (categoryLower === query) score += 80;
        if (materialLower === query) score += 70;

        // Word starts with query
        if (nameLower.startsWith(query)) score += 50;
        if (subCategoryLower.startsWith(query)) score += 40;

        // All search words match
        if (matchesWords(product.name, query)) score += 30;
        if (matchesWords(product.subCategory, query)) score += 25;
        if (matchesWords(product.category, query)) score += 20;
        if (matchesWords(product.description, query)) score += 15;
        if (matchesWords(product.material, query)) score += 10;

        return { product, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.product);

    return scoredProducts.slice(0, 6);
  }, [searchQuery]);

  const handleProductClick = (productId: number) => {
    onProductClick(productId);
    onClose();
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Find Your Furniture</DialogTitle>
          <DialogDescription>
            Browse our collection of handcrafted chairs and tables
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-hidden flex flex-col min-h-0">
          <div className="relative flex-shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Try 'dining chair' or 'dining table'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 h-16 pt-5 pb-5 rounded-2xl border-2 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
              style={{ lineHeight: "1.5" }}
              autoFocus
            />
          </div>

          {searchQuery.trim() && (
            <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-2">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No products found for "{searchQuery}"
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="truncate">{product.name}</h4>
                      <p className="text-muted-foreground">
                        {product.subCategory}
                      </p>
                    </div>
                    <p className="text-primary">₱{product.price.toFixed(2)}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
