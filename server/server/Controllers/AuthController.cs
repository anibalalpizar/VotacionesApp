//HU1 - Login

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AppDbContext db, IJwtTokenService jwt) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.UserOrEmail) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { error = "UserOrEmail y Password son obligatorios." });

        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email == req.UserOrEmail || u.Identification == req.UserOrEmail, ct);

        if (user is null) return Unauthorized(new { error = "Credenciales inválidas." });
        if (!user.IsActive) return Forbid();

        var ok = BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash);
        if (!ok) return Unauthorized(new { error = "Credenciales inválidas." });

        user.LastLoginAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        var (token, exp) = jwt.Create(user);
        return Ok(new LoginResponse(token, user.Role.ToString(), exp));
    }
}
