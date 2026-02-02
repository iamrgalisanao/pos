import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting inventory_batches table migration...');

        await client.query('BEGIN');

        // Create inventory_batches table
        console.log('Creating inventory_batches table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS inventory_batches (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
                batch_number VARCHAR(100) NOT NULL,
                lot_number VARCHAR(100),
                expiry_date DATE,
                initial_quantity DECIMAL(12,3) NOT NULL,
                current_quantity DECIMAL(12,3) NOT NULL,
                cost_per_unit DECIMAL(12,2) DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(tenant_id, batch_number)
            );
        `);

        // Add index for faster lookups
        console.log('Creating index on inventory_batches...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_inventory_batches_inventory 
            ON inventory_batches(inventory_id);
        `);

        // Enable RLS
        console.log('Enabling Row Level Security...');
        await client.query(`
            ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
        `);

        // Create RLS policy (drop first if exists)
        console.log('Creating RLS policy...');
        await client.query(`
            DROP POLICY IF EXISTS tenant_isolation_inventory_batches ON inventory_batches;
        `);
        await client.query(`
            CREATE POLICY tenant_isolation_inventory_batches 
            ON inventory_batches 
            USING (tenant_id = current_setting('app.current_tenant')::uuid);
        `);

        await client.query('COMMIT');
        console.log('✅ Migration completed successfully!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

migrate().catch(console.error);
