# Loyalty & CRM System Implementation Plan

This plan outlines the development of a multi-tenant customer engagement and loyalty reward system.

## Proposed Changes

### 1. Backend API Expansion
- **Customer Management**: Full CRUD for the `customers` table.
- **Loyalty Engine**:
    - Automatic point earning logic upon order completion.
    - Points redemption for discounts.
    - Transactional ledger tracking in `loyalty_points_ledger`.
- **Tiers & Rules**: Manage `loyalty_tiers` and earning ratios.

### 2. Admin Dashboard (CRM)
- **Customer List**: Searchable directory with lifetime value (LTV) insights.
- **Customer Profile**: Detailed view of purchase history and points balance.
- **Loyalty Settings**: UI to define point multipliers and tiers.

### 3. POS Terminal Integration
- **Identify Customer**: Search by phone/email/name during a transaction.
- **Loyalty Feedback**: Display current points and expected points from the current cart.
- **Redemption**: Interface to "Pay with Points".

## Verification Plan

### Automated Tests
- Test point calculation logic based on different loyalty tiers.
- Verify multi-tenant isolation for customer data.

### Manual Verification
- Create a customer in the dashboard.
- Link the customer to a transaction in the terminal.
- Verify that points are accurately reflected in the ledger and profile.
