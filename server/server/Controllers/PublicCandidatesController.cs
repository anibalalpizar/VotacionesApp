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
    // Esto por si se quiere que sea sin login
    // [AllowAnonymous]
    public class PublicCandidatesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public PublicCandidatesController(AppDbContext db)
        {
            _db = db;
        }

        /// Devuelve la lista de candidatos de la elección activa
        [HttpGet("active")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetActiveCandidates(CancellationToken ct)
        {
            var now = DateTime.UtcNow;

            // Encontrar elección activa por fechas (fuente de verdad)
            var activeElection = await _db.Elections
                .AsNoTracking()
                .Where(e => e.StartDate != null && e.EndDate != null
                         && e.StartDate <= now && now <= e.EndDate)
                .OrderBy(e => e.StartDate)
                .FirstOrDefaultAsync(ct);

            if (activeElection is null)
                return NotFound(new { message = "No hay una elección activa en este momento." });

            var items = await _db.Candidates
                .AsNoTracking()
                .Where(c => c.ElectionId == activeElection.ElectionId)
                .OrderBy(c => c.Name)
                .Select(c => new CandidateListItemDto
                {
                    CandidateId = c.CandidateId,
                    Name = c.Name,
                    Party = c.Party
                })
                .ToListAsync(ct);

            return Ok(new
            {
                electionId = activeElection.ElectionId,
                electionName = activeElection.Name,
                candidates = items
            });
        }
    }
}
