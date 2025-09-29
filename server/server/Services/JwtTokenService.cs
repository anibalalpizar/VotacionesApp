using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Server.Models;

namespace Server.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _cfg;
    private readonly int _expiresMinutes;

    public JwtTokenService(IConfiguration cfg)
    {
        _cfg = cfg;
        _expiresMinutes = int.Parse(_cfg["Jwt:ExpiresMinutes"] ?? "60");
    }

    public int ExpiresInSeconds => _expiresMinutes * 60;

    public string CreateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_cfg["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Name, user.FullName ?? string.Empty),
            new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var jwt = new JwtSecurityToken(
            issuer: _cfg["Jwt:Issuer"],
            audience: _cfg["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_expiresMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(jwt);
    }
}

public interface IJwtTokenService
{
    string CreateToken(User user);
    int ExpiresInSeconds { get; }
}
