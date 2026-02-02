import type { Request, Response } from 'express';
import { withTenant } from '../db.js';
import pool from '../db.js';
import type { PoolClient } from 'pg';
import { logMutation } from '../sync.js';

export const applyIndustryTemplate = async (req: Request, res: Response) => {
    const { tenant_id, industry } = req.body;
    if (!tenant_id || !industry) return res.status(400).json({ error: 'tenant_id and industry are required' });

    try {
        // 1. Fetch the latest published template for this vertical
        const templateRes = await pool.query(
            `SELECT btv.* FROM business_template_versions btv
             JOIN business_templates bt ON btv.template_id = bt.id
             WHERE bt.vertical = $1 AND btv.status = 'published'
             ORDER BY btv.version_code DESC LIMIT 1`,
            [industry]
        );

        if (templateRes.rowCount === 0) {
            return res.status(404).json({ error: `No published template found for industry: ${industry}` });
        }

        const template = templateRes.rows[0];
        const config = template.config;

        await withTenant(tenant_id, async (client: PoolClient) => {
            console.log(`Applying '${industry}' template (v${template.version_code}) for tenant:`, tenant_id);

            // 2. Clear existing (if any - though usually this is for new tenants)
            // Skip for brevity, but a real system might check

            // 3. Apply Categories from Template
            if (config.categories && Array.isArray(config.categories)) {
                for (const catName of config.categories) {
                    const catRes = await client.query(
                        'INSERT INTO product_categories (tenant_id, name) VALUES ($1, $2) RETURNING id',
                        [tenant_id, catName]
                    );
                    await logMutation(client, tenant_id, 'product_categories', catRes.rows[0].id, 'INSERT');
                }
            }

            // 4. Apply Modifier Groups from Template
            if (config.modifier_groups && Array.isArray(config.modifier_groups)) {
                for (const group of config.modifier_groups) {
                    const groupRes = await client.query(
                        `INSERT INTO modifier_groups (tenant_id, name, description, min_selections, max_selections, is_required)
                         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                        [
                            tenant_id, group.name, group.description || '',
                            group.min_selections || 0, group.max_selections || 1,
                            group.is_required || false
                        ]
                    );
                    await logMutation(client, tenant_id, 'modifier_groups', groupRes.rows[0].id, 'INSERT');
                }
            }

            // 5. Update tenant record with applied template info
            await client.query(
                'UPDATE tenants SET applied_template_id = $1, applied_template_version_id = $2 WHERE id = $3',
                [template.template_id, template.id, tenant_id]
            );
        });

        res.json({
            message: `Industry template '${industry}' (v${template.version_code}) applied successfully`,
            template_version: template.version_code
        });
    } catch (error) {
        console.error('Apply template error:', error);
        res.status(500).json({ error: 'Failed to apply industry template' });
    }
};
