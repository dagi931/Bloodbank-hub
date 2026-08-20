import React, { useState, useEffect } from 'react';
import { Package, Truck, Megaphone, PlusCircle, Calendar, MapPin, RefreshCw, Send, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';
import { io } from 'socket.io-client';

export default function WarehouseDashboard({ tab, setTab }) {
  const [stock, setStock] = useState([]);
  const [requests, setRequests] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Announcement form state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState('campaign'); // campaign, station
  const [annLocation, setAnnLocation] = useState('');
  const [annStart, setAnnStart] = useState('');
  const [annEnd, setAnnEnd] = useState('');

  // Emergency Alert state
  const [alertingType, setAlertingType] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [expiringBags, setExpiringBags] = useState([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const stockLevels = await api.warehouse.getStock();
      // Ensure all 8 blood types are represented
      const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      const mappedStock = bloodTypes.map(type => {
        const found = stockLevels.find(s => s.blood_type === type);
        return {
          blood_type: type,
          quantity: found ? found.quantity : 0
        };
      });
      setStock(mappedStock);

      const incoming = await api.warehouse.getRequests();
      setRequests(incoming);

      const published = await api.warehouse.getAnnouncements();
      setAnnouncements(published);

      const expiring = await api.warehouse.getExpiringBags();
      setExpiringBags(Array.isArray(expiring) ? expiring : []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve inventory details.');
      setExpiringBags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);
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
      
      // Reset form
      setAnnTitle('');
      setAnnContent('');
      setAnnType('campaign');
      setAnnLocation('');
      setAnnStart('');
      setAnnEnd('');

      // Reload announcements
      const published = await api.warehouse.getAnnouncements();
      setAnnouncements(published);
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Real-Time WebSocket Alerts */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {alerts.map(alert => (
            <div 
              key={alert.id} 
              style={{ 
                background: 'rgba(239,71,111,0.1)', 
                color: '#ef476f', 
                padding: '12px 18px', 
                borderRadius: '8px', 
                border: '1px solid rgba(239,71,111,0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                animation: 'slideIn 0.3s ease-out'
              }}
            >
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{alert.message}</span>
              <button 
                onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', padding: '0 5px' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      
      {error && (
        <div className="glass-card" style={{ background: 'rgba(239,35,60,0.1)', color: '#ef233c', padding: '16px', border: '1px solid rgba(239,35,60,0.2)' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="glass-card" style={{ background: 'rgba(58,134,255,0.1)', color: '#3a86ff', padding: '16px', border: '1px solid rgba(58,134,255,0.2)' }}>
          {success}
        </div>
      )}

      {/* INVENTORY WORKSPACE */}
      {tab === 'inventory' && (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 4fr', gap: '30px', alignItems: 'start' }}>
          
          {/* Stock inventory grid & Expiring Soon panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Central Stock Inventory</h3>
                </div>
                <button onClick={loadData} className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                {stock.map((item, idx) => {
                  const isLow = item.quantity < 5;
                  return (
                    <div key={idx} style={{ 
                      background: isLow ? 'rgba(239,35,60,0.02)' : 'rgba(255,255,255,0.01)', 
                      border: isLow ? '1px solid rgba(239,35,60,0.15)' : '1px solid rgba(255,255,255,0.05)',
                      padding: '14px', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge-blood-type" style={{ fontSize: '1rem', padding: '6px 12px' }}>{item.blood_type}</span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: item.quantity > 0 ? '#06d6a0' : 'var(--text-secondary)' }}>
                            {item.quantity}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>blood bags</div>
                        </div>
                      </div>

                      {isLow && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239,35,60,0.05)', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(239,35,60,0.1)', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#ef233c', fontWeight: 'bold' }}>⚠️ Low Stock</span>
                          <button
                            onClick={() => handleSendEmergencyAlert(item.blood_type)}
                            disabled={alertingType !== null}
                            className="btn btn-primary"
                            style={{ 
                              padding: '3px 8px', 
                              fontSize: '0.7rem', 
                              background: '#ef233c', 
                              borderColor: '#ef233c',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {alertingType === item.blood_type ? (
                              'Sending...'
                            ) : (
                              <>
                                <Send size={10} /> Alert Donors
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expiring Soon panel */}
            <div className="glass-card" style={{ border: (expiringBags || []).length > 0 ? '1px solid rgba(239,35,60,0.25)' : '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <ShieldAlert size={20} color={(expiringBags || []).length > 0 ? '#ef233c' : 'var(--text-secondary)'} />
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Expiring Soon (5 Days or Less)</h3>
              </div>

              {(expiringBags || []).length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>No blood bags currently close to expiration.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ color: '#ef233c', fontSize: '0.78rem', fontWeight: 600, margin: '0 0 4px 0' }}>
                    ⚠️ The following blood bags must be utilized or dispatched beforehand to prevent spoilage:
                  </p>
                  {(expiringBags || []).map((bag, idx) => {
                    const expiryDate = new Date(new Date(bag.collected_at).getTime() + 35 * 24 * 60 * 60 * 1000);
                    const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={idx} style={{ 
                        background: 'rgba(239,35,60,0.03)', 
                        border: '1px solid rgba(239,35,60,0.12)', 
                        padding: '12px', 
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            Blood Bag ID: <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{bag.id.substring(0, 8)}</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Collected: {new Date(bag.collected_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className="badge-blood-type" style={{ marginRight: '8px', padding: '3px 8px', fontSize: '0.75rem' }}>{bag.blood_type}</span>
                          <span style={{ fontSize: '0.78rem', color: '#ef233c', fontWeight: 'bold' }}>
                            {daysLeft} days left
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Hospital dispatch queue */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Hospital Requisition queue</h3>
            {requests.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No pending hospital requisition orders.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Hospital Facility</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Stock Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(r => {
                      const availableStock = stock.find(s => s.blood_type === r.blood_type)?.quantity || 0;
                      const hasSufficient = availableStock >= r.units_needed;
                   return (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 600 }}>{r.hospital_name}</td>
                          <td>
                            <span className="badge-blood-type">{r.blood_type}</span>
                          </td>
                          <td style={{ fontWeight: 'bold' }}>{r.units_needed} bags</td>
                          <td style={{ fontSize: '0.8rem', color: hasSufficient ? '#06d6a0' : '#ef233c' }}>
                            {hasSufficient ? `Sufficient (${availableStock} bags)` : `Insufficient (${availableStock} bags)`}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleFulfillRequest(r.id)}
                              className="btn btn-primary"
                              style={{ 
                                padding: '6px 12px', 
                                fontSize: '0.75rem',
                                background: hasSufficient ? '#06d6a0' : 'rgba(255,255,255,0.05)',
                                borderColor: hasSufficient ? '#06d6a0' : 'rgba(255,255,255,0.1)',
                                color: hasSufficient ? '#000' : 'var(--text-muted)'
                              }}
                              disabled={loading || !hasSufficient}
                            >
                              <Truck size={12} /> Dispatch
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* MANAGE ANNOUNCEMENTS */}
      {tab === 'announcements' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '30px', alignItems: 'start' }}>
          
          {/* Write announcement form */}
          <div className="glass-card" style={{ borderTop: '4px solid var(--primary)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Publish Campaign Drive</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Publish news about blood collection campaigns or temporary collection stations.
            </p>

            <form onSubmit={handleAnnouncementSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Announcement Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Meskel Square Grand Blood Drive"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Post Type
                  </label>
                  <select value={annType} onChange={(e) => setAnnType(e.target.value)} style={{ width: '100%' }}>
                    <option value="campaign">General Drive Campaign</option>
                    <option value="station">Temporary Station Details</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Station Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bole Medhanialem Mall"
                    value={annLocation}
                    onChange={(e) => setAnnLocation(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={annStart}
                    onChange={(e) => setAnnStart(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={annEnd}
                    onChange={(e) => setAnnEnd(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Campaign Description
                </label>
                <textarea
                  placeholder="Detail the hours of operation, urgent blood types needed..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  rows={4}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                <Send size={16} /> Broadcast Announcement
              </button>
            </form>
          </div>

          {/* Published announcements list */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Your Published Announcements</h3>
            {announcements.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>You haven't published any announcements yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {announcements.map((ann, idx) => (
                  <div key={ann.id || idx} style={{ 
                    border: '1px solid rgba(255,255,255,0.05)', 
                    padding: '16px', 
                    borderRadius: '8px', 
                    background: 'rgba(255,255,255,0.01)' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="badge" style={{ fontSize: '0.7rem', textTransform: 'uppercase', background: 'rgba(239,35,60,0.1)', color: 'var(--primary)' }}>
                        {ann.type}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(ann.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem' }}>{ann.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4 }}>{ann.content}</p>
                    
                    {ann.station_location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <MapPin size={10} /> Location: <strong>{ann.station_location}</strong>
                      </div>
                    )}
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
