const { mainDb } = require('../config/prisma');

async function getNotifications(req, res) {
  try {
    const { id: userId, role } = req.user;
    const notifications = [];

    const timeAgo = (date) => {
      if (!date) return '';
      const diff = Date.now() - new Date(date).getTime();
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    };

    if (role === 'admin') {
      // 1. Pending workstation registrations -> 'approvals' tab
      try {
        const allPending = await mainDb.user.findMany({
          where: { status: 'pending' },
          orderBy: { created_at: 'desc' },
        });
        const pendingUsers = allPending.filter((u) => u.role !== 'donor');
        pendingUsers.forEach((u) => {
          notifications.push({
            id: `admin-pending-user-${u.id}`,
            category: 'approvals',
            title: 'Workstation Registration Pending',
            desc: `${u.entity_name || u.email} (${(u.role || '').toUpperCase()}) submitted registration for authorization.`,
            time: timeAgo(u.created_at),
            type: 'warning',
            unread: true,
          });
        });
      } catch (err) {
        console.error('[notifController] Error querying pending users:', err);
      }

      // 2. Pending password reset requests -> 'resets' tab
      try {
        const resetRequests = await mainDb.passwordResetRequest.findMany({
          where: { used: false },
          orderBy: { created_at: 'desc' },
          take: 5,
        });
        resetRequests.forEach((r) => {
          notifications.push({
            id: `admin-reset-req-${r.id}`,
            category: 'resets',
            title: 'Password Reset Ticket',
            desc: `Password reset requested for account: ${r.email}.`,
            time: timeAgo(r.created_at),
            type: 'info',
            unread: true,
          });
        });
      } catch (e) {
        console.warn('[notifController] Reset requests query error:', e.message);
      }

      // 3. Recent system audit events -> 'audit' tab
      try {
        const recentLogs = await mainDb.auditLog.findMany({
          orderBy: { created_at: 'desc' },
          take: 5,
        });
        recentLogs.forEach((l) => {
          notifications.push({
            id: `admin-log-${l.id}`,
            category: 'audit',
            title: 'Audit Log Event',
            desc: l.action || 'System operation executed.',
            time: timeAgo(l.created_at),
            type: 'info',
            unread: false,
          });
        });
      } catch (e) {
        console.warn('[notifController] Audit logs query error:', e.message);
      }

    } else if (role === 'donor') {
      const donor = await mainDb.donor.findFirst({
        where: { user_id: userId },
      });

      if (donor) {
        const now = new Date();
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        if (!donor.last_donation_date || new Date(donor.last_donation_date) <= ninetyDaysAgo) {
          notifications.push({
            id: `donor-eligible-${donor.fayda_id}`,
            category: 'eligibility',
            title: '3-Month Eligibility Reached!',
            desc: `You are eligible to donate blood and save lives today! Blood group: ${donor.blood_type || 'Unknown'}.`,
            time: 'Active',
            type: 'success',
            unread: true,
          });
        }

        if (donor.points > 0) {
          notifications.push({
            id: `donor-points-${donor.fayda_id}-${donor.points}`,
            category: 'points',
            title: 'Loyalty Reward Points',
            desc: `You have accumulated ${donor.points} loyalty points from your life-saving blood donations.`,
            time: 'Current balance',
            type: 'info',
            unread: true,
          });
        }

        // Scheduled appointments -> 'messages' tab
        const donorAppts = await mainDb.appointment.findMany({
          where: { donor_id: donor.fayda_id, status: 'scheduled' },
          include: { station: true },
          orderBy: { date_time: 'asc' },
          take: 5,
        });
        donorAppts.forEach((appt) => {
          notifications.push({
            id: `donor-appt-${appt.id}`,
            category: 'messages',
            title: 'Upcoming Donation Appointment',
            desc: `Scheduled at ${appt.station?.entity_name || 'Station'} on ${new Date(appt.date_time).toLocaleString()}.`,
            time: timeAgo(appt.created_at),
            type: 'info',
            unread: true,
          });
        });
      }

      // Active campaigns -> 'campaigns' tab
      const announcements = await mainDb.announcement.findMany({
        orderBy: { created_at: 'desc' },
        take: 5,
      });
      announcements.forEach((a) => {
        notifications.push({
          id: `donor-announcement-${a.id}`,
          category: 'campaigns',
          title: a.title,
          desc: a.content || `${a.station_location || 'Blood Bank Center'} Campaign`,
          time: timeAgo(a.created_at),
          type: 'info',
          unread: true,
        });
      });

    } else if (role === 'station') {
      // Appointments & Check-ins -> 'collections' tab
      const appts = await mainDb.appointment.findMany({
        where: { station_id: userId, status: 'scheduled' },
        include: { donor: true },
        orderBy: { date_time: 'asc' },
        take: 5,
      });
      appts.forEach((a) => {
        notifications.push({
          id: `station-appt-${a.id}`,
          category: 'collections',
          title: 'Scheduled Donor Check-in',
          desc: `${a.donor?.name || 'Registered Donor'} scheduled for donation at ${new Date(a.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          time: timeAgo(a.created_at),
          type: 'info',
          unread: true,
        });
      });

      // Sample collected status -> 'collections' tab
      const samples = await mainDb.bloodSample.findMany({
        where: { station_id: userId },
        orderBy: { collected_at: 'desc' },
        take: 5,
      });
      samples.forEach((s) => {
        notifications.push({
          id: `station-sample-${s.id}`,
          category: 'collections',
          title: s.status === 'validated' ? 'Sample Validated by Lab' : 'Sample Status: ' + s.status.toUpperCase(),
          desc: `Unit ${s.id.slice(0, 8)} (${s.blood_type}) status is currently "${s.status}".`,
          time: timeAgo(s.collected_at),
          type: s.status === 'validated' ? 'success' : s.status === 'discarded' ? 'warning' : 'info',
          unread: true,
        });
      });

    } else if (role === 'laboratory') {
      // Pending samples -> 'pending' tab
      const pendingSamples = await mainDb.bloodSample.findMany({
        where: { lab_id: userId, status: 'pending_lab' },
        orderBy: { collected_at: 'desc' },
        take: 8,
      });
      pendingSamples.forEach((s) => {
        notifications.push({
          id: `lab-sample-${s.id}`,
          category: 'pending',
          title: 'Sample Awaiting Screening',
          desc: `Unit ${s.id.slice(0, 8)} (${s.blood_type}) received from collection station. Needs testing.`,
          time: timeAgo(s.collected_at),
          type: s.blood_type.includes('-') ? 'warning' : 'info',
          unread: true,
        });
      });

    } else if (role === 'warehouse') {
      // Low stock alerts -> 'inventory' tab
      const lowStock = await mainDb.warehouseStock.findMany({
        where: { quantity: { lte: 10 } },
        orderBy: { quantity: 'asc' },
        take: 8,
      });
      lowStock.forEach((s) => {
        notifications.push({
          id: `wh-stock-${s.id}`,
          category: 'inventory',
          title: 'Low Stock Warning',
          desc: `${s.blood_type} inventory at critical level: ${s.quantity} units remaining in storage.`,
          time: 'Active Alert',
          type: s.quantity <= 3 ? 'warning' : 'info',
          unread: true,
        });
      });

      // Pending hospital requisitions -> 'dispatch' tab
      const pendingReqs = await mainDb.hospitalRequest.findMany({
        where: { status: 'pending' },
        include: { hospital: true },
        orderBy: { created_at: 'desc' },
        take: 8,
      });
      pendingReqs.forEach((r) => {
        notifications.push({
          id: `wh-req-${r.id}`,
          category: 'dispatch',
          title: 'Hospital Requisition Order',
          desc: `${r.hospital?.entity_name || 'Hospital'} requested ${r.units_needed} units of ${r.blood_type}.`,
          time: timeAgo(r.created_at),
          type: 'warning',
          unread: true,
        });
      });

    } else if (role === 'hospital') {
      // Hospital requisitions -> 'request' tab
      const myReqs = await mainDb.hospitalRequest.findMany({
        where: { hospital_id: userId },
        orderBy: { created_at: 'desc' },
        take: 6,
      });
      myReqs.forEach((r) => {
        notifications.push({
          id: `hosp-req-${r.id}`,
          category: 'request',
          title: r.status === 'fulfilled' ? 'Requisition Dispatched' : 'Requisition: ' + r.status.toUpperCase(),
          desc: `Order for ${r.units_needed} units of ${r.blood_type} is "${r.status}".`,
          time: timeAgo(r.created_at),
          type: r.status === 'fulfilled' ? 'success' : 'info',
          unread: true,
        });
      });

      // Hospital local stock alerts -> 'stock' tab
      const hStocks = await mainDb.hospitalStock.findMany({
        where: { hospital_id: userId, quantity: { lte: 5 } },
        orderBy: { quantity: 'asc' },
        take: 5,
      });
      hStocks.forEach((s) => {
        notifications.push({
          id: `hosp-stock-${s.id}`,
          category: 'stock',
          title: 'Local Reserve Critical',
          desc: `${s.blood_type} stock is low (${s.quantity} units). Requisition recommended.`,
          time: 'Active Alert',
          type: 'warning',
          unread: true,
        });
      });
    }

    res.json({ notifications });
  } catch (err) {
    console.error('[notifController] Error getting notifications:', err);
    res.json({ notifications: [] });
  }
}

module.exports = { getNotifications };
