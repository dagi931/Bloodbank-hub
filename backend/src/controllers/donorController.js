const { mainDb } = require('../config/prisma');
async function getDonorDashboardInfo(req, res) {
  try {
    
    const donor = await mainDb.donor.findUnique({
      where: { user_id: req.user.id }
    });

    if (!donor) {
      return res.status(404).json({ error: 'Donor profile not found for this user.' });
    }

   
    const history = await mainDb.bloodSample.findMany({
      where: { fayda_id: donor.fayda_id },
      include: {
        station: { select: { entity_name: true } },
        lab: { select: { entity_name: true } }
      },
      orderBy: { collected_at: 'desc' }
    });

    const formattedHistory = history.map(h => ({
      id: h.id,
      collected_at: h.collected_at,
      blood_type: h.blood_type,
      status: h.status,
      health_notes: h.health_notes,
      station_name: h.station.entity_name,
      lab_name: h.lab ? h.lab.entity_name : 'Pending Screen'
    }));

    // 3. Fetch top 10 leaderboard (ordered by points descending)
    const leaderboard = await mainDb.donor.findMany({
      take: 10,
      select: {
        fayda_id: true,
        name: true,
        blood_type: true,
        points: true,
       
        _count: {
          select: { bloodSamples: true }
        }
      },
      orderBy: [
        { points: 'desc' },
        { fayda_id: 'asc' }
      ]
    });

    const formattedLeaderboard = leaderboard.map((d, index) => ({
      rank: index + 1,
      name: d.name,
      blood_type: d.blood_type,
      points: d.points,
      total_donations: d._count.bloodSamples
    }));


    const announcements = await mainDb.announcement.findMany({
      include: {
        warehouse: { select: { entity_name: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    const formattedAnnouncements = announcements.map(a => ({
      id: a.id,
      title: a.title,
      content: a.content,
      type: a.type,
      station_location: a.station_location,
      start_date: a.start_date,
      end_date: a.end_date,
      created_at: a.created_at,
      publisher: a.warehouse.entity_name
    }));

    //  Calculate eligibility countdown
    let isEligible = true;
    let daysRemaining = 0;
    let nextDonationDate = null;

    if (donor.last_donation_date) {
      const lastDonation = new Date(donor.last_donation_date);
      // Next donation date is exactly 90 days (3 months) later
      const nextDate = new Date(lastDonation.getTime() + 90 * 24 * 60 * 60 * 1000);
      const today = new Date();
      nextDonationDate = nextDate;

      if (today < nextDate) {
        isEligible = false;
        const diffTime = nextDate - today;
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    res.json({
      donor: {
        fayda_id: donor.fayda_id,
        name: donor.name,
        phone: donor.phone,
        dob: donor.dob,
        gender: donor.gender,
        address: donor.address,
        blood_type: donor.blood_type,
        points: donor.points,
        last_donation_date: donor.last_donation_date
      },
      history: formattedHistory,
      leaderboard: formattedLeaderboard,
      announcements: formattedAnnouncements,
      eligibility: {
        is_eligible: isEligible,
        days_remaining: daysRemaining,
        next_donation_date: nextDonationDate
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compile donor dashboard information' });
  }
}

// Book appointment
async function bookAppointment(req, res) {
  const { station_id, date_time } = req.body;
  if (!station_id || !date_time) {
    return res.status(400).json({ error: 'Station ID and Date Time are required' });
  }
  try {
    const donor = await mainDb.donor.findUnique({
      where: { user_id: req.user.id }
    });
    if (!donor) {
      return res.status(404).json({ error: 'Donor profile not found. Please complete registration first.' });
    }

    const apptTime = new Date(date_time);
    const bufferMin = 30;
    const startRange = new Date(apptTime.getTime() - bufferMin * 60 * 1000);
    const endRange = new Date(apptTime.getTime() + bufferMin * 60 * 1000);

    const existingAppt = await mainDb.appointment.findFirst({
      where: {
        station_id,
        date_time: {
          gte: startRange,
          lte: endRange
        },
        status: 'scheduled'
      }
    });

    if (existingAppt) {
      return res.status(400).json({ error: 'This time slot is already booked at this station. Please choose another time.' });
    }

    const appointment = await mainDb.appointment.create({
      data: {
        donor_id: donor.fayda_id,
        station_id,
        date_time: apptTime,
        status: 'scheduled'
      }
    });

    res.status(201).json({ message: 'Appointment scheduled successfully', appointment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
}

// Retrieve donor's scheduled appointments
async function getAppointments(req, res) {
  try {
    const donor = await mainDb.donor.findUnique({
      where: { user_id: req.user.id }
    });
    if (!donor) {
      return res.status(404).json({ error: 'Donor profile not found.' });
    }

    const appointments = await mainDb.appointment.findMany({
      where: { donor_id: donor.fayda_id },
      include: {
        station: { select: { entity_name: true } }
      },
      orderBy: { date_time: 'asc' }
    });

    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve appointments' });
  }
}

// Cancel appointment slot
async function cancelAppointment(req, res) {
  const { id } = req.params;
  try {
    const appt = await mainDb.appointment.update({
      where: { id },
      data: { status: 'cancelled' }
    });
    res.json({ message: 'Appointment cancelled successfully', appointment: appt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
}

// Get approved donation stations list
async function getStationsList(req, res) {
  try {
    const stations = await mainDb.user.findMany({
      where: { role: 'station', status: 'approved' },
      select: { id: true, entity_name: true }
    });
    res.json(stations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve stations list' });
  }
}

module.exports = {
  getDonorDashboardInfo,
  bookAppointment,
  getAppointments,
  cancelAppointment,
  getStationsList
};
