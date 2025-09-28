namespace Server.Models;

public enum UserRole { ADMIN, VOTER }

public class User
{
    // PK según tu diagrama
    public Guid UserId { get; set; } = Guid.NewGuid();

    // Claves de negocio
    public string Identification { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;

    // Seguridad
    public string PasswordHash { get; set; } = null!;
    public UserRole Role { get; set; } = UserRole.VOTER;

    // Auditoría mínima
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
