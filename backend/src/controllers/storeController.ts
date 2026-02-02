import type { Request, Response } from 'express';
import { withTenant } from '../db.js';
import type { PoolClient } from 'pg';
import { logAudit } from '../utils/audit.js';

export const createStore = async (req: Request, res: Response) => {
    const { name, address, timezone, settings, tin, tax_type } = req.body;
    const bodyTenantId = req.body.tenant_id;
    const tenant_id = (Array.isArray(bodyTenantId) ? bodyTenantId[0] : bodyTenantId) as string | undefined;

    if (!tenant_id) {
        return res.status(400).json({ error: 'tenant_id is required' });
    }

    try {
        const result = await withTenant(tenant_id, async (client) => {
            return await client.query(
                'INSERT INTO stores (tenant_id, name, address, timezone, settings, tin, tax_type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [tenant_id, name, address, timezone, JSON.stringify(settings || {}), tin, tax_type]
            );
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create store' });
    }
};

export const updateStore = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, address, timezone, currency_code, settings, tin, tax_type, reason } = req.body;
    const user = (req as any).user;
    const rawTenantId = req.body.tenant_id || user?.tenant_id || req.header('X-Tenant-ID');
    const tenant_id = (Array.isArray(rawTenantId) ? rawTenantId[0] : rawTenantId) as string | undefined;

    if (!tenant_id) {
        return res.status(400).json({ error: 'Tenant context is missing.' });
    }

    try {
        const result = await withTenant(tenant_id as string, async (client) => {
            // Get old value for audit trail and settings preservation
            const oldResult = await client.query('SELECT * FROM stores WHERE id = $1', [id]);
            if (oldResult.rows.length === 0) return null;
            const oldStore = oldResult.rows[0];

            // BIR Compliance: Check if orders exist before allowing changes to timezone or currency
            // We use loose comparison and consider null values as equivalent to their defaults if they haven't been set yet
            const effectiveOldTimezone = oldStore.timezone || 'UTC';
            const effectiveOldCurrency = oldStore.currency_code || 'PHP';

            const hasTimezoneChanged = timezone && timezone !== effectiveOldTimezone;
            const hasCurrencyChanged = currency_code && currency_code !== effectiveOldCurrency;

            if (hasTimezoneChanged || hasCurrencyChanged) {
                const orderCheck = await client.query('SELECT 1 FROM orders WHERE store_id = $1 LIMIT 1', [id]);
                if (orderCheck.rows.length > 0) {
                    return { error: 'BIR_COMPLIANCE_ERROR: Cannot change timezone or currency once transactions exist.', status: 400 };
                }
            }

            // Preserve settings if not explicitly provided in the request
            const effectiveSettings = settings || oldStore.settings || {};

            const updateResult = await client.query(
                'UPDATE stores SET name = $1, address = $2, timezone = $3, currency_code = COALESCE($4, currency_code), settings = $5, tin = $6, tax_type = $7 WHERE id = $8 RETURNING *',
                [name, address, timezone, currency_code || null, JSON.stringify(effectiveSettings), tin, tax_type, id]
            );

            // Log the audit
            await logAudit(client, {
                tenant_id: tenant_id,
                user_id: user?.id,
                action: 'UPDATE_STORE_SETTINGS',
                entity_id: id,
                entity_type: 'store',
                old_value: oldStore,
                new_value: updateResult.rows[0],
                reason: (Array.isArray(reason) ? reason[0] : (reason as string | undefined)) || 'Managerial update via Dashboard',
                ip_address: req.ip
            });

            return { data: updateResult, status: 200 };
        });

        if (!result) {
            return res.status(404).json({ error: 'Store not found' });
        }

        if ('error' in result) {
            return res.status(result.status).json({ error: result.error });
        }

        res.json(result.data.rows[0]);
    } catch (error: any) {
        console.error('Update store error:', error);
        res.status(500).json({ error: 'Internal server error while updating store' });
    }
};

export const resetStoreTransactions = async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = (req as any).user;
    const rawHeaderTenantId = req.header('X-Tenant-ID');
    const tenant_id = (user?.tenant_id || (Array.isArray(rawHeaderTenantId) ? rawHeaderTenantId[0] : (rawHeaderTenantId as string | undefined)));

    if (!tenant_id) {
        return res.status(400).json({ error: 'Tenant context is missing.' });
    }

    try {
        await withTenant(tenant_id as string, async (client) => {
            await client.query('BEGIN');

            try {
                // Delete everything related to orders
                await client.query('DELETE FROM orders WHERE store_id = $1', [id]);

                // Delete Z-Reports
                await client.query('DELETE FROM z_reports WHERE store_id = $1', [id]);

                // Reset Sequence
                await client.query('UPDATE store_sequences SET last_or_number = 0 WHERE store_id = $1', [id]);

                // Log Audit
                await logAudit(client, {
                    tenant_id: tenant_id,
                    user_id: user?.id,
                    action: 'RESET_STORE_TRANSACTIONS',
                    entity_id: id,
                    entity_type: 'store',
                    reason: 'Manual reset via Dashboard Settings',
                    ip_address: req.ip
                });

                await client.query('COMMIT');
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            }
        });

        res.json({ message: 'Store transactions cleared successfully' });
    } catch (error) {
        console.error('Reset store transactions error:', error);
        res.status(500).json({ error: 'Failed to reset store transactions' });
    }
};

export const getStores = async (req: Request, res: Response) => {
    const headerTenantId = req.header('X-Tenant-ID');
    const tenant_id = (Array.isArray(headerTenantId) ? headerTenantId[0] : (headerTenantId as string | undefined));

    if (!tenant_id) {
        return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    try {
        const result = await withTenant(tenant_id as string, async (client) => {
            return await client.query('SELECT * FROM stores');
        });
        res.json(result.rows);
    } catch (error: any) {
        console.error('Failed to fetch stores:', error);
        res.status(500).json({
            error: 'Failed to fetch stores',
            details: error.message
        });
    }
};
