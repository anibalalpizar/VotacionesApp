using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.DTOs;
using Server.Data;
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
    private readonly IMailSender _email;

    public AuthController(AppDbContext db, IJwtTokenService jwt, IMailSender email)
    {
        _db = db;
        _jwt = jwt;
        _email = email;
    }

    private bool IsValidPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password)) return false;
        if (password.Length < 8) return false; // mínimo 8 caracteres
        if (!password.Any(char.IsUpper)) return false; // al menos una mayúscula
        if (!password.Any(char.IsLower)) return false; // al menos una minúscula
        if (!password.Any(char.IsDigit)) return false; // al menos un número
        if (!password.Any(ch => !char.IsLetterOrDigit(ch))) return false; // al menos un caracter especial

        return true;
    }


    // Login
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        // Busca el usuario por Email o Identificación
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == req.UserOrEmail || u.Identification == req.UserOrEmail);

        if (user is null)
            return Unauthorized(new { error = "Credenciales inválidas." });

        bool valid = false;
        bool isFirstTime = false;

        // 1) Si tiene PasswordHash, valida contra él
        if (!string.IsNullOrEmpty(user.PasswordHash))
        {
            valid = BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash);
            isFirstTime = false;
        }
        // 2) Si no tiene PasswordHash, pero tiene TemporalPassword → valida contra esa
        else if (!string.IsNullOrEmpty(user.TemporalPassword))
        {
            valid = BCrypt.Net.BCrypt.Verify(req.Password, user.TemporalPassword);
            isFirstTime = valid; // sólo true si pasó usando la temporal
        }

        if (!valid)
            return Unauthorized(new { error = "Credenciales inválidas." });

        // Genera el token
        var token = _jwt.CreateToken(user);

        // Arma la respuesta
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

    //CAMBIO DE CONTRASEÑA (primera vez)
    [HttpPost("change-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req, CancellationToken ct)
    {
        // Validar que la nueva contraseña cumpla requisitos mínimos
        if (!IsValidPassword(req.NewPassword))
        {
            return BadRequest(new { error = "La nueva contraseña no cumple con los requisitos mínimos de seguridad. La contraseña debe de tener AL MENOS una letra mayúscula, una letra minúscula, un número y un caracter especial. Por ejemplo: Ejemplo123!" });
        }

        // 1) Buscar usuario
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == req.UserId, ct);
        if (user is null)
            return NotFound(new { error = "Usuario no encontrado." });

        // 2) Validar que tenga una contraseña temporal vigente
        if (string.IsNullOrEmpty(user.TemporalPassword))
            return BadRequest(new { error = "El usuario no tiene una contraseña temporal vigente." });

        // 3) Verificar que la temporal ingresada coincida
        var temporalOk = BCrypt.Net.BCrypt.Verify(req.TemporalPassword, user.TemporalPassword);
        if (!temporalOk)
            return BadRequest(new { error = "La clave temporal no coincide con la enviada por correo." });

        // Validación mínima de seguridad
        if (string.IsNullOrWhiteSpace(req.NewPassword) || req.NewPassword.Length < 8)
            return BadRequest(new { error = "La nueva contraseña debe tener al menos 8 caracteres." });

        // 4) Guardar nueva contraseña y limpiar la temporal
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        user.TemporalPassword = null;

        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Contraseña cambiada con éxito.", isFirstTime = false });
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req, CancellationToken ct)
    {
        var email = (req.Email ?? "").Trim().ToLowerInvariant();

        // 1) Validar formato de email
        if (!new EmailAddressAttribute().IsValid(email))
            return BadRequest(new { message = "El correo ingresado no tiene un formato válido." });

        // 2) Buscar usuario por email
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        // Por seguridad, no revelamos si existe o no el correo
        if (user is null)
            return Ok(new { message = "Si el correo existe, se enviará una contraseña temporal." });

        // 3) Generar contraseña temporal
        var tempPlain = PasswordGenerator.New(10);
        var tempHash = BCrypt.Net.BCrypt.HashPassword(tempPlain);

        // 4) Transacción: solo persistimos si el correo se envía bien
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            // Forzar primer login con temporal
            user.PasswordHash = string.Empty;     // se limpia la contraseña oficial
            user.TemporalPassword = tempHash; // se guarda solo el hash de la temporal

            await _db.SaveChangesAsync(ct);

            // 5) Enviar correo con la clave temporal
            var body = $@"
            <p>Hola {user.FullName},</p>
            <p>Solicitaste recuperar tu contraseña.</p>
            <p>Tu <b>contraseña temporal</b> es: <b>{tempPlain}</b></p>
            <p>Inicia sesión con esta contraseña y cámbiala inmediatamente.</p>";

            await _email.SendAsync(user.Email, "Recuperación de contraseña", body);

            await tx.CommitAsync(ct);

            // 6) Mensaje genérico para no dar pistas
            return Ok(new { message = "Si el correo existe, se enviará una contraseña temporal." });
        }
        catch
        {
            await tx.RollbackAsync(ct);
            // También respondemos genérico
            return Ok(new { message = "Si el correo existe, se enviará una contraseña temporal." });
        }
    }


}
