import type { Request, Response } from 'express';

/**
 * Validates a batch of menu items for import
 * Expects a JSON payload from the frontend after parsing CSV
 */
export const validateImportData = async (req: Request, res: Response) => {
    const { items } = req.body;

    if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Items array is required' });
    }

    const report = items.map((item, index) => {
        const errors: string[] = [];
        if (!item.name || item.name.trim() === '') errors.push('Missing Name');
        if (item.price === undefined || item.price === null || isNaN(Number(item.price))) {
            errors.push('Invalid Price');
        } else if (Number(item.price) < 0) {
            errors.push('Negative Price');
        }

        return {
            index,
            isValid: errors.length === 0,
            errors,
            data: item
        };
    });

    res.json({
        total: items.length,
        validCount: report.filter(r => r.isValid).length,
        invalidCount: report.filter(r => !r.isValid).length,
        report
    });
};

/**
 * Downloads a standard CSV template for menu import
 */
export const downloadCsvTemplate = (req: Request, res: Response) => {
    const csvContent = "Category,Name,Description,Price,SKU\nCafe,Espresso,Rich double shot,2.50,COF-001\nCafe,Latte,Steamed milk with espresso,3.50,COF-002\nFood,Croissant,Buttery and flaky,2.00,FD-001";

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=menu_template.csv');
    res.status(200).send(csvContent);
};
