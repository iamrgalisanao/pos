import type { Request, Response } from 'express';
import { withTenant } from '../db.js';
import type { PoolClient } from 'pg';

export const getSyncDeltas = async (req: Request, res: Response) => {
    const tenant_id = req.header('X-Tenant-ID');
    const sinceSequence = parseInt(req.query.since as string || '0');

    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            const query = `
                SELECT 
                    id, 
                    tenant_id, 
                    terminal_id, 
                    table_name, 
                    operation, 
                    record_id, 
                    payload, 
                    vector_clock, 
                    created_at,
                    sequence::text as sequence
                FROM delta_log 
                WHERE sequence > $1 
                ORDER BY sequence ASC
            `;
            return await client.query(query, [sinceSequence]);
        });

        // Convert sequence to number for frontend
        const rows = result.rows.map((row: any) => ({
            ...row,
            sequence: parseInt(row.sequence)
        }));

        res.json(rows);
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: 'Failed to fetch sync deltas' });
    }
};
