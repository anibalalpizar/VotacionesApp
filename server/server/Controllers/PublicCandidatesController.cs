using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;

namespace Server.Controllers;

[ApiController]
[Route("api/public/candidates")]
[Authorize(Roles = "VOTER,ADMIN")] // o [AllowAnonymous] si quieres abierto
public class PublicCandidatesController : ControllerBase
{
    private readonly AppDbContext _db;

    public PublicCandidatesController(AppDbContext db)
    {
        _db = db;
    }

    /// Devuelve TODAS las elecciones activas por rango de fechas (sin columna Status)
    [HttpGet("active")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetActiveElectionsWithCandidates(CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;

        var elections = await _db.Elections
            .AsNoTracking()
            .Where(e =>
                e.StartDate != null && e.EndDate != null &&
                e.StartDate!.Value <= now &&
                now <= e.EndDate!.Value)
            .OrderBy(e => e.StartDate)
            .Select(e => new { e.ElectionId, e.Name })
            .ToListAsync(ct);

        if (elections.Count == 0)
            return NotFound(new { message = "No hay elecciones activas en este momento." });

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
