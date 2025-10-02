using DnsClient;

namespace Server.Services;

public interface IEmailDomainValidator
{
    Task<bool> DomainHasMxAsync(string email);
}

public class EmailDomainValidator : IEmailDomainValidator
{
    private readonly LookupClient _dns = new();

    public async Task<bool> DomainHasMxAsync(string email)
    {
        var at = email.IndexOf('@');
        if (at <= 0 || at == email.Length - 1) return false;

        var domain = email[(at + 1)..];
        var result = await _dns.QueryAsync(domain, QueryType.MX);
        return result.Answers.MxRecords().Any();
    }
}
