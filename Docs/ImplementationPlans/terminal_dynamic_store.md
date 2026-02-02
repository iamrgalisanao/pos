# Implementation Plan: Reflecting Store Settings in Terminal

The Terminal UI currently uses hardcoded values for the business name ("Green Grounds") and other store-related information. This plan outlines the steps to make these elements dynamic, reflecting the actual settings from the database.

## Proposed Changes

### [Component] [Terminal UI](file:///e:/2026/Pos/dashboard/src/app/terminal/page.tsx)

#### [MODIFY] [page.tsx](file:///e:/2026/Pos/dashboard/src/app/terminal/page.tsx)
-   **State Management**: 
    -   Add `store` state to hold the full store object.
    -   Add `todayOrderCount` state to hold the number of orders placed today.
-   **Data Fetching**:
    -   Update `fetchStoreSettings` to store the entire store object in the `store` state.
    -   Update `fetchStoreSettings` to also fetch the count of orders for the current store for today's date.
-   **UI Updates**:
    -   Replace "G" logo with the first letter of `store.name`.
    -   Replace "Green Grounds" with `store.name`.
    -   Replace "Coffee House" with `store.address` (or a tagline if added later).
    -   Replace "Thursday, 23 June" with a dynamic current date using `new Date().toLocaleDateString()`.
    -   Replace "Total: 20 Orders" with `Total: ${todayOrderCount} Orders`.

## Verification Plan

### Manual Verification
-   Navigate to the Store Settings dashboard and update the "Business Name".
-   Open the POS Terminal and verify the header reflects the new name.
-   Check that the store logo (initial letter) and address (secondary text) are also updated.
-   Verify that the current date is shown correctly.
-   Place a new order and verify that the "Total Orders" count increments (after a refresh or refetch).
