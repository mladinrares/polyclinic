import { Link } from 'react-router-dom';

export default function CookiePolicyPage() {
  const handleResetConsent = () => {
    localStorage.removeItem('cookieConsent');
    window.location.reload();
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>
      <Link to="/" style={{ fontSize: '13px', color: '#378ADD', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '32px' }}>
        <i className="ti ti-arrow-left" style={{ fontSize: '13px' }} />
        Înapoi acasă
      </Link>

      <h1 style={{ fontSize: '28px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
        Politica de cookie-uri
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginBottom: '40px' }}>
        Ultima actualizare: {new Date().toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      {[
        {
          title: '1. Ce sunt cookie-urile?',
          content: 'Cookie-urile sunt fișiere text de mici dimensiuni stocate pe dispozitivul dvs. când vizitați un site web. Acestea permit site-ului să vă recunoască și să rețină preferințele dvs. pentru vizitele ulterioare.',
        },
        {
          title: '2. Cookie-uri esențiale',
          content: 'Aceste cookie-uri sunt necesare pentru funcționarea platformei și nu pot fi dezactivate. Includ: token-ul de autentificare (JWT) pentru menținerea sesiunii, refresh token pentru reîmprospătarea automată a sesiunii, preferințele de consimțământ cookie.',
        },
        {
          title: '3. Cookie-uri de performanță',
          content: 'Aceste cookie-uri ne ajută să înțelegem cum este utilizată platforma, ce pagini sunt vizitate cel mai des și cum putem îmbunătăți experiența utilizatorilor. Datele colectate sunt anonime.',
        },
        {
          title: '4. Cookie-uri de funcționalitate',
          content: 'Aceste cookie-uri permit platformei să rețină alegerile dvs. (cum ar fi preferințele de limbă sau filtrul de specialitate selectat) pentru a vă oferi o experiență personalizată.',
        },
        {
          title: '5. Cookie-uri terțe',
          content: 'Platforma poate utiliza servicii terțe (Google OAuth pentru autentificare) care pot plasa propriile cookie-uri. Aceste cookie-uri sunt guvernate de politicile de confidențialitate ale respectivelor servicii.',
        },
        {
          title: '6. Gestionarea cookie-urilor',
          content: 'Puteți gestiona preferințele de cookie-uri prin setările browser-ului dvs. sau prin banner-ul de consimțământ afișat la prima vizită. Dezactivarea cookie-urilor esențiale poate afecta funcționalitatea platformei.',
        },
        {
          title: '7. Durata de stocare',
          content: 'Cookie-urile de sesiune sunt șterse când închideți browser-ul. Cookie-urile persistente (refresh token) sunt stocate maximum 7 zile. Preferința de consimțământ cookie este stocată pe termen nelimitat sau până la resetarea manuală.',
        },
      ].map(section => (
        <div key={section.title} style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
            {section.title}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
            {section.content}
          </p>
        </div>
      ))}

      <div style={{
        background: 'var(--color-background-secondary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '20px',
        marginTop: '16px',
      }}>
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
          Resetează preferințele cookie
        </p>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          Apasă butonul de mai jos pentru a reseta preferințele de cookie și a vedea din nou banner-ul de consimțământ.
        </p>
        <button
          onClick={handleResetConsent}
          style={{
            padding: '8px 16px', fontSize: '13px',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-md)',
            background: 'white', color: 'var(--color-text-primary)',
            cursor: 'pointer',
          }}
        >
          Resetează preferințele
        </button>
      </div>
    </div>
  );
}