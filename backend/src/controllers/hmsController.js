const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const admitPatient = async (req, res) => {
  const hospital_id = req.user.id;
  let { full_name, age, gender, blood_type, fayda_id, ward, bed_number, diagnosis } = req.body;

  if (!full_name || !age || !gender || !blood_type) {
    return res.status(400).json({ error: 'full_name, age, gender, and blood_type are required.' });
  }

  ward = ward ? String(ward).trim() : 'General Ward';
  bed_number = bed_number ? String(bed_number).trim() : 'Bed 01';

  try {
    const patient = await prisma.patient.create({
      data: {
        hospital_id,
        full_name: String(full_name).trim(),
        age: parseInt(age),
        gender: String(gender).toLowerCase(),
        blood_type,
        fayda_id: fayda_id ? String(fayda_id).trim() : null,
        ward,
        bed_number,
        diagnosis: diagnosis ? String(diagnosis).trim() : null,
        admission_status: 'admitted',
      },
    });
    res.status(201).json(patient);
  } catch (err) {
    console.error('[HMS] admitPatient error:', err);
    res.status(500).json({ error: 'Failed to admit patient.' });
  }
};

const getPatients = async (req, res) => {
  const hospital_id = req.user.id;
  const { status } = req.query;  

  try {
    const patients = await prisma.patient.findMany({
      where: {
        hospital_id,
        ...(status ? { admission_status: status } : {}),
      },
      include: {
        bloodOrders: {
          orderBy: { ordered_at: 'desc' },
        },
      },
      orderBy: { admitted_at: 'desc' },
    });
    res.json(patients);
  } catch (err) {
    console.error('[HMS] getPatients error:', err);
    res.status(500).json({ error: 'Failed to fetch patients.' });
  }
};


const getPatientById = async (req, res) => {
  const hospital_id = req.user.id;
  const { id } = req.params;

  try {
    const patient = await prisma.patient.findFirst({
      where: { id, hospital_id },
      include: {
        bloodOrders: {
          orderBy: { ordered_at: 'desc' },
          include: { requisition: true },
        },
        bloodSamples: {
          orderBy: { collected_at: 'desc' },
        },
      },
    });

    if (!patient) return res.status(404).json({ error: 'Patient not found.' });
    res.json(patient);
  } catch (err) {
    console.error('[HMS] getPatientById error:', err);
    res.status(500).json({ error: 'Failed to fetch patient.' });
  }
};

const dischargePatient = async (req, res) => {
  const hospital_id = req.user.id;
  const { id } = req.params;

  try {
    const patient = await prisma.patient.findFirst({ where: { id, hospital_id } });
    if (!patient) return res.status(404).json({ error: 'Patient not found.' });
    if (patient.admission_status === 'discharged') {
      return res.status(400).json({ error: 'Patient is already discharged.' });
    }

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        admission_status: 'discharged',
        discharged_at: new Date(),
      },
    });
    res.json(updated);
  } catch (err) {
    console.error('[HMS] dischargePatient error:', err);
    res.status(500).json({ error: 'Failed to discharge patient.' });
  }
};

