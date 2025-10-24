using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.DTOs;  

namespace Server.Controllers;

[ApiController]
[Route("api/elections")]
[Authorize(Roles = nameof(UserRole.ADMIN))]
public class ResultsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ResultsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("{electionId:int}/results")]
    [ProducesResponseType(typeof(ElectionResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetResults(int electionId, CancellationToken ct)
    {
        var election = await _db.Elections
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.ElectionId == electionId, ct);

        if (election is null)
            return NotFound(new { message = "La elección no existe." });

        // Solo si la elección ya está cerrada
        var now = DateTimeOffset.UtcNow;
        var isClosed = election.EndDate.HasValue && now > election.EndDate.Value;
        if (!isClosed)
            return StatusCode(StatusCodes.Status403Forbidden,
                new { message = "Los resultados solo pueden consultarse cuando la elección esté cerrada." });

        var items = await _db.Candidates
            .AsNoTracking()
            .Where(c => c.ElectionId == electionId)
            .Select(c => new ElectionResultItemDto
            {
                CandidateId = c.CandidateId,
                Name = c.Name,
                Party = c.Party,
                Votes = _db.Votes.Count(v => v.CandidateId == c.CandidateId)
            })
            .OrderByDescending(x => x.Votes)
            .ThenBy(x => x.Name)
            .ToListAsync(ct);

        var totalVotes = items.Sum(i => i.Votes);

        var dto = new ElectionResultDto
        {
            ElectionId = election.ElectionId,
            ElectionName = election.Name,
            StartDateUtc = election.StartDate,
            EndDateUtc = election.EndDate,
            IsClosed = true,
            TotalVotes = totalVotes,
            TotalCandidates = items.Count,
            Items = items
        };

        return Ok(dto);
    }
}
