import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import { getErrorMessage } from '../utils/errorUtils';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { trackEvent } from '../utils/analytics';
import { useUIContext } from '../hooks/UIContext';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '0.5px solid var(--color-border-tertiary)',
  borderRadius: 'var(--border-radius-md)',
  fontSize: '14px',
  color: 'var(--color-text-primary)',
  background: 'white',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.15s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  color: 'var(--color-text-secondary)',
  marginBottom: '6px',
};

const socialBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '0.5px solid var(--color-border-tertiary)',
  borderRadius: 'var(--border-radius-md)',
  fontSize: '14px',
  color: 'var(--color-text-primary)',
  background: 'white',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  transition: 'background 0.15s',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {toast} = useUIContext();

  const registerSchema = z.object({
    firstName: z.string().min(2, 'Prenumele trebuie să aibă cel puțin 2 caractere'),
    lastName: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere'),
    email: z.string().email('Email invalid'),
    phone: z.string().regex(/^(\+40|0)[0-9]{9}$/, 'Număr de telefon invalid').optional().or(z.literal('')),
    password: z.string()
      .min(8, 'Parola trebuie să aibă cel puțin 8 caractere')
      .regex(/[A-Z]/, 'Parola trebuie să conțină cel puțin o literă mare')
      .regex(/[^a-zA-Z0-9]/, 'Parola trebuie să conțină cel puțin un caracter special'),
    confirmPassword: z.string(),
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Parolele nu coincid',
    path: ['confirmPassword'],
  });

  type RegisterForm = z.infer<typeof registerSchema>;

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? '',
      });
      setAuth(response.data);
      navigate('/dashboard');
      trackEvent('register', '/register');
    } catch (err) {
      
      toast('A apărut o eroare la înregistrare', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    window.location.href = `http://localhost:5289/api/auth/social/${provider}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-background-secondary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 'var(--border-radius-lg)',
        border: '0.5px solid var(--color-border-tertiary)',
        padding: '40px',
        width: '100%',
        maxWidth: '460px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px', justifyContent: 'center' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#378ADD' }} />
          <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Policlinica</span>
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px', textAlign: 'center' }}>
          Creează cont
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: '28px' }}>
          Înregistrează-te pentru a te putea programa online
        </p>

        {error && (
          <div style={{ background: 'var(--color-background-danger)', color: 'var(--color-text-danger)', padding: '10px 14px', borderRadius: 'var(--border-radius-md)', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Social login */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          <button
            onClick={() => handleSocialLogin('google')}
            style={socialBtnStyle}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Înregistrează-te cu Google
          </button>
          {/* <button
            onClick={() => handleSocialLogin('facebook')}
            style={socialBtnStyle}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Înregistrează-te cu Facebook
          </button> */}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '0.5px', background: 'var(--color-border-tertiary)' }} />
          <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>sau</span>
          <div style={{ flex: 1, height: '0.5px', background: 'var(--color-border-tertiary)' }} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>Prenume</label>
              <input
                {...register('firstName')}
                type="text"
                placeholder="Ion"
                style={{ ...inputStyle, borderColor: errors.firstName ? '#E24B4A' : 'var(--color-border-tertiary)' }}
                onFocus={e => e.currentTarget.style.borderColor = errors.firstName ? '#E24B4A' : '#378ADD'}
                onBlur={e => e.currentTarget.style.borderColor = errors.firstName ? '#E24B4A' : 'var(--color-border-tertiary)'}
              />
              {errors.firstName && <p style={{ fontSize: '12px', color: '#E24B4A', marginTop: '4px' }}>{errors.firstName.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>Nume</label>
              <input
                {...register('lastName')}
                type="text"
                placeholder="Popescu"
                style={{ ...inputStyle, borderColor: errors.lastName ? '#E24B4A' : 'var(--color-border-tertiary)' }}
                onFocus={e => e.currentTarget.style.borderColor = errors.lastName ? '#E24B4A' : '#378ADD'}
                onBlur={e => e.currentTarget.style.borderColor = errors.lastName ? '#E24B4A' : 'var(--color-border-tertiary)'}
              />
              {errors.lastName && <p style={{ fontSize: '12px', color: '#E24B4A', marginTop: '4px' }}>{errors.lastName.message}</p>}
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="ion@example.com"
              style={{ ...inputStyle, borderColor: errors.email ? '#E24B4A' : 'var(--color-border-tertiary)' }}
              onFocus={e => e.currentTarget.style.borderColor = errors.email ? '#E24B4A' : '#378ADD'}
              onBlur={e => e.currentTarget.style.borderColor = errors.email ? '#E24B4A' : 'var(--color-border-tertiary)'}
            />
            {errors.email && <p style={{ fontSize: '12px', color: '#E24B4A', marginTop: '4px' }}>{errors.email.message}</p>}
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Telefon (opțional)</label>
            <input
              {...register('phone')}
              type="tel"
              placeholder="0712345678"
              style={{ ...inputStyle, borderColor: errors.phone ? '#E24B4A' : 'var(--color-border-tertiary)' }}
              onFocus={e => e.currentTarget.style.borderColor = errors.phone ? '#E24B4A' : '#378ADD'}
              onBlur={e => e.currentTarget.style.borderColor = errors.phone ? '#E24B4A' : 'var(--color-border-tertiary)'}
            />
            {errors.phone && <p style={{ fontSize: '12px', color: '#E24B4A', marginTop: '4px' }}>{errors.phone.message}</p>}
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Parolă</label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              style={{ ...inputStyle, borderColor: errors.password ? '#E24B4A' : 'var(--color-border-tertiary)' }}
              onFocus={e => e.currentTarget.style.borderColor = errors.password ? '#E24B4A' : '#378ADD'}
              onBlur={e => e.currentTarget.style.borderColor = errors.password ? '#E24B4A' : 'var(--color-border-tertiary)'}
            />
            {errors.password && <p style={{ fontSize: '12px', color: '#E24B4A', marginTop: '4px' }}>{errors.password.message}</p>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Confirmă parola</label>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="••••••••"
              style={{ ...inputStyle, borderColor: errors.confirmPassword ? '#E24B4A' : 'var(--color-border-tertiary)' }}
              onFocus={e => e.currentTarget.style.borderColor = errors.confirmPassword ? '#E24B4A' : '#378ADD'}
              onBlur={e => e.currentTarget.style.borderColor = errors.confirmPassword ? '#E24B4A' : 'var(--color-border-tertiary)'}
            />
            {errors.confirmPassword && <p style={{ fontSize: '12px', color: '#E24B4A', marginTop: '4px' }}>{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '11px',
              background: '#378ADD', color: 'white',
              border: 'none', borderRadius: 'var(--border-radius-md)',
              fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Se încarcă...' : 'Creează cont'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '20px' }}>
          Ai deja cont?{' '}
          <Link to="/login" style={{ color: '#378ADD', textDecoration: 'none' }}>
            Intră în cont
          </Link>
        </p>
      </div>
    </div>
  );
}