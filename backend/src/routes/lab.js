const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/samples', authenticateToken, requireRole(['laboratory']), labController.getPendingSamples);
router.get('/records', authenticateToken, requireRole(['laboratory']), labController.getLabRecords);
router.get('/points', authenticateToken, requireRole(['laboratory']), labController.getDonorPoints);
router.get('/inventory-out', authenticateToken, requireRole(['laboratory']), labController.getInventoryOut);
router.get('/reports', authenticateToken, requireRole(['laboratory']), labController.getLabReports);
router.get('/warehouses', authenticateToken, requireRole(['laboratory']), labController.getWarehouses);
router.post('/samples/:id/test', authenticateToken, requireRole(['laboratory']), labController.submitTestResult);

module.exports = router;
