import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  options?: Option[];
}

interface Option {
  label: string;
  value: string;
}

const MAIN_MENU: Option[] = [
  { label: '👤 Cont și autentificare', value: 'menu_cont' },
  { label: '📅 Programări', value: 'menu_programari' },
  { label: '🏥 Card CNAS', value: 'menu_cnas' },
  { label: '📋 Referral-uri', value: 'menu_referral' },
  { label: '🩺 Sănătate generală', value: 'menu_sanatate' },
  { label: '❓ Altceva', value: 'menu_altceva' },
];

const FLOWS: Record<string, { answer: string; options?: Option[] }> = {
  menu_cont: {
    answer: 'Despre cont, te pot ajuta cu:',
    options: [
      { label: 'Cum îmi creez un cont?', value: 'cont_creare' },
      { label: 'Am uitat parola', value: 'cont_parola' },
      { label: 'Nu am primit email de verificare', value: 'cont_email' },
      { label: 'Cum mă autentific cu Google?', value: 'cont_google' },
      { label: '← Înapoi', value: 'menu_main' },
    ],
  },
  cont_creare: {
    answer: 'Pentru a-ți crea un cont:\n1. Apasă butonul "Înregistrare" din meniul de sus\n2. Completează numele, email-ul și o parolă puternică\n3. Verifică email-ul primit și apasă linkul de confirmare\n4. După verificare vei putea face programări online',
    options: [
      { label: 'Ce condiții trebuie să îndeplinească parola?', value: 'cont_parola_conditii' },
      { label: '← Înapoi la meniu cont', value: 'menu_cont' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  cont_parola_conditii: {
    answer: 'Parola trebuie să conțină:\n• Minim 8 caractere\n• Cel puțin o literă mare (A-Z)\n• Cel puțin o literă mică (a-z)\n• Cel puțin o cifră (0-9)\n• Cel puțin un caracter special (!@#$...)',
    options: [
      { label: '← Înapoi la meniu cont', value: 'menu_cont' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  cont_parola: {
    answer: 'Dacă ai uitat parola:\n1. Mergi la pagina de Login\n2. Apasă "Ai uitat parola?" de sub butonul de autentificare\n3. Introdu adresa de email\n4. Vei primi un link de resetare valabil 1 oră\n5. Accesează linkul și setează o parolă nouă',
    options: [
      { label: '← Înapoi la meniu cont', value: 'menu_cont' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  cont_email: {
    answer: 'Dacă nu ai primit email-ul de verificare:\n• Verifică folderul Spam/Junk\n• Asigură-te că ai introdus adresa corectă\n• Intră în cont și din pagina de programare poți solicita retrimite email-ul\n• Email-ul poate întârzia până la 5 minute',
    options: [
      { label: '← Înapoi la meniu cont', value: 'menu_cont' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  cont_google: {
    answer: 'Poți folosi contul Google pentru autentificare rapidă:\n1. Pe pagina de Login sau Înregistrare apasă butonul "Continuă cu Google"\n2. Selectează contul tău Google\n3. La prima autentificare se creează automat un cont\n4. Nu ai nevoie de parolă separată',
    options: [
      { label: '← Înapoi la meniu cont', value: 'menu_cont' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },

  menu_programari: {
    answer: 'Despre programări, te pot ajuta cu:',
    options: [
      { label: 'Cum fac o programare online?', value: 'prog_creare' },
      { label: 'Cum anulez o programare?', value: 'prog_anulare' },
      { label: 'Nu există sloturi disponibile', value: 'prog_waiting' },
      { label: 'Ce este check-in-ul?', value: 'prog_checkin' },
      { label: 'Cum plătesc consultația?', value: 'prog_plata' },
      { label: '← Înapoi', value: 'menu_main' },
    ],
  },
  prog_creare: {
    answer: 'Pentru a face o programare online:\n1. Mergi la pagina Doctori și găsește medicul dorit\n2. Apasă pe profilul doctorului\n3. Apasă "Programează-te"\n4. Selectează serviciul, locația, data și ora\n5. Confirmă programarea\n\nVei primi un email de confirmare automat.',
    options: [
      { label: 'Ce servicii necesită referral?', value: 'prog_referral' },
      { label: 'Cum beneficiez de reducere CNAS?', value: 'prog_cnas' },
      { label: '← Înapoi la programări', value: 'menu_programari' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  prog_referral: {
    answer: 'Unele servicii necesită bilet de trimitere (referral):\n• La selectarea serviciului vei vedea dacă necesită referral\n• Dacă ai un referral intern emis de un alt doctor din clinică, e detectat automat\n• Dacă ai un referral extern (de la alt medic), îl poți încărca ca PDF la pasul de programare',
    options: [
      { label: '← Înapoi la programări', value: 'menu_programari' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  prog_cnas: {
    answer: 'Pentru a beneficia de reducere CNAS la programare:\n1. Adaugă cardul CNAS în profilul tău (secțiunea Card CNAS)\n2. Cardul trebuie validat de recepție\n3. La programare, dacă serviciul e acoperit CNAS, reducerea se aplică automat\n4. Prețul final e afișat înainte de confirmare',
    options: [
      { label: 'Cum adaug cardul CNAS?', value: 'cnas_adaugare' },
      { label: '← Înapoi la programări', value: 'menu_programari' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  prog_anulare: {
    answer: 'Pentru a anula o programare:\n1. Mergi la Dashboard (meniul contului tău)\n2. Găsește programarea în lista de programări viitoare\n3. Apasă butonul de anulare\n4. Confirmă anularea și introdu motivul\n\nSlotul devine disponibil automat pentru alți pacienți.',
    options: [
      { label: '← Înapoi la programări', value: 'menu_programari' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  prog_waiting: {
    answer: 'Dacă nu există sloturi disponibile:\n1. Pe pagina de programare apare butonul "Înscrie-te pe lista de așteptare"\n2. Apasă și confirmă înscrierea\n3. Vei primi o notificare automată când se eliberează un slot\n4. Poți vedea lista de așteptare în meniul contului tău',
    options: [
      { label: '← Înapoi la programări', value: 'menu_programari' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  prog_checkin: {
    answer: 'Check-in-ul confirmă prezența ta la clinică:\n• Se face la recepție când ajungi la programare\n• Recepționistul îți marchează check-in-ul în sistem\n• Doar după check-in doctorul poate finaliza consultația și completa fișa medicală',
    options: [
      { label: '← Înapoi la programări', value: 'menu_programari' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  prog_plata: {
    answer: 'Plata consultației se face la clinică, după finalizarea consultației:\n• Cash\n• Card bancar\n• Asigurare (dacă aplicabil)\n\nRecepționistul procesează plata și o marchează în sistem.',
    options: [
      { label: '← Înapoi la programări', value: 'menu_programari' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },

  menu_cnas: {
    answer: 'Cardul CNAS îți permite reduceri la consultații acoperite de asigurarea de sănătate. Te pot ajuta cu:',
    options: [
      { label: 'Cum adaug cardul CNAS?', value: 'cnas_adaugare' },
      { label: 'De ce trebuie validat cardul?', value: 'cnas_validare' },
      { label: 'Cardul meu a expirat', value: 'cnas_expirat' },
      { label: 'Ce servicii sunt acoperite CNAS?', value: 'cnas_servicii' },
      { label: '← Înapoi', value: 'menu_main' },
    ],
  },
  cnas_adaugare: {
    answer: 'Pentru a adăuga cardul CNAS în cont:\n1. Mergi la Profil (meniul contului din dreapta sus)\n2. Găsește secțiunea "Card CNAS"\n3. Completează: numele titularului, codul asigurat, numărul documentului și data expirării\n4. Salvează — cardul e trimis spre validare recepției\n5. După validare poți beneficia de reduceri la programări',
    options: [
      { label: 'De ce trebuie validat de recepție?', value: 'cnas_validare' },
      { label: '← Înapoi la CNAS', value: 'menu_cnas' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  cnas_validare: {
    answer: 'Validarea cardului CNAS de către recepție este necesară pentru:\n• Verificarea autenticității documentului\n• Confirmarea că datele introduse sunt corecte\n• Prevenirea fraudelor\n\nRecepționistul verifică fizic cardul la prima ta vizită și îl validează în sistem. Procesul durează de obicei câteva minute.',
    options: [
      { label: '← Înapoi la CNAS', value: 'menu_cnas' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  cnas_expirat: {
    answer: 'Dacă cardul tău CNAS a expirat:\n• Sistemul îl dezactivează automat la data expirării\n• Mergi la medicul de familie pentru reînnoirea asigurării\n• După reînnoire, actualizează data expirării în profilul tău\n• Cardul actualizat va necesita revalidare de la recepție',
    options: [
      { label: '← Înapoi la CNAS', value: 'menu_cnas' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  cnas_servicii: {
    answer: 'Serviciile acoperite CNAS sunt marcate special în aplicație:\n• La selectarea serviciului pentru programare, serviciile CNAS au o etichetă specială\n• Reducerea se aplică automat dacă ai un card CNAS valid și validat\n• Prețul final (după reducere) e afișat înainte de confirmare\n• Unele servicii pot fi complet gratuite cu CNAS',
    options: [
      { label: 'Cum adaug cardul CNAS?', value: 'cnas_adaugare' },
      { label: '← Înapoi la CNAS', value: 'menu_cnas' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },

  menu_referral: {
    answer: 'Despre referral-uri (bilete de trimitere), te pot ajuta cu:',
    options: [
      { label: 'Ce este un referral?', value: 'ref_ce_este' },
      { label: 'Cum obțin un referral intern?', value: 'ref_intern' },
      { label: 'Am un referral extern (PDF)', value: 'ref_extern' },
      { label: 'Referral-ul meu a expirat', value: 'ref_expirat' },
      { label: '← Înapoi', value: 'menu_main' },
    ],
  },
  ref_ce_este: {
    answer: 'Un referral (bilet de trimitere) este un document medical care:\n• Îți permite accesul la anumite servicii specializate\n• E emis de un medic (de familie sau specialist)\n• Are o perioadă de valabilitate limitată\n• E necesar pentru servicii care necesită trimitere medicală',
    options: [
      { label: 'Cum obțin un referral intern?', value: 'ref_intern' },
      { label: '← Înapoi la referral-uri', value: 'menu_referral' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  ref_intern: {
    answer: 'Un referral intern este emis de un doctor din clinica noastră:\n1. Consultă un medic din clinică\n2. Dacă e necesar, medicul emite un referral pentru alt specialist\n3. Referral-ul apare automat în contul tău la secțiunea Referral-uri\n4. La programarea la specialist, referral-ul e detectat automat',
    options: [
      { label: '← Înapoi la referral-uri', value: 'menu_referral' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  ref_extern: {
    answer: 'Dacă ai un referral de la un medic din afara clinicii:\n1. La pasul de programare, dacă serviciul necesită referral, apare opțiunea de încărcare\n2. Apasă "Încarcă referral extern (PDF)"\n3. Selectează fișierul PDF\n4. Programarea intră în starea "Referral în așteptare"\n5. Recepția verifică documentul și aprobă sau respinge referral-ul',
    options: [
      { label: '← Înapoi la referral-uri', value: 'menu_referral' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  ref_expirat: {
    answer: 'Referral-urile au o perioadă de valabilitate:\n• Sistemul marchează automat referral-urile expirate\n• Un referral expirat nu mai poate fi folosit pentru programări\n• Trebuie să obții un referral nou de la medicul emitent\n• Valabilitatea e afișată pe referral în secțiunea Referral-uri din cont',
    options: [
      { label: '← Înapoi la referral-uri', value: 'menu_referral' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },

  menu_sanatate: {
    answer: 'Te pot ajuta cu informații generale de sănătate. Reține că acestea nu înlocuiesc consultul medical!',
    options: [
      { label: 'Simptome răceală și gripă', value: 'san_raceala' },
      { label: 'Tensiune arterială', value: 'san_tensiune' },
      { label: 'Diabet și glicemie', value: 'san_diabet' },
      { label: 'Când merg urgent la doctor?', value: 'san_urgenta' },
      { label: 'Analize de rutină recomandate', value: 'san_analize' },
      { label: '← Înapoi', value: 'menu_main' },
    ],
  },
  san_raceala: {
    answer: 'Răceala vs gripă:\n\nRăceală: apare treptat, simptome ușoare — nas înfundat, tuse ușoară, durere în gât\nGripă: apare brusc, febră mare (38-40°C), dureri musculare, oboseală severă\n\nTratament general: odihnă, hidratare (2L apă/zi), vitamina C\n\n⚠️ Mergi la medic dacă: febra depășește 39°C, simptomele durează mai mult de 7 zile sau ai dificultăți de respirație',
    options: [
      { label: '← Înapoi la sănătate', value: 'menu_sanatate' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  san_tensiune: {
    answer: 'Valorile tensiunii arteriale:\n\n✅ Normală: sub 120/80 mmHg\n⚠️ Ridicată: 120-139/80-89 mmHg\n🔴 Hipertensiune: peste 140/90 mmHg\n\nSfaturi: reducere sare, sport regulat, evitare stres, monitorizare periodică\n\n⚠️ Consultă un cardiolog dacă ai valori constant ridicate sau simptome ca dureri de cap, amețeli sau vedere încețoșată',
    options: [
      { label: 'Programează-te la cardiolog', value: 'prog_creare' },
      { label: '← Înapoi la sănătate', value: 'menu_sanatate' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  san_diabet: {
    answer: 'Glicemia (zahărul din sânge):\n\n✅ Normală à jeun: 70-100 mg/dL\n⚠️ Prediabet: 100-125 mg/dL\n🔴 Diabet: peste 126 mg/dL\n\nSimptome diabet: sete excesivă, urinare frecventă, oboseală, vedere încețoșată, vindecare lentă a rănilor\n\n⚠️ Consultă un diabetolog sau internist pentru diagnostic corect',
    options: [
      { label: '← Înapoi la sănătate', value: 'menu_sanatate' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  san_urgenta: {
    answer: '🚨 Mergi URGENT la UPU sau sună 112 dacă ai:\n• Durere puternică în piept sau dificultăți de respirație\n• Pierdere bruscă de cunoștință\n• Accident vascular (față asimetrică, braț paralizat, vorbire neclară)\n• Hemoragii severe\n• Reacții alergice severe\n• Temperatură peste 40°C\n\nNu te programa online pentru urgențe!',
    options: [
      { label: '← Înapoi la sănătate', value: 'menu_sanatate' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  san_analize: {
    answer: 'Analize de rutină recomandate anual:\n• Hemoleucogramă completă\n• Glicemie à jeun\n• Profil lipidic (colesterol total, LDL, HDL, trigliceride)\n• Funcție hepatică (TGO, TGP)\n• Funcție renală (creatinină, uree)\n• Sumar de urină\n\nPeste 40 ani: adaugă TSH (tiroidă) și ECG.\nFemei: consultație ginecologică anuală.',
    options: [
      { label: 'Programează-te pentru analize', value: 'prog_creare' },
      { label: '← Înapoi la sănătate', value: 'menu_sanatate' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },

  menu_altceva: {
    answer: 'Te pot ajuta și cu:',
    options: [
      { label: 'Cum văd istoricul medical?', value: 'alt_istoric' },
      { label: 'Cum las o recenzie?', value: 'alt_recenzie' },
      { label: 'Cum îmi șterg contul?', value: 'alt_stergere' },
      { label: 'Date de contact / urgențe', value: 'alt_contact' },
      { label: '← Înapoi', value: 'menu_main' },
    ],
  },
  alt_istoric: {
    answer: 'Istoricul tău medical:\n1. Intră în cont și mergi la meniul din dreapta sus\n2. Selectează "Istoric medical"\n3. Găsești toate fișele medicale de la consultațiile finalizate\n4. Poți vedea diagnosticul, tratamentul recomandat și investigațiile\n5. Fișele medicale pot fi descărcate ca PDF',
    options: [
      { label: '← Înapoi', value: 'menu_altceva' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  alt_recenzie: {
    answer: 'Pentru a lăsa o recenzie unui doctor:\n1. Mergi la Dashboard\n2. Găsește programarea finalizată\n3. Apasă butonul "Lasă recenzie"\n4. Acordă un rating (1-5 stele) și lasă un comentariu opțional\n5. Recenziile sunt vizibile pe profilul doctorului',
    options: [
      { label: '← Înapoi', value: 'menu_altceva' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  alt_stergere: {
    answer: 'Dacă dorești să îți ștergi contul:\n1. Mergi la Profil\n2. Derulează în jos până la secțiunea "Zonă periculoasă"\n3. Apasă "Șterge contul"\n4. Confirmă acțiunea\n\n⚠️ Atenție: ștergerea contului dezactivează accesul tău. Datele medicale sunt păstrate conform legislației.',
    options: [
      { label: '← Înapoi', value: 'menu_altceva' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },
  alt_contact: {
    answer: '📞 Urgențe medicale: 112\n🏥 Recepție policlinică: contactați direct la recepție\n\nPentru programări urgente care nu pot fi făcute online, vă rugăm să contactați recepția direct.',
    options: [
      { label: '← Înapoi', value: 'menu_altceva' },
      { label: '🏠 Meniu principal', value: 'menu_main' },
    ],
  },

  menu_main: {
    answer: 'Cu ce te pot ajuta?',
    options: MAIN_MENU,
  },
};

const KEYWORD_MAP: { patterns: RegExp[]; flow: string }[] = [
  { patterns: [/cnt|cont|înregistr|register|logare|login|autentific|parol|password/i], flow: 'menu_cont' },
  { patterns: [/program|rezerv|book|slot|consulta|programez/i], flow: 'menu_programari' },
  { patterns: [/cnas|asigur|card.*sănăt|sănăt.*card/i], flow: 'menu_cnas' },
  { patterns: [/referral|trimitere|bilet/i], flow: 'menu_referral' },
  { patterns: [/sănătat|boal|simptom|febr|durere|tuse|gripă|răceal|tensiune|diabet/i], flow: 'menu_sanatate' },
  { patterns: [/istoric|fișă|medical|analize/i], flow: 'alt_istoric' },
  { patterns: [/recenzie|review|nota|evaluez/i], flow: 'alt_recenzie' },
  { patterns: [/șterge|șterg.*cont|delete/i], flow: 'alt_stergere' },
  { patterns: [/urgent|urgenta|112|urgențe/i], flow: 'san_urgenta' },
];

export default function ChatBot() {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const addBotMessage = (flowKey: string) => {
    const flow = FLOWS[flowKey];
    if (!flow) return;
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: flow.answer,
      options: flow.options,
    }]);
  };

  const handleOption = async (value: string) => {
    const label = Object.values(FLOWS).flatMap(f => f.options ?? []).find(o => o.value === value)?.label
      ?? MAIN_MENU.find(o => o.value === value)?.label ?? value;

    setMessages(prev => [...prev, { role: 'user', content: label }]);
    setLoading(true);
    await new Promise(res => setTimeout(res, 400));
    setLoading(false);
    addBotMessage(value);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    await new Promise(res => setTimeout(res, 500));
    setLoading(false);

    const matched = KEYWORD_MAP.find(k => k.patterns.some(p => p.test(text)));
    if (matched) {
      addBotMessage(matched.flow);
    } else {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Nu am înțeles exact ce cauți. Alege o categorie din meniu:',
        options: MAIN_MENU,
      }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isFirstOpen = messages.length === 0;

  return (
    <>
      {open && (
        <div style={{
          position: 'fixed', bottom: '80px', right: '24px',
          width: '360px', height: '520px',
          background: 'white',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-xl)',
          display: 'flex', flexDirection: 'column',
          zIndex: 9999, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '0.5px solid var(--color-border-tertiary)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'white',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: '#E6F1FB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="ti ti-stethoscope" style={{ fontSize: '16px', color: '#185FA5' }} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  Asistent Policlinica
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B6D11' }} />
                  <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Online</p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  title="Conversație nouă"
                  style={{
                    width: '28px', height: '28px', borderRadius: 'var(--border-radius-md)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-text-tertiary)', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <i className="ti ti-refresh" style={{ fontSize: '14px' }} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: '28px', height: '28px', borderRadius: 'var(--border-radius-md)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-text-tertiary)', transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <i className="ti ti-x" style={{ fontSize: '14px' }} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '12px',
          }}>
            {/* Welcome */}
            <div style={{
              padding: '12px 14px',
              background: '#E6F1FB',
              borderRadius: 'var(--border-radius-lg)',
              borderBottomLeftRadius: '4px',
              maxWidth: '85%',
            }}>
              <p style={{ fontSize: '13px', color: '#0C447C', lineHeight: 1.5 }}>
                {user ? `Bună, ${user.firstName}! ` : 'Bună! '}
                Sunt asistentul virtual al policlinicii. Cu ce te pot ajuta?
              </p>
            </div>

            {/* Main menu initial */}
            {isFirstOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {MAIN_MENU.map(opt => (
                  <button key={opt.value} onClick={() => handleOption(opt.value)} style={{
                    textAlign: 'left', padding: '8px 12px',
                    border: '0.5px solid var(--color-border-tertiary)',
                    borderRadius: 'var(--border-radius-md)',
                    background: 'white', fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#E6F1FB';
                      e.currentTarget.style.borderColor = '#378ADD';
                      e.currentTarget.style.color = '#185FA5';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = 'var(--color-border-tertiary)';
                      e.currentTarget.style.color = 'var(--color-text-secondary)';
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Conversation */}
            {messages.map((msg, i) => (
              <div key={i}>
                <div style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: msg.options ? '8px' : '0',
                }}>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--border-radius-lg)',
                    borderBottomRightRadius: msg.role === 'user' ? '4px' : 'var(--border-radius-lg)',
                    borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : 'var(--border-radius-lg)',
                    maxWidth: '85%',
                    background: msg.role === 'user' ? '#378ADD' : 'var(--color-background-secondary)',
                    color: msg.role === 'user' ? 'white' : 'var(--color-text-primary)',
                    fontSize: '13px', lineHeight: 1.6,
                    whiteSpace: 'pre-line',
                  }}>
                    {msg.content}
                  </div>
                </div>
                {msg.options && i === messages.length - 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {msg.options.map(opt => (
                      <button key={opt.value} onClick={() => handleOption(opt.value)} style={{
                        textAlign: 'left', padding: '8px 12px',
                        border: '0.5px solid var(--color-border-tertiary)',
                        borderRadius: 'var(--border-radius-md)',
                        background: 'white', fontSize: '12px',
                        color: opt.value === 'menu_main' ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#E6F1FB';
                          e.currentTarget.style.borderColor = '#378ADD';
                          e.currentTarget.style.color = '#185FA5';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.borderColor = 'var(--color-border-tertiary)';
                          e.currentTarget.style.color = opt.value === 'menu_main' ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)';
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--border-radius-lg)',
                  borderBottomLeftRadius: '4px',
                  background: 'var(--color-background-secondary)',
                  display: 'flex', gap: '4px', alignItems: 'center',
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: 'var(--color-text-tertiary)',
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 16px',
            borderTop: '0.5px solid var(--color-border-tertiary)',
            display: 'flex', gap: '8px', alignItems: 'center',
            background: 'white',
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Sau scrie o întrebare..."
              style={{
                flex: 1, padding: '8px 12px',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: 'var(--border-radius-md)',
                fontSize: '13px', color: 'var(--color-text-primary)',
                background: 'var(--color-background-secondary)',
                outline: 'none',
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                width: '34px', height: '34px',
                borderRadius: 'var(--border-radius-md)',
                background: input.trim() && !loading ? '#378ADD' : 'var(--color-background-secondary)',
                border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s', flexShrink: 0,
              }}
            >
              <i className="ti ti-send" style={{ fontSize: '15px', color: input.trim() && !loading ? 'white' : 'var(--color-text-tertiary)' }} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px',
          width: '48px', height: '48px', borderRadius: '50%',
          background: '#378ADD', color: 'white',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, transition: 'opacity 0.15s',
          boxShadow: '0 4px 16px rgba(55,138,221,0.3)',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <i className={`ti ${open ? 'ti-x' : 'ti-message-circle'}`} style={{ fontSize: '20px' }} />
      </button>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}