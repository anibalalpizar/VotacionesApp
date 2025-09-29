namespace Server.Models.DTOs;

public class LoginResponse
{
    public string Token { get; set; } = "";
    public int ExpiresIn { get; set; }      
    public UserDto User { get; set; } = new();
}
