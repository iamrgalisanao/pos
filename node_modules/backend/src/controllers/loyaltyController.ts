import type { Request, Response } from 'express';
import { withTenant } from '../db.js';
import type { PoolClient } from 'pg';

export const getLoyaltyStatus = async (req: Request, res: Response) => {
    const { customerId } = req.params;
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            const pointsResult = await client.query(
                'SELECT SUM(points) as balance FROM loyalty_points_ledger WHERE customer_id = $1',
                [customerId]
            );
            const customerResult = await client.query(
                'SELECT loyalty_tier FROM customers WHERE id = $1',
                [customerId]
            );
            return {
                balance: pointsResult.rows[0].balance || 0,
                tier: customerResult.rows[0]?.loyalty_tier || 'bronze'
            };
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch loyalty status' });
    }
};

export const createVoucher = async (req: Request, res: Response) => {
    const { code, type, value, min_spend, expires_at } = req.body;
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(
                'INSERT INTO vouchers (tenant_id, code, type, value, min_spend, expires_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [tenant_id, code, type, value, min_spend, expires_at]
            );
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create voucher' });
    }
};

export const getVouchers = async (req: Request, res: Response) => {
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query('SELECT * FROM vouchers ORDER BY created_at DESC');
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch vouchers' });
    }
};

export const validateVoucher = async (req: Request, res: Response) => {
    const { code, subtotal } = req.body;
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            const voucherRes = await client.query(
                'SELECT * FROM vouchers WHERE code = $1 AND is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())',
                [code]
            );

            if (voucherRes.rows.length === 0) {
                return { valid: false, message: 'Invalid or expired voucher code' };
            }

            const voucher = voucherRes.rows[0];

            if (subtotal < Number(voucher.min_spend)) {
                return {
                    valid: false,
                    message: `Minimum spend of $${voucher.min_spend} required for this voucher`
                };
            }

            let discount = 0;
            if (voucher.type === 'percentage') {
                discount = subtotal * (Number(voucher.value) / 100);
            } else {
                discount = Number(voucher.value);
            }

            return {
                valid: true,
                voucher_id: voucher.id,
                discount_amount: Math.min(discount, subtotal),
                type: voucher.type,
                value: voucher.value
            };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to validate voucher' });
    }
};

export const deleteVoucher = async (req: Request, res: Response) => {
    const { id } = req.params;
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID missing' });

    try {
        await withTenant(tenant_id, async (client: PoolClient) => {
            await client.query('UPDATE vouchers SET is_active = FALSE WHERE id = $1', [id]);
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete voucher' });
    }
};
