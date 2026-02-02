# Revised Implementation Plan: POS Template Builder

This plan outlines the development of the **Orchestration Layer** for the Nodal POS Platform. Building upon our existing database foundation, this builder provides a visual, user-friendly interface for creating and managing menu blueprints across multiple store locations.

## User Review Required

> [!IMPORTANT]
> **State Management Strategy**: We will adopt **Zustand** for the Builder's state. This is necessary to handle complex JSON configurations, cross-component updates (Modifiers vs Ingredients), and the required **Undo/Redo** functionality.
>
> **Phased Deployment**: To manage complexity, we will implement this in four distinct phases: Foundation, Core Builder, Import/Gallery, and Advanced Governance.

## Proposed Changes

### 1. Frontend: The Builder Studio

#### [NEW] [BlueprintBuilder.tsx](file:///e:/2026/Pos/dashboard/src/components/TemplateBuilder/BlueprintBuilder.tsx)
The central orchestrator for the 5-step creation wizard:
1. **Core Info**: Name, vertical, description, and brand metadata.
2. **Categories**: Visual organization of the menu.
3. **Menu Items**: Pricing, SKUs, and basic configuration.
4. **Customizations**: Modifier groups and nested rules (via `ModifierGroupBuilder`).
5. **Preview & Publish**: Final inspection (via `POSSimulator`) and deployment (via `PublishManager`).

#### [NEW] [ModifierGroupBuilder.tsx](file:///e:/2026/Pos/dashboard/src/components/TemplateBuilder/ModifierGroupBuilder.tsx)
A specialized sub-builder for complex product logic:
- Support for **nested modifiers** (e.g., Combo -> Burger -> No Onions).
- Visual rule builder for min/max selections and "Required" toggles.
- Pricing strategy configuration (Per-option vs. Bundled).

#### [NEW] [PublishManager.tsx](file:///e:/2026/Pos/dashboard/src/components/TemplateBuilder/PublishManager.tsx)
The deployment cockpit for platform admins:
- **Checklist**: Auto-verification of pricing, taxes, and required modifiers.
- **Diff View**: Visual comparison between the draft and the currently published version.
- **Multi-location Selector**: Choose specific stores for deployment.
- **Scheduling**: Deploy updates during off-peak hours automatically.

#### [NEW] [ImportWizard.tsx](file:///e:/2026/Pos/dashboard/src/components/TemplateBuilder/ImportWizard.tsx)
- Column mapping interface for CSV/Excel uploads.
- "Dry-run" preview to resolve errors before ingestion.

---

### 2. Backend: Blueprint Services

#### [MODIFY] [templateController.ts](file:///e:/2026/Pos/backend/src/controllers/templateController.ts)
Extension of existing APIs to support the new builder features:
- `validateTemplate`: Server-side JSON schema and business rule validation.
- `duplicateVersion`: Branching support with version notes.
- `deployToLocations`: Handles the distribution of a published version to specific `tenant_id` records.

#### [NEW] [importController.ts](file:///e:/2026/Pos/backend/src/controllers/importController.ts)
- `parseCsvBlueprint`: Heavy-lifting for menu ingestion using `papaparse` or similar.
- `generateCsvTemplate`: Provides a baseline file for store owners to fill out.

---

### 3. Performance & Reliability

- **Auto-save**: Debounced persistence to the `business_template_versions` table with a "Draft" status.
- **Virtual Scrolling**: Implemented in the Categorization and Items view to handle blueprints with 500+ items.
- **Error Boundaries**: Dedicated boundary for the Builder to prevent layout crashes on malformed legacy data.

## Verification Plan

### Automated Tests
- **State Integrity**: Test Zustand slices for correct Undo/Redo behavior.
- **Cross-Vertical Logic**: Ensure a "Cafe" template cannot be published with "Fast Food" specific rules if forbidden by the schema.

### Manual Verification
1. **The "Sarah" Test**: As a non-technical user, use the **Template Gallery** to create a menu and successfully publish it to 3 stores.
2. **The "David" Test**: Import a 200-item CSV, map the columns, fix 2 validation errors, and schedule publication for 2:00 AM.
3. **Rollback**: Publish a breaking change, then use the **Rollback** feature in `PublishManager` to revert all stores to the previous version within 30 seconds.
