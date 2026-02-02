import type { Request, Response } from 'express';
import { withTenant } from '../db.js';
import type { PoolClient } from 'pg';

export const generateZReport = async (req: Request, res: Response) => {
    const tenant_id = req.header('X-Tenant-ID');
    const { store_id, staff_id } = req.body;

    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const report = await withTenant(tenant_id, async (client: PoolClient) => {
            // Find last Z-report to determine starting point
            const lastReportResult = await client.query(
                'SELECT created_at FROM z_reports WHERE store_id = $1 ORDER BY created_at DESC LIMIT 1',
                [store_id]
            );

            const startTime = lastReportResult.rows.length > 0
                ? lastReportResult.rows[0].created_at
                : '1970-01-01';

            // Aggregate orders since then
            const statsResult = await client.query(
                `SELECT 
                    MIN(or_number) as beginning_or,
                    MAX(or_number) as ending_or,
                    SUM(gross_sales) as gross_sales,
                    SUM(vatable_sales) as vatable_sales,
                    SUM(tax_amount) as vat_amount,
                    SUM(vat_exempt_sales) as vat_exempt_sales,
                    SUM(zero_rated_sales) as zero_rated_sales,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as void_count,
                    SUM(CASE WHEN status = 'cancelled' THEN total_amount ELSE 0 END) as void_amount
                 FROM orders 
                 WHERE store_id = $1 AND created_at > $2`,
                [store_id, startTime]
            );

            const stats = statsResult.rows[0];

            if (!stats.beginning_or) {
                // Return 400 instead of throwing for a 500
                return { error: 'No transactions found for Z-Reading since last report.', status: 400 };
            }

            // Insert Z-Report
            const insertResult = await client.query(
                `INSERT INTO z_reports (
                    tenant_id, store_id, staff_id, beginning_or, ending_or,
                    gross_sales, vatable_sales, vat_amount, vat_exempt_sales, zero_rated_sales,
                    void_count, void_amount
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
                [
                    tenant_id, store_id, staff_id || null, stats.beginning_or, stats.ending_or,
                    stats.gross_sales || 0, stats.vatable_sales || 0, stats.vat_amount || 0,
                    stats.vat_exempt_sales || 0, stats.zero_rated_sales || 0,
                    stats.void_count || 0, stats.void_amount || 0
                ]
            );

            return { data: insertResult.rows[0], status: 201 };
        });

        if ('error' in report) {
            return res.status(report.status).json({ error: report.error });
        }

        res.status(report.status).json(report.data);
    } catch (error: any) {
        console.error('Z-Report error:', error);
        res.status(500).json({ error: 'Failed to generate Z-Report. Please ensure transactions exist.' });
    }
};

export const getZReports = async (req: Request, res: Response) => {
    const tenant_id = req.header('X-Tenant-ID');
    const { store_id } = req.query;

    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const reports = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(
                'SELECT * FROM z_reports WHERE store_id = $1 ORDER BY created_at DESC',
                [store_id]
            );
        });
        res.json(reports.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Z-Reports' });
    }
};

export const exportBIRSalesCSV = async (req: Request, res: Response) => {
    const tenant_id = req.header('X-Tenant-ID');
    const { store_id, startDate, endDate } = req.query;

    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const orders = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(
                `SELECT 
                    created_at, or_number, gross_sales, vatable_sales, 
                    tax_amount as vat_amount, vat_exempt_sales, zero_rated_sales, status
                 FROM orders 
                 WHERE store_id = $1 AND created_at BETWEEN $2 AND $3
                 ORDER BY created_at ASC`,
                [store_id, startDate, endDate]
            );
        });

        // Simple CSV generation
        const headers = 'Timestamp,OR Number,Gross Sales,VATable Sales,VAT Amount,Exempt Sales,Zero Rated,Status\n';
        const rows = orders.rows.map((o: any) =>
            `${o.created_at},${o.or_number},${o.gross_sales},${o.vatable_sales},${o.vat_amount},${o.vat_exempt_sales},${o.zero_rated_sales},${o.status}`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=BIR_Sales_Export_${store_id}.csv`);
        res.send(headers + rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to export CSV' });
    }
};
