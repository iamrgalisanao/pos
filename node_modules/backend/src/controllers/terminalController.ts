import type { Request, Response } from 'express';
import { withTenant } from '../db.js';
import type { PoolClient } from 'pg';

export const registerTerminal = async (req: Request, res: Response) => {
    const { tenant_id, store_id, name, browser_fingerprint } = req.body;

    if (!tenant_id || !store_id) {
        return res.status(400).json({ error: 'tenant_id and store_id are required' });
    }

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(
                'INSERT INTO terminals (tenant_id, store_id, name, browser_fingerprint) VALUES ($1, $2, $3, $4) RETURNING *',
                [tenant_id, store_id, name, browser_fingerprint]
            );
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Terminal registration error:', error);
        res.status(500).json({ error: 'Failed to register terminal' });
    }
};

export const heartbeatTerminal = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { tenant_id } = req.body;

    if (!tenant_id) {
        return res.status(400).json({ error: 'tenant_id is required' });
    }

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(
                'UPDATE terminals SET last_seen_at = NOW() WHERE id = $1 RETURNING *',
                [id]
            );
        });

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Terminal not found' });
        }

        res.json({ status: 'ok', last_seen_at: result.rows[0].last_seen_at });
    } catch (error) {
        console.error('Terminal heartbeat error:', error);
        res.status(500).json({ error: 'Failed to update heartbeat' });
    }
};

export const getTerminals = async (req: Request, res: Response) => {
    const tenant_id = req.header('X-Tenant-ID');
    const store_id = req.query.store_id;

    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            let query = 'SELECT * FROM terminals WHERE tenant_id = $1';
            const params = [tenant_id];

            if (store_id) {
                query += ' AND store_id = $2';
                params.push(store_id as string);
            }

            return await client.query(query, params);
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch terminals' });
    }
};
