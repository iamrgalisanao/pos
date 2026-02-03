import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface ModifierOption {
    id: string;
    name: string;
    priceAdjustment: number;
    isDefault: boolean;
    modifierGroupIds?: string[]; // Nested modifiers
}

export interface ModifierGroup {
    id: string;
    name: string;
    description: string;
    type: 'ADDON' | 'EXCLUSION' | 'CHOICE';
    isRequired: boolean;
    minSelections: number;
    maxSelections: number;
    options: ModifierOption[];
}

export interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    sku: string;
    categoryId: string;
    modifierGroupIds: string[];
    image?: string;
    status?: 'ACTIVE' | 'INACTIVE';
}

export interface Category {
    id: string;
    name: string;
    color?: string;
}

export interface TemplateConfig {
    name: string;
    vertical: string;
    description: string;
    categories: Category[];
    items: MenuItem[];
    modifier_groups: ModifierGroup[];
}

interface TemplateBuilderState {
    // Current Blueprint
    config: TemplateConfig;

    // History (Simple Undo/Redo)
    past: TemplateConfig[];
    future: TemplateConfig[];

    // UI State
    activeStep: number;
    selectedId: string | null; // Currently editing this ID (Category/Item/Group)
    isLoading: boolean;
    isSaving: boolean;
    lastSaved: Date | null;
    errors: string[];
    publishSuccess: boolean;
    healthScore: number;

    // Actions
    setConfig: (config: TemplateConfig) => void;
    updateConfig: (updater: (config: TemplateConfig) => TemplateConfig) => void;
    addItemsBulk: (newItems: MenuItem[], newCategories?: Category[]) => void;

    // Steps
    setStep: (step: number) => void;
    setSelectedId: (id: string | null) => void;

    // History Actions
    undo: () => void;
    redo: () => void;

    // reset
    reset: () => void;

    setPublishSuccess: (success: boolean) => void;

    // Status Actions
    setSaving: (isSaving: boolean) => void;
    setLastSaved: (date: Date | null) => void;
    setHealthScore: (score: number) => void;

    // Template Management
    modifierTemplates: ModifierGroup[];
    saveAsTemplate: (group: ModifierGroup) => void;
    deleteTemplate: (id: string) => void;
}

const initialConfig: TemplateConfig = {
    name: '',
    vertical: 'cafe',
    description: '',
    categories: [],
    items: [],
    modifier_groups: []
};

