using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;

public sealed class SmtpMailSender : IMailSender
{
    private readonly SmtpOptions _opt;

    public SmtpMailSender(IOptions<SmtpOptions> opt) => _opt = opt.Value;

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        try
        {
            // Parsear el From correctamente
            var (fromEmail, fromName) = ParseEmailAddress(_opt.From);

            using var msg = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            msg.To.Add(to);

            using var smtp = new SmtpClient(_opt.Host, _opt.Port)
            {
                EnableSsl = _opt.EnableSsl,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(_opt.User, _opt.Password),
                DeliveryMethod = SmtpDeliveryMethod.Network,
                Timeout = 30000
            };

            Console.WriteLine($"[SMTP] Enviando correo a {to} desde {fromEmail}");

            // Usar SendMailAsync que es verdaderamente asincrónico
            await smtp.SendMailAsync(msg, ct);

            Console.WriteLine($"[SMTP] Correo enviado exitosamente a {to}");
        }
        catch (OperationCanceledException ex)
        {
            Console.WriteLine($"[SMTP ERROR] Operación cancelada: {ex.Message}");
            throw;
        }
        catch (SmtpException ex)
        {
            Console.WriteLine($"[SMTP ERROR] Error SMTP: {ex.StatusCode} - {ex.Message}");
            throw;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SMTP ERROR] Error general: {ex.GetType().Name} - {ex.Message}");
            Console.WriteLine($"[SMTP ERROR] Stack trace: {ex.StackTrace}");
            throw;
        }
    }

    /// <summary>
    /// Parsea una dirección de email en formato "Nombre <email@example.com>" o solo "email@example.com"
    /// </summary>
    private static (string Email, string Name) ParseEmailAddress(string from)
    {
        if (string.IsNullOrWhiteSpace(from))
            throw new ArgumentException("La dirección From no puede estar vacía", nameof(from));

        // Formato: "Nombre <email@example.com>"
        if (from.Contains('<') && from.Contains('>'))
        {
            var startIdx = from.IndexOf('<') + 1;
            var endIdx = from.IndexOf('>');
            var email = from.Substring(startIdx, endIdx - startIdx).Trim();
            var name = from.Substring(0, from.IndexOf('<')).Trim();
            return (email, name);
        }

        // Formato: "email@example.com"
        return (from.Trim(), from.Trim());
    }
}