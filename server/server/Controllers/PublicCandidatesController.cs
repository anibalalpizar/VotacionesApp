using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;

namespace Server.Controllers;

[ApiController]
[Route("api/public/candidates")]
[Authorize(Roles = "VOTER")] // Solo votantes ven elecciones disponibles para votar
public class PublicCandidatesController : ControllerBase
{
    private readonly AppDbContext _db;

    public PublicCandidatesController(AppDbContext db)
    {
        _db = db;
    }

    // Intenta obtener el UserId desde distintos claims comunes
    private int? GetUserId()
    {
        var keys = new[]
        {
            ClaimTypes.NameIdentifier,
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
            "sub","uid","userId","userid","id"
        };

        foreach (var k in keys)
        {
            var raw = User.FindFirst(k)?.Value;
            if (!string.IsNullOrWhiteSpace(raw) && int.TryParse(raw, out var id))
                return id;
        }
        return null;
    }

    /// Devuelve SOLO elecciones activas por fechas en las que el usuario NO ha votado,
    /// junto con sus candidatos.
    [HttpGet("active")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetActiveElectionsWithCandidates(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null)
            return Unauthorized(new { message = "No se pudo identificar el usuario." });

        var now = DateTimeOffset.UtcNow;

        // 1) Elecciones activas por rango de fechas
        // 2) Excluir elecciones donde el usuario ya emitió un voto
        var elections = await _db.Elections
            .AsNoTracking()
            .Where(e =>
                e.StartDate != null && e.EndDate != null &&
                e.StartDate!.Value <= now && now <= e.EndDate!.Value)
            .Where(e => !_db.Votes.Any(v => v.ElectionId == e.ElectionId && v.VoterId == userId))
            .OrderBy(e => e.StartDate)
            .Select(e => new { e.ElectionId, e.Name })
            .ToListAsync(ct);

        if (elections.Count == 0)
            return NotFound(new { message = "No hay elecciones activas disponibles para votar." });

        var electionIds = elections.Select(e => e.ElectionId).ToList();

        var candidates = await _db.Candidates
            .AsNoTracking()
            .Where(c => electionIds.Contains(c.ElectionId))
            .OrderBy(c => c.Name)
            .Select(c => new { c.CandidateId, c.Name, c.Party, c.ElectionId })
            .ToListAsync(ct);

        var result = elections.Select(e => new
        {
            electionId = e.ElectionId,
            electionName = e.Name,
            candidates = candidates
                .Where(c => c.ElectionId == e.ElectionId)
                .Select(c => new CandidateListItemDto
                {
                    CandidateId = c.CandidateId,
                    Name = c.Name,
                    Party = c.Party
                })
                .ToList()
        });

        return Ok(result);
    }
}
