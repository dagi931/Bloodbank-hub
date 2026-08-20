const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/users', authenticateToken, requireRole(['admin']), adminController.getUsers);
router.post('/users/:id/status', authenticateToken, requireRole(['admin']), adminController.updateUserStatus);
router.get('/analytics', authenticateToken, requireRole(['admin']), adminController.getAdminAnalytics);
router.post('/reminders/trigger', authenticateToken, requireRole(['admin']), adminController.triggerThreeMonthReminders);
router.get('/audit-logs', authenticateToken, requireRole(['admin']), adminController.getAuditLogs);
router.get('/reset-requests', authenticateToken, requireRole(['admin']), adminController.getPasswordResetRequests);
router.post('/reset-requests/:id/resolve', authenticateToken, requireRole(['admin']), adminController.resolvePasswordResetRequest);

module.exports = router;

