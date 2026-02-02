import type { Request, Response } from 'express';
import { withTenant } from '../db.js';
import type { PoolClient } from 'pg';
import { logMutation } from '../sync.js';

export const createPricingRule = async (req: Request, res: Response) => {
    const { tenant_id, product_id, variant_id, channel, location_id, price_override, start_time, end_time, days_of_week, priority } = req.body;
    if (!tenant_id || !product_id) return res.status(400).json({ error: 'tenant_id and product_id are required' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            const res = await client.query(
                `INSERT INTO product_pricing_rules (
                    tenant_id, product_id, variant_id, channel, location_id, 
                    price_override, start_time, end_time, days_of_week, priority
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
                [tenant_id, product_id, variant_id || null, channel || null, location_id || null, price_override, start_time, end_time, days_of_week, priority || 0]
            );
            const rule = res.rows[0];
            await logMutation(client, tenant_id, 'product_pricing_rules', rule.id, 'INSERT');
            return rule;
        });
        res.status(201).json(result);
    } catch (error) {
        console.error('Create pricing rule error:', error);
        res.status(500).json({ error: 'Failed to create pricing rule' });
    }
};

export const getPricingRules = async (req: Request, res: Response) => {
    const { productId } = req.params;
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID header is required' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(
                'SELECT * FROM product_pricing_rules WHERE product_id = $1 AND is_active = TRUE',
                [productId]
            );
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pricing rules' });
    }
};

export const createAvailabilityRule = async (req: Request, res: Response) => {
    const { tenant_id, product_id, location_id, start_time, end_time, days_of_week } = req.body;
    if (!tenant_id || !product_id) return res.status(400).json({ error: 'tenant_id and product_id are required' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            const res = await client.query(
                `INSERT INTO product_availability_rules (tenant_id, product_id, location_id, start_time, end_time, days_of_week)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [tenant_id, product_id, location_id || null, start_time, end_time, days_of_week]
            );
            const rule = res.rows[0];
            await logMutation(client, tenant_id, 'product_availability_rules', rule.id, 'INSERT');
            return rule;
        });
        res.status(201).json(result);
    } catch (error) {
        console.error('Create availability rule error:', error);
        res.status(500).json({ error: 'Failed to create availability rule' });
    }
};
