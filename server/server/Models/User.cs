namespace Server.Models

public enum UserRole { ADMIN, VOTER}

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Identification { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public UserRole Role { get; set; } = UserRole.VOTER;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
}
