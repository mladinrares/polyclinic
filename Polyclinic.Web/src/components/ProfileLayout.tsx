import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useState, useEffect } from 'react';

const roleLinks: Record<string, { to: string; icon: string; label: string }[]> = {
  patient: [
    { to: '/dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard' },
    { to: '/medical-history', icon: 'ti-file-text', label: 'Istoric medical' },
    { to: '/referrals', icon: 'ti-file-certificate', label: 'Referral-uri' },
    { to: '/waiting-list', icon: 'ti-clock', label: 'Listă așteptare' },
    { to: '/profile', icon: 'ti-user', label: 'Contul meu' },
  ],
  doctor: [
    { to: '/doctor-dashboard', icon: 'ti-stethoscope', label: 'Dashboard Doctor' },
    { to: '/profile', icon: 'ti-user', label: 'Contul meu' },
  ],
  receptionist: [
    { to: '/reception', icon: 'ti-building-hospital', label: 'Recepție' },
    { to: '/profile', icon: 'ti-user', label: 'Contul meu' },
  ],
  admin: [
    { to: '/admin', icon: 'ti-settings', label: 'Admin' },
    { to: '/reception', icon: 'ti-building-hospital', label: 'Recepție' },
    { to: '/profile', icon: 'ti-user', label: 'Contul meu' },
  ],
};

export default function ProfileLayout() {
  const { user } = useAuthStore();
  const links = roleLinks[user?.role ?? 'patient'] ?? [];
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileNav, setShowMobileNav] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarContent = (
    <div style={{
      background: 'white',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '8px',
    }}>
      <div style={{ padding: '12px 10px 14px', borderBottom: '0.5px solid var(--color-border-tertiary)', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 500, color: '#185FA5', flexShrink: 0 }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.firstName} {user?.lastName}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
          </div>
        </div>
      </div>
      {links.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          onClick={() => setShowMobileNav(false)}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 10px', borderRadius: 'var(--border-radius-md)',
            fontSize: '13px', textDecoration: 'none',
            color: isActive ? '#378ADD' : 'var(--color-text-secondary)',
            background: isActive ? '#E6F1FB' : 'transparent',
            fontWeight: isActive ? 500 : 400,
            transition: 'background 0.15s, color 0.15s',
          })}
        >
          <i className={`ti ${link.icon}`} style={{ fontSize: '16px' }} />
          {link.label}
        </NavLink>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <div>
        {/* Mobile nav toggle */}
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={() => setShowMobileNav(!showMobileNav)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 14px', fontSize: '13px',
              background: 'white', border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-md)', cursor: 'pointer',
              color: 'var(--color-text-primary)',
            }}
          >
            <i className="ti ti-menu-2" style={{ fontSize: '16px' }} />
            Meniu
            <i className={`ti ${showMobileNav ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }} />
          </button>

          {showMobileNav && (
            <div style={{ marginTop: '8px' }}>
              {sidebarContent}
            </div>
          )}
        </div>

        <main>
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      <aside style={{ width: '220px', flexShrink: 0, position: 'sticky', top: '72px' }}>
        {sidebarContent}
      </aside>
      <main style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}