const createBloodOrder = async (req, res) => {
  const hospital_id = req.user.id;
  const { patient_id, blood_type, units_needed, urgency, notes } = req.body;
  const unitsInt = parseInt(units_needed);

  if (!patient_id || !blood_type || !unitsInt) {
    return res.status(400).json({ error: 'patient_id, blood_type, and units_needed are required.' });
  }

  try {
    // Step 1: Verify patient belongs to this hospital
    const patient = await prisma.patient.findFirst({ where: { id: patient_id, hospital_id } });
    if (!patient) return res.status(404).json({ error: 'Patient not found.' });

    // Step 2: Check hospital's own internal stock first
    const stockRecord = await prisma.hospitalStock.findUnique({
      where: { hospital_id_blood_type: { hospital_id, blood_type } },
    });

    const availableUnits = stockRecord ? stockRecord.quantity : 0;
    const io = req.app.get('io');

    // ── Case A: Hospital has enough stock ─────────────────────────────────────
    if (availableUnits >= unitsInt) {
      // Decrement hospital's own inventory
      await prisma.hospitalStock.update({
        where: { hospital_id_blood_type: { hospital_id, blood_type } },
        data: { quantity: { decrement: unitsInt } },
      });

      // Create order as already dispatched from internal stock
      const order = await prisma.bloodOrder.create({
        data: {
          patient_id,
          hospital_id,
          blood_type,
          units_needed: unitsInt,
          urgency: urgency || 'routine',
          status: 'dispatched',
          notes: notes ? `${notes} [Fulfilled from internal stock]` : '[Fulfilled from internal stock]',
          requisition_id: null,
        },
        include: { patient: true },
      });

      return res.status(201).json({
        ...order,
        _fulfillment: 'internal_stock',
        _message: `✅ Fulfilled directly from your hospital's internal stock (${availableUnits} units available, ${unitsInt} used).`,
      });
    }

    // ── Case B: Partial stock — use what we have, request the rest ────────────
    if (availableUnits > 0 && availableUnits < unitsInt) {
      const shortfall = unitsInt - availableUnits;

      // Use all available stock
      await prisma.hospitalStock.update({
        where: { hospital_id_blood_type: { hospital_id, blood_type } },
        data: { quantity: 0 },
      });

      // Fire a warehouse requisition for the shortfall units only
      const requisition = await prisma.hospitalRequest.create({
        data: {
          hospital_id,
          blood_type,
          units_needed: shortfall,
          status: 'pending',
        },
      });

      const order = await prisma.bloodOrder.create({
        data: {
          patient_id,
          hospital_id,
          blood_type,
          units_needed: unitsInt,
          urgency: urgency || 'routine',
          status: 'requisition_placed',
          notes: notes
            ? `${notes} [${availableUnits} from internal stock, ${shortfall} unit(s) requested from warehouse]`
            : `[${availableUnits} from internal stock, ${shortfall} unit(s) requested from warehouse]`,
          requisition_id: requisition.id,
        },
        include: { patient: true, requisition: true },
      });

      // Notify warehouse of shortfall requisition
      if (io) {
        io.emit('requisition_updated', {
          requestId: requisition.id,
          status: 'pending',
          blood_type,
          units_needed: shortfall,
          source: 'blood_order_partial',
          patient_name: patient.full_name,
          urgency: urgency || 'routine',
        });
      }

      return res.status(201).json({
        ...order,
        _fulfillment: 'partial',
        _message: `⚠️ Only ${availableUnits} unit(s) available in your stock. Used ${availableUnits} from internal stock and sent a warehouse requisition for the remaining ${shortfall} unit(s).`,
      });
    }

    // ── Case C: No hospital stock at all — full warehouse requisition ──────────
    const requisition = await prisma.hospitalRequest.create({
      data: {
        hospital_id,
        blood_type,
        units_needed: unitsInt,
        status: 'pending',
      },
    });

    const order = await prisma.bloodOrder.create({
      data: {
        patient_id,
        hospital_id,
        blood_type,
        units_needed: unitsInt,
        urgency: urgency || 'routine',
        status: 'requisition_placed',
        notes: notes ? `${notes} [No internal stock — warehouse requisition placed]` : '[No internal stock — warehouse requisition placed]',
        requisition_id: requisition.id,
      },
      include: { patient: true, requisition: true },
    });

    // Notify warehouse
    if (io) {
      io.emit('requisition_updated', {
        requestId: requisition.id,
        status: 'pending',
        blood_type,
        units_needed: unitsInt,
        source: 'blood_order',
        patient_name: patient.full_name,
        urgency: urgency || 'routine',
      });
    }

    return res.status(201).json({
      ...order,
      _fulfillment: 'warehouse_requisition',
      _message: ` No internal stock available for ${blood_type}. A warehouse requisition has been placed automatically for ${unitsInt} unit(s).`,
    });

  } catch (err) {
    console.error('[HMS] createBloodOrder error:', err);
    res.status(500).json({ error: 'Failed to create blood order.' });
  }
};

// ─── Get all blood orders for this hospital ───────────────────────────────────
const getBloodOrders = async (req, res) => {
  const hospital_id = req.user.id;

  try {
    const orders = await prisma.bloodOrder.findMany({
      where: { hospital_id },
      include: {
        patient: { select: { id: true, full_name: true, ward: true, bed_number: true, blood_type: true } },
        requisition: { select: { id: true, status: true } },
      },
      orderBy: { ordered_at: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    console.error('[HMS] getBloodOrders error:', err);
    res.status(500).json({ error: 'Failed to fetch blood orders.' });
  }
};

// ─── Mark a blood order as transfused ─────────────────────────────────────────
const markTransfused = async (req, res) => {
  const hospital_id = req.user.id;
  const { id } = req.params;

  try {
    const order = await prisma.bloodOrder.findFirst({ where: { id, hospital_id } });
    if (!order) return res.status(404).json({ error: 'Blood order not found.' });

    const updated = await prisma.bloodOrder.update({
      where: { id },
      data: {
        status: 'transfused',
        transfused_at: new Date(),
      },
    });
    res.json(updated);
  } catch (err) {
    console.error('[HMS] markTransfused error:', err);
    res.status(500).json({ error: 'Failed to mark order as transfused.' });
  }
};

// ─── Cancel a pending blood order ────────────────────────────────────────────
const cancelBloodOrder = async (req, res) => {
  const hospital_id = req.user.id;
  const { id } = req.params;

  try {
    const order = await prisma.bloodOrder.findFirst({ where: { id, hospital_id } });
    if (!order) return res.status(404).json({ error: 'Blood order not found.' });
    if (['transfused', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ error: `Cannot cancel an order with status "${order.status}".` });
    }

    const updated = await prisma.bloodOrder.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    // Also cancel the linked requisition if still pending
    if (order.requisition_id) {
      await prisma.hospitalRequest.updateMany({
        where: { id: order.requisition_id, status: 'pending' },
        data: { status: 'cancelled' },
      });
    }

    res.json(updated);
  } catch (err) {
    console.error('[HMS] cancelBloodOrder error:', err);
    res.status(500).json({ error: 'Failed to cancel blood order.' });
  }
};

module.exports = {
  admitPatient,
  getPatients,
  getPatientById,
  dischargePatient,
  createBloodOrder,
  getBloodOrders,
  markTransfused,
  cancelBloodOrder,
};
