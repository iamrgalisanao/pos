# Multi-store Admin Dashboard Implementation Plan

Provide a high-level consolidated view of performance across multiple store locations for Owners and Managers.

## User Review Required
> [!IMPORTANT]
> This feature introduces global metrics aggregation. It assumes that managers have appropriate permissions to view data across stores under their tenant.

## Proposed Changes

### Backend (Node.js/Express)

#### [NEW] `multiStoreController.ts`
- `getGlobalMetrics`: Aggregates revenue, order counts, and top products across all stores for a given tenant.
- `getStoreComparison`: Provides a side-by-side comparison of store performance metrics.

#### [MODIFY] `index.ts`
- Register routes:
    - `GET /api/admin/global-metrics`
    - `GET /api/admin/store-comparison`

---

### Dashboard (Next.js)

#### [NEW] `admin/page.tsx`
- New top-level admin lander.
- Dashboard with charts representing aggregated data.
- Store selector to drill down into specific locations.

#### [MODIFY] `Sidebar.tsx`
- Add "Global Overview" link for Owners and Managers.

#### [NEW] `components/GlobalStats.tsx`
- Reusable component for displaying tenant-wide totals.

## Verification Plan

### Automated Tests
- Verify aggregation logic correctly sums up data from multiple stores.
- Ensure cross-store data isolation (Tenant A cannot see Tenant B's global data).

### Manual Verification
- Log in as an Owner and verify the "Global Overview" displays correct totals.
- Switch between stores and verify the data updates appropriately.
