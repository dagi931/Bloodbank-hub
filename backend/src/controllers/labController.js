const { mainDb, labDb } = require('../config/prisma');
const { sendSMS } = require('../utils/sms');
const { logAction } = require('../utils/audit');

// Get all pending samples routed to this lab
async function getPendingSamples(req, res) {
  try {
    const samples = await mainDb.bloodSample.findMany({
      where: {
        lab_id: req.user.id,
        status: 'pending_lab'
      },
      include: {
        donor: { select: { name: true, phone: true } },
        station: { select: { entity_name: true } }
      },
      orderBy: { collected_at: 'asc' }
    });

    const formatted = samples.map(s => ({
      ...s,
      donor_name: s.donor.name,
      donor_phone: s.donor.phone,
      station_name: s.station.entity_name
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pending lab samples' });
  }
}

// Get all approved warehouses
async function getWarehouses(req, res) {
  try {
    const warehouses = await mainDb.user.findMany({
      where: {
        role: 'warehouse',
        status: 'approved'
      },
      select: {
        id: true,
        entity_name: true
      }
    });
    res.json(warehouses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
}

// Submit test results: updates Postgres inventory AND writes medical records to PostgreSQL Laboratory DB
async function submitTestResult(req, res) {
  const { id } = req.params;
  const {
    status,
    warehouse_id,
    health_notes,
    hemoglobin,
    platelets,
    allergies,
    diseases,
    blood_type
  } = req.body;

  if (!['validated', 'discarded'].includes(status)) {
    return res.status(400).json({ error: 'Invalid validation status' });
  }
  if (status === 'validated' && !warehouse_id) {
    return res.status(400).json({ error: 'Destination Warehouse is required for validated blood' });
  }
  if (status === 'validated' && (!blood_type || blood_type === 'UNKNOWN')) {
    return res.status(400).json({ error: 'A valid tested blood type is required to validate the sample' });
  }

  try {
    // 1. Fetch sample details from main database
    const sample = await mainDb.bloodSample.findUnique({
      where: { id },
      include: { donor: true }
    });

    if (!sample) {
      return res.status(404).json({ error: 'Blood sample not found' });
    }
    if (sample.status !== 'pending_lab') {
      return res.status(400).json({ error: 'Sample has already been screened' });
    }

    const finalBloodType = blood_type || sample.blood_type || 'UNKNOWN';

    const defaultDiseases = status === 'validated'
      ? 'HIV: Negative, Syphilis: Negative, Hepatitis: Negative'
      : `Defective. Detected: ${health_notes || 'Abnormal clinical markers'}`;

    // 2. Transaction on main database
    await mainDb.$transaction(async (tx) => {
      // A. Update blood sample status
      await tx.bloodSample.update({
        where: { id },
        data: {
          status,
          health_notes: health_notes || null,
          lab_id: req.user.id,
          blood_type: finalBloodType
        }
      });

      // B. Update donor profile and award points
      const donorHealth = status === 'validated' ? 'healthy' : 'defective';
      await tx.donor.update({
        where: { fayda_id: sample.fayda_id },
        data: {
          health_status: donorHealth,
          blood_type: finalBloodType,
          points: {
            increment: status === 'validated' ? 100 : 0
          }
        }
      });

      // C. Update warehouse inventory stock
      if (status === 'validated') {
        await tx.warehouseStock.upsert({
          where: {
            warehouse_id_blood_type: {
              warehouse_id,
              blood_type: finalBloodType
            }
          },
          update: {
            quantity: { increment: 1 }
          },
          create: {
            warehouse_id,
            blood_type: finalBloodType,
            quantity: 1
          }
        });
      }
    });

    // 3. Write screening record to laboratory database
    await labDb.labMedicalRecord.upsert({
      where: { faydaId: sample.fayda_id },
      update: {
        name: sample.donor.name,
        phone: sample.donor.phone,
        bloodType: finalBloodType,
        diseases: diseases || defaultDiseases,
        hemoglobin: hemoglobin || '14.5 g/dL',
        platelets: platelets || '250,000 /mcL',
        allergies: allergies || 'None',
        otherNotes: health_notes || 'Routine screening, sample tested.',
        updatedAt: new Date()
      },
      create: {
        faydaId: sample.fayda_id,
        name: sample.donor.name,
        phone: sample.donor.phone,
        bloodType: finalBloodType,
        diseases: diseases || defaultDiseases,
        hemoglobin: hemoglobin || '14.5 g/dL',
        platelets: platelets || '250,000 /mcL',
        allergies: allergies || 'None',
        otherNotes: health_notes || 'Routine screening, sample tested.'
      }
    });

    // 4. Send SMS notification to donor
    let smsMessage = '';
    let msgType = '';

    if (status === 'validated') {
      smsMessage = `Thank you, ${sample.donor.name}! Your blood screening results are complete. Your blood type is ${finalBloodType}. You have no health issues, and your blood donation is safe and ready to save lives. We encourage you to donate again in 3 months! - Blood Bank Hub`;
      msgType = 'encouragement';
    } else {
      smsMessage = `Dear ${sample.donor.name}, your blood screening results are complete. Your blood type was tested as ${finalBloodType}. The test has indicated some health complications. Please visit our laboratory facility or a medical doctor to receive your detailed clinical results. - Blood Bank Hub`;
      msgType = 'warning';
    }

    const smsResult = await sendSMS(sample.donor.phone, smsMessage, id, msgType);

    await logAction(
      req.user.id,
      status === 'validated' ? 'BLOOD_SAMPLE_VALIDATED' : 'BLOOD_SAMPLE_DISCARDED',
      `Screened blood sample ${id} for donor ${sample.donor.name} (${sample.fayda_id}). Status: ${status}, Verified Blood Type: ${finalBloodType}.`
    );
 
    res.json({
      message: `Sample screened successfully as ${status} and logged to Laboratory Database`,
      sms: smsResult
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process laboratory test validation' });
  }
}

module.exports = {
  getPendingSamples,
  getWarehouses,
  submitTestResult
};