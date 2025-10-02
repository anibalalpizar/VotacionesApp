namespace Server.Models.DTOs;

public class LoginRequest
{
    public string UserOrEmail { get; set; } = "";
    public string Password { get; set; } = "";
}
