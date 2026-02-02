# Product & SKU Management UI Implementation Plan

Provide a powerful, intuitive interface for Managing the POS product catalog, including categories, variants, and tax configurations.

## User Review Required
> [!IMPORTANT]
> To maintain data integrity for historical orders, deleting a product will perform a **Soft Delete** (setting `is_active` to false) rather than removing it from the database.

## Proposed Changes

### Backend (Node.js/Express)

#### [MODIFY] `productController.ts`
- Implement `updateProduct`: Allow updating all product fields.
- Implement `deleteProduct`: Set `is_active = false`.
- Implement `updateCategory`: Update name and `kds_station`.
- Implement `deleteCategory`: Soft delete category.

#### [MODIFY] `index.ts`
- Register the new PUT and DELETE routes for products and categories.

---

### Dashboard (Next.js)

#### [NEW] `products/page.tsx`
- **Search & Filters**: Search by name/SKU, filter by category.
- **Product Table**: High-level view of products with inventory status and pricing.
- **Category Pill View**: Management of product categories.

#### [NEW] `components/ProductModal.tsx`
- Multi-step or tabbed form for basic info, variants, and tax settings.
- Category dropdown with station mapping.

---

### Sync Engine Integration
- Ensure `UPDATE` and `DELETE` (Soft) mutations are logged in `delta_log` so offline terminals update their local caches correctly.

## Verification Plan

### Automated Tests
- Verify that updating a product price on the dashboard correctly triggers a sync delta.
- Verify that a soft-deleted product no longer appears in the `/api/products` list.

### Manual Verification
1.  Create a new product "Cheeseburger".
2.  Edit its price and verify it updates in the POS Terminal.
3.  Delete it and verify it disappears from the Terminal search but remains in old orders.
