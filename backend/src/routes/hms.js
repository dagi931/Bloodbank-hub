const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  admitPatient,
  getPatients,
  getPatientById,
  dischargePatient,
  createBloodOrder,
  getBloodOrders,
  markTransfused,
  cancelBloodOrder,
} = require('../controllers/hmsController');

router.use(authenticateToken, requireRole(['hospital']));

router.post('/patients', admitPatient);
router.get('/patients', getPatients);
router.get('/patients/:id', getPatientById);
router.put('/patients/:id/discharge', dischargePatient);
router.post('/blood-orders', createBloodOrder);
router.get('/blood-orders', getBloodOrders);
router.put('/blood-orders/:id/transfused', markTransfused);
router.put('/blood-orders/:id/cancel', cancelBloodOrder);

module.exports = router;
