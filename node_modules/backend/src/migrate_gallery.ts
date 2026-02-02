import pool from './db.js';

async function migrate() {
    console.log('--- MIGRATION START ---');
    try {
        console.log('Adding is_gallery to business_templates...');
        await pool.query(
            `ALTER TABLE business_templates ADD COLUMN IF NOT EXISTS is_gallery BOOLEAN DEFAULT false;`
        );
        console.log('Column added successfully.');

        // Also ensure we have at least one gallery item for testing if table is empty
        const countRes = await pool.query('SELECT COUNT(*) FROM business_templates');
        if (countRes.rows[0].count === '0') {
            console.log('Seeding initial gallery templates...');
            await pool.query(`
                INSERT INTO business_templates (name, vertical, description, is_gallery)
                VALUES 
                ('Premium Cafe Blueprint', 'cafe', 'Optimized for high-volume coffee shops with complex modifiers.', true),
                ('Fast Food Master', 'fast-food', 'Designed for speed and high-throughput burger/pizza shops.', true);
             `);
        } else {
            console.log('Seeding skipped, data already exists.');
            // Ensure some are marked as gallery if we have existing data
            await pool.query("UPDATE business_templates SET is_gallery = true WHERE name LIKE '%Cafe%' OR name LIKE '%Gallery%'");
        }

    } catch (error: any) {
        console.error('Migration FAILED!');
        console.error('Error message:', error.message);
    } finally {
        await pool.end();
        console.log('--- MIGRATION END ---');
    }
}

migrate();
