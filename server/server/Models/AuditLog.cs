namespace Server.Models;

public class AuditLog
{
    public int AuditId { get; set; }
    public int UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? Details { get; set; }

    // Navigation Property
    public User? User { get; set; }
}