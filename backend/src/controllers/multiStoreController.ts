import type { Request, Response } from 'express';
import { withTenant } from '../db.js';
import type { PoolClient } from 'pg';

export const getGlobalMetrics = async (req: Request, res: Response) => {
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            // Aggregated stats across all stores
            const statsQuery = `
                SELECT 
                    COALESCE(SUM(total_amount), 0) as total_revenue,
                    COUNT(*) as total_orders,
                    COALESCE(AVG(total_amount), 0) as average_ticket_size
                FROM orders 
                WHERE tenant_id = $1 AND status != 'cancelled'
            `;

            const stats = await client.query(statsQuery, [tenant_id]);

            // Top products across all stores
            const topProductsQuery = `
                SELECT 
                    p.name as product_name,
                    SUM(oi.quantity) as total_quantity,
                    SUM(oi.unit_price * oi.quantity) as total_sales
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                JOIN products p ON oi.product_id = p.id
                WHERE o.tenant_id = $1 AND o.status != 'cancelled'
                GROUP BY p.name
                ORDER BY total_sales DESC
                LIMIT 5
            `;
            const topProducts = await client.query(topProductsQuery, [tenant_id]);

            return {
                summary: stats.rows[0],
                top_products: topProducts.rows
            };
        });
        res.json(result);
    } catch (error) {
        console.error('Global metrics error:', error);
        res.status(500).json({ error: 'Failed to fetch global metrics' });
    }
};

export const getStoreComparison = async (req: Request, res: Response) => {
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            const comparisonQuery = `
                SELECT 
                    s.id as store_id,
                    s.name as store_name,
                    COALESCE(SUM(o.total_amount), 0) as revenue,
                    COUNT(o.id) as order_count
                FROM stores s
                LEFT JOIN orders o ON s.id = o.store_id AND o.status != 'cancelled'
                WHERE s.tenant_id = $1
                GROUP BY s.id, s.name
                ORDER BY revenue DESC
            `;
            const comparison = await client.query(comparisonQuery, [tenant_id]);
            return comparison.rows;
        });
        res.json(result);
    } catch (error) {
        console.error('Store comparison error:', error);
        res.status(500).json({ error: 'Failed to fetch store comparison' });
    }
};
