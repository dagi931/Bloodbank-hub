import React, { useState, useEffect } from 'react';
import { Search, PlusCircle, UserCheck, UserX, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

const DB_NAME = 'BloodBankStationOffline';
const DB_VERSION = 1;
const STORE_NAME = 'offline_registrations';

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

export default function StationDashboard() {
  const [queryId, setQueryId] = useState('');
  const [searched, setSearched] = useState(false);
  const [donorResult, setDonorResult] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [labs, setLabs] = useState([]);
  const [samples, setSamples] = useState([]);

  // Forms states
  const [selectedLabId, setSelectedLabId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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

  // New Donor Form details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');
  const [bloodType, setBloodType] = useState('UNKNOWN');

  // Screening questionnaire state
  const [questionnaire, setQuestionnaire] = useState({
    tattoo: 'No',
    medication: 'No',
    surgery: 'No',
    malaria: 'No',
    unwell: 'No',
    hivHistory: 'No'
  });

  const handleQuestionnaireChange = (key, value) => {
    setQuestionnaire(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const questionnaireFailed = Object.values(questionnaire).includes('Yes');

  const fetchLabsAndSamples = async () => {
    setLoading(true);
    try {
      const samplesList = await api.station.getSamples();
      setSamples(samplesList);

      // Fetch approved labs list via our station API helper
      const approvedLabs = await api.station.getLabs();
      setLabs(approvedLabs);
      if (approvedLabs.length > 0) {
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

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!queryId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    setSearched(false);

    try {
      const data = await api.station.lookupDonor(queryId);
      // Reset questionnaire
      setQuestionnaire({
        tattoo: 'No',
        medication: 'No',
        surgery: 'No',
        malaria: 'No',
        unwell: 'No',
        hivHistory: 'No'
      });

      if (data.found) {
        setDonorResult(data.donor);
        setEligibility(data.eligibility);
        // Prefill blood type for returning donor
        setBloodType(data.donor.blood_type);
      } else {
        setDonorResult(null);
        setEligibility(null);
        // Clear fields for new registration
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

  const handleRegisterAndCollect = async (e) => {
    e.preventDefault();
    if (questionnaireFailed) {
      setError('Cannot complete registration: Donor is deferred based on questionnaire responses.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    const notes = `Questionnaire: Tattoo=${questionnaire.tattoo}, Meds=${questionnaire.medication}, Surgery=${questionnaire.surgery}, Malaria=${questionnaire.malaria}, Unwell=${questionnaire.unwell}, Infections=${questionnaire.hivHistory}. Passed.`;

    try {
      const isReturning = !!donorResult;
      const fayda_id = donorResult ? donorResult.fayda_id : queryId;

      // 1. Register donor event
      const donorRes = await api.station.registerDonor({
        fayda_id,
        name: isReturning ? donorResult.name : name,
        phone: isReturning ? donorResult.phone : phone,
        dob: isReturning ? donorResult.dob : dob,
        gender: isReturning ? donorResult.gender : gender,
        address: isReturning ? donorResult.address : address,
        blood_type: bloodType,
        is_returning: isReturning
      });

      // 2. Log and route blood sample bag to lab
      await api.station.createSample({
        fayda_id: donorRes.donor.fayda_id,
        blood_type: donorRes.donor.blood_type,
        lab_id: selectedLabId,
        health_notes: notes
      });

      setSuccess(`Successfully logged donation bag (${donorRes.donor.blood_type}) and routed to ${labs.find(l => l.id === selectedLabId)?.entity_name || 'Lab'}.`);
      
      // Reset scanner
      setSearched(false);
      setDonorResult(null);
      setEligibility(null);
      setQueryId('');

      // Reset questionnaire
      setQuestionnaire({
        tattoo: 'No',
        medication: 'No',
        surgery: 'No',
        malaria: 'No',
        unwell: 'No',
        hivHistory: 'No'
      });

      // Reload log
      const samplesList = await api.station.getSamples();
      setSamples(samplesList);
    } catch (err) {
      console.error('API submission failed. Checking offline caching fallback...', err.message);
      try {
        const isReturning = !!donorResult;
        const tempFaydaId = donorResult ? donorResult.fayda_id : (queryId || 'offline-ET-' + Date.now());

        const offlineItem = {
          fayda_id: tempFaydaId,
          name: isReturning ? donorResult.name : name,
          phone: isReturning ? donorResult.phone : phone,
          dob: isReturning ? donorResult.dob : dob,
          gender: isReturning ? donorResult.gender : gender,
          address: isReturning ? donorResult.address : address,
          blood_type: bloodType,
          is_returning: isReturning,
          lab_id: selectedLabId,
          health_notes: notes
        };

        await saveOfflineRegistration(offlineItem);
        setSuccess('⚠️ Network connection offline. Registration details have been securely cached locally in IndexedDB storage.');
        
        // Reset scanner
        setSearched(false);
        setDonorResult(null);
        setEligibility(null);
        setQueryId('');
        setQuestionnaire({
          tattoo: 'No', medication: 'No', surgery: 'No', malaria: 'No', unwell: 'No', hivHistory: 'No'
        });
        await loadOfflineCount();
      } catch (cacheErr) {
        console.error('[IndexedDB Caching Error]:', cacheErr.message);
        setError(`Submission failed, and local offline cache write failed: ${cacheErr.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSyncOffline = async () => {
    setSyncing(true);
    setError(null);
    setSuccess(null);
    try {
      const items = await getOfflineRegistrations();
      if (items.length === 0) {
        setSuccess('No offline registrations to sync.');
        setSyncing(false);
        return;
      }
      
      let successCount = 0;
      for (const item of items) {
        try {
          const donorRes = await api.station.registerDonor({
            fayda_id: item.fayda_id,
            name: item.name,
            phone: item.phone,
            dob: item.dob,
            gender: item.gender,
            address: item.address,
            blood_type: item.blood_type,
            is_returning: item.is_returning
          });

          await api.station.createSample({
            fayda_id: donorRes.donor.fayda_id,
            blood_type: donorRes.donor.blood_type,
            lab_id: item.lab_id,
            health_notes: item.health_notes
          });

          await deleteOfflineRegistration(item.tempId);
          successCount++;
        } catch (syncErr) {
          console.error(`Failed to sync item ${item.tempId}:`, syncErr.message);
          throw new Error(`Sync halted at donor ${item.name || item.fayda_id}. Server is still unreachable: ${syncErr.message}`);
        }
      }
      
      setSuccess(`✅ Successfully synced ${successCount} offline registrations with the server!`);
      await fetchLabsAndSamples();
      await loadOfflineCount();
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const renderQuestionnaireForm = () => {
    const questions = [
      { key: 'tattoo', text: 'Tattoo, body piercing, or acupuncture in the past 3 months?' },
      { key: 'medication', text: 'Taking antibiotics or under treatment for active infection?' },
      { key: 'surgery', text: 'Surgery or major dental procedure in the past 3 months?' },
      { key: 'malaria', text: 'Travel to or lived in malaria-endemic zone in past 3 months?' },
      { key: 'unwell', text: 'Feels unwell, has fever, active cold or cough symptoms today?' },
      { key: 'hivHistory', text: 'Ever tested positive for HIV, Hepatitis B/C, or Syphilis?' }
    ];

    return (
      <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <h5 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase' }}>
          Screening Questionnaire
        </h5>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '12px' }}>
          Verify donor eligibility. Any <strong>YES</strong> deferrals will block this donation.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {questions.map((q) => (
            <div key={q.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{q.text}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleQuestionnaireChange(q.key, 'Yes')}
                  className={`btn ${questionnaire[q.key] === 'Yes' ? 'btn-danger' : 'btn-secondary'}`}
                  style={{ padding: '3px 8px', fontSize: '0.7rem', minWidth: '42px', height: '24px' }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleQuestionnaireChange(q.key, 'No')}
                  className={`btn ${questionnaire[q.key] === 'No' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '3px 8px', fontSize: '0.7rem', minWidth: '42px', height: '24px', background: questionnaire[q.key] === 'No' ? '#06d6a0' : undefined }}
                >
                  No
                </button>
              </div>
            </div>
          ))}
        </div>

        {questionnaireFailed && (
          <div style={{ background: 'rgba(239,35,60,0.1)', border: '1px solid rgba(239,35,60,0.2)', color: '#ef233c', padding: '10px', borderRadius: '6px', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.8rem', marginBottom: '12px' }}>
            <AlertTriangle size={14} />
            <div><strong>Donor Deferred:</strong> Ineligible to donate today.</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Offline Count Sync Banner */}
      {offlineCount > 0 && (
        <div 
          className="glass-card" 
          style={{ 
            background: 'rgba(255,183,3,0.1)', 
            color: '#ffb703', 
            border: '1px solid rgba(255,183,3,0.2)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '16px', 
            borderRadius: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} />
            <span style={{ fontWeight: 600 }}>
              {offlineCount} Donor Registration{offlineCount > 1 ? 's' : ''} saved offline in local IndexedDB storage (Server offline fallback).
            </span>
          </div>
          <button 
            onClick={handleSyncOffline} 
            className="btn" 
            disabled={syncing}
            style={{ background: '#ffb703', color: '#000', fontWeight: 'bold', padding: '8px 16px' }}
          >
            {syncing ? 'Syncing...' : 'Sync with Server Now'}
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
      
      {/* Donor screening workstation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* SCANNER LOOKUP */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Donor Check-In Scanner</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Enter the patient's **FAYDA National ID** or Registered **Phone Number** to determine their donation record.
          </p>

          <form onSubmit={handleLookup} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              placeholder="e.g. ET-001 or +251911223344"
              value={queryId}
              onChange={(e) => setQueryId(e.target.value)}
              required
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Search size={18} /> Lookup Donor
            </button>
          </form>
        </div>

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

        {/* WORKFLOW DISCOVERY */}
        {searched && (
          <div className="glass-card animate-fade-in" style={{ 
            borderTop: donorResult ? '4px solid #06d6a0' : '4px solid #ffb703',
            padding: '24px'
          }}>
            {donorResult ? (
              // RETURNING DONOR WORKFLOW
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#06d6a0' }}>
                  <UserCheck size={24} />
                  <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Returning Donor Profile Detected</h4>
                </div>
                
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                  <div style={{ marginBottom: '8px' }}>Name: <strong>{donorResult.name}</strong></div>
                  <div style={{ marginBottom: '8px' }}>Phone: <strong>{donorResult.phone}</strong></div>
                  <div style={{ marginBottom: '8px' }}>Blood Type: <span className="badge-blood-type">{donorResult.blood_type}</span></div>
                  <div style={{ marginBottom: '8px' }}>Last Donation: <strong>{donorResult.last_donation_date ? new Date(donorResult.last_donation_date).toLocaleDateString() : 'Never'}</strong></div>
                  <div>Account Reward Balance: <strong>{donorResult.points} points</strong></div>
                </div>

                {eligibility && !eligibility.is_eligible ? (
                  <div style={{ background: 'rgba(255,183,3,0.1)', border: '1px solid rgba(255,183,3,0.2)', color: '#ffb703', padding: '14px', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.85rem' }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>Ineligible for Donation</div>
                      <div>{eligibility.message}</div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleRegisterAndCollect} style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                    <h4 style={{ margin: 0, color: 'var(--primary)' }}>Log Blood Donation Event</h4>
                    
                    {renderQuestionnaireForm()}

                    <div style={{ marginTop: '12px' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Assign Screening Laboratory
                      </label>
                      <select 
                        value={selectedLabId} 
                        onChange={(e) => setSelectedLabId(e.target.value)}
                        required
                        style={{ width: '100%' }}
                      >
                        {labs.map(l => (
                          <option key={l.id} value={l.id}>{l.entity_name}</option>
                        ))}
                      </select>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={questionnaireFailed || loading}>
                      <PlusCircle size={18} /> Fast-Track Sample & Route to Lab
                    </button>
                  </form>
                )}
              </div>
            ) : (
              // NEW DONOR WORKFLOW
              <form onSubmit={handleRegisterAndCollect} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ffb703' }}>
                  <UserX size={24} />
                  <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>New Donor - Demographic Entry</h4>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                  This donor is not registered in our database. Complete full demographics entry to create their health card.
                </p>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    FAYDA ID / Temp ID
                  </label>
                  <input
                    type="text"
                    value={queryId}
                    disabled
                    style={{ width: '100%', background: 'rgba(255,255,255,0.02)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Yonathan Abebe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +251911223344"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      DOB
                    </label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Gender
                    </label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} style={{ width: '100%' }}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Home Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bole, Addis Ababa"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                {renderQuestionnaireForm()}

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', marginTop: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Assign Screening Laboratory
                  </label>
                  <select 
                    value={selectedLabId} 
                    onChange={(e) => setSelectedLabId(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  >
                    {labs.map(l => (
                      <option key={l.id} value={l.id}>{l.entity_name}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={questionnaireFailed || loading}>
                  <UserCheck size={18} /> Register Profile & Collect Blood
                </button>
              </form>
            )}
          </div>
        )}

      </div>

      {/* Station collection logging */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Station Dispatch Log</h3>
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
                </tr>
              </thead>
              <tbody>
                {samples.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.donor_name}</td>
                    <td>
                      <span className="badge-blood-type">{s.blood_type}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.lab_name}</td>
                    <td>
                      <span className={`badge badge-${s.status}`}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(s.collected_at).toLocaleDateString()}
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
  );
}
