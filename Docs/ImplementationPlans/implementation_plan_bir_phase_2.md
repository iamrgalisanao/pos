# BIR Compliance Implementation Phase 2

This plan addresses the remaining functional gaps identified in the BIR compliance specification, focusing on legal record integrity and detailed tax reporting.

## User Review Required

> [!IMPORTANT]
> **Sequential OR Numbering**: I will implement a store-level sequence to ensure Official Receipt (OR) numbers are strictly sequential. This replaces the use of global UUIDs/Serial IDs for external documentation.
> 
> **Tax Calculation**: I will add specific columns for VATable, VAT-Exempt, and Zero-Rated sales to the `orders` table.

## Proposed Changes

### 🛒 Backend: Database Schema

#### [MODIFY] [schema.sql](file:///e:/2026/Pos/backend/database/schema.sql)
- **Store-specific Sequence**:
    ```sql
    CREATE TABLE store_sequences (
        store_id UUID PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
        last_or_number INTEGER DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    ```
- **Order Tax Breakdown**:
    - Add `gross_sales`, `vatable_sales`, `vat_exempt_sales`, `zero_rated_sales` to `orders`.
    - Add the same breakdown to `order_items` for granular reporting.

### ⚙️ Backend: Business Logic

#### [MODIFY] [storeController.ts](file:///e:/2026/Pos/backend/src/controllers/storeController.ts)
- **Immutability Check**:
    - In `updateStore`, verify if `orders` exist for the store.
    - If orders exist, return an error if `timezone` or `currency_code` is being changed.

#### [MODIFY] [orderController.ts](file:///e:/2026/Pos/backend/src/controllers/orderController.ts)
- **OR Number Generation**:
    - Increment and return the next `last_or_number` from `store_sequences` within the order transaction.
    - Format as `OR-[STORE_ID_PREFIX]-[SEQ]`.
- **Tax Breakdown**:
    - Update `createOrder` to accept and store the detailed tax fields provided by the frontend.

## Verification Plan

### Automated Tests
1. **Immutability Test**:
   - Create a store and an order.
   - Attempt to update the store's timezone. Verify it fails with a 403/Forbidden error.
2. **OR Sequence Test**:
   - Create two orders for the same store.
   - Verify their `or_number` values are sequential (e.g., OR-0001, OR-0002).

### Manual Verification
1. Inspect the `audit_logs` table after updating store information to ensure the change was recorded.
2. Verify the `orders` table contains correct `vatable_sales` versus `vat_exempt_sales` for mixed-type orders.
