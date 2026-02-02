import type { Request, Response } from 'express';
import pool from '../db.js';

export const createTenant = async (req: Request, res: Response) => {
    const { name, domain } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO tenants (name, domain) VALUES ($1, $2) RETURNING *',
            [name, domain]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Tenant creation error:', error);
        res.status(500).json({ error: 'Failed to create tenant' });
    }
};

export const getTenants = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM tenants');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tenants' });
    }
};
