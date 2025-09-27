//HU2 - Registro de votantes

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
    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<ActionResult<VoterResponse>> Create([FromBody] CreateVoterRequest req, CancellationToken ct)
    {
        var dup = await db.Users.AnyAsync(u => u.Identification == req.Identification, ct);
        if (dup) return Conflict(new { error = "Votante ya existe (identification duplicada)." });

        var user = new User
        {
            Identification = req.Identification,
            Email = req.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = UserRole.VOTER
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = user.Id },
            new VoterResponse(user.Id, user.Identification, user.Email));
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<VoterResponse>> GetById(Guid id, CancellationToken ct)
    {
        var u = await db.Users.FindAsync([id], ct);
        if (u is null) return NotFound();
        return new VoterResponse(u.Id, u.Identification, u.Email);
    }
}
