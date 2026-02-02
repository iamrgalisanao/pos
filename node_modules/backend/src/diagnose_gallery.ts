import pool from './db.js';

async function diagnose() {
    console.log('--- DIAGNOSTIC START ---');
    try {
        console.log('Testing business_templates query...');
        const result = await pool.query(
            `SELECT bt.* FROM business_templates bt 
             WHERE bt.is_gallery = true 
             ORDER BY bt.name ASC`
        );
        console.log('Query successful. Rows:', result.rows.length);
        console.log('First row:', result.rows[0]);
    } catch (error: any) {
        console.error('Query FAILED!');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        if (error.message.includes('column "is_gallery" does not exist')) {
            console.log('CRITICAL: is_gallery column is missing!');
        }
    } finally {
        await pool.end();
        console.log('--- DIAGNOSTIC END ---');
    }
}

diagnose();
