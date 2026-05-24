import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  loginSchema, createSaleSchema, updateSaleSchema,
  createCuttingSchema, createModelProdSchema,
  createFabricSchema, createAccessorySchema, createReadyStockSchema,
  createExpenseSchema, createDebtSchema, createClientAccountSchema,
  createReturnSchema, paginationSchema,
} from '../schemas';
import { authController } from '../controllers/auth.controller';
import { salesController } from '../controllers/sales.controller';
import { inventoryController } from '../controllers/inventory.controller';
import { productionController } from '../controllers/production.controller';
import { financeController } from '../controllers/finance.controller';
import { getDashboardMetrics } from '../services/dashboard.service';

const router = Router();

// ── Health Check ─────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Auth ─────────────────────────────────────────
router.post('/auth/login', validate(loginSchema), authController.login);
router.get('/auth/me', authenticate, authController.me);
router.get('/auth/users', authenticate, authorize('ADMIN'), authController.listUsers);
router.post('/auth/users', authenticate, authorize('ADMIN'), authController.createUser);
router.patch('/auth/users/:id', authenticate, authorize('ADMIN'), authController.updateUser);

// ── Dashboard ────────────────────────────────────
router.get('/dashboard', authenticate, authorize('ADMIN', 'MANAGER', 'VIEWER'), async (_req, res, next) => {
  try {
    const metrics = await getDashboardMetrics();
    res.json({ success: true, data: metrics });
  } catch (err) {
    next(err);
  }
});

// ── Sales ────────────────────────────────────────
router.get('/sales', authenticate, validate(paginationSchema, 'query'), salesController.list);
router.post('/sales', authenticate, validate(createSaleSchema), salesController.create);
router.get('/sales/returns', authenticate, salesController.listReturns);
router.post('/sales/returns', authenticate, validate(createReturnSchema), salesController.createReturn);
router.get('/sales/:id', authenticate, salesController.getOne);
router.put('/sales/:id', authenticate, authorize('ADMIN', 'MANAGER', 'STAFF'), validate(updateSaleSchema), salesController.update);
router.delete('/sales/:id', authenticate, authorize('ADMIN', 'MANAGER'), salesController.remove);

// ── Production: Cutting ───────────────────────────
router.get('/production/cutting', authenticate, productionController.listCutting);
router.post('/production/cutting', authenticate, validate(createCuttingSchema), productionController.createCutting);
router.put('/production/cutting/:id', authenticate, productionController.updateCutting);
router.delete('/production/cutting/:id', authenticate, authorize('ADMIN', 'MANAGER'), productionController.deleteCutting);

// ── Production: Models ────────────────────────────
router.get('/production/models', authenticate, productionController.listModelProd);
router.post('/production/models', authenticate, validate(createModelProdSchema), productionController.createModelProd);
router.put('/production/models/:id', authenticate, productionController.updateModelProd);
router.delete('/production/models/:id', authenticate, authorize('ADMIN', 'MANAGER'), productionController.deleteModelProd);

// ── Inventory: Ready Stock ────────────────────────
router.get('/inventory/ready-stock', authenticate, inventoryController.listReadyStock);
router.post('/inventory/ready-stock', authenticate, authorize('ADMIN', 'MANAGER'), validate(createReadyStockSchema), inventoryController.createReadyStock);
router.put('/inventory/ready-stock/:id', authenticate, authorize('ADMIN', 'MANAGER'), inventoryController.updateReadyStock);
router.delete('/inventory/ready-stock/:id', authenticate, authorize('ADMIN'), inventoryController.deleteReadyStock);

// ── Inventory: Fabric ─────────────────────────────
router.get('/inventory/fabric', authenticate, inventoryController.listFabric);
router.post('/inventory/fabric', authenticate, validate(createFabricSchema), inventoryController.createFabric);
router.put('/inventory/fabric/:id', authenticate, inventoryController.updateFabric);
router.delete('/inventory/fabric/:id', authenticate, authorize('ADMIN', 'MANAGER'), inventoryController.deleteFabric);

// ── Inventory: Accessories ────────────────────────
router.get('/inventory/accessories', authenticate, inventoryController.listAccessories);
router.post('/inventory/accessories', authenticate, validate(createAccessorySchema), inventoryController.createAccessory);
router.put('/inventory/accessories/:id', authenticate, inventoryController.updateAccessory);
router.delete('/inventory/accessories/:id', authenticate, authorize('ADMIN', 'MANAGER'), inventoryController.deleteAccessory);

// ── Finance: Expenses ─────────────────────────────
router.get('/finance/expenses', authenticate, authorize('ADMIN', 'MANAGER'), financeController.listExpenses);
router.post('/finance/expenses', authenticate, authorize('ADMIN', 'MANAGER'), validate(createExpenseSchema), financeController.createExpense);
router.put('/finance/expenses/:id', authenticate, authorize('ADMIN', 'MANAGER'), financeController.updateExpense);
router.delete('/finance/expenses/:id', authenticate, authorize('ADMIN'), financeController.deleteExpense);

// ── Finance: Debts ────────────────────────────────
router.get('/finance/debts', authenticate, authorize('ADMIN', 'MANAGER'), financeController.listDebts);
router.post('/finance/debts', authenticate, authorize('ADMIN', 'MANAGER'), validate(createDebtSchema), financeController.createDebt);
router.put('/finance/debts/:id', authenticate, authorize('ADMIN', 'MANAGER'), financeController.updateDebt);
router.delete('/finance/debts/:id', authenticate, authorize('ADMIN'), financeController.deleteDebt);

// ── Finance: Client Accounts ──────────────────────
router.get('/finance/client-accounts', authenticate, financeController.listClientAccounts);
router.post('/finance/client-accounts', authenticate, validate(createClientAccountSchema), financeController.createClientAccount);
router.put('/finance/client-accounts/:id', authenticate, financeController.updateClientAccount);
router.delete('/finance/client-accounts/:id', authenticate, authorize('ADMIN', 'MANAGER'), financeController.deleteClientAccount);

// ── Finance: Partners ─────────────────────────────
router.get('/finance/partners', authenticate, financeController.listPartners);
router.post('/finance/partners', authenticate, authorize('ADMIN'), financeController.createPartner);

// ── Finance: Payment Logs ─────────────────────────
router.post('/finance/payment-logs', authenticate, financeController.createPaymentLog);

export default router;
