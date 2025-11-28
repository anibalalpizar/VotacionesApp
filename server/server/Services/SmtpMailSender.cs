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

            Console.WriteLine($"[SMTP DEBUG] === INICIANDO ENVÍO DE CORREO ===");
            Console.WriteLine($"[SMTP DEBUG] Host: {_opt.Host}");
            Console.WriteLine($"[SMTP DEBUG] Port: {_opt.Port}");
            Console.WriteLine($"[SMTP DEBUG] User: {_opt.User}");
            Console.WriteLine($"[SMTP DEBUG] EnableSSL: {_opt.EnableSsl}");
            Console.WriteLine($"[SMTP DEBUG] Para: {to}");
            Console.WriteLine($"[SMTP DEBUG] Desde: {fromEmail}");

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

            Console.WriteLine($"[SMTP DEBUG] Intentando conectar a {_opt.Host}:{_opt.Port}...");

            // Usar SendMailAsync que es verdaderamente asincrónico
            await smtp.SendMailAsync(msg, ct);

            Console.WriteLine($"[SMTP ✅] Correo enviado exitosamente a {to}");
        }
        catch (OperationCanceledException ex)
        {
            Console.WriteLine($"[SMTP ❌] Operación cancelada: {ex.Message}");
            throw;
        }
        catch (SmtpException ex) when (ex is SmtpFailedRecipientsException failedRecipientsEx)
        {
            Console.WriteLine($"[SMTP ❌] Error SMTP específico:");
            Console.WriteLine($"  - StatusCode: {ex.StatusCode}");
            Console.WriteLine($"[SMTP ❌] Message: {ex.Message}");

            if (ex.InnerException != null)
            {
                Console.WriteLine($"[SMTP ❌] Inner Exception Type: {ex.InnerException.GetType().Name}");
                Console.WriteLine($"[SMTP ❌] Inner Exception Message: {ex.InnerException.Message}");
            }

            throw;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SMTP ❌] Error inesperado:");
            Console.WriteLine($"  - Tipo: {ex.GetType().Name}");
            Console.WriteLine($"  - Mensaje: {ex.Message}");
            Console.WriteLine($"  - Stack trace: {ex.StackTrace}");

            if (ex.InnerException != null)
            {
                Console.WriteLine($"[SMTP ❌] Inner Exception Type: {ex.InnerException.GetType().Name}");
                Console.WriteLine($"[SMTP ❌] Inner Exception Message: {ex.InnerException.Message}");
            }

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