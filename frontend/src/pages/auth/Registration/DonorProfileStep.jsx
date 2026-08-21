import React, { useState } from 'react';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import SelectDropdown from '../../../components/common/SelectDropdown';

export default function DonorProfileStep({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  faydaId,
  setFaydaId,
  faydaLinked,
  faydaStatus,
  onFaydaLookup,
  name,
  setName,
  phone,
  setPhone,
  dob,
  setDob,
  gender,
  setGender,
  address,
  setAddress,
  loading,
  onSubmit,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleFaydaIdChange = (e) => {
    setFaydaId(e.target.value);
  };

  const inputStyle = {
    background: 'var(--input-bg)',
    color: 'var(--text-primary)',
    border: '1px solid var(--input-border)',
  };

  const labelStyle = {
    color: 'var(--text-secondary)',
  };

  return (
    <form onSubmit={onSubmit} className="register-form donor-profile-form">

      {/* Password */}
      <div>
        <label className="register-label" style={labelStyle}>
          Set Password
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Choose secure password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="register-input"
            style={{ ...inputStyle, paddingRight: '42px' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 0,
              display: 'flex',
            }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="register-label" style={labelStyle}>
          Confirm Password
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="register-input"
            style={{
              ...inputStyle,
              paddingRight: '42px',
              border: password && confirmPassword && password !== confirmPassword
                ? '1px solid #ef233c'
                : '1px solid var(--input-border)',
            }}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(v => !v)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 0,
              display: 'flex',
            }}
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {password && confirmPassword && password !== confirmPassword && (
          <span style={{ color: '#ef233c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>
            &#x2717; Passwords do not match
          </span>
        )}
        {password && confirmPassword && password === confirmPassword && (
          <span style={{ color: '#06d6a0', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>
            &#x2713; Passwords match
          </span>
        )}
      </div>

      {/* Donor Demographic Details */}
      <div className="donor-demographics">

        <h3 className="register-section-title" style={{ color: 'var(--primary)' }}>
          Donor Demographic Details
        </h3>

        {/* FAYDA ID */}
        <div className="fayda-section" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>

          <label className="register-small-label" style={labelStyle}>
            FAYDA National ID
          </label>

          <div className="fayda-input-row">

            <input
              type="text"
              placeholder="e.g. ET-001"
              value={faydaId}
              onChange={handleFaydaIdChange}
              className="register-input fayda-input"
              style={inputStyle}
            />

            <button
              type="button"
              onClick={onFaydaLookup}
              className="btn fayda-search-button"
              disabled={loading}
            >
              Search Registry
            </button>

          </div>

          {faydaStatus === 'success' && (
            <div className="fayda-success">
              &#x2713; Core demographics linked and auto-filled.
            </div>
          )}

          {faydaStatus === 'error' && (
            <div className="fayda-error">
              &#x2717; No record found. Enter details manually below.
            </div>
          )}

        </div>

        {/* Full Name + Phone */}
        <div className="register-two-column">

          <div>
            <label className="register-small-label" style={labelStyle}>
              Full Name
            </label>

            <input
              type="text"
              placeholder="e.g. Yonathan Abebe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              readOnly={faydaLinked}
              className={`register-input ${faydaLinked ? 'fayda-filled-input' : ''}`}
              style={{
                ...inputStyle,
                ...(faydaLinked ? { color: 'var(--text-muted)', cursor: 'not-allowed' } : {}),
              }}
            />
          </div>

          <div>
            <label className="register-small-label" style={labelStyle}>
              Phone Number
            </label>

            <input
              type="text"
              placeholder="e.g. +251911223344"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="register-input"
              style={inputStyle}
            />
          </div>

        </div>

        {/* Date of Birth + Gender */}
        <div className="register-two-column">

          <div>
            <label className="register-small-label" style={labelStyle}>
              Date of Birth
            </label>

            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
              readOnly={faydaLinked}
              className={`register-input ${faydaLinked ? 'fayda-filled-input' : ''}`}
              style={{
                ...inputStyle,
                ...(faydaLinked ? { color: 'var(--text-muted)', cursor: 'not-allowed' } : {}),
              }}
            />
          </div>

          <div>
            <label className="register-small-label" style={labelStyle}>
              Gender
            </label>

            <SelectDropdown
              value={gender}
              onChange={setGender}
              disabled={faydaLinked}
              ariaLabel="Gender"
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' }
              ]}
            />
          </div>

        </div>

        {/* Address */}
        <div>
          <label className="register-small-label" style={labelStyle}>
            Home Address
          </label>

          <input
            type="text"
            placeholder="e.g. Bole, Addis Ababa"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            className="register-input"
            style={inputStyle}
          />
        </div>

      </div>

      {/* Submit */}
      <button
        type="submit"
        className="btn btn-primary register-submit"
        disabled={loading || (password && confirmPassword && password !== confirmPassword)}
      >
        <UserPlus size={18} />
        {loading ? 'Creating Account...' : 'Register Donor Account'}
      </button>

    </form>
  );
}