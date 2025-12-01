using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.DTOs;
using Server.Data;
using Server.Models;
using Server.Models.DTOs;
using Server.Services;
using Server.Utils;
using System.ComponentModel.DataAnnotations;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IJwtTokenService _jwt;
    //private readonly IMailSender _email;
    private readonly IAuditService _audit;

    public AuthController(
        AppDbContext db,
        IJwtTokenService jwt,
        IMailSender email,
        IAuditService audit)
    {
        _db = db;
        _jwt = jwt;
       // _email = email;
        _audit = audit;
    }

    private bool IsValidPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password)) return false;
        if (password.Length < 8) return false;                       // mínimo 8 caracteres
        if (!password.Any(char.IsUpper)) return false;               // al menos una mayúscula
        if (!password.Any(char.IsLower)) return false;               // al menos una minúscula
        if (!password.Any(char.IsDigit)) return false;               // al menos un número
        if (!password.Any(ch => !char.IsLetterOrDigit(ch))) return false; // al menos un caracter especial

        return true;
    }

    // POST: /api/auth/login
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == req.UserOrEmail || u.Identification == req.UserOrEmail);

        if (user is null)
        {
            // Login fallido aunque no exista el usuario
            await _audit.LogAsync(
                AuditActions.LoginFailed,
                $"Login fallido. Usuario/correo no encontrado: {req.UserOrEmail}"
            );

            return Unauthorized(new { error = "Credenciales inválidas." });
        }

        bool valid = false;
        bool isFirstTime = false;

        if (!string.IsNullOrEmpty(user.PasswordHash))
        {
            valid = BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash);
            isFirstTime = false;
        }
        else if (!string.IsNullOrEmpty(user.TemporalPassword))
        {
            valid = BCrypt.Net.BCrypt.Verify(req.Password, user.TemporalPassword);
            isFirstTime = valid;
        }

        if (!valid)
        {
            // Login fallido con usuario encontrado pero contraseña incorrecta
            await _audit.LogAsync(
                userId: user.UserId,
                action: AuditActions.LoginFailed,
                details: "Credenciales incorrectas"
            );

            return Unauthorized(new { error = "Credenciales inválidas." });
        }

        // Login exitoso
        await _audit.LogAsync(
            userId: user.UserId,
            action: AuditActions.LoginSuccess,
            details: isFirstTime ? "Primera vez (contraseña temporal)" : null
        );

        var token = _jwt.CreateToken(user);

        var resp = new LoginResponse
        {
            Token = token,
            ExpiresIn = _jwt.ExpiresInSeconds,
            User = new UserDto
            {
                UserId = user.UserId,
                Identification = user.Identification,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.ToString(),
                IsFirstTime = isFirstTime
            }
        };

        return Ok(resp);
    }

    // POST: /api/auth/change-password
    [HttpPost("change-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req, CancellationToken ct)
    {
        if (!IsValidPassword(req.NewPassword))
        {
            return BadRequest(new
            {
                error = "La nueva contraseña no cumple con los requisitos mínimos de seguridad. " +
                        "La contraseña debe de tener AL MENOS una letra mayúscula, una letra minúscula, " +
                        "un número y un caracter especial. Por ejemplo: Ejemplo123!"
            });
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == req.UserId, ct);
        if (user is null)
            return NotFound(new { error = "Usuario no encontrado." });

        if (string.IsNullOrEmpty(user.TemporalPassword))
            return BadRequest(new { error = "El usuario no tiene una contraseña temporal vigente." });

        var temporalOk = BCrypt.Net.BCrypt.Verify(req.TemporalPassword, user.TemporalPassword);
        if (!temporalOk)
            return BadRequest(new { error = "La clave temporal no coincide con la enviada por correo." });

        if (string.IsNullOrWhiteSpace(req.NewPassword) || req.NewPassword.Length < 8)
            return BadRequest(new { error = "La nueva contraseña debe tener al menos 8 caracteres." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        user.TemporalPassword = null;

        await _db.SaveChangesAsync(ct);

        // Registrar cambio de contraseña
        await _audit.LogAsync(
            userId: user.UserId,
            action: AuditActions.PasswordChanged,
            details: "Cambio de temporal a permanente"
        );

        return Ok(new { message = "Contraseña cambiada con éxito.", isFirstTime = false });
    }

    // POST: /api/auth/forgot-password
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req, CancellationToken ct)
    {
        var email = (req.Email ?? "").Trim().ToLowerInvariant();

        if (!new EmailAddressAttribute().IsValid(email))
            return BadRequest(new { message = "El correo ingresado no tiene un formato válido." });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        // Siempre respondemos lo mismo para no revelar si existe o no
        if (user is null)
            return Ok(new { message = "Si el correo existe, se enviará una contraseña temporal." });

        var tempPlain = PasswordGenerator.New(10);
        var tempHash = BCrypt.Net.BCrypt.HashPassword(tempPlain);

        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            user.PasswordHash = string.Empty;
            user.TemporalPassword = tempHash;

            await _db.SaveChangesAsync(ct);

            var body = $@"
            <p>Hola {user.FullName},</p>
            <p>Solicitaste recuperar tu contraseña.</p>
            <p>Tu <b>contraseña temporal</b> es: <b>{tempPlain}</b></p>
            <p>Inicia sesión con tu número de cédula y esta contraseña y cámbiala inmediatamente.</p>";

            //await _email.SendAsync(user.Email, "Recuperación de contraseña", body);

            await tx.CommitAsync(ct);

            // Registrar recuperación de contraseña
            await _audit.LogAsync(
                userId: user.UserId,
                action: AuditActions.PasswordRecovery,
                details: "Contraseña temporal generada"
            );

            // pasa la contrase tgmporeal el el return YA
            return Ok(new
            {
                message = $"Tu contraseña temporal es: {tempPlain}",
            });
        }
        catch
        {
            await tx.RollbackAsync(ct);
            // No revelamos detalle, pero tampoco bitacorizamos porque no sabemos si llegó a guardarse algo
            return Ok(new { message = "Si el correo existe, se enviará una contraseña temporal." });
        }
    }

    /// <summary>
    /// GET: /api/users
    /// Obtiene la lista completa de usuarios con paginación
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAll(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 50,
    [FromQuery] string? role = null,
    CancellationToken ct = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 200 ? 50 : pageSize;

        var query = _db.Users
            .AsNoTracking()
            .OrderByDescending(u => u.CreatedAt)
            .AsQueryable();

        // Filtrar por rol si se proporciona
        if (!string.IsNullOrWhiteSpace(role))
        {
            if (Enum.TryParse<UserRole>(role, true, out var parsedRole))
            {
                query = query.Where(u => u.Role == parsedRole);
            }
            else
            {
                return BadRequest($"El rol '{role}' no es válido. Roles válidos: ADMIN, VOTER, AUDITOR.");
            }
        }

        var total = await query.CountAsync(ct);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                userId = u.UserId,
                identification = u.Identification,
                fullName = u.FullName,
                email = u.Email,
                role = u.Role,
                createdAt = u.CreatedAt
            })
            .ToListAsync(ct);

        return Ok(new { page, pageSize, total, items });
    }


    /// <summary>
    /// GET: /api/users/simple
    /// Obtiene una lista simple de usuarios sin paginación (para selects/combos)
    /// </summary>
    [HttpGet("simple")]
    public async Task<IActionResult> GetSimpleList(
    [FromQuery] string? role = null,
    CancellationToken ct = default)
    {
        var query = _db.Users
            .AsNoTracking()
            .OrderBy(u => u.FullName)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(role))
        {
            if (Enum.TryParse<UserRole>(role, true, out var parsedRole))
            {
                query = query.Where(u => u.Role == parsedRole);
            }
            else
            {
                return BadRequest($"El rol '{role}' no es válido. Roles válidos: ADMIN, VOTER, AUDITOR.");
            }
        }

        var items = await query
            .Select(u => new
            {
                userId = u.UserId,
                fullName = u.FullName,
                email = u.Email,
                role = u.Role
            })
            .ToListAsync(ct);

        return Ok(items);
    }


    /// <summary>
    /// GET: /api/users/{userId}
    /// Obtiene los detalles de un usuario específico
    /// </summary>
    [HttpGet("{userId:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int userId, CancellationToken ct)
    {
        var user = await _db.Users
            .AsNoTracking()
            .Where(u => u.UserId == userId)
            .Select(u => new
            {
                userId = u.UserId,
                identification = u.Identification,
                fullName = u.FullName,
                email = u.Email,
                role = u.Role,
                createdAt = u.CreatedAt
            })
            .FirstOrDefaultAsync(ct);

        if (user is null)
            return NotFound(new { error = "Usuario no encontrado." });

        return Ok(user);
    }
}
