import type { Request, Response } from 'express';
import { withTenant } from '../db.js';
import type { PoolClient } from 'pg';
import crypto from 'crypto';

export const createApiKey = async (req: Request, res: Response) => {
    const { tenant_id, name } = req.body;

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            const prefix = 'np_';
            const key = crypto.randomBytes(32).toString('hex');
            const keyHash = crypto.createHash('sha256').update(key).digest('hex');

            const dbResult = await client.query(
                'INSERT INTO api_keys (tenant_id, name, key_hash, prefix) VALUES ($1, $2, $3, $4) RETURNING id, prefix',
                [tenant_id, name, keyHash, prefix]
            );

            return {
                id: dbResult.rows[0].id,
                key: `${prefix}${key}` // Only shown once
            };
        });
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create API key' });
    }
};

export const listApiKeys = async (req: Request, res: Response) => {
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query('SELECT id, name, prefix, is_active, created_at FROM api_keys WHERE tenant_id = $1', [tenant_id]);
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch API keys' });
    }
};
