import React, { useState } from 'react';
import { UserPlus, Eye, EyeOff, MapPin } from 'lucide-react';

export default function StaffRegistration({
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  entityName,
  setEntityName,
  location,
  setLocation,
  role,
  loading,
  onSubmit,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isStation = role === 'station';

  return (
    <form onSubmit={onSubmit} className="register-form staff-registration-form">
      
      {/* Workstation Email */}
      <div>
        <label className="register-label" style={{ color: 'var(--text-secondary)' }}>
          Workstation Email
        </label>
        <input
          type="email"
          placeholder="e.g. facility@bloodbank.org"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="register-input"
          style={{
            background: 'var(--input-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--input-border)',
          }}
        />
      </div>

      {/* Facility / Entity Name */}
      <div>
        <label className="register-label" style={{ color: 'var(--text-secondary)' }}>
          Facility / Entity Name
        </label>
        <input
          type="text"
          placeholder="e.g. Red Cross Station Bole"
          value={entityName}
          onChange={(e) => setEntityName(e.target.value)}
          required
          className="register-input"
          style={{
            background: 'var(--input-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--input-border)',
          }}
        />
      </div>

      {/* Location — required for stations */}
      <div>
        <label className="register-label" style={{ color: 'var(--text-secondary)' }}>
          Location / City {isStation && <span style={{ color: '#ef233c' }}>*</span>}
        </label>
        <div style={{ position: 'relative' }}>
          <MapPin
            size={15}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="e.g. Bole, Addis Ababa"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required={isStation}
            className="register-input"
            style={{
              paddingLeft: '36px',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--input-border)',
            }}
          />
        </div>
        {isStation && (
          <span className="register-help-text" style={{ color: 'var(--text-muted)' }}>
            Required for donation stations to appear on the donor map.
          </span>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="register-label" style={{ color: 'var(--text-secondary)' }}>
          Workstation Password
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Choose a secure password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="register-input"
            style={{
              paddingRight: '42px',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--input-border)',
            }}
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
        <label className="register-label" style={{ color: 'var(--text-secondary)' }}>
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
              paddingRight: '42px',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
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
            ✗ Passwords do not match
          </span>
        )}
        {password && confirmPassword && password === confirmPassword && (
          <span style={{ color: '#06d6a0', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>
            ✓ Passwords match
          </span>
        )}
      </div>

      <span className="register-help-text" style={{ color: 'var(--text-muted)', background: 'rgba(255,209,102,0.06)', border: '1px solid rgba(255,209,102,0.15)', borderRadius: '6px', padding: '8px 12px', display: 'block' }}>
        ⚠️ Staff/Facility accounts require Administrator approval before logging in.
      </span>

      {/* Submit */}
      <button
        type="submit"
        className="btn btn-primary register-submit staff-submit"
        disabled={loading || (password && confirmPassword && password !== confirmPassword)}
      >
        <UserPlus size={18} />
        {loading ? 'Registering Workstation...' : 'Register Workstation'}
      </button>
    </form>
  );
}