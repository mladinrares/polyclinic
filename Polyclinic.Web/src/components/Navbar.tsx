import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/authApi';
import { notificationsApi } from '../api/notificationsApi';
import type { NotificationDto } from '../types/notification';

export default function Navbar() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const notifMobileRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideDesktop = notifRef.current?.contains(target);
      const insideMobile = notifMobileRef.current?.contains(target);
      if (!insideDesktop && !insideMobile)
        setShowNotifications(false);
      if (userRef.current && !userRef.current.contains(target))
        setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // inchide mobile menu la resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setShowMobileMenu(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // blocheaza scroll cand e deschis
  useEffect(() => {
    document.body.style.overflow = showMobileMenu ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showMobileMenu]);

  const fetchNotifications = async () => {
    try {
      const response = await notificationsApi.getNotifications();
      setNotifications(response.data);
    } catch { }
  };

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllAsRead();
    fetchNotifications();
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) await authApi.revoke(refreshToken);
    } catch { } finally {
      clearAuth();
      navigate('/login');
      setShowMobileMenu(false);
    }
  };

  const roleLabel: Record<string, string> = {
    patient: 'Pacient',
    doctor: 'Doctor',
    receptionist: 'Recepționer',
    admin: 'Administrator',
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });

  const closeMobile = () => setShowMobileMenu(false);

  return (
    <>
      <nav style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        padding: '0 24px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        {/* Logo */}
        <Link to="/" style={{
          fontSize: '17px', fontWeight: 500,
          color: 'var(--color-text-primary)',
          textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#378ADD' }} />
          Policlinica
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          className="desktop-nav">
          <Link to="/doctors" style={navLinkStyle} className="nav-link-hover">
            <i className="ti ti-users" style={{ fontSize: '16px' }} />
            Doctori
          </Link>
          <Link to="/specialties" style={navLinkStyle} className="nav-link-hover">
            <i className="ti ti-stethoscope" style={{ fontSize: '16px' }} />
            Specialități
          </Link>

          <div style={{ width: '0.5px', height: '20px', background: 'var(--color-border-tertiary)', margin: '0 4px' }} />

          {isAuthenticated ? (
            <>
              {/* Notificări */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                  style={{
                    position: 'relative', padding: '7px',
                    borderRadius: 'var(--border-radius-md)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-text-secondary)',
                  }}
                  className="nav-link-hover"
                >
                  <i className="ti ti-bell" style={{ fontSize: '18px' }} />
                  {unreadCount > 0 && (
                    <div style={{
                      position: 'absolute', top: '4px', right: '4px',
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: '#E24B4A', border: '1.5px solid white',
                    }} />
                  )}
                </button>

                {showNotifications && (
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    width: '320px', background: 'white',
                    border: '0.5px solid var(--color-border-tertiary)',
                    borderRadius: 'var(--border-radius-lg)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                  }}>
                    <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Notificări</span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} style={{ fontSize: '12px', color: '#378ADD', background: 'none', border: 'none', cursor: 'pointer' }}>
                          Marchează citite
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '32px 16px' }}>
                          Nu ai notificări
                        </p>
                      ) : notifications.map(notif => (
                        <div key={notif.id} style={{
                          padding: '12px 16px',
                          borderBottom: '0.5px solid var(--color-border-tertiary)',
                          background: !notif.isRead ? 'var(--color-background-info)' : 'transparent',
                        }}>
                          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '2px' }}>{notif.title}</p>
                          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{notif.message}</p>
                          <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>{formatDate(notif.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div ref={userRef} style={{ position: 'relative' }}>
                <div
                  onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'var(--color-background-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', border: '0.5px solid var(--color-border-tertiary)',
                    marginLeft: '4px', color: 'var(--color-text-secondary)',
                  }}
                >
                  <i className="ti ti-user" style={{ fontSize: '18px' }} />
                </div>

                {showUserMenu && (
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    background: 'white', border: '0.5px solid var(--color-border-tertiary)',
                    borderRadius: 'var(--border-radius-lg)', padding: '6px',
                    minWidth: '200px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  }}>
                    <div style={{ padding: '8px 10px 10px', borderBottom: '0.5px solid var(--color-border-tertiary)', marginBottom: '4px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{user?.firstName} {user?.lastName}</p>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '1px' }}>{user?.email}</p>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: 'var(--color-background-success)', color: 'var(--color-text-success)', fontWeight: 500, marginTop: '6px', display: 'inline-block' }}>
                        {roleLabel[user?.role ?? ''] ?? user?.role}
                      </span>
                    </div>
                    {user?.role === 'patient' && <>
                      <DropdownLink to="/dashboard" icon="ti-layout-dashboard" label="Dashboard" onClick={() => setShowUserMenu(false)} />
                      <DropdownLink to="/medical-history" icon="ti-file-text" label="Istoric medical" onClick={() => setShowUserMenu(false)} />
                      <DropdownLink to="/referrals" icon="ti-file-certificate" label="Referral-uri" onClick={() => setShowUserMenu(false)} />
                      <DropdownLink to="/waiting-list" icon="ti-clock" label="Listă așteptare" onClick={() => setShowUserMenu(false)} />
                    </>}
                    {user?.role === 'doctor' && <DropdownLink to="/doctor-dashboard" icon="ti-stethoscope" label="Dashboard Doctor" onClick={() => setShowUserMenu(false)} />}
                    {(user?.role === 'receptionist' || user?.role === 'admin') && <DropdownLink to="/reception" icon="ti-building-hospital" label="Recepție" onClick={() => setShowUserMenu(false)} />}
                    {user?.role === 'admin' && <DropdownLink to="/admin" icon="ti-settings" label="Admin" onClick={() => setShowUserMenu(false)} />}
                    <div style={{ height: '0.5px', background: 'var(--color-border-tertiary)', margin: '4px 0' }} />
                    <DropdownLink to="/profile" icon="ti-user" label="Contul meu" onClick={() => setShowUserMenu(false)} />
                    <div style={{ height: '0.5px', background: 'var(--color-border-tertiary)', margin: '4px 0' }} />
                    <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 10px', borderRadius: 'var(--border-radius-md)', fontSize: '14px', color: 'var(--color-text-danger)', cursor: 'pointer', background: 'none', border: 'none', textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-danger)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <i className="ti ti-logout" style={{ fontSize: '16px' }} />
                      Deconectare
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" style={navLinkStyle} className="nav-link-hover">
                <i className="ti ti-login" style={{ fontSize: '16px' }} />
                Intră în cont
              </Link>
              <Link to="/register" style={{ fontSize: '14px', background: '#378ADD', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: 'var(--border-radius-md)', textDecoration: 'none', fontWeight: 500 }}>
                Înregistrare
              </Link>
            </>
          )}
        </div>

        {/* Mobile right side */}
        <div style={{ display: 'none', alignItems: 'center', gap: '8px' }}
          className="mobile-nav">
          {isAuthenticated && (
            <div ref={notifMobileRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ position: 'relative', padding: '6px', borderRadius: 'var(--border-radius-md)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
              >
                <i className="ti ti-bell" style={{ fontSize: '20px' }} />
                {unreadCount > 0 && (
                  <div style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', borderRadius: '50%', background: '#E24B4A', border: '1.5px solid white' }} />
                )}
              </button>
              {showNotifications && (
                <div style={{
                  position: 'fixed', top: '56px', left: '0', right: '0',
                  background: 'white', borderBottom: '0.5px solid var(--color-border-tertiary)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 999,
                  maxHeight: '60vh', overflowY: 'auto',
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Notificări</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} style={{ fontSize: '12px', color: '#378ADD', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Marchează citite
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '32px 16px' }}>Nu ai notificări</p>
                  ) : notifications.map(notif => (
                    <div key={notif.id} style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)', background: !notif.isRead ? 'var(--color-background-info)' : 'transparent' }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '2px' }}>{notif.title}</p>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{notif.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{ padding: '6px', borderRadius: 'var(--border-radius-md)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-primary)' }}
          >
            <i className={`ti ${showMobileMenu ? 'ti-x' : 'ti-menu-2'}`} style={{ fontSize: '22px' }} />
          </button>
        </div>
      </nav>

      {/* Mobile sidebar overlay */}
      {showMobileMenu && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 998, top: '56px' }}
          onClick={closeMobile}
        />
      )}

      {/* Mobile sidebar */}
      <div style={{
        position: 'fixed', top: '56px', right: 0, bottom: 0,
        width: '280px', background: 'white',
        borderLeft: '0.5px solid var(--color-border-tertiary)',
        zIndex: 999, overflowY: 'auto',
        transform: showMobileMenu ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease',
      }}>
        <div style={{ padding: '16px' }}>

          {/* Nav links */}
          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            <MobileLink to="/doctors" icon="ti-users" label="Doctori" onClick={closeMobile} />
            <MobileLink to="/specialties" icon="ti-stethoscope" label="Specialități" onClick={closeMobile} />
          </div>

          {isAuthenticated ? (
            <>
              {/* User info */}
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#185FA5', flexShrink: 0 }}>
                    <i className="ti ti-user" style={{ fontSize: '18px' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{user?.firstName} {user?.lastName}</p>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{user?.email}</p>
                  </div>
                </div>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: 'var(--color-background-success)', color: 'var(--color-text-success)', fontWeight: 500 }}>
                  {roleLabel[user?.role ?? ''] ?? user?.role}
                </span>
              </div>

              {/* Role links */}
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                {user?.role === 'patient' && <>
                  <MobileLink to="/dashboard" icon="ti-layout-dashboard" label="Dashboard" onClick={closeMobile} />
                  <MobileLink to="/medical-history" icon="ti-file-text" label="Istoric medical" onClick={closeMobile} />
                  <MobileLink to="/referrals" icon="ti-file-certificate" label="Referral-uri" onClick={closeMobile} />
                  <MobileLink to="/waiting-list" icon="ti-clock" label="Listă așteptare" onClick={closeMobile} />
                </>}
                {user?.role === 'doctor' && <MobileLink to="/doctor-dashboard" icon="ti-stethoscope" label="Dashboard Doctor" onClick={closeMobile} />}
                {(user?.role === 'receptionist' || user?.role === 'admin') && <MobileLink to="/reception" icon="ti-building-hospital" label="Recepție" onClick={closeMobile} />}
                {user?.role === 'admin' && <MobileLink to="/admin" icon="ti-settings" label="Admin" onClick={closeMobile} />}
              </div>

              <MobileLink to="/profile" icon="ti-user" label="Contul meu" onClick={closeMobile} />

              <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 8px', borderRadius: 'var(--border-radius-md)', fontSize: '15px', color: 'var(--color-text-danger)', cursor: 'pointer', background: 'none', border: 'none', textAlign: 'left', marginTop: '8px' }}>
                <i className="ti ti-logout" style={{ fontSize: '18px' }} />
                Deconectare
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link to="/login" onClick={closeMobile} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 8px', borderRadius: 'var(--border-radius-md)', fontSize: '15px', color: 'var(--color-text-primary)', textDecoration: 'none' }}>
                <i className="ti ti-login" style={{ fontSize: '18px' }} />
                Intră în cont
              </Link>
              <Link to="/register" onClick={closeMobile} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: 'var(--border-radius-md)', fontSize: '15px', color: 'white', background: '#378ADD', textDecoration: 'none', fontWeight: 500 }}>
                Înregistrare
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .mobile-nav { display: none !important; }
        }
        @media (max-width: 767px) {
          .desktop-nav { display: none !important; }
          .mobile-nav { display: flex !important; }
        }
      `}</style>
    </>
  );
}

const navLinkStyle: React.CSSProperties = {
  fontSize: '14px', color: 'var(--color-text-secondary)',
  textDecoration: 'none', padding: '6px 12px',
  borderRadius: 'var(--border-radius-md)',
  display: 'flex', alignItems: 'center', gap: '6px',
  transition: 'all 0.15s',
};

function DropdownLink({ to, icon, label, onClick }: { to: string; icon: string; label: string; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: 'var(--border-radius-md)', fontSize: '14px', color: 'var(--color-text-secondary)', textDecoration: 'none', transition: 'background 0.12s' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}>
      <i className={`ti ${icon}`} style={{ fontSize: '16px' }} />
      {label}
    </Link>
  );
}

function MobileLink({ to, icon, label, onClick }: { to: string; icon: string; label: string; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 8px', borderRadius: 'var(--border-radius-md)', fontSize: '15px', color: 'var(--color-text-primary)', textDecoration: 'none', transition: 'background 0.12s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
      <i className={`ti ${icon}`} style={{ fontSize: '18px', color: 'var(--color-text-secondary)' }} />
      {label}
    </Link>
  );
}