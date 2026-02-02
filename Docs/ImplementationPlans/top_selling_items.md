# Implementation Plan: Top Selling Items Dashboard Feature

The goal is to replace the static placeholder on the dashboard's "Top Selling Items" card with real data derived from transaction history.

## Proposed Changes

### Backend
#### [MODIFY] [statsController.ts](file:///e:/2026/Pos/backend/src/controllers/statsController.ts)
- Add a new query to `getDashboardStats` that:
    - Joins `order_items` and `products`.
    - Groups by `product_id` and `product.name`.
    - Calculates the sum of `quantity` for each product.
    - Orders by total quantity descending.
    - Limits to the top 5 items.
- Include a `topItems` array in the returned stats object.

### Frontend
#### [MODIFY] [page.tsx](file:///e:/2026/Pos/dashboard/src/app/page.tsx)
- Update `DashboardStats` interface to include `topItems: Array<{ name: string, total_sold: number }>`.
- Replace the static placeholder text in the "Top Selling Items" card with a mapping over `stats.topItems`.
- Use the existing `TopItem` component to render each item.

## Verification Plan

### Automated Tests
- N/A

### Manual Verification
1.  Open the Dashboard.
2.  Note the current (empty) state of "Top Selling Items".
3.  Navigate to the Terminal and place 3 separate orders for "Latte".
4.  Place 1 order for "Americano".
5.  Return to the Dashboard.
6.  Verify that "Latte" appears at the top of the list with "3 sold" and "Americano" appears below it.
7.  Confirm that the placeholder text is gone.
