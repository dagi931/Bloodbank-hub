import React, { useState, useEffect } from 'react';
import { 
  Search, PlusCircle, UserCheck, UserX, AlertTriangle, RefreshCw, 
  Activity, Users, Clock, CheckCircle2, Droplet, ArrowRight, ShieldCheck, 
  ClipboardList, Check, Database, Wifi, WifiOff, FileText, Calendar, Filter 
} from 'lucide-react';
import { api } from '../../services/api';
import SelectDropdown from '../../components/common/SelectDropdown';
import BottomToast from '../../components/common/BottomToast';

const DB_NAME = 'BloodBankStationOffline';
const DB_VERSION = 1;
const STORE_NAME = 'offline_registrations';
const QUESTIONNAIRE = [
  { key: 'tattoo', label: 'Have you had a tattoo or piercing within the last 6 months?' },
  { key: 'medication', label: 'Are you currently taking antibiotics, aspirin, or other medication that affects donation?' },
  { key: 'surgery', label: 'Have you had major surgery within the last 6 months?' },
  { key: 'malaria', label: 'Have you had malaria or a fever within the last 3 months?' },
  { key: 'unwell', label: 'Are you feeling sick, feverish, or unwell today?' },
  { key: 'hivHistory', label: 'Have you had a recent high-risk disease exposure or diagnosis?' },
];

function openOfflineDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'tempId' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function saveOfflineRegistration(registration) {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const tempId = 'offline-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    store.add({ ...registration, tempId });
    tx.oncomplete = () => resolve(tempId);
    tx.onerror = (e) => reject(e.target.error);
  });
}

