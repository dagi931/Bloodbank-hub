import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Package, Truck, MessageSquare, AlertTriangle, ShieldCheck, Search, PlusCircle,
  RefreshCw, Send, Check, ShieldAlert, Stethoscope, UserPlus, ClipboardList, X,
  CheckCircle, Droplet, Clock, ArrowRight, CheckCircle2, Users, Building, AlertCircle,
  Calendar, Eye, EyeOff, ShieldX, Activity, Info
} from 'lucide-react';
import { api } from '../../api';
import SelectDropdown from '../../components/ui/SelectDropdown';
import { io } from 'socket.io-client';
import BottomToast from '../../components/ui/BottomToast';

export default function HospitalDashboard({ tab = 'dashboard', setTab, isMobile }) {
  const [internalStock, setInternalStock] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [interRequests, setInterRequests] = useState([]);
  const [patientRecord, setPatientRecord] = useState(null);
  const [lookupFaydaId, setLookupFaydaId] = useState('');
  const [lookupSearched, setLookupSearched] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  // ─── Emergency Lookup tab state ──────────────────────────────────────────────
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupMode, setLookupMode] = useState('fayda'); // 'fayda' | 'name'
  const [lookupResults, setLookupResults] = useState([]); // disambiguation list
  const [lookupRecord, setLookupRecord] = useState(null); // full summary card
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMsg, setLookupMsg] = useState(null); // info/error/success message
  const [revealedPhone, setRevealedPhone] = useState(null);
  const [screeningDetails, setScreeningDetails] = useState(null);
  const [showScreeningConfirm, setShowScreeningConfirm] = useState(false);
  const [lookupRateLimited, setLookupRateLimited] = useState(false);
  // Auto-clear timer: sensitive card clears after 3 minutes of inactivity
  const autoClearTimer = useRef(null);
  const AUTO_CLEAR_SECS = 180;
  const [autoClearCountdown, setAutoClearCountdown] = useState(null);
  const countdownRef = useRef(null);

  // Form states
  const [reqBloodType, setReqBloodType] = useState('O+');
  const [reqUnits, setReqUnits] = useState(1);
  const [interBloodType, setInterBloodType] = useState('O+');
  const [interUnits, setInterUnits] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [expiringBags, setExpiringBags] = useState([]);

  // HMS State
  const [hmsPatients, setHmsPatients] = useState([]);
  const [hmsOrders, setHmsOrders] = useState([]);
  const [hmsLoading, setHmsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAdmitForm, setShowAdmitForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [admitForm, setAdmitForm] = useState({ full_name: '', age: '', gender: 'male', blood_type: 'O+', fayda_id: '', ward: 'ICU', bed_number: 'Bed 01', diagnosis: '' });
  const [orderForm, setOrderForm] = useState({ patient_id: '', blood_type: 'O+', units_needed: 1, urgency: 'routine', notes: '' });
  const [hmsFilter, setHmsFilter] = useState('admitted');
  const [orderFulfillmentMsg, setOrderFulfillmentMsg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const stock = await api.hospital.getStock();
      const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      const mappedStock = bloodTypes.map(type => {
        const found = stock?.find(s => s.blood_type === type);
        return {
          blood_type: type,
          quantity: found ? found.quantity : 0
        };
      });
      setInternalStock(mappedStock);

      const central = await api.hospital.getRequests();
      setRequisitions(central || []);

      const inter = await api.hospital.getInterHospitalRequests();
      setInterRequests(inter || []);

      const expiring = await api.hospital.getExpiringBags();
      setExpiringBags(Array.isArray(expiring) ? expiring : []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve hospital dashboard details.');
      setExpiringBags([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHmsData = async () => {
    setHmsLoading(true);
    try {
      const [patients, orders] = await Promise.all([
        api.hms.getPatients(),
        api.hms.getBloodOrders(),
      ]);
      setHmsPatients(Array.isArray(patients) ? patients : []);
      setHmsOrders(Array.isArray(orders) ? orders : []);
    } catch (err) {
      console.error('[HMS] Failed to load HMS data:', err);
    } finally {
      setHmsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  useEffect(() => {
    if (tab === 'hms' || tab === 'patients') loadHmsData();
  }, [tab]);

  // WebSockets Alert Listener
  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('h2h_updated', (data) => {
      setAlerts(prev => [
        {
          id: 'h2h-' + Date.now(),
          message: `📢 H2H Alert: A hospital requested ${data.units_needed} units of ${data.blood_type}.`
        },
        ...prev
      ]);
      loadData();
    });

    socket.on('requisition_updated', (data) => {
      const status = data.status || '';
      setAlerts(prev => [
        {
          id: 'req-' + Date.now(),
          message: `✅ Requisition Alert: Order status updated to "${status}".`
        },
        ...prev
      ]);
      loadData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Auto-dismiss notification popup after 4 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleCreateRequisition = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.hospital.createRequisition(reqBloodType, reqUnits);
      setSuccess('Central warehouse requisition order placed successfully!');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to place requisition.');
    } finally {
      setLoading(false);
    }
  };

  const handleInterHospitalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.hospital.requestInterHospital(interBloodType, interUnits);
      setSuccess('Emergency peer broadcast dispatched to regional hospitals!');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to broadcast peer request.');
    } finally {
      setLoading(false);
    }
  };

  const handleFulfillInterHospital = async (reqId) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.hospital.fulfillInterHospital(reqId);
      setSuccess('Peer hospital request fulfilled! Units transferred from your internal stock.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to fulfill peer hospital request.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdmitPatient = async (e) => {
    e.preventDefault();
    setHmsLoading(true);
    try {
      await api.hms.admitPatient(admitForm);
      setSuccess('Patient admitted successfully.');
      setShowAdmitForm(false);
      setAdmitForm({ full_name: '', age: '', gender: 'male', blood_type: 'O+', fayda_id: '', ward: 'ICU', bed_number: 'Bed 01', diagnosis: '' });
      await loadHmsData();
    } catch (err) {
      setError(err.message || 'Failed to admit patient.');
    } finally {
      setHmsLoading(false);
    }
  };

  const handleCreateBloodOrder = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setHmsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.hms.createBloodOrder({
        patient_id: selectedPatient.id,
        blood_type: orderForm.blood_type || selectedPatient.blood_type,
        units_needed: parseInt(orderForm.units_needed) || 1,
        urgency: orderForm.urgency || 'routine',
        notes: orderForm.notes || ''
      });
      setSuccess(res._message || res.message || `Blood order of ${orderForm.units_needed} units (${orderForm.blood_type || selectedPatient.blood_type}) placed for ${selectedPatient.full_name}.`);
      setShowOrderForm(false);
      setSelectedPatient(null);
      setOrderForm({ patient_id: '', blood_type: 'O+', units_needed: 1, urgency: 'routine', notes: '' });
      await loadHmsData();
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to submit blood order.');
    } finally {
      setHmsLoading(false);
    }
  };

  const handleDischargePatient = async (patientId) => {
    setHmsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.hms.dischargePatient(patientId);
      setSuccess('Patient discharged successfully.');
      await loadHmsData();
    } catch (err) {
      setError(err.message || 'Failed to discharge patient.');
    } finally {
      setHmsLoading(false);
    }
  };

  // ─── Emergency Lookup handlers ───────────────────────────────────────────────
  const resetAutoClear = useCallback(() => {
    if (autoClearTimer.current) clearTimeout(autoClearTimer.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setAutoClearCountdown(AUTO_CLEAR_SECS);
    let remaining = AUTO_CLEAR_SECS;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setAutoClearCountdown(remaining);
      if (remaining <= 0) clearInterval(countdownRef.current);
    }, 1000);
    autoClearTimer.current = setTimeout(() => {
      setLookupRecord(null);
      setRevealedPhone(null);
      setScreeningDetails(null);
      setAutoClearCountdown(null);
    }, AUTO_CLEAR_SECS * 1000);
  }, []);

  // Clear auto-timer when leaving lookup tab
  useEffect(() => {
    if (tab !== 'lookup') {
      if (autoClearTimer.current) clearTimeout(autoClearTimer.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setAutoClearCountdown(null);
    }
  }, [tab]);

  const handlePatientLookup = async (e) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    setLookupLoading(true);
    setLookupMsg(null);
    setLookupResults([]);
    setLookupRecord(null);
    setRevealedPhone(null);
    setScreeningDetails(null);
    setLookupRateLimited(false);
    try {
      let res;
      if (lookupMode === 'fayda') {
        res = await api.hospital.patientLookupByNationalId(lookupQuery.trim());
      } else {
        res = await api.hospital.patientLookupByName(lookupQuery.trim());
      }
      if (!res.found || !res.results?.length) {
        setLookupMsg({ type: 'notfound', text: res.message || 'No records found matching your search.' });
      } else if (res.results.length === 1) {
        // Skip disambiguation — go straight to full record
        await handleSelectRecord(res.results[0].fayda_id);
      } else {
        setLookupResults(res.results);
        setLookupMsg({ type: 'info', text: `${res.results.length} records match. Select the correct patient below.` });
      }
    } catch (err) {
      if (err.message?.includes('Too many lookups') || err.message?.includes('429')) {
        setLookupRateLimited(true);
        setLookupMsg({ type: 'error', text: 'Rate limit reached: too many lookups. Please wait 30 minutes.' });
      } else {
        setLookupMsg({ type: 'error', text: err.message || 'Search failed. Please try again.' });
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSelectRecord = async (faydaId) => {
    setLookupLoading(true);
    setLookupMsg(null);
    setLookupResults([]);
    setRevealedPhone(null);
    setScreeningDetails(null);
    try {
      const card = await api.hospital.getPatientRecord(faydaId);
      setLookupRecord(card);
      resetAutoClear();
    } catch (err) {
      setLookupMsg({ type: 'error', text: err.message || 'Could not load patient record.' });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleRevealPhone = async () => {
    if (!lookupRecord) return;
    try {
      const res = await api.hospital.revealPatientPhone(lookupRecord.fayda_id);
      setRevealedPhone(res.phone);
      resetAutoClear();
    } catch (err) {
      setLookupMsg({ type: 'error', text: 'Could not reveal phone number.' });
    }
  };

  const handleRevealScreening = async () => {
    if (!lookupRecord) return;
    setShowScreeningConfirm(false);
    try {
      const res = await api.hospital.revealScreeningDetails(lookupRecord.fayda_id);
      setScreeningDetails(res);
      resetAutoClear();
    } catch (err) {
      setLookupMsg({ type: 'error', text: 'Could not reveal screening details.' });
    }
  };

  const clearLookup = () => {
    setLookupQuery('');
    setLookupResults([]);
    setLookupRecord(null);
    setRevealedPhone(null);
    setScreeningDetails(null);
    setLookupMsg(null);
    setShowScreeningConfirm(false);
    setLookupRateLimited(false);
    if (autoClearTimer.current) clearTimeout(autoClearTimer.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setAutoClearCountdown(null);
  };

  const totalLocalStock = internalStock.reduce((a, b) => a + (b.quantity || 0), 0);
  const pendingRequestsCount = requisitions.filter(r => r.status === 'pending').length;
  const fulfilledTodayCount = requisitions.filter(r => {
    if (r.status !== 'fulfilled' && r.status !== 'received') return false;
    const ref = r.updated_at || r.created_at;
    return ref ? new Date(ref).toDateString() === new Date().toDateString() : false;
  }).length;

  // Real data only — no demo fallbacks
  const displayLocalStock = internalStock.slice(0, 5);

  // Real data only — no demo fallbacks
  const displayRecentRequests = requisitions.slice(0, 3);

  return (
    <div className="dashboard-container">

      {/* WebSocket Notifications */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alerts.slice(0, 2).map(a => (
            <div key={a.id} style={{ background: 'rgba(13,148,136,0.12)', color: '#0d9488', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(13,148,136,0.25)', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{a.message}</span>
              <button onClick={() => setAlerts(prev => prev.filter(item => item.id !== a.id))} style={{ background: 'none', border: 'none', color: '#0d9488', cursor: 'pointer', padding: 0 }}>
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,35,60,0.1)', color: '#ef233c', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(239,35,60,0.2)', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#ef233c', cursor: 'pointer', padding: 0 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Floating Bottom Success Toast (Auto-dismisses in 5s) */}
      <BottomToast message={success} onClose={() => setSuccess(null)} />

      {/* DASHBOARD OVERVIEW */}
      {(tab === 'dashboard' || tab === 'main' || !tab) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

          {/* Header */}
          <div className="dashboard-header">
            <h2>Hospital Overview</h2>
            <p>Request and track blood units for patients.</p>
          </div>

          {/* 4 Stat Cards Row */}
          <div className="stat-card-grid">

            {/* Stat 1: Available Stock */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Available Stock</span>
                <div className="stat-card-icon" style={{ background: 'rgba(13,148,136,0.12)', color: '#0d9488' }}>
                  <Droplet size={18} fill="#0d9488" />
                </div>
              </div>
              <div className="stat-card-value">{totalLocalStock}</div>
              <div className="stat-card-trend trend-neutral">
                <span>units</span>
              </div>
            </div>

            {/* Stat 2: My Requests */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">My Requests</span>
                <div className="stat-card-icon" style={{ background: 'rgba(58,134,255,0.12)', color: '#3a86ff' }}>
                  <Calendar size={18} />
                </div>
              </div>
              <div className="stat-card-value">{pendingRequestsCount}</div>
              <div className="stat-card-trend trend-neutral">
                <span>Pending</span>
              </div>
            </div>

            {/* Stat 3: Fulfilled Today */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Fulfilled Today</span>
                <div className="stat-card-icon" style={{ background: 'rgba(6,214,160,0.12)', color: '#06d6a0' }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="stat-card-value">{fulfilledTodayCount}</div>
              <div className="stat-card-trend trend-neutral">
                <span>Requests</span>
              </div>
            </div>

            {/* Stat 4: Patients Registered */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Patients Registered</span>
                <div className="stat-card-icon" style={{ background: 'rgba(13,148,136,0.12)', color: '#0d9488' }}>
                  <Users size={18} />
                </div>
              </div>
              <div className="stat-card-value">{hmsPatients.length}</div>
              <div className="stat-card-trend trend-neutral">
                <span>Registered</span>
              </div>
            </div>

          </div>

          {/* 3 Column Grid Section */}
          <div className="dashboard-grid-3">

            {/* Card 1: Available Stock (Local) */}
            <div className="dashboard-card">
              <div className="dashboard-card-title">
                <span>Available Stock (Local)</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Facility</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {displayLocalStock.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>No local stock recorded yet.</p>
                ) : displayLocalStock.map(item => (
                  <div key={item.blood_type} className="clean-list-item">
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                      {item.blood_type}
                    </span>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      {item.quantity} units
                    </span>
                    <span className={`badge badge-${item.quantity > 5 ? 'approved' : 'pending'}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                      {item.quantity > 5 ? 'Optimal' : 'Low'}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setTab('stock')}
                className="view-all-btn"
              >
                View All Stock <ArrowRight size={13} />
              </button>
            </div>

            {/* Card 2: My Recent Requests */}
            <div className="dashboard-card">
              <div className="dashboard-card-title">
                <span>My Recent Requests</span>
                <ClipboardList size={16} color="var(--text-muted)" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {displayRecentRequests.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>No requests submitted yet.</p>
                ) : displayRecentRequests.map(req => (
                  <div key={req.id} className="clean-list-item">
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                        {req.id}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {req.blood_type} - {req.units_needed || 0} units
                      </div>
                    </div>
                    <span className={`badge badge-${req.status === 'approved' || req.status === 'fulfilled' ? 'approved' : req.status === 'in transit' ? 'collected' : 'pending'}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setTab('request')}
                className="view-all-btn"
              >
                View All Requests <ArrowRight size={13} />
              </button>
            </div>

            {/* Card 3: Quick Actions */}
            <div className="dashboard-card">
              <div className="dashboard-card-title">
                <span>Quick Actions</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center', flex: 1 }}>
                <button
                  onClick={() => setTab('request')}
                  className="quick-action-btn"
                >
                  <Truck size={16} /> Request Blood
                </button>
                <button
                  onClick={() => {
                    setTab('patients');
                    setShowAdmitForm(true);
                  }}
                  className="quick-action-btn"
                >
                  <UserPlus size={16} /> Add Patient
                </button>
                <button
                  onClick={() => setTab('patients')}
                  className="quick-action-btn"
                >
                  <Users size={16} /> View Patients
                </button>
                <button
                  onClick={() => setTab('stock')}
                  className="quick-action-btn btn-outline"
                >
                  <Package size={16} /> Stock Availability
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* REQUEST BLOOD / MY REQUESTS TAB */}
      {(tab === 'request' || tab === 'requests' || tab === 'central') && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.3fr', gap: '20px', alignItems: 'start' }}>
          
          {/* Order Placement Form */}
          <div className="dashboard-card animate-fade-in">
            <div className="dashboard-header" style={{ marginBottom: '14px' }}>
              <h2>Central Warehouse Requisition</h2>
              <p>Submit emergency or routine blood replenishment orders.</p>
            </div>

            <form onSubmit={handleCreateRequisition} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Required Blood Type</label>
                    <SelectDropdown
                      value={reqBloodType}
                      onChange={setReqBloodType}
                      ariaLabel="Required Blood Type"
                      options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => ({ value: t, label: t }))}
                    />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Units Needed</label>
                <input type="number" min="1" max="50" value={reqUnits} onChange={(e) => setReqUnits(Number(e.target.value))} required />
              </div>

              <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', marginTop: '6px' }} disabled={loading}>
                <Truck size={16} /> Place Requisition Order
              </button>
            </form>
          </div>

          {/* Active Requisitions List */}
          <div className="dashboard-card animate-fade-in">
            <div className="dashboard-header" style={{ marginBottom: '14px' }}>
              <h2>Active Orders & Status</h2>
              <p>Live tracking for dispatched shipments.</p>
            </div>

            {requisitions.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No active requisition orders.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Blood Type</th>
                      <th>Units</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requisitions.map(r => (
                      <tr key={r.id}>
                        <td data-label="Order ID" style={{ fontWeight: 600 }}>{r.id.substring(0, 8)}...</td>
                        <td data-label="Blood Type">
                          <span style={{ background: 'rgba(13,148,136,0.1)', color: '#0d9488', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                            {r.blood_type}
                          </span>
                        </td>
                        <td data-label="Units">{r.units_needed} units</td>
                        <td data-label="Status">
                          <span className={`badge badge-${r.status}`}>
                            {r.status}
                          </span>
                        </td>
                        <td data-label="Date" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Emergency Hospital-to-Hospital (H2H) Peer Sharing Board */}
          <div className="dashboard-card animate-fade-in" style={{ gridColumn: '1 / -1', borderTop: '4px solid #3a86ff' }}>
            <div className="dashboard-header" style={{ marginBottom: '16px' }}>
              <h2>Emergency Hospital-to-Hospital (H2H) Peer Sharing Board</h2>
              <p>Borrow or transfer critical blood reserves directly with nearby partner hospitals in real time.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.5fr', gap: '20px', alignItems: 'start' }}>
              
              {/* Broadcast H2H Request Form */}
              <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
                  📢 Broadcast Peer Emergency Request
                </h3>
                <form onSubmit={handleInterHospitalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Blood Group</label>
                    <SelectDropdown
                      value={interBloodType}
                      onChange={setInterBloodType}
                      ariaLabel="Blood Group"
                      options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => ({ value: t, label: t }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Units Needed</label>
                    <input type="number" min="1" max="20" value={interUnits} onChange={(e) => setInterUnits(Number(e.target.value))} required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', background: '#3a86ff', borderColor: '#3a86ff' }} disabled={loading}>
                    <Send size={15} /> Broadcast to Regional Hospitals
                  </button>
                </form>
              </div>

              {/* Incoming H2H Peer Requests Table */}
              <div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
                  🏥 Incoming Peer Requests from Other Facilities
                </h3>
                {interRequests.length === 0 ? (
                  <div style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                    No peer hospital requests pending in your region.
                  </div>
                ) : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Requesting Facility</th>
                          <th>Blood Type</th>
                          <th>Units</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {interRequests.map(r => (
                          <tr key={r.id}>
                            <td data-label="Requesting Facility" style={{ fontWeight: 600 }}>{r.requester_name || 'Regional Hospital'}</td>
                            <td data-label="Blood Type">
                              <span style={{ background: 'rgba(58,134,255,0.1)', color: '#3a86ff', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                                {r.blood_type}
                              </span>
                            </td>
                            <td data-label="Units" style={{ fontWeight: 600 }}>{r.units_needed} units</td>
                            <td data-label="Status">
                              <span className="badge badge-pending">
                                {r.status}
                              </span>
                            </td>
                            <td data-label="Actions" className="cell-actions" style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => handleFulfillInterHospital(r.id)}
                                className="btn btn-primary"
                                style={{ padding: '4px 10px', fontSize: '0.72rem', background: '#06d6a0', borderColor: '#06d6a0' }}
                                disabled={loading}
                                title="Transfer units from your internal inventory to this hospital"
                              >
                                <Check size={12} /> Transfer Stock
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      )}

      {/* PATIENTS & HMS TAB */}
      {(tab === 'patients' || tab === 'hms') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="dashboard-header">
              <h2>Hospital Patient Management (HMS)</h2>
              <p>Admit patients, track blood orders, and manage transfusion clinical notes.</p>
            </div>
            <button
              onClick={() => setShowAdmitForm(prev => !prev)}
              className="btn btn-primary"
            >
              <UserPlus size={16} /> {showAdmitForm ? 'Close Form' : 'Admit New Patient'}
            </button>
          </div>

          {/* Admit Patient Form */}
          {showAdmitForm && (
            <div className="dashboard-card animate-fade-in" style={{ borderTop: '4px solid var(--primary)' }}>
              <div className="dashboard-header" style={{ marginBottom: '14px' }}>
                <h2>Admit Patient Profile</h2>
                <p>Register new admission with FAYDA ID and clinical ward details.</p>
              </div>

              <form onSubmit={handleAdmitPatient} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Patient Full Name</label>
                    <input type="text" placeholder="e.g. Almaz Tadesse" value={admitForm.full_name} onChange={(e) => setAdmitForm({ ...admitForm, full_name: e.target.value })} required />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>FAYDA National ID</label>
                    <input type="text" placeholder="FAY-12345" value={admitForm.fayda_id} onChange={(e) => setAdmitForm({ ...admitForm, fayda_id: e.target.value })} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Age</label>
                    <input type="number" placeholder="e.g. 35" value={admitForm.age} onChange={(e) => setAdmitForm({ ...admitForm, age: e.target.value })} required />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Gender</label>
                    <SelectDropdown
                      value={admitForm.gender}
                      onChange={(v) => setAdmitForm({ ...admitForm, gender: v })}
                      ariaLabel="Gender"
                      options={[
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' }
                      ]}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Blood Type</label>
                    <SelectDropdown
                      value={admitForm.blood_type}
                      onChange={(v) => setAdmitForm({ ...admitForm, blood_type: v })}
                      ariaLabel="Blood Type"
                      options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => ({ value: t, label: t }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Hospital Ward</label>
                    <SelectDropdown
                      value={admitForm.ward || 'ICU'}
                      onChange={(v) => setAdmitForm({ ...admitForm, ward: v })}
                      ariaLabel="Hospital Ward"
                      options={[
                        { value: 'ICU', label: 'ICU (Intensive Care Unit)' },
                        { value: 'Emergency', label: 'Emergency & Trauma' },
                        { value: 'Surgery', label: 'Surgical Ward' },
                        { value: 'Maternity', label: 'Maternity & Obstetrics' },
                        { value: 'Pediatrics', label: 'Pediatrics' },
                        { value: 'Internal Medicine', label: 'Internal Medicine' },
                        { value: 'Oncology', label: 'Oncology' },
                        { value: 'General Ward', label: 'General Ward' }
                      ]}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Bed / Room Number</label>
                    <input type="text" placeholder="e.g. Bed 04, Room 102" value={admitForm.bed_number} onChange={(e) => setAdmitForm({ ...admitForm, bed_number: e.target.value })} required />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Clinical Diagnosis / Notes</label>
                  <input type="text" placeholder="e.g. Acute anemia, scheduled surgical transfusion" value={admitForm.diagnosis} onChange={(e) => setAdmitForm({ ...admitForm, diagnosis: e.target.value })} />
                </div>

                <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', marginTop: '6px' }} disabled={hmsLoading}>
                  <UserPlus size={16} /> Confirm Admission
                </button>
              </form>
            </div>
          )}

          {/* Order Blood for Selected Patient Form */}
          {showOrderForm && selectedPatient && (
            <div className="dashboard-card animate-fade-in" style={{ borderTop: '4px solid #ef233c', background: 'rgba(239,35,60,0.02)' }}>
              <div className="dashboard-header" style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2>Order Blood for Patient: {selectedPatient.full_name}</h2>
                  <p>FAYDA ID: {selectedPatient.fayda_id || 'N/A'} | Ward: {selectedPatient.ward} / Bed {selectedPatient.bed_number}</p>
                </div>
                <button onClick={() => { setShowOrderForm(false); setSelectedPatient(null); }} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                  <X size={14} /> Cancel
                </button>
              </div>

              <form onSubmit={handleCreateBloodOrder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Required Blood Type</label>
                    <SelectDropdown
                      value={orderForm.blood_type || selectedPatient.blood_type}
                      onChange={(v) => setOrderForm({ ...orderForm, blood_type: v })}
                      ariaLabel="Required Blood Type"
                      options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => ({ value: t, label: t }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Units Needed (Bags)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={orderForm.units_needed}
                      onChange={(e) => setOrderForm({ ...orderForm, units_needed: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Urgency Level</label>
                    <SelectDropdown
                      value={orderForm.urgency}
                      onChange={(v) => setOrderForm({ ...orderForm, urgency: v })}
                      ariaLabel="Urgency Level"
                      options={[
                        { value: 'routine', label: 'Routine (Scheduled Surgery)' },
                        { value: 'urgent', label: 'Urgent (Within 2 Hours)' },
                        { value: 'stat', label: 'STAT (Immediate Emergency / Trauma)' }
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Clinical Transfusion Notes / Indications</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Acute hemorrhagic shock, pre-op orthopedic surgery..."
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={hmsLoading}>
                    <Droplet size={16} fill="#ffffff" /> Dispatch Blood Order
                  </button>
                  <button type="button" onClick={() => { setShowOrderForm(false); setSelectedPatient(null); }} className="btn btn-outline">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Patients Table */}
          <div className="dashboard-card animate-fade-in">
            <div className="dashboard-header" style={{ marginBottom: '14px' }}>
              <h2>Hospital Admitted Patients</h2>
              <p>Active inpatients, ward assignments, and transfusion orders.</p>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>FAYDA ID</th>
                    <th>Blood Type</th>
                    <th>Ward / Bed</th>
                    <th>Blood Ordered</th>
                    <th>Status</th>
                    <th>Admitted Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hmsPatients.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                        No patients admitted yet. Click "Admit New Patient" above to register an admission.
                      </td>
                    </tr>
                  ) : (
                    hmsPatients.map(p => {
                      const totalUnits = p.bloodOrders?.reduce((sum, o) => sum + (o.units_needed || 0), 0) || 0;
                      const latestOrder = p.bloodOrders?.[0];

                      return (
                        <tr key={p.id}>
                          <td data-label="Patient Name" style={{ fontWeight: 600 }}>{p.full_name}</td>
                          <td data-label="FAYDA ID" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.fayda_id || 'N/A'}</td>
                          <td data-label="Blood Type">
                            <span style={{ background: 'rgba(13,148,136,0.1)', color: '#0d9488', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                              {p.blood_type}
                            </span>
                          </td>
                          <td data-label="Ward / Bed">{p.ward || 'ICU'} / {p.bed_number || 'Bed 12'}</td>
                          <td data-label="Blood Ordered">
                            {totalUnits > 0 && latestOrder ? (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontWeight: 800, color: '#ef233c', fontSize: '0.84rem' }}>
                                    🩸 {totalUnits} unit{totalUnits > 1 ? 's' : ''} ({latestOrder.blood_type})
                                  </span>
                                </div>
                                <div style={{ display: 'flex', gap: '4px', marginTop: '2px', alignItems: 'center' }}>
                                  <span
                                    className={`badge badge-${latestOrder.status === 'dispatched' ? 'approved' : latestOrder.status === 'requisition_placed' ? 'collected' : 'pending'}`}
                                    style={{ fontSize: '0.62rem', padding: '1px 6px' }}
                                  >
                                    {latestOrder.status === 'dispatched' ? '✓ Fulfilled (Internal)' : latestOrder.status === 'requisition_placed' ? '⏳ Requisition Sent' : latestOrder.status}
                                  </span>
                                  {p.bloodOrders.length > 1 && (
                                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>+{p.bloodOrders.length - 1} more</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>None ordered</span>
                            )}
                          </td>
                          <td data-label="Status">
                            <span className={`badge badge-${p.admission_status === 'admitted' ? 'approved' : 'pending'}`} style={{ fontSize: '0.68rem' }}>
                              {p.admission_status || 'Admitted'}
                            </span>
                          </td>
                          <td data-label="Admitted Date" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {new Date(p.admitted_at || p.created_at || Date.now()).toLocaleDateString()}
                          </td>
                          <td data-label="Actions" className="cell-actions" style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              {p.admission_status !== 'discharged' && (
                                <button
                                  onClick={() => {
                                    setSelectedPatient(p);
                                    setOrderForm({ ...orderForm, patient_id: p.id, blood_type: p.blood_type });
                                    setShowOrderForm(true);
                                  }}
                                  className="btn btn-primary"
                                  style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                  title="Order Blood for this Patient"
                                >
                                  <Droplet size={12} fill="#ffffff" /> Order Blood
                                </button>
                              )}
                              {p.admission_status !== 'discharged' && (
                                <button
                                  onClick={() => handleDischargePatient(p.id)}
                                  className="btn btn-outline"
                                  style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                  title="Discharge Patient"
                                >
                                  Discharge
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* FACILITY STOCK AVAILABILITY TAB */}
      {(tab === 'stock' || tab === 'internal' || tab === 'settings') && (
        <div className="dashboard-card animate-fade-in">
          <div className="dashboard-header" style={{ marginBottom: '16px' }}>
            <h2>Facility Internal Blood Bank Reserve</h2>
            <p>On-site refrigeration inventory ready for immediate surgical and trauma transfusions.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
            {internalStock.map(s => {
              const isLow = s.quantity < 5;
              return (
                <div
                  key={s.blood_type}
                  style={{
                    background: 'var(--bg-main)',
                    border: isLow ? '1px solid rgba(239,35,60,0.4)' : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isLow ? '#ef233c' : 'var(--text-primary)' }}>
                    {s.blood_type}
                  </span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {s.quantity} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>units</span>
                  </div>
                  <span className={`badge badge-${s.quantity > 5 ? 'approved' : 'pending'}`} style={{ fontSize: '0.65rem', alignSelf: 'flex-start', marginTop: '4px' }}>
                    {s.quantity > 5 ? 'Optimal' : 'Low Reserve'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── EMERGENCY PATIENT LOOKUP TAB ─────────────────────────────────────── */}
      {tab === 'lookup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div className="dashboard-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(239,35,60,0.12)', color: '#ef233c', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', animation: 'pulse 2s infinite' }}>
                  🚨 EMERGENCY
                </span>
                Patient Medical History Lookup
              </h2>
              <p>Search registered donor records by FAYDA National ID or Full Name. Every lookup is audit-logged.</p>
            </div>
            {lookupRecord && (
              <button onClick={clearLookup} className="btn btn-outline" style={{ fontSize: '0.78rem', padding: '6px 14px' }}>
                <X size={14} /> Clear Record
              </button>
            )}
          </div>

          {/* Auto-clear countdown banner */}
          {autoClearCountdown !== null && lookupRecord && (
            <div style={{ background: 'rgba(239,35,60,0.06)', border: '1px solid rgba(239,35,60,0.2)', borderRadius: '8px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#ef233c' }}>
              <Clock size={14} />
              <span>Sensitive data auto-clears in <strong>{Math.floor(autoClearCountdown / 60)}:{String(autoClearCountdown % 60).padStart(2, '0')}</strong> due to inactivity.</span>
            </div>
          )}

          {/* Rate limit warning */}
          {lookupRateLimited && (
            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.83rem', color: '#b45309' }}>
              <ShieldX size={16} />
              <span>Too many lookups from this account. Anomaly flag logged. Please wait 30 minutes before searching again.</span>
            </div>
          )}

          {/* Search form */}
          <div className="dashboard-card animate-fade-in" style={{ borderTop: '4px solid #ef233c' }}>
            <form onSubmit={handlePatientLookup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Mode toggle */}
              <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-main)', padding: '4px', borderRadius: '8px', width: 'fit-content', border: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => { setLookupMode('fayda'); setLookupQuery(''); setLookupResults([]); setLookupMsg(null); }}
                  style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, transition: 'all 0.15s', background: lookupMode === 'fayda' ? 'var(--primary, #ef233c)' : 'transparent', color: lookupMode === 'fayda' ? '#fff' : 'var(--text-secondary)' }}
                >
                  🪪 FAYDA ID (Exact)
                </button>
                <button
                  type="button"
                  onClick={() => { setLookupMode('name'); setLookupQuery(''); setLookupResults([]); setLookupMsg(null); }}
                  style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, transition: 'all 0.15s', background: lookupMode === 'name' ? 'var(--primary, #ef233c)' : 'transparent', color: lookupMode === 'name' ? '#fff' : 'var(--text-secondary)' }}
                >
                  👤 Full Name (Fuzzy)
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  id="lookup-query-input"
                  type="text"
                  placeholder={lookupMode === 'fayda' ? 'Enter FAYDA National ID exactly (e.g. FAY-12345)' : 'Enter patient full name or partial name...'}
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  style={{ flex: 1 }}
                  autoComplete="off"
                  required
                />
                <button
                  id="lookup-search-btn"
                  type="submit"
                  className="btn btn-primary"
                  disabled={lookupLoading || lookupRateLimited || !lookupQuery.trim()}
                  style={{ whiteSpace: 'nowrap', background: '#ef233c', borderColor: '#ef233c' }}
                >
                  {lookupLoading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={15} />}
                  {lookupLoading ? 'Searching...' : 'Search'}
                </button>
              </div>

              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                <Info size={11} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                All searches are logged to the audit trail with your staff ID and timestamp. Limit: 10 lookups per 30 minutes.
              </p>
            </form>
          </div>

          {/* Status message (info / not found / error) */}
          {lookupMsg && (
            <div style={{
              background: lookupMsg.type === 'error' ? 'rgba(239,35,60,0.08)' : lookupMsg.type === 'notfound' ? 'rgba(107,114,128,0.08)' : 'rgba(58,134,255,0.08)',
              border: `1px solid ${lookupMsg.type === 'error' ? 'rgba(239,35,60,0.25)' : lookupMsg.type === 'notfound' ? 'rgba(107,114,128,0.25)' : 'rgba(58,134,255,0.25)'}`,
              borderRadius: '8px', padding: '12px 16px', fontSize: '0.84rem',
              color: lookupMsg.type === 'error' ? '#ef233c' : lookupMsg.type === 'notfound' ? 'var(--text-secondary)' : '#3a86ff',
              display: 'flex', alignItems: 'flex-start', gap: '10px'
            }}>
              {lookupMsg.type === 'notfound' ? <ShieldX size={16} style={{ flexShrink: 0, marginTop: '1px' }} /> : <Info size={16} style={{ flexShrink: 0, marginTop: '1px' }} />}
              <span>{lookupMsg.text}</span>
            </div>
          )}

          {/* Disambiguation list */}
          {lookupResults.length > 1 && (
            <div className="dashboard-card animate-fade-in">
              <div className="dashboard-card-title" style={{ marginBottom: '14px' }}>
                <span>Select the Correct Patient</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lookupResults.length} matches</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lookupResults.map((r) => (
                  <button
                    key={r.fayda_id}
                    onClick={() => handleSelectRecord(r.fayda_id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', gap: '12px' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#ef233c'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{r.name}</div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        DOB: {r.dob ? new Date(r.dob).toLocaleDateString() : 'N/A'} &nbsp;·&nbsp; {r.gender} &nbsp;·&nbsp; FAYDA: {r.fayda_id_masked}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: 'rgba(13,148,136,0.1)', color: '#0d9488', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.72rem' }}>{r.blood_type}</span>
                      <ArrowRight size={15} color="var(--text-muted)" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Summary card */}
          {lookupRecord && (() => {
            const r = lookupRecord;
            const eligColor = r.eligibility?.status === 'Eligible' ? '#06d6a0' : r.eligibility?.status === 'Temporarily Deferred' ? '#f59e0b' : '#ef233c';
            const eligBadge = r.eligibility?.status === 'Eligible' ? 'approved' : r.eligibility?.status === 'Temporarily Deferred' ? 'collected' : 'pending';
            const screenColor = r.screening?.status === 'Cleared' ? '#06d6a0' : r.screening?.status === 'Requires Review' ? '#f59e0b' : 'var(--text-muted)';
            return (
              <div className="dashboard-card animate-fade-in" style={{ borderTop: `4px solid ${eligColor}` }}>
                {/* Card header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{r.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                      FAYDA: {r.fayda_id} &nbsp;·&nbsp; DOB: {r.dob || 'N/A'} ({r.age ? `${r.age} yrs` : 'N/A'}) &nbsp;·&nbsp; {r.gender}
                    </div>
                  </div>
                  <span style={{ background: 'rgba(13,148,136,0.1)', color: '#0d9488', padding: '6px 14px', borderRadius: '8px', fontWeight: 900, fontSize: '1.05rem' }}>
                    {r.blood_type}
                  </span>
                </div>

                {/* Status badges row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                  {/* Eligibility */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Eligibility</span>
                    <span className={`badge badge-${eligBadge}`} style={{ fontSize: '0.78rem', padding: '4px 12px' }}>
                      {r.eligibility?.status === 'Eligible' ? '✓ Eligible' : r.eligibility?.status === 'Temporarily Deferred' ? '⏳ Temporarily Deferred' : '✗ Permanently Deferred'}
                    </span>
                    {r.eligibility?.reason && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', maxWidth: '220px' }}>{r.eligibility.reason}</span>
                    )}
                  </div>

                  {/* Screening */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Screening</span>
                    <span style={{ background: `${screenColor}18`, color: screenColor, padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, border: `1px solid ${screenColor}40` }}>
                      {r.screening?.status === 'Cleared' ? '✓ Screening: Cleared' : r.screening?.status === 'Requires Review' ? '⚠ Screening: Requires Review' : '— No Screening on File'}
                    </span>
                    {r.screening?.outdated && (
                      <span style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 600 }}>⚠ Data outdated — recommend re-screening</span>
                    )}
                    {r.screening?.last_updated && (
                      <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>Last: {new Date(r.screening.last_updated).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {/* Details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                  <div style={{ background: 'var(--bg-main)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Last Donation</div>
                    {r.last_donation_date
                      ? <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{new Date(r.last_donation_date).toLocaleDateString()}</span>
                      : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.82rem' }}>No donation history on file</span>
                    }
                  </div>
                  <div style={{ background: 'var(--bg-main)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Emergency Contact (Phone)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {revealedPhone
                        ? <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem', letterSpacing: '0.05em' }}>{revealedPhone}</span>
                        : <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{r.phone_masked || 'N/A'}</span>
                      }
                      {!revealedPhone && r.phone_masked && (
                        <button
                          id="reveal-phone-btn"
                          onClick={handleRevealPhone}
                          title="Reveal phone number (will be audit logged)"
                          style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}
                        >
                          <Eye size={12} /> Reveal
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reveal screening details section */}
                {!screeningDetails && r.has_lab_record && (
                  <div>
                    {!showScreeningConfirm ? (
                      <button
                        id="reveal-screening-btn"
                        onClick={() => setShowScreeningConfirm(true)}
                        style={{ background: 'rgba(58,134,255,0.07)', border: '1px solid rgba(58,134,255,0.25)', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', fontSize: '0.8rem', color: '#3a86ff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center', transition: 'all 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(58,134,255,0.13)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(58,134,255,0.07)'}
                      >
                        <ShieldCheck size={15} /> View Detailed Screening Results (Audit Logged)
                      </button>
                    ) : (
                      <div style={{ background: 'rgba(239,35,60,0.06)', border: '1px solid rgba(239,35,60,0.2)', borderRadius: '8px', padding: '14px 16px' }}>
                        <p style={{ margin: '0 0 12px 0', fontSize: '0.83rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          ⚠ Confirming will reveal specific screening results and generate an audit log entry. Proceed?
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button id="confirm-reveal-screening-btn" onClick={handleRevealScreening} className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '6px 14px', background: '#ef233c', borderColor: '#ef233c' }}>
                            Confirm & Reveal
                          </button>
                          <button onClick={() => setShowScreeningConfirm(false)} className="btn btn-outline" style={{ fontSize: '0.78rem', padding: '6px 14px' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Revealed screening details */}
                {screeningDetails && (
                  <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Activity size={14} color="#ef233c" /> Detailed Screening Results
                        <span style={{ fontSize: '0.65rem', background: 'rgba(239,35,60,0.1)', color: '#ef233c', padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>SENSITIVE</span>
                      </span>
                      <button onClick={() => setScreeningDetails(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
                        <EyeOff size={13} />
                      </button>
                    </div>
                    {screeningDetails.lab ? (
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                        {[
                          ['Disease Markers', screeningDetails.lab.diseases],
                          ['Hemoglobin', screeningDetails.lab.hemoglobin],
                          ['Platelets', screeningDetails.lab.platelets],
                          ['Allergies', screeningDetails.lab.allergies],
                          ['Clinical Notes', screeningDetails.lab.notes],
                        ].map(([label, val]) => val ? (
                          <div key={label} style={{ background: 'var(--bg-surface)', borderRadius: '6px', padding: '10px 12px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val}</div>
                          </div>
                        ) : null)}
                        {screeningDetails.sample_notes && (
                          <div style={{ gridColumn: '1 / -1', background: 'var(--bg-surface)', borderRadius: '6px', padding: '10px 12px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Station Health Notes</div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{screeningDetails.sample_notes}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No detailed lab record available in the laboratory database.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      )}

    </div>
  );
}
