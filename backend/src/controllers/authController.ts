import type { Request, Response } from 'express';
import pool, { withTenant } from '../db.js';
import type { PoolClient } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const staffRes = await pool.query('SELECT * FROM staff WHERE email = $1', [email]);
        const staff = staffRes.rows[0];

        if (!staff) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Fetch store name separately with withTenant to ensure RLS bypass/context
        let store_name = null;
        if (staff.store_id) {
            try {
                const storeRes = await withTenant(staff.tenant_id, async (client: PoolClient) => {
                    return await client.query('SELECT name FROM stores WHERE id = $1', [staff.store_id]);
                });
                store_name = storeRes.rows[0]?.name;
            } catch (err) {
                console.error('Failed to fetch store name during login:', err);
            }
        }

        const isValid = await bcrypt.compare(password, staff.password_hash);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {
                id: staff.id,
                tenant_id: staff.tenant_id,
                store_id: staff.store_id,
                role: staff.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            staff: {
                id: staff.id,
                name: staff.name,
                role: staff.role,
                tenant_id: staff.tenant_id,
                store_id: staff.store_id,
                store_name: store_name
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Authentication failed' });
    }
};
