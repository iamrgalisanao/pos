# BIR Compliance Implementation Phase 3: Reporting & UI

This phase focuses on the "BIR-Readiness" and "Auditability" of the system, providing the necessary reporting tools and administrative UI to manage compliance.

## User Review Required

> [!IMPORTANT]
> **Daily Z-Reports**: I will implement a "Store Closing" workflow. When a manager initiates a Z-Reading, the system will generate an immutable aggregate record of all transactions for that day/shift.
>
> **Audit Visibility**: I will add a "Security & Audit" tab to the settings dashboard to allow owners to review the `audit_logs` generated in Phase 2.

## Proposed Changes

### 📊 Backend: Reporting & Data Aggregation

#### [MODIFY] [schema.sql](file:///e:/2026/Pos/backend/database/schema.sql)
- **Z-Reports Table**:
    ```sql
    CREATE TABLE z_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        staff_id UUID REFERENCES staff(id),
        beginning_or VARCHAR(50),
        ending_or VARCHAR(50),
        gross_sales DECIMAL(12,2) NOT NULL,
        vatable_sales DECIMAL(12,2) NOT NULL,
        vat_amount DECIMAL(12,2) NOT NULL,
        vat_exempt_sales DECIMAL(12,2) NOT NULL,
        zero_rated_sales DECIMAL(12,2) NOT NULL,
        void_count INTEGER DEFAULT 0,
        void_amount DECIMAL(12,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    ```

#### [NEW] [reportingController.ts](file:///e:/2026/Pos/backend/src/controllers/reportingController.ts)
- **`generateZReport`**: Calculates daily aggregates and stores them.
- **`exportBIRReport`**: Generates a CSV export of the `orders` and `z_reports` for a given date range.

### ⚙️ Frontend: Settings Dashboard UI

#### [NEW] [settings/page.tsx](file:///e:/2026/Pos/dashboard/src/app/settings/page.tsx)
- Create a multi-tab settings page:
    - **General**: Store Name, Address, Timezone, Currency.
    - **Tax & Compliance**: TIN, Tax Type (VAT/Non-VAT), Receipt Header text.
    - **POS Terminals**: List of registered devices and status.
    - **Audit Log**: A searchable view of the `audit_logs` table.

## Verification Plan

### Automated Tests
1. **Z-Report Consistency**:
    - Create $N$ orders with known tax/discount values.
    - Trigger a Z-Report generation.
    - Verify the Z-Report totals match the sum of orders.
2. **Export Integrity**:
    - Verify that the CSV export includes all mandatory BIR fields (TIN, OR Number, VAT breakdown).

### Manual Verification
1. Navigate to the new `/settings` page and update the TIN.
2. Verify that the change is instantly reflected in the **Audit Log** tab.
3. Test the "Close Store" button to generate a Z-Report.
