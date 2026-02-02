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
        console.log('Starting migration for Template Configuration Management...');

        // 1. Business Templates Table
        console.log('Creating business_templates table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS business_templates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                vertical VARCHAR(50) NOT NULL,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // 2. Business Template Versions Table
        console.log('Creating business_template_versions table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS business_template_versions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                template_id UUID NOT NULL REFERENCES business_templates(id) ON DELETE CASCADE,
                version_code VARCHAR(20) NOT NULL,
                status VARCHAR(20) DEFAULT 'draft',
                config JSONB NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                published_at TIMESTAMP WITH TIME ZONE
            );
        `);

        // 3. Tracking on Tenants
        console.log('Adding template tracking to tenants table...');
        await client.query(`
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS applied_template_id UUID REFERENCES business_templates(id) ON DELETE SET NULL;
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS applied_template_version_id UUID REFERENCES business_template_versions(id) ON DELETE SET NULL;
        `);

        // 4. Initial Seed Data (Optional but helpful to populate from hardcoded ones)
        console.log('Seeding initial templates...');

        // Cafe Template
        const cafeIdRes = await client.query(
            "INSERT INTO business_templates (name, vertical, description) VALUES ($1, $2, $3) RETURNING id",
            ['Premium Café', 'cafe', 'Standard configuration for coffee shops and bakeries.']
        );
        const cafeTemplateId = cafeIdRes.rows[0].id;

        await client.query(
            "INSERT INTO business_template_versions (template_id, version_code, status, config, published_at) VALUES ($1, $2, $3, $4, NOW())",
            [
                cafeTemplateId,
                '1.0',
                'published',
                JSON.stringify({
                    categories: ['Espresso Drinks', 'Pastries'],
                    modifier_groups: [
                        { name: 'Milk Type', description: 'Choice of milk', min_selections: 1, max_selections: 1, is_required: true },
                        { name: 'Add-ons', description: 'Extra shots, syrups, etc.', min_selections: 0, max_selections: 5, is_required: false }
                    ]
                })
            ]
        );

        // Fast Food Template
        const ffIdRes = await client.query(
            "INSERT INTO business_templates (name, vertical, description) VALUES ($1, $2, $3) RETURNING id",
            ['Fast Food Express', 'fast-food', 'Standard configuration for quick service restaurants.']
        );
        const ffTemplateId = ffIdRes.rows[0].id;

        await client.query(
            "INSERT INTO business_template_versions (template_id, version_code, status, config, published_at) VALUES ($1, $2, $3, $4, NOW())",
            [
                ffTemplateId,
                '1.0',
                'published',
                JSON.stringify({
                    categories: ['Burgers', 'Combo Meals'],
                    modifier_groups: [
                        { name: 'Exclusions', description: 'Remove ingredients', min_selections: 0, max_selections: 10, is_required: false }
                    ]
                })
            ]
        );

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
