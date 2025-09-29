namespace Server.Models;

public enum UserRole { ADMIN, VOTER }

public class User
{
    public int UserId { get; set; }                // int, identity en la BD
    public string Identification { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public UserRole Role { get; set; } = UserRole.VOTER;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
