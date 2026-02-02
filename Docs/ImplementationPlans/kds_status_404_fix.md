# Fix KDS Order Status Update 404 Error

The user is experiencing a 404 error when clicking "Start Cooking" in the Kitchen Display System (KDS). This is due to a mismatch between the frontend's use of `PATCH` and the backend's `PUT` route. Additionally, permissions need to be relaxed to allow kitchen staff (often with `cashier` role) to update order statuses.

## Proposed Changes

### Backend
#### [MODIFY] [index.ts](file:///e:/2026/Pos/backend/src/index.ts)
- Update the order status route to allow `PATCH` as an alias or change the frontend to `PUT`.
- Update the authorization middleware for `/api/orders/:id/status` to include the `cashier` role.

### Frontend
#### [MODIFY] [page.tsx](file:///e:/2026/Pos/dashboard/src/app/kds/page.tsx)
- Change `api.patch` to `api.put` in the `updateStatus` function to match the backend route.

## Verification Plan

### Automated Tests
- N/A

### Manual Verification
- Open the KDS page.
- Find an order with "received" status.
- Click "Start Cooking".
- Verify the status updates to "preparing" and the error no longer appears.
- Repeat for "Ready for Pickup" and "Complete Order".
