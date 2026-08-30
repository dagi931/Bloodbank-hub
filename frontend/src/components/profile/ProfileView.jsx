import React, { useState, useEffect } from 'react';
import {
  User, ShieldCheck, Key, Mail, Building, Phone, MapPin,
  Award, Droplet, Calendar, CheckCircle2, Lock, ArrowLeft, RefreshCw, X, Eye, EyeOff, Trash2
} from 'lucide-react';
import { api } from '../../api';
import BottomToast from '../ui/BottomToast';

export default function ProfileView({ user, setTab, onBack }) {
  const [profileData, setProfileData] = useState(user || {});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Account deletion state
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.getProfile();
      if (res && res.user) {
        setProfileData(res.user);
      }
    } catch (err) {
      console.warn('[ProfileView] Failed to fetch live profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Auto-dismiss alert messages
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setError('Please provide current and new passwords.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.auth.changePassword(currentPassword, newPassword);
      setSuccess(res.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Super Administrator';
      case 'donor': return 'Registered Blood Donor';
      case 'station': return 'Donation Collection Station';
      case 'laboratory': return 'Certified Testing Laboratory';
      case 'warehouse': return 'Central Blood Bank Warehouse';
      case 'hospital': return 'Partner Healthcare Facility';
      default: return role?.toUpperCase() || 'User';
    }
  };

  const activeRole = profileData.role || user?.role;
  const deletionPending = profileData.status === 'deletion_requested';

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setError(null);
    try {
      await api.auth.deleteAccount();
      api.auth.logout();
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Failed to delete account.');
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const handleRequestDeletion = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await api.auth.requestAccountDeletion();
      setSuccess(res.message || 'Deletion request submitted for admin review.');
      setProfileData((prev) => ({ ...prev, status: 'deletion_requested' }));
    } catch (err) {
      setError(err.message || 'Failed to submit deletion request.');
    } finally {
      setDeleting(false);
    }
  };

  const donor = profileData.donor || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px', margin: '0 auto' }} className="animate-fade-in">
      
      {/* Header with Back button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => {
              if (onBack) onBack();
              else if (setTab) setTab('dashboard');
            }} 
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={15} /> Back to Dashboard
          </button>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              My Profile & Account Settings
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Manage your workstation credentials, contact details, and account security.
            </p>
          </div>
        </div>

        <button onClick={loadProfile} className="btn btn-outline" style={{ padding: '6px 10px', fontSize: '0.78rem' }} title="Refresh Profile">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{ background: 'rgba(239,35,60,0.1)', color: '#ef233c', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(239,35,60,0.2)', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#ef233c', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Floating Bottom Success Toast (Auto-dismisses in 5s) */}
      <BottomToast message={success} onClose={() => setSuccess(null)} />

      {/* Profile Overview Header Card */}
      <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px' }}>
        <div style={{ 
          width: '72px', 
          height: '72px', 
          borderRadius: '50%', 
          background: 'var(--primary, #ef233c)', 
          color: '#ffffff', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: '1.8rem', 
          fontWeight: 800,
          boxShadow: '0 4px 12px rgba(239,35,60,0.3)'
        }}>
          {profileData.entity_name ? profileData.entity_name[0].toUpperCase() : (profileData.email ? profileData.email[0].toUpperCase() : 'U')}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {profileData.entity_name || donor.name || profileData.email?.split('@')[0]}
            </h3>
            <span className="badge badge-approved" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} /> {getRoleLabel(profileData.role || user?.role)}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} color="currentColor" style={{ color: 'var(--text-secondary)' }} /> {profileData.email || user?.email}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building size={14} color="currentColor" style={{ color: 'var(--text-secondary)' }} /> Status: <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>Active & Verified</span>
            </div>
            {profileData.created_at && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} color="currentColor" style={{ color: 'var(--text-secondary)' }} /> Registered: {new Date(profileData.created_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        
        {/* Account Details */}
        <div className="dashboard-card">
          <div className="dashboard-header" style={{ marginBottom: '16px' }}>
            <h2>Account Details</h2>
            <p>Official workstation registration and system attributes.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '12px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Entity / Workstation Name</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                {profileData.entity_name || donor.name || 'Official Workstation'}
              </span>
            </div>

            <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '12px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>System Role</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.88rem' }}>
                {getRoleLabel(profileData.role || user?.role)}
              </span>
            </div>

            <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '12px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Official Email</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                {profileData.email || user?.email}
              </span>
            </div>

            <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '12px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Account ID</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                {profileData.id || user?.id || 'AUTH-SESSION-TOKEN'}
              </span>
            </div>

            {/* Donor specific demographics */}
            {profileData.role === 'donor' && (
              <>
                <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '12px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>FAYDA National ID</span>
                  <span style={{ fontWeight: 800, color: 'var(--color-info)', fontSize: '0.9rem' }}>
                    {donor.fayda_id || 'ET-FAY-VERIFIED'}
                  </span>
                </div>

                <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '12px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Blood Group</span>
                  <span style={{ fontWeight: 800, color: 'var(--color-danger)', fontSize: '0.95rem', background: 'rgba(239,35,60,0.12)', border: '1px solid rgba(239,35,60,0.25)', padding: '2px 10px', borderRadius: '4px' }}>
                    {donor.blood_type || 'O+'}
                  </span>
                </div>

                <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '12px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Points</span>
                  <span style={{ fontWeight: 800, color: 'var(--color-warning)', fontSize: '0.95rem' }}>
                    &#x1F3C6; {donor.points || 0} pts
                  </span>
                </div>

                <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '12px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Phone Number</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                    {donor.phone || '+251 911 000 000'}
                  </span>
                </div>
              </>
            )}

          </div>
        </div>

        {/* Password Management */}
        <div className="dashboard-card">
          <div className="dashboard-header" style={{ marginBottom: '16px' }}>
            <h2>Security & Password</h2>
            <p>Update your account access password.</p>
          </div>

          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="••••••••" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  required 
                  style={{ width: '100%', paddingRight: '42px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--input-border)' }}
                />
                <button type="button" onClick={() => setShowCurrentPassword((value) => !value)} title={showCurrentPassword ? 'Hide password' : 'Show password'} aria-label={showCurrentPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, display: 'flex' }}>{showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  style={{ width: '100%', paddingRight: '42px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--input-border)' }}
                />
                <button type="button" onClick={() => setShowNewPassword((value) => !value)} title={showNewPassword ? 'Hide password' : 'Show password'} aria-label={showNewPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, display: 'flex' }}>{showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat new password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  style={{ 
                    width: '100%', 
                    paddingRight: '42px',
                    background: 'var(--input-bg)', 
                    color: 'var(--text-primary)', 
                    border: newPassword && confirmPassword && newPassword !== confirmPassword 
                      ? '1px solid var(--color-danger)' 
                      : '1px solid var(--input-border)'
                  }}
                />
                <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} title={showConfirmPassword ? 'Hide password' : 'Show password'} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, display: 'flex' }}>{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <span style={{ color: 'var(--color-danger)', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>&#x2717; Passwords do not match</span>
              )}
              {newPassword && confirmPassword && newPassword === confirmPassword && (
                <span style={{ color: 'var(--color-success)', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>&#x2713; Passwords match</span>
              )}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ justifyContent: 'center', marginTop: '6px' }}
              disabled={saving || (newPassword && confirmPassword && newPassword !== confirmPassword)}
            >
              <Lock size={15} /> {saving ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>

      </div>

      {/* Danger Zone - Account Deletion (hidden for admins) */}
      {activeRole !== 'admin' && (
        <div
          className="dashboard-card"
          style={{ borderColor: 'rgba(239,35,60,0.3)', borderWidth: '1px', borderStyle: 'solid' }}
        >
          <div className="dashboard-header" style={{ marginBottom: '12px' }}>
            <h2 style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 size={18} /> Danger Zone
            </h2>
            <p>Permanently remove your account from the Blood Bank Hub system.</p>
          </div>

          {deletionPending ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', padding: '14px 16px', borderRadius: '8px' }}>
              <ShieldCheck size={18} color="var(--color-warning)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-warning)' }}>Deletion request pending admin approval</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Your account will be permanently removed once an administrator approves this request.
                </div>
              </div>
            </div>
          ) : activeRole === 'donor' ? (
            <>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                Donor accounts are deleted immediately without administrator approval. This action cannot be undone and you will lose access to your donation history and points.
              </p>
              {!confirmingDelete ? (
                <button onClick={() => setConfirmingDelete(true)} className="btn btn-outline" disabled={deleting} style={{ color: 'var(--color-danger)', borderColor: 'rgba(239,35,60,0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Trash2 size={15} /> Delete My Account
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={handleDeleteAccount} className="btn btn-primary" disabled={deleting} style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Trash2 size={15} /> {deleting ? 'Deleting...' : 'Yes, Permanently Delete'}
                  </button>
                  <button onClick={() => setConfirmingDelete(false)} className="btn btn-outline" disabled={deleting}>
                    Cancel
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                Workstation accounts ({getRoleLabel(activeRole)}) require administrator approval before deletion. Submitting a request will notify the system administrator, who will review and finalize the deletion.
              </p>
              <button onClick={handleRequestDeletion} className="btn btn-outline" disabled={deleting} style={{ color: 'var(--color-danger)', borderColor: 'rgba(239,35,60,0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trash2 size={15} /> {deleting ? 'Submitting...' : 'Request Account Deletion'}
              </button>
            </>
          )}
        </div>
      )}

    </div>
  );
}
