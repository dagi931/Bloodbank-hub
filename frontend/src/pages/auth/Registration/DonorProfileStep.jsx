import React from 'react';
import { UserPlus } from 'lucide-react';

export default function DonorProfileStep({
  password,
  setPassword,
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
  const handleFaydaIdChange = (e) => {
    setFaydaId(e.target.value);
  };

  return (
    <form onSubmit={onSubmit} className="register-form donor-profile-form">

      {/* Password */}
      <div>
        <label className="register-label">
          Set Password
        </label>

        <input
          type="password"
          placeholder="Choose secure password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="register-input"
        />
      </div>

      {/* Donor Demographic Details */}
      <div className="donor-demographics">

        <h3 className="register-section-title">
          Donor Demographic Details
        </h3>

        {/* FAYDA ID */}
        <div className="fayda-section">

          <label className="register-small-label">
            FAYDA National ID
          </label>

          <div className="fayda-input-row">

            <input
              type="text"
              placeholder="e.g. ET-001"
              value={faydaId}
              onChange={handleFaydaIdChange}
              className="register-input fayda-input"
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
              ✓ Core demographics linked and auto-filled.
            </div>
          )}

          {faydaStatus === 'error' && (
            <div className="fayda-error">
              ✗ No record found. Enter details manually below.
            </div>
          )}

        </div>

        {/* Full Name + Phone */}
        <div className="register-two-column">

          <div>
            <label className="register-small-label">
              Full Name
            </label>

            <input
              type="text"
              placeholder="e.g. Yonathan Abebe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              readOnly={faydaLinked}
              className={`register-input ${
                faydaLinked ? 'fayda-filled-input' : ''
              }`}
            />
          </div>

          <div>
            <label className="register-small-label">
              Phone Number
            </label>

            <input
              type="text"
              placeholder="e.g. +251911223344"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="register-input"
            />
          </div>

        </div>

        {/* Date of Birth + Gender */}
        <div className="register-two-column">

          <div>
            <label className="register-small-label">
              Date of Birth
            </label>

            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
              readOnly={faydaLinked}
              className={`register-input ${
                faydaLinked ? 'fayda-filled-input' : ''
              }`}
            />
          </div>

          <div>
            <label className="register-small-label">
              Gender
            </label>

            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              disabled={faydaLinked}
              className="register-input"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

        </div>

        {/* Address */}
        <div>
          <label className="register-small-label">
            Home Address
          </label>

          <input
            type="text"
            placeholder="e.g. Bole, Addis Ababa"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            className="register-input"
          />
        </div>

      </div>

      {/* Submit */}
      <button
        type="submit"
        className="btn btn-primary register-submit"
        disabled={loading}
      >
        <UserPlus size={18} />
        Register Profile Account
      </button>

    </form>
  );
}