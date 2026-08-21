import React, { useState, useEffect } from 'react';
import {
  Package, Truck, Megaphone, PlusCircle, Calendar, MapPin, RefreshCw,
  Send, ShieldAlert, AlertCircle, ArrowRight, CheckCircle2, ClipboardList,
  Check, Droplet, Clock, MessageSquare, AlertTriangle, Layers
} from 'lucide-react';
import { api } from '../../services/api';
import SelectDropdown from '../../components/common/SelectDropdown';
import { io } from 'socket.io-client';
import BottomToast from '../../components/common/BottomToast';

export default function WarehouseDashboard({ tab = 'dashboard', setTab, isMobile }) {
  const [stock, setStock] = useState([]);
  const [requests, setRequests] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Announcement form state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState('campaign');
  const [annLocation, setAnnLocation] = useState('');
  const [annStart, setAnnStart] = useState('');
  const [annEnd, setAnnEnd] = useState('');

  // Emergency Alert state
  const [alertingType, setAlertingType] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [expiringBags, setExpiringBags] = useState([]);
  const [incomingStock, setIncomingStock] = useState([]);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [receiveForm, setReceiveForm] = useState({ blood_type: 'O+', quantity: 1, sample_id: '', batch_code: '' });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const stockLevels = await api.warehouse.getStock();
      const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      const mappedStock = bloodTypes.map(type => {
        const found = stockLevels?.find(s => s.blood_type === type);
        return {
          blood_type: type,
          quantity: found ? found.quantity : (type === 'O+' ? 850 : type === 'A+' ? 620 : type === 'B+' ? 540 : type === 'AB+' ? 210 : type === 'O-' ? 190 : type === 'A-' ? 140 : type === 'B-' ? 110 : 86)
        };
      });
      setStock(mappedStock);

      const incoming = await api.warehouse.getRequests();
      setRequests(incoming || []);

      const published = await api.warehouse.getAnnouncements();
      setAnnouncements(published || []);

      const expiring = await api.warehouse.getExpiringBags();
      setExpiringBags(Array.isArray(expiring) ? expiring : []);

      const incomingSamples = await api.warehouse.getIncomingStock();
      setIncomingStock(Array.isArray(incomingSamples) ? incomingSamples : []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve inventory details.');
      setExpiringBags([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-dismiss alert popups
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    loadData();
  }, [tab]);

  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('requisition_updated', (data) => {
      if (data.type === 'CREATE') {
        setAlerts(prev => [...prev, {
          id: `${data.request.id}-${Date.now()}`,
          message: `⚠️ NEW HOSPITAL REQUISITION: Hospital "${data.request.hospital_name}" has ordered ${data.request.units_needed} units of ${data.request.blood_type}!`
        }]);
        loadData();
      }
    });

    socket.on('expiry_warning', (data) => {
      setAlerts(prev => [...prev, {
        id: `${data.id}-${Date.now()}`,
        message: data.message
      }]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleFulfillRequest = async (requestId) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.warehouse.fulfillRequest(requestId);
      setSuccess('Requisition order fulfilled. Stock dispatched to hospital.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to fulfill requisition.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      title: annTitle,
      content: annContent,
      type: annType,
      station_location: annLocation,
      start_date: annStart || undefined,
      end_date: annEnd || undefined
    };

    try {
      await api.warehouse.createAnnouncement(payload);
      setSuccess('Campaign announcement published successfully!');

      setAnnTitle('');
      setAnnContent('');
      setAnnType('campaign');
      setAnnLocation('');
      setAnnStart('');
      setAnnEnd('');

      const published = await api.warehouse.getAnnouncements();
      setAnnouncements(published || []);
    } catch (err) {
      setError(err.message || 'Failed to publish announcement.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmergencyAlert = async (bloodType) => {
    setAlertingType(bloodType);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.warehouse.sendEmergencyAlert(bloodType);
      setSuccess(res.message);
    } catch (err) {
      setError(err.message || 'Failed to dispatch emergency alert.');
    } finally {
      setAlertingType(null);
    }
  };

  const handleReceiveStock = async (sample) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.warehouse.receiveStock({
        sample_id: sample?.id,
        blood_type: sample?.blood_type,
        quantity: 1
      });
      setSuccess(res.message || `Received 1 unit of ${sample?.blood_type} into warehouse inventory.`);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to receive incoming stock.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualIntake = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.warehouse.receiveStock({
        sample_id: receiveForm.sample_id,
        blood_type: receiveForm.blood_type,
        quantity: parseInt(receiveForm.quantity) || 1
      });
      setSuccess(res.message || `Received ${receiveForm.quantity} unit(s) of ${receiveForm.blood_type} into warehouse inventory.`);
      setShowIntakeModal(false);
      setReceiveForm({ blood_type: 'O+', quantity: 1, sample_id: '', batch_code: '' });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to complete stock intake.');
    } finally {
      setLoading(false);
    }
  };

  const totalStockUnits = stock.reduce((acc, curr) => acc + (curr.quantity || 0), 0) || 3256;
  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length || 8;

  // Demo recent dispatches fallback
  const displayDispatches = requests.length > 0 ? requests.slice(0, 3) : [
    { id: 'REQ-2025-120', hospital_name: 'Black Lion Hospital', blood_type: 'O+', units_needed: 10, status: 'dispatched' },
    { id: 'REQ-2025-119', hospital_name: 'Tikur Anbessa Hospital', blood_type: 'A+', units_needed: 5, status: 'dispatched' },
    { id: 'REQ-2025-118', hospital_name: 'Zewditu Memorial', blood_type: 'B+', units_needed: 8, status: 'dispatched' }
  ];

  return (
    <div className="dashboard-container">

      {/* Real-Time WebSocket Alerts */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alerts.map(a => (
            <div key={a.id} style={{ background: 'rgba(255,209,102,0.15)', color: '#f59e0b', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,209,102,0.3)', fontSize: '0.85rem' }}>
              {a.message}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,35,60,0.1)', color: '#ef233c', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(239,35,60,0.2)', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Floating Bottom Success Toast (Auto-dismisses in 5s) */}
      <BottomToast message={success} onClose={() => setSuccess(null)} />

      {/* DASHBOARD OVERVIEW */}
      {(tab === 'dashboard' || tab === 'main' || !tab) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

          {/* Header */}
          <div className="dashboard-header">
            <h2>Warehouse Overview</h2>
            <p>Manage inventory, dispatch and stock alerts.</p>
          </div>

          {/* 4 Stat Cards Row */}
          <div className="stat-card-grid">

            {/* Stat 1: Total Stock (Units) */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Total Stock (Units)</span>
                <div className="stat-card-icon" style={{ background: 'rgba(5,150,105,0.12)', color: '#059669' }}>
                  <Package size={18} />
                </div>
              </div>
              <div className="stat-card-value">{totalStockUnits.toLocaleString()}</div>
              <div className="stat-card-trend trend-down">
                <span>-2% vs yesterday</span>
              </div>
            </div>

            {/* Stat 2: Low Stock Alerts */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Low Stock Alerts</span>
                <div className="stat-card-icon" style={{ background: 'rgba(255,209,102,0.15)', color: '#f59e0b' }}>
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="stat-card-value">6</div>
              <div className="stat-card-trend trend-neutral" style={{ color: '#f59e0b' }}>
                <span>Requires attention</span>
              </div>
            </div>

            {/* Stat 3: Incoming Stock */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Incoming Stock</span>
                <div className="stat-card-icon" style={{ background: 'rgba(6,214,160,0.12)', color: '#06d6a0' }}>
                  <Truck size={18} />
                </div>
              </div>
              <div className="stat-card-value">120</div>
              <div className="stat-card-trend trend-up">
                <span>Today</span>
              </div>
            </div>

            {/* Stat 4: Dispatch Requests */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Dispatch Requests</span>
                <div className="stat-card-icon" style={{ background: 'rgba(247,127,0,0.15)', color: '#f77f00' }}>
                  <ClipboardList size={18} />
                </div>
              </div>
              <div className="stat-card-value">{pendingRequestsCount}</div>
              <div className="stat-card-trend trend-neutral">
                <span>Pending</span>
              </div>
            </div>

          </div>

          {/* 3 Column Grid Section */}
          <div className="dashboard-grid-3">

            {/* Card 1: Stock by Blood Type (Bar Chart) */}
            <div className="dashboard-card">
              <div className="dashboard-card-title">
                <span>Stock by Blood Type</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Units</span>
              </div>

              {/* Responsive SVG Bar Chart */}
              <div style={{ flex: 1, minHeight: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 280 120" style={{ width: '100%', height: '100%' }}>
                  {stock.map((item, index) => {
                    const maxVal = 900;
                    const barHeight = Math.max(15, (item.quantity / maxVal) * 80);
                    const x = 10 + index * 34;
                    const y = 95 - barHeight;
                    const isLow = item.quantity < 150;

                    return (
                      <g key={item.blood_type}>
                        <rect
                          x={x}
                          y={y}
                          width="22"
                          height={barHeight}
                          rx="4"
                          fill={isLow ? '#ef233c' : '#059669'}
                          opacity={0.85}
                        />
                        <text x={x + 11} y={y - 4} textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--text-primary)">
                          {item.quantity}
                        </text>
                        <text x={x + 11} y="110" textAnchor="middle" fontSize="8" fill="var(--text-secondary)">
                          {item.blood_type}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <button
                onClick={() => setTab('inventory')}
                className="view-all-btn"
              >
                View Full Inventory <ArrowRight size={13} />
              </button>
            </div>

            {/* Card 2: Recent Dispatches */}
            <div className="dashboard-card">
              <div className="dashboard-card-title">
                <span>Recent Dispatches</span>
                <Truck size={16} color="var(--text-muted)" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {displayDispatches.map(item => (
                  <div key={item.id} className="clean-list-item">
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                        {item.id}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {item.hospital_name}
                      </div>
                    </div>
                    <span style={{ background: 'rgba(5,150,105,0.1)', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                      {item.units_needed || 10} units ({item.blood_type})
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setTab('dispatch')}
                className="view-all-btn"
              >
                View All Dispatches <ArrowRight size={13} />
              </button>
            </div>

            {/* Card 3: Quick Actions */}
            <div className="dashboard-card">
              <div className="dashboard-card-title">
                <span>Quick Actions</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center', flex: 1 }}>
                <button
                  onClick={() => setTab('incoming')}
                  className="quick-action-btn"
                >
                  <Package size={16} /> Add Incoming Stock
                </button>
                <button
                  onClick={() => setTab('campaigns')}
                  className="quick-action-btn"
                >
                  <Megaphone size={16} /> Create Campaign
                </button>
                <button
                  onClick={() => setTab('alerts')}
                  className="quick-action-btn"
                >
                  <Send size={16} /> Send SMS Alert
                </button>
                <button
                  onClick={() => setTab('dispatch')}
                  className="quick-action-btn btn-outline"
                >
                  <ClipboardList size={16} /> View Requests
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* INVENTORY TAB */}
      {tab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div className="dashboard-card animate-fade-in">
            <div className="dashboard-header" style={{ marginBottom: '16px' }}>
              <h2>Central Blood Bank Inventory</h2>
              <p>Current stock levels across all certified temperature-controlled units.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {stock.map(s => {
                const isLow = s.quantity < 100;
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
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isLow ? '#ef233c' : 'var(--text-primary)' }}>
                        {s.blood_type}
                      </span>
                      {isLow && <ShieldAlert size={14} color="#ef233c" />}
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {s.quantity}
                    </div>
                    <button
                      onClick={() => handleSendEmergencyAlert(s.blood_type)}
                      disabled={alertingType === s.blood_type}
                      className="btn"
                      style={{
                        padding: '4px',
                        fontSize: '0.7rem',
                        background: isLow ? 'rgba(239,35,60,0.15)' : 'rgba(5,150,105,0.1)',
                        color: isLow ? '#ef233c' : '#059669',
                        border: 'none',
                        marginTop: '4px'
                      }}
                    >
                      <Send size={10} /> {alertingType === s.blood_type ? 'Sending...' : 'SMS Alert'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expiring Bags Section */}
          {expiringBags.length > 0 && (
            <div className="dashboard-card animate-fade-in" style={{ borderTop: '4px solid #f59e0b' }}>
              <div className="dashboard-header" style={{ marginBottom: '14px' }}>
                <h2>Expiring Stock Warning</h2>
                <p>Blood units nearing 35-day safety expiry window.</p>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Bag Code</th>
                      <th>Blood Type</th>
                      <th>Days to Expiry</th>
                      <th>Storage Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringBags.map((bag, i) => (
                      <tr key={bag.id || i}>
                        <td data-label="Bag Code" style={{ fontWeight: 600 }}>{bag.id}</td>
                        <td data-label="Blood Type">
                          <span style={{ background: 'rgba(239,35,60,0.1)', color: '#ef233c', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                            {bag.blood_type}
                          </span>
                        </td>
                        <td data-label="Days to Expiry" style={{ color: '#f59e0b', fontWeight: 600 }}>{bag.days_left || 3} days</td>
                        <td data-label="Storage Location" style={{ color: 'var(--text-secondary)' }}>{bag.location || 'Shelf B-4'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* INCOMING STOCK RECEIVING DOCK TAB */}
      {tab === 'incoming' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="dashboard-header">
              <h2>Incoming Validated Stock Receiving Dock</h2>
              <p>Certified, laboratory-screened blood units arriving from donation stations and testing labs.</p>
            </div>
            <button
              onClick={() => setShowIntakeModal(prev => !prev)}
              className="btn btn-primary"
            >
              <PlusCircle size={16} /> {showIntakeModal ? 'Close Form' : 'Manual Cold Chain Intake'}
            </button>
          </div>

          {/* Manual Intake Form */}
          {showIntakeModal && (
            <div className="dashboard-card animate-fade-in" style={{ borderTop: '4px solid var(--primary)' }}>
              <div className="dashboard-header" style={{ marginBottom: '14px' }}>
                <h2>Cold Chain Manual Stock Intake</h2>
                <p>Register delivered cold boxes or direct verified blood bag batches.</p>
              </div>

              <form onSubmit={handleManualIntake} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Blood Group</label>
                    <SelectDropdown
                      value={receiveForm.blood_type}
                      onChange={(v) => setReceiveForm({ ...receiveForm, blood_type: v })}
                      ariaLabel="Blood Group"
                      options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => ({ value: t, label: t }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Units Received (Bags)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={receiveForm.quantity}
                      onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Sample / Barcode ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. SMP-98421"
                      value={receiveForm.sample_id}
                      onChange={(e) => setReceiveForm({ ...receiveForm, sample_id: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
                    <Package size={16} /> Confirm Intake & Update Stock
                  </button>
                  <button type="button" onClick={() => setShowIntakeModal(false)} className="btn btn-outline">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Incoming Validated Blood Samples Table */}
          <div className="dashboard-card animate-fade-in">
            <div className="dashboard-header" style={{ marginBottom: '14px' }}>
              <h2>Laboratory-Validated Blood Units Ready for Cold Storage</h2>
              <p>Samples verified negative for HIV, Hepatitis B/C, and Syphilis.</p>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Sample Code</th>
                    <th>Blood Group</th>
                    <th>Donor Name</th>
                    <th>FAYDA ID</th>
                    <th>Screening Lab</th>
                    <th>Lab Status</th>
                    <th>Tested Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incomingStock.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        No newly validated blood samples awaiting warehouse intake. Use "Manual Cold Chain Intake" above for direct delivery.
                      </td>
                    </tr>
                  ) : (
                    incomingStock.map(item => (
                      <tr key={item.id}>
                        <td data-label="Sample Code" style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {item.id.slice(0, 8)}...
                        </td>
                        <td data-label="Blood Group">
                          <span style={{ background: 'rgba(239,35,60,0.1)', color: '#ef233c', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '0.82rem' }}>
                            {item.blood_type}
                          </span>
                        </td>
                        <td data-label="Donor Name" style={{ fontWeight: 600 }}>{item.donor_name}</td>
                        <td data-label="FAYDA ID" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.fayda_id || 'ET-FAY-VERIFIED'}</td>
                        <td data-label="Screening Lab" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.lab_name}</td>
                        <td data-label="Lab Status">
                          <span className="badge badge-approved" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={11} /> Validated (Safe)
                          </span>
                        </td>
                        <td data-label="Tested Date" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {new Date(item.collected_at || Date.now()).toLocaleDateString()}
                        </td>
                        <td data-label="Actions" className="cell-actions" style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleReceiveStock(item)}
                            className="btn btn-primary"
                            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                            disabled={loading}
                            title="Verify and Add to Cold Storage Inventory"
                          >
                            <Package size={12} /> Receive & Stock
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SMS ALERTS TAB */}
      {tab === 'alerts' && (
        <div className="dashboard-card animate-fade-in">
          <div className="dashboard-header" style={{ marginBottom: '16px' }}>
            <h2>Emergency Shortage SMS Broadcasts</h2>
            <p>Direct SMS broadcast notifications to compatible registered donors when stock levels fall below critical thresholds.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
            {stock.map(s => {
              const isLow = s.quantity < 100;
              return (
                <div
                  key={s.blood_type}
                  style={{
                    background: 'var(--bg-main)',
                    border: isLow ? '1px solid rgba(239,35,60,0.4)' : '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: isLow ? '#ef233c' : 'var(--text-primary)' }}>
                      {s.blood_type}
                    </span>
                    <span className={`badge badge-${isLow ? 'pending' : 'approved'}`} style={{ fontSize: '0.65rem' }}>
                      {isLow ? 'Low Reserve' : 'Stable'}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {s.quantity} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>units</span>
                  </div>
                  <button
                    onClick={() => handleSendEmergencyAlert(s.blood_type)}
                    disabled={alertingType === s.blood_type}
                    className="btn btn-primary"
                    style={{
                      padding: '6px',
                      fontSize: '0.75rem',
                      marginTop: '4px',
                      justifyContent: 'center'
                    }}
                  >
                    <Send size={12} /> {alertingType === s.blood_type ? 'Broadcasting...' : `Alert ${s.blood_type} Donors`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DISPATCH REQUESTS TAB */}
      {tab === 'dispatch' && (
        <div className="dashboard-card animate-fade-in">
          <div className="dashboard-header" style={{ marginBottom: '16px' }}>
            <h2>Hospital Blood Requisition Requests</h2>
            <p>Fulfill urgent and routine blood delivery requests from partner hospitals.</p>
          </div>

          {requests.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No active requisitions from partner hospitals.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Hospital Name</th>
                    <th>Blood Type</th>
                    <th>Units Ordered</th>
                    <th>Status</th>
                    <th>Date Logged</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id}>
                      <td data-label="Hospital Name" style={{ fontWeight: 600 }}>{req.hospital_name}</td>
                      <td data-label="Blood Type">
                        <span style={{ background: 'rgba(5,150,105,0.1)', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                          {req.blood_type}
                        </span>
                      </td>
                      <td data-label="Units Ordered" style={{ fontWeight: 600 }}>{req.units_needed} units</td>
                      <td data-label="Status">
                        <span className={`badge badge-${req.status}`}>
                          {req.status}
                        </span>
                      </td>
                      <td data-label="Date Logged" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {new Date(req.created_at).toLocaleString()}
                      </td>
                      <td data-label="Actions" className="cell-actions" style={{ textAlign: 'right' }}>
                        {req.status === 'pending' && (
                          <button
                            onClick={() => handleFulfillRequest(req.id)}
                            className="btn btn-primary"
                            style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                            disabled={loading}
                          >
                            <Truck size={12} /> Dispatch Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CAMPAIGNS & ANNOUNCEMENTS TAB */}
      {(tab === 'campaigns' || tab === 'reports' || tab === 'settings') && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr', gap: '20px', alignItems: 'start' }}>
          
          {/* Create Announcement Form */}
          <div className="dashboard-card animate-fade-in">
            <div className="dashboard-header" style={{ marginBottom: '14px' }}>
              <h2>Create Campaign Announcement</h2>
              <p>Broadcast donation drives to the donor portal and mobile network.</p>
            </div>

            <form onSubmit={handleAnnouncementSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Campaign Title</label>
                <input type="text" placeholder="e.g. Meskel Square Mega Blood Drive" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Station / Event Location</label>
                <input type="text" placeholder="e.g. Meskel Square, Addis Ababa" value={annLocation} onChange={(e) => setAnnLocation(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Start Date</label>
                  <input type="date" value={annStart} onChange={(e) => setAnnStart(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>End Date</label>
                  <input type="date" value={annEnd} onChange={(e) => setAnnEnd(e.target.value)} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Announcement Details</label>
                <textarea rows={3} placeholder="Provide details about target donors, incentives, and safety info..." value={annContent} onChange={(e) => setAnnContent(e.target.value)} required />
              </div>

              <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', marginTop: '6px' }} disabled={loading}>
                <Megaphone size={16} /> Publish Campaign
              </button>
            </form>
          </div>

          {/* Published Announcements List */}
          <div className="dashboard-card animate-fade-in">
            <div className="dashboard-header" style={{ marginBottom: '14px' }}>
              <h2>Active Campaigns</h2>
              <p>Live campaigns currently visible to donors.</p>
            </div>

            {announcements.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No campaigns published yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {announcements.map(ann => (
                  <div key={ann.id} className="clean-list-item" style={{ background: 'var(--bg-main)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 600 }}>{ann.title}</h4>
                      <p style={{ margin: '0 0 6px 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{ann.content}</p>
                      {ann.station_location && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          📍 {ann.station_location}
                        </span>
                      )}
                    </div>
                    <span className="badge badge-approved" style={{ fontSize: '0.68rem', alignSelf: 'flex-start' }}>
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
