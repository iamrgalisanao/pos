import type { Request, Response } from 'express';
import { withTenant } from '../db.js';
import type { PoolClient } from 'pg';
import { emitOrderFired } from '../socket.js';
import { logMutation } from '../sync.js';
import { dispatchWebhook } from './webhookController.js';

interface OrderItem {
    product_id: string;
    variant_id?: string;
    quantity: number;
    unit_price: number;
    discount_amount?: number;
    tax_amount: number;
    gross_amount?: number;
    vatable_amount?: number;
    vat_exempt_amount?: number;
    zero_rated_amount?: number;
    send_to_kds?: boolean;
}

export const createOrder = async (req: Request, res: Response) => {
    const {
        tenant_id, store_id, staff_id, customer_id,
        total_amount, tax_amount, discount_amount = 0,
        gross_sales = 0, vatable_sales = 0,
        vat_exempt_sales = 0, zero_rated_sales = 0,
        items, payments, temp_id, voucher_id
    } = req.body;

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            // Check for duplicate temp_id (idempotency)
            if (temp_id) {
                const existing = await client.query('SELECT * FROM orders WHERE client_temp_id = $1', [temp_id]);
                if (existing.rows.length > 0) return existing.rows[0];
            }

            // Use a transaction for the order and its items/payments
            await client.query('BEGIN');
            try {
                // 0. Generate Sequential OR Number
                const seqResult = await client.query(
                    'UPDATE store_sequences SET last_or_number = last_or_number + 1, updated_at = NOW() WHERE store_id = $1 RETURNING last_or_number',
                    [store_id]
                );

                let or_number = null;
                if (seqResult.rows.length > 0) {
                    const orSeq = seqResult.rows[0].last_or_number;
                    const storePrefix = store_id.split('-')[0].toUpperCase();
                    or_number = `OR-${storePrefix}-${orSeq.toString().padStart(6, '0')}`;
                }

                // 1. Create Order
                const orderResult = await client.query(
                    `INSERT INTO orders (
                        tenant_id, store_id, staff_id, customer_id, 
                        gross_sales, vatable_sales, vat_exempt_sales, zero_rated_sales,
                        total_amount, tax_amount, discount_amount,
                        status, or_number, client_temp_id, voucher_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
                    [
                        tenant_id, store_id, staff_id, customer_id,
                        gross_sales, vatable_sales, vat_exempt_sales, zero_rated_sales,
                        total_amount, tax_amount, discount_amount,
                        'received', or_number, temp_id || null, voucher_id || null
                    ]
                );
                const orderId = orderResult.rows[0].id;

                // 2. Create Order Items & Update Inventory
                for (const item of items as OrderItem[]) {
                    await client.query(
                        `INSERT INTO order_items (
                            order_id, product_id, variant_id, quantity, unit_price, 
                            gross_amount, vatable_amount, vat_exempt_amount, zero_rated_amount,
                            discount_amount, tax_amount
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                        [
                            orderId, item.product_id, item.variant_id || null, item.quantity, item.unit_price,
                            item.gross_amount || 0, item.vatable_amount || 0, item.vat_exempt_amount || 0, item.zero_rated_amount || 0,
                            item.discount_amount || 0, item.tax_amount
                        ]
                    );

                    // Atomic stock decrement
                    await client.query(
                        `UPDATE inventory SET quantity = quantity - $1, last_updated_at = NOW() 
                         WHERE store_id = $2 AND product_id = $3 AND (variant_id = $4 OR ($4 IS NULL AND variant_id IS NULL))`,
                        [item.quantity, store_id, item.product_id, item.variant_id || null]
                    );

                    // Log inventory transaction
                    await client.query(
                        `INSERT INTO inventory_transactions (tenant_id, inventory_id, type, quantity, reference_id)
                         SELECT $1, id, 'sale', $2, $3 FROM inventory 
                         WHERE store_id = $4 AND product_id = $5 AND (variant_id = $6 OR ($6 IS NULL AND variant_id IS NULL))`,
                        [tenant_id, -item.quantity, orderId, store_id, item.product_id, item.variant_id || null]
                    );
                }

                // 3. Create Payments
                for (const payment of payments) {
                    await client.query(
                        'INSERT INTO payments (order_id, payment_method, amount, gateway_reference) VALUES ($1, $2, $3, $4)',
                        [orderId, payment.payment_method, payment.amount, payment.gateway_reference]
                    );
                }

                // Sync log
                await logMutation(client, tenant_id, 'orders', orderId, 'INSERT', store_id);

                // 4. Loyalty Points (Phase 3)
                if (customer_id) {
                    // Fetch current tier for multiplier
                    const customerResult = await client.query('SELECT loyalty_tier FROM customers WHERE id = $1', [customer_id]);
                    const tier = customerResult.rows[0]?.loyalty_tier || 'bronze';

                    let multiplier = 1.0;
                    if (tier === 'silver') multiplier = 1.2;
                    if (tier === 'gold') multiplier = 1.5;

                    const pointsEarned = Math.floor(total_amount * multiplier);

                    await client.query(
                        'INSERT INTO loyalty_points_ledger (tenant_id, customer_id, order_id, points, type, description) VALUES ($1, $2, $3, $4, $5, $6)',
                        [tenant_id, customer_id, orderId, pointsEarned, 'earn', `Points earned from order #${orderId.split('-')[0].toUpperCase()}`]
                    );

                    // Update customer total spend and points balance
                    await client.query(
                        'UPDATE customers SET total_spent = total_spent + $1, points_balance = points_balance + $2, updated_at = now() WHERE id = $3',
                        [total_amount, pointsEarned, customer_id]
                    );
                }

                await client.query('COMMIT');

                // Emit real-time event for KDS (After commit)
                // Filter items for KDS: only those with send_to_kds = true
                const kdsItems = [];
                for (const item of items as any[]) {
                    if (item.send_to_kds !== false) {
                        const productResult = await client.query(
                            'SELECT c.kds_station FROM products p JOIN product_categories c ON p.category_id = c.id WHERE p.id = $1',
                            [item.product_id]
                        );
                        kdsItems.push({
                            ...item,
                            kds_station: productResult.rows[0]?.kds_station || 'General'
                        });
                    }
                }

                if (kdsItems.length > 0) {
                    emitOrderFired(store_id, {
                        orderId,
                        items: kdsItems,
                        total_amount,
                        status: 'received',
                        timestamp: orderResult.rows[0].created_at
                    });
                }

                return orderResult.rows[0];
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            }
        });
        res.status(201).json(result);
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, tenant_id } = req.body;

    // Validate status
    const validStatuses = ['received', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
    }

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            const orderResult = await client.query(
                'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
                [status, id]
            );

            if (orderResult.rows.length === 0) {
                throw new Error('Order not found');
            }

            const order = orderResult.rows[0];

            // Notify via Socket.io
            emitOrderFired(order.store_id, {
                type: 'status_update',
                orderId: order.id,
                status: order.status
            });

            // Log for sync
            await logMutation(client, tenant_id, 'orders', order.id, 'UPDATE', order.store_id);

            return order;
        });

        res.json(result);
    } catch (error: any) {
        console.error('Order status update error:', error);
        res.status(500).json({ error: error.message || 'Failed to update order status' });
    }
};
