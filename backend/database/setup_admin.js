import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://pos_user:pos_password@localhost:5432/pos_db',
});

async function ensureAdmin() {
    const client = await pool.connect();
    try {
        console.log('Checking for tenant...');
        const tenantRes = await client.query('SELECT id FROM tenants LIMIT 1');
        let tenantId;

        if (tenantRes.rowCount === 0) {
            console.log('No tenant found. Creating default tenant...');
            const newTenant = await client.query(
                "INSERT INTO tenants (name, domain) VALUES ('Default Tenant', 'example.com') RETURNING id"
            );
            tenantId = newTenant.rows[0].id;
        } else {
            tenantId = tenantRes.rows[0].id;
        }

        console.log(`Using tenant ID: ${tenantId}`);

        const email = 'admin@example.com';
        const password = 'password123';
        const passwordHash = await bcrypt.hash(password, 10);

        console.log(`Checking if ${email} exists...`);
        const userRes = await client.query('SELECT id FROM staff WHERE email = $1', [email]);

        if (userRes.rowCount === 0) {
            console.log(`Creating ${email}...`);
            await client.query(
                'INSERT INTO staff (tenant_id, name, email, role, password_hash) VALUES ($1, $2, $3, $4, $5)',
                [tenantId, 'Administrator', email, 'owner', passwordHash]
            );
            console.log('Admin user created successfully.');
        } else {
            console.log(`${email} already exists. Updating password...`);
            await client.query(
                'UPDATE staff SET password_hash = $1 WHERE email = $2',
                [passwordHash, email]
            );
            console.log('Admin password updated successfully.');
        }

        console.log('\n--- Credentials ---');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('-------------------\n');

    } catch (err) {
        console.error('Operation failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

ensureAdmin();
