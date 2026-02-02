import type { PoolClient } from 'pg';

/**
 * Logs a mutation in the delta_log table for offline synchronization.
 */
export async function logMutation(
    client: PoolClient,
    tenantId: string,
    tableName: string,
    recordId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    terminalId: string = '00000000-0000-0000-0000-000000000000' // Default system terminal
) {
    // Increment vector clock for this tenant
    const clockResult = await client.query(
        'SELECT COALESCE(MAX(vector_clock), 0) + 1 as next_clock FROM delta_log WHERE tenant_id = $1',
        [tenantId]
    );
    const nextClock = clockResult.rows[0].next_clock;

    await client.query(
        `INSERT INTO delta_log (tenant_id, terminal_id, table_name, record_id, operation, vector_clock)
     VALUES ($1, $2, $3, $4, $5, $6)`,
        [tenantId, terminalId, tableName, recordId, operation, nextClock]
    );
}
