import type { Request, Response } from 'express';
import { withTenant } from '../db.js';
import type { PoolClient } from 'pg';
import { logMutation } from '../sync.js';

export const createModifierGroup = async (req: Request, res: Response) => {
    const { tenant_id, name, description, min_selections, max_selections, is_required } = req.body;
    if (!tenant_id) return res.status(400).json({ error: 'tenant_id is required' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            const res = await client.query(
                `INSERT INTO modifier_groups (tenant_id, name, description, min_selections, max_selections, is_required)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [tenant_id, name, description, min_selections || 0, max_selections || 1, is_required || false]
            );
            const group = res.rows[0];
            await logMutation(client, tenant_id, 'modifier_groups', group.id, 'INSERT');
            return group;
        });
        res.status(201).json(result);
    } catch (error) {
        console.error('Create modifier group error:', error);
        res.status(500).json({ error: 'Failed to create modifier group' });
    }
};

export const getModifierGroups = async (req: Request, res: Response) => {
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID header is required' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query('SELECT * FROM modifier_groups ORDER BY name ASC');
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch modifier groups' });
    }
};

export const addModifierOption = async (req: Request, res: Response) => {
    const { tenant_id, modifier_group_id, product_id, price_delta, is_default, sort_order } = req.body;
    if (!tenant_id) return res.status(400).json({ error: 'tenant_id is required' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            const res = await client.query(
                `INSERT INTO modifier_options (tenant_id, modifier_group_id, product_id, price_delta, is_default, sort_order)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [tenant_id, modifier_group_id, product_id, price_delta || 0, is_default || false, sort_order || 0]
            );
            const option = res.rows[0];
            await logMutation(client, tenant_id, 'modifier_options', option.id, 'INSERT');
            return option;
        });
        res.status(201).json(result);
    } catch (error) {
        console.error('Add modifier option error:', error);
        res.status(500).json({ error: 'Failed to add modifier option' });
    }
};

export const linkProductToModifierGroup = async (req: Request, res: Response) => {
    const { tenant_id, product_id, modifier_group_id, sort_order } = req.body;
    if (!tenant_id) return res.status(400).json({ error: 'tenant_id is required' });

    try {
        await withTenant(tenant_id, async (client: PoolClient) => {
            await client.query(
                `INSERT INTO product_modifier_groups (tenant_id, product_id, modifier_group_id, sort_order)
                 VALUES ($1, $2, $3, $4) ON CONFLICT (product_id, modifier_group_id) DO UPDATE SET sort_order = $4`,
                [tenant_id, product_id, modifier_group_id, sort_order || 0]
            );
            // Linking table update doesn't always need a single record log, but good for sync
            await logMutation(client, tenant_id, 'product_modifier_groups', `${product_id}_${modifier_group_id}`, 'INSERT');
        });
        res.json({ message: 'Product linked to modifier group successfully' });
    } catch (error) {
        console.error('Link product modifier error:', error);
        res.status(500).json({ error: 'Failed to link product to modifier group' });
    }
};
export const getModifiersByProduct = async (req: Request, res: Response) => {
    const { productId } = req.params;
    const tenant_id = req.header('X-Tenant-ID');
    if (!tenant_id) return res.status(400).json({ error: 'X-Tenant-ID header is required' });

    try {
        const result = await withTenant(tenant_id, async (client: PoolClient) => {
            return await client.query(
                `SELECT mg.* FROM modifier_groups mg
                 JOIN product_modifier_groups pmg ON mg.id = pmg.modifier_group_id
                 WHERE pmg.product_id = $1
                 ORDER BY pmg.sort_order ASC`,
                [productId]
            );
        });
        res.json(result.rows);
    } catch (error) {
        console.error('Get modifiers by product error:', error);
        res.status(500).json({ error: 'Failed to fetch modifiers for product' });
    }
};
export const unlinkProductFromModifierGroup = async (req: Request, res: Response) => {
    const { tenant_id, product_id, modifier_group_id } = req.body;
    if (!tenant_id) return res.status(400).json({ error: 'tenant_id is required' });

    try {
        await withTenant(tenant_id, async (client: PoolClient) => {
            await client.query(
                'DELETE FROM product_modifier_groups WHERE product_id = $1 AND modifier_group_id = $2',
                [product_id, modifier_group_id]
            );
            await logMutation(client, tenant_id, 'product_modifier_groups', `${product_id}_${modifier_group_id}`, 'DELETE');
        });
        res.json({ message: 'Product unlinked from modifier group successfully' });
    } catch (error) {
        console.error('Unlink product modifier error:', error);
        res.status(500).json({ error: 'Failed to unlink product from modifier group' });
    }
};
