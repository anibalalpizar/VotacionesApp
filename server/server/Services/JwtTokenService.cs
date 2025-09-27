using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Server.Models;

namespace Server.Services;

public interface IJwtTokenService
{
    (string token, int expiresIn) Create(User user);
}

public class JwtTokenService(IConfiguration cfg) : IJwtTokenService
{
    public (string token, int expiresIn) Create(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(int.Parse(cfg["Jwt:ExpiresMinutes"] ?? "60"));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("identification", user.Identification),
            new Claim(JwtRegisteredClaimNames.Email, user.Email)
        };

        var token = new JwtSecurityToken(
            issuer: cfg["Jwt:Issuer"],
            audience: cfg["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        var s = new JwtSecurityTokenHandler().WriteToken(token);
        return (s, (int)(expires - DateTime.UtcNow).TotalSeconds);
    }
}
