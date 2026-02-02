import type { Request, Response } from 'express';
import { withTenant } from '../db.js';
import type { PoolClient } from 'pg';

export const createVariant = async (req: Request, res: Response) => {
    const { tenant_id, product_id, name, sku, price_override } = req.body;
    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(
                'INSERT INTO product_variants (tenant_id, product_id, name, sku, price_override) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [tenant_id, product_id, name, sku, price_override]
            );
        });
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to create variant' });
    }
};

export const getVariants = async (req: Request, res: Response) => {
    const { productId } = req.params;
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) {
        return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(
                'SELECT * FROM product_variants WHERE product_id = $1 AND is_active = TRUE',
                [productId]
            );
        });
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to fetch variants' });
    }
};

export const getVariantById = async (req: Request, res: Response) => {
    const { variantId } = req.params;
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID header is required' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query('SELECT * FROM product_variants WHERE id = $1', [variantId]);
        });
        if (result.rows.length === 0) return res.status(404).json({ error: 'Variant not found' });
        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to fetch variant' });
    }
};
