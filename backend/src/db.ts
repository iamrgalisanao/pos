import { Pool, type PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://pos_user:pos_password@localhost:5432/pos_db',
});

/**
 * Executes a callback with a client that has the current tenant set in the session.
 */
export async function withTenant(tenantId: string, callback: (client: PoolClient) => Promise<any>) {
    const client = await pool.connect();
    try {
        // Set the session variable for RLS
        await client.query(`SET app.current_tenant = ${client.escapeLiteral(tenantId)}`);
        return await callback(client);
    } finally {
        // Variable is automatically cleared when the client is released back to the pool in a standard transaction,
        // but good practice to reset if NOT using transactions or if session variables persist.
        // In Postgres, session variables persist for the duration of the connection.
        await client.query('RESET app.current_tenant');
        client.release();
    }
}

export default pool;
