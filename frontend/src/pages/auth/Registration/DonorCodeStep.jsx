import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function DonorCodeStep({
  code,
  setCode,
  loading,
  onSubmit,
  onBack,
}) {
  return (
    <form onSubmit={onSubmit} className="register-form">
      <div>
        <label className="register-label">
          Verification Code (6 Digits)
        </label>

        <input
          type="text"
          placeholder="Enter 6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          className="register-input verification-code-input"
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary register-submit"
        disabled={loading}
      >
        <ShieldCheck size={18} />
        Verify Code
      </button>

      <button
        type="button"
        className="btn register-back-button"
        onClick={onBack}
      >
        Back to Role Selector
      </button>
    </form>
  );
}