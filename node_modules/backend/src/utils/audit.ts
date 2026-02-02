import type { PoolClient } from 'pg';

export interface AuditLogEntry {
    tenant_id: string;
    user_id?: string | undefined;
    action: string;
    entity_id?: string | undefined;
    entity_type?: string | undefined;
    old_value?: any | undefined;
    new_value?: any | undefined;
    reason?: string | undefined;
    ip_address?: string | undefined;
}

export const logAudit = async (client: PoolClient, entry: AuditLogEntry) => {
    const {
        tenant_id, user_id, action, entity_id, entity_type,
        old_value, new_value, reason, ip_address
    } = entry;

    await client.query(
        `INSERT INTO audit_logs (
            tenant_id, user_id, action, entity_id, entity_type, 
            old_value, new_value, reason, ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
            tenant_id, user_id, action, entity_id, entity_type,
            JSON.stringify(old_value), JSON.stringify(new_value),
            reason, ip_address
        ]
    );
};
