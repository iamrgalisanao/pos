
import pool from './src/db.js';

async function check() {
    try {
        const storeRes = await pool.query('SELECT id, name, currency_code, tenant_id FROM stores');
        console.log('--- ALL STORES ---');
        console.log(JSON.stringify(storeRes.rows, null, 2));

        const staffRes = await pool.query('SELECT id, name, role, store_id, tenant_id FROM staff');
        console.log('\n--- ALL STAFF ---');
        console.log(JSON.stringify(staffRes.rows, null, 2));

        const orderCountRes = await pool.query('SELECT store_id, COUNT(*) FROM orders GROUP BY store_id');
        console.log('\n--- ORDER COUNTS BY STORE ---');
        console.log(JSON.stringify(orderCountRes.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
