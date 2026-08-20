import React, { useState, useEffect } from 'react';
import { Users, BarChart3, ToggleLeft, ShieldCheck, ShieldAlert, Activity, Key, Check, X } from 'lucide-react';
import { api } from '../../services/api';
import Analytics from '../../components/common/Analytics';

export default function AdminDashboard({ tab, setTab }) {
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [remindersResult, setRemindersResult] = useState(null);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [registryCategory, setRegistryCategory] = useState('all'); // all, laboratory, station, others

  // Password resets state
  const [resetRequests, setResetRequests] = useState([]);
  const [activeRequest, setActiveRequest] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'users') {
        const usersData = await api.admin.getUsers();
        setUsers(usersData);
      } else if (tab === 'analytics') {
        const stats = await api.admin.getAnalytics();
        setAnalytics(stats);
      } else if (tab === 'audit') {
        const logs = await api.admin.getAuditLogs();
        setAuditLogs(logs);
      } else if (tab === 'resets') {
        const requests = await api.admin.getPasswordResetRequests();
        setResetRequests(requests);
      }
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
    try {
      await api.admin.updateUserStatus(userId, newStatus);
      const usersData = await api.admin.getUsers();
      setUsers(usersData);
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
      // Reload tickets
      const requests = await api.admin.getPasswordResetRequests();
      setResetRequests(requests);
    } catch (err) {
      setError(err.message || 'Failed to resolve password reset.');
    } finally {
      setLoading(false);
    }
  };


  const filteredUsers = users.filter(u => {
    if (registryCategory === 'all') return true;
    if (registryCategory === 'laboratory') return u.role === 'laboratory';
    if (registryCategory === 'station') return u.role === 'station';
    return u.role !== 'laboratory' && u.role !== 'station';
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

      {error && (
        <div className="glass-card" style={{ background: 'rgba(239,35,60,0.1)', color: '#ef233c', padding: '16px', border: '1px solid rgba(239,35,60,0.2)' }}>
          {error}
        </div>
      )}

      {/* USER LIST WORKSTATION REGISTRY */}
      {tab === 'users' && (
        <div className="glass-card animate-fade-in">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Pending Workstation Authorizations</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
            Hospitals, labs, stations, and warehouses must receive administrative approval before they can log in.
          </p>

          {/* Interactive Actor Switcher Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
            {['all', 'laboratory', 'station', 'others'].map(cat => {
              const isActive = registryCategory === cat;
              let label = '';
              let count = 0;
              if (cat === 'all') {
                label = 'All Workstations';
                count = users.length;
              } else if (cat === 'laboratory') {
                label = '🔬 Laboratory';
                count = users.filter(u => u.role === 'laboratory').length;
              } else if (cat === 'station') {
                label = '🏥 Donation Stations';
                count = users.filter(u => u.role === 'station').length;
              } else {
                label = '⚙️ Hospitals & Warehouses';
                count = users.filter(u => u.role !== 'laboratory' && u.role !== 'station').length;
              }

              return (
                <button
                  key={cat}
                  onClick={() => setRegistryCategory(cat)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.8rem',
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
                    fontSize: '0.72rem', 
                    background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', 
                    padding: '1px 6px', 
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
          ) : filteredUsers.length === 0 ? (
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
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.email}</td>
                      <td>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)', fontWeight: 700 }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.entity_name}</td>
                      <td>
                        <span className={`badge badge-${u.status}`}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {u.status !== 'approved' && (
                            <button 
                              onClick={() => handleStatusUpdate(u.id, 'approved')}
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.72rem', background: '#06d6a0', borderColor: '#06d6a0' }}
                              disabled={loading}
                            >
                              <ShieldCheck size={12} /> Approve
                            </button>
                          )}
                          {u.status !== 'rejected' && (
                            <button 
                              onClick={() => handleStatusUpdate(u.id, 'rejected')}
                              className="btn"
                              style={{ padding: '6px 12px', fontSize: '0.72rem', background: 'rgba(239,35,60,0.1)', color: '#ef233c', border: '1px solid rgba(239,35,60,0.2)' }}
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

      {/* SYSTEM SUPPLY & DEMAND ANALYTICS */}
      {tab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
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
        <div className="glass-card animate-fade-in">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>3-Month Donation Reminders Panel</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
            Check the PostgreSQL database for donors who last donated more than 3 months (90 days) ago and send them a reminder SMS using SMSEthiopia. Duplicates are blocked automatically.
          </p>

          <button 
            onClick={handleTriggerReminders}
            className="btn btn-primary"
            style={{ marginBottom: '24px' }}
            disabled={remindersLoading}
          >
            {remindersLoading ? 'Checking & Sending...' : 'Trigger 3-Month Reminders'}
          </button>

          {remindersResult && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ background: 'rgba(6,214,160,0.1)', color: '#06d6a0', padding: '16px', borderRadius: '8px', border: '1px solid rgba(6,214,160,0.2)', marginBottom: '20px' }}>
                <strong>{remindersResult.message}</strong>
              </div>

              {remindersResult.details && remindersResult.details.length > 0 ? (
                <div>
                  <h4 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>Reminded Donors List</h4>
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
                            <td style={{ fontWeight: 600 }}>{d.donor}</td>
                            <td>{d.phone}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>
                              {new Date(d.lastDonation).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No new donors required reminders at this time (all eligible donors have already been texted for their last donation cycle).</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* SYSTEM AUDIT LOGS */}
      {tab === 'audit' && (
        <div className="glass-card animate-fade-in">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>System Workstation Audit Logs</h3>
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
                      <td style={{ fontWeight: 600 }}>
                        {log.user?.entity_name || 'System'} ({log.user?.email || 'N/A'})
                      </td>
                      <td>
                        <span className="badge" style={{ background: 'rgba(58,134,255,0.1)', color: '#3a86ff', fontSize: '0.75rem', padding: '3px 8px' }}>
                          {log.user?.role?.toUpperCase() || 'SYSTEM'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: '700', fontSize: '0.8rem', padding: '3px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{log.details}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.ip_address}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
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
        <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Workstation Password Reset Requests</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                Manage pending password reset tickets requested by workstation actors. Set a temporary secure credential to resolve each.
              </p>
            </div>
            <button onClick={loadData} className="btn" style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
              Refresh Tickets
            </button>
          </div>

          {successMsg && (
            <div style={{ background: 'rgba(6,214,160,0.1)', color: '#06d6a0', padding: '12px', border: '1px solid rgba(6,214,160,0.2)', borderRadius: '6px', fontSize: '0.85rem' }}>
              <strong>{successMsg}</strong>
            </div>
          )}

          {/* Active Resolve Form Block */}
          {activeRequest && (
            <div className="glass-card" style={{ border: '1px solid rgba(247,127,0,0.25)', background: 'rgba(247,127,0,0.02)', padding: '20px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={16} color="#f77f00" /> Reset Password for: <strong style={{ color: '#f77f00' }}>{activeRequest.email}</strong>
                </h4>
                <button onClick={() => { setActiveRequest(null); setTempPassword(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Temporary New Password</label>
                  <input
                    type="text"
                    placeholder="Enter temp password"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <button onClick={() => handleResolveReset(activeRequest.id)} className="btn btn-primary" style={{ height: '38px', background: '#f77f00', borderColor: '#f77f00' }} disabled={loading}>
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
                      <td style={{ fontWeight: 600 }}>{r.email}</td>
                      <td>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)', fontWeight: 700 }}>
                          {r.role}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{r.entity_name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge badge-${r.status}`}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {r.status === 'pending' ? (
                          <button
                            onClick={() => {
                              setActiveRequest(r);
                              setError(null);
                              setSuccessMsg(null);
                            }}
                            className="btn"
                            style={{ padding: '4px 10px', fontSize: '0.72rem', background: 'rgba(247,127,0,0.1)', color: '#f77f00', border: '1px solid rgba(247,127,0,0.2)' }}
                          >
                            Reset Password
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#06d6a0', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Check size={13} /> Resolved
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
