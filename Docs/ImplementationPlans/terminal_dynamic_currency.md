# Implementation Plan: Dynamic Currency in Terminal

The POS Terminal currently has the `$` currency symbol hardcoded in multiple places. This plan outlines the steps to make the currency symbol dynamic based on the store's settings.

## Proposed Changes

### [Component] [Terminal UI](file:///e:/2026/Pos/dashboard/src/app/terminal/page.tsx)

#### [MODIFY] [page.tsx](file:///e:/2026/Pos/dashboard/src/app/terminal/page.tsx)
-   **Helper Function**: Add a `getCurrencySymbol()` helper function that returns `₱` for "PHP" and `$` for "USD".
-   **Helper Variable**: Define a `currencySymbol` variable inside the component based on `storeInfo?.currency_code`.
-   **UI Updates**:
    -   Replace all instances of hardcoded `$` with `{currencySymbol}` in:
        -   Product grid pricing
        -   Cart item unit price
        -   Cart item total price
        -   Subtotal display
        -   Tax display
        -   Discount display
        -   Total display
        -   Variant modal pricing

## Verification Plan

### Manual Verification
-   Navigate to the Store Settings dashboard.
-   Change the "Currency" from "USD" to "PHP" and save.
-   Open the POS Terminal and verify all prices now show the `₱` (or `P`) symbol.
-   Change the "Currency" back to "USD" and save.
-   Verify the POS Terminal prices return to using the `$` symbol.
