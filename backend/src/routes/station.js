
const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/fayda/:id', authenticateToken, requireRole(['station']), stationController.lookupDonor);
router.post('/donors', authenticateToken, requireRole(['station']), stationController.registerDonorEvent);
router.post('/register-and-collect', authenticateToken, requireRole(['station']), stationController.registerAndCollect);
router.get('/donors', authenticateToken, requireRole(['station']), stationController.getDonorsList);
router.post('/samples', authenticateToken, requireRole(['station']), stationController.createBloodSample);
router.post('/samples/:id/route', authenticateToken, requireRole(['station']), stationController.routeSampleToLab);
router.get('/samples', authenticateToken, requireRole(['station']), stationController.getStationSamples);
router.get('/labs', authenticateToken, requireRole(['station']), stationController.getApprovedLabs);
router.get('/reports', authenticateToken, requireRole(['station']), stationController.getStationReports);

module.exports = router;
