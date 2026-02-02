# Store Reset UI Integration Plan

Add a "Danger Zone" to the Store Settings dashboard to allow Owners to clear transactions and reset OR sequences. This is useful for resetting test data before final BIR commissioning or fixing configuration errors.

## User Review Required

> [!CAUTION]
> **DESTRUCTIVE ACTION**: This feature deletes all orders, payments, and Z-reports for a store. It also resets the OR sequence.
> - Only accessible by users with the `owner` role.
> - Requires double confirmation + typing the store name to execute.

## Proposed Changes

### Backend

#### [MODIFY] [storeController.ts](file:///e:/2026/Pos/backend/src/controllers/storeController.ts)
- Implement `resetStoreTransactions` controller function.
- Logic:
    1. Verify requester is `owner`.
    2. Start transaction.
    3. Delete `orders` (cascades to `order_items`, `payments`).
    4. Delete `z_reports`.
    5. Reset `store_sequences.last_or_number` to 0.
    6. Log audit entry for `RESET_STORE_TRANSACTIONS`.
    7. Commit.

#### [MODIFY] [index.ts](file:///e:/2026/Pos/backend/src/index.ts)
- Register `POST /api/stores/:id/reset` route.
- Use `authenticate` and `authorize(['owner'])` middlewares.

---

### Dashboard Frontend

#### [MODIFY] [settingsService.ts](file:///e:/2026/Pos/dashboard/src/lib/settingsService.ts)
- Add `resetStoreTransactions(storeId: string)` method.

#### [MODIFY] [page.tsx](file:///e:/2026/Pos/dashboard/src/app/settings/page.tsx)
- Add a new section under "Compliance" or a new "Maintenance" tab.
- Implement "Danger Zone" UI component.
- Add a confirmation modal that requires the user to type the store name to confirm deletion.

---

## Verification Plan

### Automated Tests
- Create a test script to:
    1. Create an order and a Z-report.
    2. Call the reset endpoint.
    3. Verify that the tables are empty and OR sequence is 0.
    4. Verify that non-owners cannot call the endpoint.

### Manual Verification
- Navigate to Settings -> Maintenance.
- Attempt to reset a store.
- Verify the double-confirmation workflow works correctly.
- Verify the data is actually cleared in the dashboard.
