# Implementation Plan: Global Currency Synchronization

The objective is to ensure that the currency symbol is consistent and dynamic across all modules of the application, reflecting the global store settings.

## Proposed Changes

### [Backend/Infrastructure] [AuthContext](file:///e:/2026/Pos/dashboard/src/context/AuthContext.tsx)

#### [MODIFY] [AuthContext.tsx](file:///e:/2026/Pos/dashboard/src/context/AuthContext.tsx)
-   **Add Store State**: Add `store` state to the `AuthContext` to store the current store's information, including `currency_code`.
-   **Fetch Store Data**: Implement logic to fetch store info on initial app load (if user session exists) and after successful login.
-   **Add Currency Utils**: Provide a `currencySymbol` getter or value in the context.

### [Frontend/UI] [Dashboard Modules]

#### [MODIFY] [Dashboard Page](file:///e:/2026/Pos/dashboard/src/app/page.tsx)
-   Replace hardcoded `$` in stats cards and transaction items using the global currency symbol.

#### [MODIFY] [Analytics Page](file:///e:/2026/Pos/dashboard/src/app/analytics/page.tsx)
-   Replace hardcoded `$` in KPI cards, chart axes, and performance tables using the global currency symbol.

#### [MODIFY] [Product Catalog](file:///e:/2026/Pos/dashboard/src/app/products/page.tsx)
-   Replace hardcoded `$` in product list pricing using the global currency symbol.

#### [MODIFY] [Marketing Page](file:///e:/2026/Pos/dashboard/src/app/marketing/page.tsx)
-   Replace hardcoded `$` in voucher list using the global currency symbol.

#### [MODIFY] [Terminal Page](file:///e:/2026/Pos/dashboard/src/app/terminal/page.tsx)
-   Refactor to use the global currency symbol from `AuthContext` instead of fetching it locally in the component.

## Verification Plan

### Manual Verification
1.  **Dashboard**: Verify "Total Revenue" and recent transactions show the correct symbol.
2.  **Analytics**: Verify all chart axes and tables show the correct symbol.
3.  **Products**: Verify the product grid pricing reflects the setting.
4.  **Terminal**: Ensure the previous fix still works but now uses the global state.
5.  **Settings Change**: Change currency from USD to PHP in settings, and verify it updates across all these pages.
