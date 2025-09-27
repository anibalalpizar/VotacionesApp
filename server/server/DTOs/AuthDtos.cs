namespace Server.DTOs;
public record LoginRequest(string UserOrEmail, string Password);
public record LoginResponse(string Token, string Role, int ExpiresIn);
