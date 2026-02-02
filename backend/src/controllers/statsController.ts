import type { Request, Response } from 'express';
import { withTenant } from '../db.js';
import type { PoolClient } from 'pg';

export const getDashboardStats = async (req: Request, res: Response) => {
    const tenant_id = req.header('X-Tenant-ID') || (req as any).user?.tenant_id;

    if (!tenant_id) return res.status(400).json({ error: 'Tenant ID required' });

    try {
        const stats = await withTenant(tenant_id, async (client: PoolClient) => {
            // 1. Total Revenue
            const revenueResult = await client.query('SELECT SUM(total_amount) as total FROM orders');

            // 2. Total Orders
            const ordersResult = await client.query('SELECT COUNT(*) as count FROM orders');

            // 3. Customer Count
            const customersResult = await client.query('SELECT COUNT(*) as count FROM customers');

            // 4. Low Stock count
            const inventoryResult = await client.query('SELECT COUNT(*) as count FROM inventory WHERE quantity <= min_threshold');

            // 5. Recent Transactions
            const recentTxResult = await client.query(`
                SELECT o.id, o.total_amount as amount, o.status, c.name as customer_name, o.created_at
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                ORDER BY o.created_at DESC
                LIMIT 5
            `);

            // 6. Top Selling Items
            const topItemsResult = await client.query(`
                SELECT p.name, SUM(oi.quantity)::int as total_sold
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                GROUP BY p.name
                ORDER BY total_sold DESC
                LIMIT 5
            `);

            return {
                revenue: parseFloat(revenueResult.rows[0].total || '0'),
                orders: parseInt(ordersResult.rows[0].count || '0'),
                customers: parseInt(customersResult.rows[0].count || '0'),
                lowStock: parseInt(inventoryResult.rows[0].count || '0'),
                recentTransactions: recentTxResult.rows,
                topItems: topItemsResult.rows
            };
        });

        res.json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};
