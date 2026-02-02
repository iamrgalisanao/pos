# Implementation Plan: Advanced Product Catalog System

Redesign the product catalog from a simple list into a comprehensive configuration system capable of supporting multi-tenant café and fast-food chains.

## User Review Required

> [!IMPORTANT]
> This change involves significant database schema updates. While I will use `ALTER TABLE` to preserve existing data, some default values (like product types) will be applied retrospectively.

> [!WARNING]
> Nested modifiers and complex rules engine may impact transaction performance if not indexed correctly. I will include indexing in the migration.

## Proposed Changes

### Database Evolution
Refactor the storage layer to support hierarchical modifiers and rule-based behavior.

#### [MODIFY] `products` Table
- Add `internal_name` (string) for back-of-house tracking.
- Add `product_type` (enum: food, beverage, combo, modifier, ingredient).
- Add `lifecycle_status` (enum: active, inactive, archived).
- Add `tax_category_id` (UUID) to move away from raw percentages.
- Add `reporting_category_id` (UUID) for granular analytics.

#### [NEW] `modifier_groups` & `product_modifier_groups`
- `modifier_groups`: Master table for groups (e.g., "Milk Options", "Toppings").
- `product_modifier_groups`: Linking table to assign groups to products.
- `modifier_options`: Linking specific products to a group as selectable options with `price_delta`.

#### [NEW] `product_rules`
- `product_pricing_rules`: Support for channel-based (Delivery vs POS) and time-based (Happy Hour) pricing.
- `product_availability_rules`: Location-scoped and time-scoped visibility.

---

### Backend Logic
Implement the "Rules Engine" and Template system.

#### [MODIFY] [productController.ts](file:///e:/2026/Pos/backend/src/controllers/productController.ts)
- Update `createProduct` and `updateProduct` to handle advanced configuration objects.
- Implement soft-delete logic for `lifecycle_status`.

#### [NEW] [onboardingController.ts](file:///e:/2026/Pos/backend/src/controllers/onboardingController.ts)
- Implement `applyTemplate` logic for "Cafe" vs "Fast-Food".
- Automated creation of industry-standard categories and modifier groups.

---

### Frontend UI/UX
Transform the "Add Product" experience into a progressive disclosure wizard.

#### [MODIFY] [ProductModal.tsx](file:///e:/2026/Pos/dashboard/src/components/ProductModal.tsx)
- Redesign as a tabbed interface:
  1. **Core**: Name, Type, Description.
  2. **Pricing**: Base price, Tax class, Overrides.
  3. **Customization**: Variants and Modifier Groups.
  4. **Logistics**: Availability schedules and Locations.

#### [MODIFY] [products/page.tsx](file:///e:/2026/Pos/dashboard/src/app/products/page.tsx)
- Enhance the table with visual indicators for product type (icons) and configuration status.
- Add "Vertical Selection" prompt for new tenants.

## Verification Plan

### Automated Tests
- Run database migration scripts and verify schema integrity.
- Unit tests for the Pricing Rules evaluation logic.

### Manual Verification
1. **Onboarding**: Create a new tenant, select "Cafe" template, and verify pre-populated "Milk Type" modifier group.
2. **Complex Product**: Create a "Latte" with "Size" variants (Tall, Grande) and "Milk Type" modifiers.
3. **Pricing Rules**: Set a Happy Hour pricing rule and verify the price changes in the Terminal during the specified window.
4. **Visibility**: Set a product as "Modifier-only" and confirm it doesn't appear in the main Terminal grid but DOES appear in modifiers.
