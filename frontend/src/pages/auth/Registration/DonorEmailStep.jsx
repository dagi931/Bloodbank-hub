import React from 'react';
import { Mail } from 'lucide-react';

export default function DonorEmailStep({
  email,
  setEmail,
  loading,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="register-form">
      <div>
        <label className="register-label">
          Donor Email Address
        </label>

        <input
          type="email"
          placeholder="e.g. donor@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="register-input"
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary register-submit"
        disabled={loading}
      >
        <Mail size={18} />
        Send Verification Code
      </button>
    </form>
  );
}