async function getOfflineRegistrations() {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function deleteOfflineRegistration(tempId) {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(tempId);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

export default function StationDashboard({ tab = 'dashboard', setTab, isMobile }) {
  const [queryId, setQueryId] = useState('');
  const [searched, setSearched] = useState(false);
  const [donorResult, setDonorResult] = useState(null);
  const [existingSample, setExistingSample] = useState(null);
  const [donorAppointment, setDonorAppointment] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [labs, setLabs] = useState([]);
  const [samples, setSamples] = useState([]);

  // Forms states
  const [selectedLabId, setSelectedLabId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Donors List & Reports states
  const [donorsList, setDonorsList] = useState([]);
  const [donorSearchTerm, setDonorSearchTerm] = useState('');
  const [donorBloodTypeFilter, setDonorBloodTypeFilter] = useState('ALL');
  const [loadingDonors, setLoadingDonors] = useState(false);
  const [reportsData, setReportsData] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);

  // Offline states
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const loadOfflineCount = async () => {
    try {
      const items = await getOfflineRegistrations();
      setOfflineCount(items.length);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDonorsList = async () => {
    setLoadingDonors(true);
    try {
      const list = await api.station.getDonorsList();
      setDonorsList(list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDonors(false);
    }
  };

  const loadReportsData = async () => {
    setLoadingReports(true);
    try {
      const rep = await api.station.getReports();
      setReportsData(rep);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReports(false);
    }
  };

  // New Donor Form details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('1995-01-01');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('Addis Ababa, Ethiopia');
  const [bloodType, setBloodType] = useState('O+');
  const [vitals, setVitals] = useState({ hemoglobin: '', heart_rate: '', blood_pressure: '', temperature: '', weight: '' });

  // Screening questionnaire state
  const [questionnaire, setQuestionnaire] = useState({
    tattoo: '',
    medication: '',
    surgery: '',
    malaria: '',
    unwell: '',
    hivHistory: ''
  });
  const [questionnaireStep, setQuestionnaireStep] = useState(0);
  const [questionnaireFailure, setQuestionnaireFailure] = useState(null);

  const resetQuestionnaire = () => {
    setQuestionnaire({ tattoo: '', medication: '', surgery: '', malaria: '', unwell: '', hivHistory: '' });
    setQuestionnaireStep(0);
    setQuestionnaireFailure(null);
    setVitals({ hemoglobin: '', heart_rate: '', blood_pressure: '', temperature: '', weight: '' });
  };

  const handleQuestionnaireChange = (key, value) => {
    setQuestionnaire(prev => ({ ...prev, [key]: value }));
    if (value === 'Yes') {
      const question = QUESTIONNAIRE.find(item => item.key === key);
      setQuestionnaireFailure(`Donation cannot continue: ${question.label}`);
      return;
    }
    setQuestionnaireFailure(null);
    setQuestionnaireStep(prev => Math.min(prev + 1, QUESTIONNAIRE.length));
  };

  const questionnaireFailed = Boolean(questionnaireFailure);
  const questionnaireComplete = questionnaireStep >= QUESTIONNAIRE.length && !questionnaireFailed;
  const vitalsComplete = Object.values(vitals).every(Boolean);
  const screeningComplete = questionnaireComplete && vitalsComplete;

  const fetchLabsAndSamples = async () => {
    setLoading(true);
    try {
      const samplesList = await api.station.getSamples();
      setSamples(samplesList || []);

      const approvedLabs = await api.station.getLabs();
      setLabs(approvedLabs || []);
      if (approvedLabs && approvedLabs.length > 0) {
        setSelectedLabId(approvedLabs[0].id);
      }
      await loadOfflineCount();
    } catch (err) {
      setError('Failed to fetch station logs or laboratory resources.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabsAndSamples();
  }, []);

  useEffect(() => {
    if (tab === 'donors') loadDonorsList();
    if (tab === 'reports') loadReportsData();
  }, [tab]);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!queryId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    setSearched(false);

    try {
      const data = await api.station.lookupDonor(queryId);
      resetQuestionnaire();

      if (data.found) {
        setDonorResult(data.donor);
        setExistingSample(data.existing_sample || null);
        setDonorAppointment(data.appointment || null);
        setEligibility(data.eligibility);
        setBloodType(data.donor.blood_type);
      } else {
        setDonorResult(null);
        setExistingSample(null);
        setDonorAppointment(null);
        setEligibility(null);
        setName('');
        setPhone(queryId.startsWith('+') ? queryId : '');
        setDob('');
        setGender('Male');
        setAddress('');
        setBloodType('UNKNOWN');
      }
      setSearched(true);
    } catch (err) {
      setError(err.message || 'Lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFastTrackCollect = async (e) => {
    e.preventDefault();
    if (!donorResult) return;

    if (eligibility && !eligibility.is_eligible) {
      setError(eligibility.message || `Donor is ineligible to donate blood. Must wait 3 months (90 days) between donations.`);
      return;
    }

    if (!screeningComplete) {
      setError(questionnaireFailure || 'Complete all screening questions and vital signs before collection.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      donor_id: donorResult?.id,
      fayda_id: donorResult?.fayda_id || queryId,
      phone: donorResult?.phone,
      name: donorResult?.name,
      blood_type: bloodType || donorResult?.blood_type || 'O+',
      lab_id: selectedLabId,
      appointment_id: donorAppointment?.id,
      screening_data: { questionnaire, vitals }
    };

    try {
      const data = await api.station.collectSample(payload);
      setSuccess(`Sample collected and waiting for laboratory routing (ID: ${data.sample?.id || 'OK'}).`);
      setSearched(false);
      setQueryId('');
      fetchLabsAndSamples();
    } catch (err) {
      if (!navigator.onLine || err.message?.includes('Failed to fetch')) {
        await saveOfflineRegistration({
          type: 'FAST_TRACK_COLLECTION',
          payload,
          timestamp: new Date().toISOString()
        });
        setSuccess('Offline mode: Sample queued locally. It will automatically synchronize when connection is restored.');
        setSearched(false);
        setQueryId('');
        loadOfflineCount();
      } else {
        setError(err.message || 'Fast-track collection failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAndCollect = async (e) => {
    e.preventDefault();

    if (!screeningComplete) {
      setError('Complete all screening questions and vital signs before registration and donation.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      fayda_id: queryId ? queryId.trim() : undefined,
      name: name.trim(),
      phone: phone.trim(),
      dob: dob || '1995-01-01',
      gender: gender || 'Male',
      address: address ? address.trim() : 'Addis Ababa, Ethiopia',
      blood_type: bloodType || 'O+',
      screening_data: { questionnaire, vitals }
    };

    try {
      const data = await api.station.registerAndCollect(payload);
      setSuccess(`New donor (${data.donor?.name || name}) registered and sample collected. It is waiting for laboratory routing.`);
      setSearched(false);
      setQueryId('');
      fetchLabsAndSamples();
    } catch (err) {
      if (!navigator.onLine || err.message?.includes('Failed to fetch')) {
        await saveOfflineRegistration({
          type: 'NEW_DONOR_REGISTRATION',
          payload,
          timestamp: new Date().toISOString()
        });
        setSuccess('Offline mode: Donor details & collection queued locally. Will sync automatically.');
        setSearched(false);
        setQueryId('');
        loadOfflineCount();
      } else {
        setError(err.message || 'Registration and collection failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSample = async (sampleId) => {
    if (!selectedLabId) {
      setError('Select an approved laboratory before routing the sample.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.station.routeSampleToLab(sampleId, selectedLabId);
      setSuccess('Sample routed to the laboratory for screening.');
      await fetchLabsAndSamples();
    } catch (err) {
      setError(err.message || 'Failed to route sample to laboratory.');
    } finally {
      setLoading(false);
    }
  };

  const syncOfflineData = async () => {
    setSyncing(true);
    setError(null);
    try {
      const items = await getOfflineRegistrations();
      for (const item of items) {
        if (item.type === 'FAST_TRACK_COLLECTION') {
          await api.station.collectSample(item.payload);
        } else if (item.type === 'NEW_DONOR_REGISTRATION') {
          await api.station.registerAndCollect(item.payload);
        }
        await deleteOfflineRegistration(item.tempId);
      }
      setSuccess(`Synchronized ${items.length} offline records successfully.`);
      await loadOfflineCount();
      fetchLabsAndSamples();
    } catch (err) {
      setError('Failed to sync all offline registrations.');
    } finally {
      setSyncing(false);
    }
  };

  // Demo recent check-ins fallback
  const displayCheckins = [
    { id: 1, name: 'Melaku Alemu', time: '9:30 AM', status: 'Completed' },
    { id: 2, name: 'Tesfaye Girma', time: '9:45 AM', status: 'Completed' },
    { id: 3, name: 'Sara Bekele', time: '10:00 AM', status: 'Completed' },
    { id: 4, name: 'Abdi Hassan', time: '10:15 AM', status: 'Completed' },
    { id: 5, name: 'Lydia Assefa', time: '10:30 AM', status: 'Completed' }
  ];

  const renderQuestionnaireForm = () => (
    <div style={{ background: 'var(--bg-main)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '10px' }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        Pre-Donation Medical Screening Questionnaire
      </h4>
      {questionnaireFailure ? (
        <div style={{ color: '#ef233c', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>{questionnaireFailure} The donor is temporarily ineligible for collection.</span>
        </div>
      ) : questionnaireComplete ? (
        <div style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> All screening questions passed. Continue with donor intake and collection.
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Question {questionnaireStep + 1} of {QUESTIONNAIRE.length}</div>
          <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.82rem', lineHeight: 1.45 }}>
            {QUESTIONNAIRE[questionnaireStep].label}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button type="button" onClick={() => handleQuestionnaireChange(QUESTIONNAIRE[questionnaireStep].key, 'No')} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: '#06d6a0', borderColor: '#06d6a0' }}>No, continue</button>
            <button type="button" onClick={() => handleQuestionnaireChange(QUESTIONNAIRE[questionnaireStep].key, 'Yes')} className="btn" style={{ flex: 1, justifyContent: 'center', color: '#ef233c', border: '1px solid rgba(239,35,60,0.35)' }}>Yes, stop</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderVitalsForm = () => (
    <div style={{ background: 'var(--bg-main)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '10px' }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Pre-Donation Vital Signs</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
        {[
          ['hemoglobin', 'Hemoglobin (g/dL)', '12.5'],
          ['heart_rate', 'Heart rate (bpm)', '72'],
          ['blood_pressure', 'Blood pressure', '120/80'],
          ['temperature', 'Temperature (C)', '36.5'],
          ['weight', 'Weight (kg)', '60']
        ].map(([key, label, placeholder]) => (
          <label key={key} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            {label}
            <input type="text" inputMode="decimal" placeholder={placeholder} value={vitals[key]} onChange={(e) => setVitals(prev => ({ ...prev, [key]: e.target.value }))} required style={{ width: '100%', marginTop: '4px', boxSizing: 'border-box' }} />
          </label>
        ))}
      </div>
    </div>
  );

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
            <h2>Donation Station Overview</h2>
            <p>Log check-ins, verify eligibility and collect blood samples.</p>
          </div>

          {/* 4 Stat Cards Row */}
          <div className="stat-card-grid">
            
            {/* Stat 1: Today's Check-ins */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Today's Check-ins</span>
                <div className="stat-card-icon" style={{ background: 'rgba(37,99,235,0.12)', color: '#2563eb' }}>
                  <UserCheck size={18} />
                </div>
              </div>
              <div className="stat-card-value">32</div>
              <div className="stat-card-trend trend-up">
                <span>+8 vs yesterday</span>
              </div>
            </div>

            {/* Stat 2: Samples Collected */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Samples Collected</span>
                <div className="stat-card-icon" style={{ background: 'rgba(255,209,102,0.15)', color: '#f59e0b' }}>
                  <Droplet size={18} fill="#f59e0b" />
                </div>
              </div>
              <div className="stat-card-value">{samples.length > 0 ? samples.length : '28'}</div>
              <div className="stat-card-trend trend-up">
                <span>+5 vs yesterday</span>
              </div>
            </div>

            {/* Stat 3: Pending Lab Results */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Pending Lab Results</span>
                <div className="stat-card-icon" style={{ background: 'rgba(239,35,60,0.12)', color: '#ef233c' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div className="stat-card-value">15</div>
              <div className="stat-card-trend trend-neutral">
                <span>+3 vs yesterday</span>
              </div>
            </div>

            {/* Stat 4: Total Donors (This Month) */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Total Donors (This Month)</span>
                <div className="stat-card-icon" style={{ background: 'rgba(6,214,160,0.12)', color: '#06d6a0' }}>
                  <Users size={18} />
                </div>
              </div>
              <div className="stat-card-value">412</div>
              <div className="stat-card-trend trend-up">
                <span>+25 vs last month</span>
              </div>
            </div>

          </div>

          {/* 3 Column Grid Section */}
          <div className="dashboard-grid-3">
            
            {/* Card 1: Recent Collections */}
            <div className="dashboard-card">
              <div className="dashboard-card-title">
                <span>Recent Collections</span>
                <Droplet size={16} color="var(--text-muted)" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {displayCheckins.map(item => (
                  <div key={item.id} className="clean-list-item">
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {item.time}
                      </div>
                    </div>
                    <span className="badge badge-approved" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setTab('collections')} 
                className="view-all-btn"
              >
                View All <ArrowRight size={13} />
              </button>
            </div>

            {/* Card 2: Sample Collection Status (Donut Chart) */}
            <div className="dashboard-card" style={{ alignItems: 'center', justifyContent: 'center' }}>
              <div className="dashboard-card-title" style={{ width: '100%' }}>
                <span>Sample Collection Status</span>
              </div>

              {/* Responsive SVG Donut Chart */}
              <div style={{ position: 'relative', width: '140px', height: '140px', margin: '8px 0' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  {/* Background Circle */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--border-color)"
                    strokeWidth="4"
                  />
                  {/* Segment 1: Collected (65%) */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="4"
                    strokeDasharray="65, 100"
                  />
                  {/* Segment 2: Pending (25%) */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="4"
                    strokeDasharray="25, 100"
                    strokeDashoffset="-65"
                  />
                </svg>
                {/* Center Percentage */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>48</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bags</span>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} /> Collected: 28 (65%)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} /> Pending: 15 (25%)
                </span>
              </div>
            </div>

            {/* Card 3: Quick Actions */}
            <div className="dashboard-card">
              <div className="dashboard-card-title">
                <span>Quick Actions</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center', flex: 1 }}>
                <button 
                  onClick={() => setTab('eligibility')} 
                  className="quick-action-btn"
                >
                  <CheckCircle2 size={16} /> Check Eligibility
                </button>
                <button 
                  onClick={() => setTab('collect')} 
                  className="quick-action-btn"
                >
                  <Droplet size={16} /> Collect Blood Sample
                </button>
                <button 
                  onClick={() => setTab('donors')} 
                  className="quick-action-btn btn-outline"
                >
                  <Users size={16} /> View Donor List
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB: ELIGIBILITY CHECK */}
      {tab === 'eligibility' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'start' }}>
          
          <div className="dashboard-card animate-fade-in">
            <div className="dashboard-header" style={{ marginBottom: '16px' }}>
              <h2>Donor Eligibility Check</h2>
              <p>Verify 90-day donation interval and donor health status before collection.</p>
            </div>

            <form onSubmit={handleLookup} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Enter FAYDA ID (e.g. FAY-12345) or Phone Number"
                value={queryId}
                onChange={(e) => setQueryId(e.target.value)}
                style={{ flex: 1 }}
                required
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Search size={16} /> Check Eligibility
              </button>
            </form>

            {searched && donorResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  background: eligibility?.is_eligible ? 'rgba(6,214,160,0.1)' : 'rgba(255,209,102,0.15)',
                  border: eligibility?.is_eligible ? '1px solid rgba(6,214,160,0.3)' : '1px solid rgba(255,209,102,0.4)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: eligibility?.is_eligible ? '#06d6a0' : '#f59e0b',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {eligibility?.is_eligible ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 2px 0', fontSize: '1.05rem', fontWeight: 800, color: eligibility?.is_eligible ? '#059669' : '#d97706' }}>
                      {eligibility?.is_eligible ? '✓ Eligible to Donate' : '⚠️ Ineligible - Deferral Active'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {eligibility?.message}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="clean-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', background: 'var(--bg-main)', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Donor Name</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{donorResult.name}</strong>
                  </div>
                  <div className="clean-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', background: 'var(--bg-main)', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Blood Type</span>
                    <strong style={{ fontSize: '1rem', color: '#2563eb' }}>{donorResult.blood_type}</strong>
                  </div>
                  <div className="clean-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', background: 'var(--bg-main)', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Last Donation Date</span>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {donorResult.last_donation_date ? new Date(donorResult.last_donation_date).toLocaleDateString() : 'First-time donor'}
                    </strong>
                  </div>
                  <div className="clean-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', background: 'var(--bg-main)', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Loyalty Points</span>
                    <strong style={{ fontSize: '0.9rem', color: '#f59e0b' }}>{donorResult.points} pts</strong>
                  </div>
                </div>

                {eligibility?.is_eligible && (
                  <button 
                    onClick={() => setTab('collect')} 
                    className="btn btn-primary"
                    style={{ justifyContent: 'center', marginTop: '6px' }}
                  >
                    <Droplet size={16} /> Proceed to Collect Blood Sample
                  </button>
                )}
              </div>
            )}

            {searched && !donorResult && (
              <div style={{ background: 'rgba(58,134,255,0.08)', border: '1px solid rgba(58,134,255,0.2)', padding: '16px', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  No previous record found for <strong>{queryId}</strong>. This donor can be registered as a new donor.
                </p>
                <button 
                  onClick={() => setTab('collect')} 
                  className="btn btn-primary"
                  style={{ fontSize: '0.78rem' }}
                >
                  <Droplet size={14} /> Register & Collect Sample
                </button>
              </div>
            )}
          </div>

          <div className="dashboard-card animate-fade-in">
            <div className="dashboard-header" style={{ marginBottom: '14px' }}>
              <h2>Collection Guidelines</h2>
              <p>Standard operating procedures.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <CheckCircle2 size={16} color="#06d6a0" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Verify donor identity using valid FAYDA ID or government-issued credentials.</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <CheckCircle2 size={16} color="#06d6a0" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Confirm minimum 90-day interval between whole blood donations.</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <CheckCircle2 size={16} color="#06d6a0" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Administer clinical pre-donation screening questionnaire before venipuncture.</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB: COLLECT SAMPLE */}
      {tab === 'collect' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Offline Sync Bar */}
          {offlineCount > 0 && (
            <div style={{ background: 'rgba(255,209,102,0.12)', border: '1px solid rgba(255,209,102,0.3)', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#f59e0b' }}>
                <Database size={16} /> {offlineCount} offline registrations queued.
              </div>
              <button onClick={syncOfflineData} disabled={syncing} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.78rem' }}>
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          )}

          {/* Lookup Input Card */}
          <div className="dashboard-card">
            <div className="dashboard-header" style={{ marginBottom: '14px' }}>
              <h2>Collect Blood Sample & Donor Intake</h2>
              <p>Scan or enter FAYDA National ID or phone number to retrieve donor profile and collect sample.</p>
            </div>

            <form onSubmit={handleLookup} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px' }}>
              <input
                type="text"
                placeholder="Enter FAYDA ID (e.g. FAY-12345) or Phone Number"
                value={queryId}
                onChange={(e) => setQueryId(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Search size={16} /> Search Donor
              </button>
            </form>
          </div>

          {/* Search Result Workflow */}
          {searched && (
            <div className="dashboard-card animate-fade-in">
              {donorResult ? (
                /* RETURNING DONOR WORKFLOW */
                <form onSubmit={handleFastTrackCollect} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: eligibility?.is_eligible ? '#06d6a0' : '#ef233c' }}>
                      {eligibility?.is_eligible ? <UserCheck size={20} /> : <AlertTriangle size={20} />}
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold' }}>
                        Donor Verified: {donorResult.name}
                      </h4>
                    </div>
                    <span style={{ 
                      fontSize: '0.78rem', 
                      fontWeight: 700, 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      background: eligibility?.is_eligible ? 'rgba(6,214,160,0.15)' : 'rgba(239,35,60,0.15)',
                      color: eligibility?.is_eligible ? '#059669' : '#ef233c'
                    }}>
                      {eligibility?.is_eligible ? '✓ Eligible to Donate' : `⚠️ Ineligible (${eligibility?.days_remaining || 0}d remaining)`}
                    </span>
                  </div>

                  {/* Ineligibility Deferral Banner */}
                  {eligibility && !eligibility.is_eligible && (
                    <div style={{
                      background: 'rgba(239,35,60,0.08)',
                      border: '1px solid rgba(239,35,60,0.3)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px'
                    }}>
                      <Clock size={20} color="#ef233c" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ef233c' }}>
                          3-Month (90-Day) Deferral Period Active
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {eligibility.message}
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', fontSize: '0.82rem' }}>
                    <div><strong>FAYDA ID:</strong> {donorResult.fayda_id}</div>
                    <div><strong>Blood Type:</strong> <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{donorResult.blood_type}</span></div>
                    <div><strong>Last Donated:</strong> {donorResult.last_donation_date ? new Date(donorResult.last_donation_date).toLocaleDateString() : 'Never'}</div>
                    <div><strong>Points:</strong> {donorResult.points} pts</div>
                  </div>

                  <div style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontWeight: 700, color: '#2563eb', fontSize: '0.86rem', marginBottom: '5px' }}>Existing donor profile loaded</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                      Demographics came from the donor record. A new donor account will not be created. Complete this visit's health screening, then the new sample will be sent to the laboratory.
                    </div>
                    {donorAppointment ? (
                      <div style={{ marginTop: '8px', fontSize: '0.78rem', fontWeight: 700, color: '#059669' }}>
                        Appointment: {new Date(donorAppointment.date_time).toLocaleString()}
                      </div>
                    ) : (
                      <div style={{ marginTop: '8px', fontSize: '0.78rem', fontWeight: 700, color: '#ef233c' }}>No upcoming appointment at this station. The donor must schedule one before collection.</div>
                    )}
                  </div>

                  {donorAppointment && eligibility?.is_eligible ? (
                    <>
                      {renderQuestionnaireForm()}
                      {renderVitalsForm()}

                      <div>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Assign Screening Laboratory</label>
                        <SelectDropdown
                          value={selectedLabId}
                          onChange={setSelectedLabId}
                          ariaLabel="Assign Screening Laboratory"
                          options={[
                            { value: '', label: 'Select approved laboratory' },
                            ...labs.map(l => ({ value: l.id, label: l.entity_name }))
                          ]}
                        />
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={!screeningComplete || loading || !selectedLabId}>
                        <Droplet size={16} /> Collect New Donation & Send to Lab
                      </button>
                    </>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      Collection is blocked until the appointment and 90-day eligibility requirements are satisfied.
                    </div>
                  )}
                </form>
              ) : (
                /* NEW DONOR REGISTRATION WORKFLOW */
                <form onSubmit={handleRegisterAndCollect} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
                    <UserX size={20} />
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold' }}>New Donor Registration</h4>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>FAYDA ID (National ID)</label>
                      <input type="text" placeholder="e.g. ET-999 or leave for auto" value={queryId} onChange={(e) => setQueryId(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Full Name</label>
                      <input type="text" placeholder="e.g. Melaku Alemu" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Phone Number</label>
                      <input type="text" placeholder="0911..." value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Blood Group</label>
                      <SelectDropdown
                        value={bloodType}
                        onChange={setBloodType}
                        ariaLabel="Blood Group"
                        options={['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'].map(t => ({ value: t, label: t }))}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Date of Birth</label>
                      <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Gender</label>
                      <SelectDropdown
                        value={gender}
                        onChange={setGender}
                        ariaLabel="Gender"
                        options={[
                          { value: 'Male', label: 'Male' },
                          { value: 'Female', label: 'Female' }
                        ]}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Residential Address / City</label>
                    <input type="text" placeholder="e.g. Addis Ababa, Bole Subcity" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>

                  {renderQuestionnaireForm()}
                  {renderVitalsForm()}

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Assign Screening Laboratory</label>
                    <SelectDropdown
                      value={selectedLabId || (labs[0] ? labs[0].id : '')}
                      onChange={setSelectedLabId}
                      ariaLabel="Assign Screening Laboratory"
                      options={
                        labs.length === 0
                          ? [{ value: '', label: 'Central Blood Testing Laboratory (Auto)' }]
                          : labs.map(l => ({ value: l.id, label: l.entity_name }))
                      }
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={!screeningComplete || loading}>
                    <UserCheck size={16} /> Register Profile & Collect Blood
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      )}

      {/* TAB: DONOR LIST */}
      {tab === 'donors' && (
        <div className="dashboard-card animate-fade-in">
          <div className="dashboard-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Registered Donors Directory</h2>
              <p>Browse and search certified blood donors registered in the national network.</p>
            </div>
            <button 
              onClick={() => setTab('collect')} 
              className="btn btn-primary"
              style={{ fontSize: '0.78rem' }}
            >
              <PlusCircle size={14} /> New Registration & Collection
            </button>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', marginBottom: '16px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search donors by name, FAYDA ID, or phone..." 
                value={donorSearchTerm}
                onChange={(e) => setDonorSearchTerm(e.target.value)}
                style={{ paddingLeft: '32px', width: '100%' }}
              />
            </div>
            <div style={{ width: isMobile ? '100%' : '140px' }}>
              <SelectDropdown
                value={donorBloodTypeFilter}
                onChange={setDonorBloodTypeFilter}
                ariaLabel="Filter by Blood Type"
                options={[
                  { value: 'ALL', label: 'All Blood Types' },
                  ...['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => ({ value: t, label: t }))
                ]}
              />
            </div>
          </div>

          {loadingDonors ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading donors list...</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Donor Name</th>
                    <th>FAYDA ID</th>
                    <th>Blood Type</th>
                    <th>Phone</th>
                    <th>Last Donation</th>
                    <th>Eligibility</th>
                    <th>Donations</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donorsList
                    .filter(d => {
                      const matchesSearch = !donorSearchTerm || 
                        d.name?.toLowerCase().includes(donorSearchTerm.toLowerCase()) ||
                        d.fayda_id?.toLowerCase().includes(donorSearchTerm.toLowerCase()) ||
                        d.phone?.includes(donorSearchTerm);
                      const matchesType = donorBloodTypeFilter === 'ALL' || d.blood_type === donorBloodTypeFilter;
                      return matchesSearch && matchesType;
                    })
                    .map(d => (
                      <tr key={d.fayda_id}>
                        <td data-label="Donor Name" style={{ fontWeight: 600 }}>{d.name}</td>
                        <td data-label="FAYDA ID" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{d.fayda_id}</td>
                        <td data-label="Blood Type">
                          <span style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                            {d.blood_type}
                          </span>
                        </td>
                        <td data-label="Phone" style={{ fontSize: '0.82rem' }}>{d.phone}</td>
                        <td data-label="Last Donation" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {d.last_donation_date ? new Date(d.last_donation_date).toLocaleDateString() : 'Never'}
                        </td>
                        <td data-label="Eligibility">
                          <span className={`badge badge-${d.is_eligible ? 'approved' : 'pending'}`} style={{ fontSize: '0.68rem' }}>
                            {d.is_eligible ? 'Eligible' : 'Deferral'}
                          </span>
                        </td>
                        <td data-label="Donations" style={{ fontWeight: 600 }}>{d.total_donations || 0}</td>
                        <td data-label="Actions" className="cell-actions" style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              setQueryId(d.fayda_id);
                              setTab('collect');
                            }}
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                          >
                            <Droplet size={12} /> Collect
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: REPORTS */}
      {tab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="dashboard-header">
            <h2>Donation Station Analytics & Reports</h2>
            <p>Summary of collection volume, donor intake, and laboratory dispatch metrics.</p>
          </div>

          <div className="stat-card-grid">
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Total Collections</span>
                <div className="stat-card-icon" style={{ background: 'rgba(37,99,235,0.12)', color: '#2563eb' }}>
                  <Droplet size={18} fill="#2563eb" />
                </div>
              </div>
              <div className="stat-card-value">{reportsData?.total_collected || samples.length}</div>
              <div className="stat-card-trend trend-up"><span>All time</span></div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Pending Lab Screen</span>
                <div className="stat-card-icon" style={{ background: 'rgba(247,127,0,0.12)', color: '#f77f00' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div className="stat-card-value">{reportsData?.pending_lab || 15}</div>
              <div className="stat-card-trend trend-neutral"><span>In queue</span></div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Validated Samples</span>
                <div className="stat-card-icon" style={{ background: 'rgba(6,214,160,0.12)', color: '#06d6a0' }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="stat-card-value">{reportsData?.validated || 24}</div>
              <div className="stat-card-trend trend-up"><span>Approved</span></div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Today's Check-ins</span>
                <div className="stat-card-icon" style={{ background: 'rgba(37,99,235,0.12)', color: '#2563eb' }}>
                  <UserCheck size={18} />
                </div>
              </div>
              <div className="stat-card-value">32</div>
              <div className="stat-card-trend trend-up"><span>Active today</span></div>
            </div>
          </div>

          {/* Blood Type Breakdown */}
          <div className="dashboard-card animate-fade-in">
            <div className="dashboard-header" style={{ marginBottom: '14px' }}>
              <h2>Collected Samples by Blood Type</h2>
              <p>Distribution of all blood units collected at this station.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => {
                const count = reportsData?.blood_type_distribution?.[type] || 
                  samples.filter(s => s.blood_type === type).length;
                return (
                  <div key={type} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2563eb' }}>{type}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{count}</div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>units</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB: TODAY'S COLLECTIONS / DISPATCH LOG */}
      {tab === 'collections' && (
        <div className="dashboard-card animate-fade-in">
          <div className="dashboard-header" style={{ marginBottom: '16px' }}>
            <h2>Station Dispatch & Collection Log</h2>
            <p>Track all blood bags collected at this workstation and their routing status.</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Route collected sample to:</label>
            <select value={selectedLabId} onChange={(e) => setSelectedLabId(e.target.value)} style={{ minWidth: '220px' }}>
              <option value="">Select approved laboratory</option>
              {labs.map(l => <option key={l.id} value={l.id}>{l.entity_name}</option>)}
            </select>
          </div>

          {samples.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No blood bags collected today.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Donor Name</th>
                    <th>Blood Type</th>
                    <th>Routed Lab</th>
                    <th>Bag Status</th>
                    <th>Collected Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {samples.map(s => (
                    <tr key={s.id}>
                      <td data-label="Donor Name" style={{ fontWeight: 600 }}>{s.donor_name}</td>
                      <td data-label="Blood Type">
                        <span style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                          {s.blood_type}
                        </span>
                      </td>
                      <td data-label="Routed Lab" style={{ color: 'var(--text-secondary)' }}>{s.lab_name}</td>
                      <td data-label="Bag Status">
                        <span className={`badge badge-${s.status}`}>
                          {s.status}
                        </span>
                      </td>
                      <td data-label="Collected Date" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {new Date(s.collected_at).toLocaleDateString()}
                      </td>
                      <td>
                        {s.status === 'collected' ? (
                          <button type="button" className="btn btn-primary" onClick={() => handleRouteSample(s.id)} disabled={loading || !selectedLabId} style={{ padding: '5px 9px', fontSize: '0.7rem' }}>
                            <ArrowRight size={13} /> Route
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Already routed</span>
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
