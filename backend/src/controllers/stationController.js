const { mainDb } = require('../config/prisma');
const { logAction } = require('../utils/audit');
const { sendSMS } = require('../utils/sms');

async function lookupDonor(req, res) {
  const { id } = req.params; 
  try {
    const donor = await mainDb.donor.findFirst({
      where: {
        OR: [
          { fayda_id: id },
          { phone: id }
        ]
      }
    });

    if (!donor) {
      return res.status(200).json({
        found: false,
        message: 'Donor not found. Proceed with new donor registration procedure.'
      });
    }

    let isEligible = true;
    let daysRemaining = 0;

    if (donor.last_donation_date) {
      const lastDonation = new Date(donor.last_donation_date);
      const today = new Date();
      const diffTime = Math.abs(today - lastDonation);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 90) {
        isEligible = false;
        daysRemaining = 90 - diffDays;
      }
    }

    res.json({
      found: true,
      donor,
      eligibility: {
        is_eligible: isEligible,
        days_remaining: daysRemaining,
        message: isEligible
          ? 'Returning donor is eligible. Proceed to blood sample collection.'
          : `Ineligible. Must wait ${daysRemaining} more days before donating again.`
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to look up donor details' });
  }
}

async function registerDonorEvent(req, res) {
  const { fayda_id, name, phone, dob, gender, address, blood_type, is_returning } = req.body;

  if (is_returning && !fayda_id) {
    return res.status(400).json({ error: 'FAYDA ID is required for returning donors' });
  }

  try {
    let donor;

    if (is_returning) {
      // Returning donor procedure: Verify donor exists and is eligible
      const existingDonor = await mainDb.donor.findUnique({ where: { fayda_id } });
      if (!existingDonor) {
        return res.status(404).json({ error: 'Returning donor not found. Register as new donor.' });
      }

      
      if (existingDonor.last_donation_date) {
        const lastDonation = new Date(existingDonor.last_donation_date);
        const today = new Date();
        const diffDays = Math.ceil(Math.abs(today - lastDonation) / (1000 * 60 * 60 * 24));
        if (diffDays < 90) {
          return res.status(400).json({ error: `Donor is ineligible. Must wait ${90 - diffDays} more days.` });
        }
      }

      
      donor = await mainDb.donor.update({
        where: { fayda_id },
        data: {
          last_donation_date: new Date(),
          health_status: 'unknown'
        }
      });
    } else {
      // New donor procedure: Require all details from scratch
      if (!name || !phone || !dob || !gender || !address || !blood_type) {
        return res.status(400).json({ error: 'All donor fields are required for new registration' });
      }

      // Check if phone number is already registered
      const phoneExists = await mainDb.donor.findFirst({
        where: { phone }
      });

      if (phoneExists) {
        return res.status(400).json({ error: 'A donor with this Phone already exists' });
      }

      // Auto-assign sequential FAYDA ID (ET-XXX) by finding the highest previous number and incrementing
      const donors = await mainDb.donor.findMany({
        select: { fayda_id: true }
      });

      let maxNumber = 0;
      donors.forEach(d => {
        if (d.fayda_id && d.fayda_id.startsWith('ET-')) {
          const numPart = d.fayda_id.replace('ET-', '');
          const num = parseInt(numPart, 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      });

      const nextNumber = maxNumber + 1;
      const finalFaydaId = `ET-${String(nextNumber).padStart(3, '0')}`;

      donor = await mainDb.donor.create({
        data: {
          fayda_id: finalFaydaId,
          name,
          phone,
          dob: new Date(dob),
          gender,
          address,
          blood_type,
          last_donation_date: new Date(),
          health_status: 'unknown',
          points: 0
        }
      });
    }

    await logAction(
      req.user.id,
      is_returning ? 'DONOR_VALIDATED' : 'DONOR_REGISTERED',
      `Donor ${donor.name} (${donor.fayda_id}) processed by station.`
    );
 
    res.json({
      message: is_returning ? 'Returning donor validated' : 'New donor registered successfully',
      donor
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process donor registration event' });
  }
}

async function createBloodSample(req, res) {
  const { fayda_id, blood_type, lab_id, health_notes } = req.body;
  if (!fayda_id || !blood_type || !lab_id) {
    return res.status(400).json({ error: 'FAYDA ID, Blood Type, and Laboratory selection are required' });
  }

  try {
    const donor = await mainDb.donor.findUnique({ where: { fayda_id } });
    if (!donor) {
      return res.status(404).json({ error: 'Donor profile not found in database.' });
    }

    const sample = await mainDb.bloodSample.create({
      data: {
        fayda_id,
        blood_type,
        status: 'pending_lab',
        station_id: req.user.id,
        lab_id,
        health_notes: health_notes || null
      }
    });

    // Send thank you SMS for donation
    const smsMessage = `Thank you, ${donor.name}! We have successfully received your blood donation at our station. Your sample is now being routed to the laboratory for screening. - Blood Bank Hub`;
    await sendSMS(donor.phone, smsMessage, sample.id, 'initial');

    await logAction(
      req.user.id,
      'BLOOD_SAMPLE_COLLECTED',
      `Collected blood sample ${sample.id} for donor ${donor.name} (${donor.fayda_id}) and routed to lab ${lab_id}.`
    );
 
    res.status(201).json({
      message: 'Blood sample logged and routed to laboratory',
      sample
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log blood sample' });
  }
}


async function getStationSamples(req, res) {
  try {
    const samples = await mainDb.bloodSample.findMany({
      where: { station_id: req.user.id },
      include: {
        donor: { select: { name: true } },
        lab: { select: { entity_name: true } }
      },
      orderBy: { collected_at: 'desc' }
    });

    // Format fields to match what frontend expects
    const formatted = samples.map(s => ({
      ...s,
      donor_name: s.donor.name,
      lab_name: s.lab ? s.lab.entity_name : 'Unassigned'
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch station blood samples' });
  }
}

async function getApprovedLabs(req, res) {
  try {
    const labs = await mainDb.user.findMany({
      where: {
        role: 'laboratory',
        status: 'approved'
      },
      select: {
        id: true,
        entity_name: true
      }
    });
    res.json(labs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch approved laboratories' });
  }
}

module.exports = {
  lookupDonor,
  registerDonorEvent,
  createBloodSample,
  getStationSamples,
  getApprovedLabs,
};
