
const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/dashboard-info', authenticateToken, requireRole(['donor']), donorController.getDonorDashboardInfo);
router.post('/appointments', authenticateToken, requireRole(['donor']), donorController.bookAppointment);
router.get('/appointments', authenticateToken, requireRole(['donor']), donorController.getAppointments);
router.delete('/appointments/:id', authenticateToken, requireRole(['donor']), donorController.cancelAppointment);
router.get('/stations', authenticateToken, requireRole(['donor']), donorController.getStationsList);

module.exports = router;
