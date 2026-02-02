# Advanced KDS Station Routing Implementation Plan

Enable automatic routing of order items to specific kitchen stations (e.g., "Grill", "Salad", "Bar") to streamline kitchen operations in busy environments.

## User Review Required
> [!IMPORTANT]
> This change introduces a `kds_station` field at the category level. Items within a category will inherit its station routing.

## Proposed Changes

### Database

#### [MODIFY] `product_categories` table
- Add `kds_station` column (VARCHAR(255), Nullable).

---

### Backend (Node.js/Express + Socket.io)

#### [MODIFY] `orderController.ts`
- When an order is created, include the `kds_station` of each item in the broadcast payload.

#### [MODIFY] `socket.ts`
- Update the socket event emission logic to allow joining specific station "rooms". This enables a KDS terminal to only receive relevant updates.

---

### Dashboard (Next.js)

#### [MODIFY] `kds/page.tsx`
- Add a "Station Selector" dropdown in the header.
- Filter displayed orders/items based on the selected station.
- Update Socket.io listener to subscribe to station-specific rooms if necessary, or filter on the client.

#### [MODIFY] `inventory/page.tsx` (Optional/Future)
- Allow assigning stations when creating/editing categories. (For now, we will seed this data).

## Verification Plan

### Automated Tests
- Verify that a multi-category order (e.g., Burger + Drink) emits data accessible to both "Grill" and "Bar" listeners.

### Manual Verification
- Open two KDS windows.
- Set Window A to "Main Kitchen" (Grill) and Window B to "Bar".
- Place an order with items from both.
- Verify Window A only shows the Food items and Window B only shows the Bar items.
