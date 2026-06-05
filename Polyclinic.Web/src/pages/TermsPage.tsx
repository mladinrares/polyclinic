import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>
      <Link to="/" style={{ fontSize: '13px', color: '#378ADD', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '32px' }}>
        <i className="ti ti-arrow-left" style={{ fontSize: '13px' }} />
        Înapoi acasă
      </Link>

      <h1 style={{ fontSize: '28px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
        Termeni și condiții
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginBottom: '40px' }}>
        Ultima actualizare: {new Date().toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      {[
        {
          title: '1. Acceptarea termenilor',
          content: 'Prin utilizarea platformei Policlinica, acceptați în întregime termenii și condițiile de utilizare. Dacă nu sunteți de acord cu acești termeni, vă rugăm să nu utilizați platforma.',
        },
        {
          title: '2. Descrierea serviciului',
          content: 'Policlinica este o platformă digitală de gestionare a programărilor medicale. Platforma facilitează comunicarea între pacienți și medici, dar nu oferă consultații medicale directe și nu înlocuiește relația medic-pacient.',
        },
        {
          title: '3. Contul de utilizator',
          content: 'Pentru utilizarea platformei trebuie să creați un cont cu date reale și actualizate. Sunteți responsabil pentru securitatea contului dvs. și pentru toate activitățile desfășurate prin acesta. Vă obligați să nu partajați datele de autentificare cu terți.',
        },
        {
          title: '4. Programări medicale',
          content: 'Programările confirmate pe platformă reprezintă un angajament ferm. Anularea unei programări trebuie efectuată cu cel puțin 24 de ore înainte. Neprezentarea repetată fără anulare prealabilă poate duce la restricționarea accesului la platformă.',
        },
        {
          title: '5. Date medicale',
          content: 'Datele medicale introduse în platformă sunt confidențiale și accesibile doar personalului medical autorizat și pacientului în cauză. Platforma nu poate fi responsabilă pentru informații medicale incorecte introduse de utilizatori.',
        },
        {
          title: '6. Plăți',
          content: 'Tarifele afișate pe platformă sunt informative și pot varia. Plata serviciilor medicale se efectuează la clinică. Platforma nu procesează plăți online și nu stochează date bancare.',
        },
        {
          title: '7. Proprietate intelectuală',
          content: 'Toate elementele platformei (design, cod, conținut) sunt proprietatea Policlinica și sunt protejate de legislația privind drepturile de autor. Este interzisă copierea sau reproducerea fără acordul scris al platformei.',
        },
        {
          title: '8. Limitarea răspunderii',
          content: 'Platforma nu este responsabilă pentru calitatea serviciilor medicale furnizate de medici, pentru erori cauzate de date incorecte introduse de utilizatori sau pentru indisponibilitatea temporară a serviciului.',
        },
        {
          title: '9. Modificarea termenilor',
          content: 'Ne rezervăm dreptul de a modifica acești termeni în orice moment. Utilizatorii vor fi notificați prin email cu privire la modificările semnificative. Continuarea utilizării platformei după notificare constituie acceptul noilor termeni.',
        },
        {
          title: '10. Contact',
          content: 'Pentru întrebări legate de termenii și condițiile de utilizare, ne puteți contacta la: contact@policlinica.ro',
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