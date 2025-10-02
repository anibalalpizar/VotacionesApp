namespace Server.Models;

public class AuditLog
{
    public Guid AuditId { get; set; } = Guid.NewGuid();     
    public int UserId { get; set; }                         // FK -> Users 
    public string Action { get; set; } = null!;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? Details { get; set; }

    public User? User { get; set; }
}
