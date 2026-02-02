# Implementation Plan: Advanced Analytics

This plan outlines the architecture and implementation for the high-performance analytics reporting engine, providing real-time data visualization for revenue, product performance, and staff activity.

## Proposed Changes

### 1. Backend API Expansion (`analyticsController.ts`)
- **Sales Trends**: Hourly and Daily revenue/order volume aggregation.
- **Product Insights**: 
    - Top 5 products by revenue.
    - Top 5 products by volume (quantity).
- **Staff Performance**: Revenue and order count breakdown by staff member.
- **Category Analytics**: Revenue distribution across different product categories.
- **Multi-tenant Filtering**: Ensure all queries are scoped by `tenant_id` and optionally `store_id`.

### 2. Frontend Dashboards (`/analytics`)
- **Interactive Charts**: Using `recharts` for responsive, stylish data visualization (Line, Bar, Pie charts).
- **Date Range Filters**: Presets (Today, Last 7 Days, This Month) and custom ranges.
- **Comparison Engine**: Compare performance across different stores (for owners/managers).
- **Premium UI**: Glass-morphism cards, pulse animations for "Live" data, and clear KPIs.

### 3. Dependencies
- **Dashboard**: `npm install recharts lucide-react`

## Verification Plan

### Automated Tests
- Verify query performance for aggregated stats with 10k+ sample orders.
- Validate multi-tenant data isolation in reporting queries.

### Manual Verification
- Create multiple orders across different stores/staff.
- Confirm dashboard charts reflect these orders accurately in real-time.
- Verify CSV export functionality with the new date filters.
