import { Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>
      <Link to="/" style={{ fontSize: '13px', color: '#378ADD', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '32px' }}>
        <i className="ti ti-arrow-left" style={{ fontSize: '13px' }} />
        Înapoi acasă
      </Link>

      <h1 style={{ fontSize: '28px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
        Politica de confidențialitate
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginBottom: '40px' }}>
        Ultima actualizare: {new Date().toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      {[
        {
          title: '1. Informații generale',
          content: 'Policlinica ("noi", "platforma") respectă confidențialitatea datelor dumneavoastră personale. Această politică descrie modul în care colectăm, utilizăm și protejăm informațiile dvs. în conformitate cu Regulamentul General privind Protecția Datelor (GDPR).',
        },
        {
          title: '2. Date colectate',
          content: 'Colectăm următoarele categorii de date: date de identificare (nume, prenume, email, telefon), date medicale (fișe medicale, programări, rețete), date de autentificare (adresă email, parolă criptată), date de utilizare (istoric programări, recenzii).',
        },
        {
          title: '3. Scopul prelucrării',
          content: 'Datele sunt prelucrate pentru: gestionarea programărilor medicale, furnizarea serviciilor medicale, comunicarea cu pacienții (confirmări, reminder-e), îmbunătățirea serviciilor platformei.',
        },
        {
          title: '4. Cookie-uri',
          content: 'Folosim cookie-uri esențiale pentru funcționarea platformei (autentificare, sesiune) și cookie-uri analitice pentru îmbunătățirea experienței. Puteți refuza cookie-urile non-esențiale prin banner-ul de consimțământ.',
        },
        {
          title: '5. Drepturile dvs.',
          content: 'Conform GDPR, aveți dreptul la: acces la datele dvs., rectificarea datelor incorecte, ștergerea datelor ("dreptul de a fi uitat"), portabilitatea datelor, opoziție față de prelucrare.',
        },
        {
          title: '6. Securitatea datelor',
          content: 'Datele dvs. sunt protejate prin criptare SSL, parole hash-uite cu BCrypt, autentificare JWT cu token-uri de scurtă durată și acces bazat pe roluri.',
        },
        {
          title: '7. Retenția datelor',
          content: 'Datele medicale sunt păstrate conform legislației române în vigoare (minimum 10 ani pentru documentele medicale). Datele de cont inactive sunt șterse după 3 ani.',
        },
        {
          title: '8. Contact',
          content: 'Pentru orice întrebări legate de confidențialitatea datelor, ne puteți contacta la: contact@policlinica.ro',
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
    </div>
  );
}