import type { Request, Response } from 'express';
import { withTenant } from '../db.js';
import type { PoolClient } from 'pg';
import axios from 'axios';
import crypto from 'crypto';

export const registerWebhook = async (req: Request, res: Response) => {
    const { tenant_id, url, events } = req.body;
    const secret = crypto.randomBytes(32).toString('hex');

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(
                'INSERT INTO webhooks (tenant_id, url, secret, events) VALUES ($1, $2, $3, $4) RETURNING id, url, events',
                [tenant_id, url, secret, JSON.stringify(events)]
            );
        });
        res.status(201).json({ ...result.rows[0], secret }); // Secret shown once
    } catch (error) {
        res.status(500).json({ error: 'Failed to register webhook' });
    }
};

export const dispatchWebhook = async (tenantId: string, event: string, payload: any) => {
    try {
        const result = await withTenant(tenantId, async (client: PoolClient) => {
            return await client.query('SELECT * FROM webhooks WHERE tenant_id = $1 AND is_active = TRUE', [tenantId]);
        });

        const webhooks = result.rows;
        for (const hook of webhooks) {
            if (hook.events.includes(event)) {
                const signature = crypto.createHmac('sha256', hook.secret).update(JSON.stringify(payload)).digest('hex');
                axios.post(hook.url, payload, {
                    headers: { 'X-Nodal-Signature': signature }
                }).catch((err: any) => console.error(`Webhook failed for ${hook.url}:`, err.message));
            }
        }
    } catch (error) {
        console.error('Webhook dispatch error:', error);
    }
};
