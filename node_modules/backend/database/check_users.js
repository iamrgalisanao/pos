import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://pos_user:pos_password@localhost:5432/pos_db',
});

async function checkUsers() {
    const client = await pool.connect();
    try {
        console.log('Checking for existing users in staff table...');
        const colsRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'staff'");
        console.log('Columns in staff table:', colsRes.rows.map(r => r.column_name).join(', '));

        const result = await client.query('SELECT id, name, email, role, tenant_id FROM staff');
        console.log(`Found ${result.rowCount} users.`);
        if (result.rowCount > 0) {
            console.table(result.rows);
        } else {
            console.log('No users found in staff table.');
        }

        console.log('\nChecking for tenants...');
        const tenantRes = await client.query('SELECT id, name FROM tenants');
        console.log(`Found ${tenantRes.rowCount} tenants.`);
        console.table(tenantRes.rows);

    } catch (err) {
        console.error('Database check failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkUsers();
