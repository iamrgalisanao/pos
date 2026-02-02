import type { Request, Response } from 'express';
import pool from '../db.js';

/**
 * Platform Admin: List all business templates
 */
export const getTemplates = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT bt.*, 
             (SELECT version_code FROM business_template_versions btv 
              WHERE btv.template_id = bt.id AND btv.status = 'published' 
              ORDER BY created_at DESC LIMIT 1) as current_version
             FROM business_templates bt 
             ORDER BY bt.name ASC`
        );
        res.json(result.rows);
    } catch (error: any) {
        console.error('Get templates error:', error);
        res.status(500).json({
            error: 'Failed to fetch business templates',
            details: error.message
        });
    }
};

/**
 * Platform Admin: Get versions for a specific template
 */
export const getTemplateVersions = async (req: Request, res: Response) => {
    const { templateId } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM business_template_versions WHERE template_id = $1 ORDER BY version_code DESC',
            [templateId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get template versions error:', error);
        res.status(500).json({ error: 'Failed to fetch template versions' });
    }
};

/**
 * Platform Admin: Create a new template version (Draft)
 */
export const createTemplateVersion = async (req: Request, res: Response) => {
    let { template_id, version_code, config, ui_state, health_score } = req.body;
    if (!template_id || !version_code || !config) {
        return res.status(400).json({ error: 'template_id, version_code, and config are required' });
    }

    try {
        // Handle "new" template creation
        if (template_id === 'new') {
            const parsedConfig = typeof config === 'string' ? JSON.parse(config) : config;
            const newTemplate = await pool.query(
                `INSERT INTO business_templates (name, vertical, description, is_gallery)
                 VALUES ($1, $2, $3, false) RETURNING id`,
                [parsedConfig.name || 'Untitled Template', parsedConfig.vertical || 'cafe', parsedConfig.description || '']
            );
            template_id = newTemplate.rows[0].id;
        }

        // Check if a draft version already exists to update it (avoid bloat)
        const existingDraft = await pool.query(
            "SELECT id FROM business_template_versions WHERE template_id = $1 AND status = 'draft' ORDER BY created_at DESC LIMIT 1",
            [template_id]
        );

        let result;
        if ((existingDraft.rowCount ?? 0) > 0 && version_code === 'DRAFT') {
            // Update the latest draft
            result = await pool.query(
                `UPDATE business_template_versions 
                 SET config = $1, ui_state = $2, health_score = $3, created_at = NOW()
                 WHERE id = $4 RETURNING *`,
                [
                    typeof config === 'string' ? config : JSON.stringify(config),
                    typeof ui_state === 'string' ? ui_state : JSON.stringify(ui_state || {}),
                    health_score || 0,
                    existingDraft.rows[0].id
                ]
            );
        } else {
            // Create a new draft/version
            result = await pool.query(
                `INSERT INTO business_template_versions (template_id, version_code, status, config, ui_state, health_score)
                 VALUES ($1, $2, 'draft', $3, $4, $5) RETURNING *`,
                [
                    template_id,
                    version_code === 'DRAFT' ? '1.0.0-draft' : version_code,
                    typeof config === 'string' ? config : JSON.stringify(config),
                    typeof ui_state === 'string' ? ui_state : JSON.stringify(ui_state || {}),
                    health_score || 0
                ]
            );
        }
        res.status((existingDraft.rowCount ?? 0) > 0 && version_code === 'DRAFT' ? 200 : 201).json(result.rows[0]);
    } catch (error) {
        console.error('Create template version error:', error);
        res.status(500).json({ error: 'Failed to create template version' });
    }
};

/**
 * Platform Admin: Publish a template version
 */
export const publishTemplateVersion = async (req: Request, res: Response) => {
    const { versionId } = req.params;
    try {
        // Build a small transaction to ensure only one is published as 'latest' if we wanted to enforce that,
        // but for now, just marking this specific one as published.
        const result = await pool.query(
            "UPDATE business_template_versions SET status = 'published', published_at = NOW() WHERE id = $1 RETURNING *",
            [versionId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Template version not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Publish template version error:', error);
        res.status(500).json({ error: 'Failed to publish template version' });
    }
};

/**
 * Platform Admin: Get template gallery (vetted industry blueprints)
 */
export const getTemplateGallery = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT bt.* FROM business_templates bt 
             WHERE bt.is_gallery = true 
             ORDER BY bt.name ASC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get gallery error:', error);
        res.status(500).json({ error: 'Failed to fetch template gallery' });
    }
};

/**
 * Platform Admin: Update template metadata
 */
export const updateTemplate = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, vertical, description, is_gallery } = req.body;

    try {
        const result = await pool.query(
            `UPDATE business_templates 
             SET name = COALESCE($1, name), 
                 vertical = COALESCE($2, vertical), 
                 description = COALESCE($3, description),
                 is_gallery = COALESCE($4, is_gallery)
             WHERE id = $5 RETURNING *`,
            [name, vertical, description, is_gallery, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
};

/**
 * Platform Admin: Delete template and all its versions
 */
export const deleteTemplate = async (req: Request, res: Response) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Delete versions first due to foreign key constraints
        await client.query('DELETE FROM business_template_versions WHERE template_id = $1', [id]);

        // 2. Delete the base template
        const result = await client.query('DELETE FROM business_templates WHERE id = $1 RETURNING *', [id]);

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Template not found' });
        }

        await client.query('COMMIT');
        res.json({ message: 'Template and all versions deleted successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Delete template error:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    } finally {
        client.release();
    }
};

/**
 * Platform Admin: Clone a template into a new blueprint
 */
export const cloneTemplate = async (req: Request, res: Response) => {
    const { fromId } = req.body;
    if (!fromId) {
        return res.status(400).json({ error: 'fromId is required' });
    }

    try {
        // 1. Get the source template and its latest version
        const sourceVersion = await pool.query(
            `SELECT * FROM business_template_versions 
             WHERE id = $1 OR (template_id = $1 AND status = 'published')
             ORDER BY created_at DESC LIMIT 1`,
            [fromId]
        );

        if (sourceVersion.rowCount === 0) {
            return res.status(404).json({ error: 'Source template version not found' });
        }

        const sourceTemplate = await pool.query(
            'SELECT * FROM business_templates WHERE id = $1',
            [sourceVersion.rows[0].template_id]
        );

        // 2. Create new template
        const newTemplateResult = await pool.query(
            `INSERT INTO business_templates (name, vertical, description, is_gallery)
             VALUES ($1, $2, $3, false) RETURNING *`,
            [`Copy of ${sourceTemplate.rows[0].name}`, sourceTemplate.rows[0].vertical, sourceTemplate.rows[0].description]
        );

        const newTemplateId = newTemplateResult.rows[0].id;

        // 3. Create new version with same config
        const newVersionResult = await pool.query(
            `INSERT INTO business_template_versions (template_id, version_code, status, config)
             VALUES ($1, '1.0.0', 'draft', $2) RETURNING *`,
            [newTemplateId, sourceVersion.rows[0].config]
        );

        res.status(201).json({
            template: newTemplateResult.rows[0],
            version: newVersionResult.rows[0]
        });
    } catch (error) {
        console.error('Clone template error:', error);
        res.status(500).json({ error: 'Failed to clone template' });
    }
};

/**
 * Platform Admin: Get all items from all gallery templates (Master Catalog)
 */
export const getMasterCatalog = async (req: Request, res: Response) => {
    try {
        // Fetch published configs of all gallery templates
        const result = await pool.query(
            `SELECT btv.config, bt.vertical, bt.name as template_name
             FROM business_templates bt
             INNER JOIN business_template_versions btv ON bt.id = btv.template_id
             WHERE bt.is_gallery = true AND btv.status = 'published'
             ORDER BY bt.name ASC`
        );

        const masterItems: any[] = [];
        const seenSkus = new Set();

        result.rows.forEach(row => {
            try {
                const config = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
                if (config && Array.isArray(config.items)) {
                    config.items.forEach((item: any) => {
                        if (item && item.sku && !seenSkus.has(item.sku)) {
                            seenSkus.add(item.sku);

                            // Safe check for category name
                            const categoryName = (config.categories && Array.isArray(config.categories))
                                ? config.categories.find((c: any) => c.id === item.categoryId)?.name || 'General'
                                : 'General';

                            masterItems.push({
                                ...item,
                                source_template: row.template_name,
                                vertical: row.vertical,
                                category_name: categoryName
                            });
                        }
                    });
                }
            } catch (e) {
                console.warn(`Skipping malformed config for template ${row.template_name}:`, e);
            }
        });

        res.json(masterItems);
    } catch (error) {
        console.error('Get master catalog error:', error);
        res.status(500).json({ error: 'Failed to fetch master catalog' });
    }
};
