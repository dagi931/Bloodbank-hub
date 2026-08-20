const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/samples', authenticateToken, requireRole(['laboratory']), labController.getPendingSamples);
router.get('/warehouses', authenticateToken, requireRole(['laboratory']), labController.getWarehouses);
router.post('/samples/:id/test', authenticateToken, requireRole(['laboratory']), labController.submitTestResult);

module.exports = router;

