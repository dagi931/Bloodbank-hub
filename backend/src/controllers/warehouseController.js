const { mainDb } = require('../config/prisma');
const { sendSMS } = require('../utils/sms');
const { logAction } = require('../utils/audit');

// Get stock levels of this warehouse
async function getStockLevels(req, res) {
  try {
    const stock = await mainDb.warehouseStock.findMany({
      where: { warehouse_id: req.user.id },
      select: {
        blood_type: true,
        quantity: true
      }
    });
    res.json(stock);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve stock levels' });
  }
}

// Get pending hospital requests
async function getIncomingRequests(req, res) {
  try {
    const requests = await mainDb.hospitalRequest.findMany({
      where: { status: 'pending' },
      include: {
        hospital: { select: { entity_name: true } }
      },
      orderBy: { created_at: 'asc' }
    });

    const formatted = requests.map(r => ({
      id: r.id,
      hospital_id: r.hospital_id,
      hospital_name: r.hospital.entity_name,
      blood_type: r.blood_type,
      units_needed: r.units_needed,
      status: r.status,
      created_at: r.created_at
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch incoming hospital requests' });
  }
}

// Fulfill hospital request: reduces warehouse stock and increments hospital stock
async function fulfillHospitalRequest(req, res) {
  const { id } = req.params;

  try {
    const request = await mainDb.hospitalRequest.findUnique({
      where: { id },
      include: { hospital: true }
    });

    if (!request) {
      return res.status(404).json({ error: 'Hospital request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ error: `Request has already been ${request.status}` });
    }

    // Check warehouse stock level
    const stock = await mainDb.warehouseStock.findUnique({
      where: {
        warehouse_id_blood_type: {
          warehouse_id: req.user.id,
          blood_type: request.blood_type
        }
      }
    });

    const availableQty = stock ? stock.quantity : 0;
    if (availableQty < request.units_needed) {
      return res.status(400).json({
        error: `Insufficient inventory. Available: ${availableQty} units of ${request.blood_type}`
      });
    }

    // Execute fulfillment transaction
    await mainDb.$transaction(async (tx) => {
      // 1. Decrement warehouse stock
      await tx.warehouseStock.update({
        where: {
          warehouse_id_blood_type: {
            warehouse_id: req.user.id,
            blood_type: request.blood_type
          }
        },
        data: {
          quantity: { decrement: request.units_needed }
        }
      });

      // 2. Increment hospital stock
      await tx.hospitalStock.upsert({
        where: {
          hospital_id_blood_type: {
            hospital_id: request.hospital_id,
            blood_type: request.blood_type
          }
        },
        update: {
          quantity: { increment: request.units_needed }
        },
        create: {
          hospital_id: request.hospital_id,
          blood_type: request.blood_type,
          quantity: request.units_needed
        }
      });

      // Find oldest validated samples of the requested blood type in the warehouse
      const availableSamples = await tx.bloodSample.findMany({
        where: {
          blood_type: request.blood_type,
          status: 'validated',
          hospital_id: null
        },
        orderBy: {
          collected_at: 'asc'
        },
        take: request.units_needed
      });

      // Update their hospital_id to request.hospital_id
      if (availableSamples.length > 0) {
        const sampleIds = availableSamples.map(s => s.id);
        await tx.bloodSample.updateMany({
          where: {
            id: { in: sampleIds }
          },
          data: {
            hospital_id: request.hospital_id
          }
        });
      }

      // 3. Mark request as fulfilled
      await tx.hospitalRequest.update({
        where: { id },
        data: { status: 'fulfilled' }
      });
    });

    await logAction(
      req.user.id,
      'HOSPITAL_REQUEST_FULFILLED',
      `Fulfilled request ${id} for hospital ${request.hospital.entity_name}. Quantity: ${request.units_needed} bags of type ${request.blood_type}.`
    );

    // Emit real-time WebSocket notification
    const io = req.app.get('io');
    if (io) {
      io.emit('requisition_updated', {
        type: 'FULFILL',
        requestId: id,
        hospital_id: request.hospital_id,
        blood_type: request.blood_type,
        units_needed: request.units_needed
      });
    }
 
    res.json({ message: 'Request fulfilled successfully. Inventory dispatched.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process request fulfillment' });
  }
}

// Create announcement
async function createAnnouncement(req, res) {
  const { title, content, type, station_location, start_date, end_date } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const announcement = await mainDb.announcement.create({
      data: {
        title,
        content,
        type: type || 'campaign',
        station_location: station_location || null,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        warehouse_id: req.user.id
      }
    });

    await logAction(
      req.user.id,
      'CAMPAIGN_ANNOUNCEMENT_CREATED',
      `Created campaign announcement: "${title}" (${type || 'campaign'}).`
    );
 
    res.status(201).json({
      message: 'Announcement published successfully',
      announcement
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
}

// Get announcements published by this warehouse
async function getWarehouseAnnouncements(req, res) {
  try {
    const announcements = await mainDb.announcement.findMany({
      where: { warehouse_id: req.user.id },
      orderBy: { created_at: 'desc' }
    });
    res.json(announcements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve announcements' });
  }
}

// Get all announcements (for donors dashboard)
async function getAnnouncements(req, res) {
  try {
    const announcements = await mainDb.announcement.findMany({
      include: {
        warehouse: { select: { entity_name: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    const formatted = announcements.map(a => ({
      ...a,
      publisher: a.warehouse.entity_name
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve active announcements' });
  }
}

// Send emergency SMS alerts to eligible donors with specific blood type
async function sendEmergencyStockAlert(req, res) {
  const { blood_type } = req.body;

  if (!blood_type) {
    return res.status(400).json({ error: 'Blood Type is required' });
  }

  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Fetch matching donors who have not donated in the past 90 days and are healthy/unknown
    const eligibleDonors = await mainDb.donor.findMany({
      where: {
        blood_type,
        health_status: { not: 'defective' },
        OR: [
          { last_donation_date: null },
          { last_donation_date: { lte: ninetyDaysAgo } }
        ]
      }
    });

    if (eligibleDonors.length === 0) {
      return res.status(200).json({
        message: `No eligible ${blood_type} donors found in database.`,
        sentCount: 0
      });
    }

    let sentCount = 0;
    for (const d of eligibleDonors) {
      const smsMessage = `EMERGENCY ALERT: Blood Bank Hub is currently experiencing a critical shortage of ${blood_type} blood stock! As an eligible donor, your donation can save lives. Please visit a collection station immediately. - Blood Bank Hub`;
      const result = await sendSMS(d.phone, smsMessage, null, 'emergency_alert');
      if (result.success) {
        sentCount++;
      }
    }

    res.json({
      message: `Emergency SMS alerts dispatched successfully to ${sentCount} eligible ${blood_type} donors.`,
      sentCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process emergency donor alerts' });
  }
}

async function getExpiringBags(req, res) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyFiveDaysAgo = new Date();
    thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);

    const expiring = await mainDb.bloodSample.findMany({
      where: {
        status: 'validated',
        collected_at: {
          lte: thirtyDaysAgo,
          gte: thirtyFiveDaysAgo
        }
      },
      orderBy: { collected_at: 'asc' }
    });

    res.json(expiring);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve expiring blood bags' });
  }
}

module.exports = {
  getStockLevels,
  getIncomingRequests,
  fulfillHospitalRequest,
  createAnnouncement,
  getWarehouseAnnouncements,
  getAnnouncements,
  sendEmergencyStockAlert,
  getExpiringBags
};
