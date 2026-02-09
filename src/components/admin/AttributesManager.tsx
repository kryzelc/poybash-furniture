'use client';

import { useState } from 'react';
import { Edit, Trash2, Plus, Tags, Palette, Layers, Search, X, Check, AlertCircle, RotateCcw, FolderTree } from 'lucide-react';
import { toast } from 'sonner';
import { 
  getTaxonomies,
  getMainCategories,
  addMainCategory,
  updateMainCategory,
  deleteMainCategory,
  reactivateMainCategory,
  addSubCategory,
  updateSubCategory,
  deleteSubCategory,
  reactivateSubCategory,
  addMaterial,
  updateMaterial,
  deleteMaterial,
  reactivateMaterial,
  addColor,
  updateColor,
  deleteColor,
  reactivateColor,
  type MainCategory,
  type SubCategory,
  type Material,
  type Color,
} from '../../lib/taxonomies';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AttributesManagerProps {
  onClose: () => void;
  logAction: (action: string, details: string, userId: string, userName: string) => void;
}

type DialogAction = 'deactivate' | 'reactivate' | null;

export function AttributesManager({ onClose, logAction }: AttributesManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [taxonomies, setTaxonomies] = useState(getTaxonomies());
  
  // Main category state
  const [editingMainCategory, setEditingMainCategory] = useState<MainCategory | null>(null);
  const [newMainCategoryName, setNewMainCategoryName] = useState('');
  const [newMainCategoryDisplayName, setNewMainCategoryDisplayName] = useState('');
  const [mainCategoryDialogItem, setMainCategoryDialogItem] = useState<MainCategory | null>(null);
  const [mainCategoryDialogAction, setMainCategoryDialogAction] = useState<DialogAction>(null);
  
  // Sub-category state
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [newSubCategoryMainCategory, setNewSubCategoryMainCategory] = useState<string>('');
  const [subCategoryDialogItem, setSubCategoryDialogItem] = useState<SubCategory | null>(null);
  const [subCategoryDialogAction, setSubCategoryDialogAction] = useState<DialogAction>(null);
  
  // Material state
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [materialDialogItem, setMaterialDialogItem] = useState<Material | null>(null);
  const [materialDialogAction, setMaterialDialogAction] = useState<DialogAction>(null);
  
  // Color state
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#FFFFFF');
  const [colorDialogItem, setColorDialogItem] = useState<Color | null>(null);
  const [colorDialogAction, setColorDialogAction] = useState<DialogAction>(null);

  // Set default category for sub-category creation
  useState(() => {
    const activeCategories = getMainCategories();
    if (activeCategories.length > 0) {
      setNewSubCategoryMainCategory(activeCategories[0].id);
    }
  });

  const refreshTaxonomies = () => {
    setTaxonomies(getTaxonomies());
  };

  const getCurrentUser = () => {
    const userStr = localStorage.getItem('poybash_current_user');
    if (!userStr) return { id: '0', name: 'Unknown User' };
    const user = JSON.parse(userStr);
    return { id: user.id.toString(), name: user.name };
  };

  // Main category handlers
  const handleAddMainCategory = () => {
    if (!newMainCategoryName.trim() || !newMainCategoryDisplayName.trim()) {
      toast.error('Please enter both category name and display name');
      return;
    }

    try {
      addMainCategory({
        name: newMainCategoryName.toLowerCase().trim(),
        displayName: newMainCategoryDisplayName.trim(),
        active: true,
      });

      const user = getCurrentUser();
      logAction(
        'create',
        `Created main category "${newMainCategoryDisplayName}"`,
        user.id,
        user.name
      );

      toast.success(`Category "${newMainCategoryDisplayName}" created`);
      setNewMainCategoryName('');
      setNewMainCategoryDisplayName('');
      refreshTaxonomies();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create category');
    }
  };

  const handleEditMainCategory = (cat: MainCategory) => {
    setEditingMainCategory(cat);
    setNewMainCategoryName(cat.name);
    setNewMainCategoryDisplayName(cat.displayName);
  };

  const handleSaveEditMainCategory = () => {
    if (!editingMainCategory || !newMainCategoryName.trim() || !newMainCategoryDisplayName.trim()) return;

    try {
      updateMainCategory(editingMainCategory.id, {
        name: newMainCategoryName.toLowerCase().trim(),
        displayName: newMainCategoryDisplayName.trim(),
      });

      const user = getCurrentUser();
      logAction(
        'update',
        `Updated main category from "${editingMainCategory.displayName}" to "${newMainCategoryDisplayName}"`,
        user.id,
        user.name
      );

      toast.success('Category updated');
      setEditingMainCategory(null);
      setNewMainCategoryName('');
      setNewMainCategoryDisplayName('');
      refreshTaxonomies();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update category');
    }
  };

  const confirmMainCategoryAction = () => {
    if (!mainCategoryDialogItem || !mainCategoryDialogAction) return;
    
    const user = getCurrentUser();
    
    try {
      if (mainCategoryDialogAction === 'deactivate') {
        deleteMainCategory(mainCategoryDialogItem.id);
        logAction('delete', `Deactivated main category "${mainCategoryDialogItem.displayName}"`, user.id, user.name);
        toast.success('Category deactivated');
      } else if (mainCategoryDialogAction === 'reactivate') {
        reactivateMainCategory(mainCategoryDialogItem.id);
        logAction('reactivate', `Reactivated main category "${mainCategoryDialogItem.displayName}"`, user.id, user.name);
        toast.success('Category reactivated');
      }
      
      setMainCategoryDialogItem(null);
      setMainCategoryDialogAction(null);
      refreshTaxonomies();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Operation failed');
    }
  };

  // Sub-category handlers
  const handleAddSubCategory = () => {
    if (!newSubCategoryName.trim()) {
      toast.error('Please enter a sub-category name');
      return;
    }

    if (!newSubCategoryMainCategory) {
      toast.error('Please select a main category');
      return;
    }

    try {
      addSubCategory({
        name: newSubCategoryName.trim(),
        categoryId: newSubCategoryMainCategory,
        active: true,
      });

      const mainCat = taxonomies.mainCategories.find(c => c.id === newSubCategoryMainCategory);
      const user = getCurrentUser();
      logAction(
        'create',
        `Created sub-category "${newSubCategoryName}" under ${mainCat?.displayName || 'category'}`,
        user.id,
        user.name
      );

      toast.success(`Sub-category "${newSubCategoryName}" created`);
      setNewSubCategoryName('');
      refreshTaxonomies();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create sub-category');
    }
  };

  const handleEditSubCategory = (subCat: SubCategory) => {
    setEditingSubCategory(subCat);
    setNewSubCategoryName(subCat.name);
    setNewSubCategoryMainCategory(subCat.categoryId);
  };

  const handleSaveEditSubCategory = () => {
    if (!editingSubCategory || !newSubCategoryName.trim()) return;

    try {
      updateSubCategory(editingSubCategory.id, {
        name: newSubCategoryName.trim(),
        categoryId: newSubCategoryMainCategory,
      });

      const user = getCurrentUser();
      logAction(
        'update',
        `Updated sub-category from "${editingSubCategory.name}" to "${newSubCategoryName}"`,
        user.id,
        user.name
      );

      toast.success('Sub-category updated');
      setEditingSubCategory(null);
      setNewSubCategoryName('');
      refreshTaxonomies();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update sub-category');
    }
  };

  const confirmSubCategoryAction = () => {
    if (!subCategoryDialogItem || !subCategoryDialogAction) return;
    
    const user = getCurrentUser();
    
    try {
      if (subCategoryDialogAction === 'deactivate') {
        deleteSubCategory(subCategoryDialogItem.id);
        logAction('delete', `Deactivated sub-category "${subCategoryDialogItem.name}"`, user.id, user.name);
        toast.success('Sub-category deactivated');
      } else if (subCategoryDialogAction === 'reactivate') {
        reactivateSubCategory(subCategoryDialogItem.id);
        logAction('reactivate', `Reactivated sub-category "${subCategoryDialogItem.name}"`, user.id, user.name);
        toast.success('Sub-category reactivated');
      }
      
      setSubCategoryDialogItem(null);
      setSubCategoryDialogAction(null);
      refreshTaxonomies();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Operation failed');
    }
  };

  // Material handlers
  const handleAddMaterial = () => {
    if (!newMaterialName.trim()) {
      toast.error('Please enter a material name');
      return;
    }

    try {
      addMaterial({
        name: newMaterialName.trim(),
        active: true,
      });

      const user = getCurrentUser();
      logAction(
        'create',
        `Created material "${newMaterialName}"`,
        user.id,
        user.name
      );

      toast.success(`Material "${newMaterialName}" created`);
      setNewMaterialName('');
      refreshTaxonomies();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create material');
    }
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setNewMaterialName(material.name);
  };

  const handleSaveEditMaterial = () => {
    if (!editingMaterial || !newMaterialName.trim()) return;

    try {
      updateMaterial(editingMaterial.id, {
        name: newMaterialName.trim(),
      });

      const user = getCurrentUser();
      logAction(
        'update',
        `Updated material from "${editingMaterial.name}" to "${newMaterialName}"`,
        user.id,
        user.name
      );

      toast.success('Material updated');
      setEditingMaterial(null);
      setNewMaterialName('');
      refreshTaxonomies();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update material');
    }
  };

  const confirmMaterialAction = () => {
    if (!materialDialogItem || !materialDialogAction) return;
    
    const user = getCurrentUser();
    
    try {
      if (materialDialogAction === 'deactivate') {
        deleteMaterial(materialDialogItem.id);
        logAction('delete', `Deactivated material "${materialDialogItem.name}"`, user.id, user.name);
        toast.success('Material deactivated');
      } else if (materialDialogAction === 'reactivate') {
        reactivateMaterial(materialDialogItem.id);
        logAction('reactivate', `Reactivated material "${materialDialogItem.name}"`, user.id, user.name);
        toast.success('Material reactivated');
      }
      
      setMaterialDialogItem(null);
      setMaterialDialogAction(null);
      refreshTaxonomies();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Operation failed');
    }
  };

  // Color handlers
  const handleAddColor = () => {
    if (!newColorName.trim()) {
      toast.error('Please enter a color name');
      return;
    }

    try {
      addColor({
        name: newColorName.trim(),
        hexCode: newColorHex,
        active: true,
      });

      const user = getCurrentUser();
      logAction(
        'create',
        `Created color "${newColorName}" (${newColorHex})`,
        user.id,
        user.name
      );

      toast.success(`Color "${newColorName}" created`);
      setNewColorName('');
      setNewColorHex('#FFFFFF');
      refreshTaxonomies();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create color');
    }
  };

  const handleEditColor = (color: Color) => {
    setEditingColor(color);
    setNewColorName(color.name);
    setNewColorHex(color.hexCode || '#FFFFFF');
  };

  const handleSaveEditColor = () => {
    if (!editingColor || !newColorName.trim()) return;

    try {
      updateColor(editingColor.id, {
        name: newColorName.trim(),
        hexCode: newColorHex,
      });

      const user = getCurrentUser();
      logAction(
        'update',
        `Updated color from "${editingColor.name}" to "${newColorName}"`,
        user.id,
        user.name
      );

      toast.success('Color updated');
      setEditingColor(null);
      setNewColorName('');
      setNewColorHex('#FFFFFF');
      refreshTaxonomies();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update color');
    }
  };

  const confirmColorAction = () => {
    if (!colorDialogItem || !colorDialogAction) return;
    
    const user = getCurrentUser();
    
    try {
      if (colorDialogAction === 'deactivate') {
        deleteColor(colorDialogItem.id);
        logAction('delete', `Deactivated color "${colorDialogItem.name}"`, user.id, user.name);
        toast.success('Color deactivated');
      } else if (colorDialogAction === 'reactivate') {
        reactivateColor(colorDialogItem.id);
        logAction('reactivate', `Reactivated color "${colorDialogItem.name}"`, user.id, user.name);
        toast.success('Color reactivated');
      }
      
      setColorDialogItem(null);
      setColorDialogAction(null);
      refreshTaxonomies();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Operation failed');
    }
  };

  // Filtering logic
  const filteredMainCategories = taxonomies.mainCategories
    .filter(cat => showInactive || cat.active)
    .filter(cat => cat.displayName.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredSubCategories = taxonomies.subCategories
    .filter(sc => showInactive || sc.active)
    .filter(sc => sc.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredMaterials = taxonomies.materials
    .filter(m => showInactive || m.active)
    .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredColors = taxonomies.colors
    .filter(c => showInactive || c.active)
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Group sub-categories by main category
  const subCategoriesByMainCategory = filteredSubCategories.reduce((acc, subCat) => {
    const mainCat = taxonomies.mainCategories.find(c => c.id === subCat.categoryId);
    if (mainCat) {
      if (!acc[mainCat.id]) {
        acc[mainCat.id] = { mainCategory: mainCat, subCategories: [] };
      }
      acc[mainCat.id].subCategories.push(subCat);
    }
    return acc;
  }, {} as Record<string, { mainCategory: MainCategory; subCategories: SubCategory[] }>);

  return (
    <div className="flex flex-col h-full overflow-hidden p-1">
      {/* Info Banner */}
      <div className="mb-3 p-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg flex-shrink-0">
        <div className="text-xs text-[var(--color-text-secondary)]">
          <p className="mb-0.5">
            Changes made here instantly apply across the entire application, including customer-side filters, product forms, and all dropdown selections.
          </p>
          <p className="text-[11px]">
            Tip: Deactivate unused attributes to hide them from the system.
          </p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-3 flex gap-2 items-center flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
          <Input
            type="text"
            placeholder="Search attributes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Checkbox
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={(checked) => setShowInactive(checked as boolean)}
          />
          <Label htmlFor="show-inactive" className="text-xs cursor-pointer whitespace-nowrap">
            Show inactive
          </Label>
        </div>
      </div>

      {/* Tabs for different attribute types */}
      <Tabs defaultValue="main-categories" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-4 mb-3 flex-shrink-0 h-9">
          <TabsTrigger value="main-categories" className="flex items-center gap-1.5 text-sm">
            <FolderTree className="w-3.5 h-3.5" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="sub-categories" className="flex items-center gap-1.5 text-sm">
            <Tags className="w-3.5 h-3.5" />
            Sub-Categories
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-1.5 text-sm">
            <Layers className="w-3.5 h-3.5" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-1.5 text-sm">
            <Palette className="w-3.5 h-3.5" />
            Colors
          </TabsTrigger>
        </TabsList>

        {/* MAIN CATEGORIES TAB */}
        <TabsContent value="main-categories" className="overflow-y-auto mt-0 space-y-4 h-full pr-1">
          {/* Add New Main Category */}
          <div className="space-y-2 p-3 bg-[var(--color-surface-secondary)] rounded-lg border border-[var(--color-border)]">
            <h4 className="flex items-center gap-1.5 text-sm">
              <Plus className="w-3.5 h-3.5" />
              Add New Category
            </h4>
            <div className="space-y-2">
              <Input
                placeholder="Category name (e.g., sofas)"
                value={newMainCategoryName}
                onChange={(e) => setNewMainCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddMainCategory();
                  if (e.key === 'Escape') {
                    setNewMainCategoryName('');
                    setNewMainCategoryDisplayName('');
                  }
                }}
                className="h-9 text-sm"
              />
              <Input
                placeholder="Display name (e.g., Sofas)"
                value={newMainCategoryDisplayName}
                onChange={(e) => setNewMainCategoryDisplayName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddMainCategory();
                  if (e.key === 'Escape') {
                    setNewMainCategoryName('');
                    setNewMainCategoryDisplayName('');
                  }
                }}
                className="h-9 text-sm"
              />
              <Button onClick={handleAddMainCategory} size="sm" className="w-full h-9">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Category
              </Button>
            </div>
          </div>

          {/* Main Categories List */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] px-1">
              Main Categories
            </h4>
            {filteredMainCategories.length === 0 ? (
              <p className="text-xs text-[var(--color-text-tertiary)] text-center py-3">
                No categories found
              </p>
            ) : (
              <div className="space-y-1.5">
                {filteredMainCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] transition-colors"
                  >
                    {editingMainCategory?.id === cat.id ? (
                      <div className="flex-1 flex gap-1.5 items-center">
                        <div className="flex-1 space-y-1.5">
                          <Input
                            value={newMainCategoryName}
                            onChange={(e) => setNewMainCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEditMainCategory();
                              if (e.key === 'Escape') {
                                setEditingMainCategory(null);
                                setNewMainCategoryName('');
                                setNewMainCategoryDisplayName('');
                              }
                            }}
                            placeholder="Category name"
                            autoFocus
                            className="h-8 text-sm"
                          />
                          <Input
                            value={newMainCategoryDisplayName}
                            onChange={(e) => setNewMainCategoryDisplayName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEditMainCategory();
                              if (e.key === 'Escape') {
                                setEditingMainCategory(null);
                                setNewMainCategoryName('');
                                setNewMainCategoryDisplayName('');
                              }
                            }}
                            placeholder="Display name"
                            className="h-8 text-sm"
                          />
                        </div>
                        <Button size="sm" onClick={handleSaveEditMainCategory} className="h-8 w-8 p-0">
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingMainCategory(null);
                            setNewMainCategoryName('');
                            setNewMainCategoryDisplayName('');
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="text-sm">{cat.displayName}</span>
                            <span className="text-xs text-[var(--color-text-tertiary)] ml-2">({cat.name})</span>
                          </div>
                          {!cat.active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                        </div>
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditMainCategory(cat)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          {cat.active ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setMainCategoryDialogItem(cat);
                                setMainCategoryDialogAction('deactivate');
                              }}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setMainCategoryDialogItem(cat);
                                setMainCategoryDialogAction('reactivate');
                              }}
                              className="h-8 w-8 p-0 text-accent-foreground hover:text-accent-foreground hover:bg-accent/20"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* SUB-CATEGORIES TAB */}
        <TabsContent value="sub-categories" className="overflow-y-auto mt-0 space-y-4 h-full pr-1">
          {/* Add New Sub-Category */}
          <div className="space-y-2 p-3 bg-[var(--color-surface-secondary)] rounded-lg border border-[var(--color-border)]">
            <h4 className="flex items-center gap-1.5 text-sm">
              <Plus className="w-3.5 h-3.5" />
              Add New Sub-Category
            </h4>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Sub-category name"
                  value={newSubCategoryName}
                  onChange={(e) => setNewSubCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSubCategory();
                    if (e.key === 'Escape') setNewSubCategoryName('');
                  }}
                  className="h-9 text-sm"
                />
              </div>
              <Select value={newSubCategoryMainCategory} onValueChange={setNewSubCategoryMainCategory}>
                <SelectTrigger className="w-36 h-9 text-sm">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {getMainCategories().map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddSubCategory} size="sm" className="h-9">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Sub-Categories List - Grouped by Main Category */}
          {Object.keys(subCategoriesByMainCategory).length === 0 ? (
            <p className="text-xs text-[var(--color-text-tertiary)] text-center py-6">
              No sub-categories found
            </p>
          ) : (
            Object.values(subCategoriesByMainCategory).map(({ mainCategory, subCategories }) => (
              <div key={mainCategory.id} className="space-y-2">
                <h4 className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] px-1">
                  {mainCategory.displayName} Sub-Categories
                </h4>
                <div className="space-y-1.5">
                  {subCategories.map((subCat) => (
                    <div
                      key={subCat.id}
                      className="flex items-center justify-between p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] transition-colors"
                    >
                      {editingSubCategory?.id === subCat.id ? (
                        <div className="flex-1 flex gap-1.5 items-center">
                          <Input
                            value={newSubCategoryName}
                            onChange={(e) => setNewSubCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEditSubCategory();
                              if (e.key === 'Escape') {
                                setEditingSubCategory(null);
                                setNewSubCategoryName('');
                              }
                            }}
                            autoFocus
                            className="h-8 text-sm flex-1"
                          />
                          <Select value={newSubCategoryMainCategory} onValueChange={setNewSubCategoryMainCategory}>
                            <SelectTrigger className="w-32 h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getMainCategories().map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.displayName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" onClick={handleSaveEditSubCategory} className="h-8 w-8 p-0">
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingSubCategory(null);
                              setNewSubCategoryName('');
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{subCat.name}</span>
                            {!subCat.active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                          </div>
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditSubCategory(subCat)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            {subCat.active ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSubCategoryDialogItem(subCat);
                                  setSubCategoryDialogAction('deactivate');
                                }}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSubCategoryDialogItem(subCat);
                                  setSubCategoryDialogAction('reactivate');
                                }}
                                className="h-8 w-8 p-0 text-accent-foreground hover:text-accent-foreground hover:bg-accent/20"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* MATERIALS TAB */}
        <TabsContent value="materials" className="overflow-y-auto mt-0 space-y-3 h-full pr-1">
          {/* Add New Material */}
          <div className="space-y-2 p-3 bg-[var(--color-surface-secondary)] rounded-lg border border-[var(--color-border)]">
            <h4 className="flex items-center gap-1.5 text-sm">
              <Plus className="w-3.5 h-3.5" />
              Add New Material
            </h4>
            <div className="flex gap-2">
              <Input
                placeholder="Material name"
                value={newMaterialName}
                onChange={(e) => setNewMaterialName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddMaterial();
                  if (e.key === 'Escape') setNewMaterialName('');
                }}
                className="flex-1 h-9 text-sm"
              />
              <Button onClick={handleAddMaterial} size="sm" className="h-9">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Materials List */}
          {filteredMaterials.length === 0 ? (
            <p className="text-xs text-[var(--color-text-tertiary)] text-center py-6">
              No materials found
            </p>
          ) : (
            <div className="space-y-1.5">
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] transition-colors"
                >
                  {editingMaterial?.id === material.id ? (
                    <div className="flex-1 flex gap-1.5 items-center">
                      <Input
                        value={newMaterialName}
                        onChange={(e) => setNewMaterialName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEditMaterial();
                          if (e.key === 'Escape') {
                            setEditingMaterial(null);
                            setNewMaterialName('');
                          }
                        }}
                        autoFocus
                        className="h-8 text-sm flex-1"
                      />
                      <Button size="sm" onClick={handleSaveEditMaterial} className="h-8 w-8 p-0">
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingMaterial(null);
                          setNewMaterialName('');
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{material.name}</span>
                        {!material.active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditMaterial(material)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        {material.active ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setMaterialDialogItem(material);
                              setMaterialDialogAction('deactivate');
                            }}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setMaterialDialogItem(material);
                              setMaterialDialogAction('reactivate');
                            }}
                            className="h-8 w-8 p-0 text-accent-foreground hover:text-accent-foreground hover:bg-accent/20"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* COLORS TAB */}
        <TabsContent value="colors" className="overflow-y-auto mt-0 space-y-3 h-full pr-1">
          {/* Add New Color */}
          <div className="space-y-2 p-3 bg-[var(--color-surface-secondary)] rounded-lg border border-[var(--color-border)]">
            <h4 className="flex items-center gap-1.5 text-sm">
              <Plus className="w-3.5 h-3.5" />
              Add New Color
            </h4>
            <div className="flex gap-2">
              <Input
                placeholder="Color name"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddColor();
                  if (e.key === 'Escape') {
                    setNewColorName('');
                    setNewColorHex('#FFFFFF');
                  }
                }}
                className="flex-1 h-9 text-sm"
              />
              <Input
                type="color"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                className="w-16 h-9"
              />
              <Button onClick={handleAddColor} size="sm" className="h-9">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Colors List */}
          {filteredColors.length === 0 ? (
            <p className="text-xs text-[var(--color-text-tertiary)] text-center py-6">
              No colors found
            </p>
          ) : (
            <div className="space-y-1.5">
              {filteredColors.map((color) => (
                <div
                  key={color.id}
                  className="flex items-center justify-between p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] transition-colors"
                >
                  {editingColor?.id === color.id ? (
                    <div className="flex-1 flex gap-1.5 items-center">
                      <Input
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEditColor();
                          if (e.key === 'Escape') {
                            setEditingColor(null);
                            setNewColorName('');
                            setNewColorHex('#FFFFFF');
                          }
                        }}
                        autoFocus
                        className="h-8 text-sm flex-1"
                      />
                      <Input
                        type="color"
                        value={newColorHex}
                        onChange={(e) => setNewColorHex(e.target.value)}
                        className="w-14 h-8"
                      />
                      <Button size="sm" onClick={handleSaveEditColor} className="h-8 w-8 p-0">
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingColor(null);
                          setNewColorName('');
                          setNewColorHex('#FFFFFF');
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{color.name}</span>
                        {!color.active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditColor(color)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        {color.active ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setColorDialogItem(color);
                              setColorDialogAction('deactivate');
                            }}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setColorDialogItem(color);
                              setColorDialogAction('reactivate');
                            }}
                            className="h-8 w-8 p-0 text-accent-foreground hover:text-accent-foreground hover:bg-accent/20"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Main Category Confirmation Dialog */}
      <AlertDialog open={!!mainCategoryDialogItem} onOpenChange={() => {
        setMainCategoryDialogItem(null);
        setMainCategoryDialogAction(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {mainCategoryDialogAction === 'deactivate' ? 'Deactivate Category' : 'Reactivate Category'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {mainCategoryDialogAction === 'deactivate'
                ? `Are you sure you want to deactivate "${mainCategoryDialogItem?.displayName || ''}"? It will be hidden from all dropdowns and filters.`
                : `Are you sure you want to reactivate "${mainCategoryDialogItem?.displayName || ''}"? It will become visible again in all dropdowns and filters.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setMainCategoryDialogItem(null);
              setMainCategoryDialogAction(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmMainCategoryAction}>
              {mainCategoryDialogAction === 'deactivate' ? 'Deactivate' : 'Reactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sub-Category Confirmation Dialog */}
      <AlertDialog open={!!subCategoryDialogItem} onOpenChange={() => {
        setSubCategoryDialogItem(null);
        setSubCategoryDialogAction(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {subCategoryDialogAction === 'deactivate' ? 'Deactivate Sub-Category' : 'Reactivate Sub-Category'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {subCategoryDialogAction === 'deactivate'
                ? `Are you sure you want to deactivate "${subCategoryDialogItem?.name || ''}"? It will be hidden from all dropdowns and filters.`
                : `Are you sure you want to reactivate "${subCategoryDialogItem?.name || ''}"? It will become visible again in all dropdowns and filters.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setSubCategoryDialogItem(null);
              setSubCategoryDialogAction(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubCategoryAction}>
              {subCategoryDialogAction === 'deactivate' ? 'Deactivate' : 'Reactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Material Confirmation Dialog */}
      <AlertDialog open={!!materialDialogItem} onOpenChange={() => {
        setMaterialDialogItem(null);
        setMaterialDialogAction(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {materialDialogAction === 'deactivate' ? 'Deactivate Material' : 'Reactivate Material'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {materialDialogAction === 'deactivate'
                ? `Are you sure you want to deactivate "${materialDialogItem?.name || ''}"? It will be hidden from all dropdowns and filters.`
                : `Are you sure you want to reactivate "${materialDialogItem?.name || ''}"? It will become visible again in all dropdowns and filters.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setMaterialDialogItem(null);
              setMaterialDialogAction(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmMaterialAction}>
              {materialDialogAction === 'deactivate' ? 'Deactivate' : 'Reactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Color Confirmation Dialog */}
      <AlertDialog open={!!colorDialogItem} onOpenChange={() => {
        setColorDialogItem(null);
        setColorDialogAction(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {colorDialogAction === 'deactivate' ? 'Deactivate Color' : 'Reactivate Color'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {colorDialogAction === 'deactivate'
                ? `Are you sure you want to deactivate "${colorDialogItem?.name || ''}"? It will be hidden from all dropdowns and filters.`
                : `Are you sure you want to reactivate "${colorDialogItem?.name || ''}"? It will become visible again in all dropdowns and filters.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setColorDialogItem(null);
              setColorDialogAction(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmColorAction}>
              {colorDialogAction === 'deactivate' ? 'Deactivate' : 'Reactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}