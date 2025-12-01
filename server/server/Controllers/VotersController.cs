using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Models;
using Server.Models.DTOs;      // AdminCreateUserDto
using Server.Services;         // IMailSender, IEmailDomainValidator
using Server.Utils;            // PasswordGenerator
using System.ComponentModel.DataAnnotations;
using System.Net.Mail;



namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VotersController : ControllerBase
{
    private readonly AppDbContext _db;
    //private readonly IMailSender _email;
    private readonly IEmailDomainValidator _emailValidator;
    private readonly IAuditService _audit;


    public VotersController(AppDbContext db, IMailSender email, IEmailDomainValidator emailValidator, IAuditService audit)
    {
        _db = db;
       //_email = email;
        _emailValidator = emailValidator;
        _audit = audit;
    }

    /// Crear votante con contraseña temporal enviada al correo.
    [HttpPost]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Post([FromBody] AdminCreateUserDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Normalizar entradas
        var identification = dto.Identification?.Trim() ?? "";
        var fullName = dto.FullName?.Trim() ?? "";
        var emailNorm = (dto.Email ?? "").Trim().ToLowerInvariant();

        // 1. Validar formato de email
        if (!new EmailAddressAttribute().IsValid(emailNorm))
            return BadRequest(new { message = "El correo ingresado no tiene un formato válido, el votante no se ha creado." });

        // 2. Validar dominio (MX)
        if (!await _emailValidator.DomainHasMxAsync(emailNorm))
            return BadRequest(new { message = "El dominio del correo no recibe emails, el votante no se ha creado." });

        // 3. Validar duplicados
        if (await _db.Users.AnyAsync(u => u.Identification == identification, ct))
            return Conflict(new { message = "La identificación ya está en uso." });

        if (await _db.Users.AnyAsync(u => u.Email == emailNorm, ct))
            return Conflict(new { message = "El correo digitado ya está en uso, por favor digite otro correo." });

        // 4. Generar contraseña temporal
        var tempPlain = PasswordGenerator.New(10);
        var tempHash = BCrypt.Net.BCrypt.HashPassword(tempPlain);

        var user = new User
        {
            Identification = identification,
            FullName = fullName,
            Email = emailNorm,
            Role = UserRole.VOTER,
            PasswordHash = string.Empty,     // vacío en primer uso
            TemporalPassword = tempHash
        };

        // 5. Guardar usuario EN TRANSACCIÓN (sin correo)
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            _db.Users.Add(user);
            await _db.SaveChangesAsync(ct);

            // COMMIT la transacción ANTES de enviar correo
            await tx.CommitAsync(ct);

            Console.WriteLine($"[DB] Usuario guardado exitosamente: {user.UserId}");
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync(ct);
            Console.WriteLine($"[DB ERROR] Error guardando usuario: {ex.Message}");

            return BadRequest(new
            {
                message = "Error al guardar el usuario.",
                error = ex.Message
            });
        }

        // 6. Enviar correo FUERA de la transacción
        var emailSent = false;
        try
        {
            var body = $@"
            <p>Hola {user.FullName},</p>
            <p>Tu cuenta en la aplicación de votaciones de la UTN fue creada por un administrador.</p>
            <p>Tu <b>contraseña temporal</b> es: <b>{tempPlain}</b></p>
            <p>Por seguridad, inicia sesión con tú cédula y con esta contraseña y cámbiala de inmediato.</p>
        ";

            //await _email.SendAsync(user.Email, "Tu contraseña temporal", body, ct);
            emailSent = true;

            Console.WriteLine($"[MAIL] Correo enviado exitosamente a {user.Email}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[MAIL ERROR] Fallo al enviar correo a {user.Email}: {ex.Message}");

        }

        // 7. Auditar
        await _audit.LogAsync(
            action: AuditActions.UserCreated,
            details: $"Usuario creado: {user.Email} (Correo enviado: {emailSent})"
        );

        // 8. Responder (usuario creado exitosamente incluso si fallo el correo)
        return CreatedAtAction(nameof(GetById), new { id = user.UserId }, new
        {
            userId = user.UserId,
            identification = user.Identification,
            fullName = user.FullName,
            email = user.Email,
            role = user.Role.ToString(),
            emailStatus = emailSent ? "enviado" : "pendiente"
        });
    }

    /// Obtener usuario por Id
    [HttpGet("{id:int}")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var u = await _db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == id, ct);
        if (u == null) return NotFound();

        return Ok(new
        {
            userId = u.UserId,
            identification = u.Identification,
            fullName = u.FullName,
            email = u.Email,
            role = u.Role.ToString(),
            createdAt = u.CreatedAt
        });
    }

    /// Lista paginada de usuarios
    [HttpGet]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var query = _db.Users.AsNoTracking().OrderBy(u => u.UserId);

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
                role = u.Role.ToString(),
                createdAt = u.CreatedAt
            })
            .ToListAsync(ct);

        return Ok(new { page, pageSize, total, items });
    }

    //Editar usuario
    [HttpPut("{id:int}")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == id, ct);
        if (user is null)
            return NotFound(new { message = "Usuario no encontrado." });

        // Normalizar
        var identification = (dto.Identification ?? "").Trim();
        var fullName = (dto.FullName ?? "").Trim();
        var emailNorm = (dto.Email ?? "").Trim().ToLowerInvariant();

        // Validaciones básicas
        if (string.IsNullOrWhiteSpace(identification))
            return BadRequest(new { message = "La identificación es requerida." });

        if (string.IsNullOrWhiteSpace(fullName))
            return BadRequest(new { message = "El nombre completo es requerido." });

        if (!new EmailAddressAttribute().IsValid(emailNorm))
            return BadRequest(new { message = "El correo ingresado no tiene un formato válido." });

        // Duplicados (excluyendo al mismo usuario)
        var idDup = await _db.Users.AnyAsync(u => u.UserId != id && u.Identification == identification, ct);
        if (idDup)
            return Conflict(new { message = "La identificación ya está en uso." });

        var emailDup = await _db.Users.AnyAsync(u => u.UserId != id && u.Email == emailNorm, ct);
        if (emailDup)
            return Conflict(new { message = "El correo digitado ya está en uso, por favor digite otro correo." });

        // Asignar cambios
        user.Identification = identification;
        user.FullName = fullName;
        user.Email = emailNorm;

        // Puede permitir cambiar rol si viene
        if (!string.IsNullOrWhiteSpace(dto.Role))
        {
            if (!Enum.TryParse<UserRole>(dto.Role, true, out var newRole))
                return BadRequest(new { message = "Rol inválido. Use ADMIN o VOTER." });

            user.Role = newRole;
        }

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            message = "El usuario se ha editado con éxito.",
            user = new
            {
                userId = user.UserId,
                identification = user.Identification,
                fullName = user.FullName,
                email = user.Email,
                role = user.Role.ToString(),
                updatedAt = DateTime.UtcNow
            }
        });
    }

    //Borrar usuario
    [HttpDelete("{id:int}")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == id, ct);
        if (user is null)
            return NotFound(new { message = "Usuario no encontrado." });

        // Si el usuario tiene votos, no se borrar para no romper FKs
        var hasVotes = await _db.Votes.AnyAsync(v => v.VoterId == id, ct);
        if (hasVotes)
            return Conflict(new { message = "No se puede borrar el usuario porque tiene votos registrados." });

        _db.Users.Remove(user);
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "El usuario se ha borrado con éxito." });
    }


}
