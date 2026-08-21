import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, RefreshCw } from 'lucide-react';

export default function DonorCodeStep({
  email,
  code,
  setCode,
  loading,
  onSubmit,
  onBack,
  onResend,
}) {
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (!onResend || resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await onResend();
      setResendSuccess(true);
      setResendCooldown(60); // 60 second cooldown
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err) {
      // Error is handled in the parent Register.jsx via setError
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="register-form">

      {/* Email reminder banner */}
      <div style={{
        background: 'rgba(58, 134, 255, 0.08)',
        border: '1px solid rgba(58, 134, 255, 0.2)',
        borderRadius: '10px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}>
        <Mail size={18} style={{ color: '#3a86ff', flexShrink: 0, marginTop: '1px' }} />
        <div>
          <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Verification email sent
          </p>
          <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            A 6-digit code was sent to <strong style={{ color: '#3a86ff' }}>{email}</strong>. Check your inbox and spam folder.
          </p>
        </div>
      </div>

      {/* Code input */}
      <div>
        <label className="register-label" style={{ color: 'var(--text-secondary)' }}>
          Verification Code (6 Digits)
        </label>

        <input
          type="text"
          placeholder="e.g.  4  8  2  9  1  7"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          required
          maxLength={6}
          className="register-input verification-code-input"
          style={{
            letterSpacing: '0.25em',
            fontSize: '1.4rem',
            textAlign: 'center',
            fontWeight: 700,
            background: 'var(--input-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--input-border)',
          }}
        />
      </div>

      {/* Verify button */}
      <button
        type="submit"
        className="btn btn-primary register-submit"
        disabled={loading || code.length < 6}
      >
        <ShieldCheck size={18} />
        {loading ? 'Verifying...' : 'Verify Code'}
      </button>

      {/* Resend section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        paddingTop: '4px',
        borderTop: '1px solid var(--border-color)',
      }}>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Didn&apos;t receive the email?
        </p>

        {resendSuccess && (
          <div style={{
            background: 'rgba(6, 214, 160, 0.1)',
            border: '1px solid rgba(6, 214, 160, 0.25)',
            borderRadius: '6px',
            padding: '8px 14px',
            fontSize: '0.78rem',
            color: '#06d6a0',
            fontWeight: 600,
            textAlign: 'center',
          }}>
            ✓ New code sent! Check your inbox.
          </div>
        )}

        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || resendLoading}
          style={{
            background: 'none',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--primary)',
            cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            padding: '8px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
            opacity: resendCooldown > 0 ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (resendCooldown === 0 && !resendLoading) {
              e.currentTarget.style.background = 'rgba(239,35,60,0.06)';
              e.currentTarget.style.borderColor = 'var(--primary)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          <RefreshCw size={14} className={resendLoading ? 'animate-spin' : ''} />
          {resendLoading
            ? 'Sending...'
            : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend Verification Email'}
        </button>

        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Make sure to also check your <strong>spam / junk</strong> folder.
        </p>
      </div>

      {/* Back button */}
      <button
        type="button"
        className="btn register-back-button"
        onClick={onBack}
        style={{ justifyContent: 'center', color: 'var(--text-secondary)' }}
      >
        ← Change Email / Role
      </button>
    </form>
  );
}