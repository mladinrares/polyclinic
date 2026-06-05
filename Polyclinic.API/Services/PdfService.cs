using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Polyclinic.Application.DTOs.Medical;
using Polyclinic.Application.DTOs.Referrals;

namespace Polyclinic.API.Services;

public class PdfService
{
    public byte[] GenerateMedicalRecordPdf(MedicalRecordDto record)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(11));

                page.Header().Column(col =>
                {
                    col.Item().Text("FIȘĂ MEDICALĂ")
                        .FontSize(18).Bold();
                    col.Item().Text($"Data: {record.RecordDate:dd/MM/yyyy}")
                        .FontSize(10);
                    col.Item().LineHorizontal(1);
                });

                page.Content().Column(col =>
                {
                    col.Item().PaddingTop(10).Text("Informații generale").Bold().FontSize(13);

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn();
                            c.RelativeColumn();
                        });

                        table.Cell().Text("Pacient:");
                        table.Cell().Text(record.PatientName);
                        table.Cell().Text("Medic:");
                        table.Cell().Text(record.DoctorName);
                        table.Cell().Text("Diagnostic:");
                        table.Cell().Text(record.Diagnosis);
                    });

                    if (!string.IsNullOrEmpty(record.Anamnesis))
                    {
                        col.Item().PaddingTop(15).Text("Anamneză").Bold().FontSize(13);
                        col.Item().Text(record.Anamnesis);
                    }

                    if (!string.IsNullOrEmpty(record.ExaminationNotes))
                    {
                        col.Item().PaddingTop(15).Text("Examen obiectiv").Bold().FontSize(13);
                        col.Item().Text(record.ExaminationNotes);
                    }

                    if (!string.IsNullOrEmpty(record.TreatmentPlan))
                    {
                        col.Item().PaddingTop(15).Text("Plan de tratament").Bold().FontSize(13);
                        col.Item().Text(record.TreatmentPlan);
                    }

                    if (!string.IsNullOrEmpty(record.Recommendations))
                    {
                        col.Item().PaddingTop(15).Text("Recomandări").Bold().FontSize(13);
                        col.Item().Text(record.Recommendations);
                    }

                    if (record.Prescriptions.Any())
                    {
                        col.Item().PaddingTop(15).Text("Rețete").Bold().FontSize(13);
                        foreach (var prescription in record.Prescriptions)
                        {
                            col.Item().PaddingTop(5).Text($"Nr: {prescription.PrescriptionNumber} | Valabil: {prescription.ValidFrom} - {prescription.ValidUntil}").Italic();
                            foreach (var item in prescription.Items)
                            {
                                col.Item().Text($"• {item.MedicationName} {item.Dosage} — {item.Frequency} — {item.Duration}");
                            }
                        }
                    }

                    if (record.Investigations.Any())
                    {
                        col.Item().PaddingTop(15).Text("Investigații").Bold().FontSize(13);
                        foreach (var inv in record.Investigations)
                        {
                            col.Item().Text($"• {inv.Name} ({inv.Type}) — {inv.Status}");
                        }
                    }
                });

                page.Footer().Text(x =>
                {
                    x.Span("Pagina ");
                    x.CurrentPageNumber();
                    x.Span(" din ");
                    x.TotalPages();
                });
            });
        }).GeneratePdf();
    }
    public byte[] GenerateReferralPdf(ReferralDto referral)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(11));

                page.Header().Column(col =>
                {
                    col.Item().Text("TRIMITERE MEDICALĂ")
                        .FontSize(18).Bold();
                    col.Item().Text($"Nr: {referral.ReferralNumber}")
                        .FontSize(12);
                    col.Item().LineHorizontal(1);
                });

                page.Content().Column(col =>
                {
                    col.Item().PaddingTop(10).Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn();
                            c.RelativeColumn();
                        });

                        table.Cell().Text("Pacient:");
                        table.Cell().Text(referral.PatientName);
                        table.Cell().Text("Medic emitent:");
                        table.Cell().Text(referral.ReferringDoctorName);
                        table.Cell().Text("Specialitate:");
                        table.Cell().Text(referral.SpecialtyName);
                        table.Cell().Text("Serviciu:");
                        table.Cell().Text(referral.ServiceName);
                        table.Cell().Text("Valabil de la:");
                        table.Cell().Text(referral.ValidFrom.ToString("dd/MM/yyyy"));
                        table.Cell().Text("Valabil până la:");
                        table.Cell().Text(referral.ValidUntil.ToString("dd/MM/yyyy"));
                        table.Cell().Text("Status:");
                        table.Cell().Text(referral.Status);
                    });

                    col.Item().PaddingTop(15).Text("Motiv").Bold().FontSize(13);
                    col.Item().Text(referral.Reason);

                    if (!string.IsNullOrEmpty(referral.Notes))
                    {
                        col.Item().PaddingTop(15).Text("Note").Bold().FontSize(13);
                        col.Item().Text(referral.Notes);
                    }
                });

                page.Footer().Text(x =>
                {
                    x.Span("Pagina ");
                    x.CurrentPageNumber();
                    x.Span(" din ");
                    x.TotalPages();
                });
            });
        }).GeneratePdf();
    }
}