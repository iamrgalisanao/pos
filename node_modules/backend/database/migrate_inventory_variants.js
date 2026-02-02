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
        console.log('Starting inventory variant_id migration...');

        await client.query('BEGIN');

        // 1. Add variant_id column to inventory table
        console.log('Adding variant_id column to inventory table...');
        await client.query(`
            ALTER TABLE inventory 
            ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE;
        `);

        // 2. Drop the old unique constraint
        console.log('Dropping old unique constraint...');
        await client.query(`
            ALTER TABLE inventory 
            DROP CONSTRAINT IF EXISTS inventory_store_id_product_id_key;
        `);

        // 3. Add new unique constraint including variant_id
        console.log('Adding new unique constraint with variant_id...');
        await client.query(`
            ALTER TABLE inventory 
            ADD CONSTRAINT inventory_store_product_variant_unique 
            UNIQUE (store_id, product_id, variant_id);
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
