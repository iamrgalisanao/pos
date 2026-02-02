# Sync & Offline Engine Implementation Plan

Enable the POS system to operate without a reliable internet connection by implementing client-side persistence and background synchronization.

## User Review Required

> [!IMPORTANT]
> The system will now use **IndexedDB** as a local cache for products and inventory. Data might be slightly stale if the sync hasn't run recently.
> 
> [!WARNING]
> While offline, the terminal cannot verify real-time stock levels from other terminals. This may lead to minor stock over-selling if multiple terminals operate offline simultaneously.

## Proposed Changes

### Dashboard (Frontend)
#### [NEW] [db.ts](file:///e:/2026/Pos/dashboard/src/lib/db.ts)
Initialize Dexie (IndexedDB) with schema for products, variants, and pending orders.

#### [NEW] [syncService.ts](file:///e:/2026/Pos/dashboard/src/lib/syncService.ts)
Background service to handle:
- Periodically pulling deltas from the backend.
- Pushing queued orders when online.
- Managing "last sync" sequence markers.

#### [MODIFY] [api.ts](file:///e:/2026/Pos/dashboard/src/lib/api.ts)
Add an interceptor or wrapper to handle network failures gracefully by falling back to local data.

#### [MODIFY] [terminal/page.tsx](file:///e:/2026/Pos/dashboard/src/app/terminal/page.tsx)
Update the checkout logic:
- If offline, save order to `orders_queue` in IndexedDB.
- Update local IndexedDB inventory immediately.

#### [NEW] [ConnectivityStatus.tsx](file:///e:/2026/Pos/dashboard/src/components/ConnectivityStatus.tsx)
A UI component to show real-time online/offline status and sync progress.

## Verification Plan

### Automated Tests
- Simulate offline state in the browser (Network Throttling).
- Verify that products still load from IndexedDB.
- Place 3 orders offline.
- Restore connection and verify they are pushed to the backend and inventory is updated.

### Manual Verification
1.  Open Terminal, load products.
2.  Disconnect internet (Wifi off).
3.  Perform a sale. Order should persist locally.
4.  Reconnect internet. Order should automatically sync and disappear from the local queue.
