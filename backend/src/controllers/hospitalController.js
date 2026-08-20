const { mainDb, labDb } = require("../config/prisma");

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

// Emergency patient medical history lookup: Queries the independent Laboratory Database (PostgreSQL)
async function emergencyPatientLookup(req, res) {
  const { fayda_id } = req.params;

  try {
    // 1. Query the separate Laboratory database (PostgreSQL) for screening findings
    const labRecord = await labDb.labMedicalRecord.findUnique({
      where: { faydaId: fayda_id },
    });

    if (!labRecord) {
      return res.status(404).json({
        error:
          "No medical history found in Laboratory database for this patient FAYDA ID.",
      });
    }

    // 2. Fetch demographic information from the main PostgreSQL database if available
    const donorProfile = await mainDb.donor.findUnique({
      where: { fayda_id },
    });

    res.json({
      faydaId: fayda_id,
      name: labRecord.name,
      phone: labRecord.phone,
      bloodType: labRecord.bloodType,
      medicalHistory: {
        diseases: labRecord.diseases,
        hemoglobin: labRecord.hemoglobin,
        platelets: labRecord.platelets,
        allergies: labRecord.allergies,
        lastTested: labRecord.updatedAt,
        notes: labRecord.otherNotes,
      },
      demographics: donorProfile
        ? {
            gender: donorProfile.gender,
            dob: donorProfile.dob,
            address: donorProfile.address,
            healthStatus: donorProfile.health_status,
          }
        : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to query laboratory database" });
  }
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
  getInterHospitalRequests,
  createInterHospitalRequest,
  fulfillInterHospitalRequest,
  getHospitalList,
  getExpiringBags,
};
