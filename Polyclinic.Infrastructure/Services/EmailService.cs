using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
using Polyclinic.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string to, string subject, string htmlBody)
        {
            var emailSettings = _configuration.GetSection("EmailSettings");

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(
                emailSettings["SenderName"] ?? "Policlinica",
                emailSettings["SenderEmail"] ?? "noreply@policlinica.ro"
            ));
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder { HtmlBody = htmlBody };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(
                emailSettings["SmtpHost"],
                int.Parse(emailSettings["SmtpPort"] ?? "587"),
                SecureSocketOptions.StartTls
            );
            await client.AuthenticateAsync(
                emailSettings["SmtpUser"],
                emailSettings["SmtpPassword"]
            );
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }

        public async Task SendEmailVerificationAsync(string to, string firstName, string token)
        {
            var baseUrl = _configuration["AppSettings:FrontendUrl"] ?? "http://localhost:5173";
            var verifyUrl = $"{baseUrl}/verify-email?token={token}";

            var html = $@"
                <div style='font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;'>
                    <div style='display: flex; align-items: center; gap: 8px; margin-bottom: 32px;'>
                        <div style='width: 8px; height: 8px; border-radius: 50%; background: #378ADD;'></div>
                        <span style='font-size: 16px; font-weight: 500; color: #111827;'>Policlinica</span>
                    </div>
                    <h1 style='font-size: 22px; font-weight: 500; color: #111827; margin-bottom: 8px;'>Verifică adresa de email</h1>
                    <p style='font-size: 14px; color: #6b7280; margin-bottom: 24px; line-height: 1.6;'>
                        Bună, {firstName}! Apasă pe butonul de mai jos pentru a-ți verifica adresa de email.
                    </p>
                    <a href='{verifyUrl}' style='display: inline-block; background: #378ADD; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;'>
                        Verifică email-ul
                    </a>
                    <p style='font-size: 12px; color: #9ca3af; margin-top: 24px;'>
                        Link-ul expiră în 24 de ore. Dacă nu ai creat un cont, ignoră acest email.
                    </p>
                </div>";

            await SendEmailAsync(to, "Verifică adresa de email — Policlinica", html);
        }

        public async Task SendAppointmentReminderAsync(string to, string firstName, string doctorName, string serviceName, string date, string time)
        {
            var html = $@"
                <div style='font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;'>
                    <div style='display: flex; align-items: center; gap: 8px; margin-bottom: 32px;'>
                        <div style='width: 8px; height: 8px; border-radius: 50%; background: #378ADD;'></div>
                        <span style='font-size: 16px; font-weight: 500; color: #111827;'>Policlinica</span>
                    </div>
                    <h1 style='font-size: 22px; font-weight: 500; color: #111827; margin-bottom: 8px;'>Reminder programare</h1>
                    <p style='font-size: 14px; color: #6b7280; margin-bottom: 24px; line-height: 1.6;'>
                        Bună, {firstName}! Ai o programare mâine:
                    </p>
                    <div style='background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;'>
                        <p style='font-size: 14px; color: #111827; font-weight: 500; margin-bottom: 4px;'>{doctorName}</p>
                        <p style='font-size: 13px; color: #6b7280; margin-bottom: 4px;'>{serviceName}</p>
                        <p style='font-size: 13px; color: #6b7280;'>{date} · {time}</p>
                    </div>
                    <p style='font-size: 12px; color: #9ca3af;'>
                        Te rugăm să te prezinți cu 10 minute înainte.
                    </p>
                </div>";

            await SendEmailAsync(to, "Reminder programare — Policlinica", html);
        }

        public async Task SendWaitingListNotificationAsync(string to, string firstName, string doctorName, string serviceName, string date, string time)
        {
            var html = $@"
                <div style='font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;'>
                    <div style='display: flex; align-items: center; gap: 8px; margin-bottom: 32px;'>
                        <div style='width: 8px; height: 8px; border-radius: 50%; background: #378ADD;'></div>
                        <span style='font-size: 16px; font-weight: 500; color: #111827;'>Policlinica</span>
                    </div>
                    <h1 style='font-size: 22px; font-weight: 500; color: #111827; margin-bottom: 8px;'>Slot disponibil!</h1>
                    <p style='font-size: 14px; color: #6b7280; margin-bottom: 24px; line-height: 1.6;'>
                        Bună, {firstName}! S-a eliberat un slot la {doctorName} pentru {serviceName} pe {date} la ora {time}.
                        Intră în aplicație pentru a te programa.
                    </p>
                    <p style='font-size: 12px; color: #9ca3af; margin-top: 24px;'>
                        Dacă nu te programezi în 30 de minute, slotul va fi oferit următorului pacient din lista de așteptare.
                    </p>
                </div>";

            await SendEmailAsync(to, "Slot disponibil — Policlinica", html);
        }
        public async Task SendAppointmentConfirmationAsync(string to, string firstName, string doctorName, string serviceName, string date, string time, string locationName)
        {
            var html = $@"
                <div style='font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;'>
                    <div style='display: flex; align-items: center; gap: 8px; margin-bottom: 32px;'>
                        <div style='width: 8px; height: 8px; border-radius: 50%; background: #378ADD;'></div>
                        <span style='font-size: 16px; font-weight: 500; color: #111827;'>Policlinica</span>
                    </div>
                    <h1 style='font-size: 22px; font-weight: 500; color: #111827; margin-bottom: 8px;'>Programare confirmată</h1>
                    <p style='font-size: 14px; color: #6b7280; margin-bottom: 24px; line-height: 1.6;'>
                        Bună, {firstName}! Programarea ta a fost confirmată cu succes.
                    </p>
                    <div style='background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;'>
                        <p style='font-size: 14px; color: #111827; font-weight: 500; margin-bottom: 8px;'>{doctorName}</p>
                        <p style='font-size: 13px; color: #6b7280; margin-bottom: 4px;'>{serviceName}</p>
                        <p style='font-size: 13px; color: #6b7280; margin-bottom: 4px;'>{locationName}</p>
                        <p style='font-size: 13px; color: #6b7280;'>{date} · {time}</p>
                    </div>
                    <p style='font-size: 12px; color: #9ca3af;'>
                        Te rugăm să te prezinți cu 10 minute înainte de ora programată.
                    </p>
                </div>";

            await SendEmailAsync(to, "Programare confirmată — Policlinica", html);
        }
        public async Task SendAppointmentCancellationAsync(string to, string firstName, string doctorName, string serviceName, string date, string time, string reason)
        {
            var html = $@"
                <div style='font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;'>
                    <div style='display: flex; align-items: center; gap: 8px; margin-bottom: 32px;'>
                        <div style='width: 8px; height: 8px; border-radius: 50%; background: #378ADD;'></div>
                        <span style='font-size: 16px; font-weight: 500; color: #111827;'>Policlinica</span>
                    </div>
                    <h1 style='font-size: 22px; font-weight: 500; color: #111827; margin-bottom: 8px;'>Programare anulată</h1>
                    <p style='font-size: 14px; color: #6b7280; margin-bottom: 24px; line-height: 1.6;'>
                        Bună, {firstName}! Din păcate, programarea ta a fost anulată.
                    </p>
                    <div style='background: #fef2f2; border-radius: 12px; padding: 20px; margin-bottom: 24px;'>
                        <p style='font-size: 14px; color: #111827; font-weight: 500; margin-bottom: 8px;'>{doctorName}</p>
                        <p style='font-size: 13px; color: #6b7280; margin-bottom: 4px;'>{serviceName}</p>
                        <p style='font-size: 13px; color: #6b7280; margin-bottom: 12px;'>{date} · {time}</p>
                        <p style='font-size: 13px; color: #dc2626;'><strong>Motiv:</strong> {reason}</p>
                    </div>
                    <p style='font-size: 12px; color: #9ca3af;'>
                        Poți face o nouă programare oricând pe platforma noastră.
                    </p>
                </div>";

            await SendEmailAsync(to, "Programare anulată — Policlinica", html);
        }
        public async Task SendWalkInMigrationEmailAsync(string to, string firstName, string verifyUrl)
        {
            var html = $@"
                <div style='font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;'>
                    <div style='display: flex; align-items: center; gap: 8px; margin-bottom: 32px;'>
                        <div style='width: 8px; height: 8px; border-radius: 50%; background: #378ADD;'></div>
                        <span style='font-size: 16px; font-weight: 500; color: #111827;'>Policlinica</span>
                    </div>
                    <h1 style='font-size: 22px; font-weight: 500; color: #111827; margin-bottom: 8px;'>Confirmare cont</h1>
                    <p style='font-size: 14px; color: #6b7280; margin-bottom: 24px; line-height: 1.6;'>
                        Bună, {firstName}! Un cont a fost creat pentru tine pe platforma Policlinica. 
                        Apasă pe butonul de mai jos pentru a-ți confirma adresa de email și a primi parola contului.
                    </p>
                    <a href='{verifyUrl}' style='display: inline-block; background: #378ADD; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;'>
                        Confirmă email-ul
                    </a>
                    <p style='font-size: 12px; color: #9ca3af; margin-top: 24px;'>
                        Link-ul expiră în 24 de ore. Dacă nu ai solicitat acest cont, ignoră acest email.
                    </p>
                </div>";

            await SendEmailAsync(to, "Confirmare cont — Policlinica", html);
        }

        public async Task SendWalkInPasswordEmailAsync(string to, string firstName, string password)
        {
            var html = $@"
                <div style='font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;'>
                    <div style='display: flex; align-items: center; gap: 8px; margin-bottom: 32px;'>
                        <div style='width: 8px; height: 8px; border-radius: 50%; background: #378ADD;'></div>
                        <span style='font-size: 16px; font-weight: 500; color: #111827;'>Policlinica</span>
                    </div>
                    <h1 style='font-size: 22px; font-weight: 500; color: #111827; margin-bottom: 8px;'>Contul tău a fost activat!</h1>
                    <p style='font-size: 14px; color: #6b7280; margin-bottom: 24px; line-height: 1.6;'>
                        Bună, {firstName}! Email-ul tău a fost confirmat. Iată datele de autentificare:
                    </p>
                    <div style='background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;'>
                        <p style='font-size: 13px; color: #6b7280; margin-bottom: 4px;'>Email: <strong>{to}</strong></p>
                        <p style='font-size: 13px; color: #6b7280;'>Parolă temporară: <strong>{password}</strong></p>
                    </div>
                    <p style='font-size: 12px; color: #9ca3af;'>
                        Te rugăm să îți schimbi parola după prima autentificare.
                    </p>
                </div>";

            await SendEmailAsync(to, "Contul tău Policlinica — date de autentificare", html);
        }
        public async Task SendPasswordResetEmailAsync(string to, string firstName, string resetUrl)
        {
            var html = $@"
                <div style='font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;'>
                    <div style='display: flex; align-items: center; gap: 8px; margin-bottom: 32px;'>
                        <div style='width: 8px; height: 8px; border-radius: 50%; background: #378ADD;'></div>
                        <span style='font-size: 16px; font-weight: 500; color: #111827;'>Policlinica</span>
                    </div>
                    <h1 style='font-size: 22px; font-weight: 500; color: #111827; margin-bottom: 8px;'>Resetare parolă</h1>
                    <p style='font-size: 14px; color: #6b7280; margin-bottom: 24px; line-height: 1.6;'>
                        Bună, {firstName}! Ai solicitat resetarea parolei. Apasă pe butonul de mai jos pentru a seta o parolă nouă.
                    </p>
                    <a href='{resetUrl}' style='display: inline-block; background: #378ADD; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;'>
                        Resetează parola
                    </a>
                    <p style='font-size: 12px; color: #9ca3af; margin-top: 24px;'>
                        Link-ul expiră în 1 oră. Dacă nu ai solicitat resetarea parolei, ignoră acest email.
                    </p>
                </div>";

            await SendEmailAsync(to, "Resetare parolă — Policlinica", html);
        }
    }
}
