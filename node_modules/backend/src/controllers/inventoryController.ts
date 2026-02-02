import type { Request, Response } from 'express';
import { withTenant } from '../db.js';
import type { PoolClient } from 'pg';

export const updateStock = async (req: Request, res: Response) => {
    const { tenant_id, store_id, product_id, quantity, type, reference_id } = req.body;

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            await client.query('BEGIN');
            try {
                // 1. Atomic update to inventory
                const invResult = await client.query(
                    `INSERT INTO inventory (tenant_id, store_id, product_id, variant_id, quantity)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (store_id, product_id, variant_id)
           DO UPDATE SET 
             quantity = inventory.quantity + $5,
             last_updated_at = NOW()
           RETURNING *`,
                    [tenant_id, store_id, product_id, req.body.variant_id || null, quantity]
                );

                // 2. Log transaction
                await client.query(
                    'INSERT INTO inventory_transactions (tenant_id, inventory_id, type, quantity, reference_id) VALUES ($1, $2, $3, $4, $5)',
                    [tenant_id, invResult.rows[0].id, type, quantity, reference_id]
                );

                await client.query('COMMIT');
                return invResult.rows[0];
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            }
        });
        res.json(result);
    } catch (error: any) {
        console.error('Inventory update error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            hint: error.hint,
            constraint: error.constraint
        });
        res.status(500).json({
            error: 'Failed to update inventory',
            details: error.message,
            code: error.code
        });
    }
};

export const getInventory = async (req: Request, res: Response) => {
    const tenant_id = req.header('X-Tenant-ID');
    const store_id = req.query.store_id;

    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(
                `SELECT inv.*, p.name as product_name, p.sku, v.name as variant_name, v.sku as variant_sku
                 FROM inventory inv 
                 JOIN products p ON inv.product_id = p.id 
                 LEFT JOIN product_variants v ON inv.variant_id = v.id
                 WHERE inv.store_id = $1`,
                [store_id]
            );
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
};

export const getInventoryById = async (req: Request, res: Response) => {
    const { inventoryId } = req.params;
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query('SELECT * FROM inventory WHERE id = $1', [inventoryId]);
        });
        if (result.rows.length === 0) return res.status(404).json({ error: 'Inventory record not found' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch inventory record' });
    }
};
