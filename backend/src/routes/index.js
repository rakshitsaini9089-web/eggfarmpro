const express = require('express');
const router = express.Router();

// Import all route modules
const clientsRouter = require('./clients');
const salesRouter = require('./sales');
const paymentsRouter = require('./payments');
const expensesRouter = require('./expenses');
const batchesRouter = require('./batches');
const vaccinesRouter = require('./vaccines');
const screenshotsRouter = require('./screenshots');
const mortalitiesRouter = require('./mortalities');
const feedConsumptionsRouter = require('./feedConsumptions');
const weightTrackingsRouter = require('./weightTrackings');
const medicinesRouter = require('./medicines');
const marketRatesRouter = require('./marketRates');
const inventoriesRouter = require('./inventories');
const wasteFertilizersRouter = require('./wasteFertilizers');
const usersRouter = require('./users');
const whatsappRouter = require('./whatsapp');
const voiceRouter = require('./voice');
const farmsRouter = require('./farms');
const reportsRouter = require('./reports');
const authRouter = require('./auth');
const aiRouter = require('./aiRoutes');
const { getDashboardStats } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

// Auth routes (no authentication required)
router.use('/auth', authRouter);

// Dashboard route (authentication required)
router.get('/dashboard', authenticateToken, getDashboardStats);

// Protected routes (authentication required)
router.use('/clients', authenticateToken, clientsRouter);
router.use('/sales', authenticateToken, salesRouter);
router.use('/payments', authenticateToken, paymentsRouter);
router.use('/expenses', authenticateToken, expensesRouter);
router.use('/batches', authenticateToken, batchesRouter);
router.use('/vaccines', authenticateToken, vaccinesRouter);
router.use('/screenshots', authenticateToken, screenshotsRouter);
router.use('/mortalities', authenticateToken, mortalitiesRouter);
router.use('/feed-consumptions', authenticateToken, feedConsumptionsRouter);
router.use('/weight-trackings', authenticateToken, weightTrackingsRouter);
router.use('/medicines', authenticateToken, medicinesRouter);
router.use('/market-rates', authenticateToken, marketRatesRouter);
router.use('/inventories', authenticateToken, inventoriesRouter);
router.use('/waste-fertilizers', authenticateToken, wasteFertilizersRouter);
router.use('/users', authenticateToken, usersRouter);
router.use('/whatsapp', authenticateToken, whatsappRouter);
router.use('/voice', authenticateToken, voiceRouter);
router.use('/farms', authenticateToken, farmsRouter);
router.use('/reports', authenticateToken, reportsRouter);
router.use('/ai', authenticateToken, aiRouter);

module.exports = router;