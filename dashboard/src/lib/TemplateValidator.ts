import { TemplateConfig } from '@/store/useTemplateBuilderStore';

export interface ValidationError {
    path: string;
    message: string;
    severity: 'error' | 'warning';
}

export class TemplateValidator {
    static validate(config: TemplateConfig): ValidationError[] {
        const errors: ValidationError[] = [];

        // 1. Basic Metadata
        if (!config.name.trim()) {
            errors.push({ path: 'name', message: 'Blueprint name is required', severity: 'error' });
        }
        if (!config.vertical) {
            errors.push({ path: 'vertical', message: 'Industry vertical must be selected', severity: 'error' });
        }

        // 2. Categories
        if (config.categories.length === 0) {
            errors.push({ path: 'categories', message: 'At least one category is required', severity: 'warning' });
        }

        const categoryIds = new Set(config.categories.map(c => c.id));

        // 3. Items
        config.items.forEach((item, index) => {
            if (!item.name.trim()) {
                errors.push({ path: `items[${index}]`, message: `Item #${index + 1} is missing a name`, severity: 'error' });
            }
            if (item.price < 0) {
                errors.push({ path: `items[${index}].price`, message: `${item.name}: Price cannot be negative`, severity: 'error' });
            }
            if (!categoryIds.has(item.categoryId)) {
                errors.push({ path: `items[${index}].categoryId`, message: `${item.name}: Category assignment is invalid`, severity: 'error' });
            }
        });

        // 4. Modifiers
        const groupIds = new Set(config.modifier_groups.map(g => g.id));
        config.modifier_groups.forEach((group, index) => {
            if (!group.name.trim()) {
                errors.push({ path: `modifier_groups[${index}]`, message: `Modifier Group #${index + 1} is missing a name`, severity: 'error' });
            }
            if (group.options.length === 0) {
                errors.push({ path: `modifier_groups[${index}]`, message: `${group.name}: Must have at least one option`, severity: 'warning' });
            }
        });

        // 5. Cross-Reference Check
        config.items.forEach((item) => {
            item.modifierGroupIds.forEach(mgId => {
                if (!groupIds.has(mgId)) {
                    errors.push({ path: `items`, message: `${item.name}: References missing modifier group`, severity: 'error' });
                }
            });
        });

        return errors;
    }

    static getCompletionScore(config: TemplateConfig): number {
        const errors = this.validate(config);
        const criticalErrors = errors.filter(e => e.severity === 'error').length;

        if (criticalErrors > 10) return 0;

        let score = 100;
        score -= criticalErrors * 10;
        score -= errors.filter(e => e.severity === 'warning').length * 2;

        return Math.max(0, score);
    }
}
