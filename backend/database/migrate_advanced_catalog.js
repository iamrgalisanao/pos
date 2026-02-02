import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://pos_user:pos_password@localhost:5432/pos_db',
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration for Advanced Product Catalog...');

        // 1. Updates to existing products table
        console.log('Updating products table...');
        await client.query(`
            ALTER TABLE products ADD COLUMN IF NOT EXISTS internal_name VARCHAR(255);
            ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(50) DEFAULT 'food';
            ALTER TABLE products ADD COLUMN IF NOT EXISTS lifecycle_status VARCHAR(50) DEFAULT 'active';
            ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_category_id UUID;
            ALTER TABLE products ADD COLUMN IF NOT EXISTS reporting_category_id UUID;
        `);

        // 2. Modifier Groups
        console.log('Creating modifier_groups table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS modifier_groups (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                min_selections INTEGER DEFAULT 0,
                max_selections INTEGER DEFAULT 1,
                is_required BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // 3. Modifier Options
        console.log('Creating modifier_options table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS modifier_options (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                modifier_group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
                product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                price_delta DECIMAL(12, 2) DEFAULT 0.00,
                is_default BOOLEAN DEFAULT FALSE,
                sort_order INTEGER DEFAULT 0,
                tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE
            );
        `);

        // 4. Product Modifier Groups mapping
        console.log('Creating product_modifier_groups table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS product_modifier_groups (
                product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                modifier_group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
                sort_order INTEGER DEFAULT 0,
                tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
                PRIMARY KEY (product_id, modifier_group_id)
            );
        `);

        // 5. Product Pricing Rules
        console.log('Creating product_pricing_rules table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS product_pricing_rules (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                variant_id UUID, 
                channel VARCHAR(50), 
                location_id UUID REFERENCES stores(id) ON DELETE CASCADE,
                price_override DECIMAL(12, 2),
                start_time TIME,
                end_time TIME,
                days_of_week INTEGER[],
                priority INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // 6. Product Availability Rules
        console.log('Creating product_availability_rules table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS product_availability_rules (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                location_id UUID REFERENCES stores(id) ON DELETE CASCADE,
                start_time TIME,
                end_time TIME,
                days_of_week INTEGER[],
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // 7. RLS
        console.log('Enabling RLS and policies...');
        await client.query(`
            ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;
            ALTER TABLE modifier_options ENABLE ROW LEVEL SECURITY;
            ALTER TABLE product_modifier_groups ENABLE ROW LEVEL SECURITY;
            ALTER TABLE product_pricing_rules ENABLE ROW LEVEL SECURITY;
            ALTER TABLE product_availability_rules ENABLE ROW LEVEL SECURITY;
        `);

        // Add policies if they don't exist
        const policies = [
            { table: 'modifier_groups', policy: 'tenant_isolation_modifier_groups' },
            { table: 'modifier_options', policy: 'tenant_isolation_modifier_options' },
            { table: 'product_modifier_groups', policy: 'tenant_isolation_product_mod_groups' },
            { table: 'product_pricing_rules', policy: 'tenant_isolation_pricing_rules' },
            { table: 'product_availability_rules', policy: 'tenant_isolation_availability_rules' }
        ];

        for (const p of policies) {
            await client.query(`
                DO $$ 
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = '${p.policy}') THEN
                        CREATE POLICY ${p.policy} ON ${p.table} USING (tenant_id = current_setting('app.current_tenant')::uuid);
                    END IF;
                END $$;
            `);
        }

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
