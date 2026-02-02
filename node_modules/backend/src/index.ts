import express, { type Request, type Response } from 'express';
import pool from './db.js';
import { createServer } from 'http';
import { initSocket } from './socket.js';
import { createTenant, getTenants } from './controllers/tenantController.js';
import { createStore, getStores, updateStore, resetStoreTransactions } from './controllers/storeController.js';
import { createStaff, getStaff, updateStaff, deleteStaff } from './controllers/staffController.js';
import { createCategory, createProduct, getProducts, getProductById, updateProduct, deleteProduct, getCategories, updateCategory, deleteCategory } from './controllers/productController.js';
import { createOrder, updateOrderStatus } from './controllers/orderController.js';
import { generateZReport, getZReports, exportBIRSalesCSV } from './controllers/reportingController.js';
import { updateStock, getInventory, getInventoryById } from './controllers/inventoryController.js';
import { getSyncDeltas } from './controllers/syncController.js';
import { login } from './controllers/authController.js';
import { createVariant, getVariants, getVariantById } from './controllers/variantController.js';
import {
    createModifierGroup, getModifierGroups, addModifierOption,
    linkProductToModifierGroup, getModifiersByProduct, unlinkProductFromModifierGroup
} from './controllers/modifierController.js';
import { createPricingRule, getPricingRules, createAvailabilityRule } from './controllers/catalogRulesController.js';
import { applyIndustryTemplate } from './controllers/onboardingController.js';
import {
    getTemplates,
    getTemplateVersions,
    createTemplateVersion,
    publishTemplateVersion,
    getTemplateGallery,
    cloneTemplate,
    getMasterCatalog,
    updateTemplate,
    deleteTemplate
} from './controllers/templateController.js';
import { validateImportData, downloadCsvTemplate } from './controllers/importController.js';
import { createBatch, getBatches } from './controllers/batchController.js';
import { registerTerminal, heartbeatTerminal, getTerminals } from './controllers/terminalController.js';
import { getGlobalMetrics, getStoreComparison } from './controllers/multiStoreController.js';
import { authenticate, authorize } from './middleware/auth.js';
import { createCustomer, getCustomers, getCustomerById, updateCustomer, getCustomerHistory, getLoyaltyLedger } from './controllers/customerController.js';
import { getLoyaltyStatus, createVoucher, getVouchers, validateVoucher, deleteVoucher } from './controllers/loyaltyController.js';
import { getRevenueReport, getProductPerformance, getStaffPerformance, getCategoryPerformance, exportToCSV } from './controllers/analyticsController.js';

import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 4000;

// Enable CORS
app.use(cors());

// Initialize Socket.io
initSocket(httpServer);

app.use(express.json());

// Public Routes
app.post('/api/auth/login', login);
app.post('/api/tenants', createTenant);
app.get('/api/staff', authenticate, authorize(['owner', 'manager']), getStaff);
app.post('/api/staff', authenticate, authorize(['owner', 'manager']), createStaff);
app.put('/api/staff/:id', authenticate, authorize(['owner', 'manager']), updateStaff);
app.delete('/api/staff/:id', authenticate, authorize(['owner', 'manager']), deleteStaff);

// Protected Routes
app.get('/api/tenants', authenticate, authorize(['owner']), getTenants);
app.get('/api/stores', authenticate, authorize(['owner', 'manager', 'cashier']), getStores);
app.post('/api/stores', authenticate, authorize(['owner', 'manager']), createStore);
app.put('/api/stores/:id', authenticate, authorize(['owner', 'manager']), updateStore);
app.post('/api/stores/:id/reset', authenticate, authorize(['owner']), resetStoreTransactions);

app.get('/api/products', authenticate, authorize(['owner', 'manager', 'cashier']), getProducts);
app.get('/api/products/:productId', authenticate, authorize(['owner', 'manager', 'cashier']), getProductById);
app.post('/api/products', authenticate, authorize(['owner', 'manager']), createProduct);
app.put('/api/products/:productId', authenticate, authorize(['owner', 'manager']), updateProduct);
app.delete('/api/products/:productId', authenticate, authorize(['owner', 'manager']), deleteProduct);

app.get('/api/categories', authenticate, authorize(['owner', 'manager', 'cashier']), getCategories);
app.post('/api/categories', authenticate, authorize(['owner', 'manager']), createCategory);
app.put('/api/categories/:id', authenticate, authorize(['owner', 'manager']), updateCategory);
app.delete('/api/categories/:id', authenticate, authorize(['owner', 'manager']), deleteCategory);

app.get('/api/products/:productId/variants', authenticate, authorize(['owner', 'manager', 'cashier']), getVariants);
app.get('/api/variants/:variantId', authenticate, authorize(['owner', 'manager', 'cashier']), getVariantById);
app.post('/api/variants', authenticate, authorize(['owner', 'manager']), createVariant);

// Modifier Routes
app.get('/api/modifiers/groups', authenticate, authorize(['owner', 'manager', 'cashier']), getModifierGroups);
app.get('/api/modifiers/product/:productId', authenticate, authorize(['owner', 'manager', 'cashier']), getModifiersByProduct);
app.post('/api/modifiers/groups', authenticate, authorize(['owner', 'manager']), createModifierGroup);
app.post('/api/modifiers/options', authenticate, authorize(['owner', 'manager']), addModifierOption);
app.post('/api/modifiers/link', authenticate, authorize(['owner', 'manager']), linkProductToModifierGroup);
app.post('/api/modifiers/unlink', authenticate, authorize(['owner', 'manager']), unlinkProductFromModifierGroup);

