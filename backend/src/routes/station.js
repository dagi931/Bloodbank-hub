
const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/fayda/:id', authenticateToken, requireRole(['station']), stationController.lookupDonor);
router.post('/donors', authenticateToken, requireRole(['station']), stationController.registerDonorEvent);
router.post('/samples', authenticateToken, requireRole(['station']), stationController.createBloodSample);
router.get('/samples', authenticateToken, requireRole(['station']), stationController.getStationSamples);
router.get('/labs', authenticateToken, requireRole(['station']), stationController.getApprovedLabs);

module.exports = router;
