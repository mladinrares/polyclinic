import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '../api/authApi';
import { getErrorMessage } from '../utils/errorUtils';
import { useUIContext } from '../hooks/UIContext';

const resetSchema = z.object({
  newPassword: z.string()
    .min(8, 'Parola trebuie să aibă cel puțin 8 caractere')
    .regex(/[A-Z]/, 'Parola trebuie să conțină cel puțin o literă mare')
    .regex(/[a-z]/, 'Parola trebuie să conțină cel puțin o literă mică')
    .regex(/[0-9]/, 'Parola trebuie să conțină cel puțin o cifră')
    .regex(/[^a-zA-Z0-9]/, 'Parola trebuie să conțină cel puțin un caracter special'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Parolele nu coincid',
  path: ['confirmPassword'],
});

type ResetForm = z.infer<typeof resetSchema>;

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '0.5px solid var(--color-border-tertiary)',
  borderRadius: 'var(--border-radius-md)',
  fontSize: '14px', color: 'var(--color-text-primary)',
  background: 'white', boxSizing: 'border-box', outline: 'none',
};

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {toast} = useUIContext();
  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token]);

  const onSubmit = async (data: ResetForm) => {
    if (!token) return;
    setLoading(true);
    
    try {
      await authApi.resetPassword(token, data.newPassword);
      setSuccess(true);
    } catch (err) {
      toast(getErrorMessage(err, 'Token invalid sau expirat'), 'error');
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: 'white', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '40px', width: '100%', maxWidth: '420px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px', justifyContent: 'center' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#378ADD' }} />
          <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Policlinica</span>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="ti ti-check" style={{ fontSize: '24px', color: '#3B6D11' }} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '8px' }}>Parolă resetată!</h1>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              Parola ta a fost schimbată cu succes. Te poți autentifica acum.
            </p>
            <Link to="/login" style={{ display: 'inline-block', background: '#378ADD', color: 'white', padding: '10px 24px', borderRadius: 'var(--border-radius-md)', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
              Intră în cont
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: '22px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px', textAlign: 'center' }}>
              Resetare parolă
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: '28px' }}>
              Introdu noua ta parolă
            </p>

            {error && (
              <div style={{ background: 'var(--color-background-danger)', color: 'var(--color-text-danger)', padding: '10px 14px', borderRadius: 'var(--border-radius-md)', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Parolă nouă</label>
                <input
                  {...register('newPassword')}
                  type="password"
                  placeholder="••••••••"
                  style={{ ...inputStyle, borderColor: errors.newPassword ? '#E24B4A' : 'var(--color-border-tertiary)' }}
                />
                {errors.newPassword && <p style={{ fontSize: '12px', color: '#E24B4A', marginTop: '4px' }}>{errors.newPassword.message}</p>}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Confirmă parola</label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  placeholder="••••••••"
                  style={{ ...inputStyle, borderColor: errors.confirmPassword ? '#E24B4A' : 'var(--color-border-tertiary)' }}
                />
                {errors.confirmPassword && <p style={{ fontSize: '12px', color: '#E24B4A', marginTop: '4px' }}>{errors.confirmPassword.message}</p>}
              </div>

              <div style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '12px', marginBottom: '20px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                <p style={{ marginBottom: '4px', fontWeight: 500 }}>Parola trebuie să conțină:</p>
                <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <li>Cel puțin 8 caractere</li>
                  <li>O literă mare și una mică</li>
                  <li>Cel puțin o cifră</li>
                  <li>Cel puțin un caracter special (!@#$...)</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '11px', background: '#378ADD', color: 'white', border: 'none', borderRadius: 'var(--border-radius-md)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Se procesează...' : 'Resetează parola'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}