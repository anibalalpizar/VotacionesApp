namespace Server.Models.DTOs;

public class UserDto
{
    public int UserId { get; set; }                  
    public string Identification { get; set; } = "";
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Role { get; set; } = "";
    public bool IsFirstTime { get; set; } //Primera vez ingresando a la aplicación
}
