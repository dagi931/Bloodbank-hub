const { mainDb, labDb } = require("../../config/prisma");
const { logAction } = require('../../shared/services/audit.service');

// ─── In-memory rate limiter (per hospital user ID) ────────────────────────────
// Allows at most LOOKUP_LIMIT lookups per LOOKUP_WINDOW_MS per account.
const LOOKUP_LIMIT = 10;
const LOOKUP_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const lookupBuckets = new Map(); // userId → { count, windowStart }

function checkRateLimit(userId) {
  const now = Date.now();
  const bucket = lookupBuckets.get(userId);
  if (!bucket || now - bucket.windowStart > LOOKUP_WINDOW_MS) {
    lookupBuckets.set(userId, { count: 1, windowStart: now });
    return true; // allowed
  }
  if (bucket.count >= LOOKUP_LIMIT) return false; // blocked
  bucket.count += 1;
  return true;
}

// ─── Shared helper: derive eligibility from health_status + donation interval ─
const DONATION_INTERVAL_DAYS = 90;
function deriveEligibility(donor) {
  if (donor.health_status === 'defective') {
    return { status: 'Permanently Deferred', reason: 'Health record flagged by laboratory' };
  }
  if (donor.last_donation_date) {
    const daysSince = Math.floor(
      (Date.now() - new Date(donor.last_donation_date).getTime()) / 86400000
    );
    if (daysSince < DONATION_INTERVAL_DAYS) {
      return {
        status: 'Temporarily Deferred',
        reason: `Last donation ${daysSince} days ago — ${DONATION_INTERVAL_DAYS - daysSince} days remaining`,
      };
    }
  }
  return { status: 'Eligible', reason: null };
}

// ─── Shared helper: build the public summary card from donor + samples ─────────
const SCREENING_VALIDITY_DAYS = 180;
async function buildSummaryCard(donor) {
  // Most recent validated (or any) blood sample for this donor
  const latestSample = await mainDb.bloodSample.findFirst({
    where: { fayda_id: donor.fayda_id },
    orderBy: { collected_at: 'desc' },
    select: { status: true, health_notes: true, collected_at: true },
  });

  // Lab medical record (separate DB)
  let labRecord = null;
  try {
    labRecord = await labDb.labMedicalRecord.findUnique({
      where: { faydaId: donor.fayda_id },
    });
  } catch (_) {
    // Lab DB may be unreachable — degrade gracefully
  }

  const eligibility = deriveEligibility(donor);

  // Screening status — generic flag only
  let screeningStatus = 'No Screening on File';
  let screeningOutdated = false;
  if (latestSample) {
    const daysSince = Math.floor(
      (Date.now() - new Date(latestSample.collected_at).getTime()) / 86400000
    );
    screeningOutdated = daysSince > SCREENING_VALIDITY_DAYS;
    screeningStatus =
      latestSample.status === 'validated'
        ? 'Cleared'
        : latestSample.status === 'discarded'
        ? 'Requires Review'
        : 'Pending';
  } else if (labRecord) {
    screeningStatus = 'Cleared'; // lab record exists = was cleared at some point
    const daysSince = Math.floor(
      (Date.now() - new Date(labRecord.updatedAt).getTime()) / 86400000
    );
    screeningOutdated = daysSince > SCREENING_VALIDITY_DAYS;
  }

  // Age from DOB
  const dob = donor.dob ? new Date(donor.dob) : null;
  const age = dob
    ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 86400000))
    : null;

  // Mask phone: show first 4 digits + bullets
  const maskedPhone = donor.phone
    ? donor.phone.replace(/(\+?\d{4})\d+(\d{2})/, '$1•••••$2')
    : null;

  return {
    fayda_id: donor.fayda_id,
    name: donor.name,
    dob: dob ? dob.toISOString().split('T')[0] : null,
    age,
    gender: donor.gender,
    blood_type: donor.blood_type,
    address: donor.address,
    phone_masked: maskedPhone,
    last_donation_date: donor.last_donation_date || null,
    eligibility,
    screening: {
      status: screeningStatus,
      outdated: screeningOutdated,
      last_updated: latestSample?.collected_at || labRecord?.updatedAt || null,
    },
    has_lab_record: !!labRecord,
    has_donation_history: !!latestSample,
  };
}

// Get this hospital's internal stock levels
async function getHospitalStock(req, res) {
  try {
    const stock = await mainDb.hospitalStock.findMany({
      where: { hospital_id: req.user.id },
      select: {
        blood_type: true,
        quantity: true,
      },
    });

    res.json(stock);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch hospital stock levels" });
  }
}

