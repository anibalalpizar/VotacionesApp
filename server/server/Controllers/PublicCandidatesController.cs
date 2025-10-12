using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/public/candidates")]
    // Solo usuarios autenticados pueden ver la lista
    [Authorize(Roles = "VOTER,ADMIN")]
    // Si se quiere sin login:
    // [AllowAnonymous]
    public class PublicCandidatesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public PublicCandidatesController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("active")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetActiveElectionsWithCandidates(CancellationToken ct)
        {
            var now = DateTime.UtcNow;

            // 1) Elecciones activas por estado y rango de fechas
            var elections = await _db.Elections
                .AsNoTracking()
                .Where(e =>
                    e.Status == "Active" &&
                    e.StartDate != null && e.EndDate != null &&
                    e.StartDate <= now && now <= e.EndDate)
                .OrderBy(e => e.StartDate)
                .Select(e => new { e.ElectionId, e.Name })
                .ToListAsync(ct);

            if (elections.Count == 0)
                return NotFound(new { message = "No hay elecciones activas en este momento." });

            var electionIds = elections.Select(e => e.ElectionId).ToList();

            // 2) Candidatos de TODAS esas elecciones 
            var candidates = await _db.Candidates
                .AsNoTracking()
                .Where(c => electionIds.Contains(c.ElectionId))
                .OrderBy(c => c.Name)
                .Select(c => new
                {
                    c.CandidateId,
                    c.Name,
                    c.Party,
                    c.ElectionId
                })
                .ToListAsync(ct);

            // 3) Arma respuesta agrupada por elección
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
}
