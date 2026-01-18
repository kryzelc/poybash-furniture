// Utility functions to help migrate existing products to use centralized taxonomies

import { getTaxonomies, addSubCategory, addMaterial, addColor, getMainCategories } from './taxonomies';
import type { Product } from './products';

/**
 * Scans all products and ensures their sub-categories, materials, and colors
 * exist in the centralized taxonomy system. Adds missing entries automatically.
 */
export const migrateProductsToTaxonomies = (products: Product[]): {
  addedSubCategories: string[];
  addedMaterials: string[];
  addedColors: string[];
} => {
  const taxonomies = getTaxonomies();
  const results = {
    addedSubCategories: [] as string[],
    addedMaterials: [] as string[],
    addedColors: [] as string[],
  };

  // Collect unique values from products
  const productSubCategories = new Set<string>();
  const productMaterials = new Set<string>();
  const productColors = new Set<string>();

  products.forEach(product => {
    if (product.subCategory) {
      productSubCategories.add(product.subCategory);
    }
    if (product.material) {
      productMaterials.add(product.material);
    }
    
    // Collect colors from variants
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach(variant => {
        if (variant.color) {
          productColors.add(variant.color);
        }
      });
    }
    
    // Collect colors from legacy system
    if (product.colors && product.colors.length > 0) {
      product.colors.forEach(color => {
        if (color) {
          productColors.add(color);
        }
      });
    }
  });

  // Add missing sub-categories
  const mainCategories = getMainCategories();
  productSubCategories.forEach(subCatName => {
    const exists = taxonomies.subCategories.some(
      sc => sc.name.toLowerCase() === subCatName.toLowerCase() && sc.active
    );
    
    if (!exists) {
      // Find which main category this sub-category belongs to
      const product = products.find(p => p.subCategory === subCatName);
      if (product) {
        // Find the main category ID by matching the product's category name
        const mainCategory = mainCategories.find(mc => mc.name === product.category);
        if (mainCategory) {
          try {
            addSubCategory({
              name: subCatName,
              categoryId: mainCategory.id,
              active: true,
            });
            results.addedSubCategories.push(subCatName);
          } catch (error) {
            console.warn(`Failed to add sub-category "${subCatName}":`, error);
          }
        }
      }
    }
  });

  // Add missing materials
  productMaterials.forEach(materialName => {
    const exists = taxonomies.materials.some(
      m => m.name.toLowerCase() === materialName.toLowerCase() && m.active
    );
    
    if (!exists) {
      try {
        addMaterial({
          name: materialName,
          active: true,
        });
        results.addedMaterials.push(materialName);
      } catch (error) {
        console.warn(`Failed to add material "${materialName}":`, error);
      }
    }
  });

  // Add missing colors
  productColors.forEach(colorName => {
    const exists = taxonomies.colors.some(
      c => c.name.toLowerCase() === colorName.toLowerCase() && c.active
    );
    
    if (!exists) {
      try {
        addColor({
          name: colorName,
          active: true,
        });
        results.addedColors.push(colorName);
      } catch (error) {
        console.warn(`Failed to add color "${colorName}":`, error);
      }
    }
  });

  return results;
};

/**
 * Validates that a product's attributes exist in the taxonomy system
 */
export const validateProductAttributes = (product: Partial<Product>): {
  valid: boolean;
  errors: string[];
} => {
  const taxonomies = getTaxonomies();
  const errors: string[] = [];

  // Validate sub-category
  if (product.subCategory) {
    const mainCategories = getMainCategories();
    const mainCategory = mainCategories.find(mc => mc.name === product.category);
    const subCategoryExists = taxonomies.subCategories.some(
      sc => sc.name === product.subCategory && 
           sc.active && 
           sc.categoryId === mainCategory?.id
    );
    
    if (!subCategoryExists) {
      errors.push(`Sub-category "${product.subCategory}" does not exist for ${product.category}`);
    }
  }

  // Validate material
  if (product.material) {
    const materialExists = taxonomies.materials.some(
      m => m.name === product.material && m.active
    );
    
    if (!materialExists) {
      errors.push(`Material "${product.material}" does not exist`);
    }
  }

  // Validate variant colors
  if (product.variants && product.variants.length > 0) {
    product.variants.forEach(variant => {
      const colorExists = taxonomies.colors.some(
        c => c.name === variant.color && c.active
      );
      
      if (!colorExists) {
        errors.push(`Color "${variant.color}" does not exist`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Gets suggested sub-categories based on category
 */
export const getSuggestedSubCategories = (category: 'chairs' | 'tables'): string[] => {
  const taxonomies = getTaxonomies();
  const mainCategories = getMainCategories();
  const mainCategory = mainCategories.find(mc => mc.name === category);
  
  if (!mainCategory) return [];
  
  return taxonomies.subCategories
    .filter(sc => sc.categoryId === mainCategory.id && sc.active)
    .map(sc => sc.name)
    .sort();
};

/**
 * Gets all active materials
 */
export const getSuggestedMaterials = (): string[] => {
  const taxonomies = getTaxonomies();
  return taxonomies.materials
    .filter(m => m.active)
    .map(m => m.name)
    .sort();
};

/**
 * Gets all active colors
 */
export const getSuggestedColors = (): string[] => {
  const taxonomies = getTaxonomies();
  return taxonomies.colors
    .filter(c => c.active)
    .map(c => c.name)
    .sort();
};
