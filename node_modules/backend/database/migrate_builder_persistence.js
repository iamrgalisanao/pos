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
        console.log('Starting migration for Builder Persistence...');

        // Add columns to business_template_versions
        console.log('Adding ui_state and health_score columns to business_template_versions...');
        await client.query(`
            ALTER TABLE business_template_versions 
            ADD COLUMN IF NOT EXISTS ui_state JSONB DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 0;
        `);

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