// Catalog Rules & Onboarding
app.post('/api/catalog/pricing-rules', authenticate, authorize(['owner', 'manager']), createPricingRule);
app.get('/api/catalog/products/:productId/pricing-rules', authenticate, authorize(['owner', 'manager', 'cashier']), getPricingRules);
app.post('/api/catalog/availability-rules', authenticate, authorize(['owner', 'manager']), createAvailabilityRule);
app.post('/api/onboarding/apply-template', authenticate, authorize(['owner', 'manager']), applyIndustryTemplate);

// Platform Templates (Platform Admin Only - mapping to 'owner' for now as placeholder for super-admin)
app.get('/api/platform/templates', authenticate, authorize(['owner']), getTemplates);
app.get('/api/platform/templates/gallery', authenticate, authorize(['owner']), getTemplateGallery);
app.post('/api/platform/templates/clone', authenticate, authorize(['owner']), cloneTemplate);
app.get('/api/platform/templates/:templateId/versions', authenticate, authorize(['owner']), getTemplateVersions);
app.post('/api/platform/templates/versions', authenticate, authorize(['owner']), createTemplateVersion);
app.post('/api/platform/templates/versions/:versionId/publish', authenticate, authorize(['owner']), publishTemplateVersion);
app.put('/api/platform/templates/:id', authenticate, authorize(['owner']), updateTemplate);
app.delete('/api/platform/templates/:id', authenticate, authorize(['owner']), deleteTemplate);
app.get('/api/platform/products/master', authenticate, authorize(['owner']), getMasterCatalog);

// Import/Export
app.post('/api/platform/templates/import/validate', authenticate, authorize(['owner']), validateImportData);
app.get('/api/platform/templates/export/template-csv', authenticate, authorize(['owner']), downloadCsvTemplate);

// Customer & Loyalty Routes
app.get('/api/customers', authenticate, authorize(['owner', 'manager', 'cashier']), getCustomers);
app.get('/api/customers/:id', authenticate, authorize(['owner', 'manager', 'cashier']), getCustomerById);
app.post('/api/customers', authenticate, authorize(['owner', 'manager', 'cashier']), createCustomer);
app.put('/api/customers/:id', authenticate, authorize(['owner', 'manager']), updateCustomer);
app.get('/api/customers/:id/history', authenticate, authorize(['owner', 'manager', 'cashier']), getCustomerHistory);
app.get('/api/customers/:id/loyalty', authenticate, authorize(['owner', 'manager', 'cashier']), getLoyaltyLedger);

app.get('/api/loyalty/:customerId', authenticate, authorize(['owner', 'manager', 'cashier']), getLoyaltyStatus);
app.get('/api/vouchers', authenticate, authorize(['owner', 'manager']), getVouchers);
app.post('/api/vouchers', authenticate, authorize(['owner', 'manager']), createVoucher);
app.post('/api/vouchers/validate', authenticate, authorize(['owner', 'manager', 'cashier']), validateVoucher);
app.delete('/api/vouchers/:id', authenticate, authorize(['owner', 'manager']), deleteVoucher);

app.get('/api/analytics/revenue', authenticate, authorize(['owner', 'manager']), getRevenueReport);
app.get('/api/analytics/products', authenticate, authorize(['owner', 'manager']), getProductPerformance);
app.get('/api/analytics/staff', authenticate, authorize(['owner', 'manager']), getStaffPerformance);
app.get('/api/analytics/categories', authenticate, authorize(['owner', 'manager']), getCategoryPerformance);
app.get('/api/analytics/export', authenticate, authorize(['owner', 'manager']), exportToCSV);

app.post('/api/orders', authenticate, authorize(['owner', 'manager', 'cashier']), createOrder);
app.put('/api/orders/:id/status', authenticate, authorize(['owner', 'manager', 'cashier']), updateOrderStatus);
app.patch('/api/orders/:id/status', authenticate, authorize(['owner', 'manager', 'cashier']), updateOrderStatus);

// BIR Reporting
app.post('/api/reports/z-reading', authenticate, authorize(['owner', 'manager']), generateZReport);
app.get('/api/reports/z-reports', authenticate, authorize(['owner', 'manager']), getZReports);
app.get('/api/reports/bir-sales-export', authenticate, authorize(['owner', 'manager']), exportBIRSalesCSV);
app.get('/api/inventory', authenticate, authorize(['owner', 'manager']), getInventory);
app.get('/api/inventory/:inventoryId', authenticate, authorize(['owner', 'manager']), getInventoryById);
app.post('/api/inventory', authenticate, authorize(['owner', 'manager']), updateStock);
app.get('/api/inventory/:inventoryId/batches', authenticate, authorize(['owner', 'manager']), getBatches);
app.post('/api/inventory/batches', authenticate, authorize(['owner', 'manager']), createBatch);

import { getDashboardStats } from './controllers/statsController.js';

app.get('/api/stats', authenticate, authorize(['owner', 'manager']), getDashboardStats);
app.get('/api/sync', authenticate, authorize(['owner', 'manager', 'cashier']), getSyncDeltas);

app.post('/api/terminals/register', authenticate, registerTerminal);
app.post('/api/terminals/:id/heartbeat', authenticate, heartbeatTerminal);
app.get('/api/terminals', authenticate, authorize(['owner', 'manager']), getTerminals);

app.get('/api/admin/global-metrics', authenticate, authorize(['owner', 'manager']), getGlobalMetrics);
app.get('/api/admin/store-comparison', authenticate, authorize(['owner', 'manager']), getStoreComparison);

app.get('/health', async (req: Request, res: Response) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (err: any) {
        res.status(503).json({
            status: 'degraded',
            database: 'disconnected',
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

httpServer.listen(port, () => {
    console.log(`Backend service running on http://localhost:${port}`);
});
