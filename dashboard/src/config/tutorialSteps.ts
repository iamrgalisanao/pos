import type { TutorialStep } from '@/hooks/useTutorial';

export const receiveStockTutorialSteps: TutorialStep[] = [
    {
        id: 'welcome',
        title: 'Welcome to Stock Management! 📦',
        content: 'Let\'s learn how to receive stock for your products. This tutorial will guide you through the entire process step by step.',
        target: 'center',
        position: 'center',
    },
    {
        id: 'stock-column',
        title: 'Stock Levels',
        content: 'This column shows your current inventory levels. Green means healthy stock (>10 units), amber means low stock (1-10 units), and red means out of stock.',
        target: '[data-tutorial="stock-column"]',
        position: 'left',
    },
    {
        id: 'product-actions',
        title: 'Product Actions Menu',
        content: 'Click the three-dot menu on any product to see available actions, including receiving stock.',
        target: '[data-tutorial="product-actions"]:first-of-type',
        position: 'left',
    },
    {
        id: 'receive-button',
        title: 'Receive Stock Option',
        content: 'Select "Receive Stock" from the menu to add inventory for this product. This opens a form where you can enter the details of your stock receipt.',
        target: '[data-tutorial="receive-stock-button"]',
        position: 'left',
    },
    {
        id: 'batch-tracking',
        title: 'Batch Tracking',
        content: 'Each stock receipt is tracked with a unique batch number. This helps you manage inventory by shipment, supplier, or date received.',
        target: 'center',
        position: 'center',
    },
    {
        id: 'quantity-entry',
        title: 'Enter Quantity',
        content: 'Specify how many units you\'re receiving. This amount will be added to your current stock level automatically.',
        target: 'center',
        position: 'center',
    },
    {
        id: 'optional-details',
        title: 'Optional Details',
        content: 'You can also track lot numbers, expiry dates, and cost per unit. These details help with inventory management, especially for perishable items or cost analysis.',
        target: 'center',
        position: 'center',
    },
    {
        id: 'submit-stock',
        title: 'Submit & Update',
        content: 'Click "Receive Stock" to save. Your inventory will update immediately, and you\'ll see the new stock level reflected in the catalog with updated color coding.',
        target: 'center',
        position: 'center',
    },
    {
        id: 'complete',
        title: 'You\'re All Set! 🎉',
        content: 'You now know how to receive stock! The stock levels will always be visible in the catalog, and you can receive stock anytime from the product actions menu.',
        target: 'center',
        position: 'center',
    },
];
