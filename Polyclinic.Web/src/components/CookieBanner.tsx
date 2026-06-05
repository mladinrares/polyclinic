import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '24px', left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 48px)', maxWidth: '600px',
      background: 'white',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '20px 24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: '16px',
      flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
          Folosim cookie-uri
        </p>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
        Folosim cookie-uri <strong>esențiale</strong> pentru autentificare și cookie-uri <strong>opționale</strong> pentru preferințe.{' '}
        <Link to="/cookies" style={{ color: '#378ADD', textDecoration: 'none' }}>
            Politica de cookie-uri
        </Link>
        {' · '}
        <Link to="/privacy-policy" style={{ color: '#378ADD', textDecoration: 'none' }}>
            Confidențialitate
        </Link>
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={handleDecline}
          style={{
            padding: '8px 16px', fontSize: '13px',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-md)',
            background: 'white', color: 'var(--color-text-secondary)',
            cursor: 'pointer',
          }}
        >
          Refuz
        </button>
        <button
          onClick={handleAccept}
          style={{
            padding: '8px 16px', fontSize: '13px',
            background: '#378ADD', color: 'white',
            border: 'none', borderRadius: 'var(--border-radius-md)',
            cursor: 'pointer', fontWeight: 500,
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}