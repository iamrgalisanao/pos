import type { Request, Response } from 'express';
import { withTenant } from '../db.js';
import type { PoolClient } from 'pg';

export const createBatch = async (req: Request, res: Response) => {
    const { tenant_id, inventory_id, batch_number, lot_number, expiry_date, quantity, cost_per_unit } = req.body;
    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            await client.query('BEGIN');
            try {
                // 1. Create batch
                const batchResult = await client.query(
                    `INSERT INTO inventory_batches 
                    (tenant_id, inventory_id, batch_number, lot_number, expiry_date, initial_quantity, current_quantity, cost_per_unit)
                    VALUES ($1, $2, $3, $4, $5, $6, $6, $7) RETURNING *`,
                    [tenant_id, inventory_id, batch_number, lot_number, expiry_date, quantity, cost_per_unit]
                );

                // 2. Update parent inventory total quantity
                await client.query(
                    'UPDATE inventory SET quantity = quantity + $1, last_updated_at = NOW() WHERE id = $2',
                    [quantity, inventory_id]
                );

                await client.query('COMMIT');
                return batchResult.rows[0];
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            }
        });
        res.status(201).json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to create batch' });
    }
};

export const getBatches = async (req: Request, res: Response) => {
    const { inventoryId } = req.params;
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(
                'SELECT * FROM inventory_batches WHERE inventory_id = $1 AND current_quantity > 0 ORDER BY expiry_date ASC NULLS LAST',
                [inventoryId]
            );
        });
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to fetch batches' });
    }
};
