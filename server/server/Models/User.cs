namespace Server.Models;

public enum UserRole { ADMIN, VOTER, AUDITOR }

public class User
{
    public int UserId { get; set; }
    public string Identification { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.VOTER;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? TemporalPassword { get; set; }
}