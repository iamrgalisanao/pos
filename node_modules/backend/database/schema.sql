-- Initial Schema for Multi-Tenant POS System

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tenants & Stores
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency_code VARCHAR(3) DEFAULT 'USD',
    settings JSONB DEFAULT '{}',
    tin VARCHAR(20),
    tax_type VARCHAR(20) DEFAULT 'VAT', -- 'VAT', 'NON-VAT'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE store_sequences (
    store_id UUID PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
    last_or_number INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Staff & Permissions
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'cashier', -- 'owner', 'manager', 'cashier'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Product Catalog
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100),
    base_price DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Orders & Items (Partitioned by Range on created_at)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id),
    customer_id UUID,
    order_number SERIAL,
    or_number VARCHAR(50), -- Store-specific sequential receipt number
    gross_sales DECIMAL(12,2) DEFAULT 0,
    vatable_sales DECIMAL(12,2) DEFAULT 0,
    vat_exempt_sales DECIMAL(12,2) DEFAULT 0,
    zero_rated_sales DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity DECIMAL(12,3) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    gross_amount DECIMAL(12,2) DEFAULT 0,
    vatable_amount DECIMAL(12,2) DEFAULT 0,
    vat_exempt_amount DECIMAL(12,2) DEFAULT 0,
    zero_rated_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL, -- 'cash', 'card', 'ewallet'
    amount DECIMAL(12,2) NOT NULL,
    gateway_reference VARCHAR(255),
    status VARCHAR(20) DEFAULT 'captured',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Inventory Management (Phase 2 Additions)
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
    min_threshold DECIMAL(12,3) DEFAULT 5,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, product_id)
);

CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'sale', 'restock', 'adjustment', 'void'
    quantity DECIMAL(12,3) NOT NULL,
    reference_id UUID, -- order_id or other ref
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Customer Relationship Management (Phase 3)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    loyalty_tier VARCHAR(20) DEFAULT 'bronze',
    total_spent DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE loyalty_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(20) NOT NULL, -- 'bronze', 'silver', 'gold', 'platinum'
    multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    min_spend DECIMAL(12,2) NOT NULL,
    UNIQUE(tenant_id, name)
);

CREATE TABLE loyalty_points_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    points DECIMAL(12,2) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'earn', 'redeem', 'adjustment'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed'
    value DECIMAL(12,2) NOT NULL,
    min_spend DECIMAL(12,2) DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- 10. Public APIs & External Integrations (Phase 4)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    prefix VARCHAR(10) NOT NULL, -- e.g. np_ (nodal_pos)
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    secret VARCHAR(255) NOT NULL,
    events JSONB NOT NULL, -- ['order.completed', 'inventory.updated']
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for Phase 4
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- 11. Delta Log for Sync (Phase 2)
CREATE TABLE delta_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    terminal_id UUID NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    record_id UUID NOT NULL,
    payload JSONB,
    vector_clock BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for Sync
CREATE INDEX idx_delta_log_terminal ON delta_log(terminal_id, vector_clock);

-- RLS for Phase 4
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_api_keys ON api_keys USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY tenant_isolation_webhooks ON webhooks USING (tenant_id = current_setting('app.current_tenant')::uuid);
-- Enable RLS on all multi-tenant tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delta_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- Define universal policy for tenant isolation
CREATE POLICY tenant_isolation_stores ON stores USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY tenant_isolation_staff ON staff USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY tenant_isolation_categories ON product_categories USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY tenant_isolation_products ON products USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY tenant_isolation_orders ON orders USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY tenant_isolation_inventory ON inventory USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY tenant_isolation_inventory_tx ON inventory_transactions USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY tenant_isolation_delta ON delta_log USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY tenant_isolation_customers ON customers USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY tenant_isolation_tiers ON loyalty_tiers USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY tenant_isolation_points ON loyalty_points_ledger USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY tenant_isolation_vouchers ON vouchers USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Audit Logging for BIR Compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_id UUID,
    entity_type VARCHAR(50),
    old_value JSONB,
    new_value JSONB,
    reason TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_audit ON audit_logs USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- 12. Z-Reports for BIR Compliance (Phase 3)
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

ALTER TABLE z_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_z_reports ON z_reports USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Indices for performance
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_orders_tenant_store ON orders(tenant_id, store_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_orders_or_number ON orders(or_number);
CREATE INDEX idx_z_reports_store_date ON z_reports(store_id, created_at);
