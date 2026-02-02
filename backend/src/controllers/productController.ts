import type { Request, Response } from 'express';
import { withTenant } from '../db.js';
import type { PoolClient } from 'pg';
import { logMutation } from '../sync.js';

export const createCategory = async (req: Request, res: Response) => {
    const { tenant_id, name, send_to_kds } = req.body;
    if (!tenant_id || typeof tenant_id !== 'string') return res.status(400).json({ error: 'tenant_id is required' });
    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            const res = await client.query(
                'INSERT INTO product_categories (tenant_id, name, send_to_kds) VALUES ($1, $2, $3) RETURNING *',
                [tenant_id, name, send_to_kds !== undefined ? send_to_kds : true]
            );
            const category = res.rows[0];
            await logMutation(client, tenant_id, 'product_categories', category.id, 'INSERT');
            return category;
        });
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create category' });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    const {
        tenant_id, category_id, name, internal_name, product_type,
        description, sku, base_price, tax_rate, image_url
    } = req.body;
    if (!tenant_id || typeof tenant_id !== 'string') return res.status(400).json({ error: 'tenant_id is required' });
    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            const res = await client.query(
                `INSERT INTO products (
                    tenant_id, category_id, name, internal_name, product_type, 
                    description, sku, base_price, tax_rate, image_url, lifecycle_status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
                [
                    tenant_id, category_id, name, internal_name || name, product_type || 'food',
                    description, sku, base_price, tax_rate, image_url, 'active'
                ]
            );
            const product = res.rows[0];
            await logMutation(client, tenant_id, 'products', product.id, 'INSERT');
            return product;
        });
        res.status(201).json(result);
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
};

export const getProducts = async (req: Request, res: Response) => {
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) {
        return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(`
                SELECT p.*, c.name as category_name, c.send_to_kds 
                FROM products p
                LEFT JOIN product_categories c ON p.category_id = c.id
                WHERE p.is_active = TRUE
            `);
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    const { productId } = req.params;
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id || typeof tenant_id !== 'string') return res.status(400).json({ error: 'X-Tenant-ID header is required' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query('SELECT * FROM products WHERE id = $1', [productId]);
        });
        if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    const { productId } = req.params;
    const {
        tenant_id, category_id, name, internal_name, product_type,
        description, sku, base_price, tax_rate, lifecycle_status, image_url
    } = req.body;
    if (!tenant_id || typeof tenant_id !== 'string') return res.status(400).json({ error: 'tenant_id is required' });
    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            const res = await client.query(
                `UPDATE products 
                 SET category_id = $1, name = $2, internal_name = $3, product_type = $4, 
                     description = $5, sku = $6, base_price = $7, tax_rate = $8, 
                     lifecycle_status = $9, image_url = $10, is_active = $11
                 WHERE id = $12 RETURNING *`,
                [
                    category_id, name, internal_name, product_type,
                    description, sku, base_price, tax_rate,
                    lifecycle_status || 'active', image_url,
                    (lifecycle_status !== 'archived'), // sync is_active with lifecycle_status
                    productId
                ]
            );
            const product = res.rows[0];
            if (product) {
                await logMutation(client, tenant_id, 'products', product.id, 'UPDATE');
            }
            return product;
        });
        if (!result) return res.status(404).json({ error: 'Product not found' });
        res.json(result);
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    const { productId } = req.params;
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id || typeof tenant_id !== 'string') return res.status(400).json({ error: 'X-Tenant-ID header is required' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            const res = await client.query(
                'UPDATE products SET is_active = FALSE, lifecycle_status = \'archived\' WHERE id = $1 RETURNING *',
                [productId]
            );
            const product = res.rows[0];
            if (product) {
                await logMutation(client, tenant_id, 'products', product.id, 'UPDATE'); // Soft delete is an update
            }
            return product;
        });
        if (!result) return res.status(404).json({ error: 'Product not found' });
        res.json({ message: 'Product archived successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
};

export const getCategories = async (req: Request, res: Response) => {
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id || typeof tenant_id !== 'string') return res.status(400).json({ error: 'X-Tenant-ID header is required' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query('SELECT * FROM product_categories WHERE is_active = TRUE ORDER BY name ASC');
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { tenant_id, name, send_to_kds, kds_station } = req.body;
    if (!tenant_id || typeof tenant_id !== 'string') return res.status(400).json({ error: 'tenant_id is required' });
    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            const res = await client.query(
                'UPDATE product_categories SET name = $1, send_to_kds = $2, kds_station = $3 WHERE id = $4 RETURNING *',
                [name, send_to_kds, kds_station, id]
            );
            const category = res.rows[0];
            if (category) {
                await logMutation(client, tenant_id as string, 'product_categories', category.id, 'UPDATE');
            }
            return category;
        });
        if (!result) return res.status(404).json({ error: 'Category not found' });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update category' });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id || typeof tenant_id !== 'string') return res.status(400).json({ error: 'X-Tenant-ID header is required' });

    try {
        const tenantId = tenant_id as string;
        await withTenant(tenantId, async (client: PoolClient) => {
            await client.query('UPDATE product_categories SET is_active = FALSE WHERE id = $1', [id]);
            await logMutation(client, tenantId, 'product_categories', id, 'UPDATE');
        });
        res.json({ message: 'Category removed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete category' });
    }
};
