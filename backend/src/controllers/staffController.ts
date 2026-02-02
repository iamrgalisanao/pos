import type { Request, Response } from 'express';
import { withTenant } from '../db.js';
import type { PoolClient } from 'pg';

import bcrypt from 'bcryptjs';

export const createStaff = async (req: Request, res: Response) => {
    const { tenant_id, store_id, name, email, role, password } = req.body;
    const currentUser = (req as any).user;

    // RBAC check: Only owners can create owners
    if (role === 'owner' && currentUser.role !== 'owner') {
        return res.status(403).json({ error: 'Only owners can create owner accounts' });
    }

    try {
        const password_hash = await bcrypt.hash(password || 'password123', 10);

        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(
                'INSERT INTO staff (tenant_id, store_id, name, email, role, password_hash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, tenant_id, store_id, name, email, role',
                [tenant_id, store_id, name, email, role, password_hash]
            );
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create staff error:', error);
        res.status(500).json({ error: 'Failed to create staff' });
    }
};

export const getStaff = async (req: Request, res: Response) => {
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID header is required' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(`
                SELECT s.id, s.name, s.email, s.role, s.store_id, s.is_active, st.name as store_name 
                FROM staff s 
                LEFT JOIN stores st ON s.store_id = st.id 
                WHERE s.is_active = TRUE 
                ORDER BY s.name ASC
            `);
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch staff' });
    }
};

export const updateStaff = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, role, store_id, password, is_active } = req.body;
    const tenant_id = req.header('X-Tenant-ID');
    const currentUser = (req as any).user;
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            // Check if we're trying to promote someone to owner or edit an owner
            const targetRes = await client.query('SELECT role FROM staff WHERE id = $1', [id]);
            const targetRole = targetRes.rows[0]?.role;

            if ((role === 'owner' || targetRole === 'owner') && currentUser.role !== 'owner') {
                throw new Error('FORBIDDEN_OWNER_OP');
            }

            let query = 'UPDATE staff SET name = $1, email = $2, role = $3, store_id = $4, is_active = $5';
            const params = [name, email, role, store_id, is_active !== undefined ? is_active : true];

            if (password) {
                const hash = await bcrypt.hash(password, 10);
                query += ', password_hash = $6 WHERE id = $7 RETURNING id, name, email, role, store_id, is_active';
                params.push(hash, id);
            } else {
                query += ' WHERE id = $6 RETURNING id, name, email, role, store_id, is_active';
                params.push(id);
            }

            return await client.query(query, params);
        });
        res.json(result.rows[0]);
    } catch (error: any) {
        if (error.message === 'FORBIDDEN_OWNER_OP') {
            return res.status(403).json({ error: 'Only owners can manage owner accounts' });
        }
        res.status(500).json({ error: 'Failed to update staff' });
    }
};

export const deleteStaff = async (req: Request, res: Response) => {
    const { id } = req.params;
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        await withTenant(tenant_id, async (client: PoolClient) => {
            await client.query('UPDATE staff SET is_active = FALSE WHERE id = $1', [id]);
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete staff' });
    }
};
