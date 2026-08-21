import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function BottomToast({ message, onClose, duration = 10000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div
      className="bottom-toast-container bottom-toast-success"
      role="alert"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <CheckCircle2 size={20} color="#054a3a" style={{ flexShrink: 0 }} />
        <span style={{ color: '#054a3a', fontWeight: 700, fontSize: '0.88rem' }}>{message}</span>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#054a3a',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          opacity: 0.75,
          transition: 'opacity 0.15s ease',
          marginLeft: '12px'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.75')}
        title="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