export const useTemplateBuilderStore = create<TemplateBuilderState>()(
    devtools(
        subscribeWithSelector((set, get) => ({
            config: initialConfig,
            past: [],
            future: [],
            activeStep: 0,
            selectedId: null,
            isLoading: false,
            isSaving: false,
            lastSaved: null,
            errors: [],
            publishSuccess: false,
            healthScore: 0,

            setConfig: (config) => {
                // Normalize legacy data formats
                const normalizedCategories: Category[] = (config.categories || []).map((cat: any, idx: number) => {
                    if (typeof cat === 'string') {
                        return { id: uuidv4(), name: cat, color: `hsl(${idx * 40}, 70%, 60%)` };
                    }
                    return {
                        id: cat.id || uuidv4(),
                        name: cat.name || '',
                        color: cat.color || `hsl(${idx * 40}, 70%, 60%)`
                    };
                });

                const normalizedItems: MenuItem[] = (config.items || []).map((item: any) => ({
                    ...item,
                    id: item.id || uuidv4(),
                    modifierGroupIds: item.modifierGroupIds || []
                }));

                const normalizedModifierGroups: ModifierGroup[] = (config.modifier_groups || []).map((group: any) => ({
                    ...group,
                    id: group.id || uuidv4(),
                    options: (group.options || []).map((opt: any) => ({
                        ...opt,
                        id: opt.id || uuidv4()
                    }))
                }));

                set({
                    config: {
                        ...config,
                        categories: normalizedCategories,
                        items: normalizedItems,
                        modifier_groups: normalizedModifierGroups
                    },
                    activeStep: (config as any).activeStep ?? get().activeStep,
                    healthScore: (config as any).healthScore ?? (config as any).health_score ?? get().healthScore
                });
            },

            updateConfig: (updater) => {
                const current = get().config;
                const next = updater(current);

                set((state) => ({
                    past: [...state.past, current].slice(-20), // Keep last 20 steps
                    config: next,
                    future: [],
                    publishSuccess: false
                }));
            },

            addItemsBulk: (newItems, newCategories = []) => {
                const current = get().config;

                // Merge categories, avoiding duplicates by name
                const existingCategoryNames = new Set(current.categories.map(c => c.name.toLowerCase()));
                const filteredNewCategories = newCategories.filter(c => !existingCategoryNames.has(c.name.toLowerCase()));

                const next: TemplateConfig = {
                    ...current,
                    categories: [...current.categories, ...filteredNewCategories],
                    items: [...current.items, ...newItems]
                };

                set((state) => ({
                    past: [...state.past, current].slice(-20),
                    config: next,
                    future: [],
                    publishSuccess: false
                }));
            },

            setStep: (step) => set({ activeStep: step }),
            setSelectedId: (id) => set({ selectedId: id }),

            undo: () => {
                const { past, config, future } = get();
                if (past.length === 0) return;

                const previous = past[past.length - 1];
                const newPast = past.slice(0, past.length - 1);

                set({
                    config: previous,
                    past: newPast,
                    future: [config, ...future]
                });
            },

            redo: () => {
                const { past, config, future } = get();
                if (future.length === 0) return;

                const next = future[0];
                const newFuture = future.slice(1);

                set({
                    config: next,
                    past: [...past, config],
                    future: newFuture
                });
            },

            reset: () => set({
                config: initialConfig,
                past: [],
                future: [],
                activeStep: 0,
                selectedId: null,
                lastSaved: null,
                errors: [],
                publishSuccess: false
            }),

            setPublishSuccess: (success) => set({ publishSuccess: success }),
            setSaving: (isSaving) => set({ isSaving }),
            setLastSaved: (lastSaved) => set({ lastSaved }),
            setHealthScore: (healthScore) => set({ healthScore }),

            modifierTemplates: [
                {
                    id: 'tpl-doneness-1',
                    name: 'Meat Doneness',
                    description: 'Cooking preference',
                    type: 'CHOICE',
                    isRequired: true,
                    minSelections: 1,
                    maxSelections: 1,
                    options: [
                        { id: uuidv4(), name: 'Rare', priceAdjustment: 0, isDefault: false },
                        { id: uuidv4(), name: 'Medium', priceAdjustment: 0, isDefault: true },
                        { id: uuidv4(), name: 'Well Done', priceAdjustment: 0, isDefault: false }
                    ]
                },
                {
                    id: 'tpl-milk-1',
                    name: 'Milk Alternative',
                    description: 'Dairy preferences',
                    type: 'CHOICE',
                    isRequired: false,
                    minSelections: 0,
                    maxSelections: 1,
                    options: [
                        { id: uuidv4(), name: 'Full Cream', priceAdjustment: 0, isDefault: true },
                        { id: uuidv4(), name: 'Oat Milk', priceAdjustment: 1.5, isDefault: false },
                        { id: uuidv4(), name: 'Almond Milk', priceAdjustment: 1.5, isDefault: false }
                    ]
                },
                {
                    id: 'tpl-toppings-1',
                    name: 'Extra Toppings',
                    description: 'Add more flavor',
                    type: 'ADDON',
                    isRequired: false,
                    minSelections: 0,
                    maxSelections: 5,
                    options: [
                        { id: uuidv4(), name: 'Extra Cheese', priceAdjustment: 2, isDefault: false },
                        { id: uuidv4(), name: 'Bacon', priceAdjustment: 3, isDefault: false }
                    ]
                }
            ],

            saveAsTemplate: (group) => {
                const currentTemplates = get().modifierTemplates;
                // Add icon/description if missing, or just copy as is
                const newTemplate: ModifierGroup = {
                    ...group,
                    id: `tpl-custom-${uuidv4()}`, // Ensure unique ID for template
                    name: group.name,
                    options: group.options.map(o => ({ ...o, id: uuidv4() })) // Reset option IDs for template usage
                };

                set({ modifierTemplates: [...currentTemplates, newTemplate] });
            },

            deleteTemplate: (id) => {
                set({
                    modifierTemplates: get().modifierTemplates.filter(t => t.id !== id)
                });
            },
        }))
    )
);
