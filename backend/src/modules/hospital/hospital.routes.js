const express = require('express');
const router = express.Router();
const hospitalController = require('./hospital.controller');
const { authenticateToken, requireRole } = require('../../shared/middleware/auth');

const auth = [authenticateToken, requireRole(['hospital'])];

router.get('/stock',                                       ...auth, hospitalController.getHospitalStock);
router.get('/stock-levels',                                ...auth, hospitalController.getWarehouseStockLevels);
router.post('/requests',                                   ...auth, hospitalController.submitRequisition);
router.get('/requests',                                    ...auth, hospitalController.getRequisitions);

// ─── Patient Lookup (Emergency Medical History) ────────────────────────────────
// Kept for backward compatibility:
router.get('/emergency-patient/:fayda_id',                 ...auth, hospitalController.emergencyPatientLookup);
// New endpoints:
router.get('/patient-lookup',                              ...auth, hospitalController.patientLookupByFaydaId);   // ?nationalId=...
router.get('/patient-lookup-name',                         ...auth, hospitalController.patientLookupByName);      // ?fullName=...
router.get('/patient-lookup/:faydaId/record',              ...auth, hospitalController.getPatientRecord);
router.post('/patient-lookup/:faydaId/reveal-phone',       ...auth, hospitalController.revealPatientPhone);
router.post('/patient-lookup/:faydaId/reveal-screening',   ...auth, hospitalController.revealScreeningDetails);

// ─── H2H & Inventory ──────────────────────────────────────────────────────────
router.get('/inter-requests',                              ...auth, hospitalController.getInterHospitalRequests);
router.post('/inter-requests',                             ...auth, hospitalController.createInterHospitalRequest);
router.post('/inter-requests/:id/fulfill',                 ...auth, hospitalController.fulfillInterHospitalRequest);
router.get('/list',                                        ...auth, hospitalController.getHospitalList);
router.get('/expiring-soon',                               ...auth, hospitalController.getExpiringBags);

module.exports = router;
