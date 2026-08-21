import React, { useState } from 'react';
import { LogIn, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { api } from '../../../services/api';
import ForgotPassword from './ForgotPassword';
 import ResetPassword from "./ResetPassword";
import './Auth.css';

export default function Login({
  onLoginSuccess,
  onNavigateToRegister
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const data = await api.auth.login(email, password);

      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(
        err.message ||
          'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card animate-fade-in login-card">

      <div className="login-header">
        <h2 className="login-title">
          Blood Bank Hub
        </h2>

        <p className="login-subtitle">
          Sign in to access your actor workstation portal
        </p>
      </div>

      {error && (
        <div className="login-error">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="login-form"
      >
        <div className="login-field">
          <label className="login-label">
            Workstation Email
          </label>

          <input
            type="email"
            placeholder="name@bloodbank.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
          />
        </div>

        <div className="login-field">
          <div className="login-label-row">

            <label className="login-label">
              Secure Password
            </label>

            <button
              type="button"
              className="forgot-password-btn"
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot password?
            </button>

          </div>

          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
              style={{ paddingRight: '42px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              title={showPassword ? 'Hide password' : 'Show password'}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary login-submit"
          disabled={loading}
        >
          {loading ? (
            'Authenticating Workstation...'
          ) : (
            <>
              <LogIn size={18} />
              Sign In to Portal
            </>
          )}
        </button>
      </form>

      <div className="login-register">
        <button
          onClick={onNavigateToRegister}
          className="login-register-btn"
        >
          Need a portal account? Register here
          <ArrowRight size={14} />
        </button>
      </div>

      <ForgotPassword
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />

    </div>
  );
}