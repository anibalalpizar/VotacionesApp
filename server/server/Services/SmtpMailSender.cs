using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;

public sealed class SmtpMailSender : IMailSender
{
    private readonly SmtpOptions _opt;

    public SmtpMailSender(IOptions<SmtpOptions> opt) => _opt = opt.Value;

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        using var msg = new MailMessage
        {
            From = new MailAddress(
                _opt.From.Contains('<') ? _opt.From.Split('<', '>')[1] : _opt.From, // correo
                _opt.From.Contains('<') ? _opt.From.Split('<')[0].Trim() : _opt.From // nombre
            ),
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
            Timeout = 10000
        };

        // SmtpClient no soporta CancellationToken; usamos Task.Run para no bloquear el hilo de petición
        await Task.Run(() => smtp.Send(msg), ct);
    }
}
