import { Link, useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '420px' }}>
        <p style={{ fontSize: '72px', fontWeight: 500, color: 'var(--color-border-tertiary)', lineHeight: 1, marginBottom: '16px' }}>
          404
        </p>
        <h1 style={{ fontSize: '22px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
          Pagina nu a fost găsită
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
          Pagina pe care o cauți nu există sau a fost mutată.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 20px',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '14px', color: 'var(--color-text-primary)',
              background: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: '14px' }} />
            Înapoi
          </button>
          <Link to="/" style={{
            padding: '10px 20px',
            background: '#378ADD', color: 'white',
            borderRadius: 'var(--border-radius-md)',
            fontSize: '14px', fontWeight: 500,
            textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <i className="ti ti-home" style={{ fontSize: '14px' }} />
            Acasă
          </Link>
        </div>
      </div>
    </div>
  );
}