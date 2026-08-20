import React, { useState } from 'react';
import { Key, X } from 'lucide-react';
import { api } from '../../../services/api';
import ResetPassword from './ResetPassword';

export default function ForgotPassword({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showResetPassword, setShowResetPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await api.auth.forgotPassword(email);

      if (data.role === 'donor') {
        setSuccess(
          data.message || 'Verification code sent to your email.'
        );

        setShowResetPassword(true);
      } else {
        setSuccess(
          data.message ||
            'Password reset request submitted to Admin.'
        );
      }
    } catch (err) {
      setError(
        err.message || 'Failed to submit password reset request.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError(null);
    setSuccess(null);
    setShowResetPassword(false);
    onClose();
  };

  if (showResetPassword) {
    return (
      <ResetPassword
        email={email}
        onClose={handleClose}
      />
    );
  }

  return (
    <div className="auth-modal-overlay">
      <div className="glass-card auth-modal">

        <button
          className="auth-close"
          onClick={handleClose}
        >
          <X size={18} />
        </button>

        <div className="auth-header">
          <Key size={20} color="var(--primary)" />

          <h3>Account Password Recovery</h3>
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
            Enter your workstation/donor email. Donors will
            receive a verification code to reset their password.
            Other workstation staff requests will be routed to
            the system administrator.
          </p>

          <div className="auth-field">
            <label className="auth-label">
              Email Address
            </label>

            <input
              type="email"
              placeholder="name@bloodbank.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading
              ? 'Processing Request...'
              : 'Send Recovery Request'}
          </button>
        </form>

      </div>
    </div>
  );
}