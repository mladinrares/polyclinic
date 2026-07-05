using Microsoft.EntityFrameworkCore;
using Polyclinic.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Polyclinic.Infrastructure.Persistence
{
    public static class SeedData
    {
        // Generator determinist (aceleași date la fiecare rulare)
        private static readonly Random Rng = new Random(20260605);

        public static async Task SeedAsync(PolyclinicDbContext context)
        {
            if (await context.Specialties.AnyAsync()) return;

            var now = DateTime.UtcNow;
            var today = DateOnly.FromDateTime(now);

            // ─────────────────────────────────────────────────────────────
            // 1. SPECIALITĂȚI
            // ─────────────────────────────────────────────────────────────
            var specialties = new List<Specialty>
            {
                NewSpecialty("Cardiologie", "Diagnosticul și tratamentul bolilor inimii și ale vaselor de sânge"),
                NewSpecialty("Dermatologie", "Afecțiuni ale pielii, părului și unghiilor"),
                NewSpecialty("Neurologie", "Boli ale sistemului nervos central și periferic"),
                NewSpecialty("Pediatrie", "Îngrijirea medicală a sugarilor, copiilor și adolescenților"),
                NewSpecialty("Ortopedie", "Afecțiuni ale aparatului locomotor: oase, articulații, mușchi"),
                NewSpecialty("Oftalmologie", "Diagnosticul și tratamentul bolilor ochiului"),
                NewSpecialty("Endocrinologie", "Tulburări ale glandelor endocrine și ale metabolismului"),
                NewSpecialty("Medicină internă", "Diagnostic și tratament pentru afecțiuni interne ale adultului"),
            };
            await context.Specialties.AddRangeAsync(specialties);
            await context.SaveChangesAsync();

            // index pe nume pentru claritate
            Specialty Spec(string n) => specialties.First(s => s.Name == n);

            // ─────────────────────────────────────────────────────────────
            // 2. SERVICII MEDICALE (unele CNAS, unele cu trimitere)
            // ─────────────────────────────────────────────────────────────
            var services = new List<MedicalService>
            {
                // Cardiologie
                NewService(Spec("Cardiologie"), "Consultație cardiologie", 30, 200, cnas:true, cnasAmount:120),
                NewService(Spec("Cardiologie"), "Electrocardiogramă (EKG)", 20, 80, cnas:true, cnasAmount:80),
                NewService(Spec("Cardiologie"), "Ecocardiografie", 40, 250, cnas:false, requiresReferral:true),
                // Dermatologie
                NewService(Spec("Dermatologie"), "Consultație dermatologie", 30, 150, cnas:true, cnasAmount:90),
                NewService(Spec("Dermatologie"), "Dermatoscopie", 25, 120, cnas:false),
                // Neurologie
                NewService(Spec("Neurologie"), "Consultație neurologie", 45, 250, cnas:true, cnasAmount:150),
                NewService(Spec("Neurologie"), "Electroencefalogramă (EEG)", 40, 200, cnas:false, requiresReferral:true),
                // Pediatrie
                NewService(Spec("Pediatrie"), "Consultație pediatrie", 30, 180, cnas:true, cnasAmount:180),
                NewService(Spec("Pediatrie"), "Control de rutină copil", 25, 120, cnas:true, cnasAmount:120),
                // Ortopedie
                NewService(Spec("Ortopedie"), "Consultație ortopedie", 30, 220, cnas:true, cnasAmount:130),
                NewService(Spec("Ortopedie"), "Infiltrație articulară", 20, 300, cnas:false, requiresReferral:true),
                // Oftalmologie
                NewService(Spec("Oftalmologie"), "Consultație oftalmologie", 30, 170, cnas:true, cnasAmount:100),
                NewService(Spec("Oftalmologie"), "Examen fund de ochi", 20, 90, cnas:false),
                // Endocrinologie
                NewService(Spec("Endocrinologie"), "Consultație endocrinologie", 40, 230, cnas:true, cnasAmount:140),
                // Medicină internă
                NewService(Spec("Medicină internă"), "Consultație medicină internă", 30, 160, cnas:true, cnasAmount:100),
                NewService(Spec("Medicină internă"), "Evaluare medicală generală", 45, 280, cnas:false),
            };
            await context.MedicalServices.AddRangeAsync(services);
            await context.SaveChangesAsync();


            // ─────────────────────────────────────────────────────────────
            // 3. LOCAȚII
            // ─────────────────────────────────────────────────────────────
            var locations = new List<Location>
            {
                new Location { Id = Guid.NewGuid(), Name = "Clinica Centrală București", Address = "Str. Victoriei 10", City = "București", County = "București", Phone = "0213334455", Email = "bucuresti@policlinica.ro", IsActive = true, CreatedAt = now, UpdatedAt = now },
                new Location { Id = Guid.NewGuid(), Name = "Clinica Craiova", Address = "Bd. Carol I 25", City = "Craiova", County = "Dolj", Phone = "0251445566", Email = "craiova@policlinica.ro", IsActive = true, CreatedAt = now, UpdatedAt = now },
            };
            await context.Locations.AddRangeAsync(locations);
            await context.SaveChangesAsync();
            var locBuc = locations[0];
            var locCv = locations[1];

            // ─────────────────────────────────────────────────────────────
            // 4. UTILIZATORI: admin, recepționer
            // ─────────────────────────────────────────────────────────────
            var staffUsers = new List<User>
            {
                NewUser("admin@policlinica.ro", "Admin", "Principal", "admin", "Admin123!", now),
                NewUser("receptie@policlinica.ro", "Elena", "Recepție", "receptionist", "Receptie123!", now),
                NewUser("receptie2@policlinica.ro", "Andrei", "Recepție", "receptionist", "Receptie123!", now),
            };
            await context.Users.AddRangeAsync(staffUsers);

            // ─────────────────────────────────────────────────────────────
            // 5. MEDICI (12) — user + doctor
            // ─────────────────────────────────────────────────────────────
            var doctorDefs = new (string First, string Last, string Spec, int Exp, decimal Fee)[]
            {
                ("Alexandru", "Ionescu",   "Cardiologie",       18, 200),
                ("Maria",     "Popescu",   "Dermatologie",      12, 150),
                ("Ion",       "Gheorghe",  "Neurologie",        22, 250),
                ("Andreea",   "Dumitru",   "Pediatrie",          9, 180),
                ("Mihai",     "Stan",      "Ortopedie",         15, 220),
                ("Elena",     "Marin",     "Oftalmologie",      11, 170),
                ("Cristina",  "Radu",      "Endocrinologie",    14, 230),
                ("Vlad",      "Constantin","Medicină internă",  10, 160),
                ("Ioana",     "Niculae",   "Cardiologie",        8, 190),
                ("George",    "Tudor",     "Dermatologie",      20, 160),
                ("Bogdan",    "Florea",    "Neurologie",         7, 240),
                ("Raluca",    "Stoica",    "Pediatrie",         16, 185),
            };

            var doctorUsers = new List<User>();
            var doctors = new List<Doctor>();
            int licNo = 1;
            foreach (var d in doctorDefs)
            {
                var email = $"dr.{Normalize(d.Last)}@policlinica.ro";
                var u = NewUser(email, d.First, d.Last, "doctor", "Doctor123!", now);
                u.Gender = Rng.Next(2) == 0 ? "M" : "F";
                doctorUsers.Add(u);
            }
            await context.Users.AddRangeAsync(doctorUsers);
            await context.SaveChangesAsync();

            for (int i = 0; i < doctorDefs.Length; i++)
            {
                var d = doctorDefs[i];
                doctors.Add(new Doctor
                {
                    Id = Guid.NewGuid(),
                    UserId = doctorUsers[i].Id,
                    SpecialtyId = Spec(d.Spec).Id,
                    LicenseNumber = $"LIC{licNo++:000}",
                    Bio = $"{d.Spec} cu experiență de {d.Exp} ani. Membru al Colegiului Medicilor din România.",
                    ExperienceYears = d.Exp,
                    ConsultationFee = d.Fee,
                    IsAvailable = true,
                    CreatedAt = now,
                    UpdatedAt = now
                });
            }
            await context.Doctors.AddRangeAsync(doctors);
            await context.SaveChangesAsync();

            // ─────────────────────────────────────────────────────────────
            // 6. PACIENȚI (30) cu cont
            // ─────────────────────────────────────────────────────────────
            var firstNames = new[] { "Andrei", "Ioana", "Mihai", "Ana", "Cristian", "Elena", "Florin", "Gabriela", "Radu", "Diana", "Paul", "Roxana", "Sorin", "Larisa", "Dan", "Monica", "Victor", "Simona", "Adrian", "Carmen", "Nicolae", "Alina", "Marius", "Teodora", "Cosmin", "Bianca", "Daniel", "Ramona", "Stefan", "Laura" };
            var lastNames = new[] { "Mladin", "Popa", "Ene", "Munteanu", "Vasile", "Barbu", "Cojocaru", "Sava", "Toma", "Voicu", "Cristea", "Lazar", "Dragomir", "Petre", "Anghel", "Moldovan", "Tabacu", "Serban", "Nistor", "Iordache", "Preda", "Olaru", "Mocanu", "Ungureanu", "Crăciun", "Filip", "Albu", "Rusu", "Diaconu", "Matei" };

            var patientUsers = new List<User>();
            for (int i = 0; i < 30; i++)
            {
                var fn = firstNames[i % firstNames.Length];
                var ln = lastNames[i % lastNames.Length];
                var email = $"{Normalize(fn)}.{Normalize(ln)}{i}@email.com";
                var u = NewUser(email, fn, ln, "patient", "Pacient123!", now);
                u.Gender = Rng.Next(2) == 0 ? "M" : "F";
                u.DateOfBirth = new DateTime(1960 + Rng.Next(50), 1 + Rng.Next(12), 1 + Rng.Next(28), 0, 0, 0, DateTimeKind.Utc);
                u.CNP = GenerateCNP(u.DateOfBirth.Value, u.Gender == "M");
                u.City = Rng.Next(2) == 0 ? "București" : "Craiova";
                u.County = u.City == "București" ? "București" : "Dolj";
                u.Phone = $"07{Rng.Next(10, 99)}{Rng.Next(100000, 999999)}";
                patientUsers.Add(u);
            }
            
            var demoPatient = NewUser("pacient@pacient.com", "Rareș", "Demo", "patient", "Test123!", now);
            demoPatient.CNP = "1990101223344";
            demoPatient.DateOfBirth = new DateTime(1999, 1, 10, 0, 0, 0, DateTimeKind.Utc);
            demoPatient.City = "Craiova"; demoPatient.County = "Dolj"; demoPatient.Phone = "0712345678";
            patientUsers.Add(demoPatient);

            await context.Users.AddRangeAsync(patientUsers);
            await context.SaveChangesAsync();

            // ─────────────────────────────────────────────────────────────
            // 7. LEGĂTURI doctor-serviciu și doctor-locație
            // ─────────────────────────────────────────────────────────────
            var doctorServices = new List<DoctorService>();
            var doctorLocations = new List<DoctorLocation>();
            var allDays = "Monday,Tuesday,Wednesday,Thursday,Friday";

            foreach (var doc in doctors)
            {
                // serviciile specialității doctorului
                var specServices = services.Where(s => s.SpecialtyId == doc.SpecialtyId).ToList();
                foreach (var s in specServices)
                    doctorServices.Add(new DoctorService { Id = Guid.NewGuid(), DoctorId = doc.Id, ServiceId = s.Id, CreatedAt = now, UpdatedAt = now });

                // locație: medicii pari la București, impari și la Craiova
                var docLoc = locBuc;
                doctorLocations.Add(new DoctorLocation
                {
                    Id = Guid.NewGuid(),
                    DoctorId = doc.Id,
                    LocationId = docLoc.Id,
                    WorkingDays = allDays,
                    StartTime = new TimeOnly(8, 0),
                    EndTime = new TimeOnly(15, 0),
                    IsActive = true,
                    CreatedAt = now,
                    UpdatedAt = now
                });
            }
            await context.DoctorServices.AddRangeAsync(doctorServices);
            await context.DoctorLocations.AddRangeAsync(doctorLocations);
            await context.SaveChangesAsync();

            // ─────────────────────────────────────────────────────────────
            // 8. TIMESLOTS: 30 zile trecut + 30 zile viitor, sloturi de 30 min
            //    Fiecare zi a unui doctor este dedicată unui serviciu al său
            //    (serviciile se rotesc pe zile), astfel fiecare slot are ServiceId.
            // ─────────────────────────────────────────────────────────────
            var timeSlots = new List<TimeSlot>();
            foreach (var doc in doctors)
            {
                var docLoc = doctorLocations.First(dl => dl.DoctorId == doc.Id);
                // serviciile pe care le prestează acest doctor (din specialitatea lui)
                var docServiceIds = doctorServices
                    .Where(ds => ds.DoctorId == doc.Id)
                    .Select(ds => ds.ServiceId)
                    .ToList();

                int dayCounter = 0;
                for (int dayOffset = -30; dayOffset <= 30; dayOffset++)
                {
                    var date = today.AddDays(dayOffset);
                    var dow = date.DayOfWeek;
                    if (dow == DayOfWeek.Saturday || dow == DayOfWeek.Sunday) continue;

                    // serviciul dedicat zilei (rotativ), astfel fiecare zi acoperă un serviciu
                    var serviceForDay = docServiceIds[dayCounter % docServiceIds.Count];
                    dayCounter++;

                    for (var time = docLoc.StartTime; time < docLoc.EndTime; time = time.AddMinutes(30))
                    {
                        timeSlots.Add(new TimeSlot
                        {
                            Id = Guid.NewGuid(),
                            DoctorId = doc.Id,
                            LocationId = docLoc.LocationId,
                            ServiceId = serviceForDay,
                            SlotDate = date,
                            StartTime = time,
                            EndTime = time.AddMinutes(30),
                            IsAvailable = true,
                            IsBlocked = false,
                            CreatedAt = now,
                            UpdatedAt = now
                        });
                    }
                }
            }
            await context.TimeSlots.AddRangeAsync(timeSlots);
            await context.SaveChangesAsync();

            // ─────────────────────────────────────────────────────────────
            // 9. PROGRAMĂRI + fișe + rețete + investigații + recenzii
            // ─────────────────────────────────────────────────────────────
            var appointments = new List<Appointment>();
            var medicalRecords = new List<MedicalRecord>();
            var prescriptions = new List<Prescription>();
            var prescriptionItems = new List<PrescriptionItem>();
            var investigations = new List<Investigation>();
            var reviews = new List<Review>();
            var notifications = new List<Notification>();

            var diagnoses = new[] {
                ("Hipertensiune arterială esențială", "Pacient cu valori tensionale crescute la măsurători repetate.", "TA 150/95 mmHg, puls 82/min, ritmic.", "Regim hiposodat, monitorizare tensională zilnică.", "Control peste 30 de zile."),
                ("Dermatită atopică", "Erupție pruriginoasă la nivelul plicilor de flexie.", "Leziuni eritemato-scuamoase, fără suprainfecție.", "Emoliente, corticoid topic 7 zile.", "Evitarea factorilor iritanți."),
                ("Cefalee tensională", "Cefalee bilaterală, caracter de presiune, fără greață.", "Examen neurologic în limite normale.", "Analgezice la nevoie, tehnici de relaxare.", "Reevaluare dacă simptomele persistă."),
                ("Infecție respiratorie superioară", "Debut recent cu rinoree, tuse seacă, subfebrilitate.", "Faringe ușor congestionat, pulmonar fără raluri.", "Hidratare, antitermice la nevoie.", "Repaus 3-5 zile."),
                ("Gonartroză bilaterală", "Durere la nivelul genunchilor, accentuată la efort.", "Crepitații articulare, mobilitate ușor redusă.", "Antiinflamatoare, kinetoterapie.", "Control ortopedic peste 6 săptămâni."),
                ("Conjunctivită alergică", "Prurit ocular, lăcrimare, hiperemie conjunctivală.", "Conjunctivă hiperemică bilateral, cornee clară.", "Colir antihistaminic, comprese reci.", "Evitarea alergenilor cunoscuți."),
            };

            var meds = new[] {
                ("Concor 5mg", "5 mg", "1 dată/zi dimineața", "30 zile", 1),
                ("Aspenter 75mg", "75 mg", "1 dată/zi", "30 zile", 1),
                ("Locoid cremă", "aplicare locală", "de 2 ori/zi", "7 zile", 1),
                ("Paracetamol 500mg", "500 mg", "la nevoie, max 3/zi", "5 zile", 1),
                ("Nurofen 400mg", "400 mg", "de 2 ori/zi", "7 zile", 1),
                ("Aerius 5mg", "5 mg", "1 dată/zi seara", "14 zile", 1),
            };

            var investTypes = new[] {
                ("imagistică", "Radiografie toracică"),
                ("laborator", "Hemoleucogramă completă"),
                ("laborator", "Glicemie à jeun"),
                ("imagistică", "Ecografie abdominală"),
                ("cardiologie", "Holter EKG 24h"),
            };

            var reviewComments = new[] {
                "Medic foarte profesionist, explică totul clar.",
                "Consultație amănunțită, recomand cu încredere.",
                "Personal amabil, timp de așteptare scurt.",
                "Foarte mulțumit de tratamentul primit.",
                "Atent la detalii și răbdător cu pacienții.",
                null, null,
            };

            int presNo = 1000;
            var usablePatients = patientUsers; // toți

            // pentru fiecare medic, ocupăm o parte din sloturile trecute (finalizate) și viitoare (confirmate)
            foreach (var doc in doctors)
            {
                var docSlots = timeSlots.Where(t => t.DoctorId == doc.Id).OrderBy(t => t.SlotDate).ThenBy(t => t.StartTime).ToList();
                var specName = specialties.First(s => s.Id == doc.SpecialtyId).Name;

                // alegem aleator ~14 sloturi trecute și ~10 viitoare
                var pastSlots = docSlots.Where(s => s.SlotDate < today).OrderBy(_ => Rng.Next()).Take(14).ToList();
                var futureSlots = docSlots.Where(s => s.SlotDate >= today).OrderBy(_ => Rng.Next()).Take(10).ToList();

                // ---- TRECUTE: finalizate, cu fișă + rețetă + uneori investigație + recenzie ----
                foreach (var slot in pastSlots)
                {
                    var patient = usablePatients[Rng.Next(usablePatients.Count)];
                    var slotService = services.First(s => s.Id == slot.ServiceId!.Value);
                    var price = slotService.Price;
                    var appt = new Appointment
                    {
                        Id = Guid.NewGuid(),
                        PatientId = patient.Id,
                        DoctorId = doc.Id,
                        ServiceId = slotService.Id,
                        LocationId = slot.LocationId,
                        TimeSlotId = slot.Id,
                        Status = "completed",
                        Type = "in_person",
                        Reason = "Control de specialitate",
                        PricePaid = price,
                        PaymentStatus = "paid",
                        PaymentMethod = Rng.Next(2) == 0 ? "card" : "cash",
                        ConfirmedAt = slot.SlotDate.ToDateTime(slot.StartTime, DateTimeKind.Utc).AddDays(-2),
                        CheckedInAt = slot.SlotDate.ToDateTime(slot.StartTime, DateTimeKind.Utc),
                        CompletedAt = slot.SlotDate.ToDateTime(slot.EndTime, DateTimeKind.Utc),
                        CreatedAt = slot.SlotDate.ToDateTime(slot.StartTime, DateTimeKind.Utc).AddDays(-2),
                        UpdatedAt = slot.SlotDate.ToDateTime(slot.EndTime, DateTimeKind.Utc),
                    };
                    slot.IsAvailable = false;
                    appointments.Add(appt);

                    // fișă medicală
                    var dg = diagnoses[Rng.Next(diagnoses.Length)];
                    var mr = new MedicalRecord
                    {
                        Id = Guid.NewGuid(),
                        PatientId = patient.Id,
                        DoctorId = doc.Id,
                        AppointmentId = appt.Id,
                        Diagnosis = dg.Item1,
                        Anamnesis = dg.Item2,
                        ExaminationNotes = dg.Item3,
                        TreatmentPlan = dg.Item4,
                        Recommendations = dg.Item5,
                        RecordDate = appt.CompletedAt!.Value,
                        CreatedAt = appt.CompletedAt.Value,
                        UpdatedAt = appt.CompletedAt.Value,
                    };
                    medicalRecords.Add(mr);

                    // rețetă cu 1-2 medicamente
                    var pres = new Prescription
                    {
                        Id = Guid.NewGuid(),
                        MedicalRecordId = mr.Id,
                        PatientId = patient.Id,
                        DoctorId = doc.Id,
                        PrescriptionNumber = $"RX{presNo++}",
                        ValidFrom = slot.SlotDate,
                        ValidUntil = slot.SlotDate.AddDays(30),
                        Status = "active",
                        CreatedAt = appt.CompletedAt.Value,
                        UpdatedAt = appt.CompletedAt.Value,
                    };
                    prescriptions.Add(pres);
                    int nMeds = 1 + Rng.Next(2);
                    for (int m = 0; m < nMeds; m++)
                    {
                        var med = meds[Rng.Next(meds.Length)];
                        prescriptionItems.Add(new PrescriptionItem
                        {
                            Id = Guid.NewGuid(),
                            PrescriptionId = pres.Id,
                            MedicationName = med.Item1,
                            Dosage = med.Item2,
                            Frequency = med.Item3,
                            Duration = med.Item4,
                            Quantity = med.Item5,
                            Instructions = "Conform recomandării medicului.",
                            CreatedAt = appt.CompletedAt.Value,
                            UpdatedAt = appt.CompletedAt.Value,
                        });
                    }

                    // investigație (~40% din cazuri)
                    if (Rng.Next(10) < 4)
                    {
                        var inv = investTypes[Rng.Next(investTypes.Length)];
                        investigations.Add(new Investigation
                        {
                            Id = Guid.NewGuid(),
                            MedicalRecordId = mr.Id,
                            PatientId = patient.Id,
                            DoctorId = doc.Id,
                            Type = inv.Item1,
                            Name = inv.Item2,
                            Status = Rng.Next(2) == 0 ? "completed" : "requested",
                            RequestedAt = appt.CompletedAt.Value,
                            CompletedAt = Rng.Next(2) == 0 ? appt.CompletedAt.Value.AddDays(3) : (DateTime?)null,
                            CreatedAt = appt.CompletedAt.Value,
                            UpdatedAt = appt.CompletedAt.Value,
                        });
                    }

                    // recenzie (~60% din cazuri)
                    if (Rng.Next(10) < 6)
                    {
                        reviews.Add(new Review
                        {
                            Id = Guid.NewGuid(),
                            PatientId = patient.Id,
                            DoctorId = doc.Id,
                            AppointmentId = appt.Id,
                            Rating = 3 + Rng.Next(3), // 3..5
                            Comment = reviewComments[Rng.Next(reviewComments.Length)],
                            IsVisible = true,
                            CreatedAt = appt.CompletedAt.Value.AddDays(1),
                            UpdatedAt = appt.CompletedAt.Value.AddDays(1),
                        });
                    }
                }

                // ---- VIITOARE: confirmate ----
                foreach (var slot in futureSlots)
                {
                    var patient = usablePatients[Rng.Next(usablePatients.Count)];
                    var slotService = services.First(s => s.Id == slot.ServiceId!.Value);
                    var appt = new Appointment
                    {
                        Id = Guid.NewGuid(),
                        PatientId = patient.Id,
                        DoctorId = doc.Id,
                        ServiceId = slotService.Id,
                        LocationId = slot.LocationId,
                        TimeSlotId = slot.Id,
                        Status = "confirmed",
                        Type = "in_person",
                        Reason = "Consultație programată",
                        PricePaid = slotService.Price,
                        PaymentStatus = "unpaid",
                        ConfirmedAt = now,
                        CreatedAt = now,
                        UpdatedAt = now,
                    };
                    slot.IsAvailable = false;
                    appointments.Add(appt);

                    notifications.Add(new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = patient.Id,
                        AppointmentId = appt.Id,
                        Type = "appointment_confirmed",
                        Channel = "in_app",
                        Title = "Programare confirmată",
                        Message = $"Programarea ta la {specName} pe {slot.SlotDate:dd.MM.yyyy} ora {slot.StartTime:HH\\:mm} a fost confirmată.",
                        IsRead = false,
                        Status = "sent",
                        SentAt = now,
                        CreatedAt = now,
                        UpdatedAt = now,
                    });
                }
            }

            await context.Appointments.AddRangeAsync(appointments);
            await context.SaveChangesAsync();
            await context.MedicalRecords.AddRangeAsync(medicalRecords);
            await context.SaveChangesAsync();
            await context.Prescriptions.AddRangeAsync(prescriptions);
            await context.SaveChangesAsync();
            await context.PrescriptionItems.AddRangeAsync(prescriptionItems);
            await context.Investigations.AddRangeAsync(investigations);
            await context.Reviews.AddRangeAsync(reviews);
            await context.Notifications.AddRangeAsync(notifications);
            await context.SaveChangesAsync();

            // ─────────────────────────────────────────────────────────────
            // 10. PACIENȚI WALK-IN
            // ─────────────────────────────────────────────────────────────
            var walkIns = new List<WalkInPatient>();
            for (int i = 0; i < 12; i++)
            {
                var fn = firstNames[Rng.Next(firstNames.Length)];
                var ln = lastNames[Rng.Next(lastNames.Length)];
                bool male = Rng.Next(2) == 0;
                var dob = new DateTime(1955 + Rng.Next(55), 1 + Rng.Next(12), 1 + Rng.Next(28), 0, 0, 0, DateTimeKind.Utc);
                walkIns.Add(new WalkInPatient
                {
                    Id = Guid.NewGuid(),
                    FirstName = fn,
                    LastName = ln,
                    CNP = GenerateCNP(dob, male),
                    Phone = $"07{Rng.Next(10, 99)}{Rng.Next(100000, 999999)}",
                    Age = DateTime.UtcNow.Year - dob.Year,
                    City = Rng.Next(2) == 0 ? "București" : "Craiova",
                    County = Rng.Next(2) == 0 ? "București" : "Dolj",
                    Email = Rng.Next(3) == 0 ? $"{Normalize(fn)}.{Normalize(ln)}@email.com" : null,
                    IsActive = true,
                    CreatedAt = now,
                    UpdatedAt = now,
                });
            }
            await context.WalkInPatients.AddRangeAsync(walkIns);
            await context.SaveChangesAsync();

            // ─────────────────────────────────────────────────────────────
            // 11. CARDURI DE ASIGURARE (pentru ~jumătate din pacienți)
            // ─────────────────────────────────────────────────────────────
            var cards = new List<InsuranceCard>();
            foreach (var p in patientUsers.Where((_, idx) => idx % 2 == 0))
            {
                cards.Add(new InsuranceCard
                {
                    Id = Guid.NewGuid(),
                    PatientId = p.Id,
                    FirstName = p.FirstName,
                    LastName = p.LastName,
                    InsuredCode = $"AS{Rng.Next(100000, 999999)}",
                    DocumentNumber = $"CNAS{Rng.Next(10000, 99999)}",
                    ExpiryDate = today.AddYears(1),
                    IsActive = true,
                    IsVerified = true,
                    VerifiedAt = now,
                    CreatedAt = now,
                    UpdatedAt = now,
                });
            }
            await context.InsuranceCards.AddRangeAsync(cards);
            await context.SaveChangesAsync();

            // ─────────────────────────────────────────────────────────────
            // 12. LISTĂ DE AȘTEPTARE (câteva intrări)
            // ─────────────────────────────────────────────────────────────
            var waiting = new List<WaitingList>();
            for (int i = 0; i < 8; i++)
            {
                var doc = doctors[Rng.Next(doctors.Count)];
                var svc = services.First(s => s.SpecialtyId == doc.SpecialtyId);
                var docLoc = doctorLocations.First(dl => dl.DoctorId == doc.Id);
                var patient = patientUsers[Rng.Next(patientUsers.Count)];
                waiting.Add(new WaitingList
                {
                    Id = Guid.NewGuid(),
                    PatientId = patient.Id,
                    DoctorId = doc.Id,
                    ServiceId = svc.Id,
                    LocationId = docLoc.LocationId,
                    PreferredDateFrom = today,
                    PreferredDateTo = today.AddDays(14),
                    PreferredTimeOfDay = Rng.Next(2) == 0 ? "morning" : "afternoon",
                    Status = "waiting",
                    CreatedAt = now,
                    UpdatedAt = now,
                });
            }
            await context.WaitingLists.AddRangeAsync(waiting);
            await context.SaveChangesAsync();
        }

        // ───────────────────────── Helpers ─────────────────────────
        private static Specialty NewSpecialty(string name, string desc) => new Specialty
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = desc,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        private static MedicalService NewService(Specialty spec, string name, int dur, decimal price,
            bool cnas = false, decimal? cnasAmount = null, bool requiresReferral = false) => new MedicalService
            {
                Id = Guid.NewGuid(),
                SpecialtyId = spec.Id,
                Name = name,
                Description = name,
                DurationMinutes = dur,
                Price = price,
                IsCNASCovered = cnas,
                CNASCoveredAmount = cnasAmount,
                RequiresReferral = requiresReferral,
                IsActive = true,
                IsBookableOnline = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

        private static User NewUser(string email, string first, string last, string role, string password, DateTime now) => new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            FirstName = first,
            LastName = last,
            Phone = "0700000000",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = role,
            IsActive = true,
            EmailVerified = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        // elimină diacritice și spații pentru email
        private static string Normalize(string s)
        {
            s = s.ToLowerInvariant()
                 .Replace("ă", "a").Replace("â", "a").Replace("î", "i")
                 .Replace("ș", "s").Replace("ş", "s").Replace("ț", "t").Replace("ţ", "t")
                 .Replace(" ", "").Replace("-", "");
            return s;
        }

        // CNP plauzibil (nu validat oficial, doar pentru demo)
        private static string GenerateCNP(DateTime dob, bool male)
        {
            int s = male ? (dob.Year < 2000 ? 1 : 5) : (dob.Year < 2000 ? 2 : 6);
            return $"{s}{dob:yy}{dob:MM}{dob:dd}{Rng.Next(100000, 999999)}";
        }
    }
}