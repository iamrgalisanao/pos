import type { Request, Response } from 'express';
import { withTenant } from '../db.js';
import type { PoolClient } from 'pg';

export const createCustomer = async (req: Request, res: Response) => {
    const { tenant_id, name, email, phone } = req.body;

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(
                'INSERT INTO customers (tenant_id, name, email, phone) VALUES ($1, $2, $3, $4) RETURNING *',
                [tenant_id, name, email, phone]
            );
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create customer' });
    }
};

export const getCustomers = async (req: Request, res: Response) => {
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query('SELECT * FROM customers ORDER BY created_at DESC');
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
};

export const getCustomerById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query('SELECT * FROM customers WHERE id = $1', [id]);
        });
        if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
};

export const updateCustomer = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { tenant_id, name, email, phone, loyalty_tier } = req.body;

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(
                'UPDATE customers SET name = $1, email = $2, phone = $3, loyalty_tier = $4, updated_at = now() WHERE id = $5 RETURNING *',
                [name, email, phone, loyalty_tier, id]
            );
        });
        if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update customer' });
    }
};

export const getCustomerHistory = async (req: Request, res: Response) => {
    const { id } = req.params;
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(
                'SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC',
                [id]
            );
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};

export const getLoyaltyLedger = async (req: Request, res: Response) => {
    const { id } = req.params;
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(
                'SELECT * FROM loyalty_points_ledger WHERE customer_id = $1 ORDER BY created_at DESC',
                [id]
            );
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch loyalty ledger' });
    }
};
