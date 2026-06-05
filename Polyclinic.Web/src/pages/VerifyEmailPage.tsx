import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/authApi';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const { setEmailVerified } = useAuthStore();

  useEffect(() => {
    const success = searchParams.get('success');
    const token = searchParams.get('token');

    if (success === 'true') {
      setEmailVerified();
      setStatus('success');
      return;
    }
    if (success === 'false') {
      setStatus('error');
      return;
    }

    // flow normal cu token direct
    if (!token) { setStatus('error'); return; }
    const verify = async () => {
      try {
        await authApi.verifyEmail(token);
        setEmailVerified();
        setStatus('success');
      } catch {
        setStatus('error');
        
      }
    };
    verify();
  }, []);

  if (status === 'loading') return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Se verifică...</p>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--color-background-secondary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{
        background: 'white', border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)', padding: '40px',
        width: '100%', maxWidth: '420px', textAlign: 'center',
      }}>
        {status === 'success' ? (
          <>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="ti ti-check" style={{ fontSize: '24px', color: '#3B6D11' }} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '8px' }}>Email verificat!</h1>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              Adresa ta de email a fost verificată cu succes.
            </p>
            <Link to="/dashboard" style={{ display: 'inline-block', background: '#378ADD', color: 'white', padding: '10px 24px', borderRadius: 'var(--border-radius-md)', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
              Mergi la dashboard
            </Link>
          </>
        ) : (
          <>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="ti ti-x" style={{ fontSize: '24px', color: '#A32D2D' }} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '8px' }}>Link invalid sau expirat</h1>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              Link-ul de verificare este invalid sau a expirat.
            </p>
            <Link to="/register" style={{ display: 'inline-block', background: '#378ADD', color: 'white', padding: '10px 24px', borderRadius: 'var(--border-radius-md)', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
              Înregistrează-te
            </Link>
          </>
        )}
      </div>
    </div>
  );
}