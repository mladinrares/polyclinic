# 🏥 Polyclinic — Sistem Web pentru Gestiunea unei Policlinici Medicale

O aplicație web full-stack completă pentru gestionarea unei policlinici medicale, dezvoltată ca proiect de diplomă la Universitatea din Craiova, Facultatea de Automatică, Calculatoare și Electronică.

## 📋 Descriere

Polyclinic digitalizează și automatizează fluxurile de lucru caracteristice unei unități medicale ambulatorii: programarea consultațiilor, gestionarea pacienților, evidența fișelor medicale, emiterea de rețete și trimiteri, precum și administrarea personalului medical și a serviciilor oferite.

Sistemul deservește patru categorii de utilizatori:
- **Pacient** — programări online, istoric medical, rețete și trimiteri
- **Medic** — program de consultații, fișe medicale, investigații
- **Recepționer** — prezență, plăți, pacienți walk-in
- **Administrator** — configurare platformă, statistici, audit

## 🛠️ Tehnologii

| Strat | Tehnologie |
|-------|-----------|
| Backend | C# / .NET 9 / ASP.NET Core |
| ORM | Entity Framework Core |
| Bază de date | PostgreSQL |
| Frontend | React + TypeScript |
| State management | Zustand |
| HTTP client | Axios |
| Grafice | Recharts |
| Autentificare | JWT + Refresh Tokens + Google OAuth |
| PDF | QuestPDF |
| Email | MailKit / MimeKit |
| Containerizare | Docker / Docker Compose |
| Testare | xUnit + Moq + FluentAssertions |

## 🚀 Pornire rapidă cu Docker

### Cerințe
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalat și pornit

### Pași

1. **Clonează repozitoriul**
```bash
git clone https://github.com/mladinrares/polyclinic.git
cd polyclinic
```

2. **Configurează variabilele de mediu**
```bash
cp Polyclinic.API/appsettings.example.json Polyclinic.API/appsettings.json
```
Editează `appsettings.json` și completează valorile marcate cu `YOUR_*`.

3. **Pornește aplicația**
```bash
docker-compose up --build
```

4. **Accesează aplicația**
   - Interfață web: [http://localhost](http://localhost)
   - API Swagger: [http://localhost:5289/swagger](http://localhost:5289/swagger)

> La primul start, baza de date este creată și populată automat cu date de demonstrație.

## 💻 Pornire în modul dezvoltare (fără Docker)

### Cerințe
- .NET 9 SDK
- Node.js 20+
- PostgreSQL 16

### Backend
```bash
cd Polyclinic.API
# configurează appsettings.json cu datele tale de conexiune
dotnet run
```

### Frontend
```bash
cd polyclinic.web
npm install
npm run dev
```

## 🧪 Rulare teste

```bash
cd Polyclinic.Tests
dotnet test --verbosity normal
```

Suita conține 10 teste unitare pentru logica de business critică (serviciul de programări), folosind o bază de date în memorie.

## 👤 Conturi de test

| Rol | Email | Parolă |
|-----|-------|--------|
| Administrator | admin@policlinica.ro | Admin123! |
| Recepționer | receptie@policlinica.ro | Receptie123! |
| Medic | dr.ionescu@policlinica.ro | Doctor123! |
| Pacient | pacient@pacient.com | Test123! |

## 📁 Structura proiectului

```
Polyclinic/
├── Polyclinic.API/          # Controllere REST, middleware, configurare
├── Polyclinic.Application/  # Interfețe, DTO-uri, excepții
├── Polyclinic.Domain/       # Entitățile domeniului medical
├── Polyclinic.Infrastructure/ # Servicii, DbContext, migrații
├── Polyclinic.Tests/        # Teste unitare (xUnit)
├── polyclinic.web/          # Interfața React + TypeScript
└── docker-compose.yml       # Orchestrare containere
```

## ✨ Funcționalități principale

- **Programare online** cu calendar vizual interactiv
- **Fișe medicale electronice** cu generare PDF
- **Decontare automată CNAS** pentru servicii eligibile
- **Listă de așteptare** cu notificări automate prin e-mail
- **Pacienți walk-in** cu migrare la cont complet
- **Trimiteri medicale** cu verificare și aprobare
- **Panou admin** cu statistici și jurnal de audit
- **Interfață responsivă** (desktop și mobil)
- **Autentificare** prin email/parolă și Google OAuth

## 👨‍🎓 Autor

**Rareș Mladin** — Proiect de diplomă, Universitatea din Craiova FACE, Iulie 2026
