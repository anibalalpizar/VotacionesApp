namespace Server.DTOs;

public class UpdateUserDto
{
    public string Identification { get; set; } = "";
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    // Para permitir cambiar rol:
    public string? Role { get; set; } 
}
