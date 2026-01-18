// Taxonomy Management System for Product Attributes
// Centralizes management of categories, sub-categories, materials, and colors

export interface MainCategory {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubCategory {
  id: string;
  name: string;
  categoryId: string; // Links to MainCategory.id
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Color {
  id: string;
  name: string;
  hexCode?: string; // Optional color code for visual reference
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Taxonomies {
  mainCategories: MainCategory[];
  subCategories: SubCategory[];
  materials: Material[];
  colors: Color[];
}

// Default taxonomies matching customer-side filters exactly
const defaultTaxonomies: Taxonomies = {
  mainCategories: [
    { id: 'cat-chairs', name: 'chairs', displayName: 'Chairs', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cat-tables', name: 'tables', displayName: 'Tables', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  subCategories: [
    // Chair sub-categories (matching customer Category filter)
    { id: 'sc-1', name: 'Dining Chairs', categoryId: 'cat-chairs', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sc-2', name: 'Bar Stools', categoryId: 'cat-chairs', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sc-3', name: 'Stools & Benches', categoryId: 'cat-chairs', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    
    // Table sub-categories (matching customer Category filter)
    { id: 'sc-4', name: 'Dining Tables', categoryId: 'cat-tables', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sc-5', name: 'Bar Tables', categoryId: 'cat-tables', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  materials: [
    // Matching customer Material filter exactly
    { id: 'mat-1', name: 'Solid Wood', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'mat-2', name: 'Solid Wood & Fabric', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'mat-3', name: 'Solid Wood & Woven Cane', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  colors: [
    // Matching customer Color filter exactly
    { id: 'col-1', name: 'Beige', hexCode: '#F5F5DC', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'col-2', name: 'Black', hexCode: '#000000', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'col-3', name: 'Brown', hexCode: '#8B4513', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'col-4', name: 'Dark Brown', hexCode: '#654321', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'col-5', name: 'Green', hexCode: '#228B22', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'col-6', name: 'Grey', hexCode: '#808080', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'col-7', name: 'Natural Wood', hexCode: '#D4C5B0', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'col-8', name: 'Pink', hexCode: '#FFC0CB', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'col-9', name: 'Walnut', hexCode: '#5C4033', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'col-10', name: 'White', hexCode: '#FFFFFF', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
};

const STORAGE_KEY = 'poybash_taxonomies';
const VERSION_KEY = 'poybash_taxonomies_version';
const CURRENT_VERSION = '3'; // Increment this when default taxonomies change

// Get taxonomies from localStorage or use defaults
export const getTaxonomies = (): Taxonomies => {
  if (typeof window === 'undefined') return defaultTaxonomies;
  
  const storedVersion = localStorage.getItem(VERSION_KEY);
  const stored = localStorage.getItem(STORAGE_KEY);
  
  // If version doesn't match or no stored data, reset to defaults
  if (!stored || storedVersion !== CURRENT_VERSION) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTaxonomies));
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    return defaultTaxonomies;
  }
  
  return JSON.parse(stored);
};

// Save taxonomies to localStorage
const saveTaxonomies = (taxonomies: Taxonomies): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(taxonomies));
};

// Generate unique ID
const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================================================
// MAIN CATEGORY OPERATIONS
// ============================================================================

export const getMainCategories = (includeInactive: boolean = false): MainCategory[] => {
  const taxonomies = getTaxonomies();
  return includeInactive 
    ? taxonomies.mainCategories 
    : taxonomies.mainCategories.filter(cat => cat.active);
};

export const addMainCategory = (
  data: Omit<MainCategory, 'id' | 'createdAt' | 'updatedAt'>
): MainCategory => {
  const taxonomies = getTaxonomies();
  
  // Check for existing category (active or inactive) with the same name
  const existing = taxonomies.mainCategories.find(
    cat => cat.name.toLowerCase().trim() === data.name.toLowerCase().trim()
  );
  
  // If it exists and is active, throw error
  if (existing && existing.active) {
    throw new Error(`Category "${data.displayName}" already exists`);
  }
  
  // If it exists but is inactive, reactivate it
  if (existing && !existing.active) {
    const index = taxonomies.mainCategories.findIndex(cat => cat.id === existing.id);
    taxonomies.mainCategories[index] = {
      ...existing,
      active: true,
      updatedAt: new Date().toISOString(),
    };
    saveTaxonomies(taxonomies);
    return taxonomies.mainCategories[index];
  }
  
  // Otherwise, create new category
  const newCategory: MainCategory = {
    ...data,
    id: generateId('cat'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  taxonomies.mainCategories.push(newCategory);
  saveTaxonomies(taxonomies);
  
  return newCategory;
};

export const updateMainCategory = (
  id: string,
  updates: Partial<Omit<MainCategory, 'id' | 'createdAt'>>
): MainCategory => {
  const taxonomies = getTaxonomies();
  const index = taxonomies.mainCategories.findIndex(cat => cat.id === id);
  
  if (index === -1) {
    throw new Error('Main category not found');
  }
  
  // Check for duplicate names if name is being updated
  if (updates.name) {
    const duplicate = taxonomies.mainCategories.find(
      cat => cat.id !== id &&
            cat.name.toLowerCase() === updates.name!.toLowerCase() &&
            cat.active
    );
    
    if (duplicate) {
      throw new Error(`Category "${updates.displayName || updates.name}" already exists`);
    }
  }
  
  const updatedCategory = {
    ...taxonomies.mainCategories[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  taxonomies.mainCategories[index] = updatedCategory;
  saveTaxonomies(taxonomies);
  
  return updatedCategory;
};

export const deleteMainCategory = (id: string): void => {
  const taxonomies = getTaxonomies();
  const index = taxonomies.mainCategories.findIndex(cat => cat.id === id);
  
  if (index === -1) {
    throw new Error('Main category not found');
  }
  
  // Soft delete
  taxonomies.mainCategories[index] = {
    ...taxonomies.mainCategories[index],
    active: false,
    updatedAt: new Date().toISOString(),
  };
  
  saveTaxonomies(taxonomies);
};

export const reactivateMainCategory = (id: string): void => {
  const taxonomies = getTaxonomies();
  const index = taxonomies.mainCategories.findIndex(cat => cat.id === id);
  
  if (index === -1) {
    throw new Error('Main category not found');
  }
  
  // Reactivate
  taxonomies.mainCategories[index] = {
    ...taxonomies.mainCategories[index],
    active: true,
    updatedAt: new Date().toISOString(),
  };
  
  saveTaxonomies(taxonomies);
};

// ============================================================================
// SUB-CATEGORY OPERATIONS
// ============================================================================

export const getSubCategories = (includeInactive: boolean = false): SubCategory[] => {
  const taxonomies = getTaxonomies();
  return includeInactive 
    ? taxonomies.subCategories 
    : taxonomies.subCategories.filter(sc => sc.active);
};

export const getSubCategoriesByMainCategory = (
  categoryId: string,
  includeInactive: boolean = false
): SubCategory[] => {
  return getSubCategories(includeInactive).filter(sc => sc.categoryId === categoryId);
};

export const addSubCategory = (
  data: Omit<SubCategory, 'id' | 'createdAt' | 'updatedAt'>
): SubCategory => {
  const taxonomies = getTaxonomies();
  
  // Check for existing category (active or inactive) with the same name
  const existing = taxonomies.subCategories.find(
    sc => sc.name.toLowerCase().trim() === data.name.toLowerCase().trim() && 
          sc.categoryId === data.categoryId
  );
  
  // If it exists and is active, throw error
  if (existing && existing.active) {
    throw new Error(`Category "${data.name}" already exists for ${data.categoryId}`);
  }
  
  // If it exists but is inactive, reactivate it
  if (existing && !existing.active) {
    const index = taxonomies.subCategories.findIndex(sc => sc.id === existing.id);
    taxonomies.subCategories[index] = {
      ...existing,
      active: true,
      updatedAt: new Date().toISOString(),
    };
    saveTaxonomies(taxonomies);
    return taxonomies.subCategories[index];
  }
  
  // Otherwise, create new category
  const newSubCategory: SubCategory = {
    ...data,
    id: generateId('sc'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  taxonomies.subCategories.push(newSubCategory);
  saveTaxonomies(taxonomies);
  
  return newSubCategory;
};

export const updateSubCategory = (
  id: string,
  updates: Partial<Omit<SubCategory, 'id' | 'createdAt'>>
): SubCategory => {
  const taxonomies = getTaxonomies();
  const index = taxonomies.subCategories.findIndex(sc => sc.id === id);
  
  if (index === -1) {
    throw new Error('Sub-category not found');
  }
  
  // Check for duplicate names if name is being updated
  if (updates.name) {
    const duplicate = taxonomies.subCategories.find(
      sc => sc.id !== id &&
            sc.name.toLowerCase() === updates.name!.toLowerCase() &&
            sc.categoryId === (updates.categoryId || taxonomies.subCategories[index].categoryId) &&
            sc.active
    );
    
    if (duplicate) {
      throw new Error(`Sub-category "${updates.name}" already exists`);
    }
  }
  
  const updatedSubCategory = {
    ...taxonomies.subCategories[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  taxonomies.subCategories[index] = updatedSubCategory;
  saveTaxonomies(taxonomies);
  
  return updatedSubCategory;
};

export const deleteSubCategory = (id: string): void => {
  const taxonomies = getTaxonomies();
  const index = taxonomies.subCategories.findIndex(sc => sc.id === id);
  
  if (index === -1) {
    throw new Error('Sub-category not found');
  }
  
  // Soft delete
  taxonomies.subCategories[index] = {
    ...taxonomies.subCategories[index],
    active: false,
    updatedAt: new Date().toISOString(),
  };
  
  saveTaxonomies(taxonomies);
};

export const reactivateSubCategory = (id: string): void => {
  const taxonomies = getTaxonomies();
  const index = taxonomies.subCategories.findIndex(sc => sc.id === id);
  
  if (index === -1) {
    throw new Error('Sub-category not found');
  }
  
  // Reactivate
  taxonomies.subCategories[index] = {
    ...taxonomies.subCategories[index],
    active: true,
    updatedAt: new Date().toISOString(),
  };
  
  saveTaxonomies(taxonomies);
};

export const hardDeleteSubCategory = (id: string): void => {
  const taxonomies = getTaxonomies();
  const index = taxonomies.subCategories.findIndex(sc => sc.id === id);
  
  if (index === -1) {
    throw new Error('Sub-category not found');
  }
  
  // Permanent delete - remove from array
  taxonomies.subCategories.splice(index, 1);
  
  saveTaxonomies(taxonomies);
};

// ============================================================================
// MATERIAL OPERATIONS
// ============================================================================

export const getMaterials = (includeInactive: boolean = false): Material[] => {
  const taxonomies = getTaxonomies();
  return includeInactive 
    ? taxonomies.materials 
    : taxonomies.materials.filter(m => m.active);
};

export const addMaterial = (
  data: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>
): Material => {
  const taxonomies = getTaxonomies();
  
  // Check for existing material (active or inactive) with the same name
  const existing = taxonomies.materials.find(
    m => m.name.toLowerCase().trim() === data.name.toLowerCase().trim()
  );
  
  // If it exists and is active, throw error
  if (existing && existing.active) {
    throw new Error(`Material "${data.name}" already exists`);
  }
  
  // If it exists but is inactive, reactivate it
  if (existing && !existing.active) {
    const index = taxonomies.materials.findIndex(m => m.id === existing.id);
    taxonomies.materials[index] = {
      ...existing,
      active: true,
      updatedAt: new Date().toISOString(),
    };
    saveTaxonomies(taxonomies);
    return taxonomies.materials[index];
  }
  
  // Otherwise, create new material
  const newMaterial: Material = {
    ...data,
    id: generateId('mat'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  taxonomies.materials.push(newMaterial);
  saveTaxonomies(taxonomies);
  
  return newMaterial;
};

export const updateMaterial = (
  id: string,
  updates: Partial<Omit<Material, 'id' | 'createdAt'>>
): Material => {
  const taxonomies = getTaxonomies();
  const index = taxonomies.materials.findIndex(m => m.id === id);
  
  if (index === -1) {
    throw new Error('Material not found');
  }
  
  // Check for duplicate names if name is being updated
  if (updates.name) {
    const duplicate = taxonomies.materials.find(
      m => m.id !== id &&
           m.name.toLowerCase() === updates.name!.toLowerCase() &&
           m.active
    );
    
    if (duplicate) {
      throw new Error(`Material "${updates.name}" already exists`);
    }
  }
  
  const updatedMaterial = {
    ...taxonomies.materials[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  taxonomies.materials[index] = updatedMaterial;
  saveTaxonomies(taxonomies);
  
  return updatedMaterial;
};

export const deleteMaterial = (id: string): void => {
  const taxonomies = getTaxonomies();
  const index = taxonomies.materials.findIndex(m => m.id === id);
  
  if (index === -1) {
    throw new Error('Material not found');
  }
  
  // Soft delete
  taxonomies.materials[index] = {
    ...taxonomies.materials[index],
    active: false,
    updatedAt: new Date().toISOString(),
  };
  
  saveTaxonomies(taxonomies);
};

export const reactivateMaterial = (id: string): void => {
  const taxonomies = getTaxonomies();
  const index = taxonomies.materials.findIndex(m => m.id === id);
  
  if (index === -1) {
    throw new Error('Material not found');
  }
  
  // Reactivate
  taxonomies.materials[index] = {
    ...taxonomies.materials[index],
    active: true,
    updatedAt: new Date().toISOString(),
  };
  
  saveTaxonomies(taxonomies);
};

export const hardDeleteMaterial = (id: string): void => {
  const taxonomies = getTaxonomies();
  const index = taxonomies.materials.findIndex(m => m.id === id);
  
  if (index === -1) {
    throw new Error('Material not found');
  }
  
  // Permanent delete - remove from array
  taxonomies.materials.splice(index, 1);
  
  saveTaxonomies(taxonomies);
};

// ============================================================================
// COLOR OPERATIONS
// ============================================================================

export const getColors = (includeInactive: boolean = false): Color[] => {
  const taxonomies = getTaxonomies();
  return includeInactive 
    ? taxonomies.colors 
    : taxonomies.colors.filter(c => c.active);
};

export const addColor = (
  data: Omit<Color, 'id' | 'createdAt' | 'updatedAt'>
): Color => {
  const taxonomies = getTaxonomies();
  
  // Check for existing color (active or inactive) with the same name
  const existing = taxonomies.colors.find(
    c => c.name.toLowerCase().trim() === data.name.toLowerCase().trim()
  );
  
  // If it exists and is active, throw error
  if (existing && existing.active) {
    throw new Error(`Color "${data.name}" already exists`);
  }
  
  // If it exists but is inactive, reactivate it
  if (existing && !existing.active) {
    const index = taxonomies.colors.findIndex(c => c.id === existing.id);
    taxonomies.colors[index] = {
      ...existing,
      active: true,
      updatedAt: new Date().toISOString(),
    };
    saveTaxonomies(taxonomies);
    return taxonomies.colors[index];
  }
  
  // Otherwise, create new color
  const newColor: Color = {
    ...data,
    id: generateId('col'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  taxonomies.colors.push(newColor);
  saveTaxonomies(taxonomies);
  
  return newColor;
};

export const updateColor = (
  id: string,
  updates: Partial<Omit<Color, 'id' | 'createdAt'>>
): Color => {
  const taxonomies = getTaxonomies();
  const index = taxonomies.colors.findIndex(c => c.id === id);
  
  if (index === -1) {
    throw new Error('Color not found');
  }
  
  // Check for duplicate names if name is being updated
  if (updates.name) {
    const duplicate = taxonomies.colors.find(
      c => c.id !== id &&
           c.name.toLowerCase() === updates.name!.toLowerCase() &&
           c.active
    );
    
    if (duplicate) {
      throw new Error(`Color "${updates.name}" already exists`);
    }
  }
  
  const updatedColor = {
    ...taxonomies.colors[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  taxonomies.colors[index] = updatedColor;
  saveTaxonomies(taxonomies);
  
  return updatedColor;
};

export const deleteColor = (id: string): void => {
  const taxonomies = getTaxonomies();
  const index = taxonomies.colors.findIndex(c => c.id === id);
  
  if (index === -1) {
    throw new Error('Color not found');
  }
  
  // Soft delete
  taxonomies.colors[index] = {
    ...taxonomies.colors[index],
    active: false,
    updatedAt: new Date().toISOString(),
  };
  
  saveTaxonomies(taxonomies);
};

export const reactivateColor = (id: string): void => {
  const taxonomies = getTaxonomies();
  const index = taxonomies.colors.findIndex(c => c.id === id);
  
  if (index === -1) {
    throw new Error('Color not found');
  }
  
  // Reactivate
  taxonomies.colors[index] = {
    ...taxonomies.colors[index],
    active: true,
    updatedAt: new Date().toISOString(),
  };
  
  saveTaxonomies(taxonomies);
};

export const hardDeleteColor = (id: string): void => {
  const taxonomies = getTaxonomies();
  const index = taxonomies.colors.findIndex(c => c.id === id);
  
  if (index === -1) {
    throw new Error('Color not found');
  }
  
  // Permanent delete - remove from array
  taxonomies.colors.splice(index, 1);
  
  saveTaxonomies(taxonomies);
};