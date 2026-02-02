import type { Request, Response } from 'express';
import { withTenant } from '../db.js';
import type { PoolClient } from 'pg';

export const getRevenueReport = async (req: Request, res: Response) => {
    const tenant_id = req.header('X-Tenant-ID');
    const { startDate, endDate } = req.query;

    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(
                `SELECT 
           DATE_TRUNC('day', created_at) as date,
           SUM(total_amount) as revenue,
           COUNT(id) as order_count
         FROM orders 
         WHERE created_at BETWEEN $1 AND $2
         GROUP BY 1 ORDER BY 1 ASC`,
                [startDate || '2026-01-01', endDate || '2026-12-31']
            );
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate report' });
    }
};

export const getProductPerformance = async (req: Request, res: Response) => {
    const tenant_id = req.header('X-Tenant-ID');
    const { startDate, endDate } = req.query;
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(
                `SELECT 
                    p.name,
                    SUM(oi.quantity) as total_quantity,
                    SUM(oi.quantity * oi.unit_price) as total_revenue
                 FROM order_items oi
                 JOIN products p ON oi.product_id = p.id
                 JOIN orders o ON oi.order_id = o.id
                 WHERE o.created_at BETWEEN $1 AND $2
                 GROUP BY p.name
                 ORDER BY total_revenue DESC
                 LIMIT 10`,
                [startDate || '2026-01-01', endDate || '2026-12-31']
            );
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate product report' });
    }
};

export const getStaffPerformance = async (req: Request, res: Response) => {
    const tenant_id = req.header('X-Tenant-ID');
    const { startDate, endDate } = req.query;
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(
                `SELECT 
                    s.name as staff_name,
                    COUNT(o.id) as order_count,
                    SUM(o.total_amount) as total_revenue
                 FROM orders o
                 JOIN staff s ON o.staff_id = s.id
                 WHERE o.created_at BETWEEN $1 AND $2
                 GROUP BY s.name
                 ORDER BY total_revenue DESC`,
                [startDate || '2026-01-01', endDate || '2026-12-31']
            );
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate staff report' });
    }
};

export const getCategoryPerformance = async (req: Request, res: Response) => {
    const tenant_id = req.header('X-Tenant-ID');
    const { startDate, endDate } = req.query;
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(
                `SELECT 
                    c.name as category_name,
                    SUM(oi.quantity * oi.unit_price) as total_revenue
                 FROM order_items oi
                 JOIN products p ON oi.product_id = p.id
                 JOIN product_categories c ON p.category_id = c.id
                 JOIN orders o ON oi.order_id = o.id
                 WHERE o.created_at BETWEEN $1 AND $2
                 GROUP BY c.name
                 ORDER BY total_revenue DESC`,
                [startDate || '2026-01-01', endDate || '2026-12-31']
            );
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate category report' });
    }
};

export const exportToCSV = async (req: Request, res: Response) => {
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query('SELECT * FROM orders LIMIT 1000');
        });

        if (result.rows.length === 0) return res.status(200).send('No data');

        const headers = Object.keys(result.rows[0]).join(',');
        const rows = result.rows.map((row: any) => Object.values(row).join(',')).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
        res.status(200).send(`${headers}\n${rows}`);
    } catch (error) {
        res.status(500).json({ error: 'Failed to export CSV' });
    }
};
