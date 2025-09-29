using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Models;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VotersController(AppDbContext db) : ControllerBase
{
    // POST: /api/voters
    // Solo ADMIN puede registrar votantes
    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<ActionResult<VoterResponse>> Create(
        [FromBody] CreateVoterRequest req,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Identification) ||
            string.IsNullOrWhiteSpace(req.FullName) ||
            string.IsNullOrWhiteSpace(req.Email) ||
            string.IsNullOrWhiteSpace(req.Password))
        {
            return BadRequest(new { error = "Todos los campos son obligatorios." });
        }

        // Duplicado por identificación
        bool duplicated = await db.Users.AnyAsync(u => u.Identification == req.Identification, ct);
        if (duplicated)
            return Conflict(new { error = "Votante ya existe (identification duplicada)." });

        //Duplicado por correo
        bool duplicatedEmail = await db.Users.AnyAsync(u => u.Email == req.Email, ct);
        if (duplicatedEmail)
            return Conflict(new { error = "El correo digitado ya está en uso, por favor digite otro correo." });

        var user = new User
        {
            Identification = req.Identification.Trim(),
            FullName = req.FullName.Trim(),
            Email = req.Email.Trim().ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = UserRole.VOTER
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        var res = new VoterResponse(
            user.UserId,
            user.Identification,
            user.FullName,
            user.Email,
            user.Role.ToString());

        // Devuelve 201 Created con la URL del recurso
        return CreatedAtAction(nameof(GetById), new { id = user.UserId }, res);
    }

    // GET: /api/voters/{id}
    // Útil para el CreatedAtAction y para validar que se creó
    [Authorize(Policy = "AdminOnly")]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<VoterResponse>> GetById(int id, CancellationToken ct)
    {
        var u = await db.Users.FirstOrDefaultAsync(x => x.UserId == id, ct);
        if (u is null) return NotFound();

        return new VoterResponse(
            u.UserId,
            u.Identification,
            u.FullName,
            u.Email,
            u.Role.ToString());
    }
}
