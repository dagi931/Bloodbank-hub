const express = require('express');
const router = express.Router();
const hospitalController = require('./hospital.controller');
const { authenticateToken, requireRole } = require('../../shared/middleware/auth');

router.get('/stock', authenticateToken, requireRole(['hospital']), hospitalController.getHospitalStock);
router.get('/stock-levels', authenticateToken, requireRole(['hospital']), hospitalController.getWarehouseStockLevels);
router.post('/requests', authenticateToken, requireRole(['hospital']), hospitalController.submitRequisition);
router.get('/requests', authenticateToken, requireRole(['hospital']), hospitalController.getRequisitions);
router.get('/emergency-patient/:fayda_id', authenticateToken, requireRole(['hospital']), hospitalController.emergencyPatientLookup);
router.get('/inter-requests', authenticateToken, requireRole(['hospital']), hospitalController.getInterHospitalRequests);
router.post('/inter-requests', authenticateToken, requireRole(['hospital']), hospitalController.createInterHospitalRequest);
router.post('/inter-requests/:id/fulfill', authenticateToken, requireRole(['hospital']), hospitalController.fulfillInterHospitalRequest);
router.get('/list', authenticateToken, requireRole(['hospital']), hospitalController.getHospitalList);
router.get('/expiring-soon', authenticateToken, requireRole(['hospital']), hospitalController.getExpiringBags);

module.exports = router;

