import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--color-background-primary)',
      borderTop: '0.5px solid var(--color-border-tertiary)',
      padding: '48px 24px 24px',
      marginTop: 'auto',
    }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: '40px',
          marginBottom: '40px',
        }}>
          <div>
            <div style={{
              fontSize: '16px', fontWeight: 500,
              color: 'var(--color-text-primary)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#378ADD' }} />
              Policlinica
            </div>
            <p style={{
              fontSize: '13px', color: 'var(--color-text-secondary)',
              lineHeight: 1.6, marginTop: '12px', maxWidth: '260px',
            }}>
              Servicii medicale de calitate, programări online rapide și sigure. Sănătatea ta, prioritatea noastră.
            </p>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', padding: '4px 10px', borderRadius: '99px',
              background: 'var(--color-background-success)',
              color: 'var(--color-text-success)',
              fontWeight: 500, marginTop: '16px',
            }}>
              <i className="ti ti-shield-check" style={{ fontSize: '13px' }} aria-hidden="true" />
              Date protejate GDPR
            </span>
          </div>

          

          <div>
            <h4 style={{
              fontSize: '12px', fontWeight: 500,
              color: 'var(--color-text-tertiary)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              marginBottom: '16px',
            }}>
              Contact
            </h4>
            <a href="tel:0800123456" style={{ ...footerLinkStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ti ti-phone" style={{ fontSize: '14px' }} aria-hidden="true" />
              0800 123 456
            </a>
            <a href="mailto:contact@policlinica.ro" style={{ ...footerLinkStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ti ti-mail" style={{ fontSize: '14px' }} aria-hidden="true" />
              contact@policlinica.ro
            </a>
            <a href="#" style={{ ...footerLinkStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ti ti-map-pin" style={{ fontSize: '14px' }} aria-hidden="true" />
              Str. Victoriei 10, București
            </a>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              {[
                { icon: 'ti-brand-facebook', label: 'Facebook' },
                { icon: 'ti-brand-instagram', label: 'Instagram' },
                { icon: 'ti-brand-linkedin', label: 'LinkedIn' },
              ].map((social) => (
                <a key={social.label} href="#" aria-label={social.label} style={{
                  width: '32px', height: '32px',
                  borderRadius: 'var(--border-radius-md)',
                  border: '0.5px solid var(--color-border-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-text-secondary)', textDecoration: 'none',
                  transition: 'background 0.15s, color 0.15s',
                }}>
                  <i className={`ti ${social.icon}`} style={{ fontSize: '16px' }} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '0.5px solid var(--color-border-tertiary)',
          paddingTop: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
            © 2025 Policlinica. Toate drepturile rezervate.
          </p>
          <Link to="/privacy-policy" style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', textDecoration: 'none' }}>
            Politica de confidențialitate
          </Link>
          <Link to="/terms" style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', textDecoration: 'none' }}>
            Termeni și condiții
          </Link>
          <Link to="/cookies" style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', textDecoration: 'none' }}>
            Politica de cookie-uri
          </Link>
        </div>
      </div>
    </footer>
  );
}

const footerLinkStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '14px',
  color: 'var(--color-text-secondary)',
  textDecoration: 'none',
  padding: '4px 0',
  transition: 'color 0.15s',
};