// Get central warehouse inventory levels (so hospital knows if central has stock)
async function getWarehouseStockLevels(req, res) {
  try {
    const levels = await mainDb.warehouseStock.groupBy({
      by: ["blood_type"],
      _sum: { quantity: true },
    });

    const formatted = levels.map((l) => ({
      blood_type: l.blood_type,
      quantity: l._sum.quantity || 0,
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch warehouse stock levels" });
  }
}

// Submit a blood requisition order to the central blood bank
async function submitRequisition(req, res) {
  const { blood_type, units_needed } = req.body;
  if (!blood_type || !units_needed) {
    return res
      .status(400)
      .json({ error: "Blood Type and Units needed are required" });
  }

  try {
    const order = await mainDb.hospitalRequest.create({
      data: {
        hospital_id: req.user.id,
        blood_type,
        units_needed: parseInt(units_needed),
        status: "pending",
      },
    });

    // Emit real-time WebSocket notification
    const io = req.app.get("io");
    if (io) {
      io.emit("requisition_updated", {
        type: "CREATE",
        request: {
          id: order.id,
          hospital_name: req.user.entity_name || "Hospital",
          blood_type: order.blood_type,
          units_needed: order.units_needed,
          created_at: order.created_at,
        },
      });
    }

    res.status(201).json({
      message: "Blood requisition submitted to Central Inventory",
      order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit blood request" });
  }
}

// Get requisition logs submitted by this hospital
async function getRequisitions(req, res) {
  try {
    const requests = await mainDb.hospitalRequest.findMany({
      where: { hospital_id: req.user.id },
      orderBy: { created_at: "desc" },
    });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch requisitions log" });
  }
}

// ─── ENDPOINT: Search by FAYDA National ID (exact match) ─────────────────────
async function patientLookupByFaydaId(req, res) {
  const { nationalId } = req.query;
  if (!nationalId || !nationalId.trim()) {
    return res.status(400).json({ error: 'nationalId query parameter is required' });
  }

  if (!checkRateLimit(req.user.id)) {
    return res.status(429).json({
      error: 'Too many lookups. Please wait before searching again.',
    });
  }

  try {
    const donor = await mainDb.donor.findUnique({
      where: { fayda_id: nationalId.trim() },
    });

    await logAction(
      req.user.id,
      'PATIENT_LOOKUP_FAYDA',
      JSON.stringify({ searched_fayda: nationalId.trim(), found: !!donor }),
      req.ip
    );

    if (!donor) {
      return res.json({ found: false, message: 'No donor record found for this FAYDA ID.' });
    }

    return res.json({ found: true, results: [{ fayda_id: donor.fayda_id, name: donor.name, dob: donor.dob, gender: donor.gender, blood_type: donor.blood_type }] });
  } catch (err) {
    console.error('[PATIENT_LOOKUP_FAYDA]', err);
    res.status(500).json({ error: 'Lookup failed. Please try again.' });
  }
}

// ─── ENDPOINT: Search by Full Name (partial, case-insensitive) ────────────────
async function patientLookupByName(req, res) {
  const { fullName } = req.query;
  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ error: 'fullName query parameter is required' });
  }

  if (!checkRateLimit(req.user.id)) {
    return res.status(429).json({
      error: 'Too many lookups. Please wait before searching again.',
    });
  }

  try {
    const donors = await mainDb.donor.findMany({
      where: {
        name: { contains: fullName.trim(), mode: 'insensitive' },
      },
      select: {
        fayda_id: true,
        name: true,
        dob: true,
        gender: true,
        blood_type: true,
      },
      take: 20,
    });

    // Mask the fayda_id in the disambiguation list
    const masked = donors.map((d) => ({
      ...d,
      fayda_id_masked: d.fayda_id.replace(/(\w{3})\w+(\w{3})/, '$1•••$2'),
      fayda_id: d.fayda_id, // kept for selection — client must use this to fetch full record
    }));

    await logAction(
      req.user.id,
      'PATIENT_LOOKUP_NAME',
      JSON.stringify({ searched_name: fullName.trim(), results_count: donors.length }),
      req.ip
    );

    return res.json({ found: donors.length > 0, results: masked });
  } catch (err) {
    console.error('[PATIENT_LOOKUP_NAME]', err);
    res.status(500).json({ error: 'Lookup failed. Please try again.' });
  }
}

// ─── ENDPOINT: Full summary card for a confirmed FAYDA ID ─────────────────────
async function getPatientRecord(req, res) {
  const { faydaId } = req.params;

  if (!checkRateLimit(req.user.id)) {
    return res.status(429).json({
      error: 'Too many lookups. Please wait before searching again.',
    });
  }

  try {
    const donor = await mainDb.donor.findUnique({ where: { fayda_id: faydaId } });
    if (!donor) {
      return res.status(404).json({ error: 'No donor record found.' });
    }

    const card = await buildSummaryCard(donor);

    await logAction(
      req.user.id,
      'PATIENT_RECORD_VIEW',
      JSON.stringify({ viewed_fayda: faydaId }),
      req.ip
    );

    return res.json(card);
  } catch (err) {
    console.error('[PATIENT_RECORD_VIEW]', err);
    res.status(500).json({ error: 'Failed to load patient record.' });
  }
}

// ─── ENDPOINT: Reveal unmasked phone (audit logged separately) ────────────────
async function revealPatientPhone(req, res) {
  const { faydaId } = req.params;
  try {
    const donor = await mainDb.donor.findUnique({
      where: { fayda_id: faydaId },
      select: { phone: true, name: true },
    });
    if (!donor) return res.status(404).json({ error: 'Donor not found.' });

    await logAction(
      req.user.id,
      'PATIENT_PHONE_REVEAL',
      JSON.stringify({ revealed_fayda: faydaId, donor_name: donor.name }),
      req.ip
    );

    return res.json({ phone: donor.phone });
  } catch (err) {
    console.error('[PATIENT_PHONE_REVEAL]', err);
    res.status(500).json({ error: 'Failed to reveal phone.' });
  }
}

// ─── ENDPOINT: Reveal full screening details (audit logged separately) ────────
async function revealScreeningDetails(req, res) {
  const { faydaId } = req.params;
  try {
    let labRecord = null;
    try {
      labRecord = await labDb.labMedicalRecord.findUnique({
        where: { faydaId },
      });
    } catch (_) {}

    const latestSample = await mainDb.bloodSample.findFirst({
      where: { fayda_id: faydaId },
      orderBy: { collected_at: 'desc' },
      select: { health_notes: true, status: true, collected_at: true },
    });

    await logAction(
      req.user.id,
      'PATIENT_SCREENING_REVEAL',
      JSON.stringify({ revealed_fayda: faydaId }),
      req.ip
    );

    return res.json({
      lab: labRecord
        ? {
            diseases: labRecord.diseases,
            hemoglobin: labRecord.hemoglobin,
            platelets: labRecord.platelets,
            allergies: labRecord.allergies,
            notes: labRecord.otherNotes,
            last_updated: labRecord.updatedAt,
          }
        : null,
      sample_notes: latestSample?.health_notes || null,
    });
  } catch (err) {
    console.error('[PATIENT_SCREENING_REVEAL]', err);
    res.status(500).json({ error: 'Failed to reveal screening details.' });
  }
}

// ─── Legacy alias (kept so existing route still resolves) ─────────────────────
async function emergencyPatientLookup(req, res) {
  req.query = { nationalId: req.params.fayda_id };
  return patientLookupByFaydaId(req, res);
}

// List all active inter-hospital requests
async function getInterHospitalRequests(req, res) {
  try {
    const requests = await mainDb.hospitalInterRequest.findMany({
      where: {
        status: "pending",
        NOT: { requester_id: req.user.id }, // exclude self-created requests
      },
      include: {
        requester: { select: { entity_name: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const formatted = requests.map((r) => ({
      ...r,
      requester_name: r.requester.entity_name,
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to retrieve inter-hospital request board" });
  }
}
// Submit a hospital-to-hospital blood request
async function createInterHospitalRequest(req, res) {
  const { blood_type, units_needed, receiver_id } = req.body;

  if (!blood_type || !units_needed) {
    return res
      .status(400)
      .json({ error: "Blood Type and Units needed are required" });
  }

  try {
    const interRequest = await mainDb.hospitalInterRequest.create({
      data: {
        requester_id: req.user.id,
        receiver_id: receiver_id || null, // null means broadcasted to all hospitals
        blood_type,
        units_needed: parseInt(units_needed),
        status: "pending",
      },
    });

    // Emit real-time WebSocket notification
    const io = req.app.get("io");
    if (io) {
      io.emit("h2h_updated", {
        type: "CREATE",
        request: {
          id: interRequest.id,
          requester_id: interRequest.requester_id,
          requester_name: req.user.entity_name,
          blood_type: interRequest.blood_type,
          units_needed: interRequest.units_needed,
          created_at: interRequest.created_at,
        },
      });
    }

    res.status(201).json({
      message: "Inter-hospital request posted successfully",
      request: interRequest,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to post inter-hospital request" });
  }
}
// Fulfill inter-hospital request (transfers blood stock directly between hospitals)
async function fulfillInterHospitalRequest(req, res) {
  const { id } = req.params;

  try {
    const request = await mainDb.hospitalInterRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return res
        .status(404)
        .json({ error: "Inter-hospital request not found" });
    }

    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ error: `Request has already been ${request.status}` });
    }

    // Verify fulfiller has enough stock
    const fulfillerStock = await mainDb.hospitalStock.findUnique({
      where: {
        hospital_id_blood_type: {
          hospital_id: req.user.id,
          blood_type: request.blood_type,
        },
      },
    });

    const availableQty = fulfillerStock ? fulfillerStock.quantity : 0;
    if (availableQty < request.units_needed) {
      return res.status(400).json({
        error: `Insufficient inventory in your hospital. Available: ${availableQty} units of ${request.blood_type}`,
      });
    }

    // Execute direct transfer transaction
    await mainDb.$transaction(async (tx) => {
      // 1. Decrement fulfiller stock
      await tx.hospitalStock.update({
        where: {
          hospital_id_blood_type: {
            hospital_id: req.user.id,
            blood_type: request.blood_type,
          },
        },
        data: {
          quantity: { decrement: request.units_needed },
        },
      });

      // 2. Increment requester stock
      await tx.hospitalStock.upsert({
        where: {
          hospital_id_blood_type: {
            hospital_id: request.requester_id,
            blood_type: request.blood_type,
          },
        },
        update: {
          quantity: { increment: request.units_needed },
        },
        create: {
          hospital_id: request.requester_id,
          blood_type: request.blood_type,
          quantity: request.units_needed,
        },
      });

      // Find oldest samples of the requested blood type currently in the fulfilling hospital
      const transferSamples = await tx.bloodSample.findMany({
        where: {
          blood_type: request.blood_type,
          status: "validated",
          hospital_id: req.user.id,
        },
        orderBy: {
          collected_at: "asc",
        },
        take: request.units_needed,
      });

      if (transferSamples.length > 0) {
        const sampleIds = transferSamples.map((s) => s.id);
        await tx.bloodSample.updateMany({
          where: {
            id: { in: sampleIds },
          },
          data: {
            hospital_id: request.requester_id,
          },
        });
      }

      // 3. Mark request as fulfilled and log the fulfiller id
      await tx.hospitalInterRequest.update({
        where: { id },
        data: {
          status: "fulfilled",
          receiver_id: req.user.id,
        },
      });
    });

    // Emit real-time WebSocket notification
    const io = req.app.get("io");
    if (io) {
      io.emit("h2h_updated", {
        type: "FULFILL",
        requestId: id,
        fulfiller_name: req.user.entity_name,
      });
    }

    res.json({
      message: "Inter-hospital blood transfer successful. Inventory updated.",
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to process inter-hospital fulfillment" });
  }
}

// List other approved hospitals (excluding self)
async function getHospitalList(req, res) {
  try {
    const hospitals = await mainDb.user.findMany({
      where: {
        role: "hospital",
        status: "approved",
        NOT: { id: req.user.id },
      },
      select: {
        id: true,
        entity_name: true,
      },
    });
    res.json(hospitals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve hospitals list" });
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
        status: "validated",
        hospital_id: req.user.id,
        collected_at: {
          lte: thirtyDaysAgo,
          gte: thirtyFiveDaysAgo,
        },
      },
      orderBy: { collected_at: "asc" },
    });

    res.json(expiring);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to retrieve expiring hospital blood bags" });
  }
}
module.exports = {
  getHospitalStock,
  getWarehouseStockLevels,
  submitRequisition,
  getRequisitions,
  emergencyPatientLookup,
  patientLookupByFaydaId,
  patientLookupByName,
  getPatientRecord,
  revealPatientPhone,
  revealScreeningDetails,
  getInterHospitalRequests,
  createInterHospitalRequest,
  fulfillInterHospitalRequest,
  getHospitalList,
  getExpiringBags,
};
