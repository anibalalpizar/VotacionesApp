public interface IMailSender
{
    Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default);
}
