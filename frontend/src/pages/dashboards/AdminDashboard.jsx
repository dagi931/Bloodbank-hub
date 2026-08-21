import React, { useState, useEffect } from 'react';
import { 
  Users, BarChart3, ToggleLeft, ShieldCheck, ShieldAlert, Activity, Key, Check, X, 
  Building, Warehouse, Heart, TrendingUp, TrendingDown, ArrowRight, Clock, 
  UserCheck, AlertCircle, FileText, CheckCircle2, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { api } from '../../services/api';
import Analytics from '../../components/common/Analytics';
import BottomToast from '../../components/common/BottomToast';

export default function AdminDashboard({ tab = 'dashboard', setTab, isMobile }) {
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [remindersResult, setRemindersResult] = useState(null);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [registryCategory, setRegistryCategory] = useState('all');

  // Password resets state
  const [resetRequests, setResetRequests] = useState([]);
  const [activeRequest, setActiveRequest] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load all relevant data
      const [usersData, stats, logs, requests] = await Promise.allSettled([
        api.admin.getUsers(),
        api.admin.getAnalytics(),
        api.admin.getAuditLogs(),
        api.admin.getPasswordResetRequests()
      ]);

      if (usersData.status === 'fulfilled') setUsers(usersData.value || []);
      if (stats.status === 'fulfilled') setAnalytics(stats.value || null);
      if (logs.status === 'fulfilled') setAuditLogs(logs.value || []);
      if (requests.status === 'fulfilled') setResetRequests(requests.value || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve administrative data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  const handleStatusUpdate = async (userId, newStatus) => {
    setLoading(true);
    setError(null);
    try {
      await api.admin.updateUserStatus(userId, newStatus);
      const usersData = await api.admin.getUsers();
      setUsers(usersData || []);
      setSuccessMsg(`Workstation registration successfully marked as ${newStatus}.`);
    } catch (err) {
      setError(err.message || 'Failed to update user status.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerReminders = async () => {
    setRemindersLoading(true);
    setError(null);
    setRemindersResult(null);
    try {
      const data = await api.admin.triggerReminders();
      setRemindersResult(data);
      setSuccessMsg(data.message || 'Donation reminders triggered and dispatched via SMS successfully!');
    } catch (err) {
      setError(err.message || 'Failed to trigger donation reminders.');
    } finally {
      setRemindersLoading(false);
    }
  };

  const handleResolveReset = async (id) => {
    if (!tempPassword) {
      setError("Please specify a temporary password.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.admin.resolvePasswordReset(id, tempPassword);
      setSuccessMsg(res.message || "Password updated successfully.");
      setTempPassword('');
      setActiveRequest(null);
      const requests = await api.admin.getPasswordResetRequests();
      setResetRequests(requests || []);
    } catch (err) {
      setError(err.message || 'Failed to resolve password reset.');
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkstationUsers = users.filter(u => u.role !== 'donor').filter(u => {
    if (registryCategory === 'all') return true;
    if (registryCategory === 'laboratory') return u.role === 'laboratory';
    if (registryCategory === 'station') return u.role === 'station';
    return u.role !== 'laboratory' && u.role !== 'station';
  });

  const pendingUsers = users.filter(u => u.status === 'pending' && u.role !== 'donor');

  // Fallback demo registrations if none in DB — only non-donor workstations
  const displayRegistrations = users.filter(u => u.role !== 'donor').length > 0
    ? users.filter(u => u.role !== 'donor').slice(0, 4)
    : [
      { id: 1, entity_name: 'Addis Ababa Station', role: 'station', status: 'pending' },
      { id: 2, entity_name: 'Hawassa Laboratory', role: 'laboratory', status: 'pending' },
      { id: 3, entity_name: 'Mekelle Warehouse', role: 'warehouse', status: 'pending' },
      { id: 4, entity_name: 'Gondar Hospital', role: 'hospital', status: 'pending' }
    ];

  // Fallback demo logs if none in DB
  const displayLogs = auditLogs.length > 0 ? auditLogs.slice(0, 5) : [
    { id: 1, action: 'User login - admin', details: 'Admin logged in', time: '2 min ago' },
    { id: 2, action: 'Stock updated - B+', details: '20 units added', time: '15 min ago' },
    { id: 3, action: 'Password reset resolved', details: 'Hawassa Lab reset', time: '1 hour ago' },
    { id: 4, action: 'Hospital request fulfilled', details: '10 units dispatched', time: '2 hours ago' },
    { id: 5, action: 'Workstation approved', details: 'Addis Station verified', time: '5 hours ago' }
  ];

  return (
    <div className="dashboard-container">

      {error && (
        <div style={{ background: 'rgba(239,35,60,0.1)', color: '#ef233c', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(239,35,60,0.2)', fontSize: '0.88rem' }}>
          {error}
        </div>
      )}

      {/* Floating Bottom Success Toast (Auto-dismisses in 5s) */}
      <BottomToast message={successMsg} onClose={() => setSuccessMsg(null)} />

      {/* DASHBOARD HOME OVERVIEW */}
      {(tab === 'dashboard' || tab === 'main' || !tab) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* Header */}
          <div className="dashboard-header">
            <h2>System Overview</h2>
            <p>Monitor and manage the entire Blood Bank Hub ecosystem.</p>
          </div>

          {/* 4 Stat Cards Row */}
          <div className="stat-card-grid">
            
            {/* Stat 1: Total Workstations */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Total Workstations</span>
                <div className="stat-card-icon" style={{ background: 'rgba(58,134,255,0.12)', color: '#3a86ff' }}>
                  <Building size={18} />
                </div>
              </div>
              <div className="stat-card-value">
                {analytics?.totalWorkstations || users.filter(u => u.role !== 'donor').length || '4'}
              </div>
              <div className="stat-card-trend trend-up">
                <TrendingUp size={13} />
                <span>Active stations</span>
              </div>
            </div>

            {/* Stat 2: Total Donors */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Total Donors</span>
                <div className="stat-card-icon" style={{ background: 'rgba(6,214,160,0.12)', color: '#06d6a0' }}>
                  <Users size={18} />
                </div>
              </div>
              <div className="stat-card-value">
                {analytics?.totalDonors || users.filter(u => u.role === 'donor').length || '100'}
              </div>
              <div className="stat-card-trend trend-up">
                <TrendingUp size={13} />
                <span>FAYDA verified</span>
              </div>
            </div>

            {/* Stat 3: Blood Units in Stock */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Blood Units in Stock</span>
                <div className="stat-card-icon" style={{ background: 'rgba(239,35,60,0.12)', color: '#ef233c' }}>
                  <Heart size={18} fill="#ef233c" />
                </div>
              </div>
              <div className="stat-card-value">
                {analytics?.totalStock?.toLocaleString() || '1,445'}
              </div>
              <div className="stat-card-trend trend-up">
                <TrendingUp size={13} />
                <span>Central reserve</span>
              </div>
            </div>

            {/* Stat 4: Pending Requests */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Pending Requests</span>
                <div className="stat-card-icon" style={{ background: 'rgba(255,209,102,0.15)', color: '#f59e0b' }}>
                  <AlertCircle size={18} />
                </div>
              </div>
              <div className="stat-card-value">
                {analytics?.pendingRequests !== undefined ? analytics.pendingRequests : pendingUsers.length}
              </div>
              <div className="stat-card-trend trend-neutral">
                <span>Awaiting action</span>
              </div>
            </div>

          </div>

          {/* 3 Column Grid Section */}
          <div className="dashboard-grid-3">
            
            {/* Card 1: Workstation Registrations */}
            <div className="dashboard-card">
              <div className="dashboard-card-title">
                <span>Workstation Registrations</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recent</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {displayRegistrations.map((item, idx) => (
                  <div key={item.id || idx} className="clean-list-item">
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                        {item.entity_name || item.email}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {item.role}
                      </div>
                    </div>
                    <span className={`badge badge-${item.status || 'pending'}`}>
                      {item.status || 'pending'}
                    </span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setTab('users')} 
                className="view-all-btn"
              >
                View All Registrations <ArrowRight size={13} />
              </button>
            </div>

            {/* Card 2: System Analytics Line Chart */}
            <div className="dashboard-card">
              <div className="dashboard-card-title">
                <span>System Analytics</span>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.72rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef233c' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef233c' }} /> Donations
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3a86ff' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3a86ff' }} /> Requests
                  </span>
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div style={{ flex: 1, minHeight: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 300 120" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  {/* Grid lines */}
                  <line x1="0" y1="20" x2="300" y2="20" stroke="var(--border-color)" strokeDasharray="3 3" />
                  <line x1="0" y1="55" x2="300" y2="55" stroke="var(--border-color)" strokeDasharray="3 3" />
                  <line x1="0" y1="90" x2="300" y2="90" stroke="var(--border-color)" strokeDasharray="3 3" />
                  
                  {/* Donations line (Red) */}
                  <polyline
                    fill="none"
                    stroke="#ef233c"
                    strokeWidth="2.5"
                    points="10,80 55,70 100,50 145,60 190,30 235,45 280,25"
                  />
                  {/* Requests line (Blue) */}
                  <polyline
                    fill="none"
                    stroke="#3a86ff"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    points="10,95 55,85 100,70 145,75 190,55 235,60 280,40"
                  />

                  {/* Nodes */}
                  <circle cx="280" cy="25" r="4" fill="#ef233c" />
                  <circle cx="280" cy="40" r="4" fill="#3a86ff" />

                  {/* X Axis Labels */}
                  <text x="10" y="112" fontSize="9" fill="var(--text-muted)">Jan</text>
                  <text x="55" y="112" fontSize="9" fill="var(--text-muted)">Feb</text>
                  <text x="100" y="112" fontSize="9" fill="var(--text-muted)">Mar</text>
                  <text x="145" y="112" fontSize="9" fill="var(--text-muted)">Apr</text>
                  <text x="190" y="112" fontSize="9" fill="var(--text-muted)">May</text>
                  <text x="235" y="112" fontSize="9" fill="var(--text-muted)">Jun</text>
                  <text x="280" y="112" fontSize="9" fill="var(--text-muted)">Jul</text>
                </svg>
              </div>

              <button 
                onClick={() => setTab('analytics')} 
                className="view-all-btn"
              >
                View Detailed Analytics <ArrowRight size={13} />
              </button>
            </div>

            {/* Card 3: Recent Audit Logs */}
            <div className="dashboard-card">
              <div className="dashboard-card-title">
                <span>Recent Audit Logs</span>
                <Clock size={15} color="var(--text-muted)" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {displayLogs.map((log, idx) => (
                  <div key={log.id || idx} className="clean-list-item">
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                        {log.action}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {log.details || log.ip_address || 'System activity'}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {log.time || new Date(log.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setTab('audit')} 
                className="view-all-btn"
              >
                View All Logs <ArrowRight size={13} />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* WORKSTATION APPROVALS — only non-donors needing admin approval */}
      {tab === 'approvals' && (
        <div className="dashboard-card animate-fade-in">
          <div className="dashboard-header" style={{ marginBottom: '16px' }}>
            <h2>Pending Workstation Authorizations</h2>
            <p>Hospitals, labs, stations, and warehouses must receive administrative approval before they can log in. Donors do not require approval.</p>
          </div>

          {/* Interactive Actor Switcher Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
            {['all', 'laboratory', 'station', 'others'].map(cat => {
              const isActive = registryCategory === cat;
              let label = '';
              let count = 0;
              const nonDonors = users.filter(u => u.role !== 'donor');
              if (cat === 'all') {
                label = 'All Workstations';
                count = nonDonors.length;
              } else if (cat === 'laboratory') {
                label = 'Laboratory';
                count = users.filter(u => u.role === 'laboratory').length;
              } else if (cat === 'station') {
                label = 'Donation Stations';
                count = users.filter(u => u.role === 'station').length;
              } else {
                label = 'Hospitals & Warehouses';
                count = users.filter(u => u.role === 'hospital' || u.role === 'warehouse').length;
              }

              return (
                <button
                  key={cat}
                  onClick={() => setRegistryCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    background: isActive ? 'var(--primary)' : 'var(--bg-surface)',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{label}</span>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', 
                    padding: '1px 5px', 
                    borderRadius: '10px',
                    fontWeight: 700 
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {loading && users.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading registries...</p>
          ) : filteredWorkstationUsers.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', margin: '20px 0' }}>No workstation registrations found in this category.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Workstation Email</th>
                    <th>Role Workspace</th>
                    <th>Facility Name</th>
                    <th>Approval Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkstationUsers.map(u => (
                    <tr key={u.id}>
                      <td data-label="Workstation Email" style={{ fontWeight: 600 }}>{u.email}</td>
                      <td data-label="Role Workspace">
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: 700 }}>
                          {u.role}
                        </span>
                      </td>
                      <td data-label="Facility Name" style={{ color: 'var(--text-secondary)' }}>{u.entity_name}</td>
                      <td data-label="Approval Status">
                        <span className={`badge badge-${u.status}`}>
                          {u.status}
                        </span>
                      </td>
                      <td data-label="Actions" className="cell-actions" style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {u.status !== 'approved' && (
                            <button 
                              onClick={() => handleStatusUpdate(u.id, 'approved')}
                              className="btn btn-primary"
                              style={{ padding: '5px 10px', fontSize: '0.72rem', background: '#06d6a0', borderColor: '#06d6a0' }}
                              disabled={loading}
                            >
                              <ShieldCheck size={12} /> Approve
                            </button>
                          )}
                          {u.status !== 'rejected' && (
                            <button 
                              onClick={() => handleStatusUpdate(u.id, 'rejected')}
                              className="btn"
                              style={{ padding: '5px 10px', fontSize: '0.72rem', background: 'rgba(239,35,60,0.1)', color: '#ef233c', border: '1px solid rgba(239,35,60,0.2)' }}
                              disabled={loading}
                            >
                              <ShieldAlert size={12} /> Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* USERS REGISTRY — all users including donors (read-only information) */}
      {tab === 'users' && (
        <div className="dashboard-card animate-fade-in">
          <div className="dashboard-header" style={{ marginBottom: '16px' }}>
            <h2>Registered Users Directory</h2>
            <p>All registered accounts in the system — workstations and donors. Donors are auto-approved upon registration.</p>
          </div>

          {/* User category filter */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
            {['all', 'donor', 'station', 'laboratory', 'hospital', 'warehouse'].map(cat => {
              const isActive = registryCategory === cat;
              const count = cat === 'all' ? users.length : users.filter(u => u.role === cat).length;
              const labels = { all: 'All Users', donor: 'Donors', station: 'Stations', laboratory: 'Laboratories', hospital: 'Hospitals', warehouse: 'Warehouses' };
              return (
                <button
                  key={cat}
                  onClick={() => setRegistryCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    background: isActive ? 'var(--primary)' : 'var(--bg-surface)',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{labels[cat]}</span>
                  <span style={{ fontSize: '0.7rem', background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '10px', fontWeight: 700 }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {loading && users.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading users...</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Name / Entity</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {(registryCategory === 'all' ? users : users.filter(u => u.role === registryCategory)).map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.email}</td>
                      <td>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: 700 }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.entity_name || u.donor?.name || '—'}</td>
                      <td>
                        <span className={`badge badge-${u.role === 'donor' ? 'approved' : (u.status || 'pending')}`}>
                          {u.role === 'donor' ? 'active' : (u.status || 'pending')}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SYSTEM SUPPLY & DEMAND ANALYTICS */}
      {tab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {loading && !analytics ? (
            <p style={{ color: 'var(--text-secondary)' }}>Compiling analytics...</p>
          ) : analytics ? (
            <Analytics 
              hospitalRequests={analytics.hospitalRequests}
              stationCollections={analytics.stationCollections}
            />
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No analytics stats logged yet.</p>
          )}
        </div>
      )}

      {/* DONATION REMINDERS */}
      {tab === 'reminders' && (
        <div className="dashboard-card animate-fade-in">
          <div className="dashboard-header" style={{ marginBottom: '16px' }}>
            <h2>3-Month Donation Reminders Panel</h2>
            <p>Check the database for donors who last donated more than 3 months (90 days) ago and send them an SMS reminder.</p>
          </div>

          <button 
            onClick={handleTriggerReminders}
            className="btn btn-primary"
            style={{ marginBottom: '20px', alignSelf: 'flex-start' }}
            disabled={remindersLoading}
          >
            {remindersLoading ? 'Checking & Sending...' : 'Trigger 3-Month Reminders'}
          </button>

          {remindersResult && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ background: 'rgba(6,214,160,0.1)', color: '#06d6a0', padding: '14px', borderRadius: '8px', border: '1px solid rgba(6,214,160,0.2)', marginBottom: '16px', fontSize: '0.85rem' }}>
                <strong>{remindersResult.message}</strong>
              </div>

              {remindersResult.details && remindersResult.details.length > 0 ? (
                <div>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', color: 'var(--text-secondary)' }}>Reminded Donors List</h4>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Donor Name</th>
                          <th>Phone Number</th>
                          <th>Last Donation Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {remindersResult.details.map((d, index) => (
                          <tr key={index}>
                            <td data-label="Donor Name" style={{ fontWeight: 600 }}>{d.donor}</td>
                            <td data-label="Phone Number">{d.phone}</td>
                            <td data-label="Last Donation Date" style={{ color: 'var(--text-secondary)' }}>
                              {new Date(d.lastDonation).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No new donors required reminders at this time.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* SYSTEM AUDIT LOGS */}
      {tab === 'audit' && (
        <div className="dashboard-card animate-fade-in">
          <div className="dashboard-header" style={{ marginBottom: '16px' }}>
            <h2>System Workstation Audit Logs</h2>
            <p>Chronological security and action logs for all workstation operations.</p>
          </div>

          {auditLogs.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No audit activities recorded yet.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Workstation User</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Log Details</th>
                    <th>IP Address</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, index) => (
                    <tr key={log.id || index}>
                      <td data-label="Workstation User" style={{ fontWeight: 600 }}>
                        {log.user?.entity_name || 'System'} ({log.user?.email || 'N/A'})
                      </td>
                      <td data-label="Role">
                        <span className="badge" style={{ background: 'rgba(58,134,255,0.1)', color: '#3a86ff', fontSize: '0.72rem' }}>
                          {log.user?.role?.toUpperCase() || 'SYSTEM'}
                        </span>
                      </td>
                      <td data-label="Action">
                        <span style={{ fontWeight: '700', fontSize: '0.78rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                          {log.action}
                        </span>
                      </td>
                      <td data-label="Log Details" style={{ fontSize: '0.82rem' }}>{log.details}</td>
                      <td data-label="IP Address" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{log.ip_address}</td>
                      <td data-label="Timestamp" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PASSWORD RESET REQUEST TICKETS */}
      {tab === 'resets' && (
        <div className="dashboard-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="dashboard-header">
              <h2>Workstation Password Reset Requests</h2>
              <p>Manage pending password reset tickets requested by workstation actors.</p>
            </div>
            <button onClick={loadData} className="btn" style={{ padding: '5px 10px', background: 'transparent', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {successMsg && (
            <div style={{ background: 'rgba(6,214,160,0.1)', color: '#06d6a0', padding: '10px 14px', border: '1px solid rgba(6,214,160,0.2)', borderRadius: '6px', fontSize: '0.82rem' }}>
              <strong>{successMsg}</strong>
            </div>
          )}

          {activeRequest && (
            <div style={{ border: '1px solid rgba(247,127,0,0.25)', background: 'rgba(247,127,0,0.02)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={15} color="#f77f00" /> Reset Password for: <strong style={{ color: '#f77f00' }}>{activeRequest.email}</strong>
                </h4>
                <button onClick={() => { setActiveRequest(null); setTempPassword(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <X size={15} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Temporary New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showTempPassword ? 'text' : 'password'}
                      placeholder="Enter temp password"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', paddingRight: '42px' }}
                    />
                    <button type="button" onClick={() => setShowTempPassword((value) => !value)} title={showTempPassword ? 'Hide password' : 'Show password'} aria-label={showTempPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>{showTempPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </div>
                <button onClick={() => handleResolveReset(activeRequest.id)} className="btn btn-primary" style={{ height: '36px', background: '#f77f00', borderColor: '#f77f00', fontSize: '0.82rem' }} disabled={loading}>
                  Save & Resolve Ticket
                </button>
              </div>
            </div>
          )}

          {resetRequests.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', margin: '10px 0' }}>No password reset requests logged.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Workstation Email</th>
                    <th>Role</th>
                    <th>Entity Name</th>
                    <th>Date Requested</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {resetRequests.map(r => (
                    <tr key={r.id}>
                      <td data-label="Workstation Email" style={{ fontWeight: 600 }}>{r.email}</td>
                      <td data-label="Role">
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: 700 }}>
                          {r.role}
                        </span>
                      </td>
                      <td data-label="Entity Name" style={{ color: 'var(--text-secondary)' }}>{r.entity_name}</td>
                      <td data-label="Date Requested" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td data-label="Status">
                        <span className={`badge badge-${r.status}`}>
                          {r.status}
                        </span>
                      </td>
                      <td data-label="Action" className="cell-actions" style={{ textAlign: 'right' }}>
                        {r.status === 'pending' ? (
                          <button
                            onClick={() => {
                              setActiveRequest(r);
                              setError(null);
                              setSuccessMsg(null);
                            }}
                            className="btn"
                            style={{ padding: '4px 8px', fontSize: '0.72rem', background: 'rgba(247,127,0,0.1)', color: '#f77f00', border: '1px solid rgba(247,127,0,0.2)' }}
                          >
                            Reset Password
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#06d6a0', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Check size={12} /> Resolved
                          </span>
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

    </div>
  );
}
