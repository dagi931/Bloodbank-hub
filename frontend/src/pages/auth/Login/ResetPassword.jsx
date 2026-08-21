import React, { useState } from 'react';
import { Key, X, Eye, EyeOff } from 'lucide-react';
import { api } from '../../../services/api';

export default function ResetPassword({ email, onClose }) {
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await api.auth.resetPasswordDonor(
        email,
        resetCode,
        newPassword
      );

      setSuccess(
        data.message || 'Password reset successful!'
      );

      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      setError(
        err.message || 'Failed to reset password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="glass-card auth-modal">

        <button
          className="auth-close"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <div className="auth-header">
          <Key size={20} color="var(--primary)" />

          <h3>Reset Password</h3>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-success">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >
          <p className="auth-message">
            Enter the verification code sent to your email
            and create your new password.
          </p>

          <div className="auth-field">
            <label className="auth-label">
              Verification Code
            </label>

            <input
              type="text"
              placeholder="123456"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              required
              className="auth-input"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">
              New Password
            </label>

            <div style={{ position: 'relative' }}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="auth-input"
                style={{ paddingRight: '42px' }}
              />
              <button type="button" onClick={() => setShowNewPassword((value) => !value)} title={showNewPassword ? 'Hide password' : 'Show password'} aria-label={showNewPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">
              Confirm Password
            </label>

            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="auth-input"
                style={{ paddingRight: '42px' }}
              />
              <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} title={showConfirmPassword ? 'Hide password' : 'Show password'} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading
              ? 'Updating Password...'
              : 'Reset Secure Password'}
          </button>
        </form>

      </div>
    </div>
  );
}