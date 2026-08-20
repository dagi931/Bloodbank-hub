import React, { useState, useEffect } from 'react';
import { Heart, Clock, History, Gift, Award, Megaphone, CheckCircle2, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import Leaderboard from '../../components/common/Leaderboard';
import Announcements from '../../components/common/Announcements';

export default function DonorDashboard({ activeTab, setActiveTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  // Real-time countdown state
  const [countdownText, setCountdownText] = useState('');
  const [isEligibleNow, setIsEligibleNow] = useState(true);

  // Appointments states
  const [appointments, setAppointments] = useState([]);
  const [stations, setStations] = useState([]);
  const [bookingStationId, setBookingStationId] = useState('');
  const [bookingDateTime, setBookingDateTime] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState(null);

  const loadAppointments = async () => {
    try {
      const appts = await api.donor.getAppointments();
      setAppointments(appts);
      const stats = await api.donor.getStations();
      setStations(stats);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'appointments') {
      loadAppointments();
    }
  }, [activeTab]);

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!bookingStationId || !bookingDateTime) {
      setBookingError('Please select both a donation station and a schedule slot.');
      return;
    }
    setBookingLoading(true);
    setBookingError(null);
    setBookingSuccess(null);
    try {
      const res = await api.donor.bookAppointment(bookingStationId, bookingDateTime);
      setBookingSuccess(res.message || 'Appointment scheduled successfully!');
      setBookingStationId('');
      setBookingDateTime('');
      await loadAppointments();
    } catch (err) {
      setBookingError(err.message || 'Failed to book slot.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = async (apptId) => {
    try {
      await api.donor.cancelAppointment(apptId);
      await loadAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const loadDashboardData = async () => {
    try {
      const dashboardInfo = await api.donor.getDashboardInfo();
      setData(dashboardInfo);
      setIsEligibleNow(dashboardInfo.eligibility.is_eligible);
    } catch (err) {
      setError(err.message || 'Failed to load donor dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!data || !data.eligibility || data.eligibility.is_eligible || !data.eligibility.next_donation_date) {
      setIsEligibleNow(true);
      return;
    }

    const nextDate = new Date(data.eligibility.next_donation_date);
    setIsEligibleNow(false);

    const updateCountdown = () => {
      const now = new Date();
      const diff = nextDate - now;

      if (diff <= 0) {
        setIsEligibleNow(true);
        setCountdownText('You are eligible to donate blood today!');
        clearInterval(intervalId);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setCountdownText(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [data]);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Loading donor workspace dashboard...</div>;
  }

  if (error || !data) {
    return (
      <div className="glass-card" style={{ background: 'rgba(239,35,60,0.1)', color: '#ef233c', padding: '20px' }}>
        {error || 'Profile details unavailable.'}
      </div>
    );
  }

  const { donor, history, leaderboard, announcements } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Donor stats cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        
        {/* Donor Profile Detail Card */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Donor Profile</h4>
            <Heart size={16} color="var(--primary)" fill="var(--primary)" />
          </div>
          <h3 style={{ fontSize: '1.2rem', margin: '0 0 6px 0' }}>{donor.name}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>Phone: {donor.phone}</p>
          <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem' }}>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '4px' }}>Blood Type: <strong>{donor.blood_type}</strong></span>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '4px' }}>ID: <strong>{donor.fayda_id}</strong></span>
          </div>
        </div>

        {/* Real-time Eligibility Countdown Clock */}
        <div className="glass-card" style={{ borderLeft: isEligibleNow ? '4px solid #06d6a0' : '4px solid #ffb703' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Next Donation Eligibility</h4>
            <Clock size={16} color={isEligibleNow ? '#06d6a0' : '#ffb703'} />
          </div>
          {isEligibleNow ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#06d6a0', fontWeight: 'bold' }}>
                <CheckCircle2 size={18} /> Eligible to Donate
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                You have fulfilled the 3-month deferral safety window. Please visit a donation station.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffb703', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                {countdownText || 'Calculating...'}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Next eligible date: {new Date(data.eligibility.next_donation_date).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Points Rewards Accumulator Card */}
        <div className="glass-card" style={{ borderLeft: '4px solid #8338ec' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Donor Reward Points</h4>
            <Gift size={16} color="#8338ec" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#8338ec' }}>{donor.points}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>points</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
            Earn 100 points for every validated blood donation. Rank up on the leaderboard!
          </p>
        </div>

      </div>

      {/* Tab contents */}
      <div className="animate-fade-in">
        {activeTab === 'history' && (
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Donation Record Book</h3>
            {history.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>You haven't logged any donations in this portal yet.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Donation Date</th>
                      <th>Blood Type</th>
                      <th>Workstation Station</th>
                      <th>Screening Status</th>
                      <th>Lab Clinical Findings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(h => (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 600 }}>{new Date(h.collected_at).toLocaleDateString()}</td>
                        <td>
                          <span className="badge-blood-type">{h.blood_type}</span>
                        </td>
                        <td>{h.station_name}</td>
                        <td>
                          <span className={`badge badge-${h.status}`}>
                            {h.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: h.status === 'discarded' ? '#ef233c' : 'var(--text-secondary)' }}>
                          {h.health_notes || 'Pending screening check'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'announcements' && (
          <Announcements data={announcements} />
        )}

        {activeTab === 'leaderboard' && (
          <Leaderboard data={leaderboard} />
        )}

        {activeTab === 'appointments' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
            {/* Booking Form Card */}
            <div className="glass-card" style={{ borderTop: '4px solid var(--primary)' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Schedule Donation Slot</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
                Pick an approved blood bank collection station, select your preferred date and time, and secure your reservation to avoid waiting lines.
              </p>

              {bookingError && (
                <div style={{ background: 'rgba(239,35,60,0.1)', color: '#ef233c', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239,35,60,0.2)', marginBottom: '16px', fontSize: '0.85rem' }}>
                  {bookingError}
                </div>
              )}

              {bookingSuccess && (
                <div style={{ background: 'rgba(6,214,160,0.1)', color: '#06d6a0', padding: '12px', borderRadius: '8px', border: '1px solid rgba(6,214,160,0.2)', marginBottom: '16px', fontSize: '0.85rem' }}>
                  {bookingSuccess}
                </div>
              )}

              <form onSubmit={handleBookAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Select Collection Station</label>
                  <select 
                    value={bookingStationId}
                    onChange={(e) => setBookingStationId(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff' }}
                  >
                    <option value="" style={{ background: '#1c1e21' }}>-- Select a station --</option>
                    {stations.map(station => (
                      <option key={station.id} value={station.id} style={{ background: '#1c1e21' }}>
                        {station.entity_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Date & Time</label>
                  <input 
                    type="datetime-local"
                    value={bookingDateTime}
                    onChange={(e) => setBookingDateTime(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff' }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={bookingLoading || !isEligibleNow}
                  style={{ marginTop: '10px', opacity: isEligibleNow ? 1 : 0.6 }}
                >
                  {bookingLoading ? 'Scheduling...' : isEligibleNow ? 'Book Appointment Slot' : 'Not Eligible to Donate Yet'}
                </button>
              </form>
            </div>

            {/* Appointments List Card */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Your Scheduled Slots</h3>
              {appointments.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No scheduled slots. Pick a time and book above!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {appointments.map(appt => (
                    <div 
                      key={appt.id}
                      style={{ 
                        background: 'rgba(255,255,255,0.01)', 
                        border: '1px solid rgba(255,255,255,0.05)', 
                        borderRadius: '8px', 
                        padding: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 600 }}>{appt.station?.entity_name}</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          🗓️ {new Date(appt.date_time).toLocaleString()}
                        </p>
                        <span 
                          className="badge" 
                          style={{ 
                            marginTop: '8px',
                            display: 'inline-block',
                            fontSize: '0.7rem',
                            background: appt.status === 'scheduled' ? 'rgba(6,214,160,0.1)' : 'rgba(255,255,255,0.05)',
                            color: appt.status === 'scheduled' ? '#06d6a0' : 'var(--text-muted)'
                          }}
                        >
                          {appt.status.toUpperCase()}
                        </span>
                      </div>
                      
                      {appt.status === 'scheduled' && (
                        <button 
                          onClick={() => handleCancelAppointment(appt.id)}
                          className="btn"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(239,35,60,0.1)', color: '#ef233c', border: '1px solid rgba(239,35,60,0.2)' }}
                        >
                          Cancel Slot
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
