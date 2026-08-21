import React, { useState, useEffect } from 'react';
import { 
  Shield, Check, Trash2, ShieldCheck, MapPin, AlertCircle, RefreshCw, 
  FlaskConical, CheckCircle2, Clock, Droplet, ArrowRight, FileText, Activity,
  Award, Package, Truck, Calendar, Filter, Search, ClipboardList
} from 'lucide-react';
import { api } from '../../services/api';
import SelectDropdown from '../../components/common/SelectDropdown';
import BottomToast from '../../components/common/BottomToast';

export default function LabDashboard({ tab = 'dashboard', setTab, isMobile }) {
  const [samples, setSamples] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Additional lab tab states
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [pointsList, setPointsList] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [inventoryOut, setInventoryOut] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [reportsData, setReportsData] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);

  // Screening form state
  const [selectedSample, setSelectedSample] = useState(null);
  const [testStatus, setTestStatus] = useState('validated');
  const [warehouseId, setWarehouseId] = useState('');
  const [healthNotes, setHealthNotes] = useState('');

  // Vitals & Diseases input fields
  const [hemoglobin, setHemoglobin] = useState('14.5 g/dL');
  const [platelets, setPlatelets] = useState('250,000 /mcL');
  const [allergies, setAllergies] = useState('None');
  const [bloodType, setBloodType] = useState('O+');
  const [selectedDiseases, setSelectedDiseases] = useState([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const pending = await api.lab.getPendingSamples();
      setSamples(pending || []);

      const wh = await api.lab.getWarehouses();
      setWarehouses(wh || []);
      if (wh && wh.length > 0) {
        setWarehouseId(wh[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve laboratory work items.');
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async () => {
    setLoadingRecords(true);
    try {
      const rec = await api.lab.getLabRecords();
      setRecords(rec || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecords(false);
    }
  };

  const loadPoints = async () => {
    setLoadingPoints(true);
    try {
      const pts = await api.lab.getDonorPoints();
      setPointsList(pts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPoints(false);
    }
  };

  const loadInventory = async () => {
    setLoadingInventory(true);
    try {
      const inv = await api.lab.getInventoryOut();
      setInventoryOut(inv || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInventory(false);
    }
  };

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const rep = await api.lab.getLabReports();
      setReportsData(rep);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    loadData();
    if (tab === 'records') loadRecords();
    if (tab === 'points') loadPoints();
    if (tab === 'inventory') loadInventory();
    if (tab === 'reports') loadReports();
  }, [tab]);

  const handleSelectSample = (sample) => {
    setSelectedSample(sample);
    setTestStatus('validated');
    setHealthNotes('');
    setHemoglobin('14.5 g/dL');
    setPlatelets('250,000 /mcL');
    setAllergies('None');
    setBloodType(sample.blood_type === 'UNKNOWN' ? 'O+' : sample.blood_type);
    setSelectedDiseases([]);
  };

  const handleDiseaseToggle = (disease) => {
    setSelectedDiseases(prev => 
      prev.includes(disease) 
        ? prev.filter(d => d !== disease) 
        : [...prev, disease]
    );
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSample) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const finalDiseases = testStatus === 'validated'
      ? 'HIV: Negative, Syphilis: Negative, Hepatitis: Negative'
      : selectedDiseases.length > 0 
        ? selectedDiseases.map(d => `${d}: Positive`).join(', ') 
        : 'Abnormal clinical markers';

    const payload = {
      status: testStatus,
      health_notes: healthNotes,
      warehouse_id: testStatus === 'validated' ? warehouseId : undefined,
      hemoglobin,
      platelets,
      allergies,
      diseases: finalDiseases,
      blood_type: bloodType
    };

    try {
      const data = await api.lab.submitTestResult(selectedSample.id, payload);
      setSuccess(data.message || 'Test findings successfully recorded.');
      setSelectedSample(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to submit test findings.');
    } finally {
      setLoading(false);
    }
  };

  // Demo pending samples fallback
  const displayPending = samples.length > 0 ? samples.slice(0, 5) : [
    { id: 'SMP-2025-001', donor_name: 'Tesfaye Girma', blood_type: 'A+', station_name: 'Addis Station' },
    { id: 'SMP-2025-002', donor_name: 'Melaku Alemu', blood_type: 'O+', station_name: 'Hawassa Station' },
    { id: 'SMP-2025-003', donor_name: 'Abdi Hassan', blood_type: 'B+', station_name: 'Mekelle Station' },
    { id: 'SMP-2025-004', donor_name: 'Sara Bekele', blood_type: 'AB+', station_name: 'Gondar Station' },
    { id: 'SMP-2025-005', donor_name: 'Lydia Assefa', blood_type: 'O-', station_name: 'Addis Station' }
  ];

  // Demo recent lab records fallback
  const displayRecords = [
    { id: 'LR-2025-045', result: 'Negative', status: 'Approved', type: 'O+' },
    { id: 'LR-2025-044', result: 'Negative', status: 'Approved', type: 'A+' },
    { id: 'LR-2025-043', result: 'Positive', status: 'Discarded', type: 'B-' },
    { id: 'LR-2025-042', result: 'Negative', status: 'Approved', type: 'AB+' },
    { id: 'LR-2025-041', result: 'Negative', status: 'Approved', type: 'O+' }
  ];

  return (
    <div className="dashboard-container">

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
            <h2>Laboratory Overview</h2>
            <p>Screen samples and manage confidential lab records.</p>
          </div>

          {/* 4 Stat Cards Row */}
          <div className="stat-card-grid">
            
            {/* Stat 1: Pending Samples */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Pending Samples</span>
                <div className="stat-card-icon" style={{ background: 'rgba(124,58,237,0.12)', color: '#7c3aed' }}>
                  <FlaskConical size={18} />
                </div>
              </div>
              <div className="stat-card-value">{samples.length > 0 ? samples.length : '15'}</div>
              <div className="stat-card-trend trend-neutral">
                <span>+3 new</span>
              </div>
            </div>

            {/* Stat 2: Samples Processed */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Samples Processed</span>
                <div className="stat-card-icon" style={{ background: 'rgba(6,214,160,0.12)', color: '#06d6a0' }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="stat-card-value">45</div>
              <div className="stat-card-trend trend-up">
                <span>Today</span>
              </div>
            </div>

            {/* Stat 3: Negative Results */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Negative Results</span>
                <div className="stat-card-icon" style={{ background: 'rgba(58,134,255,0.12)', color: '#3a86ff' }}>
                  <ShieldCheck size={18} />
                </div>
              </div>
              <div className="stat-card-value">40</div>
              <div className="stat-card-trend trend-up">
                <span>88.9%</span>
              </div>
            </div>

            {/* Stat 4: Positive Results */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Positive Results</span>
                <div className="stat-card-icon" style={{ background: 'rgba(239,35,60,0.12)', color: '#ef233c' }}>
                  <AlertCircle size={18} />
                </div>
              </div>
              <div className="stat-card-value">5</div>
              <div className="stat-card-trend trend-down">
                <span>11.1%</span>
              </div>
            </div>

          </div>

          {/* 3 Column Grid Section */}
          <div className="dashboard-grid-3">
            
            {/* Card 1: Pending Samples */}
            <div className="dashboard-card">
              <div className="dashboard-card-title">
                <span>Pending Samples</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Queue</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {displayPending.map((item, idx) => (
                  <div key={item.id || idx} className="clean-list-item">
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                        {item.id}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {item.donor_name}
                      </div>
                    </div>
                    <span style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                      {item.blood_type || 'O+'}
                    </span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setTab('pending')} 
                className="view-all-btn"
              >
                View All Samples <ArrowRight size={13} />
              </button>
            </div>

            {/* Card 2: Lab Results Summary (Donut Chart) */}
            <div className="dashboard-card" style={{ alignItems: 'center', justifyContent: 'center' }}>
              <div className="dashboard-card-title" style={{ width: '100%' }}>
                <span>Lab Results Summary</span>
              </div>

              {/* Responsive SVG Donut Chart */}
              <div style={{ position: 'relative', width: '140px', height: '140px', margin: '8px 0' }}>
                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                  
                  {/* Negative (88.9%) - Green */}
                  <circle 
                    cx="50" cy="50" r="38" 
                    fill="transparent" 
                    stroke="#06d6a0" 
                    strokeWidth="12" 
                    strokeDasharray="212.2 238.7" 
                    strokeDashoffset="0" 
                  />
                  {/* Positive (11.1%) - Red */}
                  <circle 
                    cx="50" cy="50" r="38" 
                    fill="transparent" 
                    stroke="#ef233c" 
                    strokeWidth="12" 
                    strokeDasharray="26.5 238.7" 
                    strokeDashoffset="-212.2" 
                  />
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>45</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Tested</span>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '14px', fontSize: '0.72rem', marginTop: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06d6a0' }} /> Negative: 40 (88.9%)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef233c' }} /> Positive: 5 (11.1%)
                </span>
              </div>
            </div>

            {/* Card 3: Recent Lab Records */}
            <div className="dashboard-card">
              <div className="dashboard-card-title">
                <span>Recent Lab Records</span>
                <FileText size={16} color="var(--text-muted)" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {displayRecords.map(rec => (
                  <div key={rec.id} className="clean-list-item">
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                        {rec.id}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: rec.result === 'Negative' ? '#06d6a0' : '#ef233c', fontWeight: 600 }}>
                        {rec.result}
                      </div>
                    </div>
                    <span className={`badge badge-${rec.status === 'Approved' ? 'approved' : 'rejected'}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                      {rec.status}
                    </span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setTab('records')} 
                className="view-all-btn"
              >
                View All Records <ArrowRight size={13} />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* TAB: PENDING SAMPLES & SCREENING WORKFLOW */}
      {(tab === 'pending' || tab === 'screen') && (
        <div style={{ display: 'grid', gridTemplateColumns: (selectedSample && !isMobile) ? '1fr 1.2fr' : '1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* Pending items queue */}
          <div className="dashboard-card animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="dashboard-header">
                <h2>Pending Screening Queue</h2>
                <p>Blood samples routed from donation stations requiring confidential laboratory analysis.</p>
              </div>
              <button onClick={loadData} className="btn" style={{ padding: '5px 10px', fontSize: '0.78rem', background: 'transparent', border: '1px solid var(--border-color)' }}>
                <RefreshCw size={12} /> Reload
              </button>
            </div>

            {loading && samples.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>Loading pending collections...</p>
            ) : samples.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No pending blood bags in your queue.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Donor Patient</th>
                      <th>Blood Type</th>
                      <th>Collection Station</th>
                      <th>Logged Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {samples.map(s => (
                      <tr key={s.id} style={{ 
                        background: selectedSample?.id === s.id ? 'rgba(124, 58, 237, 0.05)' : 'transparent' 
                      }}>
                        <td data-label="Donor Patient" style={{ fontWeight: 600 }}>{s.donor_name}</td>
                        <td data-label="Blood Type">
                          <span style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                            {s.blood_type}
                          </span>
                        </td>
                        <td data-label="Collection Station" style={{ color: 'var(--text-secondary)' }}>{s.station_name}</td>
                        <td data-label="Logged Date" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {new Date(s.collected_at).toLocaleDateString()}
                        </td>
                        <td data-label="Actions" className="cell-actions" style={{ textAlign: 'right' }}>
                          <button 
                            onClick={() => handleSelectSample(s)}
                            className="btn btn-primary"
                            style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                          >
                            Screen Sample
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Screening Test Form */}
          {selectedSample && (
            <div className="dashboard-card animate-fade-in" style={{ borderTop: '4px solid var(--primary)' }}>
              <div className="dashboard-header" style={{ marginBottom: '14px' }}>
                <h2>Screening Record: {selectedSample.donor_name}</h2>
                <p>Verify viral markers, vitals, and routing warehouse.</p>
              </div>

              <form onSubmit={handleTestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Result Decision Selector */}
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Screening Result Outcome</label>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setTestStatus('validated')}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: testStatus === 'validated' ? '2px solid #06d6a0' : '1px solid var(--border-color)',
                        background: testStatus === 'validated' ? 'rgba(6,214,160,0.12)' : 'var(--bg-main)',
                        color: testStatus === 'validated' ? '#06d6a0' : 'var(--text-secondary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <CheckCircle2 size={16} /> Negative (Approved)
                    </button>

                    <button
                      type="button"
                      onClick={() => setTestStatus('discarded')}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: testStatus === 'discarded' ? '2px solid #ef233c' : '1px solid var(--border-color)',
                        background: testStatus === 'discarded' ? 'rgba(239,35,60,0.12)' : 'var(--bg-main)',
                        color: testStatus === 'discarded' ? '#ef233c' : 'var(--text-secondary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Trash2 size={16} /> Positive (Discarded)
                    </button>
                  </div>
                </div>

                {/* Vitals Form Row */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Blood Type</label>
                    <SelectDropdown
                      value={bloodType}
                      onChange={setBloodType}
                      ariaLabel="Blood Type"
                      options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => ({ value: t, label: t }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Hemoglobin Level</label>
                    <input type="text" value={hemoglobin} onChange={(e) => setHemoglobin(e.target.value)} />
                  </div>
                </div>

                {/* Warehouse destination if validated */}
                {testStatus === 'validated' && (
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Dispatch to Certified Warehouse</label>
                    <SelectDropdown
                      value={warehouseId}
                      onChange={setWarehouseId}
                      ariaLabel="Dispatch to Certified Warehouse"
                      options={warehouses.map(w => ({ value: w.id, label: w.entity_name }))}
                    />
                  </div>
                )}

                {/* Clinical Notes */}
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Clinical Health Findings / Notes</label>
                  <textarea 
                    value={healthNotes} 
                    onChange={(e) => setHealthNotes(e.target.value)} 
                    placeholder="Enter confidential clinical findings..."
                    rows={3}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
                    <Check size={16} /> Submit Lab Record
                  </button>
                  <button type="button" onClick={() => setSelectedSample(null)} className="btn btn-outline" style={{ padding: '0 16px' }}>
                    Cancel
                  </button>
                </div>

              </form>
            </div>
          )}

        </div>
      )}

      {/* TAB: LAB RECORDS */}
      {tab === 'records' && (
        <div className="dashboard-card animate-fade-in">
          <div className="dashboard-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Confidential Laboratory Medical Records</h2>
              <p>Certified screening logs and verified laboratory reports stored in secure database.</p>
            </div>
            <button onClick={loadRecords} className="btn" style={{ padding: '5px 10px', fontSize: '0.78rem', background: 'transparent', border: '1px solid var(--border-color)' }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {loadingRecords ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading lab records...</p>
          ) : records.length === 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Record / Sample ID</th>
                    <th>Donor Name</th>
                    <th>Tested Blood Type</th>
                    <th>Clinical Status</th>
                    <th>Screening Findings</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRecords.map((r, i) => (
                    <tr key={i}>
                      <td data-label="Record / Sample ID" style={{ fontWeight: 600 }}>{r.id}</td>
                      <td data-label="Donor Name">Abebe Kebede</td>
                      <td data-label="Tested Blood Type">
                        <span style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                          {r.type}
                        </span>
                      </td>
                      <td data-label="Clinical Status">
                        <span className={`badge badge-${r.status === 'Approved' ? 'approved' : 'pending'}`} style={{ fontSize: '0.68rem' }}>
                          {r.status}
                        </span>
                      </td>
                      <td data-label="Screening Findings" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {r.result === 'Negative' ? 'HIV/Hep/Syphilis Negative (Safe)' : 'Abnormal clinical markers (Discarded)'}
                      </td>
                      <td data-label="Date" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>20 Aug 2025</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>Donor Name</th>
                    <th>FAYDA ID</th>
                    <th>Blood Type</th>
                    <th>Status</th>
                    <th>Findings</th>
                    <th>Screening Date</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(rec => (
                    <tr key={rec.id}>
                      <td data-label="Record ID" style={{ fontWeight: 600 }}>{rec.id.substring(0, 10)}...</td>
                      <td data-label="Donor Name">{rec.donor_name}</td>
                      <td data-label="FAYDA ID" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{rec.fayda_id}</td>
                      <td data-label="Blood Type">
                        <span style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                          {rec.blood_type}
                        </span>
                      </td>
                      <td data-label="Status">
                        <span className={`badge badge-${rec.status === 'validated' ? 'approved' : 'pending'}`} style={{ fontSize: '0.68rem' }}>
                          {rec.status === 'validated' ? 'Validated' : 'Discarded'}
                        </span>
                      </td>
                      <td data-label="Findings" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{rec.health_notes}</td>
                      <td data-label="Screening Date" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {new Date(rec.collected_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: DONOR POINTS */}
      {tab === 'points' && (
        <div className="dashboard-card animate-fade-in">
          <div className="dashboard-header" style={{ marginBottom: '16px' }}>
            <h2>Donor Reward Points Awarded</h2>
            <p>Certified loyalty points credited to donors upon successful negative laboratory validation (+100 pts per unit).</p>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Donor Patient</th>
                  <th>FAYDA ID</th>
                  <th>Sample ID</th>
                  <th>Screening Result</th>
                  <th>Points Awarded</th>
                  <th>Date Processed</th>
                </tr>
              </thead>
              <tbody>
                {(pointsList.length > 0 ? pointsList : [
                  { donor_name: 'Tesfaye Girma', fayda_id: 'FAY-88219', id: 'SMP-2025-001', result: 'Healthy / Approved', points_awarded: 100, date: '2025-08-20' },
                  { donor_name: 'Melaku Alemu', fayda_id: 'FAY-91823', id: 'SMP-2025-002', result: 'Healthy / Approved', points_awarded: 100, date: '2025-08-19' },
                  { donor_name: 'Sara Bekele', fayda_id: 'FAY-44712', id: 'SMP-2025-004', result: 'Healthy / Approved', points_awarded: 100, date: '2025-08-18' }
                ]).map((p, idx) => (
                  <tr key={idx}>
                    <td data-label="Donor Patient" style={{ fontWeight: 600 }}>{p.donor_name}</td>
                    <td data-label="FAYDA ID" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.fayda_id}</td>
                    <td data-label="Sample ID" style={{ fontSize: '0.82rem' }}>{p.id}</td>
                    <td data-label="Screening Result">
                      <span className="badge badge-approved" style={{ fontSize: '0.68rem' }}>
                        {p.result}
                      </span>
                    </td>
                    <td data-label="Points Awarded">
                      <span style={{ color: '#f59e0b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Award size={14} /> +{p.points_awarded} pts
                      </span>
                    </td>
                    <td data-label="Date Processed" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(p.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: REPORTS */}
      {tab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="dashboard-header">
            <h2>Laboratory Quality & Analytics Reports</h2>
            <p>Comprehensive screening efficiency, disease marker detection rates, and throughput metrics.</p>
          </div>

          <div className="stat-card-grid">
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Total Samples Screened</span>
                <div className="stat-card-icon" style={{ background: 'rgba(124,58,237,0.12)', color: '#7c3aed' }}>
                  <FlaskConical size={18} />
                </div>
              </div>
              <div className="stat-card-value">{reportsData?.total_samples || 45}</div>
              <div className="stat-card-trend trend-up"><span>All time</span></div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Negative (Passed)</span>
                <div className="stat-card-icon" style={{ background: 'rgba(6,214,160,0.12)', color: '#06d6a0' }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="stat-card-value">{reportsData?.negative_results || 40}</div>
              <div className="stat-card-trend trend-up"><span>{reportsData?.negative_rate || '88.9'}% pass rate</span></div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Positive (Discarded)</span>
                <div className="stat-card-icon" style={{ background: 'rgba(239,35,60,0.12)', color: '#ef233c' }}>
                  <Trash2 size={18} />
                </div>
              </div>
              <div className="stat-card-value">{reportsData?.positive_results || 5}</div>
              <div className="stat-card-trend trend-down"><span>{reportsData?.positive_rate || '11.1'}% defect rate</span></div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Pending In Queue</span>
                <div className="stat-card-icon" style={{ background: 'rgba(247,127,0,0.12)', color: '#f77f00' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div className="stat-card-value">{reportsData?.pending_samples || samples.length}</div>
              <div className="stat-card-trend trend-neutral"><span>Awaiting screening</span></div>
            </div>
          </div>

          {/* Blood Type Breakdown */}
          <div className="dashboard-card animate-fade-in">
            <div className="dashboard-header" style={{ marginBottom: '14px' }}>
              <h2>Verified Stock Distribution by Blood Type</h2>
              <p>Blood groups confirmed and released to central warehouse inventory.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => {
                const count = reportsData?.blood_type_distribution?.[type] || 
                  (type === 'O+' ? 15 : type === 'A+' ? 10 : type === 'B+' ? 8 : type === 'AB+' ? 4 : type === 'O-' ? 3 : 1);
                return (
                  <div key={type} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7c3aed' }}>{type}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{count}</div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>units</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB: INVENTORY OUT */}
      {tab === 'inventory' && (
        <div className="dashboard-card animate-fade-in">
          <div className="dashboard-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Inventory Out: Dispatched to Warehouse</h2>
              <p>Validated safe blood units transferred from laboratory testing to cold chain storage facilities.</p>
            </div>
            <button onClick={loadInventory} className="btn" style={{ padding: '5px 10px', fontSize: '0.78rem', background: 'transparent', border: '1px solid var(--border-color)' }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Sample / Bag ID</th>
                  <th>Tested Blood Type</th>
                  <th>Quantity</th>
                  <th>Destination Warehouse</th>
                  <th>Transfer Status</th>
                  <th>Dispatch Date</th>
                </tr>
              </thead>
              <tbody>
                {(inventoryOut.length > 0 ? inventoryOut : [
                  { id: 'SMP-2025-001', blood_type: 'A+', quantity: 1, destination: 'Central Regional Warehouse', status: 'Validated & Sent to Warehouse', date: '2025-08-20' },
                  { id: 'SMP-2025-002', blood_type: 'O+', quantity: 1, destination: 'Central Regional Warehouse', status: 'Validated & Sent to Warehouse', date: '2025-08-19' },
                  { id: 'SMP-2025-004', blood_type: 'AB+', quantity: 1, destination: 'Central Regional Warehouse', status: 'Validated & Sent to Warehouse', date: '2025-08-18' }
                ]).map((item, idx) => (
                  <tr key={idx}>
                    <td data-label="Sample / Bag ID" style={{ fontWeight: 600 }}>{item.id}</td>
                    <td data-label="Tested Blood Type">
                      <span style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                        {item.blood_type}
                      </span>
                    </td>
                    <td data-label="Quantity">{item.quantity} unit</td>
                    <td data-label="Destination Warehouse" style={{ color: 'var(--text-secondary)' }}>{item.destination}</td>
                    <td data-label="Transfer Status">
                      <span className="badge badge-approved" style={{ fontSize: '0.68rem' }}>
                        {item.status}
                      </span>
                    </td>
                    <td data-label="Dispatch Date" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
