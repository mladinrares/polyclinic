import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { jwtDecode } from 'jwt-decode';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore(state => state.setAuth);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      const decoded: any = jwtDecode(accessToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setAuth({
        accessToken,
        refreshToken,
        role: decoded.role,
        firstName: decoded.firstName ?? '',
        lastName: decoded.lastName ?? '',
        email: decoded.email ?? '',
        expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : '',
        userId: decoded.sub ?? '',
        });
      navigate('/dashboard');
    } else {
      navigate('/login?error=social_failed');
    }
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-tertiary)' }}>
      Se autentifică...
    </div>
  );
}