/**
 * Product Service
 * 
 * Handles all product-related API operations.
 * No business logic - only data fetching/mutation.
 */

import { supabase } from './supabaseClient';
import { Product } from '@/models';
// Import static products as fallback
import { products as staticProducts } from '../lib/products';

export interface ProductFilters {
  category?: string;
  subCategory?: string;
  featured?: boolean;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  searchQuery?: string;
}

class ProductService {
  /**
   * Get all active products with optional filters
   */
  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    // For now, use static products (can be switched to Supabase later)
    return this.getStaticProducts(filters);
    
    /* Supabase implementation (uncomment when database is ready):
    let query = supabase
      .from('products')
      .select('*, variants(*)')
      .eq('active', true);

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.subCategory) {
      query = query.eq('sub_category', filters.subCategory);
    }

    if (filters?.featured !== undefined) {
      query = query.eq('featured', filters.featured);
    }

    if (filters?.inStock !== undefined) {
      query = query.eq('in_stock', filters.inStock);
    }

    if (filters?.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }

    if (filters?.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }

    if (filters?.searchQuery) {
      query = query.ilike('name', `%${filters.searchQuery}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return this.getStaticProducts(filters);
    }

    return data as Product[];
    */
  }

  /**
   * Get static products with filters (fallback/default)
   */
  private getStaticProducts(filters?: ProductFilters): Product[] {
    let products = staticProducts.filter(p => p.active);

    if (filters?.category) {
      products = products.filter(p => p.category === filters.category);
    }

    if (filters?.subCategory) {
      products = products.filter(p => p.subCategory === filters.subCategory);
    }

    if (filters?.featured !== undefined) {
      products = products.filter(p => p.featured === filters.featured);
    }

    if (filters?.inStock !== undefined) {
      products = products.filter(p => p.inStock === filters.inStock);
    }

    if (filters?.minPrice !== undefined) {
      products = products.filter(p => p.price >= filters.minPrice!);
    }

    if (filters?.maxPrice !== undefined) {
      products = products.filter(p => p.price <= filters.maxPrice!);
    }

    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    // Add timestamp fields and ensure variants array exists
    return products.map(p => ({
      ...p,
      variants: p.variants || [], // Ensure variants is always an array
      createdAt: '2024-01-01T00:00:00Z', // Default timestamp for static products
      updatedAt: '2024-01-01T00:00:00Z',
    }));
  }

  /**
   * Get featured products for homepage
   */
  async getFeaturedProducts(): Promise<Product[]> {
    return this.getProducts({ featured: true });
  }

  /**
   * Get a single product by ID
   */
  async getProductById(id: number): Promise<Product | null> {
    // Use static products
    const product = staticProducts.find(p => p.id === id && p.active);
    if (!product) return null;
    
    // Add timestamp fields and ensure variants array exists
    return {
      ...product,
      variants: product.variants || [], // Ensure variants is always an array
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    /* Supabase implementation (uncomment when database is ready):
    const { data, error } = await supabase
      .from('products')
      .select('*, variants(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching product:', error);
      return staticProducts.find(p => p.id === id && p.active) || null;
    }

    return data as Product;
    */
  }

  /**
   * Create a new product (Admin only)
   */
  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        price: product.price,
        description: product.description,
        category: product.category,
        sub_category: product.subCategory,
        image_url: product.imageUrl,
        images: product.images,
        material: product.material,
        dimensions: product.dimensions,
        in_stock: product.inStock,
        featured: product.featured,
        active: product.active,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }

    return data as Product;
  }

  /**
   * Update an existing product (Admin only)
   */
  async updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({
        name: updates.name,
        price: updates.price,
        description: updates.description,
        category: updates.category,
        sub_category: updates.subCategory,
        image_url: updates.imageUrl,
        images: updates.images,
        material: updates.material,
        dimensions: updates.dimensions,
        in_stock: updates.inStock,
        featured: updates.featured,
        active: updates.active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }

    return data as Product;
  }

  /**
   * Soft delete a product (Admin only)
   */
  async deleteProduct(id: number): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }

  /**
   * Search products by name
   */
  async searchProducts(query: string): Promise<Product[]> {
    return this.getProducts({ searchQuery: query });
  }
}

// Export singleton instance
export const productService = new ProductService();
