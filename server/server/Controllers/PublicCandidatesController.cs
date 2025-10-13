using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/public/candidates")]
    // Requiere autenticación de VOTER o ADMIN:
    [Authorize(Roles = "VOTER,ADMIN")]
    // Si es público sin login, usar:
    // [AllowAnonymous]
    public class PublicCandidatesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public PublicCandidatesController(AppDbContext db)
        {
            _db = db;
        }

        /// Devuelve TODAS las elecciones ACTIVAS (calculadas por tiempo real) y, para cada una,
        /// la lista de candidatos (Nombre, Partido).
        /// Activa = StartDate <= nowUtc <= EndDate  
        [HttpGet("active")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetActiveElectionsWithCandidates(CancellationToken ct)
        {
            var nowUtc = DateTime.UtcNow;

            // 1) Encontrar TODAS las elecciones activas por rango temporal 
            var activeElections = await _db.Elections
                .AsNoTracking()
                .Where(e => e.StartDate != null && e.EndDate != null
                         && e.StartDate <= nowUtc && nowUtc <= e.EndDate)
                .OrderBy(e => e.StartDate)
                .Select(e => new { e.ElectionId, e.Name })
                .ToListAsync(ct);

            if (activeElections.Count == 0)
                return NotFound(new { message = "No hay elecciones activas en este momento." });

            var activeIds = activeElections.Select(e => e.ElectionId).ToList();

            // 2) Traer candidatos de todas esas elecciones de una sola vez
            var candidates = await _db.Candidates
                .AsNoTracking()
                .Where(c => activeIds.Contains(c.ElectionId))
                .OrderBy(c => c.Name)
                .Select(c => new
                {
                    c.CandidateId,
                    c.Name,
                    c.Party,
                    c.ElectionId
                })
                .ToListAsync(ct);

            // 3) Respuesta agrupada por elección
            var result = activeElections.Select(e => new
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
