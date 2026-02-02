import pool from './src/db.js';

async function testOps() {
    console.log('--- Testing Template Operations ---');
    try {
        // 1. Create a dummy template
        const createRes = await pool.query(
            "INSERT INTO business_templates (name, vertical, description, is_gallery) VALUES ('Test Template', 'cafe', 'Test Desc', false) RETURNING id"
        );
        const testId = createRes.rows[0].id;
        console.log('✅ Created test template:', testId);

        // 2. Update the template
        const updateRes = await pool.query(
            "UPDATE business_templates SET name = 'Updated Name' WHERE id = $1 RETURNING name",
            [testId]
        );
        console.log('✅ Updated template name:', updateRes.rows[0].name);

        // 3. Delete the template
        const deleteRes = await pool.query(
            "DELETE FROM business_templates WHERE id = $1 RETURNING id",
            [testId]
        );
        console.log('✅ Deleted template:', deleteRes.rows[0].id);

        console.log('--- All Tests Passed! ---');
    } catch (err) {
        console.error('❌ Test failed:', err);
    } finally {
        process.exit(0);
    }
}

testOps();
