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

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _cfg;
    public JwtTokenService(IConfiguration cfg) => _cfg = cfg;

    public (string token, int expiresIn) Create(User user)
    {
        // Lee configuración
        var secret = _cfg.GetValue<string>("Jwt:Key") ?? throw new InvalidOperationException("Falta Jwt:Key");
        var issuer = _cfg.GetValue<string>("Jwt:Issuer");
        var audience = _cfg.GetValue<string>("Jwt:Audience");
        var minutes = _cfg.GetValue<int?>("Jwt:ExpiresMinutes") ?? 60;

        // Clave y credenciales
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expires = DateTime.UtcNow.AddMinutes(minutes);

        // 👇 Claims (ahora con UserId y FullName)
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("identification", user.Identification),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName)
        };

        // Construye el JWT
        var jwt = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        // Serializa a string
        var tokenString = new JwtSecurityTokenHandler().WriteToken(jwt);

        return (tokenString, (int)(expires - DateTime.UtcNow).TotalSeconds);
    }
}
