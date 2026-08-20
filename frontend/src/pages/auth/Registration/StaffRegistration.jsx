import React from 'react';
import { UserPlus } from 'lucide-react';

export default function StaffRegistration({
  email,
  setEmail,
  password,
  setPassword,
  entityName,
  setEntityName,
  loading,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="register-form staff-registration-form">
      {/* Workstation Email */}
      <div>
        <label className="register-label">
          Workstation Email
        </label>

        <input
          type="email"
          placeholder="e.g. facility@bloodbank.org"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="register-input"
        />
      </div>

      {/* Password */}
      <div>
        <label className="register-label">
          Workstation Password
        </label>

        <input
          type="password"
          placeholder="Choose password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="register-input"
        />
      </div>

      {/* Facility */}
      <div>
        <label className="register-label">
          Facility / Entity Name
        </label>

        <input
          type="text"
          placeholder="e.g. Red Cross Station Bole"
          value={entityName}
          onChange={(e) => setEntityName(e.target.value)}
          required
          className="register-input"
        />

        <span className="register-help-text">
          Note: Staff/Facility accounts require Administrator approval
          before logging in.
        </span>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="btn btn-primary register-submit staff-submit"
        disabled={loading}
      >
        <UserPlus size={18} />
        Register Workstation
      </button>
    </form>
  